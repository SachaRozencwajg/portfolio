/**
 * Version anglaise du site (FR par défaut).
 * - data-i18n="clé"      : remplace le premier nœud texte de l'élément (icônes SVG conservées)
 * - data-i18n-html="clé" : remplace tout le contenu HTML de l'élément
 * - <time datetime>      : la date anglaise est calculée, pas besoin de clé
 * Le texte français d'origine est mémorisé au premier changement de langue.
 * Ajouter une traduction : ajouter l'attribut dans index.html et la clé dans I18N_EN.
 */
const I18N_EN = {
    // Navigation et réglages
    "t100": "Skip to content",
    "t140": "Applications",
    "t2": "Research",
    "t3": "Teaching",
    "t9": "Background",
    "t101": "System",
    "t102": "Light",
    "t103": "Dark",

    // Accroche
    "t7": "Anesthesiologist, intensivist and AI educator",
    "t8": "I build AI tools for those who care for patients and those who learn.",
    "t6": "See the applications",
    "t5": "Get in touch",
    "t141": "heart",
    "t142": "lungs",
    "t143": "model",
    "t144": "Clinical work",
    "t11": "Anesthesiologist",
    "t145": "IA2M course, AI applied to medicine",
    "t146": "AI in medicine, extracorporeal circulation",
    "t147": "PhD, Sorbonne Université",

    // Applications IA
    "t23": "AI applications",
    "t24": "Practical tools at the intersection of medicine and AI, built to solve real healthcare problems.",
    "t30": "Educational AI platform for the French national medical exams (EDN), grounded exclusively in the official curricula of the specialty colleges. 100% French hosting, deployed at Université Paris-Saclay and UVSQ.",
    "t148": "RAG · Sovereign AI · EDN",
    "t31": "Discover EDN-IA",
    "t34": "Digital logbook for medical training: procedures and autonomy levels, on-call shifts, senior sign-off and coordination dashboards.",
    "t149": "Residency training · Multi-specialty",
    "t35": "Discover CareLogbook",
    "t105": "Online game",
    "t26": "Serious Game: think like an LLM",
    "t27": "Interactive simulation to understand LLM hallucinations and biases in medicine.",
    "t150": "AI / LLM · Medical education",
    "t28": "Try it online",
    "t110": "Online calculator",
    "t111": "Lung-protective ventilation calculator for ARDS: tidal volume, driving pressure, mechanical power and oxygenation. An open-source educational tool, described in a published article (ACCPM, 2026). No data leaves the browser.",
    "t151": "ARDS · Ventilation · Open source",
    "t113": "Open the calculator",

    // Recherche et publications
    "t67": "Peer-reviewed publications in anaesthesia, critical care and artificial intelligence.",
    "t38": "Artificial intelligence in medicine",
    "t39": "Development and evaluation of AI tools for clinical decision support, perioperative care and medical data analysis, in particular large language models (LLMs) and their applications in healthcare.",
    "t42": "Extracorporeal circulation",
    "t43": "Research on ECMO (extracorporeal membrane oxygenation) and extracorporeal circulation techniques in critical care.",
    "t68": "All",
    "t152": "AI",
    "t153": "ECMO / CPB",
    "t69": "Medical education",
    "t70": "All positions",
    "t71": "First author",
    "t72": "Last author",
    "t74": "No publication matches these filters.",
    "t75": "See on PubMed",

    // Enseignement et conférences
    "t47": "Sharing knowledge about AI in medicine with healthcare professionals and students.",
    "t48": "IA2M course, Université Paris-Saclay",
    "t49": "“Artificial Intelligence Applied to Medicine” course. First edition: <strong>8.2/10</strong> satisfaction, unanimously recommended by students.",
    "t50": "See the course syllabus",
    "t54": "Thesis supervision",
    "t55": "Supervision of MD and master's theses on AI applications in anaesthesia and critical care.",
    "t56": "Suggest a topic",
    "t57": "Talks and lectures",
    "t154": "Upcoming",
    "t155": "Past",
    "t156": "Recurring courses",
    "t157": "since 2024",
    "t108": "Research in medical education in the age of artificial intelligence",
    "t109": "French national conference on medical education and research · Lille",
    "t106": "AI for beginners",
    "t107": "Necker Hospital · AP-HP",
    "t58": "AI in healthcare simulation",
    "t59": "Medical ethics and AI",
    "t60": "Medical Ethics Symposium · Université Paris Cité",
    "t61": "Impact of AI on perioperative medicine",
    "t62": "Generative AI for nurse anaesthetists",
    "t63": "Nurse Anaesthetist School, Lyon",
    "t64": "Critical appraisal of an AI paper",
    "t65": "Anaesthesia &amp; Critical Care residency (DESAR) · Paris",

    // Opinions
    "t158": "Opinions",
    "t78": "Perspectives on the growing role of artificial intelligence in patient care and clinical practice.",
    "t81": "Declaring the use (or non-use) of AI in peer review: a relic of the past?",
    "t82": "Editorial (with D. Benhamou) on transparency in the use of generative AI in peer review. <em>Anaesth Crit Care Pain Med</em>.",
    "t83": "Read the editorial",
    "t84": "AI in my academic medical practice",
    "t85": "A practical (and subjective) guide to generative AI in clinical care, teaching and research: regulatory framework, local LLMs and the tools I use every day (in French).",
    "t86": "Read the guide",
    "t87": "Generative AI and peer review: preserve judgment, restore trust",
    "t88": "Editorial (with D. Benhamou) on the role of generative AI in the evaluation of scientific manuscripts. <em>Anaesth Crit Care Pain Med</em>.",

    // Parcours
    "t12": "Clinical fellow and consultant",
    "t13": "Bichat–Claude Bernard University Hospital, <span class=\"nowrap\">AP-HP</span>",
    "t159": "Academic",
    "t15": "Research supervision accreditation (ADR, ongoing)",
    "t16": "AI-driven digital twin for the active rehabilitation of thoracic grafts under ex vivo perfusion",
    "t17": "PhD, Doctoral School ED394",
    "t18": "Interaction between veno-arterial ECMO and the brain: the case of differential hypoxaemia",
    "t19": "MSc, B2PRS",
    "t20": "Impact of ventilator settings on alveolar inflammation under VV-ECMO in severe ARDS",
    "t21": "Entrepreneurship",
    "t22": "Co-founder",

    // Contact et pied de page
    "t90": "Consulting, a collaboration, or simply a conversation about AI in medicine: write to me.",
    "t160": "Consulting and training",
    "t161": "AI applied to medicine, for a team, a department or a faculty.",
    "t163": "Collaborations in medical AI and extracorporeal circulation.",
    "t164": "Thesis or dissertation",
    "t165": "Suggest a topic on AI in anaesthesia and critical care.",
    "t96": "© <span id=\"year\">2026</span> Sacha Rozencwajg",
    "t104": "Legal notice and privacy"
};

