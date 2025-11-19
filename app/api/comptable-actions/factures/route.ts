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

// GET - Récupérer toutes les factures des clients du comptable
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

    // Récupérer toutes les factures des clients du comptable
    const factures = await prisma.journalAchat.findMany({
      where: {
        client: {
          comptableId: comptable.id
        }
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
      },
      orderBy: { created_at: 'desc' }
    });

    return JsonResponse(factures);
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une facture pour un client spécifique
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

    const { 
      clientUid, 
      imageUrl, 
      extractedData,
      ecrituresComptables // Écritures générées dans le modal
    } = await request.json();

    if (!clientUid || !imageUrl || !extractedData) {
      return NextResponse.json(
        { error: 'Données manquantes: clientUid, imageUrl, ou extractedData.' }, 
        { status: 400 }
      );
    }

    // Vérifier que le client appartient au comptable
    const client = await prisma.client.findFirst({
      where: {
        uid: clientUid,
        comptableId: comptable.id
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé ou non autorisé' }, 
        { status: 404 }
      );
    }

    const extracted = extractedData;
    const parseToFloat = (value: any) => parseFloat(value) || 0;

    // Transaction pour créer la facture ET les écritures si fournies
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer la facture
      const facture = await tx.journalAchat.create({
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

      // 2. Si des écritures sont fournies, les créer
      let ecrituresCreees = [];
      if (ecrituresComptables && ecrituresComptables.length > 0) {
        // Récupérer le plan comptable pour valider les comptes
        const planComptable = await prisma.planComptable.findMany({
          where: { comptableId: comptable.id }
        });

        console.log('💾 Sauvegarde des écritures générées pour:', {
          factureId: facture.id,
          ecrituresCount: ecrituresComptables.length
        });

        // Créer les écritures comptables
        for (const ecriture of ecrituresComptables) {
          // Chercher le compte par num_compte ou utiliser le compte fourni
          const numCompte = ecriture.num_compte || ecriture.compte;
          const compteExiste = planComptable.find(c => c.num_compte === numCompte);
          
          if (compteExiste) {
            const ecritureCreee = await tx.ecritureComptable.create({
              data: {
                factureId: facture.id,
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
          } else {
            console.warn(`Compte comptable non trouvé: ${numCompte}`);
          }
        }

        // Mettre à jour la facture avec les informations d'écritures
        if (ecrituresCreees.length > 0) {
          const totalDebit = ecrituresCreees.reduce((sum, e) => sum + e.debit, 0);
          const totalCredit = ecrituresCreees.reduce((sum, e) => sum + e.credit, 0);

          await tx.journalAchat.update({
            where: { id: facture.id },
            data: {
              accounting_entries: {
                generated_at: new Date().toISOString(),
                type: 'MANUAL_VALIDATED', // Généré manuellement puis validé
                entries_count: ecrituresCreees.length,
                generated_by: 'gemini-ai-manual-preview',
                total_debit: totalDebit,
                total_credit: totalCredit
              }
            }
          });

          console.log('✅ Facture créée avec écritures manuelles:', {
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
    console.error('Erreur POST facture:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne lors de la création de la facture' }, 
      { status: 500 }
    );
  }
}