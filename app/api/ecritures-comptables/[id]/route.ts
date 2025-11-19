import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT - Modifier une écriture comptable
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const { libelle, debit, credit, planId } = await request.json();

    // Vérifier que l'écriture appartient au comptable
    const existingEcriture = await prisma.ecritureComptable.findFirst({
      where: {
        id: params.id,
        OR: [
          {
            facture: {
              client: {
                comptableId: comptable.id
              }
            }
          },
          {
            factureVente: {
              client: {
                comptableId: comptable.id
              }
            }
          },
          {
            journalBanque: {
              client: {
                comptableId: comptable.id
              }
            }
          }
        ]
      }
    });

    if (!existingEcriture) {
      return NextResponse.json({ error: 'Écriture non trouvée' }, { status: 404 });
    }

    // Préparer les données de mise à jour
    let updateData: any = {
      debit: parseFloat(debit) || 0,
      credit: parseFloat(credit) || 0,
    };

    // Ajouter le libellé si fourni
    if (libelle) {
      updateData.libelle = libelle;
    }

    // Vérifier que le plan comptable appartient au comptable et mettre à jour les champs liés
    if (planId) {
      const planComptable = await prisma.planComptable.findFirst({
        where: {
          id: planId,
          comptableId: comptable.id
        }
      });

      if (!planComptable) {
        return NextResponse.json({ error: 'Plan comptable non trouvé' }, { status: 404 });
      }

      updateData.planId = planId;
      updateData.num_compte = planComptable.num_compte;
      updateData.libelle = planComptable.libelle; // Utiliser le libellé du plan comptable
    }

    const updatedEcriture = await prisma.ecritureComptable.update({
      where: { id: params.id },
      data: updateData,
      include: {
        facture: {
          include: {
            client: {
              select: {
                nom: true,
                societe: true
              }
            }
          }
        },
        factureVente: {
          include: {
            client: {
              select: {
                nom: true,
                societe: true
              }
            }
          }
        },
        journalBanque: {
          include: {
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

    return NextResponse.json(updatedEcriture);
  } catch (error) {
    console.error('Erreur lors de la modification de l\'écriture:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une écriture comptable
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

    // Vérifier que l'écriture appartient au comptable
    const existingEcriture = await prisma.ecritureComptable.findFirst({
      where: {
        id: params.id,
        OR: [
          {
            facture: {
              client: {
                comptableId: comptable.id
              }
            }
          },
          {
            factureVente: {
              client: {
                comptableId: comptable.id
              }
            }
          },
          {
            journalBanque: {
              client: {
                comptableId: comptable.id
              }
            }
          }
        ]
      }
    });

    if (!existingEcriture) {
      return NextResponse.json({ error: 'Écriture non trouvée' }, { status: 404 });
    }

    await prisma.ecritureComptable.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'écriture:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}