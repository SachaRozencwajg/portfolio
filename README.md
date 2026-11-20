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
mon site » sur Oui ; remplir « Titre en anglais » pour la version anglaise du site. Le titre,
l'événement, le lieu et la date passent sur le site, jamais le contact, l'heure, les notes ni la date
d'envoi des slides. Rien d'autre à faire : le dashboard lance lui-même `portfolioUP --site-only`
2 minutes après le changement, puis envoie une notification (réglable dans Réglages › Site personnel). `portfolioUP` interroge le dashboard sur ce Mac
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
| `/cec/` | Dossier `cec/` : la salle de CEC en 3D, en JavaScript sans compilation | Modifier les fichiers, changer leur `?v=` dans `cec/index.html`, puis déployer |

Le calculateur VentiProtect se modifie dans son propre dépôt, où se trouvent ses tests. Ici, on ne fait que
recopier le fichier. `ventiprotect/og.png` est l'image affichée quand le lien est partagé. Le visuel de la
carte de la page d'accueil a une version par thème du site : `ventiprotect-clair.webp` et `ventiprotect.webp`
(sombre). Ce sont des captures de l'application, dans son thème clair ou sombre, avec les valeurs de son
bouton « Exemple » : quatre indicateurs agrandis sur une grille 2 × 2, en 1200 × 654 px.

### La salle de CEC (`cec/`)

Une page autonome, en français, sans aucune requête vers un autre domaine (sa politique de sécurité
l'interdit) : la bibliothèque 3D est copiée dans le dossier.

| Fichier | Contenu |
|---------|---------|
| `cec/contenu.js` | Le texte : les vues proposées, les 15 fiches, le parcours du sang, le quiz et le scénario « Départ en CEC ». C'est le fichier à modifier pour enrichir le cours. |
| `cec/decor.js` | La salle : murs, plafond, fenêtre, portes, le matériel autour de la machine, la lumière précalculée et l'équipe (poses et textures de chaque personne). |
| `cec/lumiere/` | La lumière précalculée du sol, des murs et du plafond : une image par surface, de jour et de nuit. Fabrication : `scripts/cec/`. |
| `cec/textures/` | Les textures photographiques (sol, tissu des champs, cuir de la table et du tabouret), tirées de Poly Haven (domaine public, CC0). Fabrication : `scripts/cec/textures.py`. |
| `cec/modeles/` | Les personnages : deux modèles articulés (`soignant-a`, `soignant-b` en `.gltf` + `.bin`) et leurs textures WebP. Bibliothèque Rocketbox de Microsoft, licence MIT (`LICENCE-Rocketbox.txt`). Fabrication : `scripts/cec/`. |
| `cec/GLTFLoader.js`, `cec/SkeletonUtils.js` | Chargeur de modèles et copie de squelettes de three.js r128. |
| `cec/salle.js` | La machine cœur-poumon (pompe artérielle à galets ou centrifuge), le circuit, l'état de la salle (`sim`), la caméra, la visite à pied (collisions, plan, joystick) et l'interface. |
| `cec/three.min.js` | three.js r128 (licence MIT), tel que publié sur npm. |
| `cec/theme.js` | Applique le thème choisi sur l'accueil. |
| `cec/index.html` | La page, ses styles et ses textes. `og.jpg` est l'image de partage. |

Le scénario s'ouvre sur une fiche de situation (`patient`, `brief`), puis déroule une liste d'étapes : qui
parle, la question, l'élément à désigner dans la salle (`a`), l'explication, puis, souvent, une question à
réponse unique (`qru` : propositions, bonne réponse, explication), et `fx`, ce qui change dans l'état de la salle (`sim` : cœur battant, ventilation, débit, pompes en marche, gaz, eau).
Les écrans, les pompes et les lignes suivent cet état.

Le réalisme tient à cinq choses :

- **La lumière précalculée.** Les ombres douces et la lumière renvoyée par les surfaces sont calculées une
  fois avec Blender, puis rangées dans les images de `cec/lumiere/`. Le sol, les murs et le plafond les
  relisent : ils n'utilisent ni les lampes ni les ombres de la scène. Si le matériel, l'équipe ou les murs
  changent de place, il faut refaire ce calcul (`scripts/cec/README.md`), puis changer `BAKE.version` dans
  `cec/decor.js`.
- **Les textures photographiques** de `cec/textures/` (sol, tissu, cuir). Les métaux et les plastiques restent
  des textures de détail fabriquées au chargement (grain, stries, traces : `TX` dans `salle.js`).
- **Les reflets de la salle elle-même** (`roomReflections`), refaits quand la lumière est chargée.
- **Les tissus qui tombent en plis** (`drapePanel`).
- **Les personnages**, chargés après la scène ; si leur chargement échoue, des silhouettes simples les
  remplacent.

Une fiche se compose d'un identifiant, d'un point d'ancrage dans la salle (coordonnées en mètres), d'une
vue de caméra et d'un texte HTML. Chaque chiffre d'étude cite sa référence, avec son lien DOI. Après toute
modification d'un script, changer son paramètre `?v=` dans `cec/index.html` (cache d'un an).

Le visuel de la carte de l'accueil : `cec-clair.webp` (la salle de jour) et `cec.webp` (de nuit,
assombrie), vue « Côté perfusionniste » sans l'interface, en 1200 × 654 px.

## Dernière mise à jour

- **Date** : 8 février 2026
- **Domaine personnalisé configuré** : www.sacha-rozencwajg.fr
