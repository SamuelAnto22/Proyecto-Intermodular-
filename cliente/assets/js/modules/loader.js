export function initLoader() {
    const pantallaCarga = document.getElementById('loader');
    if (!pantallaCarga) return;

    setTimeout(() => {
        pantallaCarga.classList.add('desvaneciendo');

        setTimeout(() => {
            pantallaCarga.style.display = 'none';
        }, 800);
    }, 1200);
}
