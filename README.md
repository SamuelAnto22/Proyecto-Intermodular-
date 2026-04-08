# MIDNIGHT CUSTOMS - Proyecto Intermodular (2º DAW)

## Descripción

**Midnight Customs** es una aplicación Web dinámica (Vanilla JS, HTML/CSS, PHP, MySQL) que permite a los usuarios **configurar virtualmente coches de alta gama** antes de su modificación real física. Hemos construido este proyecto como desarrollo final para el grado superior de DAW.

El objetivo pedagógico y técnico del proyecto es:
1. **Frontend puro y responsivo**: Sin el "peso" de frameworks, hemos diseñado componentes modernos (Glassmorphism, CSS Grid) orientados a una interactividad total al momento de elegir el coche, sus componentes y guardar las decisiones.
2. **Backend robusto y seguro**: Sistema de autenticación de dos niveles (clientes y administradores), validación de parámetros, CORS local y prevención XSS.
3. **Flujo completo de persistencia**: El cliente diseña el coche (el cliente web empareja fotos separadas usando posicionamiento dinámico absoluto y escalado), lo guarda en su Garaje Personal y el Administrador puede cambiar los estados de fabricación ("Solicitado", "En Proceso", etc).

---

##  Guía de Instalación para Profesores/Evaluadores

1. Copiar este proyecto en la carpeta del servidor local (por ejemplo `C:/xampp/htdocs/mi-carpeta-proyecto`).
2. Levantar los servicios de **Apache** y **MySQL** desde el panel de XAMPP.
3. Importar la Base de Datos con todos los datos de demostración incluidos.
   - Ir a **phpMyAdmin** (`http://localhost/phpmyadmin`).
   - Importar el archivo alojado en `servidor/sql/midnight_demo.sql`. Este archivo crea la BD automáticamente y le inserta datos de demostración para no evaluar un sistema en blanco.
4. Confirmar las credenciales en `servidor/includes/db.php` si tiene configurada otra contraseña en su motor MySQL local (por defecto asume `root` sin contraseña).
5. Visitar el frontend con la ruta real de su carpeta, por ejemplo: `http://localhost/mi-carpeta-proyecto/cliente/`.

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


## Dataset demo oficial (control de versión)

Para evitar desalineaciones entre profesores/equipos durante la evaluación, la demo SQL queda congelada con:

- `dataset_version: demo-2026.04`
- `dataset_date: 2026-04-08`
- Archivos fuente: `servidor/sql/midnight_demo.sql` y `servidor/sql/reset_demo_data.sql`

Si se cambia cualquier dato (usuarios, pedidos, estados, etc.), se debe incrementar la versión y actualizar la fecha en ambos scripts.

## Regenerar hashes bcrypt y credenciales (paso a paso exacto)

1. Generar hash para administrador:
   ```bash
   php -r "echo password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]), PHP_EOL;"
   ```
2. Generar hash para cliente:
   ```bash
   php -r "echo password_hash('cliente123', PASSWORD_BCRYPT, ['cost' => 12]), PHP_EOL;"
   ```
3. Sustituir hashes en:
   - `servidor/sql/schema.sql`
   - `servidor/sql/midnight_demo.sql`
   - `servidor/sql/reset_demo_data.sql`
4. Verificar que cada hash corresponde a su contraseña:
   ```bash
   php -r "var_export(password_verify('admin123', 'AQUI_HASH_ADMIN'));"
   ```
   ```bash
   php -r "var_export(password_verify('cliente123', 'AQUI_HASH_CLIENTE'));"
   ```
5. Reimportar datos demo:
   - Inicial completo: importar `servidor/sql/midnight_demo.sql`
   - Reseteo rápido (sin recrear tablas):
     ```bash
     mysql -u root -p < servidor/sql/reset_demo_data.sql
     ```

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

