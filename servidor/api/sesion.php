<?php
// ============================================================
// API: Comprobar sesión activa
// GET — devuelve JSON con estado de la sesión
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';

if (usuarioLogueado()) {
    echo json_encode([
        'ok'       => true,
        'logueado' => true,
        'nombre'   => getUserName() ?? 'Usuario',
        'rol'      => getUserRole() ?? 'cliente',
        'id'       => getUserId(),
        'csrf'     => getCsrfToken()
    ]);
} else {
    echo json_encode([
        'ok'       => true,
        'logueado' => false,
        'csrf'     => getCsrfToken()
    ]);
}
