// pie-pagina.js — Inyecta el footer compartido en todas las páginas

document.addEventListener('DOMContentLoaded', function () {
    // Evitar duplicar footer si ya existe uno en el HTML
    if (document.querySelector('footer.pie-pagina')) return;

    // Inyectar el pie de página dinámicamente
    const footer = document.createElement('footer');
    footer.className = 'pie-pagina';
    footer.innerHTML = `
        <div class="logo-pie">
            <span class="logo-nombre">Midnight</span><span class="logo-apellido">Customs</span>
        </div>
        <div class="fondo-pie">
            <p>© 2026 Midnight Customs. Proyecto académico — 2º DAW. Todos los derechos reservados.</p>
        </div>
    `;
    document.body.appendChild(footer);
});