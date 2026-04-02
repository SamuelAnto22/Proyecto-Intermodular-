<?php
// ============================================================
// API: Cerrar sesión
// GET — destruye la sesión y redirige al inicio
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

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

// Redirigir al inicio
header('Location: ../../cliente/index.html');
exit;
