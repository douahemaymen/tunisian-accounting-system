import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBankAccountingEntries } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { journalBanqueId } = await request.json();

    if (!journalBanqueId) {
      return NextResponse.json({ error: 'ID de journal banque requis' }, { status: 400 });
    }

    // Récupérer le journal banque avec les informations du client et mouvements
    const journalBanque = await prisma.journalBanque.findUnique({
      where: { id: journalBanqueId },
      include: {
        client: {
          include: {
            comptable: true
          }
        },
        mouvements: true
      }
    });

    if (!journalBanque) {
      return NextResponse.json({ error: 'Journal banque non trouvé' }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à ce journal
    const isComptable = session.user.role === 'comptable';
    const isAdmin = session.user.role === 'admin';

    if (!isAdmin && !isComptable) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Pour un comptable, vérifier qu'il s'agit bien de son client
    if (isComptable && journalBanque.client?.comptable?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès non autorisé à ce journal' }, { status: 403 });
    }

    // Vérifier si déjà comptabilisé
    if (journalBanque.status === 'COMPTABILISE') {
      return NextResponse.json({
        error: 'Ce journal banque est déjà comptabilisé'
      }, { status: 400 });
    }

    // Récupérer le plan comptable du comptable
    let planComptable;
    if (journalBanque.client?.comptableId) {
      planComptable = await prisma.planComptable.findMany({
        where: { comptableId: journalBanque.client.comptableId },
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

    // Préparer les données du journal banque pour Gemini
    const journalData = {
      id: journalBanque.id,
      date: journalBanque.date,
      mouvements: journalBanque.mouvements
    };

    console.log('🏦 Comptabilisation journal banque avec Gemini AI:', {
      journalBanqueId,
      date: journalBanque.date,
      mouvementsCount: journalBanque.mouvements.length,
      comptesDisponibles: planComptable.length,
      timestamp: new Date().toISOString()
    });

    // Générer les écritures comptables avec Gemini
    const ecrituresResult = await generateBankAccountingEntries(
      journalData,
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

    console.log('🔍 Vérification équilibrage journal banque:', {
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

    // Transaction pour comptabiliser le journal banque
    const result = await prisma.$transaction(async (tx) => {
      // Supprimer les anciennes écritures si elles existent
      await tx.ecritureComptable.deleteMany({
        where: { journalBanqueId }
      });

      // Créer les nouvelles écritures comptables
      const ecrituresCreees = await Promise.all(
        comptesValides.map(ecriture =>
          tx.ecritureComptable.create({
            data: {
              journalBanqueId,
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

      // Mettre à jour le statut du journal banque à VALIDATED (comptabilisé)
      const journalUpdated = await tx.journalBanque.update({
        where: { id: journalBanqueId },
        data: {
          status: 'COMPTABILISE'
        }
      });

      return { ecrituresCreees, journalUpdated };
    });

    console.log('✅ Journal banque comptabilisé avec succès:', {
      journalBanqueId,
      ecrituresCount: result.ecrituresCreees.length,
      totalDebit,
      totalCredit,
      status: 'COMPTABILISE'
    });

    return NextResponse.json({
      success: true,
      message: 'Journal banque comptabilisé avec succès',
      ecrituresCount: result.ecrituresCreees.length,
      ecritures: result.ecrituresCreees.map(e => ({
        id: e.id,
        compte: e.planComptable.num_compte,
        libelle: e.planComptable.libelle,
        debit: e.debit,
        credit: e.credit,
        date: e.date
      })),
      type: 'journal_banque',
      generatedBy: 'gemini-ai-bank-journal',
      totalDebit,
      totalCredit,
      journal: {
        id: result.journalUpdated.id,
        status: result.journalUpdated.status
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur comptabilisation journal banque:', error);

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
      error: 'Erreur lors de la comptabilisation du journal banque',
      details: error.message
    }, { status: 500 });
  }
}
