// Lógica general del carrusel de proyectos
(function () {
    const diapositivas = document.querySelectorAll('.carrusel-diapositiva');
    const contenedorInd = document.getElementById('carruselIndicadores');
    const miniaturas = document.querySelectorAll('#carruselMiniaturas img');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');

    if (!diapositivas.length || !contenedorInd) return;

    let indiceActual = 0;
    let intervalo;

    diapositivas.forEach((_, i) => {
        const btn = document.createElement('button');
        if (i === 0) btn.classList.add('activa');
        btn.addEventListener('click', () => irA(i));
        contenedorInd.appendChild(btn);
    });

    function irA(indice) {
        diapositivas[indiceActual].classList.remove('activa');
        contenedorInd.children[indiceActual].classList.remove('activa');
        if (miniaturas[indiceActual]) miniaturas[indiceActual].classList.remove('activa');
        indiceActual = (indice + diapositivas.length) % diapositivas.length;
        diapositivas[indiceActual].classList.add('activa');
        contenedorInd.children[indiceActual].classList.add('activa');
        if (miniaturas[indiceActual]) miniaturas[indiceActual].classList.add('activa');
    }

    function siguiente() { irA(indiceActual + 1); }
    function anterior() { irA(indiceActual - 1); }
    if (btnSiguiente) btnSiguiente.addEventListener('click', () => { siguiente(); reiniciarIntervalo(); });
    if (btnAnterior) btnAnterior.addEventListener('click', () => { anterior(); reiniciarIntervalo(); });
    miniaturas.forEach((img, i) => { img.addEventListener('click', () => { irA(i); reiniciarIntervalo(); }); });
    function iniciarIntervalo() { intervalo = setInterval(siguiente, 4000); }
    function reiniciarIntervalo() { clearInterval(intervalo); iniciarIntervalo(); }
    iniciarIntervalo();
})();
