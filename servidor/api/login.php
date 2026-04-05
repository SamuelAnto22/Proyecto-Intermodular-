<?php
// ============================================================
// API: Login de Usuario
// POST — recibe email, password (form-data)
// ============================================================

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);
    exit;
}

$maxIntentos = 5;
$ventanaSeg = 300; // 5 min

if (!isset($_SESSION['login_attempts'])) $_SESSION['login_attempts'] = [];
$_SESSION['login_attempts'] = array_filter(
    $_SESSION['login_attempts'],
    fn($ts) => ($ts > time() - $ventanaSeg)
);

if (count($_SESSION['login_attempts']) >= $maxIntentos) {
    header('Location: ../../cliente/login.html?error=' . urlencode('Demasiados intentos. Espera 5 minutos.'));
    exit;
}

// Recoger datos del formulario
$email    = trim($_POST['email']    ?? '');
$password = $_POST['password']      ?? '';
// --- Validaciones básicas ---
if ($email === '' || $password === '') {
    header('Location: ../../cliente/login.html?error=' . urlencode('Rellena todos los campos.'));
    exit;
}

// --- Buscar usuario por email ---
$stmt = $pdo->prepare('SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?');
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario || !password_verify($password, $usuario['password'])) {
    $_SESSION['login_attempts'][] = time();
    header('Location: ../../cliente/login.html?error=' . urlencode('Credenciales inválidas.'));
    exit;
}

// --- Crear sesión ---
session_regenerate_id(true); // Evitar fijación de sesión
$_SESSION['user_id']   = $usuario['id'];
$_SESSION['user_name'] = $usuario['nombre'];
$_SESSION['user_role'] = $usuario['rol'];
$_SESSION['login_attempts'] = []; // Limpiar intentos tras login exitoso

// --- Redirigir según el rol ---
if ($usuario['rol'] === 'admin') {
    header('Location: ../../cliente/admin.html');
} else {
    header('Location: ../../cliente/index.html');
}
exit;
