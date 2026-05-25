# MIDNIGHT CUSTOMS - Proyecto Intermodular (2º DAW)

## Descripción

**Midnight Customs** es una aplicación Web dinámica (Vanilla JS, HTML/CSS, PHP, MySQL) que permite a los usuarios **configurar virtualmente coches de alta gama** antes de su modificación real física. Hemos construido este proyecto como desarrollo final para el grado superior de DAW.

El objetivo pedagógico y técnico del proyecto es:
1. **Frontend puro y responsivo**: Sin el "peso" de frameworks, hemos diseñado componentes modernos (Glassmorphism, CSS Grid) orientados a una interactividad total al momento de elegir el coche, sus componentes y guardar las decisiones.
2. **Backend robusto y seguro**: Sistema de autenticación de dos niveles (clientes y administradores), validación de parámetros, CORS local y prevención XSS.
3. **Flujo completo de persistencia**: El cliente diseña el coche (el cliente web empareja fotos separadas usando posicionamiento dinámico absoluto y escalado), lo guarda en su Garaje Personal y el Administrador puede cambiar los estados de fabricación ("Solicitado", "En Proceso", etc).

---

##  Guía de Instalación para Profesores/Evaluadores

1. Copiar este proyecto en la carpeta del servidor local (e.g. `C:/xampp/htdocs/Proyecto-Intermodular-`).
2. Levantar los servicios de **Apache** y **MySQL** desde el panel de XAMPP.
3. Importar la Base de Datos con todos los datos de demostración incluidos.
   - Ir a **phpMyAdmin** (`http://localhost/phpmyadmin`).
   - Importar el archivo alojado en `server/sql/midnight_demo.sql`. Este archivo crea la BD automáticamente y le inserta datos de demostración para no evaluar un sistema en blanco.
4. Confirmar las credenciales en `server/includes/db.php` si tiene configurada otra contraseña en su motor MySQL local (por defecto asume `root` sin contraseña).
5. Visitar a través de localhost: [http://localhost/Proyecto-Intermodular-/](http://localhost/Proyecto-Intermodular-/) *(acceso directo desde la raíz de la carpeta)*.

---

##  Credenciales de Prueba Rápida

La base de datos de demo de este script (*midnight_demo.sql*) trae preconfiguradas las siguientes cuentas:

### Perfil Administrador
Cuenta con acceso al panel global financiero para el estado de los proyectos de todos los usuarios. No ve el Garaje ni puede usar el configurador porque su flujo es gestor, no comprador.
* **Email:** `admin@midnight.com`
* **Contraseña:** `admin123`

### Perfil Cliente (con pedidos)
Tiene acceso al configurador interactivo y un garaje donde ve la progresión del proyecto que el taller debe realizarle al coche.
* **Email:** `carlos@ejemplo.com`
* **Contraseña:** `cliente123`

---

##  Checklist de Pruebas recomendadas para el Profesor

Hemos diseñado una experiencia con atención al detalle que pedimos encarecidamente probar para validar la evaluación:

1. [ ] **Responsive Design & Accesibilidad:**
   - La plataforma puede inspeccionarse perfectamente desde móvil (presionando F12 > Device Toolbar de Chrome y probando anchos pequeños de <380px). Se adaptan las Grid y las tablas sin problemas.
   - Navegue por los apartados usando exclusivamente la tecla **TAB**. Hemos garantizado el foco visual global y correcto uso de links.

2. [ ] **El motor visual del Configurador:**
   - Inicie sesión como Cliente. Vaya al *Configurador*.
   - Juegue con el selector de coches, rines (llantas) y colores. Se dará cuenta de que las "luces/sombras" no cambian, porque utilizamos PNGs superpuestos estratégicamente en Z-index y posiciones absolutas. Además, al empequeñecer la pantalla en el móvil, notará que **el coche en conjunto hace un "scale" matemático inteligente** para no salirse de los márgenes en pantallas estrechas. Todo puramente en el `configurador.js`.

3. [ ] **Carga Dinámica del Sistema (Mi Garaje):**
   - Vaya a la sección **Mi Garaje** de Carlos. Utiliza la API y `fetch()` asíncrono puro para renderizar las tarjetas a un `GRID` desde JSON sin recargar toda la página desde PHP, y le dará un feedback suave de *Toast Notifications*.
   - Intente "Editar" un coche y ver cómo la URL hereda limpiamente los detalles mediante *URLSearchParams*. Podrá reenviar el estado visual anterior del coche al configurador.

4. [ ] **Gestión como Administrador:**
   - Cierre sesión. Podrá ver que las cookies se limpian (seguridad del día 1). Inicie sesión usando el Admin (`admin@midnight.com`).
   - Fíjese cómo automáticamente el script general interviene (`sesion.php` -> `main.js`) detectando su ROL y cambiando la *Navigation* global (quita 'Configurador', le manda un atajo a 'Panel Admin', e inyecta un *Dashboard* con los datos de todos los clientes).
   - Intente cambiar el estado desplegable de cualquier producto ("En proceso", "Terminado") de un cliente. Los cambios de estado no recargan la página, lanzan promesas asíncronas de POST muy eficientes al fondo.

---

## Arquitectura de Ficheros

*   `assets/`: Lógica FrontEnd (CSS, JS, imágenes), interactiva a base de HTML estáticos en la raíz, Vanilla JS usando asincronismo para las mutaciones y Custom CSS puro sin librerías externas.
*   `server/api/`: Lógica BackEnd de transferencia POST/GET. Cada endpoint es único en `.php` usando cabeceras JSON, devolviendo HTTP Codes y verificaciones de sesión/XSS contra MySQL en formato **PDO** con variables pre-limpiadas preparadas (`?`) anti SQLi.
*   `server/sql/`: Los esquemas y los tests de base de datos automatizados instalables.

¡Gracias por evaluar este proyecto final! Esperamos que os guste.
