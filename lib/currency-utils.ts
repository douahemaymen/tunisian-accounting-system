/**
 * Utilitaires pour le formatage des montants en Dinars Tunisiens (DT)
 */

/**
 * Formate un montant en dinars tunisiens avec 3 décimales
 * @param amount - Montant à formater
 * @returns Montant formaté avec "DT" (ex: "1 234,567 DT")
 */
export const formatTND = (amount: number): string => {
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount) + ' DT';
};

/**
 * Formate un montant en dinars tunisiens avec 2 décimales (pour les totaux)
 * @param amount - Montant à formater
 * @returns Montant formaté avec "DT" (ex: "1 234,56 DT")
 */
export const formatTNDShort = (amount: number): string => {
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' DT';
};

/**
 * Formate un montant pour l'affichage dans les tableaux (3 décimales)
 * @param amount - Montant à formater
 * @returns Montant formaté ou "-" si zéro
 */
export const formatTNDTable = (amount: number): string => {
  return amount > 0 ? formatTND(amount) : '-';
};

/**
 * Parse un montant depuis une chaîne formatée
 * @param formattedAmount - Montant formaté (ex: "1 234,567 DT")
 * @returns Nombre ou 0 si parsing échoue
 */
export const parseTND = (formattedAmount: string): number => {
  try {
    // Supprimer "DT" et espaces, remplacer virgule par point
    const cleanAmount = formattedAmount
      .replace(/\s*DT\s*$/i, '')
      .replace(/\s/g, '')
      .replace(',', '.');
    
    const parsed = parseFloat(cleanAmount);
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
};

/**
 * Vérifie si deux montants sont équilibrés (différence < 0.001 DT)
 * @param debit - Montant débit
 * @param credit - Montant crédit
 * @returns true si équilibré
 */
export const isBalanced = (debit: number, credit: number): boolean => {
  return Math.abs(debit - credit) < 0.001;
};