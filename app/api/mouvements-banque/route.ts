import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Utilitaire pour gérer BigInt dans JSON
function bigIntReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

function JsonResponse(data: any, status: number = 200) {
  const serializedBody = JSON.stringify(data, bigIntReplacer);
  
  return new NextResponse(serializedBody, {
    status: status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// POST - Créer un mouvement bancaire
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

    const data = await request.json();
    const { journalBanqueId, date, libelle, debit, credit } = data;

    if (!journalBanqueId || !date || !libelle) {
      return NextResponse.json(
        { error: 'journalBanqueId, date et libelle sont obligatoires' },
        { status: 400 }
      );
    }

    // Vérifier que le journal banque appartient à un client du comptable
    const journalBanque = await prisma.journalBanque.findFirst({
      where: {
        id: journalBanqueId,
        client: {
          comptableId: comptable.id
        }
      }
    });

    if (!journalBanque) {
      return NextResponse.json(
        { error: 'Journal banque non trouvé ou non autorisé' },
        { status: 404 }
      );
    }

    // Créer le mouvement
    const mouvement = await prisma.mouvementJournal.create({
      data: {
        journalBanqueId,
        date: date,
        libelle,
        debit: parseFloat(debit) || 0,
        credit: parseFloat(credit) || 0,
      }
    });

    return JsonResponse(mouvement, 201);
  } catch (error: any) {
    console.error('Erreur POST mouvement bancaire:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du mouvement' },
      { status: 500 }
    );
  }
}

// GET - Récupérer les mouvements d'un journal
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const journalBanqueId = searchParams.get('journalBanqueId');

    if (!journalBanqueId) {
      return NextResponse.json(
        { error: 'journalBanqueId est obligatoire' },
        { status: 400 }
      );
    }

    // Vérifier que le journal banque appartient à un client du comptable
    const journalBanque = await prisma.journalBanque.findFirst({
      where: {
        id: journalBanqueId,
        client: {
          comptableId: comptable.id
        }
      }
    });

    if (!journalBanque) {
      return NextResponse.json(
        { error: 'Journal banque non trouvé ou non autorisé' },
        { status: 404 }
      );
    }

    // Récupérer les mouvements
    const mouvements = await prisma.mouvementJournal.findMany({
      where: { journalBanqueId },
      orderBy: { date: 'asc' }
    });

    return JsonResponse(mouvements);
  } catch (error: any) {
    console.error('Erreur GET mouvements bancaires:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des mouvements' },
      { status: 500 }
    );
  }
}
