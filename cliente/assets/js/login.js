// ============================================================
// Login — Validación + mostrar mensajes de la URL
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    mostrarMensajes();

    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                e.preventDefault();
                mostrarAlerta('Por favor, rellena todos los campos.', 'error');
            }
        });
    }
});

/**
 * Leer parámetros de la URL y mostrar mensajes.
 * El backend redirige con ?ok=... o ?error=...
 */
function mostrarMensajes() {
    const params = new URLSearchParams(window.location.search);
    const ok    = params.get('ok');
    const error = params.get('error');

    if (ok) {
        mostrarAlerta(ok, 'success');
    }
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

    // Evitar duplicados
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
