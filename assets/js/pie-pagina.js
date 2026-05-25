// pie-pagina.js — Inyecta el footer y el header compartidos en todas las páginas

document.addEventListener('DOMContentLoaded', function () {

    // Inyectar el pie de página dinámicamente
    const footer = document.createElement('footer');
    footer.className = 'pie-pagina';
    footer.innerHTML = `
        <div class="logo-pie">
            <span style="color:var(--color1)">Midnight</span><span style="color:var(--color2)">Customs</span>
        </div>
        <div class="fondo-pie" style="text-align: center; width: 100%;">
            <p>© 2026 Midnight Customs. Proyecto académico — 2º DAW. Todos los derechos reservados.</p>
        </div>
    `;
    document.body.appendChild(footer);
});