// Chaînes générées par le JavaScript
const I18N_UI = {
    fr: {
        'pub.selected': 'Publications choisies',
        'pub.all': 'Toutes les publications',
        'pub.showAll': 'Afficher les {n} publications',
        'pub.showSelection': 'Revenir à la sélection',
        'copy.idle': 'Copier',
        'copy.done': 'Copié',
        'lang.toggle': 'EN',
        'lang.label': 'Switch to English',
        'nav.open': 'Ouvrir le menu',
        'nav.close': 'Fermer le menu',
        'theme.label': 'Thème',
        'meta.title': 'Sacha Rozencwajg | Médecin & Enseignant en IA',
        'meta.description': "Anesthésiste-réanimateur et enseignant en IA à l'Université Paris-Saclay : recherche sur l'ECMO, publications, cours et applications d'IA pour la formation médicale."
    },
    en: {
        'pub.selected': 'Selected publications',
        'pub.all': 'All publications',
        'pub.showAll': 'Show all {n} publications',
        'pub.showSelection': 'Back to selection',
        'copy.idle': 'Copy',
        'copy.done': 'Copied',
        'lang.toggle': 'FR',
        'lang.label': 'Passer en français',
        'nav.open': 'Open menu',
        'nav.close': 'Close menu',
        'theme.label': 'Theme',
        'meta.title': 'Sacha Rozencwajg | Physician & AI Educator',
        'meta.description': 'Anaesthesiologist, intensivist and AI educator at Université Paris-Saclay: ECMO research, publications, teaching and AI tools for medical training.'
    }
};

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Date d'un élément <time> : « 2026-12-10 » → « 10 Dec 2026 », « 2026-09 » → « Sep 2026 », « 2026 » tel quel
function formatDateEn(iso) {
    const [year, month, day] = iso.split('-');
    if (!month) return year;
    const label = `${MONTHS_EN[Number(month) - 1]} ${year}`;
    return day ? `${Number(day)} ${label}` : label;
}

let currentLang = 'fr';

function t(key) {
    return (I18N_UI[currentLang] && I18N_UI[currentLang][key]) || I18N_UI.fr[key] || key;
}

function firstTextNode(el) {
    return Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
}

function applyLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'fr';
    document.documentElement.lang = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const node = firstTextNode(el);
        if (!node) return;
        if (el.dataset.i18nFr === undefined) el.dataset.i18nFr = node.textContent;
        const value = currentLang === 'en' ? I18N_EN[el.dataset.i18n] : el.dataset.i18nFr;
        if (value !== undefined) {
            // conserve les espaces autour du texte d'origine
            const original = el.dataset.i18nFr;
            const lead = original.match(/^\s*/)[0];
            const trail = original.match(/\s*$/)[0];
            const tmp = document.createElement('textarea');
            tmp.innerHTML = value;
            node.textContent = lead + tmp.value + trail;
        }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        if (el.dataset.i18nFrHtml === undefined) el.dataset.i18nFrHtml = el.innerHTML;
        const value = currentLang === 'en' ? I18N_EN[el.dataset.i18nHtml] : el.dataset.i18nFrHtml;
        if (value !== undefined) el.innerHTML = value;
    });

    // Dates : le français est écrit dans la page, l'anglais se déduit de l'attribut datetime
    document.querySelectorAll('time[datetime]').forEach(el => {
        if (el.dataset.i18nFr === undefined) el.dataset.i18nFr = el.textContent;
        el.textContent = currentLang === 'en' ? formatDateEn(el.getAttribute('datetime')) : el.dataset.i18nFr;
    });

    document.title = t('meta.title');
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.description'));

    const toggle = document.getElementById('langToggle');
    if (toggle) {
        toggle.textContent = t('lang.toggle');
        toggle.setAttribute('aria-label', t('lang.label'));
    }

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    try { localStorage.setItem('lang', currentLang); } catch (e) { /* stockage indisponible */ }
    document.dispatchEvent(new Event('languagechange-site'));
}

function initLanguage() {
    let lang = new URLSearchParams(window.location.search).get('lang');
    if (!lang) {
        try { lang = localStorage.getItem('lang'); } catch (e) { lang = null; }
    }
    const toggle = document.getElementById('langToggle');
    if (toggle) {
        toggle.addEventListener('click', () => applyLanguage(currentLang === 'en' ? 'fr' : 'en'));
    }
    applyLanguage(lang === 'en' ? 'en' : 'fr');
}

document.addEventListener('DOMContentLoaded', initLanguage);
