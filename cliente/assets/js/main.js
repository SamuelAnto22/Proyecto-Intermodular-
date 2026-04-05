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

    // --- Scrollytelling IntersectionObserver ---
    const scrollySections = document.querySelectorAll('.seccion-scroll');
    if (scrollySections.length > 0) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Opcional: si solo queremos animar una vez
                    // observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1, // Se activa cuando un 10% del bloque es visible
            rootMargin: '0px 0px -50px 0px'
        });

        scrollySections.forEach(section => {
            observer.observe(section);
        });
    }

    // --- Comprobar sesión para transformar el menú "Login" en dos botones separados ---
    const basePath = '/Proyecto-Intermodular-/servidor/api';

    fetch(`${basePath}/sesion.php`)
        .then(response => response.json())
        .then(data => {
            if (data.csrf) {
                window.__CSRF_TOKEN__ = data.csrf;
            }

            // El <li> que contiene el enlace login.html
            const liLogin = document.querySelector('li:has(a[href="login.html"])') ||
                (() => {
                    const a = document.querySelector('a[href="login.html"]');
                    return a ? a.closest('li') : null;
                })();

            if (data.ok && data.logueado) {

                // --- Lógica según ROL (Admin vs Cliente) ---
                if (data.rol === 'admin') {
                    // Ocultar sección CTA de Configurador abajo en el index
                    const seccionConfigCTA = document.getElementById('seccion-cta-configurador');
                    if (seccionConfigCTA) {
                        seccionConfigCTA.style.display = 'none';
                    }

                    // Ocultar todos los enlaces al Configurador
                    const configLinks = document.querySelectorAll('a[href="configurador.html"]');
                    configLinks.forEach(link => {
                        if (link.parentElement && link.parentElement.tagName === 'LI') {
                            link.parentElement.style.display = 'none';
                        } else {
                            link.style.display = 'none';
                        }
                    });

                    // Insertar Panel Admin antes de su perfil
                    if (liLogin) {
                        const liAdmin = document.createElement('li');
                        liAdmin.innerHTML = '<a href="admin.html" class="boton-neon boton-neon-nav" style="border-color:var(--color2); color:var(--color2); box-shadow: 0 0 10px rgba(80,200,255,0.4)">⚙️ Panel Admin</a>';
                        liLogin.parentNode.insertBefore(liAdmin, liLogin);
                    }
                } else {
                    // Si es Cliente asegurar que 'Mi Garaje' aparezca si no estaba hardcodeado
                    const garageLinkExiste = document.querySelector('a[href="garaje.html"]');
                    if (!garageLinkExiste && liLogin) {
                        const liGaraje = document.createElement('li');
                        liGaraje.innerHTML = '<a href="garaje.html">Mi Garaje</a>';
                        liLogin.parentNode.insertBefore(liGaraje, liLogin);
                    }
                }

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

    document.addEventListener('click', (e) => {
        const a = e.target.closest('#nav-logout-link');
        if (!a) return;
        e.preventDefault();
        fetch(`${basePath}/logout.php`, {
            method: 'POST',
            headers: { 'X-CSRF-Token': window.__CSRF_TOKEN__ || '' }
        }).then(() => window.location.href = 'index.html');
    });

});

