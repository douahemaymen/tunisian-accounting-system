import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT - Modifier un compte
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { num_compte, libelle, type_compte } = await request.json();

    // Vérifier que le compte appartient au comptable
    const compte = await prisma.planComptable.findFirst({
      where: {
        id: params.id,
        comptableId: comptable.id
      }
    });

    if (!compte) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 });
    }

    // Vérifier si le nouveau numéro de compte existe déjà (sauf pour le compte actuel)
    if (num_compte !== compte.num_compte) {
      const existingCompte = await prisma.planComptable.findFirst({
        where: {
          comptableId: comptable.id,
          num_compte: num_compte,
          id: { not: params.id }
        }
      });

      if (existingCompte) {
        return NextResponse.json(
          { error: 'Ce numéro de compte existe déjà' },
          { status: 400 }
        );
      }
    }

    const compteModifie = await prisma.planComptable.update({
      where: { id: params.id },
      data: {
        num_compte,
        libelle,
        type_compte
      }
    });

    return NextResponse.json(compteModifie);
  } catch (error) {
    console.error('Erreur lors de la modification du compte:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un compte
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Vérifier que le compte appartient au comptable
    const compte = await prisma.planComptable.findFirst({
      where: {
        id: params.id,
        comptableId: comptable.id
      }
    });

    if (!compte) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 });
    }

    // Vérifier s'il y a des écritures comptables liées
    const ecritures = await prisma.ecritureComptable.findFirst({
      where: { planId: params.id }
    });

    if (ecritures) {
      return NextResponse.json(
        { error: 'Impossible de supprimer ce compte car il contient des écritures comptables' },
        { status: 400 }
      );
    }

    await prisma.planComptable.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}