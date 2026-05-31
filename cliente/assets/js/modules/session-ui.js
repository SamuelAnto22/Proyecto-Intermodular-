function createNavItem({ href, id, text, title, className, style }) {
    const li = document.createElement('li');
    const link = document.createElement('a');

    link.href = href;
    if (id) link.id = id;
    if (title) link.title = title;
    if (className) link.className = className;
    if (style) link.style.cssText = style;

    link.textContent = text;
    li.appendChild(link);

    return li;
}

function getLoginNavItem() {
    const selectorConHas = 'li:has(a[href="login.html"])';
    try {
        const loginLi = document.querySelector(selectorConHas);
        if (loginLi) return loginLi;
    } catch (_) {
        // Fallback para navegadores sin soporte de :has()
    }

    const loginLink = document.querySelector('a[href="login.html"]');
    return loginLink ? loginLink.closest('li') : null;
}

function hideConfiguratorAccessForAdmin() {
    const seccionConfigCTA = document.getElementById('seccion-cta-configurador');
    if (seccionConfigCTA) {
        seccionConfigCTA.style.display = 'none';
    }

    const configLinks = document.querySelectorAll('a[href="configurador.html"]');
    configLinks.forEach((link) => {
        if (link.parentElement?.tagName === 'LI') {
            link.parentElement.style.display = 'none';
            return;
        }

        link.style.display = 'none';
    });
}

function renderLoggedSession(liLogin, sessionData, basePath) {
    if (!liLogin) return;

    if (sessionData.rol === 'admin') {
        hideConfiguratorAccessForAdmin();

        const liAdmin = createNavItem({
            href: 'admin.html',
            text: '⚙️ Panel Admin',
            className: 'boton-neon boton-neon-nav',
            style: 'border-color:var(--color2); color:var(--color2); box-shadow: 0 0 10px rgba(80,200,255,0.4)'
        });

        liLogin.parentNode?.insertBefore(liAdmin, liLogin);
    }

    const liPerfil = createNavItem({
        href: 'perfil.html',
        id: 'nav-perfil-link',
        title: 'Ver mi perfil',
        text: `👤 ${sessionData.nombre}`
    });

    const liLogout = createNavItem({
        href: `${basePath}/logout.php`,
        id: 'nav-logout-link',
        title: 'Cerrar sesión',
        className: 'nav-logout',
        text: 'Cerrar sesión'
    });

    liLogin.replaceWith(liPerfil, liLogout);
}

function restoreGuestSession(liLogin) {
    if (!liLogin) return;

    const link = liLogin.querySelector('a');
    if (!link) return;

    link.textContent = 'Login';
    link.removeAttribute('style');
}

export async function initSessionUI() {
    const basePath = window.API_BASE;
    if (!basePath) return null;

    const liLogin = getLoginNavItem();
    if (!liLogin && !document.querySelector('#nav-logout-link')) return basePath;

    try {
        const response = await fetch(`${basePath}/sesion.php`);
        const data = await response.json();

        if (data.csrf) {
            window.__CSRF_TOKEN__ = data.csrf;
        }

        if (data.ok && data.logueado) {
            renderLoggedSession(liLogin, data, basePath);
        } else {
            restoreGuestSession(liLogin);
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
    }

    return basePath;
}

export function initLogout(basePath) {
    if (!basePath) return;

    document.body.addEventListener('click', (event) => {
        const logoutLink = event.target.closest('#nav-logout-link');
        if (!logoutLink) return;

        event.preventDefault();
        event.stopPropagation();

        fetch(`${basePath}/logout.php`, {
            method: 'POST',
            headers: {
                'X-CSRF-Token': window.__CSRF_TOKEN__ || ''
            }
        })
            .finally(() => {
                window.location.href = 'index.html';
            });
    });
}