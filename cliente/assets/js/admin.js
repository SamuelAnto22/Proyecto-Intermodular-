// ============================================================
// Admin Panel — Midnight Customs
// ============================================================



const API_ADMIN = `${window.API_BASE}/pedidos.php`;

document.addEventListener('DOMContentLoaded', function () {
    cargarDashboard();
    iniciarEventosAdmin();
});

function iniciarEventosAdmin() {
    const body = document.getElementById('pedidos-body');
    if (!body) return;

    body.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action][data-id]');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id, 10);
        if (!id) return;

        if (action === 'cambiar_estado') {
            cambiarEstado(id);
            return;
        }

        if (action === 'eliminar') {
            eliminarPedido(id);
            return;
        }
    });
}

function escaparHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
}

// ────────────────────────────────────────────────────────────
// Cargar pedidos + estadísticas
// ────────────────────────────────────────────────────────────
function cargarDashboard() {
    const body = document.getElementById('pedidos-body');

    fetch(API_ADMIN)
        .then(r => {
            if (r.status === 401) {
                document.querySelector('.admin-page').querySelectorAll('.admin-hero, .stats-grid, .tabla-seccion').forEach(el => el.style.display = 'none');
                document.getElementById('admin-sin-acceso').style.display = 'block';
                throw new Error('NO_SESSION');
            }
            if (r.status === 403) {
                document.querySelector('.admin-page').querySelectorAll('.admin-hero, .stats-grid, .tabla-seccion').forEach(el => el.style.display = 'none');
                document.getElementById('admin-sin-acceso').style.display = 'block';
                throw new Error('FORBIDDEN');
            }
            return r.json();
        })
        .then(data => {
            if (!data.ok) {
                body.innerHTML = '<tr><td colspan="7">Error cargando datos.</td></tr>';
                return;
            }

            // Stats
            if (data.stats) {
                document.getElementById('stat-clientes').textContent = data.stats.total_clientes;
                document.getElementById('stat-pedidos').textContent = data.stats.total_pedidos;
                document.getElementById('stat-pendientes').textContent = data.stats.pendientes;
                document.getElementById('stat-solicitados').textContent = data.stats.solicitados;
                document.getElementById('stat-proceso').textContent = data.stats.en_proceso;
                document.getElementById('stat-terminados').textContent = data.stats.terminados;
            }

            // Tabla
            if (data.data.length === 0) {
                body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gris);padding:2rem;">No hay pedidos registrados.</td></tr>';
                return;
            }

            body.innerHTML = '';
            data.data.forEach(p => {
                const estadoSlug = p.estado.replace(' ', '-');
                const fecha = formatFecha(p.fecha);
                const row = document.createElement('tr');
                row.id = `pedido-${p.id}`;

                const idCell = document.createElement('td');
                idCell.textContent = `#${String(p.id).padStart(4, '0')}`;

                const clienteCell = document.createElement('td');
                const clienteInfo = document.createElement('div');
                clienteInfo.className = 'cliente-info';
                const clienteNombre = document.createElement('span');
                clienteNombre.className = 'cliente-nombre';
                clienteNombre.textContent = p.cliente || '';
                const clienteEmail = document.createElement('span');
                clienteEmail.className = 'cliente-email';
                clienteEmail.textContent = p.cliente_email || '';
                clienteInfo.append(clienteNombre, clienteEmail);
                clienteCell.appendChild(clienteInfo);

                const modeloCell = document.createElement('td');
                modeloCell.className = 'modelo-texto';
                modeloCell.textContent = p.modelo?.replace('_', ' ') || '';

                const detalleCell = document.createElement('td');
                const detalleConfig = document.createElement('span');
                detalleConfig.className = 'detalle-config';
                detalleConfig.textContent = `🎨 ${p.color || ''} · 🛞 ${p.llantas || ''}`;
                detalleCell.appendChild(detalleConfig);

                const estadoCell = document.createElement('td');
                const badge = document.createElement('span');
                badge.className = `badge-estado badge-${estadoSlug}`;
                badge.id = `badge-${p.id}`;
                badge.textContent = capitalizarEstado(p.estado);
                estadoCell.appendChild(badge);

                const fechaCell = document.createElement('td');
                fechaCell.textContent = fecha;

                const accionesCellWrap = document.createElement('td');
                const accionesCell = document.createElement('div');
                accionesCell.className = 'acciones-cell';

                const selectEstado = document.createElement('select');
                selectEstado.className = 'select-estado';
                selectEstado.id = `select-${p.id}`;

                const estados = ['pendiente', 'solicitado', 'en proceso', 'terminado'];
                estados.forEach((estado) => {
                    const option = document.createElement('option');
                    option.value = estado;
                    option.textContent = capitalizarEstado(estado);
                    option.selected = p.estado === estado;
                    selectEstado.appendChild(option);
                });

                const btnGuardar = document.createElement('button');
                btnGuardar.className = 'btn-admin btn-guardar';
                btnGuardar.dataset.action = 'cambiar_estado';
                btnGuardar.dataset.id = p.id;
                btnGuardar.title = 'Guardar estado';
                btnGuardar.textContent = '✓';

                const btnBorrar = document.createElement('button');
                btnBorrar.className = 'btn-admin btn-borrar';
                btnBorrar.dataset.action = 'eliminar';
                btnBorrar.dataset.id = p.id;
                btnBorrar.title = 'Eliminar pedido';
                btnBorrar.textContent = '✕';

                accionesCell.append(selectEstado, btnGuardar, btnBorrar);
                accionesCellWrap.appendChild(accionesCell);

                row.append(idCell, clienteCell, modeloCell, detalleCell, estadoCell, fechaCell, accionesCellWrap);
                body.appendChild(row);
            });
        })
        .catch(err => {
            if (err.message !== 'NO_SESSION' && err.message !== 'FORBIDDEN') {
                console.error(err);
                body.innerHTML = '<tr><td colspan="7">Error de conexión.</td></tr>';
            }
        });
}

