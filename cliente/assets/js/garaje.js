// ============================================================
// Mi Garaje — Carga configuraciones reales desde la API
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    cargarProyectos();
});

function cargarProyectos() {
    const listaProyectos = document.getElementById('proyectos-lista');

    fetch('../servidor/api/guardar_config.php')
        .then(response => {
            if (response.status === 401) {
                listaProyectos.innerHTML = '<p>Debes iniciar sesión para ver tu garaje. <a href="login.html">Ir al login</a></p>';
                throw new Error('NO_SESSION');
            }
            return response.json();
        })
        .then(data => {
            if (!data.ok || data.data.length === 0) {
                listaProyectos.innerHTML = '<p>No tienes proyectos guardados todavía. <a href="configurador.html">Crea uno aquí</a></p>';
                return;
            }

            listaProyectos.innerHTML = '';

            data.data.forEach(proyecto => {
                const card = document.createElement('div');
                card.className = 'proyecto-card';
                card.innerHTML = `
                    <div class="proyecto-info">
                        <h4>${proyecto.modelo}</h4>
                        <p>Color: ${proyecto.color}</p>
                        <p>Llantas: ${proyecto.llantas}</p>
                        <p>Suspensión: ${proyecto.suspension}</p>
                        <small>Guardado el: ${proyecto.created_at}</small>
                        ${proyecto.pedido_estado ? `<p><span class="estado ${proyecto.pedido_estado.replace(' ', '-')}">${proyecto.pedido_estado}</span></p>` : ''}
                    </div>
                    <div class="proyecto-actions">
                        <button class="btn-primary btn-sm" onclick="cargarEnConfigurador('${proyecto.modelo}', '${proyecto.color}', '${proyecto.llantas}', '${proyecto.suspension}')">Cargar</button>
                        <button class="btn-danger btn-sm" onclick="borrarProyecto(${proyecto.id})">Borrar</button>
                    </div>
                `;
                listaProyectos.appendChild(card);
            });
        })
        .catch(error => {
            if (error.message !== 'NO_SESSION') {
                console.error('Error cargando proyectos:', error);
                listaProyectos.innerHTML = '<p>Error de conexión con el servidor.</p>';
            }
        });
}

function cargarEnConfigurador(modelo, color, llantas, suspension) {
    const params = new URLSearchParams({ modelo, color, llantas, suspension });
    window.location.href = `configurador.html?${params.toString()}`;
}

function borrarProyecto(id) {
    if (!confirm('¿Seguro que quieres borrar este proyecto de tu garaje?')) return;

    fetch('../servidor/api/guardar_config.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            cargarProyectos();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Error de conexión.');
    });
}
