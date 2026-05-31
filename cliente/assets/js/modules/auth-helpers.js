// ============================================================
// Módulo compartido de autenticación (login + registro)
// Funciones de fetch, validación y mensajería reutilizables
// ============================================================

export const AUTH_TIMEOUT_MS = 10000;

export async function fetchConTimeout(url, options, timeoutMs = AUTH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function parseJsonSeguro(response) {
    try {
        return await response.json();
    } catch (_) {
        throw new Error('Respuesta inválida del servidor.');
    }
}

export function mensajeErrorComun(error) {
    if (error.name === 'AbortError') {
        return 'La solicitud tardó demasiado. Inténtalo de nuevo.';
    }

    if (error.message === 'Failed to fetch') {
        return 'No se pudo conectar con el servidor. Revisa tu conexión.';
    }

    return error.message || 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

export function mostrarAlerta(texto, tipo) {
    const div = document.getElementById('mensajeError');
    if (!div) return;
    div.style.display = 'block';
    div.textContent = texto;
    div.style.background = tipo === 'error' ? 'rgba(255,50,50,0.15)' : 'rgba(50,200,50,0.15)';
    div.style.color = tipo === 'error' ? '#ff8080' : '#80ff80';
    div.style.borderColor = tipo === 'error' ? 'rgba(255,50,50,0.3)' : 'rgba(50,200,50,0.3)';
}

export function setFieldError(input, mensaje) {
    if (!input) return false;
    const errorEl = document.getElementById(`error-${input.id}`);
    const tieneError = Boolean(mensaje);
    input.setAttribute('aria-invalid', tieneError ? 'true' : 'false');
    if (errorEl) errorEl.textContent = mensaje || '';
    return !tieneError;
}

export function validarEmail(input) {
    if (!input) return false;
    const valor = input.value.trim();
    if (!valor) return setFieldError(input, 'El correo electrónico es obligatorio.');
    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    return setFieldError(input, valido ? '' : 'Introduce un correo con formato válido.');
}

export function validarRequerido(input, mensaje) {
    if (!input) return false;
    return setFieldError(input, input.value.trim() ? '' : mensaje);
}