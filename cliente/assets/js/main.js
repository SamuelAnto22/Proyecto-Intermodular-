import { initLoader } from './modules/loader.js';
import { initNav } from './modules/nav.js';
import { initSessionUI, initLogout } from './modules/session-ui.js';
import { initScrollEffects } from './modules/scroll-effects.js';

function shouldInitSessionUI() {
    return Boolean(
        document.querySelector('a[href="login.html"]') ||
        document.querySelector('#nav-logout-link')
    );
}

async function initPage() {
    initNav();
    initLoader();
    initScrollEffects();

    if (!shouldInitSessionUI()) return;

    // La UI de sesión (incluyendo nombre de usuario en navbar) se construye
    // con nodos DOM + textContent en modules/session-ui.js para evitar XSS.
    const basePath = await initSessionUI();
    initLogout(basePath);
}

document.addEventListener('DOMContentLoaded', initPage);
