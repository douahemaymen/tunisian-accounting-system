# Modals de Scan de Factures

Ce dossier contient deux versions du modal de scan de factures, adaptées à différents types d'utilisateurs.

## 📋 ScanFactureModal (Comptables)

**Fichier:** `scan-facture-modal.tsx`

**Utilisé par:** Comptables (app/(comptable)/comptable/factures/page.tsx)

**Fonctionnalités:**
- ✅ Sélection du type de journal (J_ACH, J_VTE, J_BQ, etc.)
- ✅ Sélection du type de facture
- ✅ Upload et analyse IA avec Gemini
- ✅ **Affichage de l'étape de vérification des données extraites**
- ✅ Modification manuelle des données avant enregistrement
- ✅ Édition des écritures comptables générées
- ✅ Ajout/suppression d'écritures comptables
- ✅ Aperçu de l'image uploadée
- ✅ Validation de l'équilibre débit/crédit

**Workflow:**
1. Sélection du type de journal
2. Sélection du type de facture (si applicable)
3. Upload du document
4. Analyse IA
5. **→ Vérification et modification des données** ⭐
6. Enregistrement manuel

---

## 🚀 ScanFactureClientModal (Clients)

**Fichier:** `scan-facture-client-modal.tsx`

**Utilisé par:** Clients (app/(client)/client/factures/page.tsx)

**Fonctionnalités:**
- ✅ Sélection du type de journal (J_ACH, J_VTE, J_BQ)
- ✅ Sélection du type de facture
- ✅ Upload et analyse IA avec Gemini
- ✅ **Enregistrement automatique avec écritures comptables** ⚡
- ✅ Interface simplifiée
- ✅ Status automatique: COMPTABILISÉ

**Workflow:**
1. Sélection du type de journal
2. Sélection du type de facture (si applicable)
3. Upload du document
4. Analyse IA + **Génération des écritures** + **Enregistrement automatique** ⭐
5. ✅ Terminé ! (Status: COMPTABILISÉ)

**Note importante:** Les écritures comptables SONT enregistrées automatiquement pour les clients avec le status COMPTABILISÉ. Le comptable peut les consulter et les modifier si nécessaire.

---

## 🔑 Différences Clés

| Fonctionnalité | Comptable | Client |
|----------------|-----------|--------|
| Vérification des données | ✅ Oui | ❌ Non |
| Modification manuelle | ✅ Oui | ❌ Non |
| Édition des écritures | ✅ Oui | ❌ Non |
| Enregistrement écritures | ✅ Oui | ✅ Oui (automatique) |
| Enregistrement facture | Manuel | Automatique |
| Status final | COMPTABILISÉ | COMPTABILISÉ |
| Aperçu image | ✅ Oui | ❌ Non |
| Complexité | Élevée | Simple |

---

## 💡 Pourquoi deux versions ?

### Pour les Comptables:
- Besoin de **contrôle total** sur les données
- Vérification de la **conformité comptable**
- Correction des erreurs d'extraction IA
- Ajustement des écritures comptables

### Pour les Clients:
- Expérience **simplifiée et rapide**
- Moins de connaissances comptables requises
- **Gain de temps** avec l'enregistrement automatique
- Interface **intuitive** sans complexité

---

## 🛠️ Maintenance

Si vous devez modifier la logique d'extraction ou d'enregistrement:
- **Logique commune:** Vérifiez les deux fichiers
- **Logique spécifique:** Modifiez uniquement le fichier concerné
- **Tests:** Testez les deux versions après modification

---

## 📦 Dépendances Communes

Les deux modals utilisent:
- `@/lib/cloudinary` - Upload d'images
- `@/lib/gemini` - Extraction IA
- `@/components/ui/*` - Composants UI
- `./journal-type-selection` - Sélection du type de journal
