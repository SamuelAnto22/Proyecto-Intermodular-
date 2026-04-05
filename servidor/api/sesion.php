<?php
// ============================================================
// API: Comprobar sesión activa
// GET — devuelve JSON con estado de la sesión
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// Arrancar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!empty($_SESSION['user_id'])) {
    echo json_encode([
        'ok'      => true,
        'logueado' => true,
        'nombre'  => $_SESSION['user_name'] ?? 'Usuario',
        'rol'     => $_SESSION['user_role'] ?? 'cliente',
        'id'      => $_SESSION['user_id'],
        'csrf' => getCsrfToken()
    ]);
} else {
    echo json_encode([
        'ok'       => true,
        'logueado' => false,
        'csrf' => getCsrfToken()
    ]);
}
