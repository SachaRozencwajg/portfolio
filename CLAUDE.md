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
- **Identité « Moniteur ».** Fond bleu nuit en sombre (`#0a1020`, `#0d1628`, `#0f1a2c`), onde de
  pouls. On garde cette identité au lieu de la palette sombre neutre des skills.
- **Un seul accent, uni** (`--color-accent`) : aucun dégradé, ni en fond ni sur du texte. Pas de
  deuxième couleur d'accent ; seul le rouge d'erreur (`--color-error`) est permis pour signaler une erreur.
- **Thème** : suit le réglage du système par défaut ; le menu Système / Clair / Sombre l'enregistre.
- **Polices** : Geist et Geist Mono hébergées dans `fonts/` (pas de Google Fonts : la page de
  confidentialité affirme qu'aucune donnée ne part vers un tiers).
- **Icônes** : Phosphor (poids regular), en SVG inline.
- **Texte blanc sur fond accent** : utiliser `--accent-solid`, jamais `--color-accent` (trop clair en sombre).
- **Ton médical.** Information sobre et factuelle, conforme à la déontologie médicale : pas de
  témoignages de patients, pas de promesse de résultat, pas de vocabulaire publicitaire. Les retours
  d'étudiants ou de partenaires académiques sont possibles.
- **Langue.** Nouveau texte : français d'abord, puis la clé anglaise dans `i18n.js`.

### Cache des CSS et JS

nginx sert les `.css` et `.js` avec un cache d'un an (`immutable`). Après toute modification de
`style.css` ou d'un script, changer le paramètre `?v=AAAAMMJJ` de son lien dans `index.html`
(et `404.html`, `mentions-legales.html` pour `style.css`), sinon les visiteurs gardent l'ancienne version.
Un nouveau fichier servi par le site doit aussi être ajouté au `Dockerfile`.

### Vérifier un changement visuel

Servir le dossier (`python3 -m http.server`) et faire des captures Playwright en clair et en sombre,
bureau (1280px) et mobile (390px), avant de pousser.
