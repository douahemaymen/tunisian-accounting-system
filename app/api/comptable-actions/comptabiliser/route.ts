import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAccountingEntries } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { factureId } = await request.json();

    if (!factureId) {
      return NextResponse.json({ error: 'ID de facture requis' }, { status: 400 });
    }

    // Récupérer la facture avec les informations du client
    const facture = await prisma.journalAchat.findUnique({
      where: { id: factureId },
      include: {
        client: {
          include: {
            comptable: true
          }
        }
      }
    });

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à cette facture
    const isComptable = session.user.role === 'comptable';
    const isAdmin = session.user.role === 'admin';

    if (!isAdmin && !isComptable) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Pour un comptable, vérifier qu'il s'agit bien de son client
    if (isComptable && facture.client?.comptable?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès non autorisé à cette facture' }, { status: 403 });
    }

    // Vérifier si déjà comptabilisée
    if (facture.status === 'COMPTABILISE') {
      return NextResponse.json({
        error: 'Cette facture est déjà comptabilisée'
      }, { status: 400 });
    }

    // Récupérer le plan comptable du comptable
    let planComptable;
    if (facture.client?.comptableId) {
      planComptable = await prisma.planComptable.findMany({
        where: { comptableId: facture.client.comptableId },
        orderBy: { num_compte: 'asc' }
      });
    } else {
      return NextResponse.json({
        error: 'Aucun plan comptable disponible pour ce client'
      }, { status: 400 });
    }

    if (planComptable.length === 0) {
      return NextResponse.json({
        error: 'Plan comptable vide. Veuillez d\'abord configurer le plan comptable.'
      }, { status: 400 });
    }

    // Préparer les données de la facture pour Gemini
    const factureData = {
      id: facture.id,
      type_facture: facture.type_facture,
      fournisseur: facture.fournisseur,
      date: facture.date,
      reference: facture.reference,
      total_ht: facture.total_ht,
      tva_19: facture.tva_19,
      tva_13: facture.tva_13,
      tva_7: facture.tva_7,
      total_tva: facture.total_tva,
      total_ttc: facture.total_ttc,
      remise: facture.remise,
      timbre_fiscal: facture.timbre_fiscal
    };

    console.log('🧠 Comptabilisation avec Gemini AI + analyse d\'image pour:', {
      factureId,
      fournisseur: facture.fournisseur,
      typeFacture: facture.type_facture,
      montantTTC: facture.total_ttc,
      imageUrl: facture.image_url,
      comptesDisponibles: planComptable.length,
      timestamp: new Date().toISOString()
    });

    // Générer les écritures comptables avec Gemini + analyse d'image
    const ecrituresResult = await generateAccountingEntries(
      factureData,
      planComptable
    );

    // Valider que les comptes existent dans le plan comptable
    const comptesValides: any[] = [];
    const comptesInvalides = [];

    for (const ecriture of ecrituresResult.ecritures) {
      const compteExiste = planComptable.find(c => c.num_compte === ecriture.num_compte);
      if (compteExiste) {
        comptesValides.push({
          ...ecriture,
          planId: compteExiste.id,
          libelle: compteExiste.libelle
        });
      } else {
        comptesInvalides.push(ecriture.num_compte);
      }
    }

    if (comptesInvalides.length > 0) {
      console.warn('⚠️ Comptes invalides détectés:', comptesInvalides);
      return NextResponse.json({
        error: `Comptes non trouvés dans le plan comptable: ${comptesInvalides.join(', ')}`,
        suggestions: planComptable.slice(0, 10).map(c => `${c.num_compte} - ${c.libelle}`)
      }, { status: 400 });
    }

    // Vérifier l'équilibrage des écritures avec tolérance pour les arrondis
    const totalDebit = Math.round(comptesValides.reduce((sum, e) => sum + e.debit, 0) * 1000) / 1000;
    const totalCredit = Math.round(comptesValides.reduce((sum, e) => sum + e.credit, 0) * 1000) / 1000;
    const difference = Math.abs(totalDebit - totalCredit);
    const tolerance = 1.0; // Tolérance de 1 TND pour les arrondis

    console.log('🔍 Vérification équilibrage:', {
      totalDebit,
      totalCredit,
      difference,
      tolerance,
      isBalanced: difference <= tolerance
    });

    if (difference > tolerance) {
      console.error('❌ Écritures déséquilibrées (différence > 1 TND):', {
        totalDebit,
        totalCredit,
        difference,
        ecritures: comptesValides.map(e => ({
          compte: e.num_compte,
          debit: e.debit,
          credit: e.credit
        }))
      });

      return NextResponse.json({
        error: `Écritures déséquilibrées: Débit ${totalDebit.toFixed(3)} ≠ Crédit ${totalCredit.toFixed(3)} (différence: ${difference.toFixed(3)} TND)`,
        details: {
          totalDebit: totalDebit.toFixed(3),
          totalCredit: totalCredit.toFixed(3),
          difference: difference.toFixed(3),
          tolerance: tolerance,
          ecritures: comptesValides
        }
      }, { status: 400 });
    }

    if (difference > 0.001) {
      console.log('⚠️ Petite différence d\'arrondi acceptée:', difference.toFixed(3), 'TND');
    }

    // Transaction pour comptabiliser la facture
    const result = await prisma.$transaction(async (tx) => {
      // Supprimer les anciennes écritures si elles existent
      await tx.ecritureComptable.deleteMany({
        where: { factureId }
      });

      // Créer les nouvelles écritures comptables
      const ecrituresCreees = await Promise.all(
        comptesValides.map(ecriture =>
          tx.ecritureComptable.create({
            data: {
              factureId,
              planId: ecriture.planId,
              libelle: ecriture.libelle,
              num_compte: ecriture.num_compte,
              debit: ecriture.debit,
              credit: ecriture.credit
            },
            include: {
              planComptable: true
            }
          })
        )
      );

      // Mettre à jour le statut de la facture à VALIDATED (comptabilisée)
      const factureUpdated = await tx.journalAchat.update({
        where: { id: factureId },
        data: {
          status: 'COMPTABILISE',
          accounting_entries: {
            generated_at: new Date().toISOString(),
            type: 'journal_achat',
            entries_count: ecrituresCreees.length,
            generated_by: 'gemini-ai-with-image',
            total_debit: totalDebit,
            total_credit: totalCredit
          }
        }
      });

      return { ecrituresCreees, factureUpdated };
    });

    console.log('✅ Facture comptabilisée avec succès:', {
      factureId,
      ecrituresCount: result.ecrituresCreees.length,
      totalDebit,
      totalCredit,
      status: 'COMPTABILISE'
    });

    return NextResponse.json({
      success: true,
      message: 'Facture comptabilisée avec succès',
      ecrituresCount: result.ecrituresCreees.length,
      ecritures: result.ecrituresCreees.map(e => ({
        id: e.id,
        compte: e.planComptable.num_compte,
        libelle: e.planComptable.libelle,
        debit: e.debit,
        credit: e.credit,
        date: e.date
      })),
      type: 'journal_achat',
      generatedBy: 'gemini-ai-with-image',
      totalDebit,
      totalCredit,
      facture: {
        id: result.factureUpdated.id,
        status: result.factureUpdated.status
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur comptabilisation:', error);

    // Messages d'erreur plus spécifiques
    if (error.message?.includes('API key')) {
      return NextResponse.json({
        error: 'Configuration Gemini manquante. Veuillez configurer la clé API.'
      }, { status: 500 });
    }

    if (error.message?.includes('quota')) {
      return NextResponse.json({
        error: 'Quota API Gemini dépassé. Veuillez réessayer plus tard.'
      }, { status: 429 });
    }

    return NextResponse.json({
      error: 'Erreur lors de la comptabilisation',
      details: error.message
    }, { status: 500 });
  }
}
