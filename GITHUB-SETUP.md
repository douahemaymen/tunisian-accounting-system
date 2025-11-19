# 🐙 Guide GitHub - Mise en Ligne du Projet

## 🚀 Commandes Complètes

### Étape 1: Créer un fichier .gitignore

```bash
# Créer .gitignore pour exclure les fichiers sensibles
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
.vercel
.netlify

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local
.env.development
.env.production
.env.test

# Vercel
.vercel

# Typescript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Firebase
.firebase/
.firebaserc
firebase-debug.log
firestore-debug.log
ui-debug.log

# Prisma
prisma/migrations/

# Logs
logs/
*.log

# OS
Thumbs.db
EOF
```

### Étape 2: Initialiser Git

```bash
# Initialiser le dépôt Git
git init

# Ajouter tous les fichiers (sauf ceux dans .gitignore)
git add .

# Créer le premier commit
git commit -m "Initial commit: Application de comptabilité tunisienne"
```

### Étape 3: Créer un Dépôt sur GitHub

**Option A: Via le site web (Recommandé)**
1. Aller sur https://github.com
2. Cliquer sur le bouton "+" en haut à droite
3. Sélectionner "New repository"
4. Remplir:
   - Repository name: `comptabilite-tunisie` (ou votre nom)
   - Description: "Application de gestion comptable tunisienne avec Next.js"
   - Visibilité: Public ou Private
   - ❌ NE PAS cocher "Initialize with README"
5. Cliquer sur "Create repository"

**Option B: Via GitHub CLI**
```bash
# Installer GitHub CLI (si pas déjà fait)
# Windows: winget install GitHub.cli
# Mac: brew install gh
# Linux: voir https://cli.github.com/

# Se connecter
gh auth login

# Créer le dépôt
gh repo create comptabilite-tunisie --public --source=. --remote=origin --push
```

### Étape 4: Lier et Pousser vers GitHub

```bash
# Ajouter le dépôt distant (remplacer USERNAME par votre nom d'utilisateur)
git remote add origin https://github.com/USERNAME/comptabilite-tunisie.git

# Vérifier le remote
git remote -v

# Pousser vers GitHub
git branch -M main
git push -u origin main
```

---

## 📋 Commandes Complètes (Copier-Coller)

```bash
# 1. Créer .gitignore
cat > .gitignore << 'EOF'
node_modules/
.next/
out/
.env
.env*.local
.DS_Store
.vercel
.firebase/
EOF

# 2. Initialiser Git
git init
git add .
git commit -m "Initial commit: Application de comptabilité tunisienne"

# 3. Créer le dépôt sur GitHub (via le site web)
# Puis revenir ici

# 4. Lier et pousser (REMPLACER USERNAME)
git remote add origin https://github.com/USERNAME/comptabilite-tunisie.git
git branch -M main
git push -u origin main
```

---

## 🔐 Sécurité: Fichiers à NE PAS Pousser

### ⚠️ IMPORTANT: Vérifier avant de pousser

```bash
# Vérifier que ces fichiers sont bien ignorés
git status

# Ces fichiers NE DOIVENT PAS apparaître:
# ❌ .env
# ❌ .env.local
# ❌ .env.production (avec vraies clés)
# ❌ node_modules/
# ❌ .next/
# ❌ out/
```

### 🔒 Créer un .env.example (sans vraies valeurs)

```bash
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Firebase (optionnel)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EOF

# Ajouter .env.example au dépôt
git add .env.example
git commit -m "Add .env.example"
git push
```

---

## 📝 Créer un README.md

```bash
cat > README.md << 'EOF'
# 🧮 Application de Comptabilité Tunisienne

Application web de gestion comptable pour les comptables et leurs clients en Tunisie.

## 🚀 Fonctionnalités

- ✅ Gestion des factures (Achat, Vente, Banque)
- ✅ Scan intelligent de factures avec IA (Gemini)
- ✅ Génération automatique d'écritures comptables
- ✅ Plan comptable tunisien
- ✅ Gestion multi-clients
- ✅ Dashboard responsive (mobile-friendly)
- ✅ Export Excel/CSV

## 🛠️ Technologies

- **Frontend:** Next.js 13.5, React 18, TypeScript
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth.js
- **UI:** Tailwind CSS, Radix UI, shadcn/ui
- **IA:** Google Gemini AI
- **Charts:** Recharts
- **Storage:** Cloudinary

## 📦 Installation

```bash
# Cloner le projet
git clone https://github.com/USERNAME/comptabilite-tunisie.git
cd comptabilite-tunisie

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos vraies valeurs

