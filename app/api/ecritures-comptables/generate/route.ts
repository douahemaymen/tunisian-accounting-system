import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateAccountingEntries } from '@/lib/gemini';

interface EcritureData {
  planId: string;
  debit: number;
  credit: number;
}

// POST - Générer automatiquement les écritures comptables pour une facture avec Gemini
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const { factureId, imageFile } = await request.json();

    // Récupérer la facture d'achat
    let facture = await prisma.journalAchat.findFirst({
      where: {
        id: factureId,
        client: {
          comptableId: comptable.id
        }
      },
      include: {
        client: true
      }
    });

    let factureType: 'achat' | 'vente' = 'achat';

    // Si pas trouvée dans journal achat, chercher dans journal vente
    if (!facture) {
      const factureVente = await prisma.journalVente.findFirst({
        where: {
          id: factureId,
          client: {
            comptableId: comptable.id
          }
        },
        include: {
          client: true
        }
      });

      if (!factureVente) {
        return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
      }

      facture = factureVente as any;
      factureType = 'vente';
    }

    // Vérifier si des écritures existent déjà
    const existingEcritures = await prisma.ecritureComptable.findMany({
      where: factureType === 'achat' 
        ? { factureId: factureId }
        : { factureVenteId: factureId }
    });

    if (existingEcritures.length > 0) {
      return NextResponse.json({ 
        error: 'Des écritures comptables existent déjà pour cette facture' 
      }, { status: 400 });
    }

    // Récupérer TOUT le plan comptable du comptable
    const planComptable = await prisma.planComptable.findMany({
      where: {
        comptableId: comptable.id
      },
      orderBy: {
        num_compte: 'asc'
      }
    });

    if (planComptable.length === 0) {
      return NextResponse.json({
        error: 'Aucun plan comptable trouvé. Veuillez d\'abord créer votre plan comptable.'
      }, { status: 400 });
    }

    console.log(`Plan comptable trouvé: ${planComptable.length} comptes`);
    console.log('Données facture pour Gemini:', {
      id: facture.id,
      reference: facture.reference,
      type_journal: facture.type_facture,
      type_facture: facture.type_facture,
      fournisseur: facture.fournisseur,
      total_ht: facture.total_ht,
      total_tva: facture.total_tva,
      total_ttc: facture.total_ttc
    });

    // Si nous avons le fichier image, utiliser Gemini pour générer les écritures
    // Sinon, essayer de récupérer l'image depuis l'URL de la facture

    
    // Essayer d'utiliser Gemini avec l'image
    let base64Data = null;
    let mimeType = null;

    if (imageFile) {
      // Image fournie directement en base64
      try {
        base64Data = imageFile.split(',')[1];
        mimeType = imageFile.split(',')[0].split(':')[1].split(';')[0];
      } catch (error) {
        console.error('Erreur lors de l\'extraction du base64:', error);
      }
    } else if (facture.image_url) {
      // Essayer de récupérer l'image depuis l'URL et la convertir en base64
      try {
        const response = await fetch(facture.image_url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          base64Data = Buffer.from(arrayBuffer).toString('base64');
          mimeType = response.headers.get('content-type') || 'image/jpeg';
        }
      } catch (error) {
        console.error('Erreur lors du téléchargement de l\'image:', error);
      }
    }

    // Utiliser la nouvelle génération simplifiée avec Gemini
    try {
      console.log('Génération des écritures avec Gemini...');
      
      const factureData: any = {
        ...facture,
        type_journal: facture.type_facture,
        status: 'NON_COMPTABILISE'
      };
      const geminiResult = await generateAccountingEntries(factureData, planComptable);
      console.log('Résultat génération Gemini:', geminiResult);

      // Valider et créer les écritures
      const ecrituresCreated = [];
      let totalDebit = 0;
      let totalCredit = 0;

      for (const ecriture of geminiResult.ecritures) {
        // Trouver le compte dans le plan comptable
        const compte = planComptable.find(c => c.num_compte === ecriture.num_compte);
        
        if (!compte) {
          console.warn(`Compte ${ecriture.num_compte} non trouvé dans le plan comptable`);
          continue;
        }

        const ecritureCreated = await prisma.ecritureComptable.create({
          data: {
            ...(factureType === 'achat' ? { factureId: factureId } : { factureVenteId: factureId }),
            planId: compte.id,
            libelle: ecriture.libelle,
            num_compte: ecriture.num_compte,
            debit: ecriture.debit || 0,
            credit: ecriture.credit || 0,
            date: new Date(facture.date)
          },
          include: {
            planComptable: {
              select: {
                num_compte: true,
                libelle: true,
                type_compte: true
              }
            }
          }
        });

        ecrituresCreated.push(ecritureCreated);
        totalDebit += ecriture.debit || 0;
        totalCredit += ecriture.credit || 0;
      }

      // Vérifier l'équilibre comptable
      const equilibre = Math.abs(totalDebit - totalCredit) < 0.01;
      if (!equilibre) {
        console.warn(`Déséquilibre comptable: Débit=${totalDebit}, Crédit=${totalCredit}`);
      }

      // Mettre à jour le statut de la facture
      if (factureType === 'achat') {
        await prisma.journalAchat.update({
          where: { id: factureId },
          data: { status: 'COMPTABILISE' }
        });
      } else {
        await prisma.journalVente.update({
          where: { id: factureId },
          data: { status: 'COMPTABILISE' }
        });
      }

      return NextResponse.json({
        success: true,
        ecritures: ecrituresCreated,
        message: `${ecrituresCreated.length} écriture(s) générée(s) avec Gemini`,
        equilibre: { totalDebit, totalCredit, equilibre },
        methode: 'Gemini AI'
      });

    } catch (geminiError) {
      console.error('Erreur génération Gemini:', geminiError);
      // Fallback vers la méthode classique
    }

    // Méthode classique de fallback (code existant simplifié)
    const comptesBasiques = await prisma.planComptable.findMany({
      where: {
        comptableId: comptable.id,
        num_compte: {
          in: ['4110000', '4010000', '4455000', '6010000', '7010000', '7060000']
        }
      }
    });

    if (comptesBasiques.length === 0) {
      return NextResponse.json({
        error: 'Aucun compte de base trouvé dans le plan comptable pour la génération automatique.'
      }, { status: 400 });
    }

    // Logique de fallback simplifiée
    const ecritures: EcritureData[] = [];
    const comptesMap = comptesBasiques.reduce((acc, compte) => {
      acc[compte.num_compte] = compte;
      return acc;
    }, {} as Record<string, any>);

    // Génération basique selon le type
    if (facture.type_facture === 'FOURNISSEUR' && comptesMap['6010000'] && comptesMap['4010000']) {
      ecritures.push({
        planId: comptesMap['6010000'].id,
        debit: facture.total_ht,
        credit: 0
      });
      
      if (facture.total_tva > 0 && comptesMap['4455000']) {
        ecritures.push({
          planId: comptesMap['4455000'].id,
          debit: facture.total_tva,
          credit: 0
        });
      }
      
      ecritures.push({
        planId: comptesMap['4010000'].id,
        debit: 0,
        credit: facture.total_ttc
      });
    }

    if (ecritures.length === 0) {
      return NextResponse.json({
        error: 'Impossible de générer les écritures automatiquement. Veuillez les créer manuellement.'
      }, { status: 400 });
    }

    // Créer les écritures de fallback
    const ecrituresCreated = await Promise.all(
      ecritures.map(ecriture => 
        prisma.ecritureComptable.create({
          data: {
            ...(factureType === 'achat' ? { factureId: factureId } : { factureVenteId: factureId }),
            planId: ecriture.planId,
            libelle: comptesBasiques.find(c => c.id === ecriture.planId)?.libelle || 'Écriture automatique',
            num_compte: comptesBasiques.find(c => c.id === ecriture.planId)?.num_compte || '',
            debit: ecriture.debit,
            credit: ecriture.credit,
            date: new Date(facture.date)
          },
          include: {
            planComptable: {
              select: {
                num_compte: true,
                libelle: true,
                type_compte: true
              }
            }
          }
        })
      )
    );

    if (factureType === 'achat') {
      await prisma.journalAchat.update({
        where: { id: factureId },
        data: { status: 'COMPTABILISE' }
      });
    } else {
      await prisma.journalVente.update({
        where: { id: factureId },
        data: { status: 'COMPTABILISE' }
      });
    }

    return NextResponse.json({
      success: true,
      ecritures: ecrituresCreated,
      message: `${ecrituresCreated.length} écriture(s) comptable(s) générée(s) (méthode classique)`
    });

  } catch (error) {
    console.error('Erreur lors de la génération des écritures:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération des écritures' },
      { status: 500 }
    );
  }
}
