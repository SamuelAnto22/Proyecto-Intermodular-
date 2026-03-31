<?php
// ============================================================
// API: Comprobar sesión activa
// GET — devuelve JSON con estado de la sesión
// ============================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

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
        'id'      => $_SESSION['user_id']
    ]);
} else {
    echo json_encode([
        'ok'       => true,
        'logueado' => false
    ]);
}
