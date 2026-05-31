// ============================================================
// Registro — envío por fetch + manejo uniforme de errores
// ============================================================

import {
    fetchConTimeout,
    parseJsonSeguro,
    mensajeErrorComun,
    mostrarAlerta,
    setFieldError,
    validarEmail,
    validarRequerido,
} from './modules/auth-helpers.js';

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

    if (password.length < 8 || password.length > 72) {
        mostrarAlerta('La contraseña debe tener entre 8 y 72 caracteres.', 'error');
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

function validarPassword(input) {
    if (!input) return false;
    const valor = input.value;
    if (!valor) return setFieldError(input, 'La contraseña es obligatoria.');
    if (valor.length < 8 || valor.length > 72) {
        return setFieldError(input, 'Debe tener entre 8 y 72 caracteres.');
    }
    return setFieldError(input, '');
}

function validarConfirmPassword(passwordInput, confirmInput) {
    if (!confirmInput) return false;
    if (!confirmInput.value) return setFieldError(confirmInput, 'Debes confirmar la contraseña.');
    return setFieldError(confirmInput, confirmInput.value === passwordInput?.value ? '' : 'Las contraseñas no coinciden.');
}