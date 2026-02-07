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
// Header Scroll Effect
// ===========================
let lastScroll = 0;

function handleScroll() {
    const currentScroll = window.scrollY;

    // Add scrolled class when page is scrolled
    if (currentScroll > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
}

window.addEventListener('scroll', handleScroll, { passive: true });

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
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            const headerHeight = header.offsetHeight;
            const targetPosition = target.offsetTop - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
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
            entry.target.classList.add('is-visible');
            animateOnScroll.unobserve(entry.target);
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
            el.style.transitionDelay = `${childIndex * 100}ms`;
        }
        animateOnScroll.observe(el);
    });
}

// ===========================
// Active Navigation Link
// ===========================
const sections = document.querySelectorAll('section[id]');

function updateActiveNavLink() {
    const scrollY = window.scrollY;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNavLink, { passive: true });

// ===========================
// Initialize
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initTheme();

    // Initialize scroll animations
    initScrollAnimations();

    // Initial scroll check
    handleScroll();
    updateActiveNavLink();

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
