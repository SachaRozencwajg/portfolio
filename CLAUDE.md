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
- **Identité « Moniteur ».** Fond bleu nuit en sombre (`#0a1020`, `#0d1628`, `#0f1a2c`), accent
  bleu-violet, onde de pouls. On garde cette identité au lieu de la palette sombre neutre des skills.
- **Un seul dégradé** : le texte d'accent du titre d'accueil (`--grad`). Tous les fonds sont unis.
- **Texte blanc sur fond accent** : utiliser `--accent-solid`, jamais `--color-accent` (trop clair en sombre).
- **Ton médical.** Information sobre et factuelle, conforme à la déontologie médicale : pas de
  témoignages de patients, pas de promesse de résultat, pas de vocabulaire publicitaire. Les retours
  d'étudiants ou de partenaires académiques sont possibles.
- **Langue.** Nouveau texte : français d'abord, puis la clé anglaise dans `i18n.js`.

### Vérifier un changement visuel

Servir le dossier (`python3 -m http.server`) et faire des captures Playwright en clair et en sombre,
bureau (1280px) et mobile (390px), avant de pousser.
