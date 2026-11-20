# Fabrication de la salle de CEC

Trois choses se préparent hors ligne : les personnages, les textures photographiques et la lumière.

## Personnages

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

## Textures photographiques

Le sol, le tissu des champs et le cuir de la table viennent de [Poly Haven](https://polyhaven.com) (domaine
public, CC0) : `linoleum_brown` (Diffuse, nor_gl, Rough), `crepe_georgette` (nor_gl) et `leather_white`
(nor_gl, Rough), en 1k, format JPG.

    python3 textures.py <dossier des images> cec/textures

Le script reteinte le linoléum en gris, redonne du relief aux matières presque plates et écrit les WebP.
Après un changement, augmenter `PHOTO_VERSION` dans `cec/salle.js`.

## Lumière précalculée

Les ombres douces et la lumière renvoyée par les surfaces sont calculées par Blender (moteur Cycles), puis
rangées dans une image par surface : `cec/lumiere/<sol|plafond|mur-0..3>-<jour|nuit>.webp`.
À refaire quand du matériel, une personne ou un mur change de place.

1. Servir le site en local : `python3 -m http.server 8770` à la racine du dépôt.
2. Exporter la scène telle qu'elle s'affiche (matériel, équipe en pose) :
   `node exporter-scene.js http://127.0.0.1:8770/cec/ scene.json` (paquet npm `playwright`).
3. Calculer : `python cuire.py scene.json cec/lumiere --brut <dossier>` avec un Python qui a `bpy`
   (`pip install bpy numpy pillow`, Python 3.13 pour bpy 5). Compter une demi-heure sur quatre processeurs ;
   `--essai` donne un aperçu en une minute.
4. Changer `BAKE.version` dans `cec/decor.js`, pour que les visiteurs reçoivent les nouvelles images.

Les réglages sont en tête de `cuire.py` : puissance des dalles, du ciel, du soleil et des scialytiques, taille
des images. `REFERENCE` fixe l'échelle des images et `BAKE.intensity` (`cec/decor.js`) l'éclat dans la page :
`--reprendre` refait les images à partir du calcul brut, sans tout recalculer.

Dans la page, un objet ne reçoit pas la carte de lumière s'il n'est pas le sol, un mur ou le plafond. Ce qui
ne doit pas compter dans le calcul (zones de clic, repères au sol) porte `userData.horsLumiere`. Les sources
sont repérées par leur nom : `lum-plafonnier`, `lum-flux`, `lum-vitre`, `lum-scialytique`.
