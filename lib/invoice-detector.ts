// lib/invoice-detector.ts
// Utilitaire pour détecter automatiquement le type de facture

export interface InvoiceDetectionResult {
  isFactureVente: boolean;
  confidence: number;
  detectedFields: string[];
}

/**
 * Détecte si une facture est une facture de vente basée sur le contenu extrait
 */
export function detectInvoiceType(extractedData: any): InvoiceDetectionResult {
  const detectedFields: string[] = [];
  let score = 0;
  
  // Convertir toutes les valeurs en string pour la recherche
  const textContent = JSON.stringify(extractedData).toLowerCase();
  
  // Mots-clés indicateurs de facture de vente
  const venteKeywords = [
    'ste les cinqs etoiles',
    'cinq etoiles',
    'cinqs etoiles',
    'les cinqs etoiles en gros',
    'avance',
    'f.d.c.s.t',
    'fdcs',
    'facture de vente',
    'bon de livraison'
  ];
  
  // Mots-clés indicateurs de facture d'achat
  const achatKeywords = [
    'fournisseur',
    'facture d\'achat',
    'bon de commande',
    'facture fournisseur'
  ];
  
  // Vérification des mots-clés de vente
  venteKeywords.forEach(keyword => {
    if (textContent.includes(keyword)) {
      score += 2;
      detectedFields.push(`Mot-clé vente: ${keyword}`);
    }
  });
  
  // Vérification des champs spécifiques aux factures de vente
  if (extractedData.clientSte) {
    score += 3;
    detectedFields.push('Champ clientSte présent');
  }
  
  if (extractedData.avance && parseFloat(extractedData.avance) > 0) {
    score += 2;
    detectedFields.push('Avance détectée');
  }
  
  if (extractedData.fdcs && parseFloat(extractedData.fdcs) > 0) {
    score += 2;
    detectedFields.push('F.D.C.S.T détecté');
  }
  
  // Vérification des mots-clés d'achat (score négatif)
  achatKeywords.forEach(keyword => {
    if (textContent.includes(keyword)) {
      score -= 1;
      detectedFields.push(`Mot-clé achat: ${keyword}`);
    }
  });
  
  // Calcul de la confiance (0-100%)
  const maxScore = 9; // Score maximum possible
  const confidence = Math.max(0, Math.min(100, (score / maxScore) * 100));
  
  return {
    isFactureVente: score > 2, // Seuil de décision
    confidence,
    detectedFields
  };
}

/**
 * Valide les champs requis pour une facture de vente
 */
export function validateFactureVenteFields(data: any): { isValid: boolean; missingFields: string[] } {
  const requiredFields = ['clientSte', 'date', 'reference', 'total_ht', 'total_ttc'];
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Normalise les données extraites pour une facture de vente
 */
export function normalizeFactureVenteData(extractedData: any): any {
  return {
    ...extractedData,
    clientSte: extractedData.clientSte || extractedData.fournisseur || 'STE LES CINQS ETOILES EN GROS',
    avance: parseFloat(extractedData.avance) || 0,
    fdcs: parseFloat(extractedData.fdcs) || 0,
    // Garder les autres champs standards
    total_ht: parseFloat(extractedData.total_ht) || 0,
    total_ttc: parseFloat(extractedData.total_ttc) || 0,
    total_tva: parseFloat(extractedData.total_tva) || 0,
    tva_19: parseFloat(extractedData.tva_19) || 0,
    tva_13: parseFloat(extractedData.tva_13) || 0,
    tva_7: parseFloat(extractedData.tva_7) || 0,
    remise: parseFloat(extractedData.remise) || 0,
    timbre_fiscal: parseFloat(extractedData.timbre_fiscal) || 0,
  };
}

/**
 * Détecte si un document est un journal banque
 */
export function detectJournalBanque(extractedData: any): InvoiceDetectionResult {
  const detectedFields: string[] = [];
  let score = 0;
  
  // Convertir toutes les valeurs en string pour la recherche
  const textContent = JSON.stringify(extractedData).toLowerCase();
  
  // Mots-clés indicateurs de journal banque
  const banqueKeywords = [
    'journal banque',
    'relevé bancaire',
    'relevé de compte',
    'solde initial',
    'solde finale',
    'total crédit',
    'total débit',
    'mouvement bancaire',
    'extrait de compte',
    'banque populaire',
    'attijari',
    'bmce',
    'cih'
  ];
  
  // Vérification des mots-clés de banque
  banqueKeywords.forEach(keyword => {
    if (textContent.includes(keyword)) {
      score += 2;
      detectedFields.push(`Mot-clé banque: ${keyword}`);
    }
  });
  
  // Vérification des champs spécifiques aux journaux banque
  if (extractedData.solde_initiale !== undefined) {
    score += 3;
    detectedFields.push('Champ solde_initiale présent');
  }
  
  if (extractedData.totale_credit !== undefined) {
    score += 2;
    detectedFields.push('Champ totale_credit présent');
  }
  
  if (extractedData.totale_debit !== undefined) {
    score += 2;
    detectedFields.push('Champ totale_debit présent');
  }
  
  if (extractedData.mouvements && Array.isArray(extractedData.mouvements)) {
    score += 3;
    detectedFields.push('Liste de mouvements détectée');
  }
  
  // Calcul de la confiance (0-100%)
  const maxScore = 12; // Score maximum possible
  const confidence = Math.max(0, Math.min(100, (score / maxScore) * 100));
  
  return {
    isFactureVente: false, // Ce n'est pas une facture de vente
    confidence,
    detectedFields
  };
}

/**
 * Normalise les données extraites pour un journal banque
 */
export function normalizeJournalBanqueData(extractedData: any): any {
  return {
    ...extractedData,
    solde_initiale: parseFloat(extractedData.solde_initiale) || 0,
    totale_credit: parseFloat(extractedData.totale_credit) || 0,
    totale_debit: parseFloat(extractedData.totale_debit) || 0,
    totale_solde: parseFloat(extractedData.totale_solde) || 0,
    mouvements: (extractedData.mouvements || []).map((mouvement: any) => ({
      date: mouvement.date || new Date().toISOString().slice(0, 10),
      libelle: mouvement.libelle || '',
      debit: parseFloat(mouvement.debit) || 0,
      credit: parseFloat(mouvement.credit) || 0,
    }))
  };
}

/**
 * Détecte automatiquement le type de document
 */
export function detectDocumentType(extractedData: any): {
  type: 'facture' | 'facture_vente' | 'journal_banque';
  confidence: number;
  detectedFields: string[];
} {
  // Test pour journal banque
  const banqueDetection = detectJournalBanque(extractedData);
  if (banqueDetection.confidence > 50) {
    return {
      type: 'journal_banque',
      confidence: banqueDetection.confidence,
      detectedFields: banqueDetection.detectedFields
    };
  }
  
  // Test pour facture de vente
  const venteDetection = detectInvoiceType(extractedData);
  if (venteDetection.isFactureVente) {
    return {
      type: 'facture_vente',
      confidence: venteDetection.confidence,
      detectedFields: venteDetection.detectedFields
    };
  }
  
  // Par défaut: facture d'achat
  return {
    type: 'facture',
    confidence: 80,
    detectedFields: ['Type par défaut: facture d\'achat']
  };
}