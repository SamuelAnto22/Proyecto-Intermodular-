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
session_destroy();

// Redirigir al inicio
header('Location: ../../cliente/index.html');
exit;
