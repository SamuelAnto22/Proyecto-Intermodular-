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

function rutaCliente(string $archivo): string
{
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $base = preg_replace('#/servidor/api/[^/]+$#', '', $scriptName) ?? '';

    return rtrim($base, '/') . '/cliente/' . ltrim($archivo, '/');
}

function detectarColumnaPassword(PDO $pdo): string
{
    static $columna = null;

    if ($columna !== null) {
        return $columna;
    }

    $stmt = $pdo->query('SHOW COLUMNS FROM usuarios');
    $columnas = array_map(
        fn(array $fila) => strtolower((string)($fila['Field'] ?? '')),
        $stmt->fetchAll(PDO::FETCH_ASSOC)
    );

    if (in_array('password', $columnas, true)) {
        $columna = 'password';
        return $columna;
    }

    if (in_array('contrasena', $columnas, true) || in_array('contraseña', $columnas, true)) {
        $columna = in_array('contrasena', $columnas, true) ? 'contrasena' : 'contraseña';
        return $columna;
    }

    throw new RuntimeException('No existe una columna de contraseña válida en la tabla usuarios.');
}

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
    $passwordCol = detectarColumnaPassword($pdo);

    $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, {$passwordCol}, rol) VALUES (?, ?, ?, ?)");
    $stmt->execute([$nombre, $email, $hash, 'cliente']);

    responder(200, true, 'Cuenta creada correctamente. Inicia sesión.', null, ['redirect' => rutaCliente('login.html')]);
} catch (Throwable $e) {
    error_log('[registro.php] ' . $e->getMessage());
    responder(500, false, 'Error interno al registrar la cuenta.', 'INTERNAL_ERROR');
}
