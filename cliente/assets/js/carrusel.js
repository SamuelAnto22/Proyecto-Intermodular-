// Lógica general del carrusel de proyectos con accesibilidad
export function inicializarCarrusel() {
    const diapositivas = document.querySelectorAll('.carrusel-diapositiva');
    const contenedorInd = document.getElementById('carruselIndicadores');
    const miniaturas = document.querySelectorAll('#carruselMiniaturas img');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');

    if (!diapositivas.length || !contenedorInd) return;

    let indiceActual = 0;
    let intervalo;

    // Crear indicadores con roles ARIA
    diapositivas.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-label', `Ir a diapositiva ${i + 1}`);
        btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        if (i === 0) btn.classList.add('activa');
        btn.addEventListener('click', () => irA(i));
        contenedorInd.appendChild(btn);
    });

    function irA(indice) {
        diapositivas[indiceActual].classList.remove('activa');
        const indicators = contenedorInd.children;
        if (indicators[indiceActual]) {
            indicators[indiceActual].classList.remove('activa');
            indicators[indiceActual].setAttribute('aria-selected', 'false');
        }
        if (miniaturas[indiceActual]) miniaturas[indiceActual].classList.remove('activa');
        indiceActual = (indice + diapositivas.length) % diapositivas.length;
        diapositivas[indiceActual].classList.add('activa');
        if (indicators[indiceActual]) {
            indicators[indiceActual].classList.add('activa');
            indicators[indiceActual].setAttribute('aria-selected', 'true');
        }
        if (miniaturas[indiceActual]) miniaturas[indiceActual].classList.add('activa');
    }

    function siguiente() { irA(indiceActual + 1); }
    function anterior() { irA(indiceActual - 1); }

    if (btnSiguiente) {
        btnSiguiente.setAttribute('aria-label', 'Diapositiva siguiente');
        btnSiguiente.addEventListener('click', () => { siguiente(); reiniciarIntervalo(); });
    }
    if (btnAnterior) {
        btnAnterior.setAttribute('aria-label', 'Diapositiva anterior');
        btnAnterior.addEventListener('click', () => { anterior(); reiniciarIntervalo(); });
    }

    miniaturas.forEach((img, i) => {
        // Mejorar textos alt de miniaturas
        const textoOriginal = img.alt || `Miniatura ${i + 1}`;
        img.alt = textoOriginal.replace(/^Miniatura \d+/, `Ver diapositiva`);
        img.addEventListener('click', () => { irA(i); reiniciarIntervalo(); });
    });

    // Soporte de teclado: flechas izquierda/derecha
    const carruselVentana = document.getElementById('carruselVentana');
    if (carruselVentana) {
        carruselVentana.setAttribute('tabindex', '0');
        carruselVentana.setAttribute('role', 'tabpanel');
        carruselVentana.setAttribute('aria-label', 'Carrusel de imágenes del proyecto');
        carruselVentana.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                siguiente();
                reiniciarIntervalo();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                anterior();
                reiniciarIntervalo();
            }
        });
    }

    function iniciarIntervalo() { intervalo = setInterval(siguiente, 4000); }
    function reiniciarIntervalo() { clearInterval(intervalo); iniciarIntervalo(); }
    iniciarIntervalo();
}

// Auto-inicializar cuando se carga el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCarrusel);
} else {
    inicializarCarrusel();
}