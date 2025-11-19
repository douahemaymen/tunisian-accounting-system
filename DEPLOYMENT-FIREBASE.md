# 🚀 Guide de Déploiement Firebase - Application Comptabilité

## 📋 Prérequis

### 1. Compte Firebase
- [ ] Créer un compte sur [Firebase Console](https://console.firebase.google.com/)
- [ ] Créer un nouveau projet Firebase

### 2. Outils Nécessaires
```bash
# Installer Firebase CLI globalement
npm install -g firebase-tools

# Vérifier l'installation
firebase --version
```

---

## 🔧 Étape 1: Configuration Firebase

### 1.1 Connexion à Firebase
```bash
# Se connecter à Firebase
firebase login

# Vérifier la connexion
firebase projects:list
```

### 1.2 Initialiser Firebase dans le projet
```bash
# À la racine du projet
firebase init

# Sélectionner:
# ✅ Hosting: Configure files for Firebase Hosting
# ✅ Functions: Configure a Cloud Functions directory
```

**Réponses aux questions:**
```
? What do you want to use as your public directory? out
? Configure as a single-page app (rewrite all urls to /index.html)? No
? Set up automatic builds and deploys with GitHub? No
? File out/404.html already exists. Overwrite? No
? File out/index.html already exists. Overwrite? No
```

---

## 📦 Étape 2: Configuration Next.js pour Firebase

### 2.1 Installer les dépendances
```bash
npm install --save-dev firebase-tools
```

### 2.2 Créer `firebase.json`
```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### 2.3 Modifier `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Important pour Firebase Hosting
  images: {
    unoptimized: true, // Firebase ne supporte pas l'optimisation d'images Next.js
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Supprimer trailingSlash si présent
  trailingSlash: true,
}

module.exports = nextConfig
```

### 2.4 Créer `.firebaserc`
```json
{
  "projects": {
    "default": "votre-projet-firebase-id"
  }
}
```

---

## ⚠️ Étape 3: Adapter le Code pour Export Statique

### 3.1 Problèmes avec `output: 'export'`

**Fonctionnalités NON supportées:**
- ❌ API Routes (`/api/*`)
- ❌ Server-Side Rendering (SSR)
- ❌ Incremental Static Regeneration (ISR)
- ❌ Image Optimization
- ❌ Middleware

### 3.2 Solutions

#### Option A: Utiliser Firebase Cloud Functions (Recommandé)

**Structure du projet:**
```
project/
├── functions/          # Cloud Functions (API)
│   ├── index.js
│   └── package.json
├── out/               # Build Next.js statique
├── public/
├── app/
└── firebase.json
```

**Créer `functions/package.json`:**
```json
{
  "name": "functions",
  "description": "Cloud Functions for Firebase",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^11.8.0",
    "firebase-functions": "^4.3.1"
  }
}
```

**Créer `functions/index.js`:**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Exemple d'API
exports.api = functions.https.onRequest((req, res) => {
  res.json({ message: "Hello from Firebase!" });
});
```

#### Option B: Utiliser un Backend Externe (Vercel, Railway, etc.)

Déployer uniquement le frontend sur Firebase et garder les API ailleurs.

---

## 🏗️ Étape 4: Build et Déploiement

### 4.1 Build de Production
```bash
# Nettoyer les builds précédents
rm -rf .next out

# Build Next.js en mode export
npm run build

# Vérifier que le dossier 'out' est créé
ls out
```

### 4.2 Test Local
```bash
# Tester localement avec Firebase
firebase serve

# Ou avec un serveur HTTP simple
npx serve out
```

### 4.3 Déploiement
```bash
# Déployer sur Firebase
firebase deploy

# Ou déployer uniquement le hosting
firebase deploy --only hosting

# Ou déployer uniquement les functions
firebase deploy --only functions
```

---

## 🔐 Étape 5: Configuration des Variables d'Environnement

### 5.1 Variables pour le Frontend (Next.js)

**Créer `.env.production`:**
```env
NEXT_PUBLIC_API_URL=https://your-api-url.com
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### 5.2 Variables pour Cloud Functions

```bash
# Définir les variables d'environnement
firebase functions:config:set \
  database.url="your-database-url" \
  gemini.api_key="your-gemini-key" \
  nextauth.secret="your-secret"

# Voir les variables
firebase functions:config:get

# Télécharger les variables localement
firebase functions:config:get > .runtimeconfig.json
```

---

## 📊 Étape 6: Configuration de la Base de Données

### Option 1: Firebase Firestore
```bash
# Activer Firestore dans Firebase Console
# Puis migrer de PostgreSQL vers Firestore
```

### Option 2: Garder PostgreSQL
```bash
# Utiliser une base PostgreSQL externe (Supabase, Neon, etc.)
# Configurer l'URL dans les variables d'environnement
```

---

## 🔄 Étape 7: Scripts de Déploiement Automatique

### 7.1 Ajouter dans `package.json`
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "export": "next build && next export",
    "deploy": "npm run export && firebase deploy",
    "deploy:hosting": "npm run export && firebase deploy --only hosting",
    "deploy:functions": "firebase deploy --only functions"
  }
}
```

### 7.2 Utilisation
```bash
# Déploiement complet
npm run deploy

# Déploiement hosting uniquement
npm run deploy:hosting

# Déploiement functions uniquement
npm run deploy:functions
```

---

## 🚨 Problèmes Courants et Solutions

### 1. Erreur: "API Routes not supported"
**Solution:** Migrer les API vers Cloud Functions ou un backend externe

### 2. Erreur: "Image Optimization not available"
**Solution:** Utiliser `unoptimized: true` dans next.config.js

### 3. Erreur: "getServerSession is not defined"
**Solution:** Utiliser l'authentification côté client uniquement

### 4. Erreur: "Database connection failed"
**Solution:** Vérifier les variables d'environnement et la connexion réseau

### 5. Build trop volumineux
**Solution:** 
```bash
# Analyser le bundle
npm install --save-dev @next/bundle-analyzer

# Optimiser les imports
# Utiliser dynamic imports
```

---

## 📈 Étape 8: Monitoring et Logs

### 8.1 Voir les logs
```bash
# Logs des Cloud Functions
firebase functions:log

# Logs en temps réel
firebase functions:log --only functionName
```

### 8.2 Analytics
```bash
# Activer Firebase Analytics dans la console
# Ajouter le SDK dans votre app
```

---

## 🔒 Étape 9: Sécurité

### 9.1 Règles de sécurité Firebase
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 9.2 CORS
```javascript
// functions/index.js
const cors = require('cors')({ origin: true });

exports.api = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // Votre code ici
  });
});
```

---

## ✅ Checklist de Déploiement

- [ ] Firebase CLI installé
- [ ] Projet Firebase créé
- [ ] `firebase.json` configuré
- [ ] `next.config.js` modifié (output: 'export')
- [ ] Variables d'environnement configurées
- [ ] API migrées vers Cloud Functions ou backend externe
- [ ] Build réussi (`npm run build`)
- [ ] Test local réussi (`firebase serve`)
- [ ] Déploiement réussi (`firebase deploy`)
- [ ] URL de production testée
- [ ] Base de données connectée
- [ ] Authentification fonctionnelle
- [ ] Monitoring activé

---

## 🌐 URLs Importantes

- **Firebase Console:** https://console.firebase.google.com/
- **Hosting URL:** https://your-project.web.app
- **Custom Domain:** Configurable dans Firebase Console
- **Functions URL:** https://us-central1-your-project.cloudfunctions.net/

---

## 📞 Support

- [Documentation Firebase](https://firebase.google.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)

---

**Date:** 2025-01-12
**Version:** 1.0
**Statut:** 📝 Guide complet
