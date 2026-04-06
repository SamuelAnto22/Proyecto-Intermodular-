<?php
// ============================================================
// API: Cerrar sesión
// GET — destruye la sesión y redirige al inicio
// ============================================================
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);
    exit;
}
requireCsrfToken();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

unset($_SESSION['login_attempts']);

// Destruir todos los datos de sesión
$_SESSION = [];

// Limpiar la cookie de la sesión
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

session_destroy();
echo json_encode(['ok' => true, 'message' => 'Sesión cerrada']);
exit;


// Redirigir al inicio
header('Location: ../../cliente/index.html');
exit;
