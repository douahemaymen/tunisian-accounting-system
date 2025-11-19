# Design Document - Optimisation Comptable

## Overview

Ce design optimise le module comptable en centralisant les utilitaires, créant des hooks réutilisables et simplifiant les composants. L'approche minimise la duplication tout en maintenant la fonctionnalité.

## Architecture

```
lib/
├── comptable-utils.ts          (Utilitaires centralisés)
├── comptable-constants.ts      (Constantes et routes API)
└── comptable-types.ts          (Types partagés)

hooks/
├── use-comptable-data.ts       (Chargement et gestion des données)
├── use-filters.ts              (Gestion des filtres)
└── use-modals.ts               (Gestion des modales)

components/
└── comptabiliser-button.tsx    (Simplifié)

app/(comptable)/comptable/
├── dashboard/page.tsx          (Optimisé)
├── ecritures-comptables/page.tsx (Optimisé)
└── factures/page.tsx           (Optimisé)
```

## Components and Interfaces

### 1. lib/comptable-constants.ts
Centralise les routes API et les constantes:
```typescript
export const COMPTABLE_API = {
  CLIENTS: '/api/comptable-actions/clients',
  ACHAT: (uid: string) => `/api/journal-achat?clientUid=${uid}`,
  VENTE: (uid: string) => `/api/journal-vente?clientUid=${uid}`,
  BANQUE: (uid: string) => `/api/journal-banque?clientUid=${uid}`,
  DELETE: (id: string) => `/api/comptable-actions/factures/${id}`,
  GENERATE: '/api/ecritures/generate-fast',
  ECRITURES: '/api/ecritures-comptables',
  PLAN_COMPTABLE: '/api/plancomptable',
  EXPORT: '/api/export/excel',
  ECRITURES_EXPORT: '/api/ecritures/export',
  REGENERATE_ALL: '/api/ecritures/regenerate-all',
};

export const JOURNAL_TYPES = {
  ACHAT: 'J_ACH',
  VENTE: 'J_VTE',
  BANQUE: 'J_BQ',
} as const;
```

### 2. lib/comptable-utils.ts
Utilitaires réutilisables:
```typescript
// Détection du type de document
export function getDocumentType(facture: any): 'achat' | 'vente' | 'banque'

// Formatage des dates
export function formatDate(date: string | bigint | null): string

// Formatage des devises
export function formatCurrency(amount: number): string

// Filtrage générique
export function filterJournals(journals: any[], filters: Filters, searchKeys: string[]): any[]

// Détermination du type de journal
export function getJournalTypeFromFacture(id: string, achat: any[], vente: any[], banque: any[]): string

// Détection du type de document pour les appels API
export function getComptabiliserEndpoint(facture: any): { endpoint: string; bodyParam: Record<string, string> }
```

### 3. hooks/use-comptable-data.ts
Hook pour charger et gérer les données comptables:
```typescript
export function useComptableData(clientUid?: string) {
  return {
    clients: Client[],
    journals: { Achat: Facture[], Vente: JournalVente[], Banque: JournalBanque[] },
    isLoading: { clients: boolean, factures: boolean },
    fetchClients: () => Promise<void>,
    fetchClientFactures: (uid: string) => Promise<void>,
    updateJournalState: (facture: Facture, action: 'ADD' | 'UPDATE' | 'DELETE') => void,
  }
}
```

### 4. hooks/use-filters.ts
Hook pour gérer les filtres:
```typescript
export function useFilters() {
  return {
    filters: { search: string, status: string, yearMonth: string },
    setFilters: (filters: Filters) => void,
    resetFilters: () => void,
  }
}
```

### 5. hooks/use-modals.ts
Hook pour gérer les modales:
```typescript
export function useModals() {
  return {
    modals: { scan: boolean, edit: boolean, editingFacture: Facture | null },
    openModal: (name: string) => void,
    closeModal: (name: string) => void,
    setEditingFacture: (facture: Facture | null) => void,
  }
}
```

## Data Models

Les types existants sont réutilisés:
- `Facture`: Facture d'achat
- `JournalVente`: Facture de vente
- `JournalBanque`: Entrée de journal banque
- `Client`: Client
- `EcritureComptable`: Écriture comptable

## Error Handling

- Utiliser le hook `useToast` existant pour les notifications
- Centraliser les messages d'erreur dans les utilitaires
- Ajouter des logs console pour le débogage

## Testing Strategy

- Tester les utilitaires de filtrage avec différents types de données
- Tester les hooks avec des données mockées
- Tester les composants optimisés avec les mêmes cas d'usage qu'avant
- Vérifier que la performance s'améliore (moins de re-renders)

## Key Design Decisions

1. **Centralisation des constantes**: Facilite la maintenance et les changements d'API
2. **Hooks personnalisés**: Réduisent la duplication de logique dans les composants
3. **Utilitaires génériques**: Permettent la réutilisation entre les pages
4. **Memoization**: Évite les recalculs inutiles et améliore la performance
5. **Minimum de code**: Chaque fonction fait une seule chose bien
