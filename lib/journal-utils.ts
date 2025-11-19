// Utilitaires pour la gestion des types de journaux

import type { Facture } from './types';

/**
 * Détermine le type de journal basé sur le type de facture
 */
export function getJournalTypeFromFacture(facture: Facture): string {
  if (!facture.type_facture) {
    return facture.type_journal || 'UNKNOWN';
  }

  switch (facture.type_facture) {
    case 'FACTURE_ORDINAIRE_DT':
    case 'FACTURE_ORDINAIRE_DEVISE':
    case 'FACTURE_AVOIR':
    case 'RISTOURNE_ACHAT':
      return 'J_ACH';
    
    case 'VENTE_ORDINAIRE_DT':
    case 'VENTE_ORDINAIRE_DEVISE':
    case 'VENTE_AVOIR':
    case 'RISTOURNE_VENTE':
      return 'J_VTE';
    
    case 'JOURNAL_BANQUE':
      return 'J_BQ';
    
    default:
      return facture.type_journal || 'UNKNOWN';
  }
}

/**
 * Obtient le libellé du type de facture
 */
export function getFactureTypeLabel(typeFacture: string): string {
  switch (typeFacture) {
    case 'FACTURE_ORDINAIRE_DT':
      return 'Facture Ordinaire DT';
    case 'FACTURE_ORDINAIRE_DEVISE':
      return 'Facture Ordinaire Devise';
    case 'FACTURE_AVOIR':
      return 'Facture d\'Avoir';
    case 'RISTOURNE_ACHAT':
      return 'Ristourne d\'Achat';
    case 'VENTE_ORDINAIRE_DT':
      return 'Vente Ordinaire DT';
    case 'VENTE_ORDINAIRE_DEVISE':
      return 'Vente Ordinaire Devise';
    case 'VENTE_AVOIR':
      return 'Avoir de Vente';
    case 'RISTOURNE_VENTE':
      return 'Ristourne de Vente';
    case 'JOURNAL_BANQUE':
      return 'Journal de Banque';
    default:
      return typeFacture;
  }
}

/**
 * Obtient le libellé du type de journal
 */
export function getJournalTypeLabel(typeJournal: string): string {
  switch (typeJournal) {
    case 'J_ACH':
      return 'Journal d\'Achat';
    case 'J_VTE':
      return 'Journal de Vente';
    case 'J_BQ':
      return 'Journal de Banque';
    case 'J_CA':
      return 'Journal de Caisse';
    case 'J_SAL':
      return 'Journal de Salaire';
    case 'J_OD':
      return 'Journal d\'Opérations Diverses';
    default:
      return typeJournal;
  }
}

/**
 * Vérifie si une facture est un journal de banque
 */
export function isJournalBanque(facture: Facture): boolean {
  return facture.type_facture === 'JOURNAL_BANQUE' || 
         (facture as any).type_journal === 'J_BQ';
}

/**
 * Vérifie si une facture est un avoir (montant négatif)
 */
export function isAvoir(facture: Facture): boolean {
  return facture.type_facture === 'FACTURE_AVOIR' || 
         facture.type_facture === 'VENTE_AVOIR' ||
         facture.total_ttc < 0;
}

/**
 * Filtre les factures par type de journal
 */
export function filterFacturesByJournalType(factures: Facture[], journalType: string): Facture[] {
  return factures.filter(facture => {
    const factureJournalType = getJournalTypeFromFacture(facture);
    return factureJournalType === journalType;
  });
}