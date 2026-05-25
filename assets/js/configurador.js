// ============================================================
// Configurador de Coches — Midnight Customs (Multi-Coche)
// ============================================================

const API_CONFIG = '/Proyecto-Intermodular-/server/api/guardar_config.php';

// ── Estado global ────────────────────────────────────────────
let configuracionActual = {
    modelo: 'mini_cooper',
    color: 'rojo',
    llantas: 'clasica'
};

let editandoId = null;

// ── Catálogo de coches ──────────────────────────────────────
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
        ancho: 640, alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        ruedaDelantera: { top: 62, left: -79, width: 445, height: 304 },
        ruedaTrasera: { top: 62, left: 282, width: 445, height: 304 },
        // Coordenadas exclusivas para móvil:
        carroceriaMovil: { top: -400, left: -228, width: 818, height: 900 },
        ruedaDelanteraMovil: { top: 38, left: -329, width: 568, height: 550 },
        ruedaTraseraMovil: { top: 39, left: 132, width: 568, height: 550 }
    },

    bmw_serie1: {
        nombre: 'BMW Serie 1',
        colores: {
            rojo: 'assets/img/bmw1-rojo.png',
            azul: 'assets/img/bmw1-azul.png',
            verde: 'assets/img/bmw1-verde.png',
            blanco: 'assets/img/bmw1-blanco.png',
            negro: 'assets/img/bmw1-negro.png'
        },
        ancho: 640, alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        carroceriaMovil: { top: -400, left: -220, width: 786, height: 900 },
        ruedaDelantera: { top: -337, left: -79, width: 445, height: 1110 },
        ruedaTrasera: { top: -328, left: 288, width: 445, height: 1100 },
        ruedaDelanteraMovil: { top: 51, left: -329, width: 568, height: 550 },
        ruedaTraseraMovil: { top: 55, left: 128, width: 559, height: 550 }
    },

    audi_a3: {
        nombre: 'Audi A3',
        colores: {
            rojo: 'assets/img/audi-a3-rojo.png',
            azul: 'assets/img/audi-a3-azul.png',
            verde: 'assets/img/audi-a3-verde.png',
            blanco: 'assets/img/audi-a3-blanco .png',
            negro: 'assets/img/audi a3-negro.png',
            gris: 'assets/img/audi-a3-gris.png'
        },
        ancho: 640, alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        carroceriaMovil: { top: -400, left: -213, width: 770, height: 900 },
        ruedaDelantera: { top: 62, left: -91, width: 462, height: 313 },
        ruedaTrasera: { top: 63, left: 290, width: 462, height: 313 },
        ruedaDelanteraMovil: { top: 55, left: -327, width: 568, height: 550 },
        ruedaTraseraMovil: { top: 55, left: 136, width: 559, height: 550 }
    },

    porsche_cayenne: {
        nombre: 'Porsche Cayenne',
        colores: {
            rojo: 'assets/img/porsche-rojo.png',
            azul: 'assets/img/porsche-azul.png',
            verde: 'assets/img/porsche-verde.png',
            blanco: 'assets/img/porsche-blanco.png',
            negro: 'assets/img/porsche-negro.png',
            marron: 'assets/img/porsche-marron.png'
        },
        ancho: 640, alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        carroceriaMovil: { top: -400, left: -213, width: 770, height: 900 },
        ruedaDelantera: { top: 46, left: -102, width: 479, height: 324 },
        ruedaTrasera: { top: 44, left: 262, width: 479, height: 324 },
        ruedaDelanteraMovil: { top: 41, left: -330, width: 568, height: 550 },
        ruedaTraseraMovil: { top: 41, left: 107, width: 568, height: 550 }
    },

    toyota_supra: {
        nombre: 'Toyota Supra',
        colores: {
            rojo: 'assets/img/supra-rojo.png',
            azul: 'assets/img/supra-azul.png',
            verde: 'assets/img/supra-verde.png',
            blanco: 'assets/img/supra-blanco.png',
            negro: 'assets/img/supra-negro.png'
        },
        ancho: 640, alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        carroceriaMovil: { top: -400, left: -206, width: 760, height: 900 },
        ruedaDelantera: { top: 41, left: -87, width: 460, height: 311 },
        ruedaTrasera: { top: 37, left: 266, width: 464, height: 317 },
        ruedaDelanteraMovil: { top: 31, left: -311, width: 550, height: 550 },
        ruedaTraseraMovil: { top: 31, left: 111, width: 550, height: 550 }
    },

    audi_q8: {
        nombre: 'Audi Q8',
        colores: {
            blanco: 'assets/img/audi-q8-blanco.png',
            naranja: 'assets/img/audi-q8-naranja.png'
        },
        ancho: 640, alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        carroceriaMovil: { top: -400, left: -213, width: 770, height: 900 },
        ruedaDelantera: { top: 46, left: -102, width: 479, height: 324 },
        ruedaTrasera: { top: 44, left: 262, width: 479, height: 324 },
        ruedaDelanteraMovil: { top: 41, left: -330, width: 568, height: 550 },
        ruedaTraseraMovil: { top: 41, left: 107, width: 568, height: 550 }
    },

    bmw_i8: {
        nombre: 'BMW i8',
        colores: {
            amarillo: 'assets/img/bmw-i8-amarillo.png',
            azul: 'assets/img/bmw-i8-azul.png'
        },
        ancho: 640, alto: 360,
        carroceria: { top: 0, left: 0, width: '100%', height: '100%' },
        carroceriaMovil: { top: -400, left: -206, width: 760, height: 900 },
        ruedaDelantera: { top: 41, left: -87, width: 460, height: 311 },
        ruedaTrasera: { top: 37, left: 266, width: 464, height: 317 },
        ruedaDelanteraMovil: { top: 31, left: -311, width: 550, height: 550 },
        ruedaTraseraMovil: { top: 31, left: 111, width: 550, height: 550 }
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
    actualizarOpcionesColor();
    actualizarVista();
    window.addEventListener('resize', actualizarEscala);
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

    const fields = ['modelo', 'color', 'llantas'];
    fields.forEach(field => {
        if (params.has(field)) {
            const val = params.get(field);
            configuracionActual[field] = val;
        }
    });

    // Sincronizar el select de modelo primero
    const selectModelo = document.getElementById('modelo');
    if (selectModelo && [...selectModelo.options].some(opt => opt.value === configuracionActual.modelo)) {
        selectModelo.value = configuracionActual.modelo;
    }

    // Actualizar las opciones del select de color según el modelo
    actualizarOpcionesColor();

    // Sincronizar select de color y llantas
    const selectColor = document.getElementById('color');
    if (selectColor && [...selectColor.options].some(opt => opt.value === configuracionActual.color)) {
        selectColor.value = configuracionActual.color;
    }

    const selectLlantas = document.getElementById('llantas');
    if (selectLlantas && [...selectLlantas.options].some(opt => opt.value === configuracionActual.llantas)) {
        selectLlantas.value = configuracionActual.llantas;
    }
}

