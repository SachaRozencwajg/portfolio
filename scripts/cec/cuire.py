"""Lumière précalculée de la salle de CEC.

Blender (Cycles) éclaire la scène exportée par exporter-scene.js et range, pour le sol, les quatre murs et le plafond,
la lumière reçue (directe et renvoyée par les autres surfaces, sans la couleur de la surface) dans une image par surface :
<sortie>/<sol|plafond|mur-0..3>-<jour|nuit>.webp. La page les relit comme cartes de lumière (cec/decor.js).

Usage : python cuire.py <scene.json> <cec/lumiere> [--essai] [--brut <dossier>] [--reprendre]
  --essai      calcul rapide, au tiers de la définition
  --brut       garde le calcul brut dans ce dossier (.npy)
  --reprendre  ne recalcule pas : refait seulement les images à partir du brut (pour régler REFERENCE ou le lissage)
Dépendances : bpy (Blender en module Python), numpy, pillow. Voir scripts/cec/README.md.
"""
import base64
import json
import math
import sys
import time

import bpy
import numpy as np
from mathutils import Vector
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
ESSAI = '--essai' in sys.argv
BRUT = sys.argv[sys.argv.index('--brut') + 1] if '--brut' in sys.argv else None
REPRENDRE = '--reprendre' in sys.argv and BRUT

# Taille des cartes, en pixels : environ 105 px par mètre au sol, 93 sur les murs
TAILLES = {'sol': (1152, 944), 'plafond': (704, 576), 'mur-0': (1024, 280), 'mur-1': (840, 280), 'mur-2': (840, 280), 'mur-3': (1024, 280)}
TEINTES = {'sol': (0.32, 0.36, 0.41), 'plafond': (0.87, 0.88, 0.89)}        # couleur des surfaces, pour la lumière qu'elles renvoient
MUR = (0.88, 0.89, 0.87)
ECHANTILLONS = 48 if ESSAI else 144

# Sources de lumière. Les valeurs sont relatives : l'ensemble est ramené à une même échelle à la fin (REFERENCE).
PLAFONNIER = ((1.0, 0.97, 0.92), 11.0)     # dalles lumineuses
FLUX = ((1.0, 0.98, 0.95), 2.6)            # plafond soufflant, au-dessus de la table
CIEL = ((0.78, 0.87, 1.0), 4.0)            # le jour : la vue derrière la fenêtre éclaire comme un ciel couvert
CIEL_NUIT = ((0.25, 0.35, 0.7), 0.05)
SOLEIL = ((1.0, 0.92, 0.80), 1.4, (-0.34, -0.60, -0.72), math.radians(7))   # couleur, puissance, direction, diamètre apparent
SCIALYTIQUES = [((-2.15, 2.24, -0.95), (-2.02, 1.22, -1.3)), ((-1.85, 2.32, -1.75), (-2.0, 1.22, -1.25))]   # position, cible (repère de la page)
SCIALYTIQUE = ((1.0, 0.97, 0.93), 260.0)
# Échelle commune au jour et à la nuit : cette valeur de lumière devient le blanc de l'image.
# Dans la page, BAKE.intensity (cec/decor.js) redonne l'éclat voulu.
REFERENCE = 1.0


def blender(p):
    """Repère de la page (y vers le haut) vers celui de Blender (z vers le haut)."""
    return Vector((p[0], -p[2], p[1]))


def tableau(texte, genre, largeur):
    return np.frombuffer(base64.b64decode(texte), genre).reshape(-1, largeur)


def matiere(nom, couleur=None, emission=None, vers='Z'):
    m = bpy.data.materials.new(nom)
    m.use_nodes = True
    n, l = m.node_tree.nodes, m.node_tree.links
    n.clear()
    sortie = n.new('ShaderNodeOutputMaterial')
    if emission:
        # une dalle n'éclaire que vers le bas (la vitre, que vers la salle) : sinon elle brûlerait ce qu'elle touche
        e = n.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*emission[0], 1)
        g = n.new('ShaderNodeNewGeometry'); s = n.new('ShaderNodeSeparateXYZ'); bas = n.new('ShaderNodeMath'); f = n.new('ShaderNodeMath')
        bas.operation = 'LESS_THAN'; bas.inputs[1].default_value = 0.0
        f.operation = 'MULTIPLY'; f.inputs[1].default_value = emission[1]
        l.new(g.outputs['Incoming'], s.inputs[0]); l.new(s.outputs[vers], bas.inputs[0]); l.new(bas.outputs[0], f.inputs[0])
        l.new(f.outputs[0], e.inputs['Strength']); l.new(e.outputs[0], sortie.inputs['Surface'])
    else:
        d = n.new('ShaderNodeBsdfDiffuse'); d.inputs['Color'].default_value = (*couleur, 1)
        l.new(d.outputs[0], sortie.inputs['Surface'])
    return m


