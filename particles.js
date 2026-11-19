/**
 * Objet en particules de l'accueil : un cœur, des poumons, puis un réseau de neurones.
 * Chaque forme est dessinée une fois hors écran, en noir, puis échantillonnée en points : plus un
 * pixel est opaque, plus il reçoit de points. Les points glissent d'une forme à l'autre avec un
 * léger tourbillon. Au repos le cœur bat et les poumons respirent, à peine.
 * Même principe que les présentations « particules », réglé pour le site :
 * un seul accent (lu dans --color-accent, il suit donc le thème), pas d'autre couleur.
 * prefers-reduced-motion : la première forme, figée. Hors écran ou onglet masqué : en pause.
 */
(function () {
    const canvas = document.getElementById('heroParticles');
    if (!canvas || !canvas.getContext || !window.Path2D) return;
    const ctx = canvas.getContext('2d');
    const legend = Array.from(document.querySelectorAll('#heroLegend span'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const COUNT = 6500;       // points pour un objet de 400px de large ; moins sur un écran étroit
    const HOLD = 6.5;         // secondes par forme, recomposition comprise
    const START = 0.12;       // délai avant la recomposition
    const SPREAD = 1.3;       // étalement des départs, pour que les points ne partent pas ensemble
    const SPAN = 1.2;         // durée du trajet d'un point
    const SWIRL = [20, 60];   // écart du tourbillon en chemin, en pixels (minimum, supplément)
    const ALPHA = 0.9;
    const DUST_ALPHA = 0.3;   // poussière de départ, avant le premier assemblage

    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

    /* =====================================================================
       Dessin des formes
       Les organes se recouvrent comme dans une planche d'anatomie : chacun efface ce qui est derrière lui.
       ===================================================================== */
    const P = (d) => new Path2D(d);
    // Contour écrit pour un contexte de canevas (beginPath, bezierCurveTo…) rejoué dans un Path2D
    const outline = (f) => { const path = new Path2D(); path.beginPath = () => {}; f(path); return path; };

    // Organe plein : il cache ce qui est derrière lui, reçoit un remplissage léger, une ombre vers le bord, puis son contour
    function organ(c, path, o) {
        o = o || {};
        c.save();
        c.globalCompositeOperation = 'destination-out';
        c.fillStyle = '#000';
        c.fill(path);
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = `rgba(0,0,0,${o.fill == null ? 0.05 : o.fill})`;
        c.fill(path);
        c.save();
        c.clip(path);
        c.strokeStyle = `rgba(0,0,0,${o.shade == null ? 0.06 : o.shade})`;
        (o.rim || [44, 28, 14]).forEach((w) => { c.lineWidth = w; c.stroke(path); });
        c.restore();
        c.strokeStyle = 'rgba(0,0,0,1)';
        c.lineWidth = o.line || 5;
        c.lineJoin = 'round';
        c.stroke(path);
        c.restore();
    }

    // Vaisseaux qui se rejoignent : un tube est un tracé avec sa largeur, une poche un contour fermé (sans largeur).
    // On trace toutes les parois, puis on creuse toutes les lumières : les parois ne subsistent que sur le
    // pourtour de l'ensemble, et les embranchements s'ouvrent les uns dans les autres.
    function tubes(c, list, o) {
        o = o || {};
        const wall = o.wall || 4.5;
        const outer = (t) => { if (t[1]) { c.lineWidth = t[1]; c.stroke(t[0]); } else { c.lineWidth = 2 * wall; c.stroke(t[0]); c.fill(t[0]); } };
        const inner = (t) => { if (t[1]) { c.lineWidth = t[1] - 2 * wall; c.stroke(t[0]); } else { c.fill(t[0]); } };
        c.save();
        c.lineCap = 'butt';
        c.lineJoin = 'round';
        c.globalCompositeOperation = 'destination-out';
        c.strokeStyle = c.fillStyle = '#000';
        list.forEach(outer);
        c.globalCompositeOperation = 'source-over';
        list.forEach(outer);
        c.globalCompositeOperation = 'destination-out';
        list.forEach(inner);
        c.globalCompositeOperation = 'source-over';
        c.strokeStyle = c.fillStyle = `rgba(0,0,0,${o.fill == null ? 0.07 : o.fill})`;
        list.forEach(inner);
        c.restore();
    }

    // Tranche de section d'un vaisseau coupé : une ellipse posée en bout de tube
    function cut(c, x, y, angle, width, o) {
        o = o || {};
        c.save();
        c.translate(x, y);
        c.rotate(angle);
        c.beginPath();
        c.ellipse(0, 0, width * 0.2, width / 2, 0, 0, Math.PI * 2);
        c.globalCompositeOperation = 'destination-out';
        c.fillStyle = '#000';
        c.fill();
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = 'rgba(0,0,0,.2)';
        c.fill();
        c.strokeStyle = 'rgba(0,0,0,1)';
        c.lineWidth = o.line || 4;
        c.stroke();
        c.restore();
    }

    function vessel(c, d, width, alpha) {
        c.save();
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.strokeStyle = `rgba(0,0,0,${alpha == null ? 1 : alpha})`;
        c.lineWidth = width;
        c.stroke(P(d));
        c.restore();
    }

    /* ---------- Cœur, vue antérieure (boîte 420 × 700) ----------
       De l'arrière vers l'avant : veines pulmonaires, veine cave supérieure, aorte et ses trois branches,
       ventricules, tronc pulmonaire et artère pulmonaire gauche, oreillette droite et son auricule,
       auricule gauche, puis les coronaires. */
    function drawHeart(c) {
        // Veines pulmonaires gauches, coupées
        tubes(c, [[P('M318 288 L398 276'), 30], [P('M322 324 L404 320'), 30]], { wall: 4 });
        cut(c, 398, 276, -0.15, 30);
        cut(c, 404, 320, -0.05, 30);

        // Veine cave supérieure
        tubes(c, [[P('M104 18 C102 90 98 160 94 230'), 50]]);
        cut(c, 104, 18, Math.PI / 2, 50);

        // Aorte ascendante, crosse, tronc brachiocéphalique, carotide commune gauche, sous-clavière gauche
        tubes(c, [
            [P('M128 270 C114 206 116 132 142 96 C162 66 232 54 272 72 C318 92 332 142 302 178 C290 190 262 178 246 182 C234 204 234 236 238 270 Z')],
            [P('M158 110 L156 12'), 54],
            [P('M214 100 L214 12'), 36],
            [P('M256 104 L258 14'), 36]
        ]);
        cut(c, 156, 12, Math.PI / 2, 54);
        cut(c, 214, 12, Math.PI / 2, 36);
        cut(c, 258, 14, Math.PI / 2, 36);

        // Masse ventriculaire : bord droit, pointe, bord gauche
        organ(c, P('M118 292 C150 268 200 262 232 280 C270 300 320 330 352 372 C380 410 376 480 356 540 C334 606 290 664 236 690 C214 700 190 694 160 672 C96 626 34 548 14 462 C8 430 12 404 22 388 C50 340 84 308 118 292 Z'),
            { rim: [64, 40, 20], shade: 0.05 });

        // Tronc pulmonaire, né du ventricule droit, et artère pulmonaire gauche
        tubes(c, [
            [P('M158 326 C184 270 236 226 300 214'), 86],
            [P('M296 214 L382 224'), 62],
            [P('M286 196 C306 188 322 188 340 194'), 28]
        ]);
        cut(c, 382, 224, 0.12, 62);
        cut(c, 340, 194, 0.1, 28);

        // Oreillette droite
        organ(c, P('M92 218 C60 222 22 250 10 300 C0 340 2 380 16 400 C44 352 82 312 118 292 C122 262 112 230 92 218 Z'), { rim: [36, 22, 10] });
        // Auricule droite, qui recouvre la racine de l'aorte
        organ(c, P('M30 264 C40 230 78 208 106 216 C126 222 138 244 132 262 C128 274 118 270 114 282 C110 294 98 290 92 300 C86 310 72 304 64 298 C46 290 30 282 30 264 Z'), { rim: [26, 14], shade: 0.08, line: 4.5 });
        // Auricule gauche
        organ(c, P('M212 262 C232 240 280 238 310 256 C334 270 338 300 326 318 C318 330 306 322 298 336 C290 350 274 342 262 346 C246 350 236 338 226 328 C212 312 204 282 212 262 Z'), { rim: [30, 16], shade: 0.08, line: 4.5 });

        // Sillons (graisse) puis coronaires
        vessel(c, 'M122 288 C84 312 44 352 20 398', 16, 0.14);
        vessel(c, 'M208 318 C204 372 190 442 172 522 C160 582 150 632 158 668', 16, 0.12);
        // Coronaire droite dans le sillon auriculo-ventriculaire, branche marginale, branches ventriculaires
        vessel(c, 'M122 288 C84 312 44 352 20 398 C16 440 30 500 60 556', 4.5);
        vessel(c, 'M36 372 C72 410 110 470 140 540', 3);
        vessel(c, 'M64 336 C92 368 112 400 122 444', 2.5);
        vessel(c, 'M100 302 C124 320 150 330 178 350', 2.5);
        // Interventriculaire antérieure et ses diagonales
        vessel(c, 'M208 318 C204 372 190 442 172 522 C160 582 150 632 158 668', 5);
        vessel(c, 'M206 346 C240 382 290 442 340 502', 3.5);
        vessel(c, 'M280 430 C300 472 306 522 300 572', 2.5);
        vessel(c, 'M192 422 C220 472 240 522 244 592', 3);
        vessel(c, 'M232 502 C262 542 276 582 274 622', 2);
        vessel(c, 'M190 432 C160 452 130 482 112 522', 3);
        vessel(c, 'M176 502 C150 532 124 562 108 602', 2.5);
        vessel(c, 'M166 562 C150 600 150 630 140 650', 2);
        // Circonflexe et marginale gauche, sous l'auricule
        vessel(c, 'M330 374 C356 432 360 502 340 562', 3.5);
    }

    /* ---------- Poumons, vue antérieure (boîte 660 × 740) ----------
       Repris de la présentation « particules » : trois lobes à droite, deux à gauche avec l'incisure cardiaque
       et la lingula, trachée et bronches souches, veine cave, crosse aortique, cœur et arbre artériel pulmonaire. */
    function rLung(c) {
        c.beginPath(); c.moveTo(228, 56);
        c.bezierCurveTo(150, 66, 84, 168, 62, 300); c.bezierCurveTo(42, 420, 30, 560, 46, 664);
        c.bezierCurveTo(108, 628, 186, 598, 248, 608); c.bezierCurveTo(272, 612, 288, 620, 298, 628);
        c.bezierCurveTo(280, 566, 268, 494, 288, 432); c.bezierCurveTo(298, 402, 300, 372, 290, 348);
        c.bezierCurveTo(282, 322, 300, 292, 302, 252); c.bezierCurveTo(304, 168, 282, 78, 228, 56); c.closePath();
    }
    function lLung(c) {
        c.beginPath(); c.moveTo(450, 74);
        c.bezierCurveTo(520, 82, 590, 182, 612, 312); c.bezierCurveTo(632, 432, 640, 584, 622, 708);
        c.bezierCurveTo(596, 716, 566, 716, 546, 712); c.bezierCurveTo(528, 708, 522, 698, 532, 690);
        c.bezierCurveTo(566, 668, 584, 620, 574, 578); c.bezierCurveTo(562, 520, 514, 478, 456, 462);
        c.bezierCurveTo(424, 446, 406, 404, 412, 362); c.bezierCurveTo(418, 334, 402, 302, 402, 254);
        c.bezierCurveTo(400, 172, 414, 92, 450, 74); c.closePath();
    }
    function heartOutline(c) {
        c.beginPath(); c.moveTo(336, 430);
        c.bezierCurveTo(300, 450, 280, 530, 298, 618); c.bezierCurveTo(372, 646, 460, 672, 534, 684);
        c.bezierCurveTo(566, 636, 556, 540, 504, 488); c.bezierCurveTo(480, 464, 458, 450, 436, 446);
        c.bezierCurveTo(404, 428, 366, 424, 336, 430); c.closePath();
    }
    let tree = null;
    function buildTree() {
        if (tree) return tree;
        const segs = [];
        const c = document.createElement('canvas').getContext('2d');
        const inside = (f, x, y) => { f(c); return c.isPointInPath(x, y); };
        const grow = (f, x, y, ang, len, w, d, seed) => {
            const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
            if (!inside(f, x2, y2)) return;
            segs.push({ x1: x, y1: y, x2, y2, w, d });
            if (d >= 5) return;
            for (const sgn of [-1, 1]) {
                const h = hash(seed * 7.3 + sgn * 3.1 + d);
                grow(f, x2, y2, ang + sgn * (0.22 + 0.42 * h) + (h - 0.5) * 0.25, len * (0.74 + 0.2 * hash(seed * 3.7 + d + sgn)), w * 0.7, d + 1, seed * 2 + (sgn > 0 ? 1 : 0));
            }
        };
        segs.push({ x1: 418, y1: 452, x2: 392, y2: 376, w: 26, d: 0 });
        segs.push({ x1: 392, y1: 376, x2: 298, y2: 356, w: 17, d: 1 });
        segs.push({ x1: 392, y1: 376, x2: 424, y2: 330, w: 16, d: 1 });
        [[-2.35, 56, 3], [2.98, 58, 7], [2.05, 82, 11]].forEach(([a0, len, sd]) => grow(rLung, 298, 356, a0, len, 12, 2, sd));
        [[-0.85, 56, 17], [0.62, 66, 23], [1.28, 92, 29]].forEach(([a0, len, sd]) => grow(lLung, 424, 330, a0, len, 12, 2, sd));
        return (tree = segs);
    }
    function drawLungs(c) {
        // Poumons : trois lobes à droite, deux à gauche, et leurs scissures
        [rLung, lLung].forEach((f) => organ(c, outline(f), { fill: 0.03, rim: [56, 34, 16], shade: 0.035, line: 7 }));
        c.save();
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(0,0,0,.75)';
        c.lineWidth = 3.5;
        c.beginPath(); c.moveTo(290, 364); c.bezierCurveTo(220, 366, 120, 372, 50, 384); c.stroke();      // petite scissure
        c.beginPath(); c.moveTo(60, 352); c.bezierCurveTo(92, 452, 160, 556, 238, 608); c.stroke();       // grande scissure droite
        c.beginPath(); c.moveTo(614, 330); c.bezierCurveTo(594, 440, 556, 600, 522, 704); c.stroke();     // grande scissure gauche
        c.restore();

        // Trachée, carène et bronches souches : la droite plus courte et plus verticale, la gauche plus longue
        tubes(c, [
            [P('M358 0 L358 212'), 30],
            [P('M358 204 Q338 246 300 300'), 23],
            [P('M358 204 Q396 244 436 296'), 20]
        ], { wall: 3.5, fill: 0.05 });
        c.save();
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(0,0,0,.75)';
        c.lineWidth = 2.5;
        for (let k = 0; k < 7; k++) { const y = 16 + k * 27; c.beginPath(); c.moveTo(346, y); c.quadraticCurveTo(358, y + 6, 370, y); c.stroke(); }
        c.restore();

        // Veine cave supérieure et crosse de l'aorte, devant la trachée
        tubes(c, [[P('M312 236 L318 430'), 22]], { wall: 3, fill: 0.08 });
        tubes(c, [[P('M352 436 C338 360 334 280 366 244 C396 214 436 236 438 296'), 28]], { wall: 3, fill: 0.08 });

        // Cœur et ses sillons
        organ(c, outline(heartOutline), { fill: 0.1, rim: [50, 30, 14], shade: 0.06, line: 8 });
        c.save();
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(0,0,0,.9)';
        c.lineWidth = 4;
        c.beginPath(); c.moveTo(430, 448); c.bezierCurveTo(456, 530, 486, 620, 510, 678); c.stroke();     // sillon interventriculaire antérieur
        c.beginPath(); c.moveTo(352, 428); c.bezierCurveTo(336, 500, 330, 570, 340, 630); c.stroke();     // sillon auriculo-ventriculaire
        // Arbre artériel pulmonaire, vu par transparence
        c.strokeStyle = 'rgba(0,0,0,1)';
        for (const g of buildTree()) { c.lineWidth = Math.max(4, g.w * 1.05); c.beginPath(); c.moveTo(g.x1, g.y1); c.lineTo(g.x2, g.y2); c.stroke(); }
        c.restore();
    }

    /* ---------- Modèle : un petit réseau de neurones, quatre couches (boîte 800 × 900) ---------- */
    function drawNetwork(c) {
        const columns = [150, 330, 510, 670];
        const sizes = [3, 5, 5, 2];
        const layers = sizes.map((n, i) => {
            const nodes = [];
            for (let j = 0; j < n; j++) nodes.push([columns[i], 450 + (j - (n - 1) / 2) * 130]);
            return nodes;
        });
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(0,0,0,.2)';
        c.lineWidth = 4;
        for (let i = 0; i < layers.length - 1; i++) {
            layers[i].forEach((a) => layers[i + 1].forEach((b) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }));
        }
        layers.forEach((nodes) => nodes.forEach((p) => {
            c.beginPath();
            c.arc(p[0], p[1], 30, 0, 7);
            c.fillStyle = 'rgba(0,0,0,.14)';
            c.fill();
            c.strokeStyle = 'rgba(0,0,0,1)';
            c.lineWidth = 11;
            c.stroke();
        }));
    }

    // Ordre de la légende dans la page : cœur, poumons, modèle.
    // « life » : au repos, la forme change d'échelle autour du centre (x, y), en fonction de l'horloge.
    const SHAPES = [
        { box: [420, 700], draw: drawHeart, life: heartbeat },
        { box: [660, 740], draw: drawLungs, life: breathing },
        { box: [800, 900], draw: drawNetwork, life: null }
    ];

    // Un battement par seconde : contraction brève, relâchement plus lent
    function heartbeat(clock) {
        const t = clock % 1;
        const squeeze = t < 0.1 ? Math.sin((t / 0.1) * Math.PI / 2) : Math.exp(-(t - 0.1) / 0.16);
        return [1 - 0.018 * squeeze, 1 - 0.018 * squeeze];
    }

    // Une respiration toutes les cinq secondes, plus ample en largeur qu'en hauteur
    function breathing(clock) {
        const s = Math.sin(clock * 1.3) * 0.012;
        return [1 + s, 1 + s * 0.6];
    }

    /* =====================================================================
       Moteur : formes échantillonnées, recomposition, vie au repos
       ===================================================================== */
    let width = 0;
    let height = 0;
    let ratio = 1;
    let count = 0;
    let shapes = [];
    let dust = [];
    let seeds = null;          // constantes de chaque point, calculées une fois
    let order = [[], []];      // indices des points, rangés par ton
    let tones = ['rgb(79,91,213)', 'rgb(141,150,228)'];

    function fit(c, box, draw) {
        const s = Math.min(width / box[0], height / box[1]) * 0.96;
        c.save();
        c.translate((width - box[0] * s) / 2, (height - box[1] * s) / 2);
        c.scale(s, s);
        draw(c);
        c.restore();
    }

    // Tirage par rejet sur l'opacité
    function sample(shape) {
        const off = document.createElement('canvas');
        off.width = width;
        off.height = height;
        const c = off.getContext('2d');
        fit(c, shape.box, shape.draw);
        const data = c.getImageData(0, 0, width, height).data;
        const points = new Float32Array(count * 2);
        let seed = 7;
        const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        let found = 0;
        let tries = 0;
        while (found < count && tries < count * 400) {
            tries++;
            const x = Math.floor(random() * width);
            const y = Math.floor(random() * height);
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 0 && random() * 255 < alpha) {
                points[found * 2] = x + random() - 0.5;
                points[found * 2 + 1] = y + random() - 0.5;
                found++;
            }
        }
        for (let k = found; k < count; k++) {
            const src = found ? k % found : -1;
            points[k * 2] = src < 0 ? width / 2 : points[src * 2];
            points[k * 2 + 1] = src < 0 ? height / 2 : points[src * 2 + 1];
        }
        return points;
    }

    function build() {
        const box = canvas.getBoundingClientRect();
        const w = Math.round(box.width);
        const h = Math.round(box.height);
        if (!w || !h) return false;
        width = w;
        height = h;
        ratio = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        count = Math.round(COUNT * clamp(width / 400, 0.42, 1));
        shapes = SHAPES.map(sample);

        dust = new Float32Array(count * 2);
        // Par point : retard de départ, écart et direction du tourbillon, phases de frémissement, opacité, taille
        seeds = new Float32Array(count * 8);
        order = [[], []];
        for (let k = 0; k < count; k++) {
            dust[k * 2] = (hash(k + 11) * 1.3 - 0.15) * width;
            dust[k * 2 + 1] = (hash(k + 23) * 1.3 - 0.15) * height;
            const h2 = hash(k * 1.7 + 3);
            const angle = h2 * 6.283 + k;
            seeds[k * 8] = hash(k + 0.5) * SPREAD;
            seeds[k * 8 + 1] = SWIRL[0] + SWIRL[1] * h2;
            seeds[k * 8 + 2] = Math.cos(angle);
            seeds[k * 8 + 3] = Math.sin(angle);
            seeds[k * 8 + 4] = k * 0.37;
            seeds[k * 8 + 5] = k * 0.53;
            seeds[k * 8 + 6] = 0.45 + 0.55 * hash(k * 2.3);
            seeds[k * 8 + 7] = 1.1 + 1.1 * hash(k * 5.1);
            order[hash(k * 9.3) < 0.8 ? 0 : 1].push(k);
        }
        return true;
    }

    // Deux tons du même accent : l'accent du thème, et le même éclairci d'un tiers
    function readTones() {
        const match = /#([0-9a-f]{6})/i.exec(getComputedStyle(canvas).getPropertyValue('--color-accent'));
        if (!match) return;
        const n = parseInt(match[1], 16);
        const rgb = [n >> 16, (n >> 8) & 255, n & 255];
        tones = [`rgb(${rgb.join(',')})`, `rgb(${rgb.map((v) => Math.round(v + (255 - v) * 0.35)).join(',')})`];
    }

    const startTime = performance.now();
    let frame = 0;

    function paint(now) {
        if (!shapes.length) return;
        if (frame++ % 30 === 0) readTones();

        const total = shapes.length;
        // Mouvement réduit : on se place à la fin d'un cycle, sur la première forme
        const t = reduceMotion ? HOLD * (total + 0.9) : (now - startTime) / 1000;
        const step = Math.floor(t / HOLD);
        const u = t - step * HOLD - START;
        const first = step === 0;
        const from = first ? dust : shapes[(step - 1) % total];
        const to = shapes[step % total];
        const alphaFrom = first ? DUST_ALPHA : ALPHA;
        const clock = reduceMotion ? 0 : now / 1000;
        const life = reduceMotion ? null : SHAPES[step % total].life;
        const scale = life ? life(clock) : null;
        const cx = width / 2;
        const cy = height / 2;

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        for (let tone = 0; tone < 2; tone++) {
            ctx.fillStyle = tones[tone];
            const list = order[tone];
            for (let i = 0; i < list.length; i++) {
                const k = list[i];
                const s = k * 8;
                const e = ease(clamp((u - seeds[s]) / SPAN, 0, 1));
                let x = to[k * 2];
                let y = to[k * 2 + 1];
                if (e < 1) {
                    const swirl = Math.sin(Math.PI * e) * seeds[s + 1];
                    x = from[k * 2] + (x - from[k * 2]) * e + seeds[s + 2] * swirl;
                    y = from[k * 2 + 1] + (y - from[k * 2 + 1]) * e + seeds[s + 3] * swirl;
                } else if (scale) {
                    x = cx + (x - cx) * scale[0];
                    y = cy + (y - cy) * scale[1];
                }
                x += Math.sin(clock * 1.1 + seeds[s + 4]) * 1.1;
                y += Math.cos(clock * 0.9 + seeds[s + 5]) * 1.1;
                const alpha = (alphaFrom + (ALPHA - alphaFrom) * e) * seeds[s + 6];
                if (alpha < 0.02) continue;
                const size = seeds[s + 7];
                ctx.globalAlpha = alpha;
                ctx.fillRect(x - size / 2, y - size / 2, size, size);
            }
        }
        ctx.globalAlpha = 1;

        // La légende change au milieu de la recomposition
        const current = (first || u > SPREAD * 0.5 ? step : step - 1) % total;
        legend.forEach((item, i) => item.classList.toggle('is-on', i === current));
    }

    let request = 0;
    let onScreen = !('IntersectionObserver' in window);

    function loop(now) {
        paint(now);
        if (onScreen && !document.hidden) request = requestAnimationFrame(loop);
    }

    function wake() {
        cancelAnimationFrame(request);
        if (reduceMotion) paint(performance.now());
        else if (onScreen && !document.hidden) request = requestAnimationFrame(loop);
    }

    function rebuild() {
        if (!build()) return;
        paint(performance.now());
        wake();
    }

    if ('ResizeObserver' in window) {
        let timer = 0;
        new ResizeObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(rebuild, 120);
        }).observe(canvas);
    }
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            onScreen = entries[0].isIntersecting;
            wake();
        }, { rootMargin: '120px' }).observe(canvas);
    }
    document.addEventListener('visibilitychange', wake);
    // Thème changé à la main : la couleur est relue tout de suite, y compris en mouvement réduit
    new MutationObserver(() => { readTones(); if (reduceMotion) paint(performance.now()); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    rebuild();
})();
