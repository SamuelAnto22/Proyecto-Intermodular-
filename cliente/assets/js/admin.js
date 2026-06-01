// ============================================================
// Admin Panel — Midnight Customs
// ============================================================
import { formatFecha, capitalizarPrimera } from './modules/utils.js';

const API_ADMIN = `${window.API_BASE}/pedidos.php`;

let idParaBorrar = null;
let ultimoElementoEnfocado = null;

document.addEventListener('DOMContentLoaded', function () {
    cargarDashboard();
    iniciarEventosAdmin();
    iniciarModalBorrar();
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



// ============================================================
// Cargar pedidos + estadísticas
// ============================================================
function cargarDashboard() {
    const body = document.getElementById('pedidos-body');

    fetch(API_ADMIN, { credentials: 'same-origin' })
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

            // Estadísticas.
            if (data.stats) {
                document.getElementById('stat-clientes').textContent = data.stats.total_clientes;
                document.getElementById('stat-pedidos').textContent = data.stats.total_pedidos;
                document.getElementById('stat-pendientes').textContent = data.stats.pendientes;
                document.getElementById('stat-solicitados').textContent = data.stats.solicitados;
                document.getElementById('stat-proceso').textContent = data.stats.en_proceso;
                document.getElementById('stat-terminados').textContent = data.stats.terminados;
            }

            // Tabla de pedidos.
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
                detalleConfig.textContent = `${p.color || ''} · ${p.llantas || ''}`;
                detalleCell.appendChild(detalleConfig);

                const estadoCell = document.createElement('td');
                const badge = document.createElement('span');
                badge.className = `badge-estado badge-${estadoSlug}`;
                badge.id = `badge-${p.id}`;
                badge.textContent = capitalizarPrimera(p.estado);
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
                    option.textContent = capitalizarPrimera(estado);
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

// ============================================================
// Cambiar estado (con select)
// ============================================================
function cambiarEstado(id) {
    const select = document.getElementById(`select-${id}`);
    const nuevoEstado = select.value;

    fetch(API_ADMIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.__CSRF_TOKEN__ || '' },
        credentials: 'same-origin',
        body: JSON.stringify({ accion: 'cambiar_estado', id, estado: nuevoEstado })
    })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                // Actualizar badge sin recargar.
                const badge = document.getElementById(`badge-${id}`);
                if (badge) {
                    badge.className = `badge-estado badge-${nuevoEstado.replace(' ', '-')}`;
                    badge.textContent = capitalizarPrimera(nuevoEstado);
                }
                toastAdmin(data.message, 'exito');
                // Recargar estadísticas.
                actualizarStats();
            } else {
                toastAdmin('Error: ' + data.message, 'error');
            }
        })
        .catch(() => toastAdmin('Error de conexión.', 'error'));
}

// ============================================================
// Eliminar pedido
// ============================================================
function eliminarPedido(id) {
    abrirModalBorrar(id);
}

function iniciarModalBorrar() {
    const overlay = document.getElementById('modal-borrar');
    const modalBox = overlay?.querySelector('.modal-box');
    const btnCancelar = document.getElementById('modal-cancelar');
    const btnConfirmar = document.getElementById('modal-confirmar');

    if (!overlay) return;

    btnCancelar.addEventListener('click', cerrarModalBorrar);
    overlay.addEventListener('click', e => { if (e.target === overlay) cerrarModalBorrar(); });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('activo')) cerrarModalBorrar();
        if (e.key === 'Tab' && overlay.classList.contains('activo')) {
            atraparFocoModal(e, modalBox);
        }
    });

    btnConfirmar.addEventListener('click', () => {
        if (idParaBorrar !== null) ejecutarBorrado(idParaBorrar);
    });
}

function abrirModalBorrar(id) {
    idParaBorrar = id;
    ultimoElementoEnfocado = document.activeElement;

    const formattedId = `#${String(id).padStart(4, '0')}`;
    const strongEl = document.getElementById('modal-nombre-proyecto');
    if (strongEl) strongEl.textContent = formattedId;

    const overlay = document.getElementById('modal-borrar');
    if (overlay) overlay.classList.add('activo');

    document.getElementById('modal-cancelar')?.focus();
}

function cerrarModalBorrar() {
    const overlay = document.getElementById('modal-borrar');
    if (overlay) overlay.classList.remove('activo');
    idParaBorrar = null;
    if (ultimoElementoEnfocado && typeof ultimoElementoEnfocado.focus === 'function') {
        ultimoElementoEnfocado.focus();
    }
}

function ejecutarBorrado(id) {
    const btnConfirmar = document.getElementById('modal-confirmar');
    btnConfirmar.textContent = 'Eliminando...';
    btnConfirmar.disabled = true;

    fetch(API_ADMIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.__CSRF_TOKEN__ || '' },
        credentials: 'same-origin',
        body: JSON.stringify({ accion: 'eliminar', id })
    })
        .then(r => r.json())
        .then(data => {
            cerrarModalBorrar();
            btnConfirmar.textContent = 'Sí, eliminar';
            btnConfirmar.disabled = false;

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
                toastAdmin('Pedido eliminado.', 'exito');
            } else {
                toastAdmin('Error: ' + data.message, 'error');
            }
        })
        .catch(() => {
            cerrarModalBorrar();
            btnConfirmar.textContent = 'Sí, eliminar';
            btnConfirmar.disabled = false;
            toastAdmin('Error de conexión.', 'error');
        });
}

function atraparFocoModal(event, modalBox) {
    if (!modalBox) return;
    const focuseables = modalBox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focuseables.length) return;

    const primero = focuseables[0];
    const ultimo = focuseables[focuseables.length - 1];

    if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero.focus();
    }
}

// ============================================================
// Recargar solo las estadísticas
// ============================================================
function actualizarStats() {
    fetch(API_ADMIN, { credentials: 'same-origin' })
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

// ============================================================
// Toast
// ============================================================
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