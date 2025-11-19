import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseDate } from '@/lib/date-utils';

// POST - Créer une nouvelle écriture comptable
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

    const { factureId, planId, debit, credit, date } = await request.json();

    // Vérifier que la facture appartient au comptable
    const facture = await prisma.journalAchat.findFirst({
      where: {
        id: factureId,
        client: {
          comptableId: comptable.id
        }
      }
    });

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    // Vérifier que le plan comptable appartient au comptable
    const planComptable = await prisma.planComptable.findFirst({
      where: {
        id: planId,
        comptableId: comptable.id
      }
    });

    if (!planComptable) {
      return NextResponse.json({ error: 'Plan comptable non trouvé' }, { status: 404 });
    }

    // Créer l'écriture
    const nouvelleEcriture = await prisma.ecritureComptable.create({
      data: {
        factureId,
        planId,
        debit: parseFloat(debit) || 0,
        credit: parseFloat(credit) || 0,
        date: parseDate(date),
        libelle: planComptable.libelle,
        num_compte: planComptable.num_compte
      },
      include: {
        facture: {
          select: {
            id: true,
            reference: true,
            type_facture: true,
            fournisseur: true,
            total_ttc: true,
            client: {
              select: {
                nom: true,
                societe: true
              }
            }
          }
        },
        planComptable: {
          select: {
            num_compte: true,
            libelle: true,
            type_compte: true
          }
        }
      }
    });

    return NextResponse.json(nouvelleEcriture, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'écriture:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}