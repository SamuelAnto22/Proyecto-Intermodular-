// Variables globales
let configuracionActual = {
    modelo: 'bmw_m3',
    color: 'negro',
    llantas: 'sport_19',
    suspension: 'deportiva'
};

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    cargarConfiguracion();
    setupEventListeners();
});

// Configurar los listeners de los selectores
function setupEventListeners() {
    document.getElementById('modelo').addEventListener('change', actualizarVista);
    document.getElementById('color').addEventListener('change', actualizarVista);
    document.getElementById('llantas').addEventListener('change', actualizarVista);
    document.getElementById('suspension').addEventListener('change', actualizarVista);
    
    document.getElementById('guardarConfig').addEventListener('click', guardarConfiguracion);
}

// Actualizar la vista del coche
function actualizarVista() {
    configuracionActual.modelo = document.getElementById('modelo').value;
    configuracionActual.color = document.getElementById('color').value;
    configuracionActual.llantas = document.getElementById('llantas').value;
    configuracionActual.suspension = document.getElementById('suspension').value;
    
    renderizarCoche();
}

// Renderizar el coche en el canvas (versión simple)
function renderizarCoche() {
    const canvas = document.getElementById('cocheCanvas');
    const ctx = canvas.getContext('2d');
    
    // Limpiar canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Aquí iría la lógica de cargar las capas PNG y superponerlas
    // Por ahora solo ponemos texto de ejemplo
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('Modelo: ' + configuracionActual.modelo, 50, 100);
    ctx.fillText('Color: ' + configuracionActual.color, 50, 150);
    ctx.fillText('Llantas: ' + configuracionActual.llantas, 50, 200);
    ctx.fillText('Suspensión: ' + configuracionActual.suspension, 50, 250);
    
    // TODO: Aquí se cargarían las imágenes PNG reales
    // ctx.drawImage(imagenCocheBase, 0, 0);
    // ctx.drawImage(imagenLlantas, x, y);
    // etc...
}

// Cargar configuración inicial
function cargarConfiguracion() {
    renderizarCoche();
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
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Configuración guardada correctamente!');
        } else {
            alert('Error al guardar: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión con el servidor');
    });
}