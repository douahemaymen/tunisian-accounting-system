# Architecture du Projet - Comptabilité Next.js/Prisma

## 📐 Vue d'Ensemble

Ce projet suit une **architecture en couches** (Layered Architecture) pour séparer clairement les responsabilités et faciliter la maintenance.

```
┌─────────────────────────────────────────────────────────┐
│                    Couche Présentation                   │
│              (Components, Pages, API Routes)             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Couche Services                       │
│              (Logique Métier / Business Logic)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Couche Repositories                     │
│              (Accès aux Données / Data Access)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Base de Données                         │
│                  (PostgreSQL via Prisma)                 │
└─────────────────────────────────────────────────────────┘
```

## 🏗️ Structure des Dossiers

```
/app
  /api                    # API Routes Next.js (couche présentation)
    /journal-achat        # Endpoints journaux d'achat
    /journal-vente        # Endpoints journaux de vente
    /journal-banque       # Endpoints journaux banque
    /ecritures-comptables # Endpoints écritures comptables
    /plancomptable        # Endpoints plan comptable
    /dashboard            # Endpoints statistiques
  /(admin)                # Pages admin
  /(client)               # Pages client
  /(comptable)            # Pages comptable

/components               # Composants React (couche présentation)
  /admin                  # Composants admin
  /dashboard              # Composants dashboard
  /forms                  # Formulaires
  /tables                 # Tableaux
  /ui                     # Composants UI génériques

/lib
  /services               # Services métier (logique business)
    auth.service.ts       # Authentification et autorisation
    journal.service.ts    # Gestion des journaux
    ecriture.service.ts   # Génération d'écritures
    
  /repositories           # Repositories (accès données)
    journal.repository.ts # CRUD journaux
    ecriture.repository.ts # CRUD écritures
    comptable.repository.ts # CRUD comptables
    
  /utils                  # Utilitaires génériques
    response.ts           # Helpers réponses HTTP
    parsers.ts            # Parsers de données
    date-utils.ts         # Utilitaires dates
    currency-utils.ts     # Utilitaires devises
    
  /validators             # Validateurs de données
    journal.validator.ts  # Validation journaux
    
  /types                  # Types TypeScript
    types.ts              # Types métier
    
  auth.ts                 # Configuration NextAuth
  prisma.ts               # Client Prisma
  gemini.ts               # Intégration Gemini AI

/prisma
  schema.prisma           # Schéma de base de données
  /migrations             # Migrations Prisma
```

## 🎯 Responsabilités par Couche

### 1. Couche Présentation (API Routes + Components)

**Responsabilités :**
- Validation des entrées utilisateur
- Gestion des requêtes HTTP
- Orchestration des appels aux services
- Formatage des réponses
- Gestion des erreurs HTTP

**Règles :**
- ❌ PAS de logique métier
- ❌ PAS d'accès direct à Prisma
- ✅ Appels aux services uniquement
- ✅ Validation des données
- ✅ Gestion des erreurs

**Exemple :**
```typescript
// app/api/journal-achat/route.ts
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validation
    const validation = journalValidator.validateCreateJournal(data);
    if (!validation.isValid) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    // Appel au service
    const journal = await journalService.createJournalAchat(data);
    
    // Réponse
    return jsonResponse(journal, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
```

### 2. Couche Services (Business Logic)

**Responsabilités :**
- Logique métier pure
- Orchestration des repositories
- Validation métier
- Transformations de données
- Règles de gestion

**Règles :**
- ❌ PAS d'accès direct à Prisma
- ❌ PAS de gestion HTTP
- ✅ Appels aux repositories
- ✅ Logique métier complexe
- ✅ Transactions métier

**Exemple :**
```typescript
// lib/services/journal.service.ts
export const journalService = {
  async createJournalAchat(data: CreateJournalAchatData) {
    // Parsing et validation métier
    const parsed = parseNumericFields(data.extractedData, FACTURE_NUMERIC_FIELDS);
    
    // Appel au repository
    return journalAchatRepository.create({
      client: { connect: { uid: data.clientUid } },
      fournisseur: parsed.fournisseur ?? 'Inconnu',
      // ... autres champs
    });
  }
};
```

### 3. Couche Repositories (Data Access)

**Responsabilités :**
- Accès direct à Prisma
- Requêtes SQL/Prisma
- Gestion des transactions
- Optimisation des requêtes
- Includes standardisés

**Règles :**
- ✅ Accès Prisma uniquement
- ✅ Requêtes optimisées
- ✅ Gestion des relations
- ❌ PAS de logique métier
- ❌ PAS de validation métier

**Exemple :**
```typescript
// lib/repositories/journal.repository.ts
export const journalAchatRepository = {
  async create(data: Prisma.JournalAchatCreateInput) {
    return prisma.journalAchat.create({ data });
  },

  async findMany(filters: JournalFilters) {
    return prisma.journalAchat.findMany({
      where: buildWhereClause(filters),
      include: JOURNAL_INCLUDE,
      orderBy: { created_at: 'desc' }
    });
  }
};
```

