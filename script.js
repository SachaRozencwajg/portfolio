/**
 * Sacha Rozencwajg - Personal Website
 * Thème clair/sombre (suit le système par défaut), navigation, apparitions au défilement
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
            const headerHeight = header.offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            // Lien « Aller au contenu » : le focus clavier suit le défilement
            target.focus({ preventScroll: true });
        }
    });
});

// ===========================
// Intersection Observer for Animations
// ===========================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            el.classList.add('is-visible');
            animateOnScroll.unobserve(el);
            // Le décalage ne sert qu'à l'apparition : sans ça, il retarderait aussi le survol
            if (el.style.transitionDelay) {
                setTimeout(() => { el.style.transitionDelay = ''; }, 1200);
            }
        }
    });
}, observerOptions);

// Observe all animatable elements
function initScrollAnimations() {
    const animatableElements = document.querySelectorAll(
        '.card, .project-card, .blog-card, .publication-card, .section__header, .card-grid, .publications-list'
    );

    animatableElements.forEach((el, index) => {
        // Add staggered delay for cards within grids
        if (el.classList.contains('card') ||
            el.classList.contains('project-card') ||
            el.classList.contains('publication-card')) {
            const parent = el.parentElement;
            const siblings = Array.from(parent.children);
            const childIndex = siblings.indexOf(el);
            // 80 ms entre cartes, plafonné pour que les longues listes ne traînent pas
            el.style.transitionDelay = `${Math.min(childIndex, 5) * 80}ms`;
        }
        animateOnScroll.observe(el);
    });
}

// ===========================
// Active Navigation Link
// ===========================
// Une bande fine au milieu de l'écran : la dernière zone (ordre du document) qui la
// traverse est la section courante. Remplace l'ancien écouteur de défilement.
const navTargets = Array.from(document.querySelectorAll('section[id], #talks'));
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
    const label = document.getElementById('pubSelectionLabel');
    const empty = document.getElementById('pubEmpty');
    if (!list || !toggle || !filters) return;

    const cards = Array.from(list.querySelectorAll('.publication-card'));
    const state = { theme: 'all', position: 'all', expanded: false };

    function applyFilters() {
        let visible = 0;
        cards.forEach(card => {
            const themes = (card.dataset.themes || '').split(' ');
            const matchTheme = state.theme === 'all' || themes.includes(state.theme);
            const matchPosition = state.position === 'all' || card.dataset.position === state.position;
            const show = !state.expanded || (matchTheme && matchPosition);
            card.classList.toggle('is-filtered-out', !show);
            if (show && (state.expanded || card.dataset.featured)) visible++;
        });
        empty.hidden = visible > 0;
    }

    function render() {
        list.classList.toggle('is-featured-only', !state.expanded);
        filters.hidden = !state.expanded;
        label.hidden = state.expanded;
        toggle.textContent = state.expanded
            ? t('pub.showSelection')
            : t('pub.showAll').replace('{n}', cards.length);
        applyFilters();
    }

    filters.querySelectorAll('.pub-filters__group').forEach(group => {
        group.addEventListener('click', (e) => {
            const chip = e.target.closest('.pub-chip');
            if (!chip) return;
            group.querySelectorAll('.pub-chip').forEach(c => c.classList.remove('is-active'));
            chip.classList.add('is-active');
            state[group.dataset.filter] = chip.dataset.value;
            applyFilters();
        });
    });

    toggle.addEventListener('click', () => {
        state.expanded = !state.expanded;
        render();
        if (!state.expanded) {
            document.getElementById('publications').scrollIntoView({ behavior: 'smooth' });
        }
    });

    toggle.hidden = false;
    document.addEventListener('languagechange-site', render);
    render();
}

document.addEventListener('DOMContentLoaded', initPublications);
