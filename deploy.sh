#!/bin/bash

# ============================================
# Script de déploiement pour Cloud Run
# Projet: Portfolio Sacha (portfolio-sacha)
# Service: sacha-md-ai-consulting
# ============================================

set -e

# Ajout du chemin vers gcloud SDK
export PATH="/tmp/google-cloud-sdk/bin:$PATH"

# Configuration
PROJECT_ID="portfolio-sacha"
PROJECT_NUMBER="298603065263"
REGION="europe-west1"
SERVICE_NAME="sacha-md-ai-consulting"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Déploiement de Sacha MD & AI Consulting sur Cloud Run"
echo "==========================================================="
echo "Projet: ${PROJECT_ID} (${PROJECT_NUMBER})"
echo "Service: ${SERVICE_NAME}"
echo "Région: ${REGION}"
echo ""

# Étape 1: Configuration du projet GCP
echo "📌 Étape 1: Configuration du projet GCP..."
gcloud config set project ${PROJECT_ID}

# Étape 2: Activation des APIs nécessaires
echo "📌 Étape 2: Activation des APIs nécessaires..."
gcloud services enable cloudbuild.googleapis.com containerregistry.googleapis.com run.googleapis.com --quiet

# Étape 3: Construction de l'image Docker avec Cloud Build
echo "📌 Étape 3: Construction de l'image Docker..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Étape 4: Déploiement sur Cloud Run
echo "📌 Étape 4: Déploiement sur Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 256Mi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --concurrency 80 \
    --port 8080

# Étape 5: Récupération de l'URL du service
echo ""
echo "✅ Déploiement terminé avec succès!"
echo ""
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
echo "🌐 URL du site: ${SERVICE_URL}"
echo ""
echo "Pour mapper un domaine personnalisé:"
echo "  gcloud run domain-mappings create --service ${SERVICE_NAME} --domain votre-domaine.com --region ${REGION}"
