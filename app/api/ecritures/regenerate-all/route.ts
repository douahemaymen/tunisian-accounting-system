import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateEcrituresComptables } from '@/lib/ecriture-comptable-engine';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Seuls les comptables peuvent régénérer leurs écritures
    if (session.user.role !== 'comptable') {
      return NextResponse.json({ error: 'Accès réservé aux comptables' }, { status: 403 });
    }

    console.log('🔄 Début de la régénération de toutes les écritures...');

    // Récupérer le comptable
    const comptable = await prisma.comptable.findUnique({
      where: { userId: session.user.id },
      include: { planComptable: true }
    });

    if (!comptable) {
      return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
    }

    // Récupérer toutes les factures du comptable avec leurs écritures actuelles
    const factures = await prisma.journalAchat.findMany({
      where: {
        client: {
          comptableId: comptable.id
        }
      },
      include: {
        ecritures: true,
        client: true
      }
    });

    console.log(`📊 ${factures.length} factures trouvées pour régénération`);

    let regeneratedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Traiter chaque facture
    for (const facture of factures) {
      try {
        console.log(`🔄 Régénération facture ${facture.reference}...`);

        // Préparer les données de la facture
        const factureData = {
          fournisseur: facture.fournisseur,
          type_journal: facture.type_facture,
          total_ht: facture.total_ht,
          total_tva: facture.total_tva,
          total_ttc: facture.total_ttc,
          reference: facture.reference,
          date: facture.date
        };

        // Générer les nouvelles écritures avec le moteur IA
        const result = await generateEcrituresComptables(
          factureData,
          comptable.planComptable,
          {
            useGemini: true,
            maxRetries: 1, // Limiter pour éviter les timeouts
            timeout: 3000
          }
        );

        if (result.ecritures.length === 0) {
          throw new Error('Aucune écriture générée');
        }

        // Supprimer les anciennes écritures
        await prisma.ecritureComptable.deleteMany({
          where: { factureId: facture.id }
        });

        // Créer les nouvelles écritures
        const ecrituresData = result.ecritures.map((ecriture: any) => {
          const planCompte = comptable.planComptable.find(p => p.num_compte === ecriture.compte);

          if (!planCompte) {
            throw new Error(`Compte ${ecriture.compte} non trouvé dans le plan comptable`);
          }

          return {
            factureId: facture.id,
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

        regeneratedCount++;
        console.log(`✅ Facture ${facture.reference} régénérée (${result.methode_generation})`);

        // Pause courte pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        errorCount++;
        const errorMsg = `Facture ${facture.reference}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`🎯 Régénération terminée: ${regeneratedCount} succès, ${errorCount} erreurs`);

    // Mettre à jour le statut des factures régénérées
    if (regeneratedCount > 0) {
      await prisma.journalAchat.updateMany({
        where: {
          client: { comptableId: comptable.id },
          ecritures: { some: {} }
        },
        data: {
          status: 'COMPTABILISE'
        }
      });
    }

    return NextResponse.json({
      success: true,
      regenerated: regeneratedCount,
      errors: errorCount,
      total: factures.length,
      errorDetails: errors.slice(0, 10), // Limiter les détails d'erreur
      message: `${regeneratedCount} factures régénérées avec succès${errorCount > 0 ? `, ${errorCount} erreurs` : ''}`
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la régénération globale:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la régénération des écritures',
        details: error.message
      },
      { status: 500 }
    );
  }
}