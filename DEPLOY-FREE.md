# 🆓 Déploiement GRATUIT sur Firebase

## ✅ Solution 100% Gratuite (Plan Spark)

Déployez votre application **sans carte bancaire** en 3 étapes!

---

## 🚀 Déploiement en 3 Étapes

### 1️⃣ Préparer le Projet

**Modifier `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // ← AJOUTER CETTE LIGNE
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
```

### 2️⃣ Remplacer firebase.json

```bash
# Utiliser la config hosting-only
cp firebase-hosting-only.json firebase.json
```

**Ou modifier manuellement `firebase.json`:**
```json
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 3️⃣ Déployer

```bash
# Build + Deploy
npm run build
firebase deploy --only hosting

# Ou utiliser le script
chmod +x deploy-hosting-only.sh
./deploy-hosting-only.sh
```

---

## 🎯 Commandes Rapides

```bash
# Installation Firebase CLI
npm install -g firebase-tools

# Connexion
firebase login

# Build
npm run build

# Déployer
firebase deploy --only hosting

# Voir l'URL
firebase open hosting
```

---

## ✅ Ce qui est Inclus (GRATUIT)

- ✅ **10 GB** de stockage
- ✅ **360 MB/jour** de transfert (≈ 10 GB/mois)
- ✅ **SSL gratuit** (HTTPS)
- ✅ **CDN global** (rapide partout)
- ✅ **Domaine personnalisé** gratuit
- ✅ **Rollback** (retour en arrière)
- ✅ **Preview channels** (environnements de test)

---

## ❌ Ce qui N'est PAS Inclus

- ❌ Cloud Functions (nécessite plan Blaze)
- ❌ API Backend sur Firebase
- ❌ Server-Side Rendering (SSR)
- ❌ API Routes Next.js (`/api/*`)

---

## 💡 Solutions pour les API

### Option 1: API Externes Gratuites

**Vercel (Recommandé):**
```bash
# Déployer les API sur Vercel
npm install -g vercel
vercel

# Mettre à jour .env.production
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

**Railway:**
- Créer un compte sur railway.app
- Connecter votre repo GitHub
- Déploiement automatique

**Render:**
- Créer un compte sur render.com
- Créer un Web Service
- Gratuit: 750h/mois

### Option 2: Utiliser des Services Backend

**Supabase (PostgreSQL + API):**
- https://supabase.com
- Gratuit: 500 MB database
- API auto-générée

**Firebase Firestore:**
- Base de données NoSQL
- Inclus dans le plan gratuit
- Pas besoin de Cloud Functions

---

## 📊 Architecture Recommandée (Gratuite)

```
┌─────────────────────────────────┐
│  Firebase Hosting               │
│  - Frontend Next.js              │
│  - Static Export                 │
│  https://your-app.web.app        │
└────────────┬────────────────────┘
             │
             ↓ API Calls
┌─────────────────────────────────┐
│  Vercel / Railway               │
│  - API Routes                    │
│  - Backend Logic                 │
│  https://your-api.vercel.app     │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  Supabase / Neon                │
│  - PostgreSQL Database           │
│  - Gratuit: 500 MB               │
└─────────────────────────────────┘
```

**Coût total: 0€/mois** 🎉

---

## 🔧 Troubleshooting

### Erreur: "out directory not found"
```bash
# Vérifier next.config.js
# Doit contenir: output: 'export'

# Rebuild
rm -rf .next out
npm run build
```

### Erreur: "API routes not supported"
```bash
# Normal avec output: 'export'
# Solution: Déployer les API ailleurs (Vercel, Railway)
```

### Erreur: "Image optimization not available"
```bash
# Ajouter dans next.config.js:
images: {
  unoptimized: true,
}
```

---

## 📈 Limites du Plan Gratuit

| Ressource | Limite Gratuite | Suffisant pour |
|-----------|-----------------|----------------|
| Stockage | 10 GB | ✅ Petits/moyens projets |
| Transfert | 360 MB/jour | ✅ ~1000 visiteurs/jour |
| Builds | Illimité | ✅ Tous projets |
| SSL | Inclus | ✅ Tous projets |
| Domaines | Illimité | ✅ Tous projets |

---

## 🎓 Exemple Complet

### 1. Configuration
```javascript
// next.config.js
module.exports = {
  output: 'export',
  images: { unoptimized: true },
}
```

### 2. Build
```bash
npm run build
# Vérifie que le dossier 'out' existe
ls out
```

### 3. Deploy
```bash
firebase deploy --only hosting
```

### 4. Résultat
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project
Hosting URL: https://your-project.web.app
```

---

## ✅ Checklist

- [ ] Firebase CLI installé
- [ ] Connecté avec `firebase login`
- [ ] `next.config.js` avec `output: 'export'`
- [ ] `firebase.json` sans section `functions`
- [ ] Build réussi (`npm run build`)
- [ ] Dossier `out/` créé
- [ ] Déployé avec `firebase deploy --only hosting`
- [ ] URL testée et fonctionnelle

---

## 🆘 Besoin d'Aide?

**Problème de plan Blaze?**
→ Lisez `FIREBASE-PLAN-SOLUTIONS.md`

**Besoin d'API?**
→ Utilisez Vercel (gratuit)

**Besoin de base de données?**
→ Utilisez Supabase (gratuit)

---

## 🎉 Félicitations!

Votre application est maintenant en ligne **gratuitement** sur:
- https://your-project.web.app
- https://your-project.firebaseapp.com

**Prochaines étapes:**
1. Configurer un domaine personnalisé (gratuit)
2. Activer les analytics (gratuit)
3. Configurer les preview channels (gratuit)

---

**Temps total:** 5-10 minutes
**Coût:** 0€
**Difficulté:** ⭐☆☆☆☆
