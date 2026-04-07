<?php
// ============================================================
// API: Registro de Usuario
// POST — recibe nombre, email, password (form-data)
// ============================================================

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json; charset=utf-8');

function responder(int $status, bool $ok, string $message, ?string $error = null, array $extra = []): void
{
    http_response_code($status);
    $payload = array_merge([
        'ok' => $ok,
        'message' => $message,
    ], $error ? ['error' => $error] : [], $extra);

    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// Recoger datos del formulario (Sanitización básica Día 1)
$nombre   = trim($_POST['nombre']   ?? '');
$email    = filter_var(trim($_POST['email']?? ''), FILTER_SANITIZE_EMAIL);
$password = $_POST['password']      ?? '';
$confirm  = $_POST['confirm-password'] ?? '';

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

if (strlen($password) < 6) {
    $errores[] = 'La contraseña debe tener al menos 6 caracteres.';
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

// --- Redirigir al login con éxito ---
header('Location: ../../cliente/login.html?ok=' . urlencode('Cuenta creada correctamente. Inicia sesión.'));
exit;
