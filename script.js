/**
 * Sacha Rozencwajg - Personal Website
 * Apple-inspired design with light/dark mode
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
// ===========================
function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
    return localStorage.getItem('theme');
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeToggle(theme);
}

function updateThemeToggle(theme) {
    const sunIcon = document.querySelector('.theme-toggle__sun');
    const moonIcon = document.querySelector('.theme-toggle__moon');

    if (theme === 'dark') {
        document.documentElement.style.setProperty('--theme-icon-sun', '0');
        document.documentElement.style.setProperty('--theme-icon-moon', '1');
    } else {
        document.documentElement.style.setProperty('--theme-icon-sun', '1');
        document.documentElement.style.setProperty('--theme-icon-moon', '0');
    }
}

function initTheme() {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
        setTheme(storedTheme);
    } else {
        // Use system preference
        const systemTheme = getSystemTheme();
        setTheme(systemTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || getSystemTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getStoredTheme()) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// ===========================
// Mobile Navigation Toggle
// ===========================
function toggleNav() {
    nav.classList.toggle('active');

    // Update ARIA attributes
    const isOpen = nav.classList.contains('active');
    navToggle.setAttribute('aria-expanded', isOpen);
}

navToggle.addEventListener('click', toggleNav);
themeToggle.addEventListener('click', toggleTheme);

// Close nav when clicking a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
    });
});

// Close nav when clicking outside
document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
        nav.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
    }
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
    initTheme();

    // Current year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Initialize scroll animations
    initScrollAnimations();

    // Trigger initial animations for visible elements
    setTimeout(() => {
        document.querySelectorAll('.hero__grid').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }, 100);
});

// Console greeting for fellow developers
console.log('%c👋 Hello, fellow developer!', 'font-size: 16px; font-weight: bold; color: #0071e3;');
console.log('%cInterested in AI & Medicine? Let\'s connect!', 'font-size: 12px; color: #86868b;');

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
