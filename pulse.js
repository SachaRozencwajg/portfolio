/**
 * Onde de pouls façon scope : un curseur balaie l'écran de gauche à droite,
 * dessine le nouveau tracé et efface l'ancien juste devant lui (comme sur un moniteur).
 * Couleurs reprises des variables CSS --grad-a / --grad-b (suivent le thème clair/sombre).
 */
(function () {
    const canvas = document.getElementById('pulseWave');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const SWEEP_SPEED = 170;   // px/s (vitesse de balayage)
    const BEAT_MS = 860;       // ~70 bpm
    const GAP = 26;            // zone effacée devant le curseur (px)

    let width = 0, height = 0, dpr = 1;
    let trace = [];            // ordonnée par pixel
    let stamp = [];            // instant d'écriture de chaque pixel (pour l'atténuation)
    let cursor = 0, last = null, time = 0;
    let colorA = '#3b6cf6', colorB = '#8b5cf6';
    let beatLen = BEAT_MS, beatStart = 0, beatAmp = 1;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function readColors() {
        const css = getComputedStyle(document.documentElement);
        colorA = css.getPropertyValue('--grad-a').trim() || colorA;
        colorB = css.getPropertyValue('--grad-b').trim() || colorB;
    }

    // Forme d'une onde de pléthysmographie sur un battement (phase 0 → 1)
    function plethShape(p) {
        // montée systolique rapide, sommet arrondi, décroissance lente
        const rise = 0.17;
        const sys = p < rise
            ? Math.exp(-(((p - rise) / 0.07) ** 2))
            : Math.exp(-(((p - rise) / 0.27) ** 1.45));
        // incisure dicrote puis petite onde de réflexion sur la pente descendante
        const g = (x, mu, sigma) => Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));
        const dic = 0.16 * g(p, 0.44, 0.045) - 0.05 * g(p, 0.37, 0.022);
        // fin de diastole : retour progressif vers la ligne de base
        return Math.max(0, sys + dic) * (1 - 0.25 * Math.max(0, p - 0.6));
    }

    function sample(t) {
        // nouveau battement : légère variabilité de fréquence et d'amplitude
        while (t - beatStart >= beatLen) {
            beatStart += beatLen;
            beatLen = BEAT_MS * (0.94 + Math.random() * 0.12);
            beatAmp = 0.9 + Math.random() * 0.12;
        }
        const p = (t - beatStart) / beatLen;
        const top = height * 0.18, bottom = height * 0.86;
        return bottom - plethShape(p) * beatAmp * (bottom - top) / 1.05;
    }

    function resize() {
        const w = Math.round(canvas.getBoundingClientRect().width);
        if (w === width && trace.length) return;   // ex. barre d'adresse mobile : rien à refaire
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        width = Math.max(1, Math.round(rect.width));
        height = Math.max(1, Math.round(rect.height));
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        trace = new Array(width).fill(null);
        stamp = new Array(width).fill(-Infinity);
        cursor = 0;
        if (reduceMotion) {
            // tracé complet, statique
            for (let x = 0; x < width; x++) trace[x] = sample((x / SWEEP_SPEED) * 1000);
            draw();
        }
    }

    // Tranches d'intensité : on regroupe les segments par niveau de luminosité
    // pour tracer ~10 chemins par image au lieu d'un trait par pixel.
    const BANDS = 10;

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, colorA);
        grad.addColorStop(1, colorB);

        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = grad;

        const sweepMs = (width / SWEEP_SPEED) * 1000;
        const paths = [];
        for (let b = 0; b < BANDS; b++) paths.push(new Path2D());
        for (let x = 1; x < width; x++) {
            if (trace[x] === null || trace[x - 1] === null) continue;
            const age = reduceMotion ? 0 : (time - stamp[x]) / sweepMs;
            const alpha = Math.max(0.22, 1 - age * 0.78);
            const b = Math.min(BANDS - 1, Math.floor((1 - alpha) / 0.78 * BANDS));
            paths[b].moveTo(x - 1, trace[x - 1]);
            paths[b].lineTo(x, trace[x]);
        }
        for (let b = BANDS - 1; b >= 0; b--) {
            ctx.globalAlpha = 1 - (b + 0.5) / BANDS * 0.45;
            ctx.stroke(paths[b]);
        }
        // halo sur la partie la plus récente : trait large et transparent (bien moins coûteux que shadowBlur)
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.13;
        ctx.stroke(paths[0]);
        ctx.globalAlpha = 0.07;
        ctx.stroke(paths[1]);
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 1;

        // point lumineux en tête de balayage
        if (!reduceMotion && trace[cursor] !== null) {
            ctx.fillStyle = colorA;
            ctx.globalAlpha = 0.18;
            ctx.beginPath();
            ctx.arc(cursor, trace[cursor], 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(cursor, trace[cursor], 3.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const FRAME_MS = 1000 / 30;   // 30 images/s suffisent pour un balayage lent, et divisent le coût par deux

    function frame(now) {
        if (last !== null && now - last < FRAME_MS - 2) {
            rafId = running ? requestAnimationFrame(frame) : null;
            return;
        }
        if (last === null) last = now;
        const dt = Math.min(now - last, 100);   // évite un saut après un onglet en arrière-plan
        last = now;
        const steps = Math.max(1, Math.round((dt / 1000) * SWEEP_SPEED));
        for (let i = 0; i < steps; i++) {
            time += 1000 / SWEEP_SPEED;
            cursor = (cursor + 1) % width;
            trace[cursor] = sample(time);
            stamp[cursor] = time;
            for (let g = 1; g <= GAP; g++) trace[(cursor + g) % width] = null;   // effacement devant
            if (cursor === 0) trace[width - 1] = null;                           // pas de liaison au retour
        }
        draw();
        rafId = running ? requestAnimationFrame(frame) : null;
    }

    // N'anime que lorsque l'onde est visible et l'onglet actif
    let rafId = null, running = false, onScreen = true;
    function updateRunning() {
        const shouldRun = !reduceMotion && onScreen && !document.hidden;
        if (shouldRun === running) return;
        running = shouldRun;
        if (running) { last = null; rafId = requestAnimationFrame(frame); }
        else if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }

    readColors();
    resize();
    window.addEventListener('resize', resize);
    new MutationObserver(() => { readColors(); if (reduceMotion) draw(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            onScreen = entries[0].isIntersecting;
            updateRunning();
        }).observe(canvas);
    }
    document.addEventListener('visibilitychange', updateRunning);
    updateRunning();
})();
