// Utilitaires de parsing et conversion de données

/**
 * Convertit une valeur en Float avec fallback à 0
 */
export function parseToFloat(value: any): number {
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Convertit les champs numériques d'un objet
 */
export function parseNumericFields(data: any, fields: string[]): any {
  const result: any = { ...data };
  
  fields.forEach(field => {
    if (field in result) {
      result[field] = parseToFloat(result[field]);
    }
  });
  
  return result;
}

/**
 * Champs numériques standards pour les factures
 */
export const FACTURE_NUMERIC_FIELDS = [
  'total_ht',
  'total_ttc',
  'total_tva',
  'tva_7',
  'tva_13',
  'tva_19',
  'remise',
  'timbre_fiscal'
];
