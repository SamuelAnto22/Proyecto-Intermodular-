MIDNIGHT CUSTOMS - Proyecto Final DAW

Bienvenido al repositorio de Midnight Customs. Este es nuestro Proyecto Intermodular de final de ciclo para el Grado Superior de Desarrollo de Aplicaciones Web.

 Análisis de Estrategia: Midnight Customs 
Realizar el proyecto mediante PHP nativo y Vanilla JS es una excelente forma de consolidar los conocimientos del ciclo. Esta estrategia nos otorga un control total del código sin depender de frameworks complejos.

 Sobre el Proyecto

Vamos a crear una aplicación web para un taller de personalización de vehículos de alta gama.
La idea es digitalizar el proceso de tuning, permitiendo a los clientes visualizar cómo quedará su coche antes de gastar dinero.

 Funcionalidades Clave 

Catálogo Visual: Exposición de coches reales modificados por el taller.

El Configurador: El usuario elige un coche, le cambia las llantas, el color y la suspensión, y ve el resultado al momento mediante un sistema de visualización 2D por capas.

Gestión de Taller (Admin): El mecánico recibe el pedido, visualiza la configuración elegida por el cliente y gestiona la cita y el estado del vehículo.

 Tecnologías (Stack)

Hemos elegido un stack sólido, nativo y eficiente que garantiza el máximo rendimiento:

Frontend: HTML5, CSS3 y JavaScript Vanilla para la lógica del configurador.

Backend: PHP para la gestión de sesiones, seguridad y lógica de negocio.

Base de Datos: MySQL para la persistencia de usuarios, catálogo de piezas y proyectos.

Servidor: Apache (XAMPP en desarrollo).

 Estructura del Proyecto

El proyecto está organizado de forma modular para facilitar el mantenimiento:

midnight-customs/
├── assets/             # Recursos estáticos
│   ├── css/            # Estilos (style.css)
│   ├── js/             # Lógica del configurador (main.js)
│   └── img/            # Capas PNG de coches y piezas
│
├── includes/           # Trozos de código reutilizables
│   ├── db.php          # Conexión a MySQL
│   ├── auth.php        # Control de sesiones
│   ├── header.php      # Menú de navegación
│   └── footer.php      # Pie de página
│
├── sql/                # Base de Datos
│   └── schema.sql      # Estructura de tablas inicial
│
├── index.php           # Pantalla principal (Landing)
├── login.php           # Acceso de usuarios
├── configurator.php    # El configurador visual
├── garage.php          # Proyectos guardados del usuario
└── admin_panel.php     # Gestión para el taller (Admin)


 Instalación Local

Clonar el repositorio en la carpeta htdocs de vuestro XAMPP.

Importar el archivo sql/schema.sql en phpMyAdmin.

Configurar las credenciales en includes/db.php.

Acceder a http://localhost/midnight-customs.

