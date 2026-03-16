// ============================================================
// Configurador de Coches — Midnight Customs
// ============================================================

// Variables globales
let configuracionActual = {
    modelo: 'bmw_m3',
    color: 'negro',
    llantas: 'sport_19',
    suspension: 'deportiva'
};

// Mapas de nombres legibles
const nombresModelo = {
    bmw_m3: 'BMW M3',
    audi_rs6: 'Audi RS6',
    mercedes_amg: 'Mercedes AMG GT'
};

const nombresColor = {
    negro: 'Negro Midnight',
    blanco: 'Blanco Perlado',
    rojo: 'Rojo Racing',
    azul: 'Azul Metalizado'
};

const nombresLlantas = {
    sport_19: 'Sport 19"',
    racing_20: 'Racing 20"',
    custom_21: 'Custom 21"'
};

const nombresSuspension = {
    deportiva: 'Deportiva (-30mm)',
    competicion: 'Competición (-50mm)',
    stock: 'Stock (Original)'
};

// Colores para el canvas
const coloresHex = {
    negro: '#1a1a1a',
    blanco: '#e8e8e8',
    rojo: '#cc2233',
    azul: '#2255cc'
};

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    cargarDesdeURL();
    setupEventListeners();
    renderizarCoche();
});

// Cargar configuración desde parámetros de URL (si viene del garaje)
function cargarDesdeURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('modelo'))     {
        configuracionActual.modelo = params.get('modelo');
        document.getElementById('modelo').value = params.get('modelo');
    }
    if (params.has('color'))      {
        configuracionActual.color = params.get('color');
        document.getElementById('color').value = params.get('color');
    }
    if (params.has('llantas'))    {
        configuracionActual.llantas = params.get('llantas');
        document.getElementById('llantas').value = params.get('llantas');
    }
    if (params.has('suspension')) {
        configuracionActual.suspension = params.get('suspension');
        document.getElementById('suspension').value = params.get('suspension');
    }
}

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

// Renderizar el coche en el canvas
function renderizarCoche() {
    const canvas = document.getElementById('cocheCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Fondo degradado
    const grad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, 400);
    grad.addColorStop(0, '#222');
    grad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Suelo reflejo
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    // Color del coche
    const colorCoche = coloresHex[configuracionActual.color] || '#1a1a1a';

    // Cuerpo del coche (silueta simplificada)
    ctx.save();
    ctx.translate(w * 0.15, h * 0.3);

    // Carrocería
    ctx.fillStyle = colorCoche;
    ctx.beginPath();
    ctx.moveTo(50, 200);
    ctx.lineTo(80, 120);
    ctx.lineTo(180, 70);
    ctx.lineTo(380, 60);
    ctx.lineTo(480, 100);
    ctx.lineTo(520, 150);
    ctx.lineTo(530, 200);
    ctx.lineTo(50, 200);
    ctx.closePath();
    ctx.fill();

    // Brillo superior
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(100, 120);
    ctx.lineTo(180, 75);
    ctx.lineTo(380, 65);
    ctx.lineTo(460, 100);
    ctx.lineTo(100, 120);
    ctx.closePath();
    ctx.fill();

    // Ventanas
    ctx.fillStyle = 'rgba(100,150,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(185, 75);
    ctx.lineTo(280, 72);
    ctx.lineTo(275, 120);
    ctx.lineTo(190, 118);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(290, 72);
    ctx.lineTo(380, 66);
    ctx.lineTo(420, 100);
    ctx.lineTo(285, 120);
    ctx.closePath();
    ctx.fill();

    // Línea inferior
    ctx.fillStyle = '#111';
    ctx.fillRect(50, 195, 480, 15);

    // Ruedas
    const tamañoRueda = configuracionActual.llantas === 'custom_21' ? 45
                      : configuracionActual.llantas === 'racing_20' ? 40
                      : 35;

    dibujarRueda(ctx, 130, 205, tamañoRueda);
    dibujarRueda(ctx, 430, 205, tamañoRueda);

    ctx.restore();

    // Info texto
    ctx.fillStyle = 'rgba(255,102,0,0.9)';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText(nombresModelo[configuracionActual.modelo] || configuracionActual.modelo, 30, 40);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText(nombresColor[configuracionActual.color] || configuracionActual.color, 30, h - 60);
    ctx.fillText(nombresLlantas[configuracionActual.llantas] || configuracionActual.llantas, 30, h - 40);
    ctx.fillText(nombresSuspension[configuracionActual.suspension] || configuracionActual.suspension, 30, h - 20);
}

// Dibujar una rueda con llantas
function dibujarRueda(ctx, x, y, radio) {
    // Neumático
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, Math.PI * 2);
    ctx.fill();

    // Llanta
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(x, y, radio * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Centro
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x, y, radio * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Radios de la llanta
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * radio * 0.2, y + Math.sin(angle) * radio * 0.2);
        ctx.lineTo(x + Math.cos(angle) * radio * 0.6, y + Math.sin(angle) * radio * 0.6);
        ctx.stroke();
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
        if (data.success) {
            alert('¡Configuración guardada correctamente!');
        } else {
            alert('Error al guardar: ' + data.message);
        }
    })
    .catch(error => {
        if (error.message !== 'NO_SESSION') {
            console.error('Error:', error);
            alert('Error de conexión con el servidor');
        }
    });
}