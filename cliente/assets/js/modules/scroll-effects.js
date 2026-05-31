export function initScrollEffects() {
    const scrollySections = document.querySelectorAll('.seccion-scroll');
    if (scrollySections.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    scrollySections.forEach((section) => observer.observe(section));
}