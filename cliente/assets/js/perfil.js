const API = '/Proyecto-Intermodular-/servidor/api';

document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil();

    document.getElementById('form-password').addEventListener('submit', function (e) {
        e.preventDefault();
        cambiarPassword();
    });
});

function cargarPerfil() {
    fetch(`${API}/perfil.php`)
        .then(r => {
            if (r.status === 401) {
                // No hay sesión
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
            document.getElementById('dato-rol').textContent = u.rol.charAt(0).toUpperCase() + u.rol.slice(1);
            document.getElementById('dato-fecha').textContent = formatFecha(u.created_at);

            if (u.rol === 'admin') {
                // Ocultar fila de proyectos guardados en los datos
                const filaProyectos = document.getElementById('dato-num-configs').closest('.dato-fila');
                if (filaProyectos) filaProyectos.style.display = 'none';

                // Reemplazar la tarjeta completa del garaje
                const garajeCard = document.querySelector('.garaje-fullcard');
                if (garajeCard) {
                    garajeCard.innerHTML = `
                            <div class="perfil-card-titulo">⚙️ Gestión de Plataforma</div>
                            <p style="color:var(--gris); font-size: 0.95rem; margin-bottom: 2rem;">
                            Accede a tu panel de control para gestionar los pedidos y configuraciones de los clientes.
                            </p>
                            <a href="admin.html" class="btn-garaje-ir" style="border-color:var(--color2); color:var(--color2); box-shadow: 0 0 10px rgba(80,200,255,0.4);">Ir al Panel Admin →</a>
                        `;
                }
            } else {
                document.getElementById('dato-num-configs').textContent = data.garaje.length;
                const grid = document.getElementById('garaje-mini-grid');
                if (grid) grid.innerHTML = '';
                // Garaje mini para clientes
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
    vacio.style.display = 'none';

    // Mostrar máximo 3 en el perfil
    const mostrar = configs.slice(0, 3);
    mostrar.forEach(c => {
        const card = document.createElement('div');
        card.className = 'garaje-mini-tarjeta';

        const estado = c.pedido_estado || 'pendiente';
        const claseEstado = `estado-${estado.replace(' ', '-')}`;

        card.innerHTML = `
                <h4>${c.modelo}</h4>
                <p>🎨 ${c.color}</p>

                <p>🛞 ${c.llantas}</p>
                <span class="garaje-mini-estado ${claseEstado}">${capitalizarPrimera(estado)}</span>
            `;
        grid.appendChild(card);
    });

    // Si hay más de 3, mostrar enlace "ver todos"
    if (configs.length > 3) {
        const verMas = document.createElement('div');
        verMas.className = 'garaje-mini-tarjeta';
        verMas.style.display = 'flex';
        verMas.style.alignItems = 'center';
        verMas.style.justifyContent = 'center';
        verMas.innerHTML = `<a href="garaje.html" style="color:var(--color2);font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:2px;text-decoration:none;">+${configs.length - 3} más →</a>`;
        grid.appendChild(verMas);
    }
}

function cambiarPassword() {
    const actual = document.getElementById('password-actual').value;
    const nuevo = document.getElementById('password-nuevo').value;
    const confirm = document.getElementById('password-confirm').value;
    const alerta = document.getElementById('alerta-password');
    const btn = document.getElementById('btn-cambiar-pass');

    // Validación client-side rápida
    if (!actual || !nuevo || !confirm) {
        mostrarAlertaPerfil('Rellena todos los campos.', 'error');
        return;
    }
    if (nuevo !== confirm) {
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
        body: JSON.stringify({
            password_actual: actual,
            password_nuevo: nuevo,
            password_confirm: confirm
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

function formatFecha(fechaStr) {
    if (!fechaStr) return '—';
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

function capitalizarPrimera(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
