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

    const { clientUid, extractedData, imageUrl } = await request.json();

    if (!clientUid || !extractedData) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Récupérer le comptable
    const comptable = await prisma.comptable.findUnique({
      where: { userId: session.user.id }
    });

    if (!comptable) {
      return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
    }

    // Vérifier que le client appartient au comptable
    const client = await prisma.client.findFirst({
      where: {
        uid: clientUid,
        comptableId: comptable.id
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client non autorisé' }, { status: 403 });
    }

    // Récupérer le plan comptable
    const planComptable = await prisma.planComptable.findMany({
      where: { comptableId: comptable.id },
      orderBy: { num_compte: 'asc' }
    });

    if (planComptable.length === 0) {
      return NextResponse.json({ 
        error: 'Plan comptable vide. Veuillez d\'abord configurer le plan comptable.' 
      }, { status: 400 });
    }

    // Préparer les données pour Gemini
    const factureData = {
      type_journal: extractedData.type_journal,
      type_facture: extractedData.type_facture,
      fournisseur: extractedData.fournisseur,
      date: extractedData.date,
      reference: extractedData.reference,
      total_ht: extractedData.total_ht,
      tva_19: extractedData.tva_19,
      tva_13: extractedData.tva_13,
      tva_7: extractedData.tva_7,
      total_tva: extractedData.total_tva,
      total_ttc: extractedData.total_ttc,
      remise: extractedData.remise,
      timbre_fiscal: extractedData.timbre_fiscal
    };

    console.log('🧠 Génération aperçu écritures avec Gemini + PLAN COMPTABLE COMPLET pour:', {
      fournisseur: factureData.fournisseur,
      typeJournal: factureData.type_journal,
      montantTTC: factureData.total_ttc,
      comptesDisponibles: planComptable.length,
      imageUrl: imageUrl ? 'Oui' : 'Non',
      planComptablePreview: planComptable.slice(0, 5).map(c => `${c.num_compte}:${c.libelle}`)
    });

    // Générer les écritures avec Gemini + TOUT le plan comptable
    const ecrituresResult = await generateAccountingEntries(
      factureData,
      planComptable // TOUT le plan comptable pour une sélection optimale
    );

    // Valider que les comptes existent et enrichir avec les libellés
    const ecrituresEnrichies = [];
    const comptesInvalides = [];

    for (const ecriture of ecrituresResult.ecritures) {
      const compteExiste = planComptable.find(c => c.num_compte === ecriture.num_compte);
      if (compteExiste) {
        ecrituresEnrichies.push({
          compte: ecriture.num_compte,
          libelle: compteExiste.libelle,
          debit: ecriture.debit,
          credit: ecriture.credit
        });
      } else {
        comptesInvalides.push(ecriture.num_compte);
      }
    }

    if (comptesInvalides.length > 0) {
      console.warn('⚠️ Comptes invalides dans l\'aperçu:', comptesInvalides);
    }

    // Calculer les totaux
    const totalDebit = ecrituresEnrichies.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = ecrituresEnrichies.reduce((sum, e) => sum + e.credit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) <= 1.0;

    console.log('✅ Aperçu écritures généré:', {
      ecrituresCount: ecrituresEnrichies.length,
      totalDebit,
      totalCredit,
      isBalanced,
      type: 'generated'
    });

    return NextResponse.json({
      success: true,
      ecritures: ecrituresEnrichies,
      type: 'generated',
      totalDebit,
      totalCredit,
      isBalanced,
      comptesInvalides,
      message: `${ecrituresEnrichies.length} écriture(s) générée(s) ${isBalanced ? '(équilibrées)' : '(déséquilibrées)'}`
    });

  } catch (error: any) {
    console.error('❌ Erreur génération aperçu écritures:', error);
    
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
      error: 'Erreur lors de la génération des écritures',
      details: error.message
    }, { status: 500 });
  }
}