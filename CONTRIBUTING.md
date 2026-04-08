# Guía corta de contribución

Este documento resume cómo añadir cambios funcionales sin romper el flujo principal del proyecto.

## 1) Añadir un endpoint nuevo (PHP)

1. Crear archivo en `servidor/api/nuevo_endpoint.php`.
2. Reutilizar includes base:
   - `require_once __DIR__ . '/../includes/header.php';`
   - `require_once __DIR__ . '/../includes/auth.php';` (si aplica sesión/rol)
   - `require_once __DIR__ . '/../includes/db.php';` (si usa BD)
3. Respetar contrato JSON (`ok`, `message`, `error`) y códigos HTTP coherentes.
4. Validar método (`GET`, `POST`, etc.) y entradas (`$_POST` o JSON de `php://input`).
5. Probar manualmente y luego ejecutar `npm run test`.

## 2) Añadir una página nueva (HTML + CSS + JS)

1. Crear `cliente/nueva-pagina.html`.
2. Añadir estilos en `cliente/assets/css/nueva-pagina.css` (o reutilizar `style.css` si es global).
3. Añadir script en `cliente/assets/js/nueva-pagina.js`.
4. Enlazar CSS/JS desde el HTML y, si hay llamadas API, usar siempre `window.API_BASE`.
5. Añadir enlace de navegación (si corresponde) y verificar en móvil/escritorio.

## 3) Añadir un script nuevo (JS)

1. Si es específico de una vista, colocarlo en `cliente/assets/js/`.
2. Si es reutilizable, colocarlo en `cliente/assets/js/modules/`.
3. Mantener estilo homogéneo:
   - Nombres descriptivos.
   - Comentarios breves de bloque por sección.
   - Manejo de errores de red con mensajes legibles para UI.
4. Evitar `innerHTML` con datos de usuario/API; preferir `textContent` y `createElement`.

## Checklist rápido antes de abrir PR

- [ ] Se respeta la convención de nombres y carpetas del README.
- [ ] Endpoints devuelven JSON consistente.
- [ ] Flujo de sesión/rol no se rompe (cliente/admin).
- [ ] Ejecutado `npm run test` sin errores.
