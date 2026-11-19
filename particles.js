/**
 * Objet en particules de l'accueil : un cœur, des poumons, puis un réseau de neurones.
 * Chaque forme est dessinée une fois hors écran, puis échantillonnée en points ; les points
 * glissent d'une forme à l'autre avec un léger tourbillon, et respirent au repos.
 * Même principe que les présentations « particules », réglé pour le site :
 * un seul accent (lu dans --color-accent, il suit donc le thème), pas d'autre couleur.
 * prefers-reduced-motion : la première forme, figée. Hors écran ou onglet masqué : en pause.
 */
(function () {
    const canvas = document.getElementById('heroParticles');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const legend = Array.from(document.querySelectorAll('#heroLegend span'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const COUNT = 4600;       // points pour un objet de 400px de large ; moins sur un écran étroit
    const HOLD = 6.5;         // secondes par forme, recomposition comprise
    const START = 0.12;       // délai avant la recomposition
    const SPREAD = 1.3;       // étalement des départs, pour que les points ne partent pas ensemble
    const SPAN = 1.2;         // durée du trajet d'un point
    const SWIRL = [20, 60];   // écart du tourbillon en chemin, en pixels (minimum, supplément)

    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

    function line(c, a, b) {
        c.beginPath();
        c.moveTo(a[0], a[1]);
        c.lineTo(b[0], b[1]);
        c.stroke();
    }

    // Les formes sont dessinées dans une boîte fixe, puis ajustées à la taille du canevas.
    // L'opacité du tracé règle la densité des points : contours pleins, intérieur à peine rempli.
    function fit(c, w, h, boxW, boxH, draw) {
        const s = Math.min(w / boxW, h / boxH) * 0.96;
        c.save();
        c.translate((w - boxW * s) / 2, (h - boxH * s) / 2);
        c.scale(s, s);
        draw(c);
        c.restore();
    }

    // Cœur : ventricules, oreillettes, crosse aortique et ses branches, tronc pulmonaire, veine cave, coronaires
    function drawHeart(c) {
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.fillStyle = 'rgba(0,0,0,.07)';
        c.beginPath();
        c.moveTo(250, 330);
        c.bezierCurveTo(150, 360, 120, 520, 190, 640);
        c.bezierCurveTo(250, 740, 380, 820, 470, 860);
        c.bezierCurveTo(560, 800, 650, 690, 680, 560);
        c.bezierCurveTo(700, 450, 650, 350, 560, 320);
        c.bezierCurveTo(470, 290, 340, 300, 250, 330);
        c.fill();
        c.strokeStyle = 'rgba(0,0,0,1)';
        c.lineWidth = 12;
        c.stroke();

        c.lineWidth = 9;
        c.beginPath(); c.ellipse(255, 330, 78, 62, -0.4, 0, 7); c.fill(); c.stroke();
        c.beginPath(); c.ellipse(590, 320, 70, 55, 0.3, 0, 7); c.fill(); c.stroke();

        c.lineWidth = 34;
        c.strokeStyle = 'rgba(0,0,0,.1)';
        c.beginPath(); c.moveTo(430, 330); c.bezierCurveTo(420, 170, 560, 90, 660, 150); c.bezierCurveTo(720, 190, 720, 260, 700, 320); c.stroke();
        c.lineWidth = 9;
        c.strokeStyle = 'rgba(0,0,0,1)';
        c.beginPath(); c.moveTo(412, 330); c.bezierCurveTo(400, 150, 560, 60, 676, 130); c.bezierCurveTo(745, 175, 742, 265, 720, 330); c.stroke();
        c.beginPath(); c.moveTo(448, 330); c.bezierCurveTo(440, 200, 560, 120, 646, 170); c.bezierCurveTo(690, 200, 695, 260, 682, 320); c.stroke();

        c.lineWidth = 7;
        [[520, 128], [580, 104], [640, 112]].forEach((p) => {
            const x2 = p[0] - 6 + (p[0] - 560) * 0.1;
            const y2 = p[1] - 90;
            line(c, [p[0] - 9, p[1]], [x2 - 9, y2]);
            line(c, [p[0] + 9, p[1]], [x2 + 9, y2]);
        });

        c.lineWidth = 30;
        c.strokeStyle = 'rgba(0,0,0,.1)';
        c.beginPath(); c.moveTo(360, 360); c.bezierCurveTo(340, 260, 300, 220, 240, 200); c.stroke();
        c.lineWidth = 9;
        c.strokeStyle = 'rgba(0,0,0,1)';
        c.beginPath(); c.moveTo(345, 350); c.bezierCurveTo(328, 268, 292, 236, 236, 216); c.stroke();
        c.beginPath(); c.moveTo(377, 352); c.bezierCurveTo(356, 250, 312, 204, 246, 184); c.stroke();

        c.lineWidth = 8;
        line(c, [197, 300], [178, 120]);
        line(c, [224, 296], [204, 118]);

        c.lineWidth = 7;
        c.strokeStyle = 'rgba(0,0,0,.95)';
        c.beginPath(); c.moveTo(420, 380); c.bezierCurveTo(400, 500, 430, 650, 470, 820); c.stroke();
        c.beginPath(); c.moveTo(430, 420); c.bezierCurveTo(520, 440, 600, 520, 640, 600); c.stroke();
        c.beginPath(); c.moveTo(300, 420); c.bezierCurveTo(230, 500, 220, 600, 260, 690); c.stroke();
        c.beginPath(); c.moveTo(445, 520); c.bezierCurveTo(500, 560, 540, 620, 560, 700); c.stroke();
    }

    // Poumons : deux lobes, la trachée et ses anneaux, un arbre bronchique dans chaque lobe
    function drawLungs(c) {
        c.lineCap = 'round';
        c.lineJoin = 'round';
        const right = new Path2D('M350 250 C300 150 190 190 140 360 C95 520 90 720 130 820 C200 860 320 820 365 740 C380 600 378 400 350 250 Z');
        const left = new Path2D('M450 250 C500 150 610 190 660 360 C705 520 710 720 670 820 C610 850 540 800 505 720 C470 690 440 640 438 560 C432 450 436 340 450 250 Z');

        function branch(x, y, angle, length, depth, k) {
            const x2 = x + Math.cos(angle) * length;
            const y2 = y + Math.sin(angle) * length;
            c.lineWidth = 3 + depth * 2.2;
            line(c, [x, y], [x2, y2]);
            if (depth > 0) {
                branch(x2, y2, angle - 0.5 - 0.2 * hash(k), length * 0.72, depth - 1, k * 2 + 1);
                branch(x2, y2, angle + 0.42 + 0.2 * hash(k + 9), length * 0.72, depth - 1, k * 2 + 2);
            }
        }

        [[right, 300, 385, 1.95, 3], [left, 500, 385, 1.2, 17]].forEach((lobe) => {
            c.fillStyle = 'rgba(0,0,0,.06)';
            c.fill(lobe[0]);
            c.strokeStyle = 'rgba(0,0,0,1)';
            c.lineWidth = 12;
            c.stroke(lobe[0]);
            // L'arbre bronchique ne sort pas du lobe
            c.save();
            c.clip(lobe[0]);
            c.strokeStyle = 'rgba(0,0,0,.85)';
            branch(lobe[1], lobe[2], lobe[3], 150, 3, lobe[4]);
            c.restore();
        });

        c.strokeStyle = 'rgba(0,0,0,1)';
        c.lineWidth = 9;
        line(c, [378, 50], [378, 262]);
        line(c, [422, 50], [422, 262]);
        line(c, [378, 262], [296, 372]);
        line(c, [422, 262], [504, 372]);
        line(c, [400, 300], [322, 392]);
        line(c, [400, 300], [478, 392]);
        c.lineWidth = 6;
        for (let y = 78; y < 250; y += 34) line(c, [380, y], [420, y]);
    }

    // Modèle : un petit réseau de neurones, quatre couches
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
            layers[i].forEach((a) => layers[i + 1].forEach((b) => line(c, a, b)));
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

    // Ordre de la légende dans la page : cœur, poumons, modèle
    const SHAPES = [
        (c, w, h) => fit(c, w, h, 820, 900, drawHeart),
        (c, w, h) => fit(c, w, h, 800, 900, drawLungs),
        (c, w, h) => fit(c, w, h, 800, 900, drawNetwork)
    ];
    const ALPHA = 0.9;
    const DUST_ALPHA = 0.3;   // poussière de départ, avant le premier assemblage

    let width = 0;
    let height = 0;
    let ratio = 1;
    let count = 0;
    let shapes = [];
    let dust = [];
    let tones = ['79,91,213', '141,150,228'];

    // Tirage par rejet sur l'opacité : plus un pixel est opaque, plus il reçoit de points
    function sample(draw) {
        const off = document.createElement('canvas');
        off.width = width;
        off.height = height;
        const c = off.getContext('2d');
        draw(c, width, height);
        const data = c.getImageData(0, 0, width, height).data;
        const points = [];
        let seed = 7;
        const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        let tries = 0;
        while (points.length < count && tries < count * 400) {
            tries++;
            const x = Math.floor(random() * width);
            const y = Math.floor(random() * height);
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 0 && random() * 255 < alpha) points.push([x + random() - 0.5, y + random() - 0.5]);
        }
        const found = points.length;
        while (points.length < count) points.push(found ? points[points.length % found] : [width / 2, height / 2]);
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
        dust = shapes[0].map((p, k) => [(hash(k + 11) * 1.3 - 0.15) * width, (hash(k + 23) * 1.3 - 0.15) * height]);
        return true;
    }

    // Deux tons du même accent : l'accent du thème, et le même éclairci d'un tiers
    function readTones() {
        const match = /#([0-9a-f]{6})/i.exec(getComputedStyle(canvas).getPropertyValue('--color-accent'));
        if (!match) return;
        const n = parseInt(match[1], 16);
        const rgb = [n >> 16, (n >> 8) & 255, n & 255];
        tones = [rgb.join(','), rgb.map((v) => Math.round(v + (255 - v) * 0.35)).join(',')];
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
        const u = t - step * HOLD;
        const first = step === 0;
        const from = first ? dust : shapes[(step - 1) % total];
        const to = shapes[step % total];
        const alphaFrom = first ? DUST_ALPHA : ALPHA;
        const clock = reduceMotion ? 0 : now / 1000;

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        for (let k = 0; k < count; k++) {
            const a = from[k];
            const b = to[k];
            const h1 = hash(k + 0.5);
            const h2 = hash(k * 1.7 + 3);
            const e = ease(clamp((u - START - h1 * SPREAD) / SPAN, 0, 1));
            const swirl = Math.sin(Math.PI * e) * (SWIRL[0] + SWIRL[1] * h2);
            const angle = h2 * 6.283 + k;
            const x = a[0] + (b[0] - a[0]) * e + Math.cos(angle) * swirl + Math.sin(clock * 1.1 + k * 0.37) * 1.1;
            const y = a[1] + (b[1] - a[1]) * e + Math.sin(angle) * swirl + Math.cos(clock * 0.9 + k * 0.53) * 1.1;
            const alpha = (alphaFrom + (ALPHA - alphaFrom) * e) * (0.45 + 0.55 * hash(k * 2.3));
            if (alpha < 0.02) continue;
            const size = 1.1 + 1.1 * hash(k * 5.1);
            ctx.fillStyle = `rgba(${hash(k * 9.3) < 0.8 ? tones[0] : tones[1]},${alpha.toFixed(3)})`;
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

        // La légende change au milieu de la recomposition
        const current = (first || u > START + SPREAD * 0.5 ? step : step - 1) % total;
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