def objet(g, mat):
    pos, idx = tableau(g['pos'], np.float32, 3), tableau(g['idx'], np.uint32, 3)
    co = np.stack([pos[:, 0], -pos[:, 2], pos[:, 1]], 1)
    me = bpy.data.meshes.new(g['name'])
    me.from_pydata(co.tolist(), [], idx.tolist())
    if g.get('uv'):
        uv = tableau(g['uv'], np.float32, 2)
        me.uv_layers.new(name='lumiere').data.foreach_set('uv', uv[idx.ravel()].ravel())
    me.materials.append(mat)
    o = bpy.data.objects.new(g['name'], me)
    bpy.context.scene.collection.objects.link(o)
    return o


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = ECHANTILLONS
scene.cycles.use_adaptive_sampling = False
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 5
scene.cycles.caustics_reflective = scene.cycles.caustics_refractive = False
scene.cycles.sample_clamp_indirect = 4.0
cibles = {}
for g in json.load(open(SRC))['groupes']:
    if g['kind'] == 'cible':
        nom = g['name'][len('coque-'):]
        o = objet(g, matiere(nom, TEINTES.get(nom, MUR)))
        l, h = TAILLES[nom]
        if ESSAI: l, h = l // 3, h // 3
        img = bpy.data.images.new(nom, l, h, alpha=False, float_buffer=True)
        t = o.active_material.node_tree.nodes.new('ShaderNodeTexImage'); t.image = img
        o.active_material.node_tree.nodes.active = t          # c'est dans cette image que Blender range la lumière
        cibles[nom] = (o, img)
    elif g['kind'] == 'lum-plafonnier': objet(g, matiere('plafonnier', emission=PLAFONNIER))
    elif g['kind'] == 'lum-flux': objet(g, matiere('flux', emission=FLUX))
    elif g['kind'] == 'lum-vitre':
        vitre = objet(g, matiere('vitre', emission=CIEL, vers='Y'))
        vitre.visible_shadow = False                           # le soleil la traverse
    elif g['kind'] == 'lum-scialytique': pass                  # remplacés par deux projecteurs, plus bas
    else: objet(g, matiere(g['name'], [min(c, 0.9) for c in g['color']]))

for i, (pos, cible) in enumerate(SCIALYTIQUES):
    lampe = bpy.data.lights.new(f'scialytique-{i}', 'SPOT')
    lampe.color, lampe.energy = SCIALYTIQUE
    lampe.spot_size, lampe.spot_blend, lampe.shadow_soft_size = math.radians(52), 0.85, 0.22
    o = bpy.data.objects.new(lampe.name, lampe)
    d = (blender(cible) - blender(pos)).normalized()
    o.location = blender(pos) + d * 0.07
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    scene.collection.objects.link(o)

monde = bpy.data.worlds.new('dehors'); monde.use_nodes = True
monde.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0      # la salle est close : tout le jour vient de la vitre
scene.world = monde
soleil = bpy.data.lights.new('soleil', 'SUN')
soleil.color, soleil.angle = SOLEIL[0], SOLEIL[3]
so = bpy.data.objects.new('soleil', soleil)
so.rotation_euler = Vector(SOLEIL[2]).normalized().to_track_quat('-Z', 'Y').to_euler()
scene.collection.objects.link(so)


def cuire(nuit):
    ciel = CIEL_NUIT if nuit else CIEL
    n = vitre.active_material.node_tree.nodes
    n['Emission'].inputs['Color'].default_value = (*ciel[0], 1)
    [x for x in n if x.type == 'MATH' and x.operation == 'MULTIPLY'][0].inputs[1].default_value = ciel[1]
    soleil.energy = 0.0 if nuit else SOLEIL[1]
    so.hide_render = nuit
    cartes = {}
    for nom, (o, img) in cibles.items():
        t0 = time.time()
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=6, use_clear=True)
        a = np.empty(img.size[0] * img.size[1] * 4, np.float32); img.pixels.foreach_get(a)
        cartes[nom] = a.reshape(img.size[1], img.size[0], 4)[::-1, :, :3].copy()      # première ligne en haut, comme une image
        print(f'{nom}-{"nuit" if nuit else "jour"} : {time.time() - t0:.0f} s, médiane {np.median(cartes[nom]):.2f}, maximum {cartes[nom].max():.2f}', flush=True)
    return cartes


def lisser(a, passes=3, seuil=0.3):
    """Filtre « à trous » : il lisse le grain du calcul sans effacer le bord des ombres.
    À chaque passe, un pixel se mélange à ses voisins de plus en plus lointains, sauf à ceux dont l'éclat diffère trop."""
    noyau = np.array([1, 4, 6, 4, 1], np.float32) / 16
    h, l = a.shape[:2]
    for p in range(passes):
        pas = 2 ** p
        lum = a.mean(-1, keepdims=True)
        g = np.pad(lum, ((1, 1), (1, 1), (0, 0)), mode='edge')            # le repère des bords : l'éclat, un peu flouté
        lum = sum(g[1 + dy:1 + dy + h, 1 + dx:1 + dx + l] * (0.25 if (dx, dy) == (0, 0) else 0.125 if 0 in (dx, dy) else 0.0625) for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        m = 2 * pas
        ap, lp = np.pad(a, ((m, m), (m, m), (0, 0)), mode='edge'), np.pad(lum, ((m, m), (m, m), (0, 0)), mode='edge')
        somme, poids = np.zeros_like(a), np.zeros_like(lum)
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                y, x = m + dy * pas, m + dx * pas
                ecart = (lp[y:y + h, x:x + l] - lum) / (lum + 0.03)
                w = noyau[dy + 2] * noyau[dx + 2] * np.exp(-(ecart / (seuil * 0.7 ** p)) ** 2)
                somme += ap[y:y + h, x:x + l] * w; poids += w
        a = somme / poids
    return a


def srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * np.power(a, 1 / 2.4) - 0.055)


for nuit in (False, True):
    moment = 'nuit' if nuit else 'jour'
    cartes = {nom: np.load(f'{BRUT}/{nom}-{moment}.npy') for nom in TAILLES} if REPRENDRE else cuire(nuit)
    for nom, a in cartes.items():
        if BRUT and not REPRENDRE: np.save(f'{BRUT}/{nom}-{moment}.npy', a)
        img = Image.fromarray((srgb(lisser(a) / REFERENCE) * 255 + 0.5).astype(np.uint8))
        img.save(f'{OUT}/{nom}-{moment}.webp', 'WEBP', quality=90, method=6)
