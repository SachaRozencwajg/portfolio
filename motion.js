/**
 * Animations (skills design-to-motion et landing-page-design, voir .claude/skills/) :
 * 1. Apparition de l'accueil au chargement (le CSS fait le travail, on pose html.is-ready).
 * 2. Phrase révélée : chaque mot s'allume en franchissant une ligne au milieu de l'écran.
 * 3. Applications IA : entrée des cartes au défilement, puis une histoire en boucle par visuel.
 *    Chaque histoire part du visuel au repos et y revient ; son horloge s'arrête hors écran.
 * prefers-reduced-motion : tout s'affiche dans l'état final, sans histoire.
 */
(function () {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lang = () => (typeof currentLang !== 'undefined' && currentLang === 'en' ? 'en' : 'fr');

    // ===========================
    // 1. Accueil : on attend les polices (600 ms au plus) pour ne pas animer un texte qui va changer
    // ===========================
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(resolve => setTimeout(resolve, 600))]).then(() => {
        requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));
    });

    // ===========================
    // 2. Phrase révélée
    // ===========================
    const tagline = document.getElementById('taglineText');
    let wordObserver = null;

    function renderTagline() {
        if (!tagline) return;
        const words = t('tagline').split(' ');
        tagline.textContent = '';
        words.forEach((word, i) => {
            const span = document.createElement('span');
            span.className = 'tagline__word';
            span.textContent = word;
            tagline.appendChild(span);
            if (i < words.length - 1) tagline.appendChild(document.createTextNode(' '));
        });

        if (wordObserver) wordObserver.disconnect();
        const spans = Array.from(tagline.querySelectorAll('.tagline__word'));
        if (reduceMotion || !('IntersectionObserver' in window)) {
            spans.forEach(span => span.classList.add('is-lit'));
            return;
        }

        // Ligne de déclenchement à 60 % de la hauteur de l'écran
        wordObserver = new IntersectionObserver((entries) => {
            let step = 0;
            entries
                .sort((a, b) => spans.indexOf(a.target) - spans.indexOf(b.target))
                .forEach(entry => {
                    const word = entry.target;
                    const passedTop = entry.boundingClientRect.top < 0;
                    if (entry.isIntersecting || passedTop) {
                        // Les mots d'une même ligne s'allument l'un après l'autre
                        word.style.transitionDelay = `${step++ * 60}ms`;
                        word.classList.add('is-lit');
                    } else {
                        word.style.transitionDelay = '0ms';
                        word.classList.remove('is-lit');
                    }
                });
        }, { rootMargin: '0px 0px -40% 0px' });
        spans.forEach(span => wordObserver.observe(span));
    }

    // ===========================
    // 3. Applications IA
    // ===========================
    const ICONS = {
        check: '<svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"/></svg>',
        clock: '<svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/></svg>',
        lock: '<svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Z"/></svg>',
        warning: '<svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/></svg>'
    };

    // Textes des visuels (décoratifs, aria-hidden) ; le contenu médical reste exact
    const STORY_TEXT = {
        fr: {
            edn: {
                qLabel: 'Question',
                question: 'Conduite à tenir devant un choc anaphylactique peropératoire ?',
                srcLabel: 'Référentiels interrogés',
                chips: ['Anesthésie-Réanimation', "Médecine d'urgence", 'Pédiatrie'],
                aLabel: 'Réponse sourcée',
                answer: "Arrêt de l'agent suspecté, oxygène pur, adrénaline IV titrée, remplissage vasculaire."
            },
            logbook: {
                title: 'Mon logbook · DESAR',
                sub: 'Semestre 4',
                ok: 'Validé',
                pending: 'En attente',
                acts: [['Intubation orotrachéale', '4/4'], ['Cathéter veineux central', '3/4'],
                    ['Péridurale obstétricale', '2/4'], ['Cathéter artériel radial', '3/4']]
            },
            llm: {
                label: 'Réponse du modèle',
                before: "La dose maximale de paracétamol chez l'adulte est de ",
                bad: '8 g',
                fix: '4 g',
                after: ' par jour.',
                flag: 'Hallucination repérée'
            }
        },
        en: {
            edn: {
                qLabel: 'Question',
                question: 'Management of perioperative anaphylactic shock?',
                srcLabel: 'Sources searched',
                chips: ['Anaesthesiology', 'Emergency medicine', 'Paediatrics'],
                aLabel: 'Sourced answer',
                answer: 'Stop the suspected agent, 100% oxygen, titrated IV adrenaline, fluid resuscitation.'
            },
            logbook: {
                title: 'My logbook · DESAR',
                sub: 'Semester 4',
                ok: 'Validated',
                pending: 'Pending',
                acts: [['Orotracheal intubation', '4/4'], ['Central venous catheter', '3/4'],
                    ['Obstetric epidural', '2/4'], ['Radial arterial line', '3/4']]
            },
            llm: {
                label: 'Model answer',
                before: 'The maximum daily dose of paracetamol for adults is ',
                bad: '8 g',
                fix: '4 g',
                after: '.',
                flag: 'Hallucination flagged'
            }
        }
    };

    const esc = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;');

    function statusHtml(ok, txt) {
        return `<span class="story__status${ok ? ' is-ok' : ''}">${ok ? ICONS.check : ICONS.clock}${esc(ok ? txt.ok : txt.pending)}</span>`;
    }

    function rowHtml(act, txt, ok) {
        return `<li class="story__row"><span class="story__act">${esc(act[0])}</span>` +
            `<span class="story__level">${act[1]}</span>${statusHtml(ok, txt)}</li>`;
    }

    function sentenceHtml(txt) {
        return `${esc(txt.before)}<span class="story__bad is-flagged">${esc(txt.bad)}</span>` +
            `<span class="story__fix">${esc(txt.fix)}</span>${esc(txt.after)}`;
    }

    // Barre d'adresse : le visuel se lit comme un aperçu de l'app, pas comme du texte de la page
    const bar = (domain) => `<div class="story__bar"><span class="story__url">${ICONS.lock}${domain}</span></div>`;

    // Visuels au repos : c'est l'état de départ et d'arrivée de chaque histoire
    const BUILD = {
        edn(txt) {
            return `<div class="story story--edn">${bar('edn-ia.fr')}<div class="story__panel">
                <div><span class="story__label">${esc(txt.qLabel)}</span>
                    <p><span class="story__typed">${esc(txt.question)}</span><span class="story__caret"></span></p></div>
                <div><span class="story__label">${esc(txt.srcLabel)}</span>
                    <div class="story__chips">${txt.chips.map((c, i) =>
                        `<span class="story__chip ${i < 2 ? 'is-match' : 'is-miss'}">${esc(c)}</span>`).join('')}</div></div>
                <div class="story__answer"><span class="story__label">${esc(txt.aLabel)}</span>
                    <p>${esc(txt.answer)}<span class="story__cite">1</span></p></div>
            </div></div>`;
        },
        logbook(txt) {
            return `<div class="story story--logbook">${bar('carelogbook.com')}<div class="story__panel">
                <div class="story__head"><span class="story__label">${esc(txt.title)}</span><span class="story__label">${esc(txt.sub)}</span></div>
                <ul class="story__list">${txt.acts.slice(0, 3).map(act => rowHtml(act, txt, true)).join('')}</ul>
            </div></div>`;
        },
        llm(txt) {
            return `<div class="story story--llm"><div class="story__panel">
                <span class="story__label">${esc(txt.label)}</span>
                <p class="story__typed">${sentenceHtml(txt)}<span class="story__caret"></span></p>
                <span class="story__flag">${ICONS.warning}${esc(txt.flag)}</span>
            </div></div>`;
        }
    };

    // --- Horloge commune : chaque histoire n'avance que visible à l'écran ---
    const stories = [];

    function wait(story, ms) {
        return new Promise(resolve => story.waiters.push({ at: story.time + ms, resolve }));
    }

    let last = null;
    function tick(now) {
        const dt = last === null ? 0 : Math.min(now - last, 100);
        last = now;
        stories.forEach(story => {
            if (!story.running || !story.visible || document.hidden) return;
            story.time += dt;
            const due = story.waiters.filter(w => w.at <= story.time);
            story.waiters = story.waiters.filter(w => w.at > story.time);
            due.forEach(w => w.resolve());
        });
        requestAnimationFrame(tick);
    }

    // Saisie et effacement caractère par caractère (texte HTML réel)
    async function typeText(story, el, text, step) {
        for (let i = 1; i <= text.length; i++) {
            el.firstChild.nodeValue = text.slice(0, i);
            await wait(story, step);
        }
    }

    async function eraseText(story, el, step) {
        const text = el.firstChild.nodeValue;
        for (let i = text.length - 1; i >= 0; i--) {
            el.firstChild.nodeValue = text.slice(0, i);
            await wait(story, step);
        }
    }

    // Remplace le contenu d'un élément par un seul nœud texte, suivi du curseur
    function plainWithCaret(el, text) {
        el.textContent = '';
        el.appendChild(document.createTextNode(text));
        const caret = document.createElement('span');
        caret.className = 'story__caret';
        el.appendChild(caret);
    }

    const RUN = {
        // Une question est retapée, les référentiels sont interrogés un par un, puis la réponse sourcée arrive
        async edn(story, txt) {
            const box = story.el.querySelector('.story');
            const typed = box.querySelector('.story__typed');
            const chips = Array.from(box.querySelectorAll('.story__chip'));
            const answer = box.querySelector('.story__answer');
            for (;;) {
                await wait(story, 2400);
                answer.classList.add('is-hidden');
                chips.forEach(chip => chip.classList.remove('is-match', 'is-miss'));
                await wait(story, 500);
                box.classList.add('is-typing');
                await eraseText(story, typed, 18);
                await wait(story, 300);
                await typeText(story, typed, txt.question, 48);
                box.classList.remove('is-typing');
                await wait(story, 300);
                for (let i = 0; i < chips.length; i++) {
                    chips[i].classList.add('is-checking');
                    await wait(story, 420);
                    chips[i].classList.remove('is-checking');
                    chips[i].classList.add(i < 2 ? 'is-match' : 'is-miss');
                    await wait(story, 120);
                }
                await wait(story, 250);
                answer.classList.remove('is-hidden');
            }
        },

        // Un nouvel acte arrive en haut de la liste, les autres descendent, puis le senior le valide.
        // Après 4 arrivées, la liste retrouve exactement son état de départ.
        async logbook(story, txt) {
            const list = story.el.querySelector('.story__list');
            let next = 3;
            for (;;) {
                await wait(story, 1800);
                const rows = Array.from(list.children);
                const before = rows.map(row => row.getBoundingClientRect().top);
                list.insertAdjacentHTML('afterbegin', rowHtml(txt.acts[next], txt, false));
                const fresh = list.firstElementChild;
                fresh.classList.add('is-entering');
                // Les lignes existantes glissent depuis leur ancienne position (FLIP)
                rows.forEach((row, i) => {
                    row.style.transition = 'none';
                    row.style.transform = `translateY(${before[i] - row.getBoundingClientRect().top}px)`;
                });
                list.offsetHeight; // applique la position de départ avant d'animer
                rows.forEach(row => {
                    row.style.transition = '';
                    row.style.transform = '';
                });
                fresh.classList.remove('is-entering');
                const leaving = rows[rows.length - 1];
                leaving.classList.add('is-leaving');
                await wait(story, 700);
                leaving.remove();
                await wait(story, 600);
                fresh.querySelector('.story__status').outerHTML = statusHtml(true, txt);
                const status = fresh.querySelector('.story__status');
                status.classList.add('is-pop');
                await wait(story, 400);
                status.classList.remove('is-pop');
                next = (next + 3) % txt.acts.length;
            }
        },

        // Le modèle écrit une réponse, l'erreur est repérée puis corrigée
        async llm(story, txt) {
            const box = story.el.querySelector('.story');
            const typed = box.querySelector('.story__typed');
            const flag = box.querySelector('.story__flag');
            const plain = txt.before + txt.bad + txt.after;
            for (;;) {
                await wait(story, 2600);
                flag.classList.add('is-hidden');
                typed.querySelector('.story__fix').classList.add('is-hidden');
                typed.querySelector('.story__bad').classList.remove('is-flagged');
                await wait(story, 600);
                plainWithCaret(typed, plain);
                box.classList.add('is-typing');
                await eraseText(story, typed, 16);
                await wait(story, 300);
                await typeText(story, typed, plain, 45);
                box.classList.remove('is-typing');
                typed.innerHTML = sentenceHtml(txt) + '<span class="story__caret"></span>';
                const bad = typed.querySelector('.story__bad');
                const fix = typed.querySelector('.story__fix');
                bad.classList.remove('is-flagged');
                fix.classList.add('is-hidden');
                await wait(story, 600);
                bad.classList.add('is-flagged');
                flag.classList.remove('is-hidden');
                await wait(story, 900);
                fix.classList.remove('is-hidden');
            }
        }
    };

    const bento = document.getElementById('projectsBento');
    const visuals = bento ? Array.from(bento.querySelectorAll('[data-story]')) : [];
    let storiesStarted = false;

    function buildVisuals() {
        const texts = STORY_TEXT[lang()];
        visuals.forEach((el, i) => {
            const kind = el.dataset.story;
            el.querySelectorAll('.story').forEach(node => node.remove());
            el.insertAdjacentHTML('beforeend', BUILD[kind](texts[kind]));
            // Recommencer l'histoire : les attentes de l'ancienne boucle ne seront jamais résolues
            const story = stories[i] || (stories[i] = { el, time: 0, visible: false, running: false, waiters: [] });
            story.waiters = [];
            story.time = 0;
            if (storiesStarted) startStory(story, i);
        });
    }

    function startStory(story, i) {
        story.running = true;
        const kind = story.el.dataset.story;
        // Les cartes n'agissent jamais en même temps : 1,2 s de décalage, dans l'ordre de lecture
        wait(story, i * 1200).then(() => RUN[kind](story, STORY_TEXT[lang()][kind]));
    }

    if (bento) {
        buildVisuals();

        if (reduceMotion || !('IntersectionObserver' in window)) {
            bento.classList.add('is-in');
        } else {
            // Entrée quand 30 % de la mosaïque est visible, une seule fois ; histoires après l'atterrissage
            const introObserver = new IntersectionObserver((entries) => {
                if (!entries.some(entry => entry.isIntersecting)) return;
                introObserver.disconnect();
                bento.classList.add('is-in');
                setTimeout(() => {
                    storiesStarted = true;
                    stories.forEach(startStory);
                }, 1200);
            }, { threshold: 0.3 });
            introObserver.observe(bento);

            // Pause hors écran
            const visibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const story = stories.find(s => s.el === entry.target);
                    if (story) story.visible = entry.isIntersecting;
                });
            });
            visuals.forEach(el => visibilityObserver.observe(el));
            requestAnimationFrame(tick);
        }
    }

    renderTagline();
    document.addEventListener('languagechange-site', () => {
        renderTagline();
        if (bento) buildVisuals();
    });
})();
