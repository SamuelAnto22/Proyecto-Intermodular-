// ============================================================
// Módulo de utilidades compartidas (garaje, admin, perfil)
// ============================================================

/**
 * Formatea una fecha ISO a formato legible en español.
 */
export function formatFecha(fechaStr) {
    if (!fechaStr) return '—';
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Capitaliza la primera letra de un string.
 */
export function capitalizarPrimera(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Escapa HTML para prevenir XSS al insertar texto en el DOM.
 */
export function escaparHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}