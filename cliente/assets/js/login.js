document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                e.preventDefault();
                alert('Por favor, rellena todos los campos.');
            }
            
            // Simulación de login exitoso para el flujo del cliente
            // console.log('Intentando login para:', email);
        });
    }
});
