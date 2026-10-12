# Sacha MD & AI Consulting - Portfolio

Site portfolio personnel de Sacha Rozencwajg, Anesthésiste-Réanimateur & Enseignant en IA.

## 🌐 URL de production

**https://www.sacha-rozencwajg.fr**

## Hébergement

- **Plateforme** : Google Cloud Run
- **Projet GCP** : `portfolio-sacha` (ID: 298603065263)
- **Région** : europe-west1
- **Service** : sacha-md-ai-consulting
- **URL Cloud Run** : https://sacha-md-ai-consulting-298603065263.europe-west1.run.app

## Déploiement

### En une commande : `portfolioUP`

```bash
./scripts/portfolioUP --install   # une seule fois : ajoute l'alias dans ~/.zshrc
portfolioUP                       # depuis n'importe où dans le terminal
portfolioUP --site-only           # sans redéployer la Cloud Function
```

`portfolioUP` récupère `main`, régénère la liste des publications, lance `./deploy.sh`
(Cloud Run), redéploie la Cloud Function des publications (configuration conservée)
puis vérifie que le site répond.

### Manuellement

Pour déployer une nouvelle version :

```bash
./deploy.sh
```

Le script effectue automatiquement :
1. Configuration du projet GCP
2. Activation des APIs nécessaires
3. Build de l'image Docker via Cloud Build
4. Déploiement sur Cloud Run

## Stack technique

- **Frontend** : HTML, CSS, JavaScript (vanilla)
- **Serveur** : nginx:alpine
- **Conteneur** : Docker
- **CI/CD** : Google Cloud Build
- **Hébergement** : Google Cloud Run

## Fichiers de déploiement

| Fichier | Description |
|---------|-------------|
| `Dockerfile` | Image Docker basée sur nginx:alpine |
| `nginx.conf` | Configuration nginx (gzip, cache, sécurité) |
| `deploy.sh` | Script de déploiement automatisé |

## Dernière mise à jour

- **Date** : 8 février 2026
- **Domaine personnalisé configuré** : www.sacha-rozencwajg.fr
