// ============================================================
// Mi Garaje — Lógica completa con modal y toast
// ============================================================

const API_BASE = '/Proyecto-Intermodular-/servidor/api';

// ── Estado del modal de borrado ──────────────────────────────
let idParaBorrar = null;

document.addEventListener('DOMContentLoaded', function () {
    cargarProyectos();
    iniciarModal();
});

// ────────────────────────────────────────────────────────────
// Cargar y renderizar proyectos
// ────────────────────────────────────────────────────────────
function cargarProyectos() {
    const lista = document.getElementById('proyectos-lista');

    fetch(`${API_BASE}/guardar_config.php`)
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

    card.innerHTML = `
        <div class="tarjeta-banda"></div>
        <div class="tarjeta-body">
            <div class="tarjeta-modelo">${p.modelo.replace('_', ' ')}</div>

            <span class="estado-badge ${claseEstado}">${labelEstado}</span>

            <div class="tarjeta-specs">
                <div class="spec-item">
                    <span class="spec-label">🎨 Color</span>
                    <span class="spec-valor">${p.color}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">🛞 Llantas</span>
                    <span class="spec-valor">${p.llantas}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">⚙️ Suspensión</span>
                    <span class="spec-valor">${p.suspension}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">📋 ID pedido</span>
                    <span class="spec-valor">#${String(p.id).padStart(4, '0')}</span>
                </div>
            </div>

            <p class="tarjeta-fecha">Guardado el ${fecha}</p>
        </div>
        <div class="tarjeta-acciones">
            <button class="btn-accion btn-editar"
                    onclick="editarEnConfigurador(${p.id},'${p.modelo}','${p.color}','${p.llantas}','${p.suspension}')"
                    title="Cargar en el configurador para editar">
                ✏️ Editar
            </button>
            <button class="btn-accion btn-solicitar"
                    id="btn-solicitar-${p.id}"
                    onclick="solicitarPedido(${p.id}, this)"
                    ${puedesolicitar ? '' : 'disabled'}
                    title="${puedesolicitar ? 'Enviar solicitud al taller' : 'Ya solicitado'}">
                ${puedesolicitar ? '📤 Solicitar' : '✅ Solicitado'}
            </button>
            <button class="btn-accion btn-eliminar"
                    onclick="abrirModalBorrar(${p.id}, '${p.modelo.replace('_', ' ')}')"
                    title="Eliminar proyecto">
                🗑️ Borrar
            </button>
        </div>
    `;

    return card;
}

// ── Textos legibles para cada estado ─────────────────────────
function etiquetaEstado(estado) {
    const labels = {
        'pendiente'  : 'Pendiente',
        'solicitado' : 'Solicitado',
        'en proceso' : 'En proceso',
        'terminado'  : 'Terminado'
    };
    return labels[estado] || estado;
}

// ────────────────────────────────────────────────────────────
// Editar en el configurador (antes "Cargar")
// ────────────────────────────────────────────────────────────
function editarEnConfigurador(id, modelo, color, llantas, suspension) {
    const params = new URLSearchParams({ id, modelo, color, llantas, suspension });
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
        headers: { 'Content-Type': 'application/json' },
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
    const btnCancelar = document.getElementById('modal-cancelar');
    const btnConfirmar = document.getElementById('modal-confirmar');

    btnCancelar.addEventListener('click', cerrarModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) cerrarModal(); });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('activo')) cerrarModal();
    });

    btnConfirmar.addEventListener('click', () => {
        if (idParaBorrar !== null) ejecutarBorrado(idParaBorrar);
    });
}

function abrirModalBorrar(id, nombre) {
    idParaBorrar = id;
    document.getElementById('modal-nombre-proyecto').textContent = nombre;
    document.getElementById('modal-borrar').classList.add('activo');
}

function cerrarModal() {
    document.getElementById('modal-borrar').classList.remove('activo');
    idParaBorrar = null;
}

function ejecutarBorrado(id) {
    const btnConfirmar = document.getElementById('modal-confirmar');
    btnConfirmar.textContent = 'Eliminando...';
    btnConfirmar.disabled = true;

    fetch(`${API_BASE}/guardar_config.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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

    toast.textContent = (tipo === 'exito' ? '✅ ' : '⚠️ ') + mensaje;
    toast.className = `toast ${tipo}`;

    // Forzar reflow para reiniciar animación
    toast.offsetHeight;
    toast.classList.add('visible');

    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
}

// ────────────────────────────────────────────────────────────
// Utilidades
// ────────────────────────────────────────────────────────────
function formatFecha(fechaStr) {
    if (!fechaStr) return '—';
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