// ────────────────────────────────────────────────────────────
// Cambiar estado (con select)
// ────────────────────────────────────────────────────────────
function cambiarEstado(id) {
    const select = document.getElementById(`select-${id}`);
    const nuevoEstado = select.value;

    fetch(API_ADMIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.__CSRF_TOKEN__ || '' },
        body: JSON.stringify({ accion: 'cambiar_estado', id, estado: nuevoEstado })
    })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                // Actualizar badge sin recargar
                const badge = document.getElementById(`badge-${id}`);
                if (badge) {
                    badge.className = `badge-estado badge-${nuevoEstado.replace(' ', '-')}`;
                    badge.textContent = capitalizarEstado(nuevoEstado);
                }
                toastAdmin('✅ ' + data.message, 'exito');
                // Recargar stats
                actualizarStats();
            } else {
                toastAdmin('Error: ' + data.message, 'error');
            }
        })
        .catch(() => toastAdmin('Error de conexión.', 'error'));
}

// ────────────────────────────────────────────────────────────
// Eliminar pedido
// ────────────────────────────────────────────────────────────
function eliminarPedido(id) {
    if (!confirm(`¿Eliminar pedido #${String(id).padStart(4, '0')}?`)) return;

    fetch(API_ADMIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.__CSRF_TOKEN__ || '' },
        body: JSON.stringify({ accion: 'eliminar', id })
    })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                const row = document.getElementById(`pedido-${id}`);
                if (row) {
                    row.style.transition = 'opacity 0.3s';
                    row.style.opacity = '0';
                    setTimeout(() => {
                        row.remove();
                        actualizarStats();
                    }, 300);
                }
                toastAdmin('🗑️ Pedido eliminado.', 'exito');
            } else {
                toastAdmin('Error: ' + data.message, 'error');
            }
        })
        .catch(() => toastAdmin('Error de conexión.', 'error'));
}

// ────────────────────────────────────────────────────────────
// Recargar solo las estadísticas
// ────────────────────────────────────────────────────────────
function actualizarStats() {
    fetch(API_ADMIN)
        .then(r => r.json())
        .then(data => {
            if (data.ok && data.stats) {
                document.getElementById('stat-clientes').textContent = data.stats.total_clientes;
                document.getElementById('stat-pedidos').textContent = data.stats.total_pedidos;
                document.getElementById('stat-pendientes').textContent = data.stats.pendientes;
                document.getElementById('stat-solicitados').textContent = data.stats.solicitados;
                document.getElementById('stat-proceso').textContent = data.stats.en_proceso;
                document.getElementById('stat-terminados').textContent = data.stats.terminados;
            }
        })
        .catch(() => { });
}

// ────────────────────────────────────────────────────────────
// Toast
// ────────────────────────────────────────────────────────────
let toastTimerAdmin = null;

function toastAdmin(msg, tipo) {
    const el = document.getElementById('toast-admin');
    if (toastTimerAdmin) clearTimeout(toastTimerAdmin);
    el.textContent = msg;
    el.className = `toast-admin ${tipo}`;
    el.offsetHeight;
    el.classList.add('visible');
    toastTimerAdmin = setTimeout(() => el.classList.remove('visible'), 4000);
}

// ────────────────────────────────────────────────────────────
// Utils
// ────────────────────────────────────────────────────────────
function capitalizarEstado(e) {
    return e.charAt(0).toUpperCase() + e.slice(1);
}

function formatFecha(f) {
    if (!f) return '—';
    const d = new Date(f);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
