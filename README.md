# 🚗💨 MIDNIGHT CUSTOMS - Proyecto Final DAW

Bienvenido al repositorio de **Midnight Customs**. Este es nuestro Proyecto Intermodular de final de ciclo.

## 🎯 ¿De qué va esto?
Vamos a crear una aplicación web para un **taller de personalización de vehículos de alta gama**.
No es el típico taller de "cambio de aceite". La idea es digitalizar el proceso de **tuning**, permitiendo a los clientes **visualizar cómo quedará su coche** antes de gastar dinero.

**Inspiración:** Estética *Underground* / *GTA V Benny's Motor Works*, pero usando **piezas y coches reales**.

### 🌟 Funcionalidades Clave (MVP)
1.  **Catálogo Visual:** Ver coches reales modificados.
2.  **El Configurador (La Joya):** El usuario elige un coche, le cambia las llantas, el color y la suspensión, y ve el resultado al momento (Visualización 2D por capas).
3.  **Gestión de Taller (Admin):** El mecánico recibe el pedido, ve qué piezas necesita y gestiona la cita.

---

## 🛠️ Tecnologías (Stack)
Vamos a usar un stack moderno pero sencillo para no complicarnos:

* **Frontend (La Cara):** React.js (con Vite) + Tailwind CSS (para el diseño Neón/Dark).
* **Backend (El Cerebro):** Node.js + Express.
* **Base de Datos:** MySQL (Para guardar usuarios, coches y pedidos).
* **Imágenes:** Archivos locales o Cloudinary.

---

## 📂 Estructura del Proyecto
Para no liarnos, el proyecto tiene solo dos carpetas principales:

```text
midnight-customs/
├── backend/            # Todo lo del Servidor
│   ├── server.js       # Archivo principal (Arranca la API)
│   ├── database.js     # Conexión a MySQL
│   ├── routes.js       # Las rutas (login, getCoches...)
│   └── tablas.sql      # Copia de seguridad de la estructura de la BD
│
└── frontend/           # Todo lo de la Web (React)
    ├── src/
    │   ├── pages/      # Pantallas (Home, Login, Garaje, Admin)
    │   ├── components/ # Piezas sueltas (Navbar, Botones)
    │   └── assets/     # Las fotos de los coches y piezas (.png)
    └── ...
