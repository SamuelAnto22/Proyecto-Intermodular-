// ============================================================
// Registro — Validación + mostrar mensajes de la URL
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    mostrarMensajes();

    const registroForm = document.getElementById('registroForm');

    if (registroForm) {
        registroForm.addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password.length < 6) {
                e.preventDefault();
                mostrarAlerta('La contraseña debe tener al menos 6 caracteres.', 'error');
                return;
            }

            if (password !== confirmPassword) {
                e.preventDefault();
                mostrarAlerta('Las contraseñas no coinciden.', 'error');
            }
        });
    }
});

/**
 * Leer parámetros de la URL y mostrar mensajes.
 */
function mostrarMensajes() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
        mostrarAlerta(error, 'error');
    }
}

/**
 * Insertar un mensaje visual encima del formulario.
 */
function mostrarAlerta(texto, tipo) {
    const loginBox = document.querySelector('.login-box');
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
        background: rgba(255,50,50,0.15);
        color: #ff4444;
        border: 1px solid rgba(255,50,50,0.3);
    `;

    loginBox.insertBefore(div, loginBox.querySelector('form'));
}
