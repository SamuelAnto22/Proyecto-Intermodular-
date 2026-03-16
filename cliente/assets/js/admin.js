// ============================================================
// Admin Panel — Carga pedidos reales desde la API
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    cargarPedidos();
});

function cargarPedidos() {
    const pedidosBody = document.getElementById('pedidos-body');

    fetch('../servidor/api/pedidos.php')
        .then(response => {
            if (response.status === 401) {
                pedidosBody.innerHTML = '<tr><td colspan="6">Debes iniciar sesión. <a href="login.html">Ir al login</a></td></tr>';
                throw new Error('NO_SESSION');
            }
            if (response.status === 403) {
                pedidosBody.innerHTML = '<tr><td colspan="6">Acceso solo para administradores.</td></tr>';
                throw new Error('FORBIDDEN');
            }
            return response.json();
        })
        .then(data => {
            if (!data.ok || data.data.length === 0) {
                pedidosBody.innerHTML = '<tr><td colspan="6">No hay pedidos registrados.</td></tr>';
                return;
            }

            pedidosBody.innerHTML = '';

            data.data.forEach(pedido => {
                const estadoClass = pedido.estado.toLowerCase().replace(' ', '-');
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${pedido.id}</td>
                    <td>${pedido.cliente}</td>
                    <td>${pedido.modelo}</td>
                    <td><span class="estado ${estadoClass}">${pedido.estado}</span></td>
                    <td>${pedido.fecha}</td>
                    <td>
                        <button class="btn-accion edit" onclick="cambiarEstado(${pedido.id}, '${pedido.estado}')">Estado</button>
                        <button class="btn-accion delete" onclick="eliminarPedido(${pedido.id})">Borrar</button>
                    </td>
                `;
                pedidosBody.appendChild(row);
            });
        })
        .catch(error => {
            if (error.message !== 'NO_SESSION' && error.message !== 'FORBIDDEN') {
                console.error('Error cargando pedidos:', error);
                pedidosBody.innerHTML = '<tr><td colspan="6">Error de conexión con el servidor.</td></tr>';
            }
        });
}

function cambiarEstado(id, estadoActual) {
    const estados = ['pendiente', 'en proceso', 'terminado'];
    const indiceActual = estados.indexOf(estadoActual);
    const siguiente = estados[(indiceActual + 1) % estados.length];

    if (!confirm(`¿Cambiar estado del pedido #${id} a "${siguiente}"?`)) return;

    fetch('../servidor/api/pedidos.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, estado: siguiente })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            cargarPedidos();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Error de conexión.');
    });
}

function eliminarPedido(id) {
    if (!confirm('¿Seguro que quieres borrar el pedido #' + id + '?')) return;

    fetch('../servidor/api/pedidos.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            cargarPedidos();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Error de conexión.');
    });
}
