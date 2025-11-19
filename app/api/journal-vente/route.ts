// app/api/journal-vente/route.ts
import { NextRequest } from 'next/server';
import { journalService } from '@/lib/services/journal.service';
import { journalValidator } from '@/lib/validators/journal.validator';
import { jsonResponse, errorResponse, successResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { clientUid, imageUrl, extractedData, ecrituresComptables } = data;
    
    const validation = journalValidator.validateCreateJournal(data);
    if (!validation.isValid) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    // Si des écritures comptables sont fournies, créer le journal avec écritures
    if (ecrituresComptables && ecrituresComptables.length > 0) {
      const { prisma } = await import('@/lib/prisma');
      const parseToFloat = (value: any) => parseFloat(value) || 0;
      
      const result = await prisma.$transaction(async (tx) => {
        // 1. Créer le journal de vente
        const journal = await tx.journalVente.create({
          data: {
            clientUid,
            clientdefacture: extractedData.clientdefacture || extractedData.fournisseur || 'Client',
            date: extractedData.date ?? new Date().toISOString().slice(0, 10),
            reference: extractedData.reference ?? '',
            total_ht: parseToFloat(extractedData.total_ht),
            total_ttc: parseToFloat(extractedData.total_ttc),
            total_tva: parseToFloat(extractedData.total_tva),
            tva_7: parseToFloat(extractedData.tva_7),
            tva_13: parseToFloat(extractedData.tva_13),
            tva_19: parseToFloat(extractedData.tva_19),
            remise: parseToFloat(extractedData.remise),
            timbre_fiscal: parseToFloat(extractedData.timbre_fiscal),
            type_facture: extractedData.type_facture || 'VENTE_ORDINAIRE_DT',
            image_url: imageUrl,
            created_at: BigInt(Date.now()),
            status: 'COMPTABILISE'
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

        // 2. Créer les écritures comptables
        const client = await tx.client.findUnique({
          where: { uid: clientUid },
          include: {
            comptable: {
              include: { planComptable: true }
            }
          }
        });

        let ecrituresCreees = [];
        if (client?.comptable?.planComptable) {
          const planComptable = client.comptable.planComptable;

          for (const ecriture of ecrituresComptables) {
            const numCompte = ecriture.num_compte || ecriture.compte;
            const compteExiste = planComptable.find(c => c.num_compte === numCompte);
            
            if (compteExiste) {
              const ecritureCreee = await tx.ecritureComptable.create({
                data: {
                  factureVenteId: journal.id,
                  planId: compteExiste.id,
                  libelle: ecriture.libelle || compteExiste.libelle,
                  num_compte: compteExiste.num_compte,
                  debit: ecriture.debit,
                  credit: ecriture.credit
                },
                include: {
                  planComptable: true
                }
              });
              ecrituresCreees.push(ecritureCreee);
            }
          }

          // Mettre à jour le journal avec les informations d'écritures
          if (ecrituresCreees.length > 0) {
            const totalDebit = ecrituresCreees.reduce((sum, e) => sum + e.debit, 0);
            const totalCredit = ecrituresCreees.reduce((sum, e) => sum + e.credit, 0);

            await tx.journalVente.update({
              where: { id: journal.id },
              data: {
                accounting_entries: {
                  generated_at: new Date().toISOString(),
                  type: 'MANUAL_VALIDATED',
                  entries_count: ecrituresCreees.length,
                  generated_by: 'gemini-ai-manual-preview',
                  total_debit: totalDebit,
                  total_credit: totalCredit
                }
              }
            });
          }
        }

        return { journal, ecritures: ecrituresCreees };
      });

      return jsonResponse({
        ...result.journal,
        ecrituresGenerated: true,
        ecrituresCount: result.ecritures.length
      }, 201);
    }

    // Sinon, créer le journal sans écritures (comportement par défaut)
    const journal = await journalService.createJournalVente(data);
    return jsonResponse(journal, 201);
  } catch (error: any) {
    console.error('Erreur POST journal vente:', error);
    return errorResponse(error.message || 'Erreur lors de la création du journal de vente', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      clientUid: searchParams.get('clientUid')!,
      type_facture: searchParams.get('type_facture') || undefined,
      status: searchParams.get('status') || undefined
    };

    console.log('📥 GET /api/journal-vente - Filters:', filters);

    const validation = journalValidator.validateFilters(filters);
    if (!validation.isValid) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const journaux = await journalService.getJournals('vente', filters);
    console.log('✅ Journaux de vente récupérés:', journaux.length);
    
    // Ajouter le type_journal si manquant
    const journauxWithType = journaux.map(j => ({
      ...j,
      type_journal: j.type_journal || 'J_VTE'
    }));
    
    return jsonResponse(journauxWithType);
  } catch (error: any) {
    console.error('Erreur GET journaux vente:', error);
    return errorResponse('Échec de la récupération des journaux de vente', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    const validation = journalValidator.validateUpdateJournal(data);
    if (!validation.isValid) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const { id, ...fields } = data;
    const updated = await journalService.updateJournal('vente', id, fields);
    return jsonResponse(updated);
  } catch (error: any) {
    console.error('Erreur PUT journal vente:', error);
    return errorResponse(error.message || 'Échec de la mise à jour', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return errorResponse('ID manquant pour la suppression', 400);
    }

    await journalService.deleteJournal('vente', id);
    return successResponse({}, `Journal de vente ${id} supprimé avec succès`);
  } catch (error: any) {
    console.error('Erreur DELETE journal vente:', error);
    return errorResponse(error.message || 'Échec de la suppression', 500);
  }
}