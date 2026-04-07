import { initLoader } from './modules/loader.js';
import { initNav } from './modules/nav.js';
import { initSessionUI, initLogout } from './modules/session-ui.js';
import { initScrollEffects } from './modules/scroll-effects.js';

const PAGES_WITH_SESSION_UI = new Set([
    'perfil.html',
    'garaje.html',
    'configurador.html',
    'admin.html'
]);

function getCurrentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
}

function shouldInitSessionUI(pageName) {
    return PAGES_WITH_SESSION_UI.has(pageName);
}

async function initPage() {
    initNav();
    initLoader();
    initScrollEffects();

    const pageName = getCurrentPage();
    if (!shouldInitSessionUI(pageName)) return;

    const basePath = await initSessionUI();
    initLogout(basePath);
}

document.addEventListener('DOMContentLoaded', initPage);
