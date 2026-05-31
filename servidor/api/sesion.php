<?php
declare(strict_types=1);

// ============================================================
// API: Comprobar sesión activa
// GET — devuelve JSON con estado de la sesión
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';

try {
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
} catch (Throwable $e) {
    error_log('[sesion.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error interno al comprobar la sesión.', 'error' => 'INTERNAL_ERROR']);
    exit;
}