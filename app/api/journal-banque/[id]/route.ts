// app/api/journal-banque/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await req.json();
    const { mouvements, ecrituresComptables, ...updateData } = data;

    // Transaction pour mettre à jour le journal et ses relations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le journal banque
      const journal = await tx.journalBanque.update({
        where: { id },
        data: {
          date: updateData.date,
          numero_compte: updateData.numero_compte,
          titulaire: updateData.titulaire,
          status: updateData.status
        },
        include: {
          client: {
            select: {
              uid: true,
              nom: true,
              societe: true,
              email: true
            }
          }
        }
      });

      // 2. Mettre à jour les mouvements
      if (mouvements) {
        // Supprimer les anciens mouvements
        await tx.mouvementJournal.deleteMany({
          where: { journalBanqueId: id }
        });

        // Créer les nouveaux mouvements
        for (const mouvement of mouvements) {
          await tx.mouvementJournal.create({
            data: {
              journalBanqueId: id,
              date: mouvement.date,
              libelle: mouvement.libelle,
              debit: parseFloat(String(mouvement.debit)) || 0,
              credit: parseFloat(String(mouvement.credit)) || 0
            }
          });
        }
      }

      // 3. Mettre à jour les écritures comptables
      if (ecrituresComptables && ecrituresComptables.length > 0) {
        // Supprimer les anciennes écritures
        await tx.ecritureComptable.deleteMany({
          where: { journalBanqueId: id }
        });

        // Récupérer le plan comptable
        const client = await tx.client.findUnique({
          where: { uid: journal.clientUid },
          include: {
            comptable: {
              include: { planComptable: true }
            }
          }
        });

        if (client?.comptable?.planComptable) {
          const planComptable = client.comptable.planComptable;

          // Créer les nouvelles écritures
          for (const ecriture of ecrituresComptables) {
            const numCompte = ecriture.num_compte || ecriture.compte;
            const compteExiste = planComptable.find(c => c.num_compte === numCompte);
            
            if (compteExiste) {
              await tx.ecritureComptable.create({
                data: {
                  journalBanqueId: id,
                  planId: compteExiste.id,
                  libelle: ecriture.libelle || compteExiste.libelle,
                  num_compte: compteExiste.num_compte,
                  debit: parseFloat(String(ecriture.debit)) || 0,
                  credit: parseFloat(String(ecriture.credit)) || 0,
                  date: new Date(updateData.date)
                }
              });
            }
          }

          // Mettre à jour le statut (JournalBanque n'a pas de champ accounting_entries)
          await tx.journalBanque.update({
            where: { id },
            data: {
              status: 'COMPTABILISE'
            }
          });
        }
      }

      // Recharger le journal avec toutes les relations
      return await tx.journalBanque.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              uid: true,
              nom: true,
              societe: true,
              email: true
            }
          },
          mouvements: true,
          ecritures: {
            include: {
              planComptable: true
            }
          }
        }
      });
    });

    return JsonResponse(result);
  } catch (error: any) {
    console.error('Erreur PUT journal banque:', error);
    return JsonResponse(
      { error: error.message || 'Erreur lors de la mise à jour' },
      500
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.$transaction(async (tx) => {
      // Supprimer les mouvements
      await tx.mouvementJournal.deleteMany({
        where: { journalBanqueId: id }
      });

      // Supprimer les écritures
      await tx.ecritureComptable.deleteMany({
        where: { journalBanqueId: id }
      });

      // Supprimer le journal
      await tx.journalBanque.delete({
        where: { id }
      });
    });

    return JsonResponse({ success: true, message: 'Journal banque supprimé' });
  } catch (error: any) {
    console.error('Erreur DELETE journal banque:', error);
    return JsonResponse(
      { error: error.message || 'Erreur lors de la suppression' },
      500
    );
  }
}
