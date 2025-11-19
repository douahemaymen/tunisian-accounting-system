import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Récupérer tous les clients du comptable
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le comptable associé à l'utilisateur
    const comptable = await prisma.comptable.findUnique({
      where: { userId: session.user.id }
    });

    if (!comptable) {
      return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
    }

    // Récupérer tous les clients du comptable
    const clients = await prisma.client.findMany({
      where: { comptableId: comptable.id },
      select: {
        uid: true,
        nom: true,
        societe: true,
        email: true,
        statut: true,
        date_inscription: true
      },
      orderBy: { nom: 'asc' }
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}