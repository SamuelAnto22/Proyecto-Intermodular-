// ============================================================
// Registro — envío por fetch + manejo uniforme de errores
// ============================================================

const AUTH_TIMEOUT_MS = 10000;

document.addEventListener('DOMContentLoaded', function () {
    const registroForm = document.getElementById('registroForm');

    if (registroForm) {
        registroForm.addEventListener('submit', onRegistroSubmit);
    }
});

async function onRegistroSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password.length < 6) {
        mostrarAlerta('La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        mostrarAlerta('Las contraseñas no coinciden.', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn ? submitBtn.textContent : '';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando cuenta...';
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
            }, 700);
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
    const loginBox = document.querySelector('.caja-auth');
    if (!loginBox) return;

    const existente = loginBox.querySelector('.alerta-msg');
    if (existente) existente.remove();

    const div = document.createElement('div');
    div.className = 'alerta-msg';
    div.textContent = texto;
    div.style.cssText = `
        padding: 0.8rem 1rem;
        border-radius: 10px;
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
        text-align: center;
        ${tipo === 'error'
            ? 'background: rgba(255,50,50,0.15); color: #ff4444; border: 1px solid rgba(255,50,50,0.3);'
            : 'background: rgba(50,200,50,0.15); color: #33cc33; border: 1px solid rgba(50,200,50,0.3);'
        }
    `;

    loginBox.insertBefore(div, loginBox.querySelector('form'));
}
