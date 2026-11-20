# Personnages de la salle de CEC

Les soignants de `cec/modeles/` viennent de la
[Microsoft Rocketbox Avatar Library](https://github.com/microsoft/Microsoft-Rocketbox) (licence MIT) :
`Medical_Male_04` (pyjama de bloc, calot, masque) et `Medical_Male_05` (tablier, recoloré en casaque stérile
avec gants). Ce dossier garde les scripts qui les ont préparés, pour pouvoir les refaire ou en ajouter.

1. Télécharger, pour chaque personnage, `Assets/Avatars/Professions/<nom>/Export/<nom>.fbx` et les `.tga`
   de son dossier `Textures/`, puis convertir les `.tga` en `.png` dans `<travail>/<nom>/`.
2. Convertir la géométrie : `FBX2glTF --binary --input <nom>.fbx --output <nom>-raw` (paquet npm `fbx2gltf`).
3. Fabriquer les variantes de textures : `python3 variantes.py <travail> <travail>/stage`
   (casaque et gants, pyjamas vert et bleu, trois teints, calots, cartes de relief retournées).
4. Écrire les fichiers du site : `node build-avatar.mjs <travail> <travail>/stage cec/modeles`
   (paquets npm `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions`, `sharp`).

Les poses ne sont pas dans les fichiers : `cec/decor.js` les applique au chargement, os par os
(tableau `POSES`), et choisit les textures de chaque personne (tableau `TEAM`).