// ── Event listeners ─────────────────────────────────────────
function setupEventListeners() {
    document.getElementById('modelo')?.addEventListener('change', function() {
        configuracionActual.modelo = this.value;
        actualizarOpcionesColor();
        actualizarVista();
    });
    document.getElementById('color')?.addEventListener('change', actualizarVista);
    document.getElementById('llantas')?.addEventListener('change', actualizarVista);

    document.getElementById('guardarConfig')?.addEventListener('click', guardarConfiguracion);
}

// ── Actualizar opciones de color basadas en el modelo ────────
function actualizarOpcionesColor() {
    const selectColor = document.getElementById('color');
    if (!selectColor) return;

    const modelo = CATALOGO[configuracionActual.modelo];
    if (!modelo) return;

    const colorSeleccionadoPreviamente = configuracionActual.color;

    // Limpiar opciones antiguas
    selectColor.innerHTML = '';

    const nombresColores = {
        rojo: 'Rojo',
        azul: 'Azul',
        verde: 'Verde',
        blanco: 'Blanco',
        negro: 'Negro',
        gris: 'Gris',
        naranja: 'Naranja',
        amarillo: 'Amarillo',
        marron: 'Marrón'
    };

    // Llenar select con los colores del coche actual
    Object.keys(modelo.colores).forEach(col => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = nombresColores[col] || (col.charAt(0).toUpperCase() + col.slice(1));
        selectColor.appendChild(opt);
    });

    // Intentar re-seleccionar el color anterior, si está disponible para el nuevo modelo
    if (modelo.colores[colorSeleccionadoPreviamente]) {
        selectColor.value = colorSeleccionadoPreviamente;
        configuracionActual.color = colorSeleccionadoPreviamente;
    } else {
        const primerColor = Object.keys(modelo.colores)[0];
        selectColor.value = primerColor;
        configuracionActual.color = primerColor;
    }
}

