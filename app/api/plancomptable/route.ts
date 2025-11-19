import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const comptableId = searchParams.get('comptableId');

    let whereClause: any = {};

    if (session.user.role === 'comptable') {
      // Un comptable ne peut voir que son propre plan comptable
      const comptable = await prisma.comptable.findUnique({
        where: { userId: session.user.id }
      });

      if (!comptable) {
        return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
      }

      whereClause.comptableId = comptable.id;
    } else if (session.user.role === 'admin') {
      // Un admin peut spécifier un comptableId ou voir tous les plans
      if (comptableId) {
        whereClause.comptableId = comptableId;
      }
    } else if (session.user.role === 'client') {
      // Un client peut voir le plan comptable de son comptable
      const client = await prisma.client.findUnique({
        where: { uid: session.user.id },
        include: { comptable: true }
      });

      if (!client || !client.comptable) {
        return NextResponse.json({ error: 'Client ou comptable non trouvé' }, { status: 404 });
      }

      whereClause.comptableId = client.comptable.id;
    } else {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const planComptable = await prisma.planComptable.findMany({
      where: whereClause,
      orderBy: { num_compte: 'asc' },
      include: {
        comptable: {
          select: {
            nom: true,
            societe: true
          }
        }
      }
    });

    return NextResponse.json(planComptable);

  } catch (error) {
    console.error('Erreur récupération plan comptable:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { num_compte, libelle, type_compte } = await request.json();

    if (!num_compte || !libelle) {
      return NextResponse.json(
        { error: 'Numéro de compte et libellé requis' },
        { status: 400 }
      );
    }

    let comptableId: string;

    if (session.user.role === 'comptable') {
      const comptable = await prisma.comptable.findUnique({
        where: { userId: session.user.id }
      });

      if (!comptable) {
        return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
      }

      comptableId = comptable.id;
    } else {
      return NextResponse.json({ error: 'Seuls les comptables peuvent créer des comptes' }, { status: 403 });
    }

    // Vérifier si le compte existe déjà
    const existingCompte = await prisma.planComptable.findFirst({
      where: {
        comptableId,
        num_compte
      }
    });

    if (existingCompte) {
      return NextResponse.json(
        { error: 'Ce numéro de compte existe déjà' },
        { status: 400 }
      );
    }

    const nouveauCompte = await prisma.planComptable.create({
      data: {
        comptableId,
        num_compte,
        libelle,
        type_compte: type_compte || null
      }
    });

    return NextResponse.json(nouveauCompte, { status: 201 });

  } catch (error) {
    console.error('Erreur création compte:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}