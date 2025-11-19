// Validateurs pour les données de journaux

export const journalValidator = {
  /**
   * Valide les données de création d'un journal
   */
  validateCreateJournal(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.clientUid) {
      errors.push('clientUid est requis');
    }

    if (!data.imageUrl) {
      errors.push('imageUrl est requis');
    }

    if (!data.extractedData) {
      errors.push('extractedData est requis');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Valide les données de mise à jour d'un journal
   */
  validateUpdateJournal(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.id) {
      errors.push('ID est requis pour la mise à jour');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Valide les filtres de recherche
   */
  validateFilters(filters: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!filters.clientUid) {
      errors.push('clientUid est requis');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
