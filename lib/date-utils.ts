/**
 * Utilitaires pour la gestion des dates dans l'application
 */

/**
 * Parse une date de manière sécurisée
 * @param dateInput - Date sous forme de string, Date, ou autre
 * @returns Date valide ou date actuelle si invalide
 */
export function parseDate(dateInput: any): Date {
  try {
    if (!dateInput) return new Date();
    
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? new Date() : dateInput;
    }
    
    if (typeof dateInput === 'string') {
      // Format YYYY-MM-DD (input date HTML)
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateInput + 'T00:00:00.000Z');
      }
      
      // Format ISO ou autres
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    
    // Autres types
    const parsed = new Date(dateInput);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  } catch (error) {
    console.error('Erreur parsing date:', error, dateInput);
    return new Date();
  }
}

/**
 * Formate une date pour l'affichage
 * @param dateInput - Date à formater
 * @param locale - Locale pour le formatage (défaut: 'fr-FR')
 * @returns Date formatée ou message d'erreur
 */
export function formatDate(dateInput: any, locale: string = 'fr-FR'): string {
  try {
    if (!dateInput) return 'Date non définie';
    
    const date = parseDate(dateInput);
    
    if (isNaN(date.getTime())) {
      console.error('Date invalide pour formatage:', dateInput);
      return 'Date invalide';
    }
    
    return date.toLocaleDateString(locale);
  } catch (error) {
    console.error('Erreur formatage date:', error, dateInput);
    return 'Erreur date';
  }
}

/**
 * Convertit une date pour un input HTML de type date
 * @param dateInput - Date à convertir
 * @returns String au format YYYY-MM-DD
 */
export function dateToInputValue(dateInput: any): string {
  try {
    const date = parseDate(dateInput);
    
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Erreur conversion date pour input:', error, dateInput);
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Formate une date avec l'heure
 * @param dateInput - Date à formater
 * @param locale - Locale pour le formatage (défaut: 'fr-FR')
 * @returns Date et heure formatées
 */
export function formatDateTime(dateInput: any, locale: string = 'fr-FR'): string {
  try {
    const date = parseDate(dateInput);
    
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    
    return date.toLocaleString(locale);
  } catch (error) {
    console.error('Erreur formatage date/heure:', error, dateInput);
    return 'Erreur date';
  }
}