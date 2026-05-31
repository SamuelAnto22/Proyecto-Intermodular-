// ============================================================
// Mi Garaje — Lógica completa con modal y toast
// ============================================================
import { formatFecha } from './modules/utils.js';

const API_BASE = window.API_BASE;

// ── Estado del modal de borrado ──────────────────────────────
let idParaBorrar = null;
let ultimoElementoEnfocado = null;

document.addEventListener('DOMContentLoaded', function () {
    cargarProyectos();
    iniciarModal();
    iniciarEventosTarjetas();
});

function iniciarEventosTarjetas() {
    const lista = document.getElementById('proyectos-lista');
    if (!lista) return;

    lista.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action][data-id]');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id, 10);
        if (!id) return;

        const card = btn.closest('.tarjeta-garaje');

        if (action === 'editar') {
            // sacamos datos de la tarjeta renderizada
            const modelo = card?.querySelector('.tarjeta-modelo')?.textContent?.trim() || '';
            const color = card?.querySelectorAll('.spec-valor')?.[0]?.textContent?.trim() || '';
            const llantas = card?.querySelectorAll('.spec-valor')?.[1]?.textContent?.trim() || '';

            // tu función ya existente
            editarEnConfigurador(id, modelo, color, llantas);
            return;
        }

        if (action === 'solicitar') {
            solicitarPedido(id, btn);
            return;
        }

        if (action === 'eliminar') {
            const nombre = card?.querySelector('.tarjeta-modelo')?.textContent?.trim() || `Proyecto #${id}`;
            abrirModalBorrar(id, nombre);
            return;
        }
    });
}




// ────────────────────────────────────────────────────────────
// Cargar y renderizar proyectos
// ────────────────────────────────────────────────────────────
function cargarProyectos() {
    const lista = document.getElementById('proyectos-lista');

    fetch(`${API_BASE}/guardar_config.php`, { credentials: 'same-origin' })
        .then(response => {
            if (response.status === 401) {
                lista.innerHTML = `
                    <div class="garaje-vacio">
                        <p>🔒 Debes iniciar sesión para ver tu garaje.</p>
                        <a href="login.html" class="boton-neon" style="margin-top:1.5rem;display:inline-block;">Iniciar sesión</a>
                    </div>`;
                throw new Error('NO_SESSION');
            }
            return response.json();
        })
        .then(data => {
            if (!data.ok || data.data.length === 0) {
                lista.innerHTML = `
                    <div class="garaje-vacio">
                        <p>🚘 No tienes proyectos guardados todavía.</p>
                        <a href="configurador.html">Crea tu primera configuración →</a>
                    </div>`;
                return;
            }

            lista.innerHTML = '';
            data.data.forEach(p => lista.appendChild(crearTarjeta(p)));
        })
        .catch(error => {
            if (error.message !== 'NO_SESSION') {
                console.error('Error cargando proyectos:', error);
                lista.innerHTML = '<div class="garaje-vacio"><p>⚠️ Error de conexión con el servidor.</p></div>';
            }
        });
}

