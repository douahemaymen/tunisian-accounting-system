#!/bin/bash

# Script de déploiement Firebase Hosting UNIQUEMENT (Plan Gratuit)
# Usage: ./deploy-hosting-only.sh

set -e

echo "🚀 Déploiement Firebase Hosting (Plan Gratuit)..."

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_step() {
    echo -e "${BLUE}▶${NC} $1"
}

# Vérifier Firebase CLI
if ! command -v firebase &> /dev/null; then
    log_error "Firebase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g firebase-tools"
    exit 1
fi

# Vérifier la connexion
log_step "Vérification de la connexion Firebase..."
if ! firebase projects:list &> /dev/null; then
    log_error "Non connecté à Firebase"
    echo "Connectez-vous avec: firebase login"
    exit 1
fi
log_info "Connecté à Firebase"

# Vérifier next.config.js
log_step "Vérification de la configuration Next.js..."
if ! grep -q "output.*export" next.config.js 2>/dev/null; then
    log_warning "next.config.js ne contient pas 'output: export'"
    echo ""
    echo "Ajoutez cette ligne dans next.config.js:"
    echo "  output: 'export',"
    echo ""
    read -p "Voulez-vous continuer quand même? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Nettoyer les builds précédents
log_step "Nettoyage des builds précédents..."
rm -rf .next out
log_info "Nettoyage terminé"

# Build Next.js
log_step "Build de l'application Next.js..."
npm run build

if [ ! -d "out" ]; then
    log_error "Le dossier 'out' n'a pas été créé"
    echo ""
    echo "Vérifiez que next.config.js contient:"
    echo "  output: 'export',"
    exit 1
fi
log_info "Build réussi"

# Vérifier la taille du build
BUILD_SIZE=$(du -sh out | cut -f1)
log_info "Taille du build: $BUILD_SIZE"

# Utiliser la config hosting-only si elle existe
if [ -f "firebase-hosting-only.json" ]; then
    log_step "Utilisation de firebase-hosting-only.json..."
    cp firebase.json firebase.json.backup 2>/dev/null || true
    cp firebase-hosting-only.json firebase.json
fi

# Déployer
log_step "Déploiement sur Firebase Hosting..."
firebase deploy --only hosting

# Restaurer firebase.json si backup existe
if [ -f "firebase.json.backup" ]; then
    mv firebase.json.backup firebase.json
fi

# Récupérer l'URL
PROJECT_ID=$(firebase projects:list 2>/dev/null | grep "default" | awk '{print $2}' || echo "your-project")
HOSTING_URL="https://${PROJECT_ID}.web.app"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "🎉 Déploiement réussi!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 URL de l'application:"
echo "   ${HOSTING_URL}"
echo ""
echo "🔗 URL alternative:"
echo "   https://${PROJECT_ID}.firebaseapp.com"
echo ""
echo "📊 Commandes utiles:"
echo "   firebase hosting:channel:list    # Voir les canaux"
echo "   firebase hosting:rollback        # Annuler le déploiement"
echo "   firebase open hosting            # Ouvrir dans le navigateur"
echo ""
echo "💡 Note: Vous êtes sur le plan GRATUIT (Spark)"
echo "   - Pas de Cloud Functions"
echo "   - Hosting statique uniquement"
echo "   - 10 GB de stockage"
echo "   - 360 MB/jour de transfert"
echo ""
