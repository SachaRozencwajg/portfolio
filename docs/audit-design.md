# Audit design du portfolio

Audit fait avec le skill `redesign-existing-projects` (adapté au site, voir `CLAUDE.md`), le 27 octobre 2026.
Le skill demande un rapport avant toute correction : les points ✅ ont été corrigés, les points ⏳ attendent ta décision.

## ✅ Corrigé

| Thème | Avant | Après |
|---|---|---|
| Police | 3 familles : Space Grotesk (titres), JetBrains Mono (libellés), et Helvetica ou Arial pour le texte hors Apple | **Geist** partout, Geist Mono seulement pour les dates et libellés « moniteur » |
| Italique | Noms de revues en `<em>` italique | Graisse medium, sans italique (règle CSS, résiste à la régénération des publications) |
| Fonds | 9 dégradés : halo radial de l'accueil, bouton, icônes de cartes, carte « featured », rail de la frise… | Fonds unis. Seul dégradé gardé : « Enseignant en IA » dans le titre |
| Tailles de texte | Échelle Apple (17, 19, 22, 28px), titres fluides `clamp()` | Échelle Tailwind (16, 18, 20, 24, 30, 36, 48, 60px), paliers par largeur d'écran |
| Espacements | 20px et 128px hors échelle, logos en 6px/10px | Uniquement 0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96px |
| Arrondis | 20px et 28px | 16px (cartes) et 24px (photo), valeurs Tailwind |
| Animations | Courbes par défaut (`ease`, `ease-in-out`), `transition: all`, 150ms | Une courbe commune `cubic-bezier(0.22,1,0.36,1)`, propriétés ciblées, 200ms minimum |
| Apparition au défilement | 30 à 40px ; décalage de 100ms par carte sans plafond (la 30e publication attendait 3s, et le survol était retardé d'autant) | 32px ; décalage de 80ms plafonné à 400ms, retiré une fois la carte apparue |
| Écouteurs de défilement | 2 `addEventListener('scroll')`, dont un qui ne servait à rien (classe `.scrolled` sans style) | Supprimés. Section courante détectée par `IntersectionObserver` |
| Navigation | Aucune indication de la section courante | Lien actif en couleur accent, avec `aria-current` ; « Conférences » détecté aussi |
| Accessibilité | Pas de lien « aller au contenu », pas d'anneau de focus global, pas de `<main>` | Lien « Aller au contenu » (FR et EN), `:focus-visible` partout, `<main id="contenu">` |
| Contraste | Bouton principal en sombre : texte blanc sur dégradé bleu clair (2,7 à 3,2:1) | Fond `--accent-solid` identique dans les deux thèmes (5,5:1) |
| Lien mort | Clic sur le logo (`href="#"`) : erreur JavaScript, rien ne se passait | Retour en haut de page |
| Boutons | Texte en graisse normale, pas de retour à l'appui | Semibold, `scale(0.98)` à l'appui |
| Mots orphelins | « IA » seul sur la dernière ligne du titre | `text-wrap: balance` sur les titres, `pretty` sur les paragraphes |

## ✅ Deuxième passe (tes choix du 27 octobre)

| # | Point | Ce qui a été fait |
|---|---|---|
| 1 | Phrase révélée | Nouvelle section entre le CV et les Applications IA : les mots s'allument un par un en passant le milieu de l'écran (FR et EN) |
| 2 | Apparition de l'accueil | La page s'ouvre sur le fond seul ; barre, titre ligne par ligne, texte, boutons montent de 6px du flou au net (60ms d'écart), puis la photo et l'onde de pouls |
| 3 | Cartes animées | Chaque visuel raconte son app en boucle, horloge en pause hors écran. EDN-IA : la question est retapée, les référentiels sont interrogés un par un, la réponse sourcée arrive. CareLogbook : un acte arrive en haut de la liste puis le senior le valide. Serious Game : le modèle écrit « 8 g de paracétamol par jour », l'erreur est repérée puis corrigée en « 4 g » |
| 4 | Accent uni | Plus aucun dégradé, y compris sur le titre et l'onde de pouls |
| 5 | Une seule couleur d'accent | Étiquettes, frise du CV, icônes : tout passe sur l'accent. Seul le rouge reste, pour signaler l'erreur du modèle |
| 6 | Mosaïque | EDN-IA en bandeau (visuel à gauche, texte à droite), CareLogbook et Serious Game côte à côte ; une colonne sur mobile |
| 7 | Thème | Suit le réglage du système par défaut ; un menu Système / Clair / Sombre remplace le bouton soleil/lune ; plus de flash clair au chargement en mode sombre |
| 8 | Navigation | Barre compacte qui flotte sous le bord haut ; sous 1024px, menu plein écran dont les liens arrivent un par un, bouton qui se transforme en croix, fermeture par Échap |
| 9 | Icônes | 21 icônes remplacées par Phosphor ; la fusée (cliché) devient une ampoule |
| 10 | Mentions légales | Page `mentions-legales.html` : éditeur, hébergeur, information médicale, propriété intellectuelle, données personnelles, résumé en anglais. Lien dans le pied de page |
| 11 | Nettoyages | Styles en ligne remplacés par des classes, bordure du logo réparée, messages console supprimés |
| 12 | Textes | Meta description et partage réseaux réécrits (FR et EN) ; « une solution intelligente à la fois » retiré du pied de page |

**Faits en plus, parce que nécessaires**
- **Polices hébergées sur le site** (`fonts/`) au lieu de Google Fonts : aucune donnée ne part vers un tiers, ce qui permet à la page de confidentialité de dire « aucun cookie, aucun traceur » sans réserve.
- **Version dans les liens CSS et JS** (`?v=20261027`) : nginx les garde un an en cache ; sans ce numéro, les visiteurs réguliers auraient eu l'ancien CSS avec le nouveau HTML (menu cassé).
- **Vraie page 404** : nginx renvoyait l'accueil pour toute adresse inconnue. La page 404 existait mais n'était jamais servie ; elle est maintenant branchée et mise au nouveau style.

**À vérifier de ton côté**
- **Mentions légales.** Si ton activité de conseil (« Sacha MD & AI Consulting ») est déclarée (micro-entreprise ou société), il faut ajouter la raison sociale, le numéro SIREN et l'adresse professionnelle. L'hébergeur indiqué (Google Cloud EMEA Limited, Dublin) est l'entité habituelle pour Google Cloud en Europe ; à confirmer sur ta facture GCP.
- **nginx.** La nouvelle configuration (404) n'a pas pu être testée ici, faute de Docker. À vérifier après le déploiement : une adresse inconnue doit afficher la page 404, et `/serious-game/` doit toujours fonctionner.
