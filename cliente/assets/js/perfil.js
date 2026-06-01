// ============================================================
// Perfil — Lógica de la página de perfil de usuario
// ============================================================
import { formatFecha, capitalizarPrimera } from './modules/utils.js';

const API = window.API_BASE;

document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil();

    document.getElementById('form-password').addEventListener('submit', function (e) {
        e.preventDefault();
        cambiarPassword();
    });
});

function cargarPerfil() {
    fetch(`${API}/perfil.php`, { credentials: 'same-origin' })
        .then(r => {
            if (r.status === 401) {
                document.getElementById('perfil-loading').style.display = 'none';
                document.getElementById('perfil-sin-sesion').style.display = 'block';
                return null;
            }
            return r.json();
        })
        .then(data => {
            if (!data) return;

            document.getElementById('perfil-loading').style.display = 'none';
            document.getElementById('perfil-contenido').style.display = 'block';

            const u = data.usuario;

            // Hero
            document.getElementById('perfil-nombre-hero').textContent = u.nombre;
            document.getElementById('perfil-email-hero').textContent = u.email;
            document.getElementById('perfil-rol-hero').textContent = u.rol.toUpperCase();

            // Datos
            document.getElementById('dato-nombre').textContent = u.nombre;
            document.getElementById('dato-email').textContent = u.email;
            document.getElementById('dato-rol').textContent = capitalizarPrimera(u.rol);
            document.getElementById('dato-fecha').textContent = formatFecha(u.created_at);

            if (u.rol === 'admin') {
                const filaProyectos = document.getElementById('dato-num-configs').closest('.dato-fila');
                if (filaProyectos) filaProyectos.style.display = 'none';

                const garajeCard = document.querySelector('.garaje-fullcard');
                if (garajeCard) {
                    garajeCard.innerHTML = '';

                    const titulo = document.createElement('div');
                    titulo.className = 'perfil-card-titulo';
                    titulo.textContent = 'Gestión de Plataforma';

                    const desc = document.createElement('p');
                    desc.style.cssText = 'color:var(--gris); font-size: 0.95rem; margin-bottom: 2rem;';
                    desc.textContent = 'Accede a tu panel de control para gestionar los pedidos y configuraciones de los clientes.';

                    const link = document.createElement('a');
                    link.href = 'admin.html';
                    link.className = 'btn-garaje-ir';
                    link.style.cssText = 'border-color:var(--color2); color:var(--color2); box-shadow: 0 0 10px rgba(80,200,255,0.4);';
                    link.textContent = 'Ir al Panel Admin →';

                    garajeCard.append(titulo, desc, link);
                }
            } else {
                document.getElementById('dato-num-configs').textContent = data.garaje.length;
                renderGarajeMini(data.garaje);
            }
        })
        .catch(err => {
            console.error(err);
            document.getElementById('perfil-loading').textContent = 'Error al cargar el perfil.';
        });
}

function renderGarajeMini(configs) {
    const grid = document.getElementById('garaje-mini-grid');
    const vacio = document.getElementById('garaje-vacio');

    if (!configs || configs.length === 0) {
        vacio.style.display = 'block';
        return;
    }

    const mostrar = configs.slice(0, 3);
    mostrar.forEach(c => {
        const card = document.createElement('div');
        card.className = 'garaje-mini-tarjeta';

        const estado = c.pedido_estado || 'pendiente';
        const claseEstado = `estado-${estado.replace(' ', '-')}`;

        // Construcción segura con DOM API (sin innerHTML) para prevenir XSS
        const h4 = document.createElement('h4');
        h4.textContent = c.modelo;

        const pColor = document.createElement('p');
        pColor.textContent = c.color;

        const pLlantas = document.createElement('p');
        pLlantas.textContent = c.llantas;

        const span = document.createElement('span');
        span.className = `garaje-mini-estado ${claseEstado}`;
        span.textContent = capitalizarPrimera(estado);

        card.append(h4, pColor, pLlantas, span);
        grid.appendChild(card);
    });

    if (configs.length > 3) {
        const verMas = document.createElement('div');
        verMas.className = 'garaje-mini-tarjeta';
        verMas.style.display = 'flex';
        verMas.style.alignItems = 'center';
        verMas.style.justifyContent = 'center';

        const link = document.createElement('a');
        link.href = 'garaje.html';
        link.style.cssText = "color:var(--color2);font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:2px;text-decoration:none;";
        link.textContent = `+${configs.length - 3} más →`;

        verMas.appendChild(link);
        grid.appendChild(verMas);
    }
}

function cambiarPassword() {
    const actual = document.getElementById('password-actual').value;
    const nuevo = document.getElementById('password-nuevo').value;
    const confirmVal = document.getElementById('password-confirm').value;
    const btn = document.getElementById('btn-cambiar-pass');

    if (!actual || !nuevo || !confirmVal) {
        mostrarAlertaPerfil('Rellena todos los campos.', 'error');
        return;
    }
    if (nuevo !== confirmVal) {
        mostrarAlertaPerfil('Las contraseñas nuevas no coinciden.', 'error');
        return;
    }
    if (nuevo.length < 8) {
        mostrarAlertaPerfil('La nueva contraseña debe tener al menos 8 caracteres.', 'error');
        return;
    }

    btn.textContent = 'Actualizando...';
    btn.disabled = true;

    fetch(`${API}/perfil.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.__CSRF_TOKEN__ || '' },
        credentials: 'same-origin',
        body: JSON.stringify({
            password_actual: actual,
            password_nuevo: nuevo,
            password_confirm: confirmVal
        })
    })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                mostrarAlertaPerfil(data.message, 'exito');
                document.getElementById('form-password').reset();
            } else {
                mostrarAlertaPerfil(data.message || 'Error desconocido.', 'error');
            }
        })
        .catch(() => mostrarAlertaPerfil('Error de conexión.', 'error'))
        .finally(() => {
            btn.textContent = 'Actualizar contraseña';
            btn.disabled = false;
        });
}

function mostrarAlertaPerfil(texto, tipo) {
    const el = document.getElementById('alerta-password');
    el.textContent = texto;
    el.className = `alerta-perfil ${tipo}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}