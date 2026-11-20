// Exporte la salle de CEC telle qu'elle s'affiche (matériel, équipe en pose, salle) pour le calcul de lumière.
// Usage : node exporter-scene.js <adresse de la page> <scene.json>
// La page doit être servie en local (python3 -m http.server). Voir scripts/cec/README.md.
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const [url, out] = process.argv.slice(2);
    if (!url || !out) { console.error('Usage : node exporter-scene.js <adresse de la page> <scene.json>'); process.exit(1); }
    const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(url);
    // la scène est prête quand les cinq personnages sont chargés
    await page.waitForFunction(() => {
        const w = window.SALLE && window.SALLE.world; if (!w || !w.decor) return false;
        let n = 0; w.scene.traverse((o) => { if (o.isSkinnedMesh) n++; }); return n >= w.decor.people.length;
    }, null, { timeout: 60000 });
    await page.waitForTimeout(1500);

    const data = await page.evaluate(() => {
        const T = window.THREE, world = window.SALLE.world, scene = world.scene;
        world.decor.walls.forEach((w) => { w.g.visible = true; });          // les murs cachés devant la caméra comptent aussi
        scene.updateMatrixWorld(true);
        const groups = new Map(), v = new T.Vector3();
        const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible || (p.userData && p.userData.horsLumiere)) return false; return true; };
        scene.traverse((o) => {
            if (!o.isMesh || !shown(o)) return;
            const mat = Array.isArray(o.material) ? o.material[0] : o.material;
            if (!mat || mat.visible === false) return;
            const pos = o.geometry.attributes.position; if (!pos) return;
            const name = o.name || '';
            let kind = 'objet', key, color = [mat.color.r, mat.color.g, mat.color.b];
            if (name.indexOf('coque-') === 0) { kind = 'cible'; key = name; }            // sol, murs, plafond : ils reçoivent la carte
            else if (name.indexOf('lum-') === 0) { kind = name; key = name; }            // plafonniers, flux, vitre, scialytiques
            else {
                if (mat.transparent && mat.opacity < 0.6) return;                        // le verre ne fait pas d'ombre
                if (mat.map) color = color.map((c) => c * 0.55);                         // matière imagée : une teinte moyenne suffit
                key = 'objet-' + color.map((c) => Math.round(c * 15)).join('-');         // regroupé par teinte
            }
            let g = groups.get(key);
            if (!g) { g = { name: key, kind, color, pos: [], idx: [], uv: [], n: 0 }; groups.set(key, g); }
            const uv = kind === 'cible' ? o.geometry.attributes.uv2 : null;
            for (let i = 0; i < pos.count; i++) {
                if (o.isSkinnedMesh) o.boneTransform(i, v); else v.fromBufferAttribute(pos, i);     // le personnage dans sa pose
                v.applyMatrix4(o.matrixWorld);
                g.pos.push(v.x, v.y, v.z);
                if (uv) g.uv.push(uv.getX(i), uv.getY(i));
            }
            const index = o.geometry.index, count = index ? index.count : pos.count;
            for (let i = 0; i < count; i++) g.idx.push(g.n + (index ? index.getX(i) : i));
            g.n += pos.count;
        });
        const b64 = (arr) => { const u = new Uint8Array(arr.buffer); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
        return Array.from(groups.values()).map((g) => ({
            name: g.name, kind: g.kind, color: g.color, sommets: g.n, triangles: g.idx.length / 3,
            pos: b64(new Float32Array(g.pos)), idx: b64(new Uint32Array(g.idx)), uv: g.uv.length ? b64(new Float32Array(g.uv)) : null
        }));
    });
    await browser.close();
    fs.writeFileSync(out, JSON.stringify({ groupes: data }));
    const sum = (k) => data.reduce((a, g) => a + g[k], 0);
    console.log(`${data.length} groupes, ${sum('sommets')} sommets, ${sum('triangles')} triangles`);
    data.filter((g) => g.kind !== 'objet').forEach((g) => console.log('  ' + g.name.padEnd(18) + g.triangles + ' triangles'));
})();