*   `cliente/`: Lógica FrontEnd SPA-Like, interactiva a base de HTML estáticos, Vanilla JS usando asincronismo para las mutaciones y Custom CSS puro sin librerías externas.
*   `servidor/api/`: Lógica BackEnd de transferencia POST/GET. Cada endpoint es único en `.php` usando cabeceras JSON, devolviendo HTTP Codes y verificaciones de sesión/XSS contra MySQL en formato **PDO** con variables pre-limpiadas preparadas (`?`) anti SQLi.
*   `servidor/sql/`: Los esquemas y los tests de base de datos automatizados instalables.

¡Gracias por evaluar este proyecto final! Esperamos que os guste.


---

## Estrategia de rutas Frontend/API (local y hosting)

Para evitar rutas hardcodeadas al nombre de la carpeta del proyecto, el frontend usa una constante global compartida `API_BASE` definida en `cliente/assets/js/env.js`.

- `env.js` calcula dinámicamente la base del backend a partir de `window.location.origin` y del prefijo detectado antes de `/cliente` en la URL actual.
- El resultado es: `${window.location.origin}/{prefijoProyecto}/servidor/api`.
- Así, si se renombra la carpeta local (ej. `Proyecto-Intermodular-` -> `midnight-app`), login/sesión/logout y el resto de llamadas `fetch` siguen funcionando sin tocar JS.

### Ejemplos
- Local XAMPP con carpeta `midnight-app`: `http://localhost/midnight-app/cliente/` -> `API_BASE = http://localhost/midnight-app/servidor/api`
- Hosting en subcarpeta `coches`: `https://dominio.com/coches/cliente/` -> `API_BASE = https://dominio.com/coches/servidor/api`

Esta estrategia mantiene el código preparado para despliegue local y para mover el proyecto a hosting sin rehacer endpoints frontend.


## Contrato común de errores (API)

Todos los endpoints devuelven JSON con la misma forma base:

```json
{
  "ok": false,
  "message": "Mensaje legible para UI",
  "error": "CODIGO_DE_ERROR"
}
```

> En errores de validación (`422`) también se puede devolver `details` con una lista de mensajes.

### `POST /servidor/api/login.php`

| HTTP | ok | error | Uso |
|---|---|---|---|
| `200` | `true` | `null` | Login correcto (`redirect` según rol). |
| `400` | `false` | `MISSING_FIELDS` | Faltan campos obligatorios. |
| `401` | `false` | `INVALID_CREDENTIALS` / `TOO_MANY_ATTEMPTS` | Credenciales inválidas, retardo progresivo y/o bloqueo temporal por sesión+IP/email. |
| `422` | `false` | `INVALID_EMAIL` | Formato de email inválido. |
| `500` | `false` | `INTERNAL_ERROR` | Error interno inesperado. |

### `POST /servidor/api/registro.php`

| HTTP | ok | error | Uso |
|---|---|---|---|
| `200` | `true` | `null` | Registro correcto (`redirect` a login). |
| `409` | `false` | `EMAIL_ALREADY_EXISTS` | El correo ya está registrado. |
| `422` | `false` | `VALIDATION_ERROR` | Validaciones de nombre/email/contraseña. |
| `500` | `false` | `INTERNAL_ERROR` | Error interno inesperado. |

---

## Checklist de seguridad Frontend

Antes de cerrar cualquier cambio en la capa cliente, revisar:

1. [ ] **XSS (Cross-Site Scripting)**
   - Evitar interpolar datos de API con `innerHTML`.
   - Preferir `createElement`, `setAttribute` y `textContent` para render dinámico.
   - Si por compatibilidad se usa HTML string, aplicar escaping explícito como fallback.

2. [ ] **CSRF**
   - Enviar siempre token CSRF en operaciones sensibles (`POST`, `PUT`, `DELETE`), por ejemplo en cabecera `X-CSRF-Token`.
   - Verificar que el backend rechaza peticiones sin token o con token inválido.

3. [ ] **Escaping y validación de salida**
   - Tratar como no confiable cualquier texto proveniente de API, query params o storage del navegador.
   - Confirmar que nombres de usuario, emails, modelos y campos libres se insertan con `textContent`.
   - Mantener helpers de escape (como `escaparHtml`) únicamente para casos de respaldo puntuales, no como patrón principal de render.


## Seguridad: modo local académico vs producción

### Contraseñas (`registro.php`)

- **Regla base (siempre):** longitud entre **8 y 10** caracteres.
- **Complejidad opcional:** si `PASSWORD_REQUIRE_COMPLEXITY=true`, se exige al menos una mayúscula, una minúscula, un número y un símbolo.
- Recomendación:
  - **Local académico:** `PASSWORD_REQUIRE_COMPLEXITY=false` para facilitar pruebas en clase.
  - **Producción:** `PASSWORD_REQUIRE_COMPLEXITY=true`.

### Login y anti fuerza bruta (`login.php`)

- Se mantiene el límite por sesión (`5` intentos / `5` minutos).
- Se añade:
  - **Retardo incremental** por intento fallido (hasta 3s).
  - **Persistencia en BD** (`login_attempts`) por **IP o email** en ventana de 5 minutos para evitar evasión cerrando sesión o cambiando cookie.
- Al autenticar correctamente, se limpian los intentos del email/IP.

### Cookies de sesión (`auth.php`)

- Variable `APP_ENV`:
  - `local` (por defecto): `secure` depende de HTTPS real.
  - `production`: cookie de sesión con `secure=true` forzado.
- Variable `SESSION_SAMESITE` (`Lax`, `Strict`, `None`; default `Lax`):
  - Si se usa `None`, se fuerza `secure=true` (requisito de navegadores modernos).
- Recomendación de flujo:
  - Si frontend y backend comparten mismo sitio -> usar `Lax` o `Strict` tras validar UX.
  - Si hay flujo cross-site (subdominios terceros/embeds) -> evaluar `None` + HTTPS obligatorio.

---

## Mantenimiento (2026-04-08)

- Se verificó la referencia real de `cliente/assets/js/contacto.js` y `cliente/assets/js/nosotros.js` en todos los HTML del frontend: no estaban enlazados ni importados.
- Se eliminaron ambos archivos JS huérfanos para reducir deuda técnica y evitar confusión en mantenimiento.
- Se revisó CSS específico (`contacto.css`, `nosotros.css`) frente a `style.css` y se limpió duplicidad en `style.css` para que los estilos de contacto/nosotros vivan solo en sus hojas dedicadas.
- Revisión manual de navegación completada a nivel de estructura/flujo (enlaces, menú responsive y anclas), sin detectar regresiones funcionales derivadas de esta limpieza.

---

## Pruebas de humo API (automatizadas)

Se añadió un runner único para validar endpoints críticos:

- `servidor/api/sesion.php`
- `servidor/api/login.php`
- `servidor/api/registro.php`
- `servidor/api/guardar_config.php`
- `servidor/api/pedidos.php`

### Cobertura incluida

El script `tests/smoke_api.php` cubre:

- **Happy path** de `login`, `registro`, `guardar_config` y `pedidos` (admin).
- Errores esperados:
  - `400` (campos inválidos / JSON inválido)
  - `401` (sin sesión o credenciales erróneas)
  - `403` (sin permisos admin o token CSRF inválido)
- Validación explícita de `JSON inválido` y `CSRF inválido` en endpoints JSON.

### Aislamiento de datos de prueba

Las pruebas **no dependen de estado manual**:

- Crean usuarios temporales únicos (`cliente` y `admin`) con sufijo aleatorio.
- Ejecutan pruebas con esos usuarios.
- Eliminan los datos temporales al terminar (incluyendo relaciones por `ON DELETE CASCADE`).

### Ejecución local (docente/evaluación)

1. Tener **MySQL** activo y la BD `midnight_customs` importada.
2. Verificar credenciales en `servidor/includes/db.php` (por defecto `root` sin contraseña).
3. Ejecutar desde la raíz del proyecto:

```bash
npm run test
```

Alternativa directa (sin npm):

```bash
php tests/smoke_api.php
```

### Notas técnicas

- El runner levanta un servidor embebido PHP automáticamente en `127.0.0.1:8099`.
- Si el puerto está ocupado, se puede cambiar con:

```bash
SMOKE_PORT=8100 npm run test
```
