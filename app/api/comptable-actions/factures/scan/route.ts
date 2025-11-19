import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { extractInvoiceAndGenerateEntries } from '@/lib/gemini';

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
    
    // Étape 2: Récupération du plan comptable
    const planComptable = await prisma.planComptable.findMany({
      where: { comptableId: comptable.id }
    });
    
    // Étape 3: Extraction + génération écritures avec Gemini (un seul appel)
    const typeJournal = formData.get('typeJournal') as string || 'J_ACH';
    const result = await extractInvoiceAndGenerateEntries(file, planComptable, typeJournal);
    
    // Formatage des données extraites
    const extractedData = {
      fournisseur: result.facture.fournisseur || 'Fournisseur non détecté',
      date: result.facture.date || new Date().toISOString().slice(0, 10),
      reference: result.facture.reference || `REF-${Date.now()}`,
      total_ht: result.facture.total_ht || 0,
      tva_7: result.facture.tva_7 || 0,
      tva_13: result.facture.tva_13 || 0,
      tva_19: result.facture.tva_19 || 0,
      total_tva: result.facture.total_tva || 0,
      total_ttc: result.facture.total_ttc || 0,
      remise: result.facture.remise || 0,
      timbre_fiscal: result.facture.timbre_fiscal || 0,
      type_journal: typeJournal,
      type_facture: result.facture.type_facture === 'avoir' ? 'AVOIR' : 'FOURNISSEUR'
    };

    // Étape 4: Créer la facture avec les écritures
    const factureResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/comptable-actions/factures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify({
        clientUid,
        imageUrl,
        extractedData,
        ecrituresComptables: result.ecritures // Inclure les écritures générées
      })
    });

    if (!factureResponse.ok) {
      const errorData = await factureResponse.json();
      throw new Error(errorData.error || 'Erreur lors de la création de la facture');
    }

    const facture = await factureResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Facture scannée et comptabilisée avec succès',
      facture,
      ecritures: result.ecritures,
      ecrituresCount: result.ecritures.length
    });

  } catch (error: any) {
    console.error('Erreur lors du scan de la facture:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du scan de la facture' },
      { status: 500 }
    );
  }
}