## 🔄 Flux de Données

### Exemple : Création d'un Journal d'Achat

```
1. Client HTTP
   ↓ POST /api/journal-achat
   
2. API Route (app/api/journal-achat/route.ts)
   ↓ Validation des données
   ↓ journalValidator.validateCreateJournal()
   
3. Service (lib/services/journal.service.ts)
   ↓ Parsing des champs numériques
   ↓ Logique métier
   ↓ journalService.createJournalAchat()
   
4. Repository (lib/repositories/journal.repository.ts)
   ↓ Requête Prisma
   ↓ journalAchatRepository.create()
   
5. Base de Données (PostgreSQL)
   ↓ INSERT INTO journal_achat
   
6. Retour des données
   ↑ Repository → Service → API Route → Client
```

## 🎨 Patterns Utilisés

### 1. Repository Pattern
Abstraction de l'accès aux données pour faciliter les tests et le changement de source de données.

### 2. Service Layer Pattern
Centralisation de la logique métier pour la réutilisabilité et la testabilité.

### 3. Dependency Injection
Les services dépendent des repositories, pas de l'implémentation concrète.

### 4. Factory Pattern
Création d'objets complexes (écritures comptables) via des factories.

### 5. Strategy Pattern
Différentes stratégies de génération d'écritures (Gemini AI vs classique).

## 🔐 Sécurité et Authentification

### Flux d'Authentification

```
1. Utilisateur se connecte
   ↓ NextAuth
   
2. Session créée
   ↓ JWT Token
   
3. Requête API avec session
   ↓ authService.requireAuth()
   
4. Vérification du rôle
   ↓ authService.requireRole('comptable')
   
5. Récupération du comptable
   ↓ authService.getComptable()
   
6. Accès autorisé
```

### Niveaux d'Autorisation

```typescript
// Authentification simple
const user = await authService.requireAuth();

// Vérification de rôle
const user = await authService.requireRole('comptable');

// Récupération du comptable
const comptable = await authService.getComptable();
```

## 📊 Gestion des Transactions

### Transactions Prisma

```typescript
// Transaction simple
await prisma.$transaction([
  prisma.journalAchat.create({ data: journalData }),
  prisma.ecritureComptable.createMany({ data: ecrituresData })
]);

// Transaction avec logique
await prisma.$transaction(async (tx) => {
  const journal = await tx.journalAchat.create({ data: journalData });
  const ecritures = await tx.ecritureComptable.createMany({ 
    data: ecrituresData.map(e => ({ ...e, factureId: journal.id }))
  });
  return { journal, ecritures };
});
```

## 🧪 Testabilité

### Tests Unitaires des Services

```typescript
// Mock du repository
const mockRepository = {
  create: jest.fn().mockResolvedValue(mockJournal)
};

// Test du service
test('createJournalAchat should create journal', async () => {
  const result = await journalService.createJournalAchat(mockData);
  expect(mockRepository.create).toHaveBeenCalledWith(expectedData);
  expect(result).toEqual(mockJournal);
});
```

### Tests d'Intégration des Repositories

```typescript
// Test avec base de données de test
test('journalAchatRepository.create should insert data', async () => {
  const result = await journalAchatRepository.create(testData);
  expect(result.id).toBeDefined();
  expect(result.fournisseur).toBe(testData.fournisseur);
});
```

## 🚀 Performance

### Optimisations Prisma

1. **Includes Standardisés**
   - Évite les N+1 queries
   - Relations préchargées

2. **Indexes de Base de Données**
   ```prisma
   @@index([clientUid])
   @@index([comptableId])
   @@index([created_at])
   ```

3. **Pagination**
   ```typescript
   findMany({
     take: 50,
     skip: page * 50
   })
   ```

4. **Select Spécifiques**
   ```typescript
   select: {
     id: true,
     nom: true
     // Seulement les champs nécessaires
   }
   ```

## 📈 Évolutivité

### Ajout d'un Nouveau Type de Journal

1. **Créer le modèle Prisma**
2. **Ajouter le repository**
3. **Étendre le service**
4. **Créer l'API route**
5. **Ajouter les validateurs**

### Ajout d'une Nouvelle Fonctionnalité

1. **Service** : Logique métier
2. **Repository** : Accès données si nécessaire
3. **API Route** : Endpoint HTTP
4. **Validator** : Validation des données
5. **Tests** : Couverture complète

## 🔍 Monitoring et Logging

### Logs Structurés

```typescript
console.log('🧠 Génération écritures avec Gemini AI', {
  factureId,
  fournisseur: facture.fournisseur,
  typeJournal: facture.type_journal,
  montantTTC: facture.total_ttc,
  timestamp: new Date().toISOString()
});
```

### Métriques à Surveiller

- Temps de réponse des API
- Taux d'erreur par endpoint
- Utilisation de Gemini AI
- Temps de génération d'écritures
- Nombre de transactions par jour

## 📚 Ressources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
