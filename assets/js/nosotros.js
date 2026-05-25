// nosotros.js — Lógica del vídeo en la página Nosotros

const wrapper = document.getElementById('videoWrapper');
const video = document.getElementById('videoPromo');
const overlay = document.getElementById('videoOverlay');

if (wrapper && video && overlay) {
    function reproducirVideo() {
        video.style.display = 'block';
        overlay.style.display = 'none';

        video.play().catch(error => {
            console.log("Error cargando el vídeo:", error);
            video.style.display = 'none';
            overlay.style.display = 'flex';
        });
    }

    wrapper.addEventListener('click', reproducirVideo);

    wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            reproducirVideo();
        }
    });
}
