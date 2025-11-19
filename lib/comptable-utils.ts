// Utilitaires centralisés pour le module comptable
import type { Facture, JournalVente, JournalBanque } from '@/lib/types';

export type JournalEntry = Facture | JournalVente | JournalBanque;
export type JournalType = 'J_ACH' | 'J_VTE' | 'J_BQ';

export interface Filters {
  search: string;
  status: string;
  yearMonth: string;
}

// Filtrage générique pour tous les types de journaux
export const filterJournals = (
  journals: JournalEntry[],
  filters: Filters,
  searchKeys: string[]
): JournalEntry[] => {
  const { search, status, yearMonth } = filters;
  
  return journals.filter((item: any) => {
    const searchMatch = !search || searchKeys.some(key =>
      (item[key] as string)?.toLowerCase().includes(search.toLowerCase())
    );

    const statusMatch = status === 'ALL' || item.status === status;

    const yearMonthMatch = !yearMonth || (() => {
      try {
        const itemDate = new Date(item.date);
        const ym = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
        return ym === yearMonth;
      } catch {
        return false;
      }
    })();

    return searchMatch && statusMatch && yearMonthMatch;
  });
};

// Formatage de date
export const formatDate = (timestamp: bigint | string | null): string => {
  if (!timestamp) return 'Non définie';
  try {
    const date = typeof timestamp === 'bigint' ? new Date(Number(timestamp)) : new Date(timestamp);
    return date.toLocaleDateString('fr-FR');
  } catch {
    return 'Date invalide';
  }
};

// Badge de statut
export const getStatusBadge = (statut: string | null): [string, string] => {
  const map: Record<string, [string, string]> = {
    'NON_COMPTABILISE': ['Non comptabilisé', 'bg-yellow-100 text-yellow-800'],
    'COMPTABILISE': ['Comptabilisé', 'bg-green-100 text-green-800'],
    // Anciens statuts pour compatibilité
    'PENDING': ['Non comptabilisé', 'bg-yellow-100 text-yellow-800'],
    'VALIDATED': ['Comptabilisé', 'bg-green-100 text-green-800'],
    'ACTIVE': ['Actif', 'bg-green-100 text-green-800'],
    'INACTIVE': ['Inactif', 'bg-red-100 text-red-800'],
  };
  return map[statut || ''] || ['Non défini', 'bg-gray-100 text-gray-800'];
};

// Déterminer le type de journal d'une facture
export const getJournalTypeFromFacture = (facture: any): JournalType => {
  // Vérifier si c'est un journal banque (a un numero_compte ou titulaire)
  if ('numero_compte' in facture || 'titulaire' in facture) return 'J_BQ';
  
  // Vérifier si c'est un journal de vente (a un clientdefacture)
  if ('clientdefacture' in facture) return 'J_VTE';
  
  // Vérifier par type_facture
  if (facture.type_facture?.includes('VENTE')) return 'J_VTE';
  if (facture.type_facture === 'JOURNAL_BANQUE') return 'J_BQ';
  
  // Par défaut, c'est un journal d'achat
  return 'J_ACH';
};

// Calcul des totaux
export const calculateTotals = (journals: JournalEntry[]) => {
  return {
    debit: journals.reduce((sum, j: any) => sum + (j.debit || 0), 0),
    credit: journals.reduce((sum, j: any) => sum + (j.credit || 0), 0),
  };
};
