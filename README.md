## MIDNIGHT CUSTOMS - Proyecto Final DAW

¡Hola! Este es el proyecto de Midnight Customs. Lo hemos hecho para el Proyecto Intermodular de final de ciclo de DAW (Desarrollo de Aplicaciones Web).

La idea es sencilla: un sitio donde puedas "tunear" coches de alta gama de forma visual antes de gastarte la pasta de verdad.

## ¿De qué va esto?

Es una web para un taller de personalización de coches. Queremos que el cliente pueda ver cómo queda su coche cambiando cuatro cosas básicas:
- **Catálogo**: Para ver lo que ya hemos hecho y pillar ideas.
- **Configurador**: El plato fuerte. Eliges un coche, le cambias las llantas, el color y la altura, y lo ves en directo (usando fotos PNG con transparencias).
- **Panel de Admin**: Para que el mecánico vea lo que ha pedido el cliente y no se vuelva loco.

## Tecnologías que hemos usado

No nos hemos querido liar con frameworks raros, así que hemos ido a lo que sabemos:
- **HTML, CSS y JavaScript (a pelo)**: Para que el configurador vaya rápido y se entienda bien el código.
- **PHP**: Para guardar los usuarios y los coches en la base de datos.
- **MySQL**: Donde guardamos todo el lío de los pedidos y configuraciones.
- **XAMPP**: Para hacerlo rular en local.

## Estructura de carpetas (cómo está organizado)

Aquí te explico dónde está cada cosa por si te pierdes:

- `/cliente`: Todo lo que se ve en el navegador (el diseño).
  - `/assets`:
    - `/css`: Los estilos de la web.
    - `/js`: Los archivos de JavaScript (lógica del configurador, etc).
    - `/img`: Las fotos de los coches, las llantas y demás.
- `/servidor`: El "cerebro" de la web.
  - `/api`: Los archivos PHP que conectan con la base de datos.
  - `/includes`: Cosas que repetimos mucho, como la conexión a la base de datos.
  - `/sql`: El archivo para crear las tablas de la base de datos.

## Cómo hacerlo funcionar en tu PC

1. Instala **XAMPP**.
2. Mete la carpeta del proyecto en `C:/xampp/htdocs/`.
3. Abre **phpMyAdmin** y crea una base de datos que se llame `midnight_customs` (o lo que quieras).
4. Importa el archivo que está en `servidor/sql/schema.sql`.
5. Cambia los datos de conexión en `servidor/includes/db.php` si le has puesto contraseña al MySQL.
6. Entra en `http://localhost/Proyecto-Intermodular-/cliente/index.html` y ¡listo!

## Cosas que queremos mejorar (si nos da tiempo)

- [ ] Meter más modelos de coches y más tipos de llantas.
- [ ] Que se puedan descargar las fotos del coche tuneado.
- [ ] Poner un sistema de login más seguro.
- [ ] Que la web se vea bien en el móvil (ahora está pensada para PC).

Hecho con ganas para el proyecto final de DAW.

