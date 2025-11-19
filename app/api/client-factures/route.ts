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

// POST - Créer une facture avec écritures pour un client
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un client
    if (session.user.role !== 'client') {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    const { 
      clientUid, 
      imageUrl, 
      extractedData,
      ecrituresComptables,
      journalType // 'achat', 'vente', ou 'banque'
    } = await request.json();

    if (!clientUid || !imageUrl || !extractedData) {
      return NextResponse.json(
        { error: 'Données manquantes: clientUid, imageUrl, ou extractedData.' }, 
        { status: 400 }
      );
    }

    // Vérifier que le client correspond à l'utilisateur connecté
    const client = await prisma.client.findUnique({
      where: { uid: clientUid },
      include: { comptable: true }
    });

    if (!client || client.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Client non autorisé' }, 
        { status: 403 }
      );
    }

    const extracted = extractedData;
    const parseToFloat = (value: any) => parseFloat(value) || 0;

    // Transaction pour créer la facture ET les écritures
    const result = await prisma.$transaction(async (tx) => {
      let facture: any;

      // 1. Créer la facture selon le type
      if (journalType === 'banque') {
        facture = await tx.journalBanque.create({
          data: {
            clientUid,
            date: extracted.date ?? new Date().toISOString().slice(0, 10),
            numero_compte: extracted.numero_compte ?? 'N/A',
            titulaire: extracted.titulaire ?? 'Non spécifié',
            image_url: imageUrl,
            created_at: BigInt(Date.now()),
            status: ecrituresComptables && ecrituresComptables.length > 0 ? 'COMPTABILISE' : 'NON_COMPTABILISE',
            mouvements: extracted.mouvements ? {
              create: extracted.mouvements.map((mouvement: any) => ({
                date: mouvement.date,
                libelle: mouvement.libelle,
                debit: parseFloat(mouvement.debit) || 0,
                credit: parseFloat(mouvement.credit) || 0
              }))
            } : undefined
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
      } else if (journalType === 'vente') {
        facture = await tx.journalVente.create({
          data: {
            clientUid,
            type_facture: extracted.type_facture ?? 'VENTE_ORDINAIRE_DT',
            clientdefacture: extracted.clientdefacture ?? 'Client',
            date: extracted.date ?? new Date().toISOString().slice(0, 10),
            reference: extracted.reference ?? '',
            total_ht: parseToFloat(extracted.total_ht),
            total_ttc: parseToFloat(extracted.total_ttc),
            total_tva: parseToFloat(extracted.total_tva),
            tva_7: parseToFloat(extracted.tva_7),
            tva_13: parseToFloat(extracted.tva_13),
            tva_19: parseToFloat(extracted.tva_19),
            remise: parseToFloat(extracted.remise),
            timbre_fiscal: parseToFloat(extracted.timbre_fiscal),
            image_url: imageUrl,
            created_at: BigInt(Date.now()),
            status: ecrituresComptables && ecrituresComptables.length > 0 ? 'COMPTABILISE' : 'NON_COMPTABILISE',
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
      } else {
        // Journal d'achat par défaut
        facture = await tx.journalAchat.create({
          data: {
            clientUid,
            fournisseur: extracted.fournisseur ?? 'Inconnu',
            date: extracted.date ?? new Date().toISOString().slice(0, 10),
            reference: extracted.reference ?? '',
            total_ht: parseToFloat(extracted.total_ht),
            total_ttc: parseToFloat(extracted.total_ttc),
            total_tva: parseToFloat(extracted.total_tva),
            tva_7: parseToFloat(extracted.tva_7),
            tva_13: parseToFloat(extracted.tva_13),
            tva_19: parseToFloat(extracted.tva_19),
            remise: parseToFloat(extracted.remise),
            timbre_fiscal: parseToFloat(extracted.timbre_fiscal),
            type_facture: extracted.type_facture || 'FACTURE_ORDINAIRE_DT',
            image_url: imageUrl,
            created_at: BigInt(Date.now()),
            status: ecrituresComptables && ecrituresComptables.length > 0 ? 'COMPTABILISE' : 'NON_COMPTABILISE',
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
      }

      // 2. Si des écritures sont fournies, les créer
      let ecrituresCreees = [];
      if (ecrituresComptables && ecrituresComptables.length > 0 && client.comptable) {
        // Récupérer le plan comptable du comptable
        const planComptable = await prisma.planComptable.findMany({
          where: { comptableId: client.comptable.id }
        });

        console.log('💾 Sauvegarde des écritures pour client:', {
          factureId: facture.id,
          ecrituresCount: ecrituresComptables.length,
          journalType
        });

        // Créer les écritures comptables
        for (const ecriture of ecrituresComptables) {
          const numCompte = ecriture.num_compte || ecriture.compte;
          const compteExiste = planComptable.find(c => c.num_compte === numCompte);
          
          if (compteExiste) {
            const ecritureCreee = await tx.ecritureComptable.create({
              data: {
                factureId: facture.id,
                planId: compteExiste.id,
                libelle: ecriture.libelle || compteExiste.libelle,
                num_compte: compteExiste.num_compte,
                debit: parseToFloat(ecriture.debit),
                credit: parseToFloat(ecriture.credit)
              },
              include: {
                planComptable: true
              }
            });
            ecrituresCreees.push(ecritureCreee);
          } else {
            console.warn(`Compte comptable non trouvé: ${numCompte}`);
          }
        }

        // Mettre à jour la facture avec les informations d'écritures
        if (ecrituresCreees.length > 0) {
          const totalDebit = ecrituresCreees.reduce((sum, e) => sum + e.debit, 0);
          const totalCredit = ecrituresCreees.reduce((sum, e) => sum + e.credit, 0);

          const accountingEntriesData = {
            generated_at: new Date().toISOString(),
            type: 'AI_GENERATED_CLIENT',
            entries_count: ecrituresCreees.length,
            generated_by: 'gemini-ai-client',
            total_debit: totalDebit,
            total_credit: totalCredit
          };

          // Mettre à jour uniquement pour achat et vente (pas banque)
          if (journalType === 'vente') {
            await tx.journalVente.update({
              where: { id: facture.id },
              data: {
                accounting_entries: accountingEntriesData
              }
            });
          } else if (journalType === 'achat') {
            await tx.journalAchat.update({
              where: { id: facture.id },
              data: {
                accounting_entries: accountingEntriesData
              }
            });
          }
          // Pour banque, on ne met pas à jour accounting_entries car le champ n'existe pas

          console.log('✅ Facture client créée avec écritures:', {
            factureId: facture.id,
            ecrituresCount: ecrituresCreees.length,
            totalDebit,
            totalCredit
          });
        }
      }

      return {
        facture,
        ecritures: ecrituresCreees,
        ecrituresGenerated: ecrituresCreees.length > 0,
        message: ecrituresCreees.length > 0 
          ? `Facture créée avec ${ecrituresCreees.length} écriture(s) comptable(s)`
          : 'Facture créée sans écritures comptables'
      };
    });

    return JsonResponse({
      ...result.facture,
      ecrituresGenerated: result.ecrituresGenerated,
      ecrituresCount: result.ecritures.length,
      message: result.message
    }, 201);
  } catch (error: any) {
    console.error('Erreur POST facture client:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne lors de la création de la facture' }, 
      { status: 500 }
    );
  }
}
