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

## ⏳ À décider (étape 3 et suivantes)

**Nouveautés prévues**
1. **Phrase révélée au défilement** : une grande phrase dont les mots s'allument un par un (par exemple « Je fais le lien entre la médecine clinique et l'IA »).
2. **Apparition du haut de page** : chaque élément monte de 6px et passe du flou au net, l'un après l'autre en 1,2s (`design-to-motion`).
3. **Cartes Applications IA animées** : chaque carte « raconte » son app en boucle, et un GIF peut en être exporté pour LinkedIn (`design-to-motion`).

**Points que le skill signale, mais qui touchent ton identité**
4. **Dégradé bleu vers violet** : le skill le qualifie d'« empreinte IA la plus courante ». Il ne reste plus que sur le titre. On le garde ou on passe en accent uni ?
5. **Plusieurs couleurs d'accent** : étiquettes vertes et violettes, trois couleurs pour la frise. Le skill en veut une seule.
6. **Trois cartes égales en ligne** (Applications IA) : c'est la mise en page « IA générique » selon le skill. Il propose une grille asymétrique ou en mosaïque.
7. **Bouton thème soleil et lune** : le skill préfère suivre le réglage du système, avec un menu. Je le garderais : il est discret et pratique.

**Navigation et finitions**
8. **Barre de navigation flottante** (détachée du haut, centrée) et **menu mobile plein écran** avec liens qui arrivent un par un.
9. **Icônes** : les SVG actuels sont dans le style Feather, que le skill déconseille ; le remplacement serait Phosphor.
10. **Mentions légales** : aucune page ni lien. Elles sont obligatoires en France pour un site à visée professionnelle (éditeur, hébergeur). À ajouter dans le pied de page.
11. **Petits nettoyages** : 3 styles écrits directement dans `index.html`, bordure de la photo du logo qui pointe vers une variable inexistante (`--color-primary`, donc invisible), messages `console.log` d'accueil.
12. **Texte** : « Solutions intelligentes » dans la meta description est du vocabulaire creux selon le skill. Une formulation plus concrète serait meilleure.