# Générer Prisma Client
npx prisma generate

# Lancer en développement
npm run dev
```

## 🌐 Déploiement

Voir les guides de déploiement:
- `DEPLOY-FREE.md` - Déploiement gratuit sur Firebase
- `DEPLOYMENT-FIREBASE.md` - Guide complet Firebase
- `FIREBASE-PLAN-SOLUTIONS.md` - Solutions pour tous les plans

## 📱 Responsive

L'application est 100% responsive et optimisée pour mobile.
Voir `RESPONSIVE-GUIDE.md` pour les détails.

## 📄 Licence

MIT

## 👨‍💻 Auteur

Votre Nom
EOF

git add README.md
git commit -m "Add README.md"
git push
```

---

## 🔄 Commandes Git Utiles

### Commandes de Base

```bash
# Voir le statut
git status

# Ajouter des fichiers
git add .                    # Tous les fichiers
git add fichier.txt          # Un fichier spécifique

# Commit
git commit -m "Message"

# Pousser vers GitHub
git push

# Récupérer les changements
git pull

# Voir l'historique
git log --oneline

# Créer une branche
git checkout -b nouvelle-branche

# Changer de branche
git checkout main

# Fusionner une branche
git merge nouvelle-branche
```

### Annuler des Changements

```bash
# Annuler les modifications non commitées
git checkout -- fichier.txt

# Annuler le dernier commit (garder les changements)
git reset --soft HEAD~1

# Annuler le dernier commit (supprimer les changements)
git reset --hard HEAD~1

# Annuler un push (ATTENTION: dangereux)
git push --force
```

---

## 🚨 Si vous avez déjà poussé des fichiers sensibles

### Supprimer .env du dépôt

```bash
# Supprimer .env du tracking Git
git rm --cached .env

# Commit
git commit -m "Remove .env from tracking"

# Pousser
git push

# Vérifier que .env est dans .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to .gitignore"
git push
```

### Nettoyer l'historique (si .env contenait des secrets)

```bash
# ATTENTION: Ceci réécrit l'historique!
# Tous les collaborateurs devront re-cloner

# Installer BFG Repo-Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/

# Supprimer .env de tout l'historique
bfg --delete-files .env

# Nettoyer
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push --force
```

**⚠️ Après avoir nettoyé:**
1. Changer TOUTES les clés API exposées
2. Régénérer les secrets
3. Mettre à jour les variables d'environnement

---

## 📊 Structure du Projet sur GitHub

```
comptabilite-tunisie/
├── .github/
│   └── workflows/          # GitHub Actions (CI/CD)
├── app/                    # Next.js App Router
├── components/             # Composants React
├── lib/                    # Utilitaires
├── prisma/                 # Schéma Prisma
├── public/                 # Assets statiques
├── .gitignore             # Fichiers ignorés
├── .env.example           # Template variables
├── README.md              # Documentation
├── package.json           # Dépendances
└── next.config.js         # Config Next.js
```

---

## 🎯 Workflow Recommandé

### Développement

```bash
# 1. Créer une branche pour une nouvelle fonctionnalité
git checkout -b feature/nouvelle-fonctionnalite

# 2. Développer et commiter régulièrement
git add .
git commit -m "Add: nouvelle fonctionnalité"

# 3. Pousser la branche
git push -u origin feature/nouvelle-fonctionnalite

# 4. Créer une Pull Request sur GitHub

# 5. Après merge, revenir sur main
git checkout main
git pull
```

### Releases

```bash
# Créer un tag pour une version
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0

# Voir tous les tags
git tag -l
```

---

## 🔗 Liens Utiles

- **GitHub Desktop:** https://desktop.github.com/ (Interface graphique)
- **GitHub CLI:** https://cli.github.com/ (Ligne de commande)
- **Git Documentation:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com/

---

## ✅ Checklist

- [ ] `.gitignore` créé
- [ ] `.env` dans `.gitignore`
- [ ] `.env.example` créé (sans vraies valeurs)
- [ ] `README.md` créé
- [ ] Dépôt GitHub créé
- [ ] Premier commit fait
- [ ] Code poussé sur GitHub
- [ ] Vérifier qu'aucun fichier sensible n'est visible
- [ ] Clés API changées si exposées

---

**Votre projet est maintenant sur GitHub!** 🎉

URL: https://github.com/USERNAME/comptabilite-tunisie