// ── Actualizar vista ────────────────────────────────────────
function actualizarVista() {
    if (document.getElementById('modelo')) configuracionActual.modelo = document.getElementById('modelo').value;
    if (document.getElementById('color')) configuracionActual.color = document.getElementById('color').value;
    if (document.getElementById('llantas')) configuracionActual.llantas = document.getElementById('llantas').value;

    renderizarCoche();
}

// ── Renderizar coche con posiciones dinámicas ───────────────
function renderizarCoche() {
    const modelo = CATALOGO[configuracionActual.modelo];
    if (!modelo) return;

    const imgCarroceria = document.getElementById('capa-carroceria');
    const imgRuedaDel = document.getElementById('capa-rueda-delantera');
    const imgRuedaTras = document.getElementById('capa-rueda-trasera');
    const contenedor = document.getElementById('contenedor-coche');

    // Detectar si estamos en modo móvil (menos de 768px)
    const esMovil = window.innerWidth <= 768;

    // 1. Carrocería
    if (imgCarroceria) {
        const src = modelo.colores[configuracionActual.color];
        if (src) imgCarroceria.src = src;

        // Selección de coordenadas para carrocería
        const c = (esMovil && modelo.carroceriaMovil) ? modelo.carroceriaMovil : modelo.carroceria;

        imgCarroceria.style.top = typeof c.top === 'number' ? c.top + 'px' : c.top;
        imgCarroceria.style.left = typeof c.left === 'number' ? c.left + 'px' : c.left;
        imgCarroceria.style.width = typeof c.width === 'number' ? c.width + 'px' : c.width;
        imgCarroceria.style.height = typeof c.height === 'number' ? c.height + 'px' : c.height;
    }

    // 2. Ruedas — posiciones específicas por modelo
    if (imgRuedaDel) {
        // Priorizar coordenadas móviles si existen y estamos en móvil
        const rd = (esMovil && modelo.ruedaDelanteraMovil) ? modelo.ruedaDelanteraMovil : modelo.ruedaDelantera;

        imgRuedaDel.src = RUEDAS[configuracionActual.llantas] || RUEDAS.clasica;
        imgRuedaDel.style.top = rd.top + 'px';
        imgRuedaDel.style.left = rd.left + 'px';
        imgRuedaDel.style.width = rd.width + 'px';
        imgRuedaDel.style.height = rd.height + 'px';
    }

    if (imgRuedaTras) {
        // Priorizar coordenadas móviles si existen y estamos en móvil
        const rt = (esMovil && modelo.ruedaTraseraMovil) ? modelo.ruedaTraseraMovil : modelo.ruedaTrasera;

        imgRuedaTras.src = RUEDAS[configuracionActual.llantas] || RUEDAS.clasica;
        imgRuedaTras.style.top = rt.top + 'px';
        imgRuedaTras.style.left = rt.left + 'px';
        imgRuedaTras.style.width = rt.width + 'px';
        imgRuedaTras.style.height = rt.height + 'px';
    }

    // 3. Dimensiones del contenedor por modelo
    if (contenedor) {
        contenedor.style.width = modelo.ancho + 'px';
        contenedor.style.height = modelo.alto + 'px';
    }

    // 4. Adaptar escala para móviles
    actualizarEscala();
}

// ── Escalar coche responsivamente ───────────────────────────
function actualizarEscala() {
    const visor = document.getElementById('coche-visor');
    const contenedor = document.getElementById('contenedor-coche');
    if (!visor || !contenedor) return;

    // Ancho real del visor en la pantalla padre
    const anchoVisor = visor.clientWidth;
    // Ancho teórico del coche actual
    const anchoCoche = parseInt(contenedor.style.width) || 640;

    // Si la pantalla es más pequeña que el coche (añadiendo margen para que no se pegue a los bordes)
    if (anchoVisor < (anchoCoche + 40)) {
        const escala = (anchoVisor - 40) / anchoCoche;
        contenedor.style.transform = `scale(${escala})`;
        contenedor.style.transformOrigin = 'center center';
    } else {
        contenedor.style.transform = 'scale(1)';
        contenedor.style.transformOrigin = 'center center';
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
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.__CSRF_TOKEN__ || '' },
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

            if (data && data.ok) {
                const textoExito = esEdicion ? '✅ ¡Configuración actualizada!' : '✅ ¡Guardado en el Garaje!';
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