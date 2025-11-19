# 🚀 Démarrage Rapide - Déploiement Firebase

## ⚡ En 5 Minutes

### 1️⃣ Installation Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2️⃣ Configuration du Projet
```bash
# Remplacer 'votre-projet-firebase-id' dans .firebaserc
# Exemple: "mon-app-comptable"
```

### 3️⃣ Déploiement
```bash
# Rendre le script exécutable (Linux/Mac)
chmod +x deploy.sh

# Déployer
./deploy.sh all

# Ou sur Windows
npm run deploy
```

---

## 📝 Commandes Essentielles

```bash
# Connexion
firebase login

# Lister les projets
firebase projects:list

# Initialiser Firebase
firebase init

# Build + Deploy
npm run deploy

# Deploy hosting uniquement
npm run deploy:hosting

# Test local
firebase serve

# Voir les logs
firebase functions:log

# Ouvrir la console
firebase open
```

---

## ⚙️ Configuration Minimale Requise

### 1. Modifier `next.config.js`
```javascript
const nextConfig = {
  output: 'export',  // ← Ajouter cette ligne
  images: {
    unoptimized: true,  // ← Ajouter cette ligne
  },
}
```

### 2. Créer `.env.production`
```env
NEXT_PUBLIC_API_URL=https://your-api.com
NEXTAUTH_URL=https://your-project.web.app
DATABASE_URL=your-database-url
```

### 3. Mettre à jour `.firebaserc`
```json
{
  "projects": {
    "default": "votre-projet-id"  // ← Remplacer
  }
}
```

---

## 🎯 Workflow de Déploiement

```
1. Développement local
   ↓
2. npm run build (test)
   ↓
3. firebase serve (test local)
   ↓
4. ./deploy.sh all
   ↓
5. Vérifier sur https://your-project.web.app
```

---

## ⚠️ Points Importants

### ❌ Ne PAS déployer si:
- Les API routes (`/api/*`) sont utilisées
- SSR est activé
- Variables d'environnement manquantes

### ✅ Avant de déployer:
- [ ] Build réussi localement
- [ ] Variables d'environnement configurées
- [ ] `.firebaserc` mis à jour
- [ ] Test avec `firebase serve`

---

## 🆘 Problèmes Courants

### Erreur: "Project not found"
```bash
# Vérifier le projet ID
firebase projects:list

# Mettre à jour .firebaserc
```

### Erreur: "Build failed"
```bash
# Nettoyer et rebuild
rm -rf .next out node_modules
npm install
npm run build
```

### Erreur: "Permission denied"
```bash
# Sur Linux/Mac
chmod +x deploy.sh

# Sur Windows
npm run deploy
```

---

## 📞 Aide

- **Documentation complète:** `DEPLOYMENT-FIREBASE.md`
- **Firebase Console:** https://console.firebase.google.com/
- **Support Firebase:** https://firebase.google.com/support

---

**Temps estimé:** 5-10 minutes
**Difficulté:** ⭐⭐☆☆☆
