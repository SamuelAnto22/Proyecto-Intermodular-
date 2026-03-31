// ============================================================
// Admin Panel — Midnight Customs
// ============================================================

const API_ADMIN = '/Proyecto-Intermodular-/servidor/api/pedidos.php';

document.addEventListener('DOMContentLoaded', function () {
    cargarDashboard();
});

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
                row.innerHTML = `
                    <td>#${String(p.id).padStart(4, '0')}</td>
                    <td>
                        <div class="cliente-info">
                            <span class="cliente-nombre">${p.cliente}</span>
                            <span class="cliente-email">${p.cliente_email}</span>
                        </div>
                    </td>
                    <td class="modelo-texto">${p.modelo.replace('_', ' ')}</td>
                    <td>
                        <span class="detalle-config">🎨 ${p.color} · 🛞 ${p.llantas} · ⚙️ ${p.suspension}</span>
                    </td>
                    <td>
                        <span class="badge-estado badge-${estadoSlug}" id="badge-${p.id}">${capitalizarEstado(p.estado)}</span>
                    </td>
                    <td>${fecha}</td>
                    <td>
                        <div class="acciones-cell">
                            <select class="select-estado" id="select-${p.id}">
                                <option value="pendiente" ${p.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="solicitado" ${p.estado === 'solicitado' ? 'selected' : ''}>Solicitado</option>
                                <option value="en proceso" ${p.estado === 'en proceso' ? 'selected' : ''}>En proceso</option>
                                <option value="terminado" ${p.estado === 'terminado' ? 'selected' : ''}>Terminado</option>
                            </select>
                            <button class="btn-admin btn-guardar" onclick="cambiarEstado(${p.id})" title="Guardar estado">✓</button>
                            <button class="btn-admin btn-borrar" onclick="eliminarPedido(${p.id})" title="Eliminar pedido">✕</button>
                        </div>
                    </td>
                `;
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        .catch(() => {});
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
