// app/api/journal-vente/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await req.json();
    const { ecrituresComptables, ...updateData } = data;

    const parseToFloat = (value: any) => parseFloat(value) || 0;

    // Transaction pour mettre à jour le journal et les écritures
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le journal de vente
      const journal = await tx.journalVente.update({
        where: { id },
        data: {
          clientdefacture: updateData.clientdefacture || updateData.fournisseur,
          date: updateData.date,
          reference: updateData.reference,
          total_ht: parseToFloat(updateData.total_ht),
          total_ttc: parseToFloat(updateData.total_ttc),
          total_tva: parseToFloat(updateData.total_tva),
          tva_7: parseToFloat(updateData.tva_7),
          tva_13: parseToFloat(updateData.tva_13),
          tva_19: parseToFloat(updateData.tva_19),
          remise: parseToFloat(updateData.remise),
          timbre_fiscal: parseToFloat(updateData.timbre_fiscal),
          type_facture: updateData.type_facture,
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

      // 2. Si des écritures sont fournies, les mettre à jour
      if (ecrituresComptables && ecrituresComptables.length > 0) {
        // Supprimer les anciennes écritures
        await tx.ecritureComptable.deleteMany({
          where: { factureVenteId: id }
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
                  factureVenteId: id,
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

          // Mettre à jour le statut et les métadonnées
          const totalDebit = ecrituresComptables.reduce((sum: number, e: any) => sum + (parseFloat(String(e.debit)) || 0), 0);
          const totalCredit = ecrituresComptables.reduce((sum: number, e: any) => sum + (parseFloat(String(e.credit)) || 0), 0);

          await tx.journalVente.update({
            where: { id },
            data: {
              status: 'COMPTABILISE',
              accounting_entries: {
                updated_at: new Date().toISOString(),
                entries_count: ecrituresComptables.length,
                total_debit: totalDebit,
                total_credit: totalCredit
              }
            }
          });
        }
      }

      return journal;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur PUT journal vente:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
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
      // Supprimer les écritures liées
      await tx.ecritureComptable.deleteMany({
        where: { factureVenteId: id }
      });

      // Supprimer le journal
      await tx.journalVente.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: 'Journal de vente supprimé' });
  } catch (error: any) {
    console.error('Erreur DELETE journal vente:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
