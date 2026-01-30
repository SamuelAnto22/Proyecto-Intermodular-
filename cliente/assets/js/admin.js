// Simulación de carga de pedidos para el panel de admin
document.addEventListener('DOMContentLoaded', function() {
    cargarPedidos();
});

function cargarPedidos() {
    const pedidosBody = document.getElementById('pedidos-body');
    
    // Simulamos una llamada a la API
    // En el futuro esto será: fetch('../servidor/api/pedidos.php')
    
    setTimeout(() => {
        const pedidosSimulados = [
            { id: 1, cliente: 'Juan Pérez', modelo: 'BMW M3', estado: 'Pendiente', fecha: '2025-05-20' },
            { id: 2, cliente: 'Maria García', modelo: 'Audi RS6', estado: 'En proceso', fecha: '2025-05-18' },
            { id: 3, cliente: 'Carlos Ruiz', modelo: 'Mercedes AMG GT', estado: 'Terminado', fecha: '2025-05-15' }
        ];

        if (pedidosSimulados.length === 0) {
            pedidosBody.innerHTML = '<tr><td colspan="6">No hay pedidos registrados.</td></tr>';
            return;
        }

        pedidosBody.innerHTML = ''; // Limpiar el "Cargando..."

        pedidosSimulados.forEach(pedido => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${pedido.id}</td>
                <td>${pedido.cliente}</td>
                <td>${pedido.modelo}</td>
                <td><span class="estado ${pedido.estado.toLowerCase().replace(' ', '-')}">${pedido.estado}</span></td>
                <td>${pedido.fecha}</td>
                <td>
                    <button class="btn-accion edit" onclick="verDetalles(${pedido.id})">Ver</button>
                    <button class="btn-accion delete" onclick="eliminarPedido(${pedido.id})">Borrar</button>
                </td>
            `;
            pedidosBody.appendChild(row);
        });
    }, 1000);
}

function verDetalles(id) {
    alert('Viendo detalles del pedido #' + id);
}

function eliminarPedido(id) {
    if(confirm('¿Seguro que quieres borrar el pedido #' + id + '?')) {
        alert('Pedido eliminado (simulación)');
        cargarPedidos(); // Recargar
    }
}
