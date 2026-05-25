// contacto.js — Lógica del formulario de contacto

document.getElementById('formContacto').addEventListener('submit', function (e) {
    e.preventDefault();

    // Si el usuario no ha marcado el tic de la privacidad, cancelo el envío
    const privacidad = document.getElementById('privacidad');
    if (privacidad && !privacidad.checked) return;

    // Oculto el formulario y muestro el mensaje de éxito
    this.style.display = 'none';

    const msg = document.getElementById('msgEnviado');
    if (msg) {
        msg.style.display = 'block';
        msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});
