/**
 * Sacha Rozencwajg - Personal Website
 * Thème clair/sombre (suit le système par défaut), navigation, apparitions au défilement,
 * publications (sélection et filtres), conférences (à venir / passées), copie de l'adresse.
 */

// ===========================
// DOM Elements
// ===========================
const header = document.getElementById('header');
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelectorAll('.nav__link');
const themeToggle = document.getElementById('themeToggle');

// ===========================
// Theme Management
// Par défaut le site suit le réglage du système ; le menu permet de forcer clair ou sombre.
// localStorage 'theme' : 'light' | 'dark', absent = système.
// ===========================
const themeMenu = document.getElementById('themeMenu');
const themeOptions = document.getElementById('themeOptions');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function getStoredTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
}

function getThemeChoice() {
    const stored = getStoredTheme();
    return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function applyTheme() {
    const choice = getThemeChoice();
    const theme = choice === 'system' ? (systemDark.matches ? 'dark' : 'light') : choice;
    document.documentElement.setAttribute('data-theme', theme);
    themeMenu.dataset.choice = choice;
    themeOptions.querySelectorAll('[data-theme-choice]').forEach(option => {
        option.setAttribute('aria-checked', String(option.dataset.themeChoice === choice));
    });
}

function setThemeChoice(choice) {
    try {
        if (choice === 'system') {
            localStorage.removeItem('theme');
        } else {
            localStorage.setItem('theme', choice);
        }
    } catch (e) { /* stockage indisponible : le choix vaut pour la page en cours */ }
    if (choice !== 'system') document.documentElement.setAttribute('data-theme', choice);
    applyTheme();
}

function setThemeMenu(open) {
    themeOptions.hidden = !open;
    themeToggle.setAttribute('aria-expanded', String(open));
}

themeToggle.addEventListener('click', () => setThemeMenu(themeOptions.hidden));

themeOptions.addEventListener('click', (e) => {
    const option = e.target.closest('[data-theme-choice]');
    if (!option) return;
    setThemeChoice(option.dataset.themeChoice);
    setThemeMenu(false);
    themeToggle.focus();
});

systemDark.addEventListener('change', () => {
    if (getThemeChoice() === 'system') applyTheme();
});

// ===========================
// Mobile Navigation (panneau plein écran)
// ===========================
const mobileNav = window.matchMedia('(max-width: 1024px)');

function setNav(open) {
    nav.classList.toggle('active', open);
    document.body.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', t(open ? 'nav.close' : 'nav.open'));
}

navToggle.addEventListener('click', () => setNav(!nav.classList.contains('active')));

// Fermer le menu en choisissant un lien
navLinks.forEach(link => {
    link.addEventListener('click', () => setNav(false));
});

// Fermer le menu thème en cliquant ailleurs
document.addEventListener('click', (e) => {
    if (!themeMenu.contains(e.target)) setThemeMenu(false);
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!themeOptions.hidden) {
        setThemeMenu(false);
        themeToggle.focus();
    } else if (nav.classList.contains('active')) {
        setNav(false);
        navToggle.focus();
    }
});

mobileNav.addEventListener('change', () => setNav(false));

document.addEventListener('languagechange-site', () => {
    navToggle.setAttribute('aria-label', t(nav.classList.contains('active') ? 'nav.close' : 'nav.open'));
    themeToggle.setAttribute('aria-label', t('theme.label'));
});

// ===========================
// Smooth Scroll
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');

        // Logo (href="#") : retour en haut de page
        if (href === '#') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const target = document.querySelector(href);

        if (target) {
            scrollToElement(target);
            // Lien « Aller au contenu » : le focus clavier suit le défilement
            target.focus({ preventScroll: true });
        }
    });
});

// L'en-tête est fixe : on s'arrête juste dessous
function scrollToElement(el) {
    window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - header.offsetHeight,
        behavior: 'smooth'
    });
}

// ===========================
// Apparitions au défilement
// La classe .reveal est posée ici : sans JavaScript, rien n'est masqué.
// ===========================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
    });
    // Seuil nul : un bloc plus haut que l'écran (la liste dépliée) n'atteindrait jamais 10 % de visibilité
}, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

function initScrollAnimations() {
    // La mosaïque des applications a sa propre entrée (motion.js)
    document.querySelectorAll('.section__head, .section__body > :not(.bento)').forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });
}

// ===========================
// Active Navigation Link
// ===========================
// Une bande fine au milieu de l'écran : la dernière section (ordre du document) qui la
// traverse est la section courante. Une section sans entrée de menu n'en allume aucune.
const navTargets = Array.from(document.querySelectorAll('section[id]'));
const inBand = new Set();

function setActiveNavLink(id) {
    navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'true');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

const activeSectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            inBand.add(entry.target);
        } else {
            inBand.delete(entry.target);
        }
    });
    const current = navTargets.filter(el => inBand.has(el)).pop();
    if (current) setActiveNavLink(current.id);
}, { rootMargin: '-45% 0px -50% 0px' });

navTargets.forEach(el => activeSectionObserver.observe(el));

// ===========================
// Initialize
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    applyTheme();

    // Current year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Initialize scroll animations
    initScrollAnimations();
});

// ===========================
// Publications : sélection + filtres
// ===========================
function initPublications() {
    const list = document.getElementById('publicationsList');
    const toggle = document.getElementById('pubToggle');
    const filters = document.getElementById('pubFilters');
    const heading = document.getElementById('pubHeading');
    const empty = document.getElementById('pubEmpty');
    if (!list || !toggle || !filters) return;

    const cards = Array.from(list.querySelectorAll('.pub'));
    const state = { theme: 'all', position: 'all', expanded: false };
    filters.querySelectorAll('.pub-chip').forEach(chip => {
        chip.setAttribute('aria-pressed', String(chip.classList.contains('is-active')));
    });

    function applyFilters() {
        let visible = 0;
        let previousYear = null;
        cards.forEach(card => {
            const themes = (card.dataset.themes || '').split(' ');
            const matchTheme = state.theme === 'all' || themes.includes(state.theme);
            const matchPosition = state.position === 'all' || card.dataset.position === state.position;
            const kept = !state.expanded || (matchTheme && matchPosition);
            card.classList.toggle('is-filtered-out', !kept);

            const shown = kept && (state.expanded || Boolean(card.dataset.featured));
            if (!shown) return;
            visible++;
            // L'année n'est écrite qu'une fois par groupe de lignes affichées
            const year = card.querySelector('.pub__year').textContent;
            card.classList.toggle('is-repeat-year', year === previousYear);
            previousYear = year;
        });
        empty.hidden = visible > 0;
    }

    function render() {
        list.classList.toggle('is-featured-only', !state.expanded);
        filters.hidden = !state.expanded;
        heading.textContent = t(state.expanded ? 'pub.all' : 'pub.selected');
        toggle.textContent = state.expanded
            ? t('pub.showSelection')
            : t('pub.showAll').replace('{n}', cards.length);
        applyFilters();
    }

    filters.querySelectorAll('.pub-filters__group').forEach(group => {
        group.addEventListener('click', (e) => {
            const chip = e.target.closest('.pub-chip');
            if (!chip) return;
            group.querySelectorAll('.pub-chip').forEach(c => {
                c.classList.toggle('is-active', c === chip);
                c.setAttribute('aria-pressed', String(c === chip));
            });
            state[group.dataset.filter] = chip.dataset.value;
            applyFilters();
        });
    });

    toggle.addEventListener('click', () => {
        state.expanded = !state.expanded;
        render();
        if (!state.expanded) scrollToElement(document.getElementById('publications'));
    });

    toggle.hidden = false;
    document.addEventListener('languagechange-site', render);
    render();
}

// ===========================
// Conférences : une date passée quitte « À venir » pour la tête des conférences passées
// ===========================
function initTalks() {
    const upcomingLabel = document.getElementById('talksUpcomingLabel');
    const pastLabel = document.getElementById('talksPastLabel');
    if (!upcomingLabel || !pastLabel) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    Array.from(document.querySelectorAll('.row[data-date]'))
        .filter(row => new Date(`${row.dataset.date}T23:59:59`) < today)
        // De la plus ancienne à la plus récente : chacune passe en tête, la plus récente finit première
        .sort((a, b) => a.dataset.date.localeCompare(b.dataset.date))
        .forEach(row => {
            row.classList.remove('row--next');
            pastLabel.after(row);
        });
    upcomingLabel.hidden = !document.querySelector('.row--next');
}

// ===========================
// Contact : copier l'adresse
// ===========================
function initCopyEmail() {
    const button = document.getElementById('copyEmail');
    const label = document.getElementById('copyEmailLabel');
    const address = document.getElementById('contactAddress');
    if (!button || !label || !address || !navigator.clipboard) return;

    let timer;
    const showIdle = () => { label.textContent = t('copy.idle'); };

    button.addEventListener('click', () => {
        navigator.clipboard.writeText(address.textContent.trim()).then(() => {
            label.textContent = t('copy.done');
            clearTimeout(timer);
            timer = setTimeout(showIdle, 2000);
        }).catch(() => { /* presse-papiers refusé : l'adresse reste un lien, que l'on peut sélectionner */ });
    });

    document.addEventListener('languagechange-site', () => {
        clearTimeout(timer);
        showIdle();
    });
    showIdle();
    button.hidden = false;
}

document.addEventListener('DOMContentLoaded', () => {
    initPublications();
    initTalks();
    initCopyEmail();
});