// ────────────────────────────────────────────────────────────
// Construir tarjeta HTML
// ────────────────────────────────────────────────────────────
function crearTarjeta(p) {
    const card = document.createElement('div');
    card.className = 'tarjeta-garaje';
    card.dataset.id = p.id;

    const estado = p.pedido_estado || 'pendiente';
    const claseEstado = `estado-${estado.replace(' ', '-')}`;
    const labelEstado = etiquetaEstado(estado);
    const fecha = formatFecha(p.created_at);

    // El botón "Solicitar" solo está activo si el estado es "pendiente"
    const puedesolicitar = (estado === 'pendiente');

    const banda = document.createElement('div');
    banda.className = 'tarjeta-banda';

    const body = document.createElement('div');
    body.className = 'tarjeta-body';

    const modelo = document.createElement('div');
    modelo.className = 'tarjeta-modelo';
    modelo.textContent = p.modelo?.replace('_', ' ') || '';

    const badge = document.createElement('span');
    badge.className = `estado-badge ${claseEstado}`;
    badge.textContent = labelEstado;

    const specs = document.createElement('div');
    specs.className = 'tarjeta-specs';

    const crearSpec = (label, valor) => {
        const item = document.createElement('div');
        item.className = 'spec-item';

        const labelEl = document.createElement('span');
        labelEl.className = 'spec-label';
        labelEl.textContent = label;

        const valorEl = document.createElement('span');
        valorEl.className = 'spec-valor';
        valorEl.textContent = valor;

        item.append(labelEl, valorEl);
        return item;
    };

    specs.append(
        crearSpec('🎨 Color', p.color || ''),
        crearSpec('🛞 Llantas', p.llantas || ''),
        crearSpec('📋 ID pedido', `#${String(p.id).padStart(4, '0')}`)
    );

    const fechaEl = document.createElement('p');
    fechaEl.className = 'tarjeta-fecha';
    fechaEl.textContent = `Guardado el ${fecha}`;

    body.append(modelo, badge, specs, fechaEl);

    const acciones = document.createElement('div');
    acciones.className = 'tarjeta-acciones';

    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-accion btn-editar';
    btnEditar.dataset.action = 'editar';
    btnEditar.dataset.id = p.id;
    btnEditar.title = 'Cargar en el configurador para editar';
    btnEditar.textContent = '✏️ Editar';

    const btnSolicitar = document.createElement('button');
    btnSolicitar.className = 'btn-accion btn-solicitar';
    btnSolicitar.id = `btn-solicitar-${p.id}`;
    btnSolicitar.dataset.action = 'solicitar';
    btnSolicitar.dataset.id = p.id;
    btnSolicitar.disabled = !puedesolicitar;
    btnSolicitar.title = puedesolicitar ? 'Enviar solicitud al taller' : 'Ya solicitado';
    btnSolicitar.textContent = puedesolicitar ? '📤 Solicitar' : '✅ Solicitado';

    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn-accion btn-eliminar';
    btnEliminar.dataset.action = 'eliminar';
    btnEliminar.dataset.id = p.id;
    btnEliminar.title = 'Eliminar proyecto';
    btnEliminar.textContent = '🗑️ Borrar';

    acciones.append(btnEditar, btnSolicitar, btnEliminar);
    card.append(banda, body, acciones);

    return card;
}

// ── Textos legibles para cada estado ─────────────────────────
function etiquetaEstado(estado) {
    const labels = {
        'pendiente': 'Pendiente',
        'solicitado': 'Solicitado',
        'en proceso': 'En proceso',
        'terminado': 'Terminado'
    };
    return labels[estado] || estado;
}

// ────────────────────────────────────────────────────────────
// Editar en el configurador (antes "Cargar")
// ────────────────────────────────────────────────────────────
function editarEnConfigurador(id, modelo, color, llantas) {
    const params = new URLSearchParams({ id, modelo, color, llantas });
    window.location.href = `configurador.html?${params.toString()}`;
}

