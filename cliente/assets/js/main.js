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

    // --- Comprobar sesión para transformar el menú "Login" en dos botones separados ---
    const basePath = '/Proyecto-Intermodular-/servidor/api';

    fetch(`${basePath}/sesion.php`)
        .then(response => response.json())
        .then(data => {
            // El <li> que contiene el enlace login.html
            const liLogin = document.querySelector('li:has(a[href="login.html"])') ||
                            (() => {
                                const a = document.querySelector('a[href="login.html"]');
                                return a ? a.closest('li') : null;
                            })();

            if (data.ok && data.logueado) {
                if (liLogin) {
                    // --- Li 1: nombre del usuario → perfil ---
                    const liPerfil = document.createElement('li');
                    liPerfil.innerHTML = `<a href="perfil.html" id="nav-perfil-link" title="Ver mi perfil">👤 ${data.nombre}</a>`;

                    // --- Li 2: cerrar sesión ---
                    const liLogout = document.createElement('li');
                    liLogout.innerHTML = `<a href="${basePath}/logout.php" id="nav-logout-link" class="nav-logout" title="Cerrar sesión">Cerrar sesión</a>`;

                    // Reemplazar el li original por los dos nuevos
                    liLogin.replaceWith(liPerfil, liLogout);
                }
            } else {
                // No logueado → restaurar estado normal si se había transformado
                if (liLogin) {
                    const a = liLogin.querySelector('a');
                    if (a) {
                        a.textContent = 'Login';
                        a.removeAttribute('style');
                    }
                }
            }
        })
        .catch(error => console.error('Error verificando sesión:', error));

});
