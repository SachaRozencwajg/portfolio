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
portfolioUP --function-only       # uniquement la Cloud Function
```

`portfolioUP` récupère `main`, régénère la liste des publications et celle des conférences, lance `./deploy.sh`
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

## Ajouter une conférence

**Depuis MyDashboard (le plus simple).** Dans Topos, ouvrir la présentation et régler « Afficher sur
mon site » sur Oui ; remplir « Titre en anglais » pour la version anglaise du site. Au prochain
`portfolioUP`, le titre, l'événement, le lieu et la date passent sur le site, jamais le contact,
l'heure, les notes ni la date d'envoi des slides. `portfolioUP` interroge le dashboard sur ce Mac
(`http://127.0.0.1:3000`, ou `DASHBOARD_URL`) et en garde une copie dans `data/conferences-dashboard.json`.
S'il ne répond pas, la dernière copie est gardée. Pour retirer une conférence du site, régler la case
sur Non.

**À la main.** Les conférences plus anciennes et les cours récurrents sont dans `data/conferences.json`.
Pour en ajouter une, copier un bloc existant et le remplir (le fichier peut se modifier directement
sur GitHub, depuis un téléphone) :

```json
{
  "date": "2027-06-17",
  "titre": "L'impact de l'IA sur la médecine périopératoire",
  "evenement": "Soirée de conférence de l'Institut Lorrain d'Anesthésie-Réanimation",
  "lieu": "Nancy",
  "en": { "titre": "The impact of AI on perioperative medicine" }
}
```

Puis lancer `portfolioUP`, qui régénère la liste et déploie. La date s'écrit `AAAA-MM-JJ`, `AAAA-MM`
ou `AAAA` ; une conférence datée du jour ou plus tard est rangée dans « À venir ». Le bloc `en`
est facultatif : un champ absent reprend le français. Une conférence présente des deux côtés (même
date, même titre) est prise dans `data/conferences.json`, ce qui permet d'en soigner le texte.

## Applications servies dans un sous-dossier

| Adresse | Source | Mise à jour |
|---------|--------|-------------|
| `/serious-game/` | Dossier `serious-game/` (React), construit par le `Dockerfile` | Modifier le code, puis déployer |
| `/ventiprotect/` | Dossier `ventiprotect/` : un seul fichier HTML, copie de `web/index.html` du dépôt [VentiProtect_ARDS](https://github.com/SachaRozencwajg/VentiProtect_ARDS) | Recopier le fichier depuis ce dépôt, puis déployer |

Le calculateur VentiProtect se modifie dans son propre dépôt, où se trouvent ses tests. Ici, on ne fait que
recopier le fichier. `ventiprotect/og.png` est l'image affichée quand le lien est partagé. Le visuel de la
carte de la page d'accueil a une version par thème du site : `ventiprotect-clair.webp` et `ventiprotect.webp`
(sombre). Ce sont des captures de l'application, dans son thème clair ou sombre, avec les valeurs de son
bouton « Exemple » : quatre indicateurs agrandis sur une grille 2 × 2, en 1200 × 654 px.

## Dernière mise à jour

- **Date** : 8 février 2026
- **Domaine personnalisé configuré** : www.sacha-rozencwajg.fr
