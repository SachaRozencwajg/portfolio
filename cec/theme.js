/* Le thème choisi sur le site (menu Système / Clair / Sombre) s'applique aussi ici, avant le premier affichage. */
(function () {
    'use strict';
    try {
        var t = localStorage.getItem('theme');
        if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    } catch (e) { /* stockage indisponible : on suit le système */ }
})();
