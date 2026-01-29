MIDNIGHT CUSTOMS - Proyecto Final DAW

Bienvenido al repositorio de Midnight Customs. Este es nuestro Proyecto Intermodular de final de ciclo para el Grado Superior de Desarrollo de Aplicaciones Web (DAW).

📑 Análisis de Estrategia: Midnight Customs

Realizar el proyecto mediante PHP nativo y Vanilla JS es una excelente forma de consolidar los conocimientos del ciclo. Esta estrategia nos otorga un control total del código sin depender de frameworks complejos, permitiendo una defensa técnica mucho más sólida y profunda.

🏎️ Sobre el Proyecto

Vamos a crear una aplicación web para un taller de personalización de vehículos de alta gama. La idea es digitalizar el proceso de tuning, permitiendo a los clientes visualizar cómo quedará su coche antes de realizar cualquier inversión real.

✨ Funcionalidades Clave

Catálogo Visual: Exposición de coches reales ya modificados por el taller para inspirar a los clientes.

El Configurador: El usuario elige un coche, le cambia las llantas, el color y la suspensión, viendo el resultado al momento mediante un sistema de visualización 2D por capas (PNG transparentes).

Gestión de Taller (Admin): El mecánico recibe el pedido, visualiza la configuración elegida por el cliente y gestiona la cita y el estado actual del vehículo.

🛠️ Tecnologías (Stack)

Hemos elegido un stack sólido, nativo y eficiente que garantiza el máximo rendimiento:

Frontend: HTML5, CSS3 y JavaScript Vanilla para toda la lógica interactiva del configurador.

Backend: PHP para la gestión de sesiones de usuario, seguridad y lógica de negocio en el servidor.

Base de Datos: MySQL para la persistencia de usuarios, catálogo de piezas, coches y proyectos guardados.

Servidor: Apache (entorno XAMPP en desarrollo).

📂 Estructura del Proyecto

El proyecto está organizado de forma modular para facilitar el mantenimiento y la escalabilidad:

midnight-customs/
├── assets/                 # Recursos estáticos
│   ├── css/                # Estilos (style.css)
│   ├── js/                 # Lógica del configurador (main.js)
│   └── img/                # Capas PNG de coches y piezas
│
├── includes/               # Trozos de código reutilizables (PHP)
│   ├── db.php              # Conexión a la base de datos MySQL
│   ├── auth.php            # Control de sesiones y seguridad
│   ├── header.php          # Menú de navegación común
│   └── footer.php          # Pie de página común
│
├── sql/                    # Base de Datos
│   └── schema.sql          # Script de creación de tablas iniciales
│
├── index.php               # Pantalla principal (Landing Page)
├── login.php               # Formulario de acceso de usuarios
├── configurator.php        # Herramienta de personalización visual
├── garage.php              # Proyectos guardados por el usuario
└── admin_panel.php         # Gestión del taller para el administrador


🚀 Instalación Local

Para poner en marcha el proyecto en tu entorno de desarrollo, sigue estos pasos:

Clonar el repositorio dentro de la carpeta htdocs de vuestra instalación de XAMPP.

Importar la base de datos: Accede a phpMyAdmin y carga el archivo situado en sql/schema.sql.

Configurar la conexión: Ajusta las credenciales de acceso a la base de datos en el archivo includes/db.php si es necesario.

Acceder a la web: Abre tu navegador y dirígete a http://localhost/midnight-customs.

Desarrollado para el Proyecto Final de DAW.

Acceder a http://localhost/midnight-customs.

