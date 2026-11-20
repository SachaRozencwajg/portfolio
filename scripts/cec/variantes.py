"""Variantes de textures des deux soignants (bibliothèque Rocketbox, licence MIT) :
casaque stérile et gants à partir du tablier, pyjamas de bloc de deux couleurs, trois teints, calots.
Les cartes de relief d'origine (convention DirectX) sont retournées pour le web (convention OpenGL)."""
import numpy as np
from PIL import Image, ImageFilter
import sys
SRC, OUT = sys.argv[1], sys.argv[2]

def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.float32) / 255
def save(a, name, size):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).resize((size, size), Image.LANCZOS).save(f'{OUT}/{name}.png')
def to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; mx = a.max(-1); mn = a.min(-1); d = mx - mn
    h = np.zeros_like(mx); m = d > 1e-6
    rc = np.where(m, (mx - r) / np.where(m, d, 1), 0); gc = np.where(m, (mx - g) / np.where(m, d, 1), 0); bc = np.where(m, (mx - b) / np.where(m, d, 1), 0)
    h = np.where(mx == r, bc - gc, np.where(mx == g, 2 + rc - bc, 4 + gc - rc)); h = (h / 6) % 1
    return np.where(m, h, 0) * 360, np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0), mx
def to_rgb(h, s, v):
    h = (h / 360) % 1; i = np.floor(h * 6); f = h * 6 - i; p = v * (1 - s); q = v * (1 - f * s); t = v * (1 - (1 - f) * s); i = i.astype(int) % 6
    return np.stack([np.choose(i, [v, q, p, p, t, v]), np.choose(i, [t, v, v, q, p, p]), np.choose(i, [p, p, t, v, v, q])], -1)
def grid(a): H, W = a.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]; return xx / W, yy / H
def soft(mask, r=2): return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255
def mix(a, b, m): return a * (1 - m[..., None]) + b * m[..., None]
def blur(a, r): return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255

def recolor(a, mask, hue, sat, val, flat=0.0):
    """Change la teinte du tissu en gardant ses plis ; « flat » rapproche les liserés sombres du reste."""
    h, s, v = to_hsv(a)
    if flat: v = v + (np.median(v[mask > 0.5]) - v) * flat * (v < np.median(v[mask > 0.5]))
    return mix(a, to_rgb(np.full_like(h, hue), np.clip(s * sat, 0, 1), np.clip(v * val, 0, 1)), mask)

def tone(a, mul, protect):
    """Teint : assombrit la peau et les cheveux, sauf les yeux et l'intérieur de la bouche."""
    out = a * np.array(mul, np.float32)
    return mix(out, a, protect)

# ---------- corps ----------
def body(prefix, folder):
    a = load(f'{SRC}/{folder}/{prefix}_body_color.png'); x, y = grid(a); h, s, v = to_hsv(a)
    side = (x < 0.285) | (x > 0.70)
    green = soft(((h > 130) & (h < 190) & (s > 0.25) & (v > 0.04)).astype(np.float32))
    blue = soft(((h >= 190) & (h < 250) & (s > 0.25) & (v > 0.04)).astype(np.float32))
    skin = soft((side & (y > 0.6) & (h < 50) & (s > 0.16) & (v > 0.2)).astype(np.float32))
    return a, x, y, side, green, blue, skin, v

a, x, y, side, green, blue, skin, v = body('m162', 'Medical_Male_04')
# pyjama vert pâle (d'origine, adouci) et pyjama bleu avec un teint mat sur les avant-bras
save(recolor(a, green, 158, 0.6, 1.2), 'corps-a-vert', 1024)
bleu = recolor(a, green, 214, 0.62, 1.16)
save(mix(bleu, bleu * np.array([0.78, 0.69, 0.62], np.float32), skin), 'corps-a-bleu', 1024)

