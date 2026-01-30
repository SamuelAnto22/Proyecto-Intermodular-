// Simulación de carga de proyectos guardados del usuario
document.addEventListener('DOMContentLoaded', function() {
    cargarProyectos();
});

function cargarProyectos() {
    const listaProyectos = document.getElementById('proyectos-lista');
    
    // Simulación de carga desde base de datos
    setTimeout(() => {
        const misProyectos = [
            { id: 101, modelo: 'BMW M3', color: 'Negro Midnight', llantas: 'Racing 20"', fecha: 'Hace 2 días' },
            { id: 102, modelo: 'Audi RS6', color: 'Rojo Racing', llantas: 'Custom 21"', fecha: 'Hace 1 semana' }
        ];

        if (misProyectos.length === 0) {
            listaProyectos.innerHTML = '<p>No tienes proyectos guardados todavía. <a href="configurador.html">Crea uno aquí</a></p>';
            return;
        }

        listaProyectos.innerHTML = ''; // Limpiar mensaje inicial

        misProyectos.forEach(proyecto => {
            const card = document.createElement('div');
            card.className = 'proyecto-card';
            card.innerHTML = `
                <div class="proyecto-info">
                    <h4>${proyecto.modelo}</h4>
                    <p>Color: ${proyecto.color}</p>
                    <p>Llantas: ${proyecto.llantas}</p>
                    <small>Guardado el: ${proyecto.fecha}</small>
                </div>
                <div class="proyecto-actions">
                    <button class="btn-primary btn-sm" onclick="cargarConfiguracion(${proyecto.id})">Cargar</button>
                    <button class="btn-danger btn-sm" onclick="borrarProyecto(${proyecto.id})">Borrar</button>
                </div>
            `;
            listaProyectos.appendChild(card);
        });
    }, 800);
}

function cargarConfiguracion(id) {
    window.location.href = `configurador.html?id=${id}`;
}

function borrarProyecto(id) {
    if(confirm('¿Seguro que quieres borrar este proyecto de tu garaje?')) {
        alert('Proyecto borrado (simulación)');
        cargarProyectos();
    }
}
