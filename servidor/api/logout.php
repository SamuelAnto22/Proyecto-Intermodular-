<?php
declare(strict_types=1);

// ============================================================
// API: Cerrar sesión
// POST — destruye la sesión y redirige al inicio
// ============================================================
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';

// Constante de expiración de sesión (segundos)
const SESSION_EXPIRE_SECONDS = 42000;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED', 'message' => 'Método no permitido.']);
    exit;
}

try {
    requireCsrfToken();

    unset($_SESSION['login_attempts']);

    // Destruir todos los datos de sesión
    $_SESSION = [];

    // Limpiar la cookie de la sesión
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - SESSION_EXPIRE_SECONDS,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }

    session_destroy();
    echo json_encode(['ok' => true, 'message' => 'Sesión cerrada correctamente.']);
    exit;
} catch (Throwable $e) {
    error_log('[logout.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error interno al cerrar sesión.', 'error' => 'INTERNAL_ERROR']);
    exit;
}
