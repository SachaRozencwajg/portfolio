/* Décor de la salle de CEC : murs, sol, plafond, fenêtre, portes et l'équipement autour de la machine.
   Les murs restent blancs quel que soit le thème de la page : le thème sombre ne change que la vue par
   la fenêtre (la nuit). Les écrans suivent l'état de la salle (objet « sim » de salle.js) : par défaut une
   CEC totale, cœur arrêté (ECG plat, pression non pulsée, ventilation arrêtée) ; le scénario repart d'avant. */
(function () {
    'use strict';

    window.SALLE_DECOR = function (k) {
        const { T, scene, M, V, std, glass, put, box, cyl, sph, grp, rbox, slab, pipe, tube, screen, live, SANS, BG } = k;
        const H = 3, X0 = -5.5, X1 = 5.5, Z0 = -4.5, Z1 = 4.5;

        // Hasard reproductible : la salle est la même à chaque chargement
        let seed = 7;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

        function canvasTex(w, h, draw, repeat) {
            const cv = document.createElement('canvas');
            cv.width = w; cv.height = h;
            draw(cv.getContext('2d'), w, h);
            const t = new T.CanvasTexture(cv);
            t.encoding = T.sRGBEncoding;
            t.anisotropy = 8;
            if (repeat) { t.wrapS = T.RepeatWrapping; t.wrapT = T.RepeatWrapping; }
            return t;
        }
        // Une surface imprimée (tableau, étiquette, papier) : éclairée comme le reste, contrairement aux écrans
        function printed(p, w, h, draw, x, y, z, res) {
            const t = canvasTex(res || 256, Math.round((res || 256) * h / w), draw);
            return put(p, new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: t, roughness: 0.75 })), x, y, z, true);
        }

        /* ---------- matières ---------- */
        const D = {
            wall: null,
            floor: std('#c3c9cf', { roughness: 0.55, envMapIntensity: 0.4 }),
            skirt: std('#a5aeb8', { roughness: 0.6 }),
            reveal: std('#eef0ef', { roughness: 0.9 }),
            ceiling: new T.MeshBasicMaterial({ color: new T.Color('#dde1e6').convertSRGBToLinear() }),   // aucune lampe ne l'éclaire par en dessous : teinte fixe
            inox: std('#cfd3d8', { metalness: 0.78, roughness: 0.3 }),
            inoxDark: std('#9aa1aa', { metalness: 0.7, roughness: 0.35 }),
            wheel: std('#2f333a', { roughness: 0.7 }),
            white: std('#f1f2f3', { roughness: 0.5 }),
            grey: std('#d7dbdf', { roughness: 0.55 }),
            panel: std('#e6e9ec', { roughness: 0.5 }),
            rail: std('#d5d9dd', { roughness: 0.45 }),
            frame: std('#e7e9ea', { roughness: 0.4 }),
            worktop: std('#5a6170', { roughness: 0.6 }),
            rubber: std('#2b2f36', { roughness: 0.9 }),
            vision: glass('#8fa6b8', 0.55),
            cabGlass: glass('#dbe9f2', 0.16),
            circuit: std('#8fb5dd', { roughness: 0.35, transparent: true, opacity: 0.85 }),
            yellow: std('#f2c230', { roughness: 0.6 }),
            cardboard: std('#e7cf8e', { roughness: 0.9 }),
            domeShell: std('#f2f3f4', { roughness: 0.35 }),
            domeRim: std('#b9bfc6', { metalness: 0.6, roughness: 0.35 }),
            handle: std('#7fb2d9', { roughness: 0.4 }),
            packs: ['#ffffff', '#e6eef6', '#5b8fd1', '#9fc3e6', '#2f6fb5', '#dfe7dc', '#f1f1f1', '#7aa7d8'].map((c) => std(c, { roughness: 0.75 }))
        };

        // Sol PVC coulé, moucheté
        const floorTex = canvasTex(512, 512, (g, w, h) => {
            g.fillStyle = '#aeb7c1'; g.fillRect(0, 0, w, h);
            const cols = ['#9ea8b3', '#c0c8d0', '#959fab', '#cbd2d9', '#a6b0bb'];
            for (let i = 0; i < 9000; i++) { g.fillStyle = cols[i % 5]; const s = 1 + rnd() * 2; g.fillRect(rnd() * w, rnd() * h, s, s); }
        }, true);
        floorTex.repeat.set(11, 9);
        D.floor.map = floorTex;
        D.floor.color.set(0xffffff);

        // Panneaux muraux blancs de 1,20 m, joint vertical gris
        const wallTex = canvasTex(256, 640, (g, w, h) => {
            g.fillStyle = '#f3f4f2'; g.fillRect(0, 0, w, h);
            g.fillStyle = '#d2d6d9'; g.fillRect(0, 0, 3, h);
            g.fillStyle = 'rgba(0,0,0,0.035)'; g.fillRect(3, 0, 4, h);
        }, true);

        /* =================== Sol et murs =================== */
        const fl = new T.Mesh(new T.PlaneGeometry(X1 - X0, Z1 - Z0), D.floor);
        fl.rotation.x = -Math.PI / 2;
        fl.receiveShadow = true;
        scene.add(fl);

        // Chaque mur a son repère : x le long du mur, z vers l'intérieur de la salle.
        // Ce qui est accroché au mur disparaît avec lui quand la caméra passe derrière.
        const walls = [];
        function makeWall(a, b, hole) {
            const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
            const g = grp(scene);
            const f = grp(g, a[0], 0, a[1]);
            f.rotation.y = Math.atan2(-dz, dx);
            const seg = (u0, u1, y0, y1) => {
                if (u1 - u0 < 0.01 || y1 - y0 < 0.01) return;
                const t = wallTex.clone();
                t.needsUpdate = true;
                t.repeat.set((u1 - u0) / 1.2, (y1 - y0) / H);
                t.offset.set(u0 / 1.2, y0 / H);
                const m = new T.Mesh(new T.PlaneGeometry(u1 - u0, y1 - y0), new T.MeshStandardMaterial({ map: t, roughness: 0.9 }));
                m.position.set((u0 + u1) / 2, (y0 + y1) / 2, 0);
                m.receiveShadow = true;
                f.add(m);
            };
            if (hole) { seg(0, hole.u0, 0, H); seg(hole.u1, L, 0, H); seg(hole.u0, hole.u1, 0, hole.y0); seg(hole.u0, hole.u1, hole.y1, H); } else seg(0, L, 0, H);
            // le sol remonte en gorge sur 10 cm
            const sk = new T.Mesh(new T.PlaneGeometry(L, 0.1), D.skirt);
            sk.position.set(L / 2, 0.05, 0.003);
            sk.receiveShadow = true;
            f.add(sk);
            const w = { g, f, L, n: new T.Vector3(-dz / L, 0, dx / L), p: new T.Vector3(a[0], 0, a[1]) };
            walls.push(w);
            return w;
        }
        // Lisse de protection contre les chocs des chariots
        const rail = (w, u0, u1) => rbox(w.f, u1 - u0, 0.12, 0.028, 0.006, D.rail, (u0 + u1) / 2, 0.92, 0.016);

        const back = makeWall([X0, Z0], [X1, Z0], { u0: 6.9, u1: 9.9, y0: 0.9, y1: 2.45 });
        const left = makeWall([X0, Z1], [X0, Z0]);
        const right = makeWall([X1, Z0], [X1, Z1]);
        const front = makeWall([X1, Z1], [X0, Z1]);

        /* ---------- dessins des écrans et des étiquettes ---------- */
        const font = (wt, px) => `${wt} ${Math.round(px)}px ${SANS}`;
        function drawTEE(g, w, h) {
            g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
            const cx = w * 0.5, cy = h * 0.1, R = h * 0.8, a0 = Math.PI / 2 - 0.75, a1 = Math.PI / 2 + 0.75;
            g.save();
            g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.clip();
            g.fillStyle = '#272727'; g.fillRect(0, 0, w, h);
            const n = Math.round(w * h / 40);
            for (let i = 0; i < n; i++) { const v = 50 + Math.floor(rnd() * 115); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd() * w, cy + rnd() * R, 1 + rnd() * 2, 1); }
            const ch = (x, y, rx, ry) => { g.save(); g.shadowColor = '#000'; g.shadowBlur = R * 0.05; g.fillStyle = '#050505'; g.beginPath(); g.ellipse(cx + x * R, cy + y * R, rx * R, ry * R, 0, 0, 7); g.fill(); g.restore(); };
            ch(0.07, 0.3, 0.14, 0.11);      // oreillette gauche, au plus près de la sonde
            ch(-0.16, 0.32, 0.11, 0.1);     // oreillette droite
            ch(0.12, 0.66, 0.15, 0.21);     // ventricule gauche
            ch(-0.17, 0.64, 0.1, 0.19);     // ventricule droit
            g.strokeStyle = 'rgba(225,225,225,0.85)'; g.lineWidth = Math.max(2, R * 0.01);
            g.beginPath();
            g.moveTo(cx - 0.01 * R, cy + 0.44 * R); g.lineTo(cx + 0.08 * R, cy + 0.5 * R);
            g.moveTo(cx + 0.23 * R, cy + 0.43 * R); g.lineTo(cx + 0.15 * R, cy + 0.5 * R);
            g.moveTo(cx - 0.27 * R, cy + 0.44 * R); g.lineTo(cx - 0.19 * R, cy + 0.49 * R);
            g.stroke();
            g.restore();
            g.strokeStyle = '#4a4a4a'; g.lineWidth = 2;
            g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.stroke();
            g.fillStyle = '#9aa3ad'; g.font = font(500, h * 0.045);
            g.fillText('ETO · 4 cavités · 0°', w * 0.03, h * 0.07);
            for (let i = 0; i <= 8; i++) g.fillRect(w * 0.93, cy + R * i / 8, w * 0.012, 2);
            g.strokeStyle = '#57d39b'; g.lineWidth = Math.max(2, h / 200);
            g.beginPath(); g.moveTo(w * 0.05, h * 0.95); g.lineTo(w * 0.95, h * 0.95); g.stroke();
        }
        // Tracés : ECG, onde de pouls (pression artérielle, pléthysmographie), capnogramme
        const ecg = (t) => 0.12 * Math.exp(-Math.pow((t - 0.16) / 0.035, 2)) + Math.exp(-Math.pow((t - 0.3) / 0.012, 2)) - 0.22 * Math.exp(-Math.pow((t - 0.325) / 0.012, 2)) + 0.26 * Math.exp(-Math.pow((t - 0.55) / 0.06, 2));
        const pulse = (t) => Math.min(1, Math.pow(t / 0.13, 1.25) * Math.exp(1.25 * (1 - t / 0.13)) + 0.2 * Math.exp(-Math.pow((t - 0.46) / 0.05, 2)));
        const capno = (t) => (t < 0.08 ? t / 0.08 : t < 0.45 ? 1 : t < 0.5 ? 1 - (t - 0.45) / 0.05 : 0);
        function drawPatient(g, w, h, sim) {
            sim = sim || {};
            g.fillStyle = BG; g.fillRect(0, 0, w, h);
            const cec = sim.flow > 0;
            // dérivation, couleur, libellé, valeur, valeur entre parenthèses, tracé, amplitude, nombre de cycles
            const rows = [
                ['II', '#57d39b', 'FC', sim.beating ? '72' : '0', '', sim.beating ? ecg : null, 0.52, 5.2],
                ['PA', '#ff6b6b', 'PA', sim.pulsatile ? '112/64' : '66/63', sim.pulsatile ? '(80)' : '(65)', sim.pulsatile ? pulse : null, 0.5, 5.2],
                ['PVC', '#7cc7ff', 'PVC', cec ? '3' : '8', '', null, 0, 1],
                ['Pleth', '#e9e46a', 'SpO₂', sim.pulsatile ? '99' : '---', '', sim.pulsatile ? pulse : null, 0.4, 5.2],
                ['CO₂', '#e6e6e6', 'EtCO₂', sim.vent ? '35' : '0', '', sim.vent ? capno : null, 0.45, 2.2]
            ];
            const top = h * 0.03, lh = h * 0.84 / rows.length, x0 = w * 0.02, x1 = w * 0.66;
            rows.forEach((r, i) => {
                const y0 = top + lh * i, mid = y0 + lh * 0.66;
                g.strokeStyle = r[1]; g.lineWidth = Math.max(2, h / 220); g.lineJoin = 'round';
                g.beginPath();
                for (let x = x0; x <= x1; x += 2) {
                    const t = ((x - x0) / (x1 - x0) * r[7]) % 1;
                    const yy = mid - (r[5] ? r[5](t) * lh * r[6] : (i === 0 ? Math.sin(x * 0.7) * 0.6 : 0));
                    if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy);
                }
                g.stroke();
                g.fillStyle = r[1];
                g.font = font(500, lh * 0.22); g.fillText(r[0], w * 0.02, y0 + lh * 0.3); g.fillText(r[2], w * 0.7, y0 + lh * 0.3);
                g.font = font(600, lh * (i === 1 ? 0.42 : 0.5)); g.fillText(r[3], w * 0.7, y0 + lh * 0.86);
                if (r[4]) { g.font = font(500, lh * 0.28); g.fillText(r[4], w * 0.895, y0 + lh * 0.86); }
                g.fillStyle = '#1d242e'; g.fillRect(0, y0 + lh - 1, w, 1);
            });
            g.font = font(500, h * 0.05);
            g.fillStyle = '#e7c63c'; g.fillText(sim.water ? 'T° 34,0' : 'T° 36,2', w * 0.02, h * 0.965);
            g.fillStyle = '#8b96a8'; g.fillText(cec ? 'CEC en cours' : 'Avant la CEC', w * 0.7, h * 0.965);
        }
        function drawVent(g, w, h, sim) {
            const on = !!(sim && sim.vent);
            g.fillStyle = BG; g.fillRect(0, 0, w, h);
            g.fillStyle = on ? '#57d39b' : '#e7c63c'; g.font = font(600, h * 0.08); g.fillText(on ? 'VOLUME CONTRÔLÉ' : 'MAN / SPONT', w * 0.04, h * 0.11);
            g.fillStyle = '#8b96a8'; g.font = font(500, h * 0.05); g.fillText(on ? 'Ventilation en cours' : 'Ventilation arrêtée pendant la CEC', w * 0.04, h * 0.19);
            const paw = (t) => (t < 0.33 ? 0.2 + 0.8 * t / 0.33 : t < 0.4 ? 1 - 0.8 * (t - 0.33) / 0.07 : 0.2);
            const flo = (t) => (t < 0.33 ? 0.7 : t < 0.36 ? -1 : t < 0.85 ? -Math.exp(-(t - 0.36) / 0.1) : 0);
            [['Paw', '#e7c63c', 0.42, paw, 0.19, 0.09], ['Débit', '#57d39b', 0.72, flo, 0.1, 0]].forEach(([l, c, y, f, amp, base]) => {
                g.strokeStyle = '#1d242e'; g.lineWidth = 2; g.strokeRect(w * 0.04, h * (y - 0.13), w * 0.62, h * 0.24);
                g.strokeStyle = c; g.lineJoin = 'round'; g.beginPath();
                for (let x = 0.04; x <= 0.66; x += 0.004) {
                    const yy = on ? h * (y + base) - f(((x - 0.04) / 0.62 * 3) % 1) * h * amp : h * y;
                    if (x === 0.04) g.moveTo(w * x, yy); else g.lineTo(w * x, yy);
                }
                g.stroke();
                g.fillStyle = c; g.font = font(500, h * 0.045); g.fillText(l, w * 0.055, h * (y - 0.07));
            });
            (on ? [['VT', '450'], ['FR', '12'], ['PEP', '5']] : [['VT', '---'], ['FR', '---'], ['PEP', '0']]).forEach(([l, v], i) => {
                const y = h * (0.33 + i * 0.22);
                g.fillStyle = '#8b96a8'; g.font = font(500, h * 0.05); g.fillText(l, w * 0.72, y);
                g.fillStyle = '#fff'; g.font = font(600, h * 0.1); g.fillText(v, w * 0.72, y + h * 0.1);
            });
            g.fillStyle = '#161c24'; g.fillRect(0, h * 0.9, w, h * 0.1);
        }
        function drawPanel(g, w, h) {
            g.fillStyle = '#0b0f14'; g.fillRect(0, 0, w, h);
            const lab = (t, x, y) => { g.fillStyle = '#7d8899'; g.font = font(500, h * 0.032); g.fillText(t, x, y); };
            const val = (t, x, y, s, c) => { g.fillStyle = c || '#fff'; g.font = font(600, h * s); g.fillText(t, x, y); };
            lab('HEURE', w * 0.08, h * 0.07); val('10:42', w * 0.08, h * 0.19, 0.11);
            lab('CHRONOMÈTRE', w * 0.08, h * 0.27); val('01:12:36', w * 0.08, h * 0.36, 0.07, '#57d39b');
            g.fillStyle = '#1d242e'; g.fillRect(w * 0.08, h * 0.41, w * 0.84, 2);
            [['TEMPÉRATURE', '20,0 °C'], ['HUMIDITÉ', '48 %'], ['SURPRESSION', '+15 Pa']].forEach(([l, v], i) => {
                const y = h * (0.49 + i * 0.09); lab(l, w * 0.08, y); val(v, w * 0.08, y + h * 0.045, 0.045);
            });
            ['Éclairage', 'Scialytiques', 'Flux laminaire', 'Téléphone'].forEach((t, i) => {
                const x = w * (0.08 + (i % 2) * 0.44), y = h * (0.8 + Math.floor(i / 2) * 0.095);
                g.fillStyle = '#1a222d'; g.fillRect(x, y, w * 0.4, h * 0.075);
                g.fillStyle = '#cfd6e0'; g.font = font(500, h * 0.03); g.fillText(t, x + w * 0.04, y + h * 0.048);
            });
        }
        function drawSign(g, w, h) {
            g.fillStyle = '#12161c'; g.fillRect(0, 0, w, h);
            g.fillStyle = '#fff'; g.font = font(600, h * 0.42); g.fillText('SALLE 4', w * 0.05, h * 0.66);
            g.fillStyle = '#d8352a'; g.fillRect(w * 0.42, h * 0.12, w * 0.55, h * 0.76);
            g.fillStyle = '#fff'; g.font = font(600, h * 0.25); g.fillText('INTERVENTION', w * 0.47, h * 0.45); g.fillText('EN COURS', w * 0.47, h * 0.77);
        }
        function drawBoard(g, w, h) {
            g.fillStyle = '#f6f7f5'; g.fillRect(0, 0, w, h);
            const hand = (px) => `500 ${Math.round(px)}px 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive`;
            g.fillStyle = '#1f4fa8'; g.font = hand(h * 0.1); g.fillText('Comptage', w * 0.05, h * 0.14);
            g.fillStyle = '#58606b'; g.font = font(500, h * 0.05); g.fillText('Début', w * 0.56, h * 0.14); g.fillText('Fermeture', w * 0.76, h * 0.14);
            g.strokeStyle = '#c9ced4'; g.lineWidth = 2;
            g.beginPath(); g.moveTo(w * 0.53, h * 0.05); g.lineTo(w * 0.53, h * 0.95); g.moveTo(w * 0.73, h * 0.05); g.lineTo(w * 0.73, h * 0.95); g.stroke();
            [['Compresses', '20'], ['Tampons montés', '10'], ['Aiguilles', '6'], ['Lames', '2'], ['Lacs', '4']].forEach(([l, v], i) => {
                const y = h * (0.27 + i * 0.14);
                g.strokeStyle = '#c9ced4'; g.beginPath(); g.moveTo(w * 0.04, y - h * 0.07); g.lineTo(w * 0.96, y - h * 0.07); g.stroke();
                g.fillStyle = '#1f4fa8'; g.font = hand(h * 0.075); g.fillText(l, w * 0.05, y + h * 0.03); g.fillText(v, w * 0.6, y + h * 0.03);
            });
        }
        function drawKeys(g, w, h) {
            g.fillStyle = '#e4e7ea'; g.fillRect(0, 0, w, h);
            g.fillStyle = '#c3c8ce';
            for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) g.fillRect(w * (0.05 + c * 0.09), h * (0.08 + r * 0.13), w * 0.07, h * 0.09);
            for (let i = 0; i < 8; i++) { g.fillStyle = '#9aa1aa'; g.fillRect(w * (0.06 + i * 0.035), h * 0.55, w * 0.012, h * 0.35); }
            g.fillStyle = '#3a3f47'; g.beginPath(); g.arc(w * 0.62, h * 0.72, h * 0.13, 0, 7); g.fill();
            g.fillStyle = '#5b8fd1'; g.fillRect(w * 0.8, h * 0.6, w * 0.14, h * 0.12);
        }
        function drawClock(g, w, h) {
            const cx = w / 2, cy = h / 2, r = w * 0.48;
            g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
            g.fillStyle = '#20242b';
            for (let i = 0; i < 60; i++) {
                const a = i / 60 * Math.PI * 2, l = i % 5 ? 0.05 : 0.13, t = i % 5 ? 2 : 6;
                g.save(); g.translate(cx, cy); g.rotate(a); g.fillRect(-t / 2, -r * 0.95, t, r * l); g.restore();
            }
            const hand = (a, len, wd, col) => { g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = col; g.fillRect(-wd / 2, -r * len, wd, r * len + r * 0.1); g.restore(); };
            hand((10 + 42 / 60) / 12 * Math.PI * 2, 0.5, 9, '#20242b');
            hand(42 / 60 * Math.PI * 2, 0.78, 6, '#20242b');
            hand(18 / 60 * Math.PI * 2, 0.85, 2, '#d8352a');
            g.fillStyle = '#d8352a'; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill();
        }
        function drawSmall(lines) {
            return (g, w, h) => {
                g.fillStyle = BG; g.fillRect(0, 0, w, h);
                lines.forEach(([t, c, s, x, y]) => { g.fillStyle = c; g.font = font(600, h * s); g.fillText(t, w * x, h * y); });
            };
        }
        function drawDasri(g, w, h) {
            g.fillStyle = '#f2c230'; g.fillRect(0, 0, w, h);
            g.fillStyle = '#1b1d22'; g.font = font(700, h * 0.32); g.fillText('DASRI', w * 0.08, h * 0.45);
            g.font = font(500, h * 0.13); g.fillText('Déchets d\'activités de soins', w * 0.08, h * 0.68); g.fillText('à risques infectieux', w * 0.08, h * 0.84);
        }
        function drawSheet(g, w, h) {
            g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h);
            g.fillStyle = '#20242b'; g.font = font(600, h * 0.04); g.fillText('Feuille de perfusion', w * 0.08, h * 0.07);
            g.strokeStyle = '#b8c0c8'; g.lineWidth = 1;
            for (let i = 0; i < 22; i++) { const y = h * (0.12 + i * 0.038); g.beginPath(); g.moveTo(w * 0.06, y); g.lineTo(w * 0.94, y); g.stroke(); }
            g.fillStyle = '#2a55a8';
            for (let i = 0; i < 14; i++) g.fillRect(w * 0.08, h * (0.135 + i * 0.038), w * (0.2 + rnd() * 0.55), 2);
        }

        /* =================== Mur du fond : écran mural, horloge, fenêtre =================== */
        (function backWall() {
            const f = back.f;
            rail(back, 0.15, 6.75);
            rail(back, 10.05, 10.85);
            // grand écran mural : l'image d'ETO, pour toute l'équipe
            slab(f, 1.3, 0.78, 0.06, 0.012, M.black, 3.5, 1.9, 0.035);
            screen(f, 1.24, 0.72, drawTEE, 3.5, 1.9, 0.0655, 1024);
            // horloge
            const ck = cyl(f, 0.2, 0.2, 0.05, D.inoxDark, 5.25, 2.5, 0.025, 48); ck.rotation.x = Math.PI / 2;
            printed(f, 0.36, 0.36, drawClock, 5.25, 2.5, 0.0515, 256).geometry = new T.CircleGeometry(0.18, 48);

            // fenêtre : ébrasement, tablette, dormant, vitre (jour ou nuit) avec store intégré
            const u0 = 6.9, u1 = 9.9, y0 = 0.9, y1 = 2.45, Dp = 0.24, uc = (u0 + u1) / 2, yc = (y0 + y1) / 2, ww = u1 - u0, hh = y1 - y0;
            const rev = (w, h, x, y, z, ry, rx) => {
                const m = new T.Mesh(new T.PlaneGeometry(w, h), D.reveal);
                m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); m.receiveShadow = true; f.add(m);
            };
            rev(Dp, hh, u0, yc, -Dp / 2, Math.PI / 2);
            rev(Dp, hh, u1, yc, -Dp / 2, -Math.PI / 2);
            rev(ww, Dp, uc, y1, -Dp / 2, 0, Math.PI / 2);
            rbox(f, ww + 0.12, 0.03, Dp + 0.07, 0.008, D.inox, uc, y0 - 0.015, (-Dp + 0.07) / 2);
            D.dayTex = windowTex(false);
            D.nightTex = windowTex(true);
            D.pane = new T.Mesh(new T.PlaneGeometry(ww, hh), new T.MeshBasicMaterial({ map: D.dayTex, toneMapped: false }));
            D.pane.position.set(uc, yc, -Dp + 0.02);
            f.add(D.pane);
            const zf = -Dp + 0.05;
            box(f, ww, 0.06, 0.07, D.frame, uc, y1 - 0.03, zf);
            box(f, ww, 0.06, 0.07, D.frame, uc, y0 + 0.03, zf);
            box(f, 0.06, hh, 0.07, D.frame, u0 + 0.03, yc, zf);
            box(f, 0.06, hh, 0.07, D.frame, u1 - 0.03, yc, zf);
            box(f, 0.06, hh, 0.07, D.frame, uc, yc, zf);
            box(f, ww + 0.1, 0.05, 0.02, D.frame, uc, y1 + 0.025, 0.01);
            box(f, 0.05, hh + 0.1, 0.02, D.frame, u0 - 0.025, yc + 0.025, 0.01);
            box(f, 0.05, hh + 0.1, 0.02, D.frame, u1 + 0.025, yc + 0.025, 0.01);
        })();

        function windowTex(night) {
            seed = 11;
            return canvasTex(1024, 530, (g, w, h) => {
                const sky = g.createLinearGradient(0, 0, 0, h * 0.7);
                if (night) { sky.addColorStop(0, '#0a1222'); sky.addColorStop(1, '#22314d'); } else { sky.addColorStop(0, '#9fc2e4'); sky.addColorStop(1, '#e4edf5'); }
                g.fillStyle = sky; g.fillRect(0, 0, w, h);
                // l'autre aile de l'hôpital, en face
                let x = -20;
                while (x < w) {
                    const bw = 70 + rnd() * 130, bh = h * (0.16 + rnd() * 0.3), top = h * 0.72 - bh;
                    g.fillStyle = night ? (rnd() > 0.5 ? '#121c30' : '#0f182a') : (rnd() > 0.5 ? '#cbd5df' : '#bcc8d4');
                    g.fillRect(x, top, bw, h - top);
                    for (let yy = top + 10; yy < h * 0.95; yy += 16) {
                        for (let xx = x + 8; xx < x + bw - 12; xx += 18) {
                            if (night) { if (rnd() < 0.3) { g.fillStyle = rnd() < 0.7 ? 'rgba(255,214,140,0.9)' : 'rgba(200,225,255,0.75)'; g.fillRect(xx, yy, 9, 7); } }
                            else { g.fillStyle = 'rgba(110,138,166,0.35)'; g.fillRect(xx, yy, 9, 7); }
                        }
                    }
                    x += bw + 6 + rnd() * 24;
                }
                for (let i = 0; i < 26; i++) {
                    const tx = rnd() * w, ty = h * (0.66 + rnd() * 0.06), r = 18 + rnd() * 26;
                    g.fillStyle = night ? '#0b1322' : (rnd() > 0.5 ? '#8eac90' : '#7d9e83');
                    g.beginPath(); g.arc(tx, ty, r, 0, 7); g.fill();
                }
                // film dépoli en partie basse, store vénitien à moitié descendu
                g.fillStyle = night ? 'rgba(36,48,70,0.92)' : 'rgba(241,244,247,0.9)'; g.fillRect(0, h * 0.64, w, h * 0.36);
                g.fillStyle = night ? 'rgba(80,95,120,0.6)' : 'rgba(198,206,214,0.9)'; g.fillRect(0, h * 0.64, w, 3);
                const bottom = h * 0.3;
                for (let y = 0; y < bottom; y += 13) {
                    g.fillStyle = night ? '#394457' : '#e8ebee'; g.fillRect(0, y, w, 10);
                    g.fillStyle = night ? '#2b3545' : '#cfd4da'; g.fillRect(0, y + 8, w, 2);
                }
                g.fillStyle = night ? '#4a5568' : '#c4cad1'; g.fillRect(0, bottom, w, 6);
            });
        }

        /* ---------- portes coulissantes hermétiques, posées en applique ---------- */
        function slidingDoor(w, uc, width, parkToLower, sign) {
            const f = w.f, Hd = 2.2;
            rbox(f, width, Hd, 0.055, 0.012, D.panel, uc, Hd / 2, 0.055);
            box(f, width - 0.04, 0.3, 0.006, D.inox, uc, 0.18, 0.086);
            const vx = uc + (parkToLower ? 0.18 : -0.18) * width / 1.8;
            slab(f, 0.42, 0.56, 0.012, 0.03, D.inox, vx, 1.5, 0.085);
            slab(f, 0.36, 0.5, 0.014, 0.025, D.vision, vx, 1.5, 0.087);
            const hx = uc + (parkToLower ? 1 : -1) * (width / 2 - 0.1);
            rbox(f, 0.035, 0.7, 0.04, 0.012, D.inox, hx, 1.1, 0.1);
            const c0 = parkToLower ? uc - width * 1.5 - 0.1 : uc - width / 2 - 0.1, c1 = parkToLower ? uc + width / 2 + 0.1 : uc + width * 1.5 + 0.1;
            rbox(f, c1 - c0, 0.24, 0.16, 0.02, D.panel, (c0 + c1) / 2, 2.34, 0.08);
            // commande sans contact
            const bx = uc + (parkToLower ? 1 : -1) * (width / 2 + 0.3);
            slab(f, 0.11, 0.11, 0.02, 0.012, D.inox, bx, 1.15, 0.012);
            const b = cyl(f, 0.035, 0.035, 0.008, k.glow('#4f8ff0'), bx, 1.15, 0.024, 24); b.rotation.x = Math.PI / 2;
            if (sign) {
                slab(f, 0.72, 0.18, 0.03, 0.01, M.black, uc, 2.64, 0.02);
                screen(f, 0.68, 0.15, drawSign, uc, 2.64, 0.0355, 512);
            }
        }

        /* =================== Mur de gauche : porte principale, tableau de commande =================== */
        (function leftWall() {
            const f = left.f;
            slidingDoor(left, 3.2, 1.8, true, true);
            slab(f, 0.52, 0.74, 0.03, 0.012, M.black, 5.1, 1.5, 0.016);
            screen(f, 0.48, 0.7, drawPanel, 5.1, 1.5, 0.0315, 512);
            rail(left, 4.25, 8.85);
        })();

        /* ---------- armoires ---------- */
        function glassCabinet(w, uc, W, Hc, Dc) {
            const c = grp(w.f, uc, 0, 0);
            rbox(c, W, 0.1, Dc - 0.03, 0.01, D.inoxDark, 0, 0.05, Dc / 2);
            box(c, W, Hc, 0.02, D.inox, 0, 0.1 + Hc / 2, 0.01);
            [-1, 1].forEach((s) => box(c, 0.03, Hc, Dc, D.inox, s * (W / 2 - 0.015), 0.1 + Hc / 2, Dc / 2));
            box(c, W, 0.03, Dc, D.inox, 0, 0.1 + Hc - 0.015, Dc / 2);
            box(c, 0.03, Hc, Dc, D.inox, 0, 0.1 + Hc / 2, Dc / 2);
            const shelves = [0.02, 0.42, 0.82, 1.22, 1.62];
            shelves.forEach((y) => box(c, W - 0.06, 0.018, Dc - 0.05, D.inox, 0, 0.1 + y, Dc / 2 - 0.01));
            shelves.forEach((y) => {
                [[-W / 2 + 0.05, -0.05], [0.05, W / 2 - 0.05]].forEach(([s, e]) => {
                    let x = s;
                    for (;;) {
                        const pw = 0.08 + rnd() * 0.16, ph = 0.08 + rnd() * 0.22;
                        if (x + pw > e) break;
                        box(c, pw, ph, 0.22 + rnd() * 0.06, D.packs[Math.floor(rnd() * D.packs.length)], x + pw / 2, 0.1 + y + 0.009 + ph / 2, Dc * 0.45);
                        x += pw + 0.01 + rnd() * 0.03;
                    }
                });
            });
            for (let i = 0; i < 4; i++) {
                const x = -W / 2 + W / 8 + i * W / 4, z = Dc - 0.012 - (i % 2) * 0.022;
                box(c, W / 4 - 0.012, Hc - 0.05, 0.008, D.cabGlass, x, 0.1 + Hc / 2, z).castShadow = false;
                box(c, W / 4 - 0.01, 0.025, 0.012, D.inox, x, 0.125, z);
                box(c, W / 4 - 0.01, 0.025, 0.012, D.inox, x, 0.1 + Hc - 0.04, z);
                box(c, 0.015, 0.26, 0.02, D.inox, x + (i % 2 ? -1 : 1) * (W / 8 - 0.05), 0.1 + Hc * 0.5, z + 0.014);
            }
        }
        function closedCabinet(w, uc, W, Hc, Dc) {
            const c = grp(w.f, uc, 0, 0);
            rbox(c, W, 0.1, Dc - 0.03, 0.01, D.inoxDark, 0, 0.05, Dc / 2);
            rbox(c, W, Hc, Dc, 0.015, D.panel, 0, 0.1 + Hc / 2, Dc / 2);
            const n = Math.round(W / 0.4);
            for (let i = 0; i < n; i++) {
                const x = -W / 2 + W / n * (i + 0.5);
                slab(c, W / n - 0.012, Hc - 0.03, 0.012, 0.01, D.white, x, 0.1 + Hc / 2, Dc + 0.006);
                box(c, 0.015, 0.3, 0.025, D.inox, x + (i % 2 ? -1 : 1) * (W / n / 2 - 0.05), 0.1 + Hc * 0.52, Dc + 0.022);
            }
        }

        /* =================== Mur de droite : armoire vitrée, porte de service =================== */
        (function rightWall() {
            glassCabinet(right, 1.8, 2.0, 2.05, 0.42);
            slidingDoor(right, 5.5, 1.2, false, false);
            rail(right, 2.95, 4.75);
            rail(right, 7.45, 8.85);
        })();

        /* =================== Mur d'en face : tableau de comptage, armoire =================== */
        (function frontWall() {
            const f = front.f;
            slab(f, 1.26, 0.86, 0.025, 0.01, D.inox, 6.5, 1.5, 0.0125);
            printed(f, 1.2, 0.8, drawBoard, 6.5, 1.5, 0.0265, 768);
            box(f, 1.0, 0.04, 0.07, D.inox, 6.5, 1.06, 0.035);
            closedCabinet(front, 2.7, 1.6, 2.0, 0.45);
            rail(front, 0.15, 1.75);
            rail(front, 3.65, 5.75);
            rail(front, 7.25, 10.85);
        })();

        /* =================== Plafond : flux laminaire, scialytiques, éclairage =================== */
        const ceil = grp(scene);
        (function ceiling() {
            const cp = new T.Mesh(new T.PlaneGeometry(X1 - X0, Z1 - Z0), D.ceiling);
            cp.rotation.x = Math.PI / 2;
            cp.position.y = H - 0.002;
            ceil.add(cp);
            const light = new T.MeshBasicMaterial({ color: 0xf7f9ff });
            [[1.6, -2.7], [1.6, 1.4], [3.9, -2.7], [3.9, 1.4], [-4.5, 2.4], [-1.9, 2.6], [-4.6, -3.7], [1.6, 3.6]].forEach(([x, z]) => {
                const m = new T.Mesh(new T.PlaneGeometry(0.6, 0.6), light);
                m.rotation.x = Math.PI / 2; m.position.set(x, H - 0.006, z); ceil.add(m);
            });
            // plafond soufflant au-dessus de la table : l'air filtré descend sur le champ
            const lx = -1.9, lz = -1.3, lw = 3.0, ld = 2.8;
            const lamTex = canvasTex(512, 480, (g, w, h) => {
                g.fillStyle = '#eef1f4'; g.fillRect(0, 0, w, h);
                g.fillStyle = '#dde2e7';
                for (let y = 4; y < h; y += 8) for (let x = 4; x < w; x += 8) g.fillRect(x, y, 2, 2);
                g.strokeStyle = '#c3c9d0'; g.lineWidth = 5;
                for (let i = 0; i <= 3; i++) { g.beginPath(); g.moveTo(w * i / 3, 0); g.lineTo(w * i / 3, h); g.moveTo(0, h * i / 3); g.lineTo(w, h * i / 3); g.stroke(); }
            });
            const lam = new T.Mesh(new T.PlaneGeometry(lw, ld), new T.MeshBasicMaterial({ map: lamTex }));
            lam.rotation.x = Math.PI / 2; lam.position.set(lx, H - 0.008, lz); ceil.add(lam);
            const skirt = glass('#dbe8f2', 0.14, { side: T.DoubleSide });
            const sk = grp(ceil); D.skirtGroup = sk;
            const sh = 0.4, sy = H - sh / 2;
            [[lw, lx, lz - ld / 2, 0], [lw, lx, lz + ld / 2, 0], [ld, lx - lw / 2, lz, Math.PI / 2], [ld, lx + lw / 2, lz, Math.PI / 2]].forEach(([len, x, z, ry]) => {
                const m = new T.Mesh(new T.PlaneGeometry(len, sh), skirt); m.position.set(x, sy, z); m.rotation.y = ry; sk.add(m);
                const e = box(sk, len, 0.025, 0.03, D.inox, x, H - sh, z); e.rotation.y = ry;
            });
            // deux coupoles d'éclairage sur bras articulés
            const ledTex = canvasTex(256, 256, (g, w, h) => {
                const cx = w / 2, cy = h / 2;
                g.fillStyle = '#353a42'; g.fillRect(0, 0, w, h);
                [[0.2, 6], [0.45, 12], [0.72, 20]].forEach(([rr, n]) => {
                    for (let i = 0; i < n; i++) {
                        const a = i / n * Math.PI * 2, x = cx + Math.cos(a) * rr * w / 2, y = cy + Math.sin(a) * rr * h / 2;
                        const gr = g.createRadialGradient(x, y, 0, x, y, w * 0.045);
                        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#fff6dc'); gr.addColorStop(1, 'rgba(255,240,210,0)');
                        g.fillStyle = gr; g.beginPath(); g.arc(x, y, w * 0.045, 0, 7); g.fill();
                    }
                });
            });
            function dome(pos, aim, r) {
                const g = grp(ceil, pos[0], pos[1], pos[2]);
                g.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), V(aim).sub(V(pos)).normalize());
                cyl(g, r * 0.55, r, 0.09, D.domeShell, 0, 0, 0, 40);
                const face = new T.Mesh(new T.CircleGeometry(r * 0.94, 40), new T.MeshBasicMaterial({ map: ledTex, toneMapped: false }));
                face.rotation.x = Math.PI / 2; face.position.y = -0.046; g.add(face);
                const rim = new T.Mesh(new T.TorusGeometry(r * 0.97, 0.012, 8, 40), D.domeRim);
                rim.rotation.x = Math.PI / 2; rim.position.y = -0.046; g.add(rim);
                cyl(g, 0.035, 0.03, 0.12, D.handle, 0, -0.1, 0, 18);
                sph(g, 0.035, D.inoxDark, 0, 0.06, 0, 14, 10);
            }
            cyl(ceil, 0.09, 0.09, 0.04, D.domeShell, -1.75, H - 0.02, -1.3, 28);
            cyl(ceil, 0.035, 0.035, 0.5, D.inoxDark, -1.75, H - 0.25, -1.3, 16);
            pipe(ceil, [[-1.75, H - 0.32, -1.3], [-2.15, H - 0.32, -0.95], [-2.15, 2.3, -0.95]], 0.024, D.domeShell, 0.08);
            dome([-2.15, 2.24, -0.95], [-2.02, 1.22, -1.3], 0.32);
            pipe(ceil, [[-1.75, H - 0.46, -1.3], [-1.85, H - 0.46, -1.75], [-1.85, 2.38, -1.75]], 0.022, D.domeShell, 0.08);
            dome([-1.85, 2.32, -1.75], [-2.0, 1.22, -1.25], 0.27);
        })();
        ceil.traverse((o) => { o.castShadow = false; });

        /* =================== Côté anesthésie =================== */
        function caster(p, x, z, r) {
            r = r || 0.04;
            const g = grp(p, x, 0, z);
            const wh = cyl(g, r, r, r * 0.7, D.wheel, 0, r, 0, 18); wh.rotation.x = Math.PI / 2;
            box(g, r * 0.9, r * 0.8, r * 0.8, D.inoxDark, 0, r * 2.1, 0);
        }
        // chariot à deux plateaux
        function cart(p, w, d, h, top) {
            [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
                cyl(p, 0.013, 0.013, h - 0.1, D.inox, sx * (w / 2 - 0.025), (h + 0.1) / 2, sz * (d / 2 - 0.025), 10);
                caster(p, sx * (w / 2 - 0.03), sz * (d / 2 - 0.03), 0.035);
            }));
            rbox(p, w, 0.025, d, 0.01, top || D.inox, 0, h, 0);
            rbox(p, w, 0.02, d, 0.01, D.inox, 0, 0.17, 0);
        }

        (function anaesthesia() {
            // poste d'anesthésie
            const s = grp(scene, -3.95, 0, -2.25); s.rotation.y = 0.55;
            [-0.26, 0.26].forEach((x) => [-0.24, 0.24].forEach((z) => caster(s, x, z, 0.045)));
            rbox(s, 0.66, 0.06, 0.62, 0.02, D.grey, 0, 0.14, 0);
            rbox(s, 0.6, 0.62, 0.56, 0.03, D.white, 0, 0.48, 0);
            [0.32, 0.47, 0.62].forEach((y) => {
                slab(s, 0.54, 0.13, 0.012, 0.012, D.grey, 0, y, 0.286);
                rbox(s, 0.2, 0.018, 0.025, 0.006, D.inox, 0, y + 0.035, 0.3);
            });
            rbox(s, 0.72, 0.035, 0.64, 0.015, D.worktop, 0, 0.8, 0.02);
            rbox(s, 0.58, 0.56, 0.24, 0.03, D.white, 0, 1.1, -0.17);
            slab(s, 0.2, 0.26, 0.012, 0.01, M.black, 0.16, 1.12, -0.044);
            screen(s, 0.17, 0.22, (g, w, h) => {
                g.fillStyle = BG; g.fillRect(0, 0, w, h);
                [['O₂', '#ffffff', 0.3], ['AIR', '#c8ccd2', 0.2], ['N₂O', '#5b8cff', 0]].forEach(([l, c, v], i) => {
                    const x = w * (0.2 + i * 0.3);
                    g.fillStyle = '#1d242e'; g.fillRect(x - 6, h * 0.12, 12, h * 0.64);
                    g.fillStyle = c; g.fillRect(x - 6, h * 0.76 - h * 0.64 * v, 12, h * 0.64 * v);
                    g.fillStyle = '#8b96a8'; g.font = font(500, h * 0.08); g.fillText(l, x - 14, h * 0.9);
                });
            }, 0.16, 1.12, -0.0375, 128);
            // évaporateurs : sévoflurane en jaune, desflurane en bleu
            [[-0.2, '#e8c22e'], [-0.075, '#3a74c9']].forEach(([x, c]) => {
                rbox(s, 0.1, 0.19, 0.13, 0.012, std(c, { roughness: 0.4 }), x, 0.913, 0);
                const kn = cyl(s, 0.032, 0.032, 0.02, M.black, x, 0.95, 0.07, 22); kn.rotation.x = Math.PI / 2;
            });
            // absorbeur de CO₂ et ballon
            box(s, 0.06, 0.04, 0.06, D.inoxDark, -0.33, 0.62, 0.08);
            cyl(s, 0.07, 0.07, 0.22, glass('#ffffff', 0.35), -0.38, 0.62, 0.08, 20).castShadow = false;
            cyl(s, 0.06, 0.06, 0.2, std('#d9c6e8', { roughness: 0.9 }), -0.38, 0.62, 0.08, 20);
            tube(s, [[-0.33, 0.83, 0.12], [-0.42, 0.98, 0.18], [-0.42, 1.02, 0.22]], 0.012, D.circuit);
            const bag = sph(s, 0.075, std('#2a2f37', { roughness: 0.85 }), -0.42, 0.92, 0.24, 18, 12); bag.scale.set(0.9, 1.4, 0.9);
            // écran du ventilateur
            cyl(s, 0.02, 0.02, 0.22, D.inox, 0.08, 1.46, -0.2, 12);
            const vs = grp(s, 0.08, 1.6, -0.14); vs.rotation.x = -0.12;
            slab(vs, 0.42, 0.31, 0.04, 0.014, M.black, 0, 0, 0);
            live(vs, 0.39, 0.28, drawVent, 0, 0, 0.0205, 512);
            // circuit patient jusqu'à la sonde d'intubation
            tube(scene, [[-4.12, 0.83, -1.89], [-3.92, 1.1, -1.66], [-3.45, 1.19, -1.44], [-3.05, 1.13, -1.34], [-2.93, 1.1, -1.31]], 0.021, D.circuit);
            tube(scene, [[-4.03, 0.83, -1.9], [-3.82, 1.08, -1.72], [-3.4, 1.16, -1.52], [-3.03, 1.12, -1.38], [-2.93, 1.1, -1.32]], 0.021, D.circuit);

            // bras plafonnier : fluides médicaux, prises, moniteur patient
            const pc = grp(scene, -4.75, 0, -3.05); pc.rotation.y = 0.62;
            rbox(pc, 0.3, 1.8, 0.3, 0.03, D.panel, 0, 1.85, 0);
            rbox(pc, 0.32, 0.04, 0.32, 0.02, D.inoxDark, 0, 0.94, 0);
            rbox(pc, 0.16, 0.12, 0.8, 0.03, D.panel, 0, 2.83, -0.35);
            cyl(pc, 0.06, 0.06, 0.16, D.panel, 0, 2.92, -0.7, 18);
            cyl(pc, 0.16, 0.16, 0.03, D.panel, 0, H - 0.015, -0.7, 28);
            // prises de fluides (norme européenne : oxygène blanc, air noir et blanc, vide jaune, protoxyde bleu)
            [['#f4f4f4', -0.09], ['#26292e', -0.03], ['#f2c81e', 0.03], ['#2f6fe5', 0.09]].forEach(([c, x]) => {
                const o = cyl(pc, 0.022, 0.022, 0.025, std(c, { roughness: 0.4 }), x, 1.34, 0.162, 22); o.rotation.x = Math.PI / 2;
                const hole = cyl(pc, 0.009, 0.009, 0.01, M.black, x, 1.34, 0.176, 12); hole.rotation.x = Math.PI / 2;
            });
            printed(pc, 0.24, 0.035, (g, w, h) => {
                g.fillStyle = '#e6e9ec'; g.fillRect(0, 0, w, h);
                g.fillStyle = '#3a404a'; g.font = font(600, h * 0.6);
                ['O₂', 'AIR', 'VIDE', 'N₂O'].forEach((t, i) => g.fillText(t, w * (0.06 + i * 0.245), h * 0.72));
            }, 0, 1.4, 0.152, 256);
            [-0.08, 0, 0.08].forEach((x) => slab(pc, 0.06, 0.06, 0.012, 0.008, D.grey, x, 1.17, 0.156));
            pipe(scene, [[-4.62, 1.82, -2.94], [-3.98, 1.82, -2.95], [-3.68, 1.84, -2.86]], 0.02, D.panel, 0.08);
            const mg = grp(scene, -3.6, 1.86, -2.78); mg.rotation.y = 0.5;
            rbox(mg, 0.2, 0.18, 0.06, 0.015, D.panel, 0, 0, -0.05);
            slab(mg, 0.5, 0.37, 0.05, 0.015, M.black, 0, 0, 0);
            live(mg, 0.465, 0.335, drawPatient, 0, 0, 0.0255, 768);

            // échographe d'ETO
            const e = grp(scene, -2.85, 0, -2.5); e.rotation.y = 0.2;
            [-0.2, 0.2].forEach((x) => [-0.2, 0.2].forEach((z) => caster(e, x, z, 0.04)));
            rbox(e, 0.5, 0.07, 0.5, 0.02, D.grey, 0, 0.13, 0);
            rbox(e, 0.2, 0.62, 0.16, 0.02, D.white, 0, 0.48, -0.08);
            const kb = grp(e, 0, 0.84, 0); kb.rotation.x = 0.22;
            rbox(kb, 0.54, 0.06, 0.36, 0.02, D.white, 0, 0, 0);
            const keys = printed(kb, 0.48, 0.3, drawKeys, 0, 0.031, 0, 384); keys.rotation.x = -Math.PI / 2;
            cyl(e, 0.022, 0.022, 0.3, D.inox, 0, 1.06, -0.14, 12);
            const es = grp(e, 0, 1.37, -0.12); es.rotation.x = -0.08;
            slab(es, 0.48, 0.33, 0.04, 0.014, M.black, 0, 0, 0);
            screen(es, 0.45, 0.3, drawTEE, 0, 0, 0.0205, 512);
            cyl(e, 0.03, 0.03, 0.14, D.grey, 0.3, 0.8, 0.05, 14);
            tube(scene, [[-2.55, 0.87, -2.51], [-2.66, 1.05, -2.15], [-2.78, 1.2, -1.8], [-2.84, 1.16, -1.45], [-2.85, 1.1, -1.33]], 0.0065, M.cable);

            // pied à perfusion et pousse-seringues, du côté de la voie veineuse centrale
            const ip = grp(scene, -3.5, 0, -0.5);
            cyl(ip, 0.014, 0.014, 1.95, D.inox, 0, 1.0, 0, 10);
            for (let i = 0; i < 5; i++) {
                const a = i * Math.PI * 2 / 5;
                const leg = box(ip, 0.26, 0.022, 0.035, D.inoxDark, Math.cos(a) * 0.13, 0.08, Math.sin(a) * 0.13); leg.rotation.y = -a;
                caster(ip, Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.03);
            }
            [-0.08, 0.08].forEach((x) => box(ip, 0.12, 0.2, 0.03, glass('#eef3fa', 0.6), x, 1.78, 0).castShadow = false);
            box(ip, 0.3, 0.012, 0.012, D.inox, 0, 1.92, 0);
            [1.0, 1.13, 1.26].forEach((y, i) => {
                const sp = grp(ip, 0.1, y, 0); sp.rotation.y = Math.PI / 2;
                rbox(sp, 0.3, 0.1, 0.14, 0.015, D.white, 0, 0, 0);
                screen(sp, 0.08, 0.04, drawSmall([[['4,0', '2,5', '12'][i], '#57d39b', 0.7, 0.08, 0.78]]), -0.08, 0.015, 0.071, 96);
                const syr = cyl(sp, 0.016, 0.016, 0.15, glass('#ffffff', 0.6), 0.05, 0.035, 0.05, 14); syr.rotation.z = Math.PI / 2; syr.castShadow = false;
            });
            tube(scene, [[-3.38, 1.1, -0.5], [-3.15, 1.02, -0.8], [-2.95, 1.04, -1.12], [-2.9, 1.06, -1.2]], 0.004, D.white);

            // chariot d'anesthésie le long du mur
            const dc = grp(scene, -5.0, 0, -1.35); dc.rotation.y = Math.PI / 2;
            [-0.26, 0.26].forEach((x) => [-0.19, 0.19].forEach((z) => caster(dc, x, z, 0.04)));
            rbox(dc, 0.62, 0.92, 0.48, 0.02, D.white, 0, 0.56, 0);
            for (let i = 0; i < 5; i++) {
                const y = 0.24 + i * 0.165;
                slab(dc, 0.58, 0.15, 0.012, 0.01, D.grey, 0, y, 0.246);
                rbox(dc, 0.22, 0.02, 0.025, 0.006, std('#3f78c8', { roughness: 0.5 }), 0, y + 0.045, 0.262);
            }
            rbox(dc, 0.66, 0.03, 0.52, 0.01, D.worktop, 0, 1.035, 0);
            rbox(dc, 0.16, 0.18, 0.12, 0.012, D.yellow, -0.18, 1.14, 0.02);
            rbox(dc, 0.17, 0.03, 0.13, 0.01, std('#e0a91a', { roughness: 0.5 }), -0.18, 1.245, 0.02);
            rbox(dc, 0.24, 0.1, 0.13, 0.01, D.white, 0.14, 1.1, 0.04);
        })();

        /* =================== Côté chirurgical =================== */
        (function surgical() {
            // table d'instrumentation sous champ
            const bt = grp(scene, -1.25, 0, -2.95);
            [-0.7, 0.7].forEach((x) => [-0.33, 0.33].forEach((z) => { cyl(bt, 0.016, 0.016, 0.8, D.inox, x, 0.5, z, 10); caster(bt, x, z, 0.04); }));
            rbox(bt, 1.5, 0.03, 0.72, 0.01, D.inox, 0, 0.9, 0);
            box(bt, 1.56, 0.012, 0.78, M.drape, 0, 0.922, 0);
            [-1, 1].forEach((s) => { box(bt, 1.56, 0.42, 0.01, M.drape, 0, 0.71, s * 0.395); box(bt, 0.01, 0.42, 0.78, M.drape, s * 0.785, 0.71, 0); });
            rbox(bt, 0.5, 0.03, 0.3, 0.008, D.inox, -0.35, 0.943, -0.1);
            for (let i = 0; i < 9; i++) { const ins = box(bt, 0.17, 0.006, 0.01, D.inox, -0.35 + (i - 4) * 0.012, 0.962, -0.1 + (i % 3 - 1) * 0.06); ins.rotation.y = (i % 2 ? 0.08 : -0.06); }
            [[0.2, 0.15, 0.09], [0.42, -0.15, 0.07]].forEach(([x, z, r]) => cyl(bt, r, r * 0.75, 0.06, D.inox, x, 0.958, z, 24));
            box(bt, 0.26, 0.03, 0.18, std('#4f8a6e', { roughness: 0.9 }), 0.55, 0.943, 0.18);
            box(bt, 0.2, 0.02, 0.14, D.white, -0.05, 0.938, 0.2);
            // écarteur sternal en réserve
            box(bt, 0.26, 0.012, 0.02, D.inox, 0.2, 0.935, -0.2);
            box(bt, 0.012, 0.012, 0.16, D.inox, 0.09, 0.935, -0.13);
            box(bt, 0.012, 0.012, 0.16, D.inox, 0.25, 0.935, -0.13);

            // bistouri électrique
            const eu = grp(scene, -0.1, 0, -2.6); eu.rotation.y = 0.1;
            cart(eu, 0.55, 0.45, 0.8);
            rbox(eu, 0.44, 0.16, 0.38, 0.02, D.white, 0, 0.9, 0);
            screen(eu, 0.3, 0.08, drawSmall([['COUPE 30 W', '#f2c81e', 0.38, 0.05, 0.45], ['COAG 30 W', '#5b8cff', 0.38, 0.05, 0.9]]), 0, 0.93, 0.191, 256);
            [-0.12, -0.04, 0.04].forEach((x) => { const so = cyl(eu, 0.016, 0.016, 0.01, M.black, x, 0.86, 0.192, 14); so.rotation.x = Math.PI / 2; });
            rbox(eu, 0.4, 0.14, 0.36, 0.02, D.grey, 0, 0.26, 0);
            rbox(eu, 0.25, 0.05, 0.16, 0.02, std('#3f78c8', { roughness: 0.5 }), 0.05, 0.025, 0.45);
            tube(scene, [[-0.1, 0.25, -2.4], [-0.07, 0.05, -2.2], [-0.05, 0.03, -2.15]], 0.006, M.cable);

            // défibrillateur, avec ses palettes internes
            const df = grp(scene, 0.7, 0, -3.35); df.rotation.y = -0.2;
            cart(df, 0.48, 0.42, 0.78);
            rbox(df, 0.36, 0.26, 0.3, 0.03, std('#4a4f57', { roughness: 0.5 }), 0, 0.925, 0);
            screen(df, 0.17, 0.12, drawSmall([['Palettes internes', '#8b96a8', 0.12, 0.06, 0.2], ['10 J', '#ffffff', 0.32, 0.06, 0.62]]), -0.06, 0.95, 0.151, 256);
            const sb = cyl(df, 0.024, 0.024, 0.014, std('#f07c22', { roughness: 0.4 }), 0.11, 0.9, 0.152, 22); sb.rotation.x = Math.PI / 2;
            rbox(df, 0.22, 0.03, 0.05, 0.01, M.black, 0, 1.075, 0);
            [-0.08, 0.08].forEach((x) => { const pd = cyl(df, 0.02, 0.02, 0.2, std('#3a3f47'), x, 0.2, 0.05, 14); pd.rotation.x = Math.PI / 2; });

            // support de sacs : DASRI (jaune) et ordures ménagères (noir)
            const bh = grp(scene, -0.1, 0, -4.05);
            [['#f2c230', -0.2], ['#2b2f36', 0.2]].forEach(([c, x]) => {
                cyl(bh, 0.17, 0.15, 0.62, std(c, { roughness: 0.85 }), x, 0.42, 0, 24);
                const ring = put(bh, new T.Mesh(new T.TorusGeometry(0.18, 0.012, 8, 28), D.inox), x, 0.74, 0); ring.rotation.x = Math.PI / 2;
                cyl(bh, 0.19, 0.19, 0.025, c === '#f2c230' ? D.yellow : D.grey, x, 0.765, 0, 28);
            });
            [-0.38, 0.38].forEach((x) => [-0.17, 0.17].forEach((z) => { cyl(bh, 0.012, 0.012, 0.66, D.inox, x, 0.42, z, 8); caster(bh, x, z, 0.035); }));

            // seaux à compresses, et un marchepied rangé contre le mur
            [[-1.5, -0.45], [-1.58, -2.3]].forEach(([x, z]) => {
                const b = grp(scene, x, 0, z);
                for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; caster(b, Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.03); }
                cyl(b, 0.17, 0.17, 0.02, D.inox, 0, 0.08, 0, 24);
                cyl(b, 0.17, 0.13, 0.3, D.inox, 0, 0.24, 0, 28);
                const lin = put(b, new T.Mesh(new T.TorusGeometry(0.17, 0.012, 8, 28), D.white), 0, 0.39, 0); lin.rotation.x = Math.PI / 2;
                cyl(b, 0.158, 0.158, 0.004, std('#e9edf1', { roughness: 0.9 }), 0, 0.37, 0, 24);
            });
            [[-0.9, -4.2, 0]].forEach(([x, z, ry]) => {
                const st = grp(scene, x, 0, z); st.rotation.y = ry;
                rbox(st, 0.5, 0.2, 0.32, 0.02, D.inox, 0, 0.1, 0);
                box(st, 0.46, 0.006, 0.28, D.rubber, 0, 0.203, 0);
            });
        })();

        /* =================== Côté perfusion =================== */
        (function perfusion() {
            // tabouret du perfusionniste
            const SX = 1.05, SZ = 1.2;
            cyl(scene, 0.17, 0.17, 0.06, M.dark, SX, 0.56, SZ, 28);
            cyl(scene, 0.025, 0.025, 0.5, M.chrome, SX, 0.29, SZ, 12);
            for (let i = 0; i < 5; i++) {
                const a = i * Math.PI * 2 / 5;
                const leg = box(scene, 0.26, 0.025, 0.04, M.aluDark, SX + Math.cos(a) * 0.13, 0.06, SZ + Math.sin(a) * 0.13); leg.rotation.y = -a;
                sph(scene, 0.03, M.black, SX + Math.cos(a) * 0.26, 0.03, SZ + Math.sin(a) * 0.26, 12, 8);
            }
            // desserte : analyseur de gaz du sang, appareil d'ACT, feuille de perfusion
            const pt = grp(scene, 2.55, 0, 0.95); pt.rotation.y = -0.25;
            cart(pt, 0.6, 0.45, 0.85);
            rbox(pt, 0.26, 0.24, 0.24, 0.02, D.white, -0.13, 0.985, -0.05);
            screen(pt, 0.13, 0.09, drawSmall([['GDS', '#8b96a8', 0.2, 0.08, 0.3], ['pH 7,38', '#ffffff', 0.24, 0.08, 0.7]]), -0.13, 1.02, 0.0705, 192);
            rbox(pt, 0.16, 0.08, 0.2, 0.015, D.grey, 0.15, 0.905, -0.06);
            live(pt, 0.1, 0.045, (g, w, h, sim) => drawSmall([[sim && sim.act ? 'ACT · contrôlé' : 'ACT · en attente', sim && sim.act ? '#57d39b' : '#e7c63c', 0.36, 0.06, 0.68]])(g, w, h), 0.15, 0.91, 0.0405, 192);
            const sheet = printed(pt, 0.21, 0.297, drawSheet, 0.1, 0.8645, 0.12, 256); sheet.rotation.x = -Math.PI / 2; sheet.rotation.z = 0.1;
            const pen = cyl(pt, 0.005, 0.005, 0.14, std('#2a55a8'), 0.2, 0.869, 0.1, 8); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.5;
            for (let i = 0; i < 3; i++) { const sy = cyl(pt, 0.008, 0.008, 0.09, glass('#ffffff', 0.7), -0.06 + i * 0.025, 0.872, 0.17, 10); sy.rotation.z = Math.PI / 2; sy.castShadow = false; }

            // récupérateur de sang
            const cs = grp(scene, 2.25, 0, -2.0); cs.rotation.y = -0.35;
            [-0.2, 0.2].forEach((x) => [-0.2, 0.2].forEach((z) => caster(cs, x, z, 0.045)));
            rbox(cs, 0.52, 0.8, 0.5, 0.03, D.white, 0, 0.5, 0);
            [0.3, 0.42].forEach((y) => box(cs, 0.4, 0.012, 0.004, D.grey, 0, y, 0.252));
            cyl(cs, 0.17, 0.17, 0.03, glass('#dfe9f2', 0.4), 0, 0.915, 0.05, 28).castShadow = false;
            cyl(cs, 0.1, 0.08, 0.1, std('#c64b4b', { roughness: 0.4 }), 0, 0.87, 0.05, 22);
            const cg = grp(cs, 0, 1.12, -0.17); cg.rotation.x = -0.25;
            slab(cg, 0.3, 0.22, 0.04, 0.012, M.black, 0, 0, 0);
            screen(cg, 0.27, 0.19, drawSmall([['Récupération', '#8b96a8', 0.12, 0.06, 0.2], ['Bol 225 mL', '#ffffff', 0.18, 0.06, 0.5], ['Remplissage', '#57d39b', 0.13, 0.06, 0.8]]), 0, 0, 0.0205, 256);
            cyl(cs, 0.014, 0.014, 1.1, D.inox, -0.2, 1.45, -0.2, 10);
            box(cs, 0.3, 0.012, 0.012, D.inox, -0.2, 1.98, -0.2);
            [-0.3, -0.1].forEach((x) => box(cs, 0.13, 0.22, 0.035, glass('#eef3fa', 0.6), x, 1.82, -0.2).castShadow = false);
            cyl(cs, 0.08, 0.07, 0.24, glass('#ffffff', 0.4), -0.2, 1.3, -0.08, 20).castShadow = false;
            cyl(cs, 0.07, 0.06, 0.1, std('#9c2a35', { roughness: 0.4 }), -0.2, 1.235, -0.08, 20);
            box(cs, 0.2, 0.3, 0.04, std('#e8b4b4', { roughness: 0.6, transparent: true, opacity: 0.8 }), 0.27, 0.6, 0.0);

            // générateur thermique : à côté de la machine, sortie d'air à l'opposé du champ
            const th = grp(scene, 2.15, 0, -0.25); th.rotation.y = -Math.PI / 2;
            [-0.24, 0.24].forEach((x) => [-0.28, 0.28].forEach((z) => caster(th, x, z, 0.045)));
            rbox(th, 0.6, 0.86, 0.7, 0.04, D.white, 0, 0.53, 0);
            rbox(th, 0.62, 0.05, 0.72, 0.04, M.dark, 0, 0.985, 0);
            [0.36, 0.44, 0.52].forEach((y) => box(th, 0.4, 0.03, 0.012, D.grey, 0, y, 0.352));
            screen(th, 0.22, 0.1, drawSmall([['34,0 °C', '#7cc7ff', 0.48, 0.08, 0.68]]), 0, 0.81, 0.352, 192);
            const fan = cyl(th, 0.18, 0.18, 0.01, M.black, 0, 0.55, -0.355, 28); fan.rotation.x = Math.PI / 2;
            [-0.15, 0.15].forEach((x) => { const po = cyl(th, 0.025, 0.025, 0.04, D.inoxDark, x, 0.45, 0.36, 14); po.rotation.x = Math.PI / 2; });

            // cartons DASRI
            [[-5.1, 3.75, 0.2], [5.05, -4.05, -0.3]].forEach(([x, z, ry]) => {
                const d = grp(scene, x, 0, z); d.rotation.y = ry;
                rbox(d, 0.42, 0.44, 0.34, 0.01, D.cardboard, 0, 0.22, 0);
                box(d, 0.43, 0.05, 0.35, D.yellow, 0, 0.42, 0);
                printed(d, 0.3, 0.14, drawDasri, 0, 0.26, 0.171, 256);
            });
        })();

        /* =================== L'équipe : des silhouettes sans visage, en tenue de bloc =================== */
        const people = [];
        const PM = {
            gown: std('#3f8f86', { roughness: 0.92 }), scrubs: std('#5d86b8', { roughness: 0.92 }), cap: std('#3f78b0', { roughness: 0.85 }),
            mask: std('#bcd9ea', { roughness: 0.9 }), glove: std('#f2efe6', { roughness: 0.6 }), clog: std('#eef0f2', { roughness: 0.6 }),
            skins: ['#e3bfa3', '#c99673', '#a8744f'].map((c) => std(c, { roughness: 0.8 }))
        };
        // La personne regarde vers +z de son repère. o : { sterile (casaque longue et gants), seated, skin, hands: deux points }
        function person(x, z, ry, o) {
            const g = grp(scene, x, 0, z); g.rotation.y = ry;
            const cloth = o.sterile ? PM.gown : PM.scrubs, skin = PM.skins[o.skin || 0];
            const hip = o.seated ? 0.62 : 0.92, sh = hip + 0.5, headY = sh + 0.2;
            [-1, 1].forEach((sd) => {
                const hx = sd * 0.09;
                if (o.seated) tube(g, [[hx, hip, 0], [hx * 1.1, hip - 0.01, 0.38], [hx * 1.1, 0.1, 0.42]], 0.068, PM.scrubs);
                else cyl(g, 0.072, 0.06, hip - 0.06, PM.scrubs, hx, (hip + 0.06) / 2, 0, 14);
                rbox(g, 0.1, 0.07, 0.25, 0.03, PM.clog, hx * 1.1, 0.035, o.seated ? 0.47 : 0.04);
            });
            const th = sh - hip + (o.sterile ? 0.5 : 0.06);
            const torso = cyl(g, 0.17, o.sterile ? 0.23 : 0.19, th, cloth, 0, sh - th / 2, 0, 22); torso.scale.z = 0.62;
            const shoulders = sph(g, 0.2, cloth, 0, sh - 0.02, 0, 18, 10); shoulders.scale.set(1.12, 0.42, 0.62);
            cyl(g, 0.05, 0.055, 0.1, skin, 0, sh + 0.06, 0, 12);
            const head = sph(g, 0.105, skin, 0, headY, 0, 20, 14); head.scale.set(0.92, 1.08, 1);
            const cap = put(g, new T.Mesh(new T.SphereGeometry(0.112, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), PM.cap), 0, headY + 0.012, -0.008); cap.scale.set(0.95, 1, 1.04);
            const mask = sph(g, 0.085, PM.mask, 0, headY - 0.045, 0.045, 14, 10); mask.scale.set(0.95, 0.62, 0.8);
            o.hands.forEach((hd, i) => {
                const sd = i ? 1 : -1, shx = sd * 0.21;
                tube(g, [[shx, sh - 0.03, 0], [shx + sd * 0.05 + (hd[0] - shx) * 0.35, (sh + hd[1]) / 2 - 0.1, hd[2] * 0.4 - 0.02], hd], 0.046, cloth);
                sph(g, 0.048, o.sterile ? PM.glove : skin, hd[0], hd[1], hd[2], 12, 8);
            });
            people.push({ g, x, z, top: headY + 0.12 });
        }
        person(-2.02, -0.5, Math.PI, { sterile: true, skin: 0, hands: [[-0.12, 1.28, 0.5], [0.13, 1.3, 0.48]] });        // chirurgien, à droite du patient
        person(-1.95, -2.1, 0, { sterile: true, skin: 1, hands: [[-0.13, 1.28, 0.44], [0.12, 1.3, 0.46]] });              // aide, en face
        person(-1.2, -2.2, -0.5, { sterile: true, skin: 0, hands: [[-0.16, 1.15, 0.3], [0.14, 1.08, 0.26]] });            // instrumentiste
        person(-3.55, -1.05, Math.PI / 2, { skin: 2, hands: [[-0.24, 0.98, 0.1], [0.22, 1.05, 0.2]] });                    // anesthésiste, à la tête
        person(1.05, 1.2, Math.PI + 0.35, { seated: true, skin: 1, hands: [[-0.2, 0.98, 0.42], [0.18, 0.9, 0.5]] });     // perfusionniste, assis devant la machine

        /* ---------- lumières propres au décor ---------- */
        const winLight = new T.DirectionalLight(0xe4eeff, 0.32);
        winLight.position.set(2.9, 4.0, -12);
        winLight.target.position.set(1.0, 0.5, 0);
        scene.add(winLight); scene.add(winLight.target);
        const fill = new T.DirectionalLight(0xffffff, 0.18);
        fill.position.set(-12, 5, 2);
        scene.add(fill);
        const spot = new T.SpotLight(0xfff4e0, 0.6, 4.5, 0.45, 0.6, 1.2);
        spot.position.set(-2.15, 2.2, -0.95);
        spot.target.position.set(-2.02, 1.22, -1.3);
        scene.add(spot); scene.add(spot.target);

        return {
            walls,
            floor: fl,
            people,
            // vu d'au-dessus, le cadre du flux laminaire barrerait l'image : on ne le montre que de plus bas que lui
            update(camera) { D.skirtGroup.visible = camera.position.y < H - 0.5; },
            setNight(night) {
                D.pane.material.map = night ? D.nightTex : D.dayTex;
                D.pane.material.needsUpdate = true;
                winLight.intensity = night ? 0 : 0.32;
            }
        };
    };
})();
