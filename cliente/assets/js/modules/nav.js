export function initNav() {
    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
    const enlacesNav = document.querySelectorAll('.navegacion-principal a');

    enlacesNav.forEach((enlace) => {
        const href = enlace.getAttribute('href');
        const esPaginaActual = href === paginaActual;

        enlace.classList.toggle('activo', esPaginaActual);

        if (esPaginaActual) {
            enlace.setAttribute('aria-current', 'page');
            return;
        }

        enlace.removeAttribute('aria-current');
    });

    const botonMenu = document.querySelector('.boton-menu');
    const nav = document.getElementById('navegacion-principal');

    if (!botonMenu || !nav) return;

    botonMenu.addEventListener('click', () => {
        nav.classList.toggle('activo');
        botonMenu.textContent = nav.classList.contains('activo') ? '✕' : '☰';
    });

    nav.querySelectorAll('a').forEach((enlace) => {
        enlace.addEventListener('click', () => {
            nav.classList.remove('activo');
            botonMenu.textContent = '☰';
        });
    });
}
