import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateEcrituresComptables } from '@/lib/ecriture-comptable-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { factureId, factureData, options } = await request.json();

    if (!factureData) {
      return NextResponse.json(
        { error: 'Données de facture requises' },
        { status: 400 }
      );
    }

    console.log('🚀 Génération rapide écritures pour:', factureData.fournisseur);

    // Récupérer le plan comptable du comptable
    let planComptable: any[] = [];
    
    if (session.user.role === 'comptable') {
      const comptable = await prisma.comptable.findUnique({
        where: { userId: session.user.id },
        include: { planComptable: true }
      });

      if (comptable) {
        planComptable = comptable.planComptable;
      }
    } else if (session.user.role === 'admin' && factureId) {
      // Pour les admins, récupérer via la facture
      const facture = await prisma.journalAchat.findUnique({
        where: { id: factureId },
        include: {
          client: {
            include: {
              comptable: {
                include: { planComptable: true }
              }
            }
          }
        }
      });

      if (facture?.client?.comptable) {
        planComptable = facture.client.comptable.planComptable;
      }
    }

    // Générer les écritures avec le moteur optimisé
    const startTime = Date.now();
    
    const result = await generateEcrituresComptables(factureData, planComptable, {
      useGemini: options?.useGemini !== false, // Par défaut true
      maxRetries: options?.maxRetries || 2,
      timeout: options?.timeout || 5000
    });

    const generationTime = Date.now() - startTime;

    console.log(`✅ Écritures générées en ${generationTime}ms avec ${result.methode_generation}`);

    // Sauvegarder les écritures si factureId fourni
    if (factureId && result.ecritures.length > 0) {
      try {
        // Supprimer les anciennes écritures
        await prisma.ecritureComptable.deleteMany({
          where: { factureId }
        });

        // Créer les nouvelles écritures
        const ecrituresData = result.ecritures.map((ecriture: any) => {
          // Trouver l'ID du plan comptable
          const planCompte = planComptable.find(p => p.num_compte === ecriture.compte);
          
          if (!planCompte) {
            throw new Error(`Compte ${ecriture.compte} non trouvé dans le plan comptable`);
          }

          return {
            factureId,
            planId: planCompte.id,
            debit: ecriture.debit,
            credit: ecriture.credit,
            libelle: ecriture.libelle,
            num_compte: ecriture.compte
          };
        });

        await prisma.ecritureComptable.createMany({
          data: ecrituresData
        });

        console.log(`💾 ${ecrituresData.length} écritures sauvegardées`);
      } catch (saveError) {
        console.error('❌ Erreur sauvegarde:', saveError);
        // Ne pas faire échouer la génération si la sauvegarde échoue
      }
    }

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        generationTime,
        method: result.methode_generation,
        planComptableSize: planComptable.length,
        saved: !!factureId
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur génération rapide:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération des écritures',
        details: error.message,
        code: 'GENERATION_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET pour tester le moteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const testMode = searchParams.get('test');

    if (testMode === 'engine') {
      // Test du moteur avec données fictives
      const factureTest = {
        fournisseur: "INFORMATIQUE SERVICES SARL",
        type_journal: "J_ACH",
        total_ht: 1000,
        total_tva: 190,
        total_ttc: 1190,
        reference: "TEST-001",
        date: "2024-01-15"
      };

      const startTime = Date.now();
      const result = await generateEcrituresComptables(factureTest);
      const generationTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        test: 'engine',
        factureTest,
        result,
        generationTime,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      message: 'API de génération rapide d\'écritures comptables',
      endpoints: {
        POST: 'Générer écritures pour une facture',
        'GET?test=engine': 'Tester le moteur avec données fictives'
      },
      features: [
        'Génération avec Gemini AI (priorité)',
        'Fallback vers règles statiques',
        'Timeout et retry automatiques',
        'Sauvegarde automatique des écritures',
        'Métriques de performance'
      ]
    });

  } catch (error: any) {
    console.error('❌ Erreur test:', error);
    return NextResponse.json(
      { error: 'Erreur lors du test', details: error.message },
      { status: 500 }
    );
  }
}