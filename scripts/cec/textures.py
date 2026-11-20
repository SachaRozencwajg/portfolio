"""Textures photographiques de la salle de CEC, à partir d'images Poly Haven (CC0, https://polyhaven.com).
Usage : python3 textures.py <dossier des images sources en 1k> <cec/textures>
Sources : linoleum_brown (Diffuse, nor_gl, Rough), crepe_georgette (nor_gl), leather_white (nor_gl, Rough)."""
import sys
import numpy as np
from PIL import Image
SRC, OUT = sys.argv[1], sys.argv[2]
def load(name): return np.asarray(Image.open(f'{SRC}/{name}.jpg').convert('RGB')).astype(np.float32) / 255
def save(a, name, size, quality=82):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).resize((size, size), Image.LANCZOS).save(f'{OUT}/{name}.webp', 'WEBP', quality=quality, method=6)
    print(name, size)

def relief(src, name, size, amp):
    """Carte de relief : ces matières sont presque plates, et leur grain disparaît à la réduction.
    On réduit d'abord, puis on redonne aux pentes une amplitude fixée (écart-type `amp`)."""
    n = np.asarray(Image.open(f'{SRC}/{src}.jpg').convert('RGB').resize((size, size), Image.LANCZOS)).astype(np.float32) / 255
    xy = n[..., :2] * 2 - 1; xy -= xy.mean((0, 1))
    xy *= amp / max(float(xy.std()), 1e-6)
    xy = np.clip(xy, -0.7, 0.7); z = np.sqrt(np.clip(1 - (xy ** 2).sum(-1, keepdims=True), 0, 1))
    save(np.concatenate([xy * 0.5 + 0.5, z * 0.5 + 0.5], -1), name, size, 88)

# Sol : le linoléum est brun. On garde ses mouchetures (écarts à la moyenne) et on les pose sur un gris bleuté clair.
d = load('linoleum_brown_Diffuse'); lum = d.mean(-1, keepdims=True)
detail = (lum - lum.mean()) / max(lum.std(), 1e-6)                      # mouchetures, centrées
chroma = (d - lum) * 0.18                                               # un reste de couleur, très atténué
save(np.array([0.60, 0.63, 0.67], np.float32) + detail * 0.022 + chroma, 'sol-couleur', 1024, 84)
relief('linoleum_brown_nor_gl', 'sol-relief', 1024, 0.035)
r = load('linoleum_brown_Rough').mean(-1, keepdims=True)
save(np.repeat(np.clip(0.44 + (r - r.mean()) * 0.9, 0.2, 0.9), 3, -1), 'sol-rugosite', 512, 80)   # un sol ciré : plutôt brillant
# Champs et tabouret : relief et brillance seulement, la couleur vient de la matière
for src, name, rough, amp in (('crepe_georgette', 'crepe', None, 0.11), ('leather_white', 'cuir', 0.5, 0.085)):
    relief(f'{src}_nor_gl', f'{name}-relief', 512, amp)
    if rough is None: continue                                          # le crêpe est uniformément mat : pas de carte
    r = load(f'{src}_Rough').mean(-1, keepdims=True)
    save(np.repeat(np.clip(rough + (r - r.mean()) * 0.8, 0.15, 1), 3, -1), f'{name}-rugosite', 512, 80)
