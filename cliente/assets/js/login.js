// ============================================================
// Login — envío por fetch + manejo uniforme de errores
// ============================================================

const AUTH_TIMEOUT_MS = 10000;

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (loginForm) {
        loginForm.addEventListener('submit', onLoginSubmit);
    }
    emailInput?.addEventListener('input', () => validarCampoEmail(emailInput));
    passwordInput?.addEventListener('input', () => validarCampoRequerido(passwordInput, 'La contraseña es obligatoria.'));
});

async function onLoginSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const emailValido = validarCampoEmail(document.getElementById('email'));
    const passwordValida = validarCampoRequerido(document.getElementById('password'), 'La contraseña es obligatoria.');
    if (!email || !password || !emailValido || !passwordValida) {
        mostrarAlerta('Por favor, rellena todos los campos.', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn ? submitBtn.textContent : '';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Validando...';
    }

    try {
        const respuesta = await fetchConTimeout(form.action, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'same-origin',
        });

        const data = await parseJsonSeguro(respuesta);
        const msg = data.message || 'No se recibió un mensaje del servidor.';

        if (!respuesta.ok || !data.ok) {
            mostrarAlerta(msg, 'error');
            return;
        }

        mostrarAlerta(msg, 'success');

        if (data.redirect) {
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 450);
        }
    } catch (error) {
        mostrarAlerta(mensajeErrorComun(error), 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = textoOriginal;
        }
    }
}

async function fetchConTimeout(url, options, timeoutMs = AUTH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

async function parseJsonSeguro(response) {
    try {
        return await response.json();
    } catch (_) {
        throw new Error('Respuesta inválida del servidor.');
    }
}

function mensajeErrorComun(error) {
    if (error.name === 'AbortError') {
        return 'La solicitud tardó demasiado. Inténtalo de nuevo.';
    }

    if (error.message === 'Failed to fetch') {
        return 'No se pudo conectar con el servidor. Revisa tu conexión.';
    }

    return error.message || 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

function mostrarAlerta(texto, tipo) {
    const div = document.getElementById('mensajeError');
    if (!div) return;
    div.style.display = 'block';
    div.textContent = texto;
    div.style.background = tipo === 'error' ? 'rgba(255,50,50,0.15)' : 'rgba(50,200,50,0.15)';
    div.style.color = tipo === 'error' ? '#ff8080' : '#80ff80';
    div.style.borderColor = tipo === 'error' ? 'rgba(255,50,50,0.3)' : 'rgba(50,200,50,0.3)';
}

function actualizarErrorCampo(input, mensaje) {
    if (!input) return false;
    const errorEl = document.getElementById(`error-${input.id}`);
    const tieneError = Boolean(mensaje);
    input.setAttribute('aria-invalid', tieneError ? 'true' : 'false');
    if (errorEl) errorEl.textContent = mensaje || '';
    return !tieneError;
}

function validarCampoEmail(input) {
    if (!input) return false;
    const valor = input.value.trim();
    if (!valor) return actualizarErrorCampo(input, 'El correo electrónico es obligatorio.');
    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    return actualizarErrorCampo(input, valido ? '' : 'Introduce un correo con formato válido.');
}

function validarCampoRequerido(input, mensaje) {
    if (!input) return false;
    return actualizarErrorCampo(input, input.value.trim() ? '' : mensaje);
}
