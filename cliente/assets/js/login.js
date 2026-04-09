// ============================================================
// Login — envío por fetch + manejo uniforme de errores
// ============================================================

import {
    fetchConTimeout,
    parseJsonSeguro,
    mensajeErrorComun,
    mostrarAlerta,
    validarEmail,
    validarRequerido,
} from './modules/auth-helpers.js';

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (loginForm) {
        loginForm.addEventListener('submit', onLoginSubmit);
    }
    emailInput?.addEventListener('input', () => validarEmail(emailInput));
    passwordInput?.addEventListener('input', () => validarRequerido(passwordInput, 'La contraseña es obligatoria.'));
});

async function onLoginSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const emailValido = validarEmail(document.getElementById('email'));
    const passwordValida = validarRequerido(document.getElementById('password'), 'La contraseña es obligatoria.');
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
