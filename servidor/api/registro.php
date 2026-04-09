<?php
// ============================================================
// API: Registro de Usuario
// POST — recibe nombre, email, password (form-data)
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, false, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
}

$nombre = trim($_POST['nombre'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$password = $_POST['password'] ?? '';
$confirm = $_POST['confirm-password'] ?? '';

$errores = [];

if ($nombre === '') {
    $errores[] = 'El nombre es obligatorio.';
} elseif (strlen($nombre) > 50) {
    $errores[] = 'El nombre es demasiado largo (máximo 50 caracteres).';
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errores[] = 'Introduce un email válido.';
} elseif (strlen($email) > 100) {
    $errores[] = 'El email es demasiado largo (máximo 100 caracteres).';
}

if (strlen($password) < 8 || strlen($password) > 10) {
    $errores[] = 'La contraseña debe tener entre 8 y 10 caracteres.';
}

$forzarComplejidad = filter_var($_ENV['PASSWORD_REQUIRE_COMPLEXITY'] ?? getenv('PASSWORD_REQUIRE_COMPLEXITY') ?: '0', FILTER_VALIDATE_BOOL);
if ($forzarComplejidad) {
    $tieneMayus = preg_match('/[A-Z]/', $password) === 1;
    $tieneMinus = preg_match('/[a-z]/', $password) === 1;
    $tieneNumero = preg_match('/\d/', $password) === 1;
    $tieneSimbolo = preg_match('/[^a-zA-Z\d]/', $password) === 1;

    if (!$tieneMayus || !$tieneMinus || !$tieneNumero || !$tieneSimbolo) {
        $errores[] = 'La contraseña debe incluir mayúscula, minúscula, número y símbolo (modo producción).';
    }
}

if ($password !== $confirm) {
    $errores[] = 'Las contraseñas no coinciden.';
}

if (!empty($errores)) {
    responder(422, false, implode(' ', $errores), 'VALIDATION_ERROR', ['details' => $errores]);
}

try {
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        responder(409, false, 'Ese email ya está registrado.', 'EMAIL_ALREADY_EXISTS');
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)');
    $stmt->execute([$nombre, $email, $hash, 'cliente']);

    responder(200, true, 'Cuenta creada correctamente. Inicia sesión.', null, [
        'redirect' => rutaCliente('login.html')
    ]);
} catch (Throwable $e) {
    error_log('[registro.php] ' . $e->getMessage());
    responder(500, false, 'Error interno al registrar la cuenta.', 'INTERNAL_ERROR');
}