# Requirements Document - Optimisation Comptable

## Introduction

Optimiser les fichiers du module comptable (dashboard, écritures, factures, comptabiliser-button) en réduisant la duplication de code, améliorant la performance et simplifiant la maintenance. L'objectif est de maintenir la fonctionnalité existante tout en minimisant le code.

## Glossary

- **Comptable Module**: Ensemble des pages et composants pour la gestion comptable (factures, écritures, dashboard)
- **Duplication de Code**: Code répété dans plusieurs fichiers (filtrage, formatage, appels API)
- **Optimisation**: Réduction du code sans perte de fonctionnalité
- **Memoization**: Technique pour éviter les recalculs inutiles en React
- **Extraction de Logique**: Déplacement de code dans des fonctions/hooks réutilisables

## Requirements

### Requirement 1: Centraliser les Utilitaires Partagés

**User Story:** En tant que développeur, je veux avoir des utilitaires centralisés pour les opérations communes (formatage, filtrage, API), afin de réduire la duplication et faciliter la maintenance.

#### Acceptance Criteria

1. WHEN les fichiers comptables utilisent des fonctions de formatage, THE system SHALL utiliser des utilitaires centralisés
2. WHEN les fichiers comptables effectuent des appels API, THE system SHALL utiliser des routes API centralisées
3. WHEN les fichiers comptables filtrent des données, THE system SHALL utiliser des fonctions de filtrage réutilisables
4. WHERE des constantes sont répétées, THE system SHALL les centraliser dans un fichier de configuration

### Requirement 2: Optimiser les Composants Pages

**User Story:** En tant que développeur, je veux que les pages comptables soient optimisées pour la performance et la lisibilité, afin de réduire le code et améliorer la maintenabilité.

#### Acceptance Criteria

1. WHEN une page comptable charge des données, THE system SHALL utiliser des hooks personnalisés pour la logique métier
2. WHEN une page comptable filtre des données, THE system SHALL utiliser la memoization pour éviter les recalculs
3. WHEN une page comptable gère l'état, THE system SHALL consolider les états similaires
4. WHEN une page comptable affiche des listes, THE system SHALL réutiliser des composants génériques

### Requirement 3: Simplifier le Composant ComptabiliserButton

**User Story:** En tant que développeur, je veux que le composant ComptabiliserButton soit simplifié et réutilisable, afin de réduire la logique conditionnelle.

#### Acceptance Criteria

1. WHEN le composant ComptabiliserButton détecte le type de document, THE system SHALL utiliser une fonction utilitaire centralisée
2. WHEN le composant ComptabiliserButton effectue une action, THE system SHALL utiliser des hooks pour la logique
3. WHEN le composant ComptabiliserButton affiche des états, THE system SHALL utiliser des composants UI réutilisables

### Requirement 4: Extraire les Hooks Personnalisés

**User Story:** En tant que développeur, je veux avoir des hooks personnalisés pour les opérations récurrentes, afin de réduire le code dans les composants.

#### Acceptance Criteria

1. WHEN un composant gère le chargement de données, THE system SHALL utiliser un hook useComptableData
2. WHEN un composant gère les filtres, THE system SHALL utiliser un hook useFilters
3. WHEN un composant gère les modales, THE system SHALL utiliser un hook useModals
4. WHEN un composant gère les notifications, THE system SHALL utiliser le hook useToast existant
