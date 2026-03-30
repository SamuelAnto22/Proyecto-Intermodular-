// ============================================================
// Configurador de Coches — Midnight Customs (Versión por Capas)
// ============================================================

// Variables globales
let configuracionActual = {
    modelo: 'mini_cooper',
    color: 'rojo',
    llantas: 'clasica',
    suspension: 'stock'
};

// Rutas a las imágenes
const assetsPaths = {
    carroceria: {
        rojo: 'assets/img/mini-rojo.png',
        azul: 'assets/img/mini-azul.png',
        verde: 'assets/img/mini-verde.png'
    },
    llantas: {
        clasica: 'assets/img/rueda-clasica.png',
        deportiva: 'assets/img/rueda-deportiva.png',
        competicion: 'assets/img/rueda-competicion.png'
    }
};

// Ajuste CSS de suspensión (bajar el contenedor simula bajar el coche)
const offsetsSuspension = {
    stock: 'translateY(0px)',
    deportiva: 'translateY(15px)',
    competicion: 'translateY(25px)'
};

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    cargarDesdeURL();
    setupEventListeners();
    actualizarVista();
});

// Cargar configuración desde parámetros de URL (si viene del garaje)
function cargarDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    
    const fields = ['modelo', 'color', 'llantas', 'suspension'];
    fields.forEach(field => {
        if (params.has(field)) {
            const val = params.get(field);
            configuracionActual[field] = val;
            
            // Si el valor existe en el desplegable, lo seleccionamos
            const selectElement = document.getElementById(field);
            if(selectElement && [...selectElement.options].some(opt => opt.value === val)) {
                selectElement.value = val;
            }
        }
    });
}

// Configurar los listeners de los selectores
function setupEventListeners() {
    document.getElementById('modelo')?.addEventListener('change', actualizarVista);
    document.getElementById('color')?.addEventListener('change', actualizarVista);
    document.getElementById('llantas')?.addEventListener('change', actualizarVista);
    document.getElementById('suspension')?.addEventListener('change', actualizarVista);

    document.getElementById('guardarConfig')?.addEventListener('click', guardarConfiguracion);
}

// Recoger valores del DOM y actualizar
function actualizarVista() {
    if(document.getElementById('modelo')) configuracionActual.modelo = document.getElementById('modelo').value;
    if(document.getElementById('color')) configuracionActual.color = document.getElementById('color').value;
    if(document.getElementById('llantas')) configuracionActual.llantas = document.getElementById('llantas').value;
    if(document.getElementById('suspension')) configuracionActual.suspension = document.getElementById('suspension').value;

    renderizarCoche();
}

// Aplicar los visuales al Visor de Capas
function renderizarCoche() {
    // 1. Carrocería
    const imgCarroceria = document.getElementById('capa-carroceria');
    if (imgCarroceria && assetsPaths.carroceria[configuracionActual.color]) {
        imgCarroceria.src = assetsPaths.carroceria[configuracionActual.color];
    }

    // 2. Ruedas
    const imgRuedaDel = document.getElementById('capa-rueda-delantera');
    const imgRuedaTras = document.getElementById('capa-rueda-trasera');
    
    if (imgRuedaDel && imgRuedaTras && assetsPaths.llantas[configuracionActual.llantas]) {
        const srcLlantas = assetsPaths.llantas[configuracionActual.llantas];
        imgRuedaDel.src = srcLlantas;
        imgRuedaTras.src = srcLlantas;
    }

    // 3. Suspensión (animar CSS transform)
    const contenedorSuspension = document.getElementById('contenedor-suspension');
    if (contenedorSuspension && offsetsSuspension[configuracionActual.suspension]) {
        contenedorSuspension.style.transform = offsetsSuspension[configuracionActual.suspension];
    }
}

// Guardar configuración en el servidor
function guardarConfiguracion() {
    fetch('../servidor/api/guardar_config.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(configuracionActual)
    })
    .then(response => {
        if (response.status === 401) {
            alert('Debes iniciar sesión para guardar configuraciones.');
            window.location.href = 'login.html';
            throw new Error('NO_SESSION');
        }
        return response.json();
    })
    .then(data => {
        if (data && data.success) {
            const btn = document.getElementById('guardarConfig');
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ ¡Guardado en el Garaje!';
            btn.style.backgroundColor = 'rgba(82,226,82,0.2)';
            btn.style.color = '#52e252';
            btn.style.boxShadow = '0 0 15px #52e252';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style = ''; // Reset inline styles
            }, 3000);
        } else {
            alert('Error al guardar: ' + (data ? data.message : 'Error desconocido.'));
        }
    })
    .catch(error => {
        if (error.message !== 'NO_SESSION') {
            console.error('Error:', error);
            alert('Error de conexión con el servidor.');
        }
    });
}