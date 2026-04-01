// ============================================================
// Configurador de Coches — Midnight Customs (Multi-Coche)
// ============================================================

const API_CONFIG = '/Proyecto-Intermodular-/servidor/api/guardar_config.php';

// ── Estado global ────────────────────────────────────────────
let configuracionActual = {
    modelo: 'mini_cooper',
    color: 'rojo',
    llantas: 'clasica',
    suspension: 'stock'
};

let editandoId = null;

// ── Catálogo de coches ──────────────────────────────────────
// Cada modelo define sus imágenes de carrocería, las posiciones
// de las ruedas y el tamaño del contenedor.
// Para añadir un coche nuevo:
//   1. Añade las imágenes a assets/img/
//   2. Añade la entrada aquí con sus posiciones de rueda
//   3. Añade un <option> al select #modelo en configurador.html
const CATALOGO = {
    mini_cooper: {
        nombre: 'Mini Cooper',
        colores: {
            rojo: 'assets/img/mini-rojo.png',
            azul: 'assets/img/mini-azul.png',
            verde: 'assets/img/mini-verde.png',
            blanco: 'assets/img/mini-blanco.png',
            negro: 'assets/img/mini-negro.png'
        },
        // Dimensiones del contenedor del coche
        ancho: 640,
        alto: 360,
        // Tamaño y posición de la carrocería dentro del contenedor
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        // Posición y tamaño de cada rueda (ajustar manualmente por coche)
        ruedaDelantera: { top: 62, left: -79, width: 445, height: 304 },
        ruedaTrasera: { top: 62, left: 282, width: 445, height: 304 },
        // Offsets de suspensión
        suspension: {
            stock: 0,
            deportiva: 15,
            competicion: 25
        }
    },

    bmw_serie1: {
        nombre: 'BMW Serie 1',
        colores: {
            rojo: 'assets/img/bmw1-rojo.png',
            azul: 'assets/img/bmw1-azul.png',
            verde: 'assets/img/bmw1-verde.png',
            blanco: 'assets/img/bmw1-blanco.png',
            negro: 'assets/img/bmw1-negro.png',

        },
        ancho: 640,
        alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        ruedaDelantera: { top: -337, left: -79, width: 445, height: 1110 },
        ruedaTrasera: { top: -328, left: 288, width: 445, height: 1100 },
        suspension: {
            stock: 0,
            deportiva: 12,
            competicion: 22
        }
    },

    audi_a3: {
        nombre: 'Audi A3',
        colores: {
            rojo: 'assets/img/audi-a3-rojo.png',
            azul: 'assets/img/audi-a3-azul.png',
            verde: 'assets/img/audi-a3-verde.png',
            blanco: 'assets/img/audi-a3-blanco.png',
            negro: 'assets/img/audi-a3-negro.png',
        },
        ancho: 640,
        alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        ruedaDelantera: { top: 62, left: -91, width: 462, height: 313 },
        ruedaTrasera: { top: 63, left: 290, width: 462, height: 313 },
        suspension: {
            stock: 0,
            deportiva: 13,
            competicion: 23
        }
    },

    volkswagen_golf: {
        nombre: 'Porsche Cayenne',
        colores: {
            rojo: 'assets/img/porsche-rojo.png',
            azul: 'assets/img/porsche-azul.png',
            verde: 'assets/img/porsche-verde.png',
            blanco: 'assets/img/porsche-blanco.png',
            negro: 'assets/img/porsche-negro.png'

        },
        ancho: 640,
        alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        ruedaDelantera: { top: 46, left: -102, width: 479, height: 324 },
        ruedaTrasera: { top: 44, left: 262, width: 479, height: 324 },
        suspension: {
            stock: 0,
            deportiva: 14,
            competicion: 24
        }
    },

    toyota_supra: {
        nombre: 'Toyota Supra',
        colores: {
            rojo: 'assets/img/supra-rojo.png',
            azul: 'assets/img/supra-azul.png',
            verde: 'assets/img/supra-verde.png',
            blanco: 'assets/img/supra-blanco.png',
            negro: 'assets/img/supra-negro.png',
        },
        ancho: 640,
        alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        ruedaDelantera: { top: 41, left: -87, width: 460, height: 311 },
        ruedaTrasera: { top: 37, left: 266, width: 464, height: 317 },
        suspension: {
            stock: 0,
            deportiva: 10,
            competicion: 20
        }
    }
};

// Rutas de ruedas (compartidas por todos los modelos)
const RUEDAS = {
    clasica: 'assets/img/rueda-clasica.png',
    deportiva: 'assets/img/rueda-deportiva.png',
    competicion: 'assets/img/rueda-competicion.png',
    multiradio: 'assets/img/rueda-multi-radio.png',
    palos: 'assets/img/rueda-palos.png'

};

// ── Inicialización ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    cargarDesdeURL();
    setupEventListeners();
    actualizarVista();
});

// ── Cargar configuración desde URL (modo edición) ───────────
function cargarDesdeURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('id')) {
        editandoId = parseInt(params.get('id'), 10);

        const btn = document.getElementById('guardarConfig');
        if (btn) btn.innerHTML = '💾 Actualizar Configuración';

        const titulo = document.getElementById('titulo-configurador');
        if (titulo) titulo.textContent = 'Editando Proyecto #' + String(editandoId).padStart(4, '0');
    }

    const fields = ['modelo', 'color', 'llantas', 'suspension'];
    fields.forEach(field => {
        if (params.has(field)) {
            const val = params.get(field);
            configuracionActual[field] = val;

            const selectElement = document.getElementById(field);
            if (selectElement && [...selectElement.options].some(opt => opt.value === val)) {
                selectElement.value = val;
            }
        }
    });
}

