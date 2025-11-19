# 🧮 Application de Comptabilité Tunisienne

Application web moderne de gestion comptable conçue pour les comptables et leurs clients en Tunisie. Intègre l'intelligence artificielle pour automatiser la saisie des factures et la génération des écritures comptables.

![Next.js](https://img.shields.io/badge/Next.js-13.5-black)
![React](https://img.shields.io/badge/React-18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.18-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Fonctionnalités Principales

### 📊 Gestion Comptable Complète
- **Journal d'Achat** - Gestion des factures fournisseurs
- **Journal de Vente** - Gestion des factures clients
- **Journal Banque** - Suivi des mouvements bancaires
- **Plan Comptable** - Personnalisable par comptable
- **Écritures Comptables** - Génération automatique en double partie

### 🤖 Intelligence Artificielle
- **Scan de Factures** - Extraction automatique des données avec Google Gemini AI
- **Génération d'Écritures** - Création automatique des écritures comptables
- **Support Multi-formats** - Images (JPG, PNG) et PDF

### 👥 Gestion Multi-utilisateurs
- **Rôle Comptable** - Gestion de plusieurs clients
- **Rôle Client** - Consultation et upload de factures
- **Authentification Sécurisée** - NextAuth.js avec JWT

### 📱 Interface Moderne
- **Design Responsive** - Optimisé pour mobile, tablette et desktop
- **Dashboard Interactif** - Graphiques et statistiques en temps réel
- **Export de Données** - Excel et CSV

### 🇹🇳 Spécificités Tunisiennes
- Taux de TVA tunisiens (7%, 13%, 19%)
- Timbre fiscal
- Plan comptable tunisien
- Formats de factures locaux

---

## 🛠️ Stack Technique

### Frontend
- **Framework:** Next.js 13.5 (App Router)
- **UI Library:** React 18.2
- **Language:** TypeScript 5.2
- **Styling:** Tailwind CSS 3.3
- **Components:** Radix UI, shadcn/ui
- **Icons:** Lucide React
- **Charts:** Recharts 2.15

### Backend
- **API:** Next.js API Routes
- **ORM:** Prisma 6.18
- **Database:** PostgreSQL
- **Authentication:** NextAuth.js 4.24
- **Validation:** Zod 3.25

### Services Externes
- **IA:** Google Gemini AI
- **Storage:** Cloudinary
- **Deployment:** Firebase Hosting / Vercel

---

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### 1. Cloner le Projet
```bash
git clone https://github.com/USERNAME/comptabilite-tunisie.git
cd comptabilite-tunisie
```

### 2. Installer les Dépendances
```bash
npm install
```

### 3. Configuration
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos vraies valeurs
# - DATABASE_URL: URL de votre base PostgreSQL
# - NEXTAUTH_SECRET: Générer avec: openssl rand -base64 32
# - GEMINI_API_KEY: Clé API Google Gemini
# - CLOUDINARY_*: Identifiants Cloudinary
```

### 4. Base de Données
```bash
# Générer le client Prisma
npx prisma generate

# Créer les tables
npx prisma db push

# (Optionnel) Seed avec des données de test
npx prisma db seed
```

### 5. Lancer en Développement
```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 📦 Scripts Disponibles

```bash
npm run dev          # Lancer en mode développement
npm run build        # Build de production
npm run start        # Lancer en production
npm run lint         # Linter le code
npm run typecheck    # Vérifier les types TypeScript

# Déploiement
npm run deploy              # Déployer sur Firebase
npm run deploy:hosting      # Déployer hosting uniquement
npm run firebase:serve      # Tester localement avec Firebase
```

---

## 🌐 Déploiement

### Option 1: Firebase Hosting (Gratuit)
```bash
# Voir le guide complet
cat DEPLOY-FREE.md

# Déploiement rapide
npm run build
firebase deploy --only hosting
```

### Option 2: Vercel
```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel
```

### Option 3: Railway / Render
Connecter votre repo GitHub et déployer automatiquement.

**Documentation complète:**
- `DEPLOY-FREE.md` - Déploiement gratuit
- `DEPLOYMENT-FIREBASE.md` - Guide Firebase complet
- `FIREBASE-PLAN-SOLUTIONS.md` - Solutions pour tous les plans

---

## 📱 Responsive Design

L'application est 100% responsive et optimisée pour:
- 📱 Mobile (< 640px)
- 📱 Tablette (640px - 1024px)
- 💻 Desktop (> 1024px)

Voir `RESPONSIVE-GUIDE.md` pour les détails techniques.

---

## 🏗️ Architecture

```
app/
├── (client)/              # Routes client
│   ├── dashboard/         # Dashboard client
│   └── factures/          # Gestion factures
├── (comptable)/           # Routes comptable
│   ├── dashboard/         # Dashboard comptable
│   ├── clients/           # Gestion clients
│   ├── factures/          # Gestion factures
│   └── ecritures/         # Écritures comptables
├── api/                   # API Routes
│   ├── auth/              # Authentification
│   ├── journal-achat/     # API Journal Achat
│   ├── journal-vente/     # API Journal Vente
│   └── journal-banque/    # API Journal Banque
└── auth/                  # Pages auth

components/
├── layout/                # Layout (Sidebar, Header)
├── modals/                # Modals (Scan, Edit)
├── tables/                # Tableaux
├── charts/                # Graphiques
└── ui/                    # Composants UI (shadcn)

lib/
├── services/              # Services métier
├── validators/            # Validateurs Zod
├── gemini.ts              # Intégration Gemini AI
└── prisma.ts              # Client Prisma

prisma/
└── schema.prisma          # Schéma de base de données
```

---

## 🔐 Sécurité

- ✅ Authentification JWT avec NextAuth.js
- ✅ Validation des données avec Zod
- ✅ Protection CSRF
- ✅ Variables d'environnement sécurisées
- ✅ Sanitization des inputs
- ✅ Rate limiting sur les API

---

## 🤝 Contribution

Les contributions sont les bienvenues!

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👨‍💻 Auteur

**Votre Nom**
- GitHub: [@username](https://github.com/username)
- Email: votre.email@example.com

---

## 🙏 Remerciements

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Google Gemini AI](https://ai.google.dev/)
- [Cloudinary](https://cloudinary.com/)

---

## 📞 Support

Pour toute question ou problème:
- 📧 Email: support@example.com
- 💬 Issues: [GitHub Issues](https://github.com/username/comptabilite-tunisie/issues)
- 📖 Documentation: Voir les fichiers `.md` dans le projet

---

**⭐ Si ce projet vous a aidé, n'hésitez pas à lui donner une étoile!**
