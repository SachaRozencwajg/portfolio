/* Salle de CEC en 3D : la machine cœur-poumon, le patient et leurs lignes, avec des éléments cliquables.
   La machine s'inspire d'une machine cœur-poumon récente (base sur roulettes, colonne, cadre tubulaire,
   pompes à galets montées sur mât avec leur unité de commande, cockpit, moniteur patient).
   Tout est construit en code avec three.js r128 : aucun modèle ni image externe. */
(function () {
    'use strict';
    const { VIEWS, HOTSPOTS, TOUR, QUIZ } = window.SALLE;
    const HS = {};
    HOTSPOTS.forEach((h) => { HS[h.id] = h; });

    const $ = (id) => document.getElementById(id);
    const stage = $('stage'), canvas = $('scene'), pinsEl = $('pins'), panel = $('panel'), panelBody = $('panelBody');
    const panelNav = $('panelNav'), chipsEl = $('chips'), counterEl = $('counter'), quizEl = $('quiz'), hintEl = $('hint');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = () => stage.clientWidth < 720;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    stage.classList.toggle('is-touch', touch);

    const state = { sel: null, mode: null, tour: 0, quiz: null, visited: {}, walk: false };
    try { state.visited = JSON.parse(localStorage.getItem('salle-cec-vus') || '{}') || {}; } catch (e) { state.visited = {}; }
    const saveVisited = () => { try { localStorage.setItem('salle-cec-vus', JSON.stringify(state.visited)); } catch (e) { /* stockage indisponible */ } };

    /* =====================================================================
       Interface (fonctionne aussi sans 3D)
       ===================================================================== */
    function renderModes() {
        $('tourBtn').setAttribute('aria-pressed', String(state.mode === 'tour'));
        $('quizBtn').setAttribute('aria-pressed', String(state.mode === 'quiz'));
        $('walkBtn').setAttribute('aria-pressed', String(state.walk));
        stage.classList.toggle('is-quiz', state.mode === 'quiz');
        stage.classList.toggle('is-walk', state.walk);
        if (state.mode === 'quiz') hintEl.textContent = 'Cliquez sur le bon élément';
        else if (state.walk) hintEl.textContent = touch ? 'Joystick pour marcher · glissez pour regarder' : 'ZQSD ou flèches pour marcher · glissez pour regarder · cliquez au sol pour y aller';
        else hintEl.textContent = touch ? 'Glissez pour tourner · touchez un point' : 'Glissez ou flèches pour tourner autour · cliquez sur un point';
    }

    function renderChips() {
        const seen = HOTSPOTS.filter((h) => state.visited[h.id]).length;
        counterEl.textContent = `${seen} élément${seen > 1 ? 's' : ''} vu${seen > 1 ? 's' : ''} sur ${HOTSPOTS.length}`;
        chipsEl.innerHTML = '';
        HOTSPOTS.forEach((h) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip' + (state.visited[h.id] ? ' is-seen' : '') + (state.sel === h.id ? ' is-on' : '');
            b.textContent = h.title;
            b.addEventListener('click', () => select(h.id, true));
            chipsEl.appendChild(b);
        });
        pinsEl.querySelectorAll('.pin').forEach((p) => {
            p.classList.toggle('is-seen', !!state.visited[p.dataset.id]);
            p.classList.toggle('is-on', state.sel === p.dataset.id);
        });
    }

    function showPanel(h) {
        const tourStep = state.mode === 'tour' ? TOUR[state.tour] : null;
        panelBody.innerHTML = (tourStep ? `<p class="step">Étape ${state.tour + 1} sur ${TOUR.length} · ${tourStep.step}</p>` : '')
            + `<p class="kicker">${h.kicker || ''}</p><h3 id="panelTitle" tabindex="-1">${h.title}</h3>${h.html || ''}`
            + '<p class="draft">Outil pédagogique en cours de relecture : il ne remplace pas les protocoles de votre équipe.</p>';
        panelNav.hidden = !tourStep;
        if (tourStep) {
            $('tourPrev').disabled = state.tour === 0;
            $('tourNext').textContent = state.tour === TOUR.length - 1 ? 'Terminer' : 'Étape suivante';
        }
        panel.classList.add('is-open');
        stage.classList.add('has-panel');
        panel.setAttribute('aria-hidden', 'false');
        panelBody.scrollTop = 0;
        if (h.id === 'pompe') bindCalc();
        setOffset(true);
    }

    function hidePanel() {
        panel.classList.remove('is-open');
        stage.classList.remove('has-panel');
        panel.setAttribute('aria-hidden', 'true');
        setOffset(false);
    }

    // Petit calcul de la fiche « pompe » : DO2 = débit × 10 × (1,34 × Hb × SaO2 + 0,003 × PaO2)
    function bindCalc() {
        const q = $('doQ'), hb = $('doHb'), out = $('doOut');
        if (!q || !hb) return;
        const fr = (v, d) => v.toFixed(d).replace('.', ',');
        const update = () => {
            const Q = parseFloat(q.value), H = parseFloat(hb.value);
            const do2 = Math.round(Q * 10 * (1.34 * H + 0.003 * 200));
            $('doQo').textContent = fr(Q, 1);
            $('doHbo').textContent = fr(H, 1);
            out.textContent = `DO₂ ≈ ${do2} mL/min/m² : ${do2 >= 280 ? 'au-dessus du seuil de 280.' : 'sous le seuil de 280.'}`;
            out.classList.toggle('is-low', do2 < 280);
        };
        q.addEventListener('input', update);
        hb.addEventListener('input', update);
        update();
    }

    function select(id, fromList) {
        const h = HS[id];
        if (!h) return;
        if (state.mode === 'quiz') { quizAnswer(id); return; }
        if (state.mode === 'tour') {
            const i = TOUR.findIndex((s) => s.id === id);
            if (i < 0) state.mode = null; else state.tour = i;
        }
        state.sel = id;
        state.visited[id] = 1;
        saveVisited();
        showPanel(h);
        renderChips();
        renderModes();
        if (world) world.focus(h);
        if (fromList) $('panelTitle').focus({ preventScroll: true });
    }

    function closeSelection() {
        const had = state.sel;
        if (state.mode === 'tour') state.mode = null;
        state.sel = null;
        hidePanel();
        renderChips();
        renderModes();
        if (world && had) world.unfocus();
    }

    /* ---------- Parcours du sang ---------- */
    function startTour() {
        if (state.mode === 'tour') { closeSelection(); return; }
        endQuiz();
        state.mode = 'tour';
        state.tour = 0;
        select(TOUR[0].id);
    }
    function tourStep(d) {
        const i = state.tour + d;
        if (i >= TOUR.length) { closeSelection(); return; }
        if (i < 0) return;
        state.tour = i;
        select(TOUR[i].id);
    }

    /* ---------- Quiz ---------- */
    function startQuiz() {
        if (state.mode === 'quiz') { endQuiz(); renderModes(); return; }
        if (state.sel) closeSelection();
        state.mode = 'quiz';
        state.quiz = { i: 0, score: 0, tries: 0, solved: false };
        renderQuiz();
        renderModes();
    }
    function endQuiz() {
        if (state.mode !== 'quiz') return;
        state.mode = null;
        quizEl.hidden = true;
        if (world) world.unfocus();
    }
    function renderQuiz(feedback, good) {
        const z = state.quiz;
        quizEl.hidden = false;
        if (z.i >= QUIZ.length) {
            quizEl.innerHTML = `<p class="quiz__q">Terminé : ${z.score} bonne${z.score > 1 ? 's' : ''} réponse${z.score > 1 ? 's' : ''} du premier coup sur ${QUIZ.length}.</p>
                <div class="quiz__row"><button type="button" class="btn" id="quizAgain">Rejouer</button><button type="button" class="btn btn--ghost" id="quizStop">Fermer</button></div>`;
            $('quizAgain').addEventListener('click', () => { state.quiz = { i: 0, score: 0, tries: 0, solved: false }; if (world) world.unfocus(); renderQuiz(); });
            $('quizStop').addEventListener('click', () => { endQuiz(); renderModes(); });
            return;
        }
        quizEl.innerHTML = `<p class="quiz__n">Question ${z.i + 1} sur ${QUIZ.length}</p><p class="quiz__q">${QUIZ[z.i].q}</p>`
            + (feedback ? `<p class="quiz__fb ${good ? 'is-good' : 'is-bad'}" role="status">${feedback}</p>` : '')
            + `<div class="quiz__row">${z.solved ? '<button type="button" class="btn" id="quizNext">Question suivante</button>' : ''}<button type="button" class="btn btn--ghost" id="quizStop">Arrêter</button></div>`;
        if (z.solved) $('quizNext').addEventListener('click', () => { z.i++; z.tries = 0; z.solved = false; if (world) world.unfocus(); renderQuiz(); });
        $('quizStop').addEventListener('click', () => { endQuiz(); renderModes(); });
    }
    function quizAnswer(id) {
        const z = state.quiz, q = QUIZ[z.i];
        if (!q || z.solved) return;
        if (id === q.a) {
            z.solved = true;
            if (z.tries === 0) z.score++;
            state.visited[id] = 1;
            saveVisited();
            renderChips();
            if (world) world.focus(HS[id]);
            renderQuiz(q.ok, true);
        } else {
            z.tries++;
            renderQuiz((q.near && q.near[id]) || `Non, ceci est : ${HS[id].label.toLowerCase()}. Essayez encore.`, false);
        }
    }

    /* =====================================================================
       La salle en 3D
       ===================================================================== */
    let world = null;
    try { world = window.THREE ? buildWorld() : null; } catch (e) { world = null; if (window.console) console.error(e); }
    if (!world) stage.classList.add('nogl');

    function buildWorld() {
        const T = window.THREE;
        const renderer = new T.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputEncoding = T.sRGBEncoding;
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFSoftShadowMap;

        const scene = new T.Scene();
        scene.fog = new T.Fog(0xffffff, 18, 46);
        const camera = new T.PerspectiveCamera(38, 1.6, 0.08, 80);

        const C = (hex) => new T.Color(hex).convertSRGBToLinear();
        const V = (a) => new T.Vector3(a[0], a[1], a[2]);
        const std = (hex, o) => new T.MeshStandardMaterial(Object.assign({ color: C(hex), roughness: 0.7, metalness: 0 }, o || {}));
        const glass = (hex, op, o) => std(hex, Object.assign({ transparent: true, opacity: op, depthWrite: false, roughness: 0.08 }, o || {}));
        const glow = (hex) => new T.MeshBasicMaterial({ color: C(hex), toneMapped: false });

        // Reflets : une pièce claire très simple, floutée, sert d'environnement aux métaux
        (function environment() {
            const es = new T.Scene();
            es.add(new T.Mesh(new T.BoxGeometry(12, 7, 12), new T.MeshBasicMaterial({ color: C('#a9b0bb'), side: T.BackSide })));
            const pan = (w, hh, x, y, z, rx, ry, hex) => {
                const m = new T.Mesh(new T.PlaneGeometry(w, hh), new T.MeshBasicMaterial({ color: C(hex), side: T.DoubleSide }));
                m.position.set(x, y, z); m.rotation.set(rx, ry, 0); es.add(m);
            };
            pan(5, 5, 0, 3.4, 0, Math.PI / 2, 0, '#ffffff');
            pan(4, 3, -5.9, 0.8, 0, 0, Math.PI / 2, '#f3f6ff');
            pan(4, 3, 5.9, 0.6, 1, 0, Math.PI / 2, '#dfe7f5');
            pan(6, 2, 0, 1, 5.9, 0, 0, '#ffffff');
            pan(6, 1.6, 0, 0.6, -5.9, 0, 0, '#c9d2e0');
            pan(12, 12, 0, -3.4, 0, Math.PI / 2, 0, '#3f444d');
            const pm = new T.PMREMGenerator(renderer);
            scene.environment = pm.fromScene(es, 0.035).texture;
            pm.dispose();
        })();

        // Matières. Celles du décor (sol, murs) changent avec le thème.
        const M = {
            floor: std('#b9c8ca', { roughness: 0.62, envMapIntensity: 0.45 }), wall: std('#e9eff0', { roughness: 0.95 }), trim: std('#b9c1d6'),
            alu: std('#dcdee1', { metalness: 0.62, roughness: 0.38, envMapIntensity: 1.25 }), aluDark: std('#a3a8af', { metalness: 0.6, roughness: 0.42 }),
            chrome: std('#e6e9ee', { metalness: 1, roughness: 0.15 }), black: std('#15171c', { metalness: 0.2, roughness: 0.4 }),
            rubber: std('#8c9199', { roughness: 0.85 }), white: std('#eef0f3', { roughness: 0.5 }), dark: std('#2b3350', { roughness: 0.6 }),
            clear: glass('#ffffff', 0.2), clearBlue: glass('#cfe3f5', 0.32), yellow: std('#f2c81e', { roughness: 0.45 }),
            drape: std('#2f6c9e', { roughness: 0.92 }), drape2: std('#4f8cbd', { roughness: 0.92 }), blood: std('#8c2430', { roughness: 0.4 }),
            heart: std('#c43d3d', { roughness: 0.45 }), fibres: std('#f1dede', { roughness: 0.8 }), amber: std('#e8a33d', { roughness: 0.4 }),
            steel: std('#aab3c5', { metalness: 0.6, roughness: 0.4 }), green: std('#3aa76d', { roughness: 0.5 }), hose: std('#7fa9bd', { roughness: 0.6 }),
            cable: std('#1b1d22', { roughness: 0.6 }), accent: std('#5a67e0', { roughness: 0.5 })
        };
        // Les boutons de couleur : un bouton par pompe
        const KNOB = { red: '#e5392f', blue: '#2f6fe5', green: '#35b04a', yellow: '#f2c81e' };

        const flows = [], rotors = [], proxies = [];

        /* ---------- formes ---------- */
        function put(p, mesh, x, y, z, noShadow) {
            mesh.position.set(x || 0, y || 0, z || 0);
            mesh.castShadow = !noShadow;
            mesh.receiveShadow = true;
            p.add(mesh);
            return mesh;
        }
        const box = (p, w, h, d, m, x, y, z) => put(p, new T.Mesh(new T.BoxGeometry(w, h, d), m), x, y, z);
        const cyl = (p, rt, rb, h, m, x, y, z, seg) => put(p, new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 24), m), x, y, z);
        const sph = (p, r, m, x, y, z, ws, hs) => put(p, new T.Mesh(new T.SphereGeometry(r, ws || 20, hs || 14), m), x, y, z);
        const grp = (p, x, y, z) => { const g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); p.add(g); return g; };

        function rrect(w, h, r) {
            const s = new T.Shape(), x = -w / 2, y = -h / 2;
            r = Math.max(0.0005, Math.min(r, w / 2 - 0.0001, h / 2 - 0.0001));
            s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
            s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
            s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
            return s;
        }
        // Boîte debout aux arêtes arrondies (largeur × hauteur × profondeur), centrée
        function rbox(p, w, h, d, r, m, x, y, z) {
            const b = Math.min(0.006, h / 4, r);
            const g = new T.ExtrudeGeometry(rrect(w - 2 * b, d - 2 * b, r - b), { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 5 });
            g.rotateX(-Math.PI / 2);
            g.translate(0, -(h - 2 * b) / 2, 0);
            return put(p, new T.Mesh(g, m), x, y, z);
        }
        // Plaque aux coins arrondis, face vers +z (largeur × hauteur, épaisseur t)
        function slab(p, w, h, t, r, m, x, y, z) {
            const b = Math.min(0.004, t / 4);
            const g = new T.ExtrudeGeometry(rrect(w - 2 * b, h - 2 * b, r - b), { depth: t - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 5 });
            g.translate(0, 0, -(t - 2 * b) / 2);
            return put(p, new T.Mesh(g, m), x, y, z);
        }
        // Tube rigide passant par des points, coudes arrondis
        function pipe(p, pts, radius, m, corner) {
            const v = pts.map(V), path = new T.CurvePath();
            let prev = v[0];
            for (let i = 1; i < v.length - 1; i++) {
                const c = Math.min(corner == null ? 0.06 : corner, v[i].distanceTo(v[i - 1]) / 2, v[i].distanceTo(v[i + 1]) / 2);
                const a = v[i].clone().add(v[i - 1].clone().sub(v[i]).setLength(c)), b = v[i].clone().add(v[i + 1].clone().sub(v[i]).setLength(c));
                path.add(new T.LineCurve3(prev, a));
                path.add(new T.QuadraticBezierCurve3(a, v[i], b));
                prev = b;
            }
            path.add(new T.LineCurve3(prev, v[v.length - 1]));
            const mesh = new T.Mesh(new T.TubeGeometry(path, Math.max(8, Math.round(path.getLength() / 0.02)), radius, 14, false), m);
            mesh.castShadow = true; mesh.receiveShadow = true;
            p.add(mesh);
            [v[0], v[v.length - 1]].forEach((e) => sph(p, radius, m, e.x, e.y, e.z, 12, 8));
            return mesh;
        }
        // Tuyau souple
        function tube(p, pts, radius, m) {
            const curve = new T.CatmullRomCurve3(pts.map(V), false, 'catmullrom', 0.5);
            const mesh = new T.Mesh(new T.TubeGeometry(curve, Math.max(20, pts.length * 14), radius, 10, false), m);
            mesh.castShadow = true;
            p.add(mesh);
            return curve.getLength();
        }
        // Tuyau où l'on voit le sens du liquide : des tirets clairs qui avancent
        function flowTube(p, pts, radius, colors, speed) {
            const cv = document.createElement('canvas');
            cv.width = 64; cv.height = 4;
            const g = cv.getContext('2d');
            g.fillStyle = colors[0]; g.fillRect(0, 0, 64, 4);
            g.fillStyle = colors[1]; g.fillRect(8, 0, 20, 4);
            const tex = new T.CanvasTexture(cv);
            tex.encoding = T.sRGBEncoding;
            tex.wrapS = T.RepeatWrapping;
            const len = tube(p, pts, radius, new T.MeshStandardMaterial({ map: tex, roughness: 0.35 }));
            tex.repeat.set(Math.max(2, Math.round(len / 0.16)), 1);
            flows.push({ tex, speed: speed / 0.16 });
        }
        function screen(p, w, h, draw, x, y, z, res) {
            const cv = document.createElement('canvas');
            cv.width = res || 256; cv.height = Math.round((res || 256) * h / w);
            draw(cv.getContext('2d'), cv.width, cv.height);
            const tex = new T.CanvasTexture(cv);
            tex.encoding = T.sRGBEncoding;
            tex.anisotropy = 4;
            return put(p, new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false })), x, y, z, true);
        }
        // Courbe de pression artérielle : montée systolique, incisure dicrote, décroissance
        function beat(t) {
            const main = Math.pow(t / 0.13, 1.25) * Math.exp(1.25 * (1 - t / 0.13));
            return Math.min(1, main + 0.2 * Math.exp(-Math.pow((t - 0.46) / 0.05, 2)));
        }
        function wave(g, w, h, color, y0, amp, period) {
            g.strokeStyle = color; g.lineWidth = Math.max(2, h / 60); g.lineJoin = 'round'; g.beginPath();
            for (let x = 0; x <= w; x += 2) { const y = y0 - beat((x % period) / period) * amp; if (x) g.lineTo(x, y); else g.moveTo(x, y); }
            g.stroke();
        }
        const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
        const BG = '#0d1116';

        function proxy(id, x, y, z, w, h, d) {
            const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial({ visible: false }));
            m.position.set(x, y, z);
            m.userData.id = id;
            scene.add(m);
            proxies.push(m);
        }

        /* =================== La salle et son équipement (decor.js) =================== */
        const decor = window.SALLE_DECOR ? window.SALLE_DECOR({ T, scene, M, C, V, std, glass, glow, put, box, cyl, sph, grp, rbox, slab, pipe, tube, screen, SANS, BG }) : null;

        /* =================== Table d'opération et patient sous les champs =================== */
        (function table() {
            const t = grp(scene, -1.9, 0, -1.3);
            rbox(t, 0.85, 0.06, 0.62, 0.05, M.steel, 0, 0.03, 0);
            rbox(t, 0.42, 0.74, 0.36, 0.04, M.dark, 0, 0.4, 0);
            rbox(t, 2.05, 0.07, 0.62, 0.05, M.steel, 0, 0.805, 0);
            rbox(t, 2.0, 0.08, 0.58, 0.05, M.black, 0, 0.88, 0);
            const body = sph(t, 1, M.drape, 0.14, 1.03, 0, 28, 16); body.scale.set(0.9, 0.17, 0.33);
            rbox(t, 1.95, 0.02, 0.86, 0.04, M.drape, 0.14, 0.93, 0);
            box(t, 1.95, 0.46, 0.012, M.drape, 0.14, 0.7, 0.43);
            box(t, 1.95, 0.46, 0.012, M.drape, 0.14, 0.7, -0.43);
            const head = sph(t, 0.115, M.drape2, -0.9, 1.04, 0, 20, 14); head.scale.set(1.1, 0.9, 0.95);
            // champ vertical entre la tête et le site opératoire
            box(t, 0.012, 0.56, 0.84, M.drape2, -0.66, 1.3, 0);
            cyl(t, 0.012, 0.012, 0.7, M.chrome, -0.66, 1.25, 0.42, 10);
            cyl(t, 0.012, 0.012, 0.7, M.chrome, -0.66, 1.25, -0.42, 10);
            // site opératoire : sternum ouvert, écarteur, cœur, canules
            rbox(t, 0.36, 0.02, 0.24, 0.03, M.blood, -0.12, 1.205, 0);
            box(t, 0.38, 0.03, 0.03, M.chrome, -0.12, 1.225, 0.13);
            box(t, 0.38, 0.03, 0.03, M.chrome, -0.12, 1.225, -0.13);
            const ht = sph(t, 0.075, M.heart, -0.12, 1.225, 0, 18, 12); ht.scale.set(1.15, 0.6, 0.95);
            cyl(t, 0.014, 0.014, 0.1, M.chrome, -0.02, 1.27, 0.05, 10).rotation.z = 0.5;
            cyl(t, 0.012, 0.012, 0.1, M.chrome, -0.24, 1.27, 0, 10).rotation.z = -0.4;
        })();

        /* =================== Machine cœur-poumon =================== */
        const HX = 0.9, HZ = 0.35;
        const H = (x, y, z) => [HX + x, y, HZ + z];
        (function heartLung() {
            const hg = grp(scene, HX, 0, HZ);

            /* ---- base roulante ---- */
            function caster(x, z) {
                const g = grp(hg, x, 0, z);
                [-0.021, 0.021].forEach((o) => {
                    cyl(g, 0.062, 0.062, 0.026, M.rubber, 0, 0.062, o, 28).rotation.x = Math.PI / 2;
                    cyl(g, 0.032, 0.032, 0.03, M.alu, 0, 0.062, o, 18).rotation.x = Math.PI / 2;
                });
                box(g, 0.05, 0.075, 0.012, M.aluDark, 0, 0.1, 0);
                cyl(g, 0.03, 0.03, 0.03, M.aluDark, 0, 0.142, 0, 18);
            }
            [-0.5, 0.5].forEach((x) => {
                [-0.27, 0.27].forEach((z) => caster(x, z));
                rbox(hg, 0.1, 0.08, 0.68, 0.04, M.alu, x, 0.195, 0);
            });
            rbox(hg, 0.92, 0.24, 0.48, 0.05, M.alu, 0, 0.2, 0);                         // caisson central
            slab(hg, 0.13, 0.032, 0.008, 0.016, M.black, -0.06, 0.215, 0.241);         // poignée en creux
            rbox(hg, 1.04, 0.03, 0.54, 0.04, M.alu, 0, 0.335, 0);                       // plateau de la base
            // trappe arrière ouverte : quatre unités de commande, aux couleurs des boutons du cockpit
            const flap = box(hg, 0.56, 0.008, 0.17, M.alu, -0.08, 0.1, -0.31); flap.rotation.x = 0.5;
            ['red', 'blue', 'yellow', 'green'].forEach((k, i) => {
                const x = 0.12 - i * 0.135;
                const u = grp(hg, x, 0.2, -0.243); u.rotation.y = Math.PI;
                slab(u, 0.085, 0.14, 0.012, 0.01, M.black, 0, 0, 0);
                screen(u, 0.066, 0.045, (g, w, h) => { g.fillStyle = BG; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `600 ${Math.round(h * 0.6)}px ${SANS}`; g.fillText('0.94', w * 0.12, h * 0.72); }, 0, 0.035, 0.0065, 96);
                knob(u, KNOB[k], 0, -0.035, 0.006, 0.016);
            });

            /* ---- colonne : électronique et alimentation ---- */
            rbox(hg, 0.24, 1.1, 0.44, 0.02, M.alu, 0.4, 0.9, -0.02);
            box(hg, 0.243, 0.005, 0.443, M.aluDark, 0.4, 1.0, -0.02);
            rbox(hg, 0.27, 0.02, 0.47, 0.02, M.aluDark, 0.4, 1.46, -0.02);
            cyl(hg, 0.014, 0.014, 0.006, M.aluDark, 0.34, 1.37, 0.201, 20).rotation.x = Math.PI / 2;
            cyl(hg, 0.009, 0.009, 0.008, glow('#7fd8a0'), 0.34, 1.37, 0.202, 16).rotation.x = Math.PI / 2;

            /* ---- cadre tubulaire, mâts et potences ---- */
            pipe(hg, [[0.25, 0.35, 0.215], [0.25, 1.62, 0.215], [0.25, 1.62, -0.22], [0.25, 0.35, -0.22]], 0.021, M.chrome, 0.08);
            pipe(hg, [[-0.16, 0.35, -0.22], [-0.16, 1.5, -0.22], [0.25, 1.5, -0.22]], 0.021, M.chrome, 0.08);
            pipe(hg, [[0.06, 0.35, -0.22], [0.06, 1.5, -0.22]], 0.019, M.chrome);
            [[0.25, 1.5], [0.06, 1.5]].forEach((q) => cyl(hg, 0.03, 0.03, 0.06, M.aluDark, q[0], q[1], -0.22, 18));
            function hooks(x, y, z) {
                sph(hg, 0.02, M.chrome, x, y, z, 14, 10);
                for (let i = 0; i < 4; i++) {
                    const g = grp(hg, x, y, z); g.rotation.y = i * Math.PI / 2 - Math.PI / 4;
                    tube(g, [[0.01, 0, 0], [0.05, 0.022, 0], [0.085, 0.005, 0], [0.09, -0.03, 0], [0.07, -0.05, 0]], 0.0045, M.chrome);
                }
            }
            cyl(hg, 0.017, 0.017, 0.18, M.chrome, 0.14, 1.59, -0.22, 16);                // potence haute
            cyl(hg, 0.024, 0.024, 0.05, M.aluDark, 0.14, 1.5, -0.22, 16);
            cyl(hg, 0.01, 0.01, 0.3, M.chrome, 0.14, 1.82, -0.22, 12);
            hooks(0.14, 1.97, -0.22);
            pipe(hg, [[-0.16, 1.26, -0.22], [-0.4, 1.26, -0.22]], 0.014, M.chrome);      // potence de gauche
            cyl(hg, 0.024, 0.024, 0.05, M.aluDark, -0.16, 1.26, -0.22, 16);
            cyl(hg, 0.017, 0.017, 0.24, M.chrome, -0.4, 1.31, -0.22, 16);
            cyl(hg, 0.01, 0.01, 0.32, M.chrome, -0.4, 1.58, -0.22, 12);
            hooks(-0.4, 1.74, -0.22);

            /* ---- moniteur patient (grand écran) et capteur en ligne ---- */
            const mon = grp(hg, 0.02, 1.33, -0.13); mon.rotation.x = -0.05;
            slab(mon, 0.58, 0.36, 0.034, 0.014, M.black, 0, 0, 0);
            box(mon, 0.09, 0.09, 0.07, M.aluDark, 0.04, 0, -0.05);
            screen(mon, 0.545, 0.315, (g, w, h) => {
                g.fillStyle = BG; g.fillRect(0, 0, w, h);
                g.fillStyle = '#161c24'; g.fillRect(0, 0, w, h * 0.13);
                [['DÉBIT', '4,60'], ['PAM', '65'], ['SvO₂', '76'], ['T art.', '34,0']].forEach((q, i) => {
                    const x = w * (0.24 + i * 0.19);
                    g.fillStyle = '#8b96a8'; g.font = `500 ${Math.round(h * 0.03)}px ${SANS}`; g.fillText(q[0], x, h * 0.05);
                    g.fillStyle = '#fff'; g.font = `600 ${Math.round(h * 0.055)}px ${SANS}`; g.fillText(q[1], x, h * 0.11);
                });
                g.fillStyle = '#2a3340';
                for (let i = 0; i < 9; i++) g.fillRect(w * 0.02, h * (0.19 + i * 0.07), w * (0.12 - (i % 3) * 0.02), h * 0.022);
                ['#5fd0e0', '#5b8cff', '#f2c81e', '#35b04a', '#d86be0', '#ff8a4a'].forEach((col, i) => {
                    const y = h * (0.24 + i * 0.105);
                    g.strokeStyle = '#1e252f'; g.lineWidth = 1; g.beginPath(); g.moveTo(w * 0.2, y + h * 0.03); g.lineTo(w * 0.97, y + h * 0.03); g.stroke();
                    g.strokeStyle = col; g.lineWidth = Math.max(2, h / 180); g.beginPath();
                    for (let x = 0.2; x <= 0.96; x += 0.01) { const yy = y + Math.sin(x * 23 + i * 2) * h * 0.008 + (x > 0.3 && x < 0.34 ? -h * 0.03 : 0); if (x === 0.2) g.moveTo(w * x, yy); else g.lineTo(w * x, yy); }
                    g.stroke();
                    g.fillStyle = col; g.fillRect(w * 0.56, y - h * 0.018, w * 0.035, h * 0.03);
                });
                g.fillStyle = '#161c24'; g.fillRect(0, h * 0.89, w, h * 0.11);
                g.fillStyle = '#394455';
                for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(w * (0.05 + i * 0.045), h * 0.945, h * 0.03, 0, 7); g.fill(); }
            }, 0, 0, 0.0175, 768);
            rbox(hg, 0.11, 0.075, 0.07, 0.012, M.white, 0.06, 1.06, -0.165);                // capteur en ligne
            box(hg, 0.03, 0.03, 0.01, M.black, 0.035, 1.05, -0.128);
            box(hg, 0.03, 0.03, 0.01, M.black, 0.085, 1.05, -0.128);
            tube(hg, [[0.035, 1.03, -0.13], [0.03, 0.9, -0.19], [0.0, 0.62, -0.24], [-0.1, 0.4, -0.2]], 0.005, M.cable);
            tube(hg, [[0.085, 1.03, -0.13], [0.1, 0.9, -0.2], [0.12, 0.62, -0.25], [0.15, 0.4, -0.2]], 0.005, M.cable);

            /* ---- plateau des pompes ---- */
            rbox(hg, 0.7, 0.022, 0.34, 0.03, M.alu, -0.07, 0.599, -0.02);
            [-0.16, 0.06].forEach((x) => box(hg, 0.06, 0.04, 0.06, M.aluDark, x, 0.599, -0.21));

            function knob(p, hex, x, y, z, r) {
                r = r || 0.022;
                const ring = cyl(p, r, r, 0.016, std(hex, { roughness: 0.35, emissive: C(hex), emissiveIntensity: 0.25 }), x, y, z + 0.008, 24); ring.rotation.x = Math.PI / 2;
                const cap = cyl(p, r * 0.62, r * 0.62, 0.02, M.aluDark, x, y, z + 0.011, 20); cap.rotation.x = Math.PI / 2;
            }
            function pumpScreen(p, value, hex, x, y, z) {
                screen(p, 0.09, 0.058, (g, w, h) => {
                    g.fillStyle = BG; g.fillRect(0, 0, w, h);
                    g.fillStyle = hex; g.fillRect(w * 0.08, h * 0.12, w * 0.18, h * 0.08);
                    g.fillStyle = '#fff'; g.font = `600 ${Math.round(h * 0.46)}px ${SANS}`; g.fillText(value, w * 0.1, h * 0.68);
                    g.fillStyle = '#8b96a8'; g.font = `500 ${Math.round(h * 0.16)}px ${SANS}`; g.fillText('L/min', w * 0.12, h * 0.9);
                }, x, y, z, 192);
            }
            // Une pompe à galets : carter, galets sous un capot transparent, unité de commande (écran et bouton)
            function pumpUnit(x, y, z, o) {
                const g = grp(hg, x, y, z);
                cyl(g, 0.101, 0.101, 0.02, M.aluDark, 0, 0.01, 0, 36);
                cyl(g, 0.098, 0.098, 0.23, M.alu, 0, 0.135, 0, 36);
                cyl(g, 0.1, 0.1, 0.014, M.black, 0, 0.257, 0, 36);
                cyl(g, 0.086, 0.086, 0.006, M.aluDark, 0, 0.263, 0, 36);
                const rot = grp(g, 0, 0.278, 0);
                box(rot, 0.13, 0.018, 0.034, M.chrome, 0, 0, 0);
                cyl(rot, 0.024, 0.024, 0.028, M.white, 0.056, 0, 0, 18);
                cyl(rot, 0.024, 0.024, 0.028, M.white, -0.056, 0, 0, 18);
                cyl(rot, 0.016, 0.016, 0.034, std(o.hex, { roughness: 0.4 }), 0, 0, 0, 16);
                rotors.push({ obj: rot, speed: o.speed });
                const loop = put(g, new T.Mesh(new T.TorusGeometry(0.072, 0.0105, 10, 28, Math.PI * 1.25), o.loop), 0, 0.276, 0);
                loop.rotation.set(-Math.PI / 2, 0, Math.PI * 0.875);
                cyl(g, 0.1, 0.1, 0.034, M.clear, 0, 0.283, 0, 36).castShadow = false;
                [-0.045, 0.045].forEach((dx) => box(g, 0.03, 0.022, 0.03, M.black, dx, 0.283, -0.096));
                box(g, 0.05, 0.03, 0.05, M.aluDark, 0, 0.115, 0.1);
                const cu = grp(g, 0, 0.118, 0.128); cu.rotation.x = -0.3;
                slab(cu, 0.118, 0.175, 0.03, 0.014, M.black, 0, 0, 0);
                pumpScreen(cu, o.value, o.hex, 0, 0.04, 0.0155);
                knob(cu, o.hex, 0, -0.045, 0.015);
                tube(hg, [[x - 0.02, y + 0.04, z + 0.15], [x - 0.03, y - 0.06, z + 0.17], [x - 0.02, y - 0.2, z + 0.12], [x, 0.36, z + 0.06]], 0.006, M.cable);
            }
            const loopBlood = std('#8c2430', { roughness: 0.35 }), loopBlue = std('#3b6fe0', { roughness: 0.35 }), loopAmber = std('#e0a13a', { roughness: 0.35 });
            pumpUnit(-0.3, 0.61, -0.03, { hex: KNOB.yellow, value: '0.25', loop: loopAmber, speed: 0.6 });   // cardioplégie
            pumpUnit(-0.07, 0.61, -0.03, { hex: KNOB.blue, value: '0.40', loop: loopBlood, speed: 1.1 });    // aspiration
            pumpUnit(0.16, 0.61, -0.03, { hex: KNOB.green, value: '0.30', loop: loopBlood, speed: 0.8 });    // décharge

            /* ---- côté gauche : mât bas, pompe artérielle près de l'oxygénateur, cockpit ---- */
            pipe(hg, [[-0.52, 0.23, -0.05], [-0.52, 0.92, -0.05]], 0.019, M.chrome);
            rbox(hg, 0.07, 0.09, 0.1, 0.012, M.aluDark, -0.52, 0.52, -0.01);
            pumpUnit(-0.5, 0.4, 0.13, { hex: KNOB.red, value: '4.60', loop: loopBlue, speed: 2.2 });        // pompe artérielle
            // cockpit : l'écran de commande et ses quatre boutons, un par pompe
            pipe(hg, [[-0.52, 0.88, -0.05], [-0.52, 0.88, 0.12], [-0.66, 0.88, 0.22], [-0.66, 0.96, 0.22]], 0.015, M.chrome, 0.04);
            sph(hg, 0.024, M.aluDark, -0.52, 0.88, -0.05, 14, 10);
            const cp = grp(hg, -0.68, 1.0, 0.27); cp.rotation.order = 'YXZ'; cp.rotation.set(-0.4, 0.3, 0);
            slab(cp, 0.37, 0.31, 0.03, 0.02, M.black, 0, 0, 0);
            screen(cp, 0.335, 0.2, (g, w, h) => {
                g.fillStyle = BG; g.fillRect(0, 0, w, h);
                g.fillStyle = '#fff'; g.font = `600 ${Math.round(h * 0.3)}px ${SANS}`; g.fillText('4,60', w * 0.05, h * 0.36);
                g.fillStyle = '#8b96a8'; g.font = `500 ${Math.round(h * 0.07)}px ${SANS}`; g.fillText('L/min', w * 0.36, h * 0.36);
                [['100 %', 0.05], ['65', 0.24], ['−16', 0.34]].forEach((q) => { g.fillStyle = '#fff'; g.font = `600 ${Math.round(h * 0.1)}px ${SANS}`; g.fillText(q[0], w * q[1], h * 0.6); });
                g.fillStyle = '#2a3340';
                for (let i = 0; i < 6; i++) g.fillRect(w * (0.05 + i * 0.07), h * 0.72, w * 0.05, h * 0.07);
                g.fillStyle = '#161c24'; g.fillRect(w * 0.5, h * 0.06, w * 0.46, h * 0.86);
                g.fillStyle = '#394455';
                for (let i = 0; i < 6; i++) g.fillRect(w * 0.53, h * (0.13 + i * 0.13), w * (0.38 - (i % 2) * 0.1), h * 0.05);
                g.fillStyle = '#5b8cff'; g.fillRect(w * 0.53, h * 0.13, w * 0.12, h * 0.05);
            }, 0, 0.04, 0.0155, 512);
            ['red', 'blue', 'green', 'yellow'].forEach((k, i) => knob(cp, KNOB[k], -0.12 + i * 0.08, -0.105, 0.015, 0.023));

            /* ---- oxygénateur, réservoir veineux, filtre artériel : plus bas que le patient (siphon) ---- */
            pipe(hg, [[-0.52, 0.4, -0.05], [-0.7, 0.4, -0.09], [-0.84, 0.4, -0.1]], 0.014, M.chrome, 0.05);
            const ring = put(hg, new T.Mesh(new T.TorusGeometry(0.1, 0.008, 8, 32), M.aluDark), -0.84, 0.415, 0.02); ring.rotation.x = Math.PI / 2;
            box(hg, 0.03, 0.03, 0.04, M.aluDark, -0.84, 0.405, -0.085);
            const ox = grp(hg, -0.84, -0.13, 0.02);
            // réservoir : coque transparente, sang, couvercle jaune et ses entrées
            cyl(ox, 0.1, 0.086, 0.28, M.clear, 0, 0.7, 0, 32).castShadow = false;
            cyl(ox, 0.091, 0.081, 0.13, M.blood, 0, 0.632, 0, 32);
            cyl(ox, 0.036, 0.036, 0.24, glass('#ffffff', 0.5, { roughness: 0.6 }), 0, 0.71, 0, 18).castShadow = false;
            cyl(ox, 0.104, 0.104, 0.03, M.yellow, 0, 0.855, 0, 32);
            cyl(ox, 0.07, 0.09, 0.014, M.yellow, 0, 0.877, 0, 32);
            for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; cyl(ox, 0.011, 0.011, 0.036, M.yellow, Math.cos(a) * 0.062, 0.9, Math.sin(a) * 0.062, 12); }
            cyl(ox, 0.019, 0.019, 0.05, M.yellow, 0, 0.905, -0.02, 14);
            box(ox, 0.03, 0.06, 0.03, M.black, 0.1, 0.6, 0);                                 // capteur de niveau
            box(ox, 0.008, 0.008, 0.004, glow('#57d39b'), 0.1, 0.618, 0.016);
            // oxygénateur à fibres creuses et échangeur thermique
            cyl(ox, 0.07, 0.07, 0.2, M.fibres, 0, 0.39, 0, 28);
            cyl(ox, 0.086, 0.086, 0.21, M.clear, 0, 0.39, 0, 32).castShadow = false;
            cyl(ox, 0.089, 0.089, 0.026, M.white, 0, 0.503, 0, 32);
            cyl(ox, 0.089, 0.089, 0.026, M.white, 0, 0.279, 0, 32);
            cyl(ox, 0.062, 0.062, 0.07, M.alu, 0, 0.232, 0, 28);
            cyl(ox, 0.016, 0.016, 0.05, M.white, -0.095, 0.46, 0.02, 12).rotation.z = Math.PI / 2;      // sortie artérielle
            cyl(ox, 0.01, 0.01, 0.04, M.white, 0, 0.5, -0.09, 10).rotation.x = Math.PI / 2;             // entrée de gaz
            // filtre artériel et sa purge
            const fx = -1.02, fz = 0.04;
            pipe(hg, [[-0.84, 0.4, -0.1], [-0.98, 0.43, -0.06], [fx, 0.47, -0.01]], 0.008, M.chrome, 0.03);
            cyl(hg, 0.03, 0.03, 0.09, M.white, fx, 0.55, fz, 20);
            cyl(hg, 0.042, 0.042, 0.11, M.clear, fx, 0.55, fz, 24).castShadow = false;
            cyl(hg, 0.012, 0.042, 0.03, M.clear, fx, 0.62, fz, 24).castShadow = false;
            cyl(hg, 0.044, 0.044, 0.012, M.white, fx, 0.492, fz, 24);
            tube(hg, [[fx, 0.64, fz], [-0.99, 0.77, 0.03], [-0.92, 0.82, 0.03], [-0.89, 0.77, 0.04]], 0.004, M.white);

            /* ---- mélangeur de gaz et évaporateur ---- */
            rbox(hg, 0.16, 0.2, 0.07, 0.012, M.white, -0.25, 1.07, -0.215);
            cyl(hg, 0.01, 0.01, 0.15, glass('#3aa76d', 0.8), -0.3, 1.08, -0.176, 10);
            [1.03, 1.11].forEach((y) => { cyl(hg, 0.02, 0.02, 0.018, M.black, -0.215, y, -0.172, 18).rotation.x = Math.PI / 2; });
            cyl(hg, 0.05, 0.05, 0.13, M.dark, -0.385, 1.06, -0.215, 24);
            cyl(hg, 0.053, 0.053, 0.02, M.yellow, -0.385, 1.135, -0.215, 24);
            cyl(hg, 0.034, 0.034, 0.02, M.black, -0.385, 1.155, -0.215, 20);

            /* ---- cardioplégie : poche, pousse-seringue, piège à bulles ---- */
            rbox(hg, 0.13, 0.2, 0.03, 0.012, glass('#f0c56a', 0.78, { roughness: 0.3 }), -0.338, 1.585, -0.158);
            rbox(hg, 0.24, 0.07, 0.1, 0.012, M.white, -0.52, 1.38, -0.2);
            box(hg, 0.07, 0.035, 0.004, M.black, -0.58, 1.385, -0.148);
            const syr = cyl(hg, 0.014, 0.014, 0.12, M.clear, -0.53, 1.432, -0.19, 14); syr.rotation.z = Math.PI / 2; syr.castShadow = false;
            cyl(hg, 0.011, 0.011, 0.07, M.amber, -0.505, 1.432, -0.19, 12).rotation.z = Math.PI / 2;
            cyl(hg, 0.004, 0.004, 0.07, M.chrome, -0.62, 1.432, -0.19, 8).rotation.z = Math.PI / 2;
            box(hg, 0.012, 0.04, 0.04, M.aluDark, -0.655, 1.43, -0.19);
            cyl(hg, 0.03, 0.03, 0.12, M.clear, -0.16, 0.86, -0.275, 18).castShadow = false;
            cyl(hg, 0.024, 0.024, 0.05, M.amber, -0.16, 0.835, -0.275, 16);
            box(hg, 0.03, 0.03, 0.03, M.aluDark, -0.16, 0.86, -0.245);

            /* ---- arrière : capot incliné, passages de tuyaux ---- */
            const hood = box(hg, 0.68, 0.012, 0.25, M.alu, -0.08, 0.515, -0.265); hood.rotation.x = -0.72;
            rbox(hg, 0.68, 0.1, 0.015, 0.006, M.alu, -0.08, 0.4, -0.262);
            [-0.28, -0.08, 0.12].forEach((x) => { cyl(hg, 0.03, 0.03, 0.03, M.black, x, 0.4, -0.275, 22).rotation.x = Math.PI / 2; });
        })();

        /* =================== Le circuit : veineux en bleu, artériel en rouge, cardioplégie en ambre =================== */
        (function circuit() {
            const BLUE = ['#3b6fe0', '#8fb0ff'], RED = ['#d6453d', '#ff9c94'], AMB = ['#d9952f', '#ffd98a'], DRK = ['#8c2430', '#c96a74'];
            // ligne veineuse : de l'oreillette droite au réservoir
            flowTube(scene, [[-1.92, 1.27, -1.25], [-1.7, 1.18, -0.92], [-1.25, 0.95, -0.42], [-0.7, 0.86, 0.02], H(-1.0, 0.9, -0.1), H(-0.9, 0.88, -0.06), H(-0.84, 0.8, -0.02)], 0.02, BLUE, 0.5);
            box(scene, 0.07, 0.06, 0.07, M.dark, -0.4, 0.88, 0.135);                                    // clamp veineux
            // réservoir → pompe artérielle → oxygénateur
            flowTube(scene, [H(-0.78, 0.44, 0.07), H(-0.72, 0.42, 0.0), H(-0.63, 0.5, -0.03), H(-0.585, 0.64, 0.04), H(-0.5665, 0.676, 0.102)], 0.016, BLUE, 0.5);
            flowTube(scene, [H(-0.4335, 0.676, 0.102), H(-0.423, 0.675, 0.04), H(-0.41, 0.58, -0.02), H(-0.47, 0.33, -0.01), H(-0.585, 0.26, 0.02), H(-0.67, 0.16, 0.04), H(-0.76, 0.15, 0.04)], 0.016, BLUE, 0.5);
            // oxygénateur → filtre → aorte
            flowTube(scene, [H(-0.96, 0.33, 0.04), H(-1.0, 0.37, 0.05), H(-1.02, 0.47, 0.04)], 0.016, RED, 0.5);
            flowTube(scene, [H(-1.06, 0.59, 0.04), H(-1.1, 0.76, -0.02), [-0.6, 1.04, -0.2], [-1.3, 1.16, -0.72], [-1.9, 1.26, -1.08], [-2.14, 1.27, -1.3]], 0.02, RED, 0.5);
            box(scene, 0.06, 0.05, 0.06, M.dark, HX - 1.1, 0.76, HZ - 0.02);                            // détecteur de bulles
            // cardioplégie : poche → pompe → piège à bulles → racine de l'aorte
            flowTube(scene, [H(-0.338, 1.485, -0.158), H(-0.34, 1.3, -0.27), H(-0.39, 1.1, -0.3), H(-0.385, 0.93, -0.16), H(-0.3665, 0.886, -0.058)], 0.011, AMB, 0.25);
            tube(scene, [H(-0.47, 1.432, -0.19), H(-0.42, 1.36, -0.26), H(-0.36, 1.22, -0.28)], 0.005, M.amber);
            flowTube(scene, [H(-0.2335, 0.886, -0.058), H(-0.22, 0.9, -0.15), H(-0.18, 0.93, -0.25), H(-0.16, 0.93, -0.275)], 0.011, AMB, 0.25);
            flowTube(scene, [H(-0.16, 0.8, -0.275), H(-0.3, 0.74, -0.38), [-0.1, 0.9, -0.3], [-1.2, 1.12, -0.82], [-1.9, 1.26, -1.16], [-2.06, 1.28, -1.24]], 0.011, AMB, 0.25);
            // aspiration et décharge : du champ aux pompes, puis au réservoir
            flowTube(scene, [[-1.9, 1.26, -1.42], [-1.4, 1.1, -1.0], [-0.4, 0.96, -0.5], H(-0.2, 0.9, -0.42), H(-0.14, 0.9, -0.15), H(-0.1365, 0.886, -0.058)], 0.011, DRK, 0.3);
            flowTube(scene, [H(-0.0035, 0.886, -0.058), H(0.0, 0.905, -0.16), H(-0.1, 0.92, -0.34), H(-0.6, 0.9, -0.3), H(-0.8, 0.86, -0.1), H(-0.8, 0.8, -0.03)], 0.011, DRK, 0.3);
            flowTube(scene, [[-2.0, 1.27, -1.4], [-1.35, 1.14, -1.06], [-0.2, 0.98, -0.55], H(0.1, 0.9, -0.4), H(0.095, 0.9, -0.15), H(0.0935, 0.886, -0.058)], 0.011, DRK, 0.3);
            flowTube(scene, [H(0.2265, 0.886, -0.058), H(0.23, 0.905, -0.17), H(0.1, 0.95, -0.38), H(-0.55, 0.94, -0.36), H(-0.84, 0.88, -0.12), H(-0.88, 0.8, -0.02)], 0.011, DRK, 0.3);
            // gaz : du mélangeur à l'oxygénateur
            tube(scene, [H(-0.25, 0.97, -0.215), H(-0.34, 0.84, -0.22), H(-0.62, 0.52, -0.16), H(-0.8, 0.4, -0.11), H(-0.84, 0.37, -0.09)], 0.008, M.green);
            // eau : du générateur thermique à l'échangeur
            tube(scene, [[3.58, 0.45, -1.05], [3.25, 0.07, -1.0], [2.2, 0.05, -0.75], [1.2, 0.05, -0.4], [0.5, 0.05, -0.1], H(-0.9, 0.05, -0.2), H(-0.85, 0.1, -0.05)], 0.016, M.hose);
            tube(scene, [[3.58, 0.45, -0.75], [3.2, 0.08, -0.72], [2.1, 0.05, -0.55], [1.1, 0.05, -0.3], [0.4, 0.05, -0.22], H(-0.98, 0.05, -0.22), H(-0.9, 0.1, -0.04)], 0.016, M.hose);
        })();

        /* ---------- zones cliquables ---------- */
        const P = (id, lx, y, lz, w, h, d) => proxy(id, HX + lx, y, HZ + lz, w, h, d);
        proxy('champ', -2.02, 1.2, -1.3, 0.6, 0.3, 0.5);
        proxy('anesth', -3.85, 1.0, -2.4, 0.95, 2.0, 0.95);
        proxy('veineuse', -1.25, 0.98, -0.42, 0.55, 0.22, 0.5);
        proxy('thermo', 3.95, 0.53, -0.9, 0.74, 1.04, 0.64);
        P('reservoir', -0.84, 0.6, 0.02, 0.24, 0.36, 0.24);
        P('oxy', -0.84, 0.24, 0.02, 0.22, 0.32, 0.22);
        P('filtre', -1.02, 0.56, 0.04, 0.12, 0.2, 0.12);
        P('pompe', -0.5, 0.56, 0.17, 0.24, 0.36, 0.34);
        P('cardio', -0.3, 0.76, 0.02, 0.22, 0.34, 0.34);
        P('cardio', -0.338, 1.585, -0.158, 0.16, 0.22, 0.08);
        P('cardio', -0.53, 1.4, -0.2, 0.3, 0.13, 0.14);
        P('aspi', 0.045, 0.76, 0.02, 0.45, 0.34, 0.34);
        P('gaz', -0.3, 1.07, -0.21, 0.3, 0.24, 0.12);
        P('cockpit', -0.68, 1.0, 0.28, 0.4, 0.32, 0.18);
        P('moniteur', 0.02, 1.33, -0.13, 0.6, 0.38, 0.08);
        P('moniteur', 0.06, 1.06, -0.165, 0.14, 0.1, 0.1);
        P('secours', 0.4, 0.9, -0.02, 0.26, 1.12, 0.46);

        /* ---------- lumières ---------- */
        const hemi = new T.HemisphereLight(0xffffff, 0x8f97a8, 0.32);
        scene.add(hemi);
        const sun = new T.DirectionalLight(0xffffff, 0.7);
        sun.position.set(4.5, 10, 6.5);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.bias = -0.0005;
        sun.shadow.normalBias = 0.01;
        const sc = sun.shadow.camera;
        sc.left = -6.5; sc.right = 6.5; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 30;
        scene.add(sun);

        /* ---------- thème : la salle reste blanche ; le thème sombre, c'est la nuit derrière la fenêtre ---------- */
        let mapColors = {};
        function applyTheme() {
            const cs = getComputedStyle(stage);
            const v = (n) => cs.getPropertyValue(n).trim();
            mapColors = { bg: v('--surface'), line: v('--muted'), obj: v('--line'), ink: v('--ink'), accent: v('--accent') };
            const bg = v('--sc-bg');
            if (/^#[0-9a-f]{6}$/i.test(bg)) { scene.background = C(bg); scene.fog.color.copy(scene.background); }
            const dark = v('--sc-dark') === '1';
            if (decor) decor.setNight(dark);
            renderer.toneMappingExposure = dark ? 0.92 : 0.97;
        }
        applyTheme();
        new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

        /* ---------- caméra : elle tourne autour d'une cible ---------- */
        const cam = { target: new T.Vector3(), r: 7, az: 0, pol: 1.2 };
        let fit = 1, saved = null, tw = null;
        const off = { x: 0, y: 0, tx: 0, ty: 0 };
        const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
        const posOf = (v) => { const s = Math.sin(v.pol); return new T.Vector3(v.target.x + v.r * s * Math.sin(v.az), v.target.y + v.r * Math.cos(v.pol), v.target.z + v.r * s * Math.cos(v.az)); };
        const preset = (name) => { const p = VIEWS[name]; return { target: V(p.target), r: p.r * fit, az: p.az, pol: p.pol }; };
        const homeView = () => (narrow() ? 'perfusion' : 'ensemble');   // sur un écran étroit, on part de la machine
        function apply() { camera.position.copy(posOf(cam)); camera.lookAt(cam.target); }
        function setView(v) { cam.target.copy(v.target); cam.r = v.r; cam.az = v.az; cam.pol = v.pol; apply(); }
        function limits() {
            if (state.sel || saved) return { pol: [0.35, 1.52], r: [0.7 * fit, 5 * fit] };
            return { pol: [0.45, 1.5], r: [2.2 * fit, 9.5 * fit] };
        }
        function clampCam() {
            const L = limits();
            cam.pol = Math.max(L.pol[0], Math.min(L.pol[1], cam.pol));
            cam.r = Math.max(L.r[0], Math.min(L.r[1], cam.r));
        }
        function fly(to, seconds) {
            if (reduce) { setView(to); return; }
            let d = (to.az - cam.az) % (Math.PI * 2);
            if (d > Math.PI) d -= Math.PI * 2;
            if (d < -Math.PI) d += Math.PI * 2;
            tw = { t0: performance.now(), dur: seconds * 1000, a: { target: cam.target.clone(), r: cam.r, az: cam.az, pol: cam.pol }, b: to, daz: d };
        }
        function step(now) {
            if (!tw) return;
            // l'horloge de l'image peut précéder celle du clic : on borne des deux côtés
            const u = Math.max(0, Math.min(1, (now - tw.t0) / tw.dur)), e = ease(u);
            cam.target.lerpVectors(tw.a.target, tw.b.target, e);
            cam.r = tw.a.r + (tw.b.r - tw.a.r) * e;
            cam.az = tw.a.az + tw.daz * e;
            cam.pol = tw.a.pol + (tw.b.pol - tw.a.pol) * e;
            apply();
            if (u >= 1) tw = null;
        }
        function focus(h) {
            if (walk.on) { faceTo(V(h.anchor), true); return; }
            if (!saved) saved = { target: cam.target.clone(), r: cam.r, az: cam.az, pol: cam.pol };
            const v = h.view || {};
            fly({ target: v.target ? V(v.target) : V(h.anchor).add(new T.Vector3(0, -0.1, 0)), r: (v.r || 2.2) * fit, az: v.az == null ? cam.az : v.az, pol: v.pol || 1.05 }, 1.1);
        }
        function unfocus() {
            if (walk.on) return;
            const back = saved || preset(homeView());
            saved = null;
            fly(back, 0.9);
        }

        /* ---------- visite à pied : on marche dans la salle, à hauteur d'yeux ---------- */
        const EYE = 1.65, BODY = 0.28, ROOM = [-5.5, 5.5, -4.5, 4.5];
        const SPAWN = { x: -4.85, z: 1.3, yaw: 1.92, pitch: -0.1 };   // juste passé la porte, face à la table et à la machine
        // Ce qui barre le passage : des boîtes [x0, x1, z0, z1], des cercles [x, z, r],
        // et les lignes du circuit tendues entre la table et la machine [ax, az, bx, bz, r]
        const BOXES = [
            [-2.97, -0.78, -1.75, -0.85],   // table d'opération et champs
            [-0.22, 1.48, -0.07, 0.84],     // machine cœur-poumon
            [-2.03, -0.47, -3.35, -2.55],   // table d'instrumentation
            [-5.5, -4.72, -1.7, -1.0],      // chariot d'anesthésie
            [5.05, 5.5, -3.72, -1.68],      // armoire vitrée
            [1.9, 3.7, 4.03, 4.5],          // armoire fermée
            [-0.5, 0.3, -4.25, -3.85],      // support de sacs
            [-5.35, -4.85, 3.5, 4.0], [4.8, 5.3, -4.3, -3.8],   // cartons DASRI
            [3.6, 4.3, -1.2, -0.6],         // générateur thermique
            [-2.3, -1.8, -0.78, -0.46], [-2.1, -1.6, -2.21, -1.89]   // marchepieds
        ];
        const CIRCLES = [
            [2.55, 0.95, 0.38], [2.25, -2.0, 0.38], [-3.95, -2.25, 0.46], [-4.75, -3.05, 0.22], [-2.85, -2.5, 0.33],
            [-3.5, -0.5, 0.27], [-0.1, -2.6, 0.36], [0.7, -3.35, 0.33], [-0.6, -0.5, 0.2], [-2.3, -2.05, 0.2]
        ];
        const SEGS = [[-1.0, -0.85, -0.2, 0.15, 0.1], [-1.0, -0.9, 0.5, -0.25, 0.1]];
        function push(p, cx, cz, m) {
            const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
            if (d >= m) return;
            if (d < 1e-6) { p.x = cx + m; return; }
            p.x = cx + dx / d * m; p.z = cz + dz / d * m;
        }
        // Ramène un point hors des obstacles : on glisse le long d'eux au lieu de s'y arrêter net
        function solve(p) {
            for (let it = 0; it < 3; it++) {
                p.x = Math.max(ROOM[0] + BODY, Math.min(ROOM[1] - BODY, p.x));
                p.z = Math.max(ROOM[2] + BODY, Math.min(ROOM[3] - BODY, p.z));
                BOXES.forEach(([x0, x1, z0, z1]) => {
                    const qx = Math.max(x0, Math.min(x1, p.x)), qz = Math.max(z0, Math.min(z1, p.z)), dx = p.x - qx, dz = p.z - qz, d = Math.hypot(dx, dz);
                    if (d >= BODY) return;
                    if (d > 1e-6) { p.x = qx + dx / d * BODY; p.z = qz + dz / d * BODY; return; }
                    const pen = [p.x - x0, x1 - p.x, p.z - z0, z1 - p.z], i = pen.indexOf(Math.min(...pen));
                    if (i === 0) p.x = x0 - BODY; else if (i === 1) p.x = x1 + BODY; else if (i === 2) p.z = z0 - BODY; else p.z = z1 + BODY;
                });
                CIRCLES.forEach(([cx, cz, r]) => push(p, cx, cz, r + BODY));
                SEGS.forEach(([ax, az, bx, bz, r]) => {
                    const ex = bx - ax, ez = bz - az, t = Math.max(0, Math.min(1, ((p.x - ax) * ex + (p.z - az) * ez) / (ex * ex + ez * ez)));
                    push(p, ax + ex * t, az + ez * t, r + BODY);
                });
            }
            return p;
        }
        const walk = { on: false, x: SPAWN.x, z: SPAWN.z, yaw: SPAWN.yaw, pitch: SPAWN.pitch, keys: {}, joy: { x: 0, y: 0 }, target: null, stall: 0, look: null, intro: null, fov: 38 };
        const tmpW = new T.Vector3(), tmpW2 = new T.Vector3();
        const lookDir = (yaw, pitch) => new T.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
        const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
        function applyWalk() { camera.position.set(walk.x, EYE, walk.z); camera.lookAt(tmpW.copy(camera.position).add(lookDir(walk.yaw, walk.pitch))); }
        function poseFromCamera() { const d = camera.getWorldDirection(new T.Vector3()); return { yaw: Math.atan2(d.x, d.z), pitch: Math.asin(Math.max(-1, Math.min(1, d.y))) }; }
        // Rejoindre l'entrée, depuis la vue d'ensemble ou depuis n'importe où dans la salle
        function enter() {
            const from = poseFromCamera();
            walk.intro = { t0: performance.now(), dur: reduce ? 1 : 1500, p0: camera.position.clone(), yaw0: from.yaw, pitch0: from.pitch };
            walk.x = SPAWN.x; walk.z = SPAWN.z; walk.yaw = SPAWN.yaw; walk.pitch = SPAWN.pitch;
            walk.target = null; walk.look = null;
        }
        function setWalk(on) {
            if (on === walk.on) return;
            tw = null; saved = null; walk.keys = {}; walk.joy.x = walk.joy.y = 0;
            if (on) {
                walk.on = true; walk.fov = 62;
                enter();
                stageActive = true;
            } else {
                walk.on = false; walk.intro = null; walk.target = null; walk.fov = 38;
                marker.visible = false; hover.visible = false;
                // la vue d'ensemble repart de là où l'on se tient
                const t = camera.position.clone().add(lookDir(walk.yaw, walk.pitch).multiplyScalar(3));
                cam.target.copy(t); cam.r = 3;
                cam.az = Math.atan2(camera.position.x - t.x, camera.position.z - t.z);
                cam.pol = Math.acos(Math.max(-1, Math.min(1, (camera.position.y - t.y) / 3)));
                fly(preset(homeView()), 1.3);
            }
            state.walk = on;
            renderModes();
        }
        // Se tourner vers un objet ; s'il est loin, faire quelques pas vers lui
        function faceTo(pt, approach) {
            const dx = pt.x - walk.x, dz = pt.z - walk.z, dh = Math.hypot(dx, dz);
            const yaw1 = Math.atan2(dx, dz), pitch1 = Math.max(-0.9, Math.min(0.6, Math.atan2(pt.y - EYE, Math.max(dh, 0.6))));
            walk.look = { t0: performance.now(), dur: reduce ? 1 : 700, yaw0: walk.yaw, dyaw: angDiff(walk.yaw, yaw1), pitch0: walk.pitch, pitch1 };
            if (approach && dh > 3.0) walk.target = solve({ x: pt.x - dx / dh * 2.0, z: pt.z - dz / dh * 2.0 });
        }
        function stepWalk(now, dt) {
            if (walk.intro) {
                const it = walk.intro, u = Math.max(0, Math.min(1, (now - it.t0) / it.dur)), e = ease(u);
                camera.position.lerpVectors(it.p0, tmpW2.set(SPAWN.x, EYE, SPAWN.z), e);
                camera.lookAt(tmpW.copy(camera.position).add(lookDir(it.yaw0 + angDiff(it.yaw0, SPAWN.yaw) * e, it.pitch0 + (SPAWN.pitch - it.pitch0) * e)));
                if (u >= 1) walk.intro = null;
                return;
            }
            const K = walk.keys;
            const f = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0) + walk.joy.y;
            const s = (K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0) + walk.joy.x;
            const turn = (K.ArrowLeft ? 1 : 0) - (K.ArrowRight ? 1 : 0);
            if (turn) { walk.yaw += turn * 1.9 * dt; walk.look = null; }
            const fx = Math.sin(walk.yaw), fz = Math.cos(walk.yaw), rx = -fz, rz = fx;
            let mx = 0, mz = 0;
            const len = Math.hypot(f, s);
            if (len > 0.05) {
                walk.target = null;
                const k = Math.min(1, len) / len * ((K.ShiftLeft || K.ShiftRight) ? 2.6 : 1.5) * dt;
                mx = (fx * f + rx * s) * k; mz = (fz * f + rz * s) * k;
            } else if (walk.target) {
                const dx = walk.target.x - walk.x, dz = walk.target.z - walk.z, d = Math.hypot(dx, dz);
                if (d < 0.05) walk.target = null;
                else { const st = Math.min(d, Math.min(1.7, 0.5 + d * 1.2) * dt); mx = dx / d * st; mz = dz / d * st; }
            }
            if (mx || mz) {
                const p = solve({ x: walk.x + mx, z: walk.z + mz });
                const got = Math.hypot(p.x - walk.x, p.z - walk.z), want = Math.hypot(mx, mz);
                walk.x = p.x; walk.z = p.z;
                if (walk.target) { walk.stall = got < want * 0.25 ? walk.stall + dt : 0; if (walk.stall > 0.25) walk.target = null; }
            }
            if (walk.look) {
                const L = walk.look, u = Math.max(0, Math.min(1, (now - L.t0) / L.dur)), e = ease(u);
                walk.yaw = L.yaw0 + L.dyaw * e; walk.pitch = L.pitch0 + (L.pitch1 - L.pitch0) * e;
                if (u >= 1) walk.look = null;
            }
            marker.visible = !!walk.target;
            if (walk.target) { marker.position.set(walk.target.x, 0.012, walk.target.z); marker.scale.setScalar(1 + 0.12 * Math.sin(now / 160)); }
            applyWalk();
        }
        // Les anneaux au sol : où l'on va, et où l'on irait en cliquant
        const ringMat = (op) => new T.MeshBasicMaterial({ color: C('#4f5bd5'), transparent: true, opacity: op, depthWrite: false });
        const ringGeo = new T.RingGeometry(0.15, 0.2, 40); ringGeo.rotateX(-Math.PI / 2);
        const marker = new T.Mesh(ringGeo, ringMat(0.9)), hover = new T.Mesh(ringGeo, ringMat(0.55));
        marker.visible = hover.visible = false; marker.renderOrder = hover.renderOrder = 2;
        scene.add(marker); scene.add(hover);

        /* ---------- plan de la salle, avec sa position ---------- */
        const mapEl = $('map'), mctx = mapEl ? mapEl.getContext('2d') : null;
        let mapBox = null;
        function drawMap() {
            if (!mctx || !walk.on) return;
            const cw = mapEl.clientWidth, ch = mapEl.clientHeight;
            if (!cw || !ch) return;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            if (mapEl.width !== Math.round(cw * dpr)) { mapEl.width = Math.round(cw * dpr); mapEl.height = Math.round(ch * dpr); }
            const g = mctx, pad = 8, sc = Math.min((cw - 2 * pad) / 11, (ch - 2 * pad) / 9), ox = (cw - 11 * sc) / 2, oy = (ch - 9 * sc) / 2;
            mapBox = { sc, ox, oy };
            const X = (x) => ox + (x - ROOM[0]) * sc, Z = (z) => oy + (z - ROOM[2]) * sc;
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, cw, ch);
            g.fillStyle = mapColors.obj;
            BOXES.slice(2).forEach(([x0, x1, z0, z1]) => g.fillRect(X(x0), Z(z0), (x1 - x0) * sc, (z1 - z0) * sc));
            CIRCLES.forEach(([x, z, r]) => { g.beginPath(); g.arc(X(x), Z(z), r * sc, 0, 7); g.fill(); });
            g.fillStyle = '#2f6c9e'; g.fillRect(X(-2.97), Z(-1.75), 2.19 * sc, 0.9 * sc);
            g.fillStyle = mapColors.ink; g.globalAlpha = 0.55; g.fillRect(X(-0.22), Z(-0.07), 1.7 * sc, 0.91 * sc); g.globalAlpha = 1;
            g.strokeStyle = mapColors.line; g.lineWidth = 1.5; g.strokeRect(X(ROOM[0]), Z(ROOM[2]), 11 * sc, 9 * sc);
            g.lineWidth = 4;
            g.strokeStyle = '#8fb5dd'; g.beginPath(); g.moveTo(X(1.4), Z(ROOM[2])); g.lineTo(X(4.4), Z(ROOM[2])); g.stroke();
            g.strokeStyle = mapColors.bg; g.beginPath(); g.moveTo(X(ROOM[0]), Z(0.4)); g.lineTo(X(ROOM[0]), Z(2.2)); g.moveTo(X(ROOM[1]), Z(0.4)); g.lineTo(X(ROOM[1]), Z(1.6)); g.stroke();
            const px = X(walk.intro ? SPAWN.x : walk.x), pz = Z(walk.intro ? SPAWN.z : walk.z), yw = walk.intro ? SPAWN.yaw : walk.yaw;
            if (walk.target) { g.strokeStyle = mapColors.accent; g.lineWidth = 1.5; g.beginPath(); g.arc(X(walk.target.x), Z(walk.target.z), 3.5, 0, 7); g.stroke(); }
            g.fillStyle = mapColors.accent; g.globalAlpha = 0.22;
            g.beginPath(); g.moveTo(px, pz);
            g.lineTo(px + Math.sin(yw + 0.55) * 26, pz + Math.cos(yw + 0.55) * 26); g.lineTo(px + Math.sin(yw - 0.55) * 26, pz + Math.cos(yw - 0.55) * 26);
            g.closePath(); g.fill(); g.globalAlpha = 1;
            g.beginPath(); g.arc(px, pz, 4.5, 0, 7); g.fill();
            g.strokeStyle = mapColors.bg; g.lineWidth = 1.5; g.stroke();
        }
        if (mapEl) mapEl.addEventListener('pointerdown', (ev) => {
            if (!walk.on || !mapBox) return;
            const r = mapEl.getBoundingClientRect();
            const x = ROOM[0] + (ev.clientX - r.left - mapBox.ox) / mapBox.sc, z = ROOM[2] + (ev.clientY - r.top - mapBox.oy) / mapBox.sc;
            if (x < ROOM[0] || x > ROOM[1] || z < ROOM[2] || z > ROOM[3]) return;
            walk.intro = null; walk.target = solve({ x, z }); stageActive = true;
        });

        /* ---------- clavier (ZQSD sur AZERTY, WASD sur QWERTY : même touches physiques) et joystick ---------- */
        let stageActive = false;
        const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'];
        document.addEventListener('pointerdown', (ev) => { stageActive = stage.contains(ev.target); }, true);
        window.addEventListener('keydown', (e) => {
            if (!stageActive || !MOVE_KEYS.includes(e.code)) return;
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            walk.keys[e.code] = true;
            if (e.code.indexOf('Arrow') === 0) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => { walk.keys[e.code] = false; });
        window.addEventListener('blur', () => { walk.keys = {}; });
        const stick = $('stick');
        if (stick) {
            const knob = stick.firstElementChild;
            let sid = null;
            const moveStick = (ev) => {
                const r = stick.getBoundingClientRect(), R0 = r.width / 2 - 8;
                let dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
                const d = Math.hypot(dx, dy); if (d > R0) { dx *= R0 / d; dy *= R0 / d; }
                knob.style.transform = `translate(${dx}px, ${dy}px)`;
                walk.joy.x = dx / R0; walk.joy.y = -dy / R0;
            };
            stick.addEventListener('pointerdown', (ev) => { sid = ev.pointerId; try { stick.setPointerCapture(sid); } catch (e) { /* pas de capture */ } moveStick(ev); });
            stick.addEventListener('pointermove', (ev) => { if (ev.pointerId === sid) moveStick(ev); });
            const stopStick = (ev) => { if (ev.pointerId !== sid) return; sid = null; knob.style.transform = ''; walk.joy.x = walk.joy.y = 0; };
            stick.addEventListener('pointerup', stopStick);
            stick.addEventListener('pointercancel', stopStick);
        }

        // En vue d'ensemble : ← → (ou Q D) font tourner autour, ↑ ↓ (ou Z S) rapprochent et éloignent
        function orbitKeys(dt) {
            const K = walk.keys;
            const turn = (K.ArrowRight || K.KeyD ? 1 : 0) - (K.ArrowLeft || K.KeyA ? 1 : 0);
            const near = (K.ArrowUp || K.KeyW ? 1 : 0) - (K.ArrowDown || K.KeyS ? 1 : 0);
            if (!turn && !near) return;
            tw = null;
            cam.az += turn * 1.3 * dt;
            cam.r *= Math.exp(-near * 0.9 * dt);
            clampCam(); apply();
        }

        /* ---------- repères cliquables posés sur les objets ---------- */
        const pins = HOTSPOTS.map((h) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'pin pin--r';
            b.dataset.id = h.id;
            b.setAttribute('aria-label', h.label);
            b.innerHTML = `<span class="pin__dot"></span><span class="pin__label">${h.label}</span>`;
            b.addEventListener('click', () => select(h.id));
            pinsEl.appendChild(b);
            return { h, el: b, v: V(h.anchor), label: b.lastElementChild, cur: 'r', w: 0 };
        });
        const tmp = new T.Vector3(), wallTmp = new T.Vector3();
        function placePins(w, hgt) {
            pins.forEach((p) => {
                let show = !state.sel || state.sel === p.h.id;
                if (show) {
                    tmp.copy(p.v).project(camera);
                    show = tmp.z < 1 && Math.abs(tmp.x) < 1.02 && Math.abs(tmp.y) < 1.02 && (!walk.on || camera.position.distanceTo(p.v) < 7.5);
                    if (show) {
                        const x = (tmp.x * 0.5 + 0.5) * w;
                        p.el.style.transform = `translate(${x.toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * hgt).toFixed(1)}px)`;
                        const side = x + 20 + p.w > w ? 'l' : 'r';     // l'étiquette se retourne si elle sortait du cadre
                        if (side !== p.cur) { p.el.classList.replace('pin--' + p.cur, 'pin--' + side); p.cur = side; }
                    }
                }
                p.el.hidden = !show;
                if (show && !p.w) p.w = p.label.offsetWidth;
            });
        }

        /* ---------- souris et doigts ---------- */
        const ray = new T.Raycaster(), ndc = new T.Vector2();
        function aim(ev) {
            const r = canvas.getBoundingClientRect();
            ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
            ray.setFromCamera(ndc, camera);
        }
        function pick(ev) {
            aim(ev);
            const hit = ray.intersectObjects(proxies, false)[0];
            return hit ? hit.object.userData.id : null;
        }
        // Le point du sol visé, s'il n'est caché par rien (une vitre ne compte pas)
        function floorAt(ev) {
            if (!decor) return null;
            aim(ev);
            const hits = ray.intersectObjects(scene.children, true);
            for (const h of hits) {
                const m = h.object.material;
                if (!m || m.visible === false || h.object === marker || h.object === hover || (m.transparent && m.opacity < 0.5)) continue;
                let o = h.object, shown = true;
                while (o) { if (!o.visible) { shown = false; break; } o = o.parent; }
                if (!shown) continue;
                if (h.object !== decor.floor) return null;
                const p = h.point;
                return p.x > ROOM[0] && p.x < ROOM[1] && p.z > ROOM[2] && p.z < ROOM[3] ? p : null;
            }
            return null;
        }
        let lastHover = 0;
        const ptr = new Map();
        let moved = 0, pinch = 0;
        canvas.addEventListener('pointerdown', (ev) => {
            // Un premier contact ouvre un nouveau geste : on oublie tout pointeur resté inscrit
            // (relâché hors de la page ou d'un cadre), sinon un glisser serait pris pour un pincement
            if (ev.isPrimary) ptr.clear();
            ptr.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
            moved = 0;
            if (ptr.size === 2) { const a = Array.from(ptr.values()); pinch = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
            try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* pas de capture */ }
        });
        canvas.addEventListener('pointermove', (ev) => {
            let p = ptr.get(ev.pointerId);
            if (p && ev.pointerType === 'mouse' && ev.buttons === 0) { ptr.delete(ev.pointerId); p = null; }   // bouton relâché sans qu'on le voie
            if (!p) {
                // survol d'un objet : son étiquette apparaît ; à pied, un anneau montre où l'on irait
                const id = pick(ev);
                pins.forEach((q) => q.el.classList.toggle('is-hover', q.h.id === id));
                let fp = null;
                if (walk.on && !id && ev.pointerType === 'mouse' && performance.now() - lastHover > 50) { lastHover = performance.now(); fp = floorAt(ev); }
                hover.visible = !!fp;
                if (fp) hover.position.set(fp.x, 0.011, fp.z);
                canvas.style.cursor = id || fp ? 'pointer' : 'grab';
                return;
            }
            const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
            p.x = ev.clientX; p.y = ev.clientY;
            if (ptr.size === 2) {
                const a = Array.from(ptr.values()), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
                if (pinch > 0 && !walk.on) { cam.r *= pinch / d; tw = null; clampCam(); apply(); }
                pinch = d; moved = 99;
                return;
            }
            moved += Math.abs(dx) + Math.abs(dy);
            if (moved < 5) return;
            hover.visible = false;
            if (walk.on) {
                // on attrape la salle : glisser vers la droite fait tourner le regard vers la gauche
                if (walk.intro) return;
                walk.look = null;
                walk.yaw += dx * 0.0032;
                walk.pitch = Math.max(-1.2, Math.min(1.2, walk.pitch + dy * 0.0032));
                applyWalk();
                return;
            }
            tw = null;
            cam.az -= dx * 0.006;
            if (ev.pointerType !== 'touch') cam.pol -= dy * 0.005;
            clampCam(); apply();
        });
        const release = (ev) => {
            const had = ptr.delete(ev.pointerId);
            if (ptr.size < 2) pinch = 0;
            if (had && ev.type === 'pointerup' && moved < 6) {
                const id = pick(ev);
                if (id) { select(id); return; }
                if (walk.on && !walk.intro) { const fp = floorAt(ev); if (fp) walk.target = solve({ x: fp.x, z: fp.z }); }
            }
        };
        canvas.addEventListener('pointerup', release);
        canvas.addEventListener('pointercancel', release);
        canvas.addEventListener('lostpointercapture', (ev) => { ptr.delete(ev.pointerId); if (ptr.size < 2) pinch = 0; });

        // Pavé tactile et molette : balayer à deux doigts de côté fait tourner, pincer (ou Ctrl + molette) zoome.
        // Le défilement vertical reste à la page.
        canvas.addEventListener('wheel', (ev) => {
            const horizontal = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) * 1.2;
            if (!ev.ctrlKey && !horizontal) return;
            ev.preventDefault();
            const k = ev.deltaMode === 1 ? 16 : 1;
            if (ev.ctrlKey) {
                const f = Math.exp(ev.deltaY * k * 0.01);
                if (walk.on) walk.fov = Math.max(35, Math.min(80, walk.fov * f));
                else { tw = null; cam.r *= f; clampCam(); apply(); }
            } else if (walk.on) { if (!walk.intro) { walk.look = null; walk.yaw += ev.deltaX * k * 0.003; applyWalk(); } }
            else { tw = null; cam.az += ev.deltaX * k * 0.004; clampCam(); apply(); }
        }, { passive: false });
        function zoom(f) {
            if (walk.on) { walk.fov = Math.max(35, Math.min(80, walk.fov * f)); return; }   // à pied, on resserre le champ de vision
            tw = null; cam.r *= f; clampCam(); apply();
        }

        /* ---------- taille, boucle d'affichage ---------- */
        let W = 1, Hh = 1, running = false, last = 0, onScreen = true;
        function resize() {
            W = Math.max(1, stage.clientWidth); Hh = Math.max(1, stage.clientHeight);
            renderer.setSize(W, Hh, false);
            camera.aspect = W / Hh;
            camera.updateProjectionMatrix();
            const f = Math.max(1, Math.min(1.65, 1.5 / camera.aspect));
            if (Math.abs(f - fit) > 0.01) { const k = f / fit; fit = f; cam.r *= k; if (saved) saved.r *= k; }
            setOffset(panel.classList.contains('is-open'));
            pins.forEach((p) => { p.w = 0; });
            if (walk.on) { if (!walk.intro) applyWalk(); } else apply();
        }
        function frame(now) {
            if (!running) return;
            requestAnimationFrame(frame);
            const dt = Math.min(0.05, (now - last) / 1000 || 0);
            last = now;
            step(now);
            if (walk.on) stepWalk(now, dt); else orbitKeys(dt);
            if (Math.abs(camera.fov - walk.fov) > 0.05) {
                camera.fov = reduce ? walk.fov : camera.fov + (walk.fov - camera.fov) * Math.min(1, dt * 5);
                camera.updateProjectionMatrix();
            }
            if (!reduce) {
                flows.forEach((f) => { f.tex.offset.x -= f.speed * dt; });
                rotors.forEach((r) => { r.obj.rotation.y -= r.speed * dt; });
            }
            const k = reduce ? 1 : Math.min(1, dt * 7);
            off.x += (off.tx - off.x) * k; off.y += (off.ty - off.y) * k;
            if (Math.abs(off.x) > 0.5 || Math.abs(off.y) > 0.5) camera.setViewOffset(W, Hh, off.x, off.y, W, Hh); else camera.clearViewOffset();
            if (decor) { decor.walls.forEach((w) => { w.g.visible = wallTmp.copy(camera.position).sub(w.p).dot(w.n) > 0; }); decor.update(camera); }
            renderer.render(scene, camera);
            placePins(W, Hh);
            drawMap();
        }
        function wake() {
            const should = onScreen && !document.hidden;
            if (should && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
            if (!should) running = false;
        }
        new ResizeObserver(resize).observe(stage);
        if ('IntersectionObserver' in window) new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; wake(); }, { rootMargin: '200px' }).observe(stage);
        document.addEventListener('visibilitychange', wake);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => pins.forEach((p) => { p.w = 0; }));

        resize();
        setView(preset(homeView()));
        wake();

        return {
            focus, unfocus, zoom, setWalk,
            view(name) { setWalk(false); saved = null; fly(preset(name), 1.1); },
            reset() {
                if (state.sel) { closeSelection(); return; }
                if (walk.on) { enter(); return; }          // à pied : retour à l'entrée
                saved = null; fly(preset(homeView()), 0.8);
            },
            // La fiche couvre une partie de l'image : on décale la vue pour que l'objet reste au centre de ce qui est libre
            offset(open) {
                if (!open) { off.tx = 0; off.ty = 0; return; }
                if (narrow()) { off.tx = 0; off.ty = panel.offsetHeight / 2; } else { off.tx = (panel.offsetWidth + 12) / 2; off.ty = 0; }
            }
        };
    }
    function setOffset(open) { if (world) world.offset(open); }

    /* =====================================================================
       Boutons
       ===================================================================== */
    document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
        if (state.mode === 'quiz') endQuiz();
        if (state.sel) closeSelection();
        renderModes();
        if (world) world.view(b.dataset.view);
    }));
    $('walkBtn').addEventListener('click', () => {
        if (!world) return;
        if (state.mode === 'quiz') endQuiz();
        if (state.sel) closeSelection();
        world.setWalk(!state.walk);
    });
    $('tourBtn').addEventListener('click', startTour);
    $('quizBtn').addEventListener('click', startQuiz);
    $('panelClose').addEventListener('click', closeSelection);
    $('tourPrev').addEventListener('click', () => tourStep(-1));
    $('tourNext').addEventListener('click', () => tourStep(1));
    $('zoomIn').addEventListener('click', () => world && world.zoom(0.82));
    $('zoomOut').addEventListener('click', () => world && world.zoom(1.22));
    $('viewReset').addEventListener('click', () => world && world.reset());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.sel) closeSelection(); });

    renderModes();
    renderChips();
})();
