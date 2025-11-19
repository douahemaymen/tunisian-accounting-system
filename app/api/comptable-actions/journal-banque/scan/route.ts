import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { extractJournalBanqueData } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const comptable = await prisma.comptable.findUnique({
      where: { userId: session.user.id }
    });

    if (!comptable) {
      return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientUid = formData.get('clientUid') as string;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!clientUid) {
      return NextResponse.json({ error: 'Client non sélectionné' }, { status: 400 });
    }

    // Vérifier que le client appartient au comptable
    const client = await prisma.client.findFirst({
      where: {
        uid: clientUid,
        comptableId: comptable.id
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé ou non autorisé' }, 
        { status: 404 }
      );
    }

    // Étape 1: Upload vers Cloudinary
    const uploadResult = await uploadImageToCloudinary(file);
    const imageUrl = uploadResult.secure_url || uploadResult.url;
    
    // Étape 2: Extraction des données avec Gemini
    const extractedData = await extractJournalBanqueData(file);
    
    // Étape 3: Créer le journal banque
    const journalBanqueResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/journal-banque`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify({
        clientUid,
        imageUrl,
        extractedData
      })
    });

    if (!journalBanqueResponse.ok) {
      const errorData = await journalBanqueResponse.json();
      throw new Error(errorData.error || 'Erreur lors de la création du journal banque');
    }

    const journalBanque = await journalBanqueResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Journal banque scanné avec succès',
      journalBanque,
      mouvementsCount: extractedData.mouvements?.length || 0
    });

  } catch (error: any) {
    console.error('Erreur lors du scan du journal banque:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du scan du journal banque' },
      { status: 500 }
    );
  }
}
