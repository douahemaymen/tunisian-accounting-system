# ⚡ Commandes GitHub - Copier-Coller

## 🚀 Mise en Ligne en 5 Minutes

### Étape 1: Initialiser Git (2 min)

```bash
# Initialiser le dépôt
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit: Application de comptabilité tunisienne"
```

### Étape 2: Créer le Dépôt sur GitHub (1 min)

**Via le site web:**
1. Aller sur https://github.com/new
2. Repository name: `comptabilite-tunisie`
3. Description: "Application de gestion comptable tunisienne"
4. Visibilité: **Public** ou **Private**
5. ❌ **NE PAS** cocher "Add a README file"
6. Cliquer sur **"Create repository"**

### Étape 3: Lier et Pousser (2 min)

```bash
# REMPLACER 'USERNAME' par votre nom d'utilisateur GitHub
git remote add origin https://github.com/USERNAME/comptabilite-tunisie.git

# Pousser vers GitHub
git branch -M main
git push -u origin main
```

---

## ✅ C'est Fait!

Votre projet est maintenant sur GitHub:
**https://github.com/USERNAME/comptabilite-tunisie**

---

## 🔄 Commandes Quotidiennes

### Sauvegarder vos changements

```bash
# Voir les fichiers modifiés
git status

# Ajouter tous les changements
git add .

# Créer un commit
git commit -m "Description des changements"

# Pousser vers GitHub
git push
```

### Récupérer les changements

```bash
# Récupérer les dernières modifications
git pull
```

---

## 🌿 Travailler avec des Branches

```bash
# Créer une nouvelle branche
git checkout -b feature/nouvelle-fonctionnalite

# Voir toutes les branches
git branch

# Changer de branche
git checkout main

# Pousser la branche
git push -u origin feature/nouvelle-fonctionnalite

# Fusionner une branche
git checkout main
git merge feature/nouvelle-fonctionnalite
git push
```

---

## 🔧 Commandes Utiles

```bash
# Voir l'historique
git log --oneline

# Annuler les modifications non commitées
git checkout -- .

# Annuler le dernier commit (garder les changements)
git reset --soft HEAD~1

# Voir les différences
git diff

# Voir les remotes
git remote -v
```

---

## 🚨 En Cas de Problème

### Erreur: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/comptabilite-tunisie.git
```

### Erreur: "failed to push"
```bash
# Récupérer d'abord les changements
git pull origin main --rebase
git push
```

### Erreur: "Permission denied"
```bash
# Vérifier votre authentification GitHub
# Utiliser un Personal Access Token au lieu du mot de passe
```

---

## 📝 Template de Messages de Commit

```bash
# Nouvelle fonctionnalité
git commit -m "feat: Ajouter scan de factures avec IA"

# Correction de bug
git commit -m "fix: Corriger le calcul de TVA"

# Amélioration
git commit -m "refactor: Optimiser les requêtes database"

# Documentation
git commit -m "docs: Mettre à jour le README"

# Style/Format
git commit -m "style: Améliorer le responsive mobile"

# Tests
git commit -m "test: Ajouter tests pour les écritures"
```

---

## 🎯 Workflow Recommandé

```bash
# 1. Créer une branche pour chaque fonctionnalité
git checkout -b feature/nom-fonctionnalite

# 2. Développer et commiter régulièrement
git add .
git commit -m "Description"

# 3. Pousser la branche
git push -u origin feature/nom-fonctionnalite

# 4. Créer une Pull Request sur GitHub

# 5. Après merge, revenir sur main
git checkout main
git pull
```

---

## 🔐 Vérifier la Sécurité

```bash
# Vérifier que .env n'est PAS dans le dépôt
git ls-files | grep .env

# Si .env apparaît, le supprimer:
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

---

## 📊 Statistiques du Projet

```bash
# Nombre de commits
git rev-list --count HEAD

# Nombre de lignes de code
git ls-files | xargs wc -l

# Contributeurs
git shortlog -sn

# Derniers commits
git log --oneline -10
```

---

## 🆘 Aide Rapide

```bash
# Aide générale
git help

# Aide sur une commande spécifique
git help commit
git help push
git help branch
```

---

## ✅ Checklist Avant de Pousser

- [ ] `git status` - Vérifier les fichiers
- [ ] `.env` n'apparaît PAS dans la liste
- [ ] `node_modules/` n'apparaît PAS
- [ ] Code testé localement
- [ ] Message de commit clair
- [ ] Pas de console.log() oubliés
- [ ] Pas de TODO non résolus critiques

---

**Prêt à coder!** 🚀

Pour plus de détails, voir `GITHUB-SETUP.md`