// ────────────────────────────────────────────────────────────
// Solicitar pedido (simula confirmación / "pago")
// ────────────────────────────────────────────────────────────
function solicitarPedido(configId, btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Enviando...';

    fetch(`${API_BASE}/guardar_config.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.__CSRF_TOKEN__ || '' },
        credentials: 'same-origin',
        body: JSON.stringify({ accion: 'solicitar', configuracion_id: configId, estado: 'solicitado' })
    })
        .then(r => {
            // Clonar la respuesta para poder leer el texto crudo si falla el JSON
            const cloned = r.clone();
            return r.json().catch(() => {
                // Si no es JSON válido, leer texto crudo para ver el error PHP
                return cloned.text().then(txt => {
                    console.error('Respuesta no-JSON del servidor:', txt);
                    return { ok: false, message: 'Error del servidor (ver consola)' };
                });
            });
        })
        .then(data => {
            if (data.ok) {
                const card = document.querySelector(`.tarjeta-garaje[data-id="${configId}"]`);
                if (card) {
                    const badge = card.querySelector('.estado-badge');
                    if (badge) {
                        badge.className = 'estado-badge estado-solicitado';
                        badge.textContent = 'Solicitado';
                    }
                }
                btn.textContent = '✅ Solicitado';
                mostrarToast('📤 ¡Solicitud enviada al taller! Te contactaremos pronto.', 'exito');
            } else {
                btn.disabled = false;
                btn.textContent = '📤 Solicitar';
                mostrarToast('Error: ' + (data.message || 'Inténtalo de nuevo.'), 'error');
            }
        })
        .catch(err => {
            console.error('Error en solicitar:', err);
            btn.disabled = false;
            btn.textContent = '📤 Solicitar';
            mostrarToast('Error de conexión.', 'error');
        });
}

// ────────────────────────────────────────────────────────────
// Modal de borrado
// ────────────────────────────────────────────────────────────
function iniciarModal() {
    const overlay = document.getElementById('modal-borrar');
    const modalBox = overlay?.querySelector('.modal-box');
    const btnCancelar = document.getElementById('modal-cancelar');
    const btnConfirmar = document.getElementById('modal-confirmar');

    btnCancelar.addEventListener('click', cerrarModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) cerrarModal(); });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('activo')) cerrarModal();
        if (e.key === 'Tab' && overlay.classList.contains('activo')) {
            atraparFocoModal(e, modalBox);
        }
    });

    btnConfirmar.addEventListener('click', () => {
        if (idParaBorrar !== null) ejecutarBorrado(idParaBorrar);
    });
}

function abrirModalBorrar(id, nombre) {
    idParaBorrar = id;
    ultimoElementoEnfocado = document.activeElement;
    document.getElementById('modal-nombre-proyecto').textContent = nombre;
    const overlay = document.getElementById('modal-borrar');
    overlay.classList.add('activo');
    document.getElementById('modal-cancelar')?.focus();
}

function cerrarModal() {
    document.getElementById('modal-borrar').classList.remove('activo');
    idParaBorrar = null;
    if (ultimoElementoEnfocado && typeof ultimoElementoEnfocado.focus === 'function') {
        ultimoElementoEnfocado.focus();
    }
}

function ejecutarBorrado(id) {
    const btnConfirmar = document.getElementById('modal-confirmar');
    btnConfirmar.textContent = 'Eliminando...';
    btnConfirmar.disabled = true;

    fetch(`${API_BASE}/guardar_config.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.__CSRF_TOKEN__ || '' },
        credentials: 'same-origin',
        body: JSON.stringify({ id })
    })
        .then(r => r.json())
        .then(data => {
            cerrarModal();
            btnConfirmar.textContent = 'Sí, eliminar';
            btnConfirmar.disabled = false;

            if (data.ok) {
                // Eliminar la tarjeta con animación
                const card = document.querySelector(`.tarjeta-garaje[data-id="${id}"]`);
                if (card) {
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        card.remove();
                        // Si no quedan tarjetas, mostrar mensaje vacío
                        const lista = document.getElementById('proyectos-lista');
                        if (lista.querySelectorAll('.tarjeta-garaje').length === 0) {
                            lista.innerHTML = `
                            <div class="garaje-vacio">
                                <p>🚘 No tienes proyectos guardados todavía.</p>
                                <a href="configurador.html">Crea tu primera configuración →</a>
                            </div>`;
                        }
                    }, 400);
                }
                mostrarToast('🗑️ Proyecto eliminado correctamente.', 'exito');
            } else {
                mostrarToast('Error: ' + (data.message || 'No se pudo eliminar.'), 'error');
            }
        })
        .catch(() => {
            cerrarModal();
            btnConfirmar.textContent = 'Sí, eliminar';
            btnConfirmar.disabled = false;
            mostrarToast('Error de conexión.', 'error');
        });
}

// ────────────────────────────────────────────────────────────
// Toast de notificación
// ────────────────────────────────────────────────────────────
let toastTimer = null;

function mostrarToast(mensaje, tipo = 'exito') {
    const toast = document.getElementById('toast');
    if (toastTimer) clearTimeout(toastTimer);

    toast.setAttribute('aria-live', tipo === 'error' ? 'assertive' : 'polite');
    toast.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    toast.textContent = (tipo === 'exito' ? '✅ ' : '⚠️ ') + mensaje;
    toast.className = `toast ${tipo}`;

    // Forzar reflow para reiniciar animación
    toast.offsetHeight;
    toast.classList.add('visible');

    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
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