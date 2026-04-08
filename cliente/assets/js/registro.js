// ============================================================
// Registro — envío por fetch + manejo uniforme de errores
// ============================================================

const AUTH_TIMEOUT_MS = 10000;

document.addEventListener('DOMContentLoaded', function () {
    const registroForm = document.getElementById('registroForm');
    const nombre = document.getElementById('nombre');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirm = document.getElementById('confirm-password');

    if (registroForm) {
        registroForm.addEventListener('submit', onRegistroSubmit);
    }
    nombre?.addEventListener('input', () => validarRequerido(nombre, 'El nombre es obligatorio.'));
    email?.addEventListener('input', () => validarEmail(email));
    password?.addEventListener('input', () => validarPassword(password));
    confirm?.addEventListener('input', () => validarConfirmPassword(password, confirm));
});

async function onRegistroSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    const nombreOk = validarRequerido(document.getElementById('nombre'), 'El nombre es obligatorio.');
    const emailOk = validarEmail(document.getElementById('email'));
    const passOk = validarPassword(document.getElementById('password'));
    const confirmOk = validarConfirmPassword(document.getElementById('password'), document.getElementById('confirm-password'));

    if (!nombreOk || !emailOk || !passOk || !confirmOk) {
        mostrarAlerta('Revisa los campos marcados antes de enviar.', 'error');
        return;
    }

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
    const div = document.getElementById('mensajeError');
    if (!div) return;
    div.style.display = 'block';
    div.textContent = texto;
    div.style.background = tipo === 'error' ? 'rgba(255,50,50,0.15)' : 'rgba(50,200,50,0.15)';
    div.style.color = tipo === 'error' ? '#ff8080' : '#80ff80';
    div.style.borderColor = tipo === 'error' ? 'rgba(255,50,50,0.3)' : 'rgba(50,200,50,0.3)';
}

function setError(input, mensaje) {
    if (!input) return false;
    const errorEl = document.getElementById(`error-${input.id}`);
    const error = Boolean(mensaje);
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    if (errorEl) errorEl.textContent = mensaje || '';
    return !error;
}

function validarRequerido(input, mensaje) {
    return setError(input, input?.value.trim() ? '' : mensaje);
}

function validarEmail(input) {
    if (!input) return false;
    const valor = input.value.trim();
    if (!valor) return setError(input, 'El correo electrónico es obligatorio.');
    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    return setError(input, valido ? '' : 'Introduce un correo con formato válido.');
}

function validarPassword(input) {
    if (!input) return false;
    const valor = input.value;
    if (!valor) return setError(input, 'La contraseña es obligatoria.');
    return setError(input, valor.length >= 6 ? '' : 'Debe tener al menos 6 caracteres.');
}

function validarConfirmPassword(passwordInput, confirmInput) {
    if (!confirmInput) return false;
    if (!confirmInput.value) return setError(confirmInput, 'Debes confirmar la contraseña.');
    return setError(confirmInput, confirmInput.value === passwordInput?.value ? '' : 'Las contraseñas no coinciden.');
}
