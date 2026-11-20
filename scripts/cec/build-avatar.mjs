// Prépare les soignants pour le web : géométrie articulée en .gltf + .bin, textures en WebP à part (aucune donnée embarquée).
// Usage : node build-avatar.mjs <dossier des .glb bruts> <dossier des textures préparées> <dossier de sortie>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';
import sharp from 'sharp';
import fs from 'fs';
const [conv, stage, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
// toutes les textures : couleur en qualité 82, relief en qualité 88
for (const f of fs.readdirSync(stage).filter((f) => f.endsWith('.png'))) {
  await sharp(`${stage}/${f}`).webp({ quality: f.includes('relief') ? 88 : 82, effort: 6 }).toFile(`${out}/${f.replace('.png', '.webp')}`);
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const WEBP = ALL_EXTENSIONS.find((e) => e.EXTENSION_NAME === 'EXT_texture_webp');
const PARTS = { body: 'corps', head: 'tete', protection: 'coiffe' };
for (const [k, folder, prefix, defaults] of [['a', 'Medical_Male_04', 'm162', { body: 'corps-a-vert', head: 'tete-a-clair', protection: 'coiffe-a-vert' }], ['b', 'Medical_Male_05', 'm163', { body: 'corps-b-casaque', head: 'tete-b-clair', protection: 'coiffe-b-bleu' }]]) {
  const doc = await io.read(`${conv}/${folder}/${folder}-raw.glb`);
  const root = doc.getRoot();
  root.listTextures().forEach((t) => t.dispose());
  const tex = (name) => doc.createTexture(name).setImage(fs.readFileSync(`${out}/${name}.webp`)).setMimeType('image/webp').setURI(`${name}.webp`);
  for (const m of root.listMaterials()) {
    const part = m.getName().replace(prefix + '_', '');
    m.setBaseColorTexture(tex(defaults[part])).setNormalTexture(tex(`${PARTS[part]}-${k}-relief`));
    m.setMetallicFactor(0).setRoughnessFactor(part === 'head' ? 0.6 : 0.88).setName(PARTS[part]);
  }
  for (const mesh of root.listMeshes()) { mesh.setName('soignant-' + k); for (const p of mesh.listPrimitives()) if (p.getAttribute('COLOR_0')) p.setAttribute('COLOR_0', null); }
  doc.createExtension(WEBP).setRequired(true);
  root.getAsset().copyright = 'Microsoft Rocketbox Avatar Library, (c) 2020 Microsoft, licence MIT';
  await doc.transform(prune(), dedup());
  root.listBuffers()[0].setURI(`soignant-${k}.bin`);
  await io.write(`${out}/soignant-${k}.gltf`, doc);
}
let total = 0;
for (const f of fs.readdirSync(out).sort()) { const s = fs.statSync(`${out}/${f}`).size; total += s; console.log(f.padEnd(26), (s / 1024).toFixed(0).padStart(5), 'Ko'); }
console.log('total', (total / 1024 / 1024).toFixed(2), 'Mo');
