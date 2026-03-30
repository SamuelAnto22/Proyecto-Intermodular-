// pie-pagina.js — Inyecta el footer y el header compartidos en todas las páginas

document.addEventListener('DOMContentLoaded', function () {

    // Inyectar el pie de página dinámicamente
    const footer = document.createElement('footer');
    footer.className = 'pie-pagina';
    footer.innerHTML = `
        <div class="logo-pie">
            <span style="color:var(--color1)">Midnight</span><span style="color:var(--color2)">Customs</span>
        </div>
        <nav class="nav-pie" aria-label="Navegación del pie">
            <ul>
                <li><a href="index.html">Inicio</a></li>
                <li><a href="servicios.html">Servicios</a></li>
                <li><a href="proyectos.html">Proyectos</a></li>
                <li><a href="nosotros.html">Nosotros</a></li>
                <li><a href="contacto.html">Contacto</a></li>
                <li><a href="configurador.html">Configurador</a></li>
            </ul>
        </nav>
        <div class="fondo-pie">
            <p>© 2026 Midnight Customs. Proyecto académico — 2º DAW. Todos los derechos reservados.</p>
        </div>
    `;
    document.body.appendChild(footer);
});