a, x, y, side, green, blue, skin, v = body('m163', 'Medical_Male_05')
GOWN = (203, 0.5, 0.86)                      # bleu de casaque, moins vif que le tablier d'origine
top = green * ((~side) | ((y > 0.44) & (y < 0.63))).astype(np.float32)        # haut du pyjama et manches courtes : même tissu que la casaque
g = recolor(a, np.clip(blue, 0, 1), GOWN[0], 0.52, GOWN[2], flat=0.7)
g = recolor(g, top, GOWN[0], 0.5, 1.5)
g = recolor(g, green * (1 - top), 158, 0.55, 1.1)                               # pantalon : vert de bloc
# avant-bras : manches longues de la casaque ; mains : gants
cloth = np.array(to_rgb(np.array(GOWN[0]), np.array(0.36), np.array(0.62)), np.float32)
lum = blur(a, 6).mean(-1); lum = lum / max(1e-6, np.median(lum[skin > 0.5]))
sleeve = cloth[None, None, :] * (0.82 + 0.18 * np.clip(lum, 0.6, 1.3))[..., None]
rng = np.random.default_rng(3); folds = blur(np.repeat(rng.random((a.shape[0] // 24 + 1, 1)), 24, 0)[: a.shape[0]].repeat(a.shape[1], 1)[..., None].repeat(3, -1), 10)[..., 0]
sleeve = sleeve * (0.9 + 0.2 * folds)[..., None]
glove = np.array([0.90, 0.87, 0.78], np.float32)[None, None, :] * np.clip(0.55 + 0.5 * a.mean(-1) / max(1e-6, np.median(a.mean(-1)[skin > 0.5])), 0.5, 1.12)[..., None]
wrist = np.clip((y - 0.775) / 0.012, 0, 1)                                       # le gant recouvre le poignet de la manche
g = mix(g, mix(sleeve, glove, wrist), skin)
save(g, 'corps-b-casaque', 1024)

# ---------- têtes ----------
for prefix, folder, k in (('m162', 'Medical_Male_04', 'a'), ('m163', 'Medical_Male_05', 'b')):
    a = load(f'{SRC}/{folder}/{prefix}_head_color.png'); x, y = grid(a)
    keep = soft((((x < 0.2) & (y > 0.6)) | ((x < 0.37) & (y > 0.82))).astype(np.float32), 4)
    save(a, f'tete-{k}-clair', 1024)
    save(tone(a, (0.80, 0.71, 0.64), keep), f'tete-{k}-mat', 1024)
    if k == 'b': save(tone(a, (0.50, 0.40, 0.35), keep), f'tete-{k}-fonce', 1024)

# ---------- calots et masques ----------
def cap(prefix, folder, name, hue=None, sat=1.0, val=1.0):
    a = load(f'{SRC}/{folder}/{prefix}_protection_color.png'); x, y = grid(a); h, s, v = to_hsv(a)
    if hue is not None:
        m = soft(((y < 0.66) & ~((x > 0.6) & (y > 0.6)) & (v > 0.05)).astype(np.float32))
        a = mix(a, to_rgb(np.full_like(h, hue), np.clip(np.maximum(s, 0.12) * sat, 0, 1), np.clip(v * val, 0, 1)), m)
    save(a, name, 512)
cap('m162', 'Medical_Male_04', 'coiffe-a-vert')
cap('m162', 'Medical_Male_04', 'coiffe-a-bleu', 218, 1.5, 0.82)
cap('m163', 'Medical_Male_05', 'coiffe-b-bleu')
cap('m163', 'Medical_Male_05', 'coiffe-b-vert', 160, 2.2, 0.9)
cap('m163', 'Medical_Male_05', 'coiffe-b-mauve', 262, 1.6, 0.86)

# ---------- reliefs : canal vert retourné ; avant-bras de la casaque aplanis ----------
for prefix, folder, k in (('m162', 'Medical_Male_04', 'a'), ('m163', 'Medical_Male_05', 'b')):
    for part, name, size in (('body', 'corps', 1024), ('head', 'tete', 1024), ('protection', 'coiffe', 512)):
        n = load(f'{SRC}/{folder}/{prefix}_{part}_normal.png'); n[..., 1] = 1 - n[..., 1]
        if k == 'b' and part == 'body':
            n = mix(n, np.array([0.5, 0.5, 1.0], np.float32)[None, None, :] * np.ones_like(n), skin * 0.8)
        save(n, f'{name}-{k}-relief', size)
print('ok')
