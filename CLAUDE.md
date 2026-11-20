# Portfolio de Sacha Rozencwajg

Site statique (HTML, CSS, JS vanilla) servi par nginx sur Cloud Run. Voir `README.md` pour le déploiement.
Le site est bilingue : tout texte visible a sa traduction anglaise dans `i18n.js` (attribut `data-i18n`).

## Design

Trois skills de design sont installés dans `.claude/skills/` (source : elayadesign, licence MIT) :

| Skill | Quand l'utiliser |
|---|---|
| `redesign-existing-projects` | Améliorer une section existante du site. Point d'entrée par défaut. |
| `landing-page-design` | Créer une **page dédiée** (offre de formation IA, conseil). Sa partie A (conversion) ne s'applique pas à la page d'accueil, qui sert plusieurs intentions. |
| `design-to-motion` | Animer les cartes Applications IA, ou exporter un GIF ou MP4 d'une app. |

Les valeurs propres à ce site sont dans la section « Design values » de
`.claude/skills/redesign-existing-projects/SKILL.md`. En cas de conflit, les adaptations ci-dessous
priment sur le texte d'origine des skills.

### Adaptations pour ce site

- **Tirets en français.** Les mots composés et noms propres gardent leur trait d'union
  (Anesthésiste-Réanimateur, Paris-Saclay, Bichat–Claude Bernard). La règle « pas de tirets » vise
  seulement les tirets utilisés comme ponctuation : préférer virgule, deux-points ou point.
- **Identité.** Fond bleu nuit en sombre (`#0a1020`, `#0d1628`, `#0f1a2c`), au lieu de la palette
  sombre neutre des skills. Une seule animation de signature : l'objet en particules de l'accueil
  (`particles.js` : cœur, poumons, réseau de neurones), dans l'accent du site.
- **Sobriété.** Le nom est le titre de la page, le métier son sous-titre. Titres de section à gauche,
  contenu à droite, un filet entre les sections, un seul fond. Des listes à filets (`.rows`, `.pub`)
  plutôt que des cartes : seules les applications sont des cartes. Un seul bouton plein par page.
- **Croquis.** Cinq dessins au crayon (`dessin-*.webp`, fond transparent) : graphite gris et accent
  indigo, des objets du métier, aucun patient. En sombre, le CSS les inverse en craie
  (`--sketch-filter`). Pas plus d'un croquis par section, aucun dans l'accroche ni les applications.
- **Un seul accent, uni** (`--color-accent`) : aucun dégradé, ni en fond ni sur du texte. Pas de
  deuxième couleur d'accent ; seul le rouge d'erreur (`--color-error`) est permis pour signaler une erreur.
  Exception : les aperçus des apps dans la mosaïque Applications IA gardent les couleurs de chaque
  app (EDN-IA bordeaux, CareLogbook vert), pour qu'on les distingue du texte de la page.
  Un aperçu en image suit le thème du site : une version claire et une sombre (classes `only-light`
  et `only-dark`), pour ne pas poser un bloc sombre au milieu d'une page claire.
- **Thème** : suit le réglage du système par défaut ; le menu Système / Clair / Sombre l'enregistre.
- **Polices** : Geist et Geist Mono hébergées dans `fonts/` (pas de Google Fonts : la page de
  confidentialité affirme qu'aucune donnée ne part vers un tiers). Geist Mono est réservée aux
  données : dates, années, domaines, libellés de groupe.
- **Icônes** : Phosphor (poids regular), en SVG inline.
- **Texte blanc sur fond accent** : utiliser `--accent-solid`, jamais `--color-accent` (trop clair en sombre).
- **Ton médical.** Information sobre et factuelle, conforme à la déontologie médicale : pas de
  témoignages de patients, pas de promesse de résultat, pas de vocabulaire publicitaire. Les retours
  d'étudiants ou de partenaires académiques sont possibles.
- **Langue.** Nouveau texte : français d'abord, puis la clé anglaise dans `i18n.js`. Une date se
  met dans un `<time datetime>` : sa version anglaise est calculée, sans clé.
- **Publications.** La liste d'`index.html` est générée par `cloud-function/publications_html.py`
  à partir de `.agent/publications.json` : changer le gabarit là, jamais à la main dans la page.
- **Conférences.** Même principe : données dans `data/conferences.json` (à la main) et
  `data/conferences-dashboard.json` (copie des présentations cochées « Afficher sur mon site » dans
  MyDashboard, faite par `portfolioUP` ; le dashboard lance lui-même `portfolioUP --site-only` quand
  cette liste change), rendu par `scripts/conferences.py`. Leur traduction anglaise
  est portée par l'attribut `data-en`, sans clé dans `i18n.js`. Ne jamais y mettre les coordonnées
  d'un organisateur.

### Salle de CEC (`cec/`)

Page autonome en français, voir `README.md`. Le contenu pédagogique est dans `cec/contenu.js`. Ton médical
sobre ; tout chiffre d'étude cite sa référence (DOI), aucun chiffre écrit de mémoire. Aucune marque de matériel
dans les textes. Aucune requête externe : la politique de sécurité de `cec/index.html` l'interdit.
Les scripts de `cec/` suivent la même règle de cache : changer leur `?v=` dans `cec/index.html`.

### Cache des CSS et JS

nginx sert les `.css` et `.js` avec un cache d'un an (`immutable`). Après toute modification de
`style.css` ou d'un script, changer le paramètre `?v=AAAAMMJJ` de son lien (ajouter une lettre pour un deuxième changement le même jour) dans `index.html`
(et `404.html`, `mentions-legales.html` pour `style.css`), sinon les visiteurs gardent l'ancienne version.
Un nouveau fichier servi par le site doit aussi être ajouté au `Dockerfile`.

### Vérifier un changement visuel

Servir le dossier (`python3 -m http.server`) et faire des captures Playwright en clair et en sombre,
bureau (1280px) et mobile (390px), avant de pousser.
