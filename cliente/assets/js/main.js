// main.js — Lógica global compartida por todas las páginas

document.addEventListener('DOMContentLoaded', function () {

    // --- Marcar enlace activo en la navegación ---
    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
    const enlacesNav = document.querySelectorAll('.navegacion-principal a');

    enlacesNav.forEach(enlace => {
        const href = enlace.getAttribute('href');
        if (href === paginaActual) {
            enlace.classList.add('activo');
            enlace.setAttribute('aria-current', 'page');
        } else {
            enlace.classList.remove('activo');
            enlace.removeAttribute('aria-current');
        }
    });

    // --- Pantalla de carga ---
    const pantallaCarga = document.getElementById('loader');
    if (pantallaCarga) {
        setTimeout(() => {
            pantallaCarga.classList.add('desvaneciendo');
            setTimeout(() => {
                pantallaCarga.style.display = 'none';
            }, 800);
        }, 1200);
    }

    // --- Menú hamburguesa (responsive) ---
    const botonMenu = document.querySelector('.boton-menu');
    const nav = document.getElementById('navegacion-principal');

    if (botonMenu && nav) {
        botonMenu.addEventListener('click', () => {
            nav.classList.toggle('activo');
            botonMenu.textContent = nav.classList.contains('activo') ? '✕' : '☰';
        });

        // Cerrar el menú al clicar un enlace
        nav.querySelectorAll('a').forEach(enlace => {
            enlace.addEventListener('click', () => {
                nav.classList.remove('activo');
                botonMenu.textContent = '☰';
            });
        });
    }
});
