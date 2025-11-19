#!/bin/bash

# Script de déploiement Firebase
# Usage: ./deploy.sh [hosting|functions|all]

set -e

echo "🚀 Démarrage du déploiement Firebase..."

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier que Firebase CLI est installé
if ! command -v firebase &> /dev/null; then
    log_error "Firebase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g firebase-tools"
    exit 1
fi

# Vérifier la connexion Firebase
log_info "Vérification de la connexion Firebase..."
if ! firebase projects:list &> /dev/null; then
    log_error "Non connecté à Firebase"
    echo "Connectez-vous avec: firebase login"
    exit 1
fi

# Type de déploiement
DEPLOY_TYPE=${1:-all}

# Fonction pour build Next.js
build_nextjs() {
    log_info "Nettoyage des builds précédents..."
    rm -rf .next out

    log_info "Build de l'application Next.js..."
    npm run build

    if [ ! -d "out" ]; then
        log_error "Le dossier 'out' n'a pas été créé"
        exit 1
    fi

    log_info "Build Next.js terminé avec succès"
}

# Fonction pour déployer le hosting
deploy_hosting() {
    log_info "Déploiement du hosting Firebase..."
    firebase deploy --only hosting

    log_info "Hosting déployé avec succès"
}

# Fonction pour déployer les functions
deploy_functions() {
    if [ -d "functions" ]; then
        log_info "Déploiement des Cloud Functions..."
        firebase deploy --only functions
        log_info "Functions déployées avec succès"
    else
        log_warning "Dossier 'functions' non trouvé, skip"
    fi
}

# Exécution selon le type
case $DEPLOY_TYPE in
    hosting)
        build_nextjs
        deploy_hosting
        ;;
    functions)
        deploy_functions
        ;;
    all)
        build_nextjs
        deploy_hosting
        deploy_functions
        ;;
    *)
        log_error "Type de déploiement invalide: $DEPLOY_TYPE"
        echo "Usage: ./deploy.sh [hosting|functions|all]"
        exit 1
        ;;
esac

# Récupérer l'URL du projet
PROJECT_ID=$(firebase projects:list | grep "default" | awk '{print $2}')
HOSTING_URL="https://${PROJECT_ID}.web.app"

echo ""
log_info "🎉 Déploiement terminé avec succès!"
echo ""
echo "📱 URL de l'application: ${HOSTING_URL}"
echo ""
echo "Commandes utiles:"
echo "  - Voir les logs: firebase functions:log"
echo "  - Ouvrir la console: firebase open"
echo "  - Rollback: firebase hosting:rollback"
echo ""