// ── Event listeners ─────────────────────────────────────────
function setupEventListeners() {
    document.getElementById('modelo')?.addEventListener('change', actualizarVista);
    document.getElementById('color')?.addEventListener('change', actualizarVista);
    document.getElementById('llantas')?.addEventListener('change', actualizarVista);
    document.getElementById('suspension')?.addEventListener('change', actualizarVista);

    document.getElementById('guardarConfig')?.addEventListener('click', guardarConfiguracion);
}

// ── Actualizar vista ────────────────────────────────────────
function actualizarVista() {
    if (document.getElementById('modelo')) configuracionActual.modelo = document.getElementById('modelo').value;
    if (document.getElementById('color')) configuracionActual.color = document.getElementById('color').value;
    if (document.getElementById('llantas')) configuracionActual.llantas = document.getElementById('llantas').value;
    if (document.getElementById('suspension')) configuracionActual.suspension = document.getElementById('suspension').value;

    renderizarCoche();
}

// ── Renderizar coche con posiciones dinámicas ───────────────
function renderizarCoche() {
    const modelo = CATALOGO[configuracionActual.modelo];
    if (!modelo) return;

    const imgCarroceria = document.getElementById('capa-carroceria');
    const imgRuedaDel = document.getElementById('capa-rueda-delantera');
    const imgRuedaTras = document.getElementById('capa-rueda-trasera');
    const contenedor = document.getElementById('contenedor-suspension');

    // 1. Carrocería — cambiar imagen según modelo + color
    if (imgCarroceria) {
        const srcCarroceria = modelo.colores[configuracionActual.color];
        if (srcCarroceria) {
            imgCarroceria.src = srcCarroceria;
        }
    }

    // 2. Ruedas — aplicar posiciones específicas del modelo
    if (imgRuedaDel) {
        const rd = modelo.ruedaDelantera;
        imgRuedaDel.src = RUEDAS[configuracionActual.llantas] || RUEDAS.clasica;
        imgRuedaDel.style.top = rd.top + 'px';
        imgRuedaDel.style.left = rd.left + 'px';
        imgRuedaDel.style.width = rd.width + 'px';
        imgRuedaDel.style.height = rd.height + 'px';
    }

    if (imgRuedaTras) {
        const rt = modelo.ruedaTrasera;
        imgRuedaTras.src = RUEDAS[configuracionActual.llantas] || RUEDAS.clasica;
        imgRuedaTras.style.top = rt.top + 'px';
        imgRuedaTras.style.left = rt.left + 'px';
        imgRuedaTras.style.width = rt.width + 'px';
        imgRuedaTras.style.height = rt.height + 'px';
    }

    // 3. Contenedor — ajustar dimensiones al modelo
    if (contenedor) {
        contenedor.style.width = modelo.ancho + 'px';
        contenedor.style.height = modelo.alto + 'px';

        // 4. Suspensión — offset específico del modelo
        const offset = modelo.suspension[configuracionActual.suspension] || 0;
        contenedor.style.transform = `translateY(${offset}px)`;
    }
}

// ── Guardar / actualizar ────────────────────────────────────
function guardarConfiguracion() {
    const btn = document.getElementById('guardarConfig');
    const esEdicion = editandoId !== null;

    const payload = { ...configuracionActual };
    if (esEdicion) {
        payload.id = editandoId;
        payload.accion = 'actualizar';
    }

    btn.disabled = true;
    btn.innerHTML = esEdicion ? '⏳ Actualizando...' : '⏳ Guardando...';

    fetch(API_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (response.status === 401) {
                mostrarMensaje('error', 'Debes iniciar sesión para guardar configuraciones.');
                throw new Error('NO_SESSION');
            }
            return response.json();
        })
        .then(data => {
            btn.disabled = false;

            if (data && data.success) {
                const textoExito = esEdicion
                    ? '✅ ¡Configuración actualizada!'
                    : '✅ ¡Guardado en el Garaje!';

                btn.innerHTML = textoExito;
                btn.style.backgroundColor = 'rgba(82,226,82,0.2)';
                btn.style.color = '#52e252';
                btn.style.boxShadow = '0 0 15px #52e252';
                mostrarMensaje('exito', data.message || textoExito);

                if (!esEdicion && data.id) {
                    editandoId = data.id;
                    const params = new URLSearchParams({ id: editandoId, ...configuracionActual });
                    window.history.replaceState({}, '', `configurador.html?${params.toString()}`);
                }

                setTimeout(() => {
                    btn.innerHTML = '💾 Actualizar Configuración';
                    btn.style = '';
                }, 3000);
            } else {
                btn.innerHTML = esEdicion ? '💾 Actualizar Configuración' : '💾 Guardar Configuración';
                mostrarMensaje('error', data ? data.message : 'Error desconocido.');
            }
        })
        .catch(error => {
            btn.disabled = false;
            btn.innerHTML = esEdicion ? '💾 Actualizar Configuración' : '💾 Guardar Configuración';
            if (error.message !== 'NO_SESSION') {
                console.error('Error:', error);
                mostrarMensaje('error', 'Error de conexión con el servidor.');
            }
        });
}

// ── Mensajes visuales ───────────────────────────────────────
function mostrarMensaje(tipo, texto) {
    const elExito = document.getElementById('mensajeGuardado');
    const elError = document.getElementById('mensajeError');

    if (tipo === 'exito' && elExito) {
        elExito.textContent = texto;
        elExito.style.display = 'block';
        if (elError) elError.style.display = 'none';
        setTimeout(() => { elExito.style.display = 'none'; }, 4000);
    } else if (tipo === 'error' && elError) {
        elError.textContent = texto;
        elError.style.display = 'block';
        if (elExito) elExito.style.display = 'none';
        setTimeout(() => { elError.style.display = 'none'; }, 4000);
    }
}