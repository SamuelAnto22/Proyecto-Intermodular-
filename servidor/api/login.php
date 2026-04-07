<?php
// ============================================================
// API: Login de Usuario
// POST — recibe email, password (form-data)
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, false, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
}

$maxIntentos = 5;
$ventanaSeg = 300; // 5 min

if (!isset($_SESSION['login_attempts'])) {
    $_SESSION['login_attempts'] = [];
}

$_SESSION['login_attempts'] = array_filter(
    $_SESSION['login_attempts'],
    fn($ts) => ($ts > time() - $ventanaSeg)
);

if (count($_SESSION['login_attempts']) >= $maxIntentos) {
    responder(401, false, 'Demasiados intentos. Espera 5 minutos.', 'TOO_MANY_ATTEMPTS');
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if ($email === '' || $password === '') {
    responder(400, false, 'Rellena todos los campos.', 'MISSING_FIELDS');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(422, false, 'Introduce un email válido.', 'INVALID_EMAIL');
}

try {
    $stmt = $pdo->prepare('SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if (!$usuario || !password_verify($password, $usuario['password'])) {
        $_SESSION['login_attempts'][] = time();
        responder(401, false, 'Credenciales inválidas.', 'INVALID_CREDENTIALS');
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = $usuario['id'];
    $_SESSION['user_name'] = $usuario['nombre'];
    $_SESSION['user_role'] = $usuario['rol'];
    $_SESSION['login_attempts'] = [];

    $destino = ($usuario['rol'] === 'admin') ? '../../cliente/admin.html' : '../../cliente/index.html';

    responder(200, true, 'Inicio de sesión correcto.', null, ['redirect' => $destino]);
} catch (Throwable $e) {
    responder(500, false, 'Error interno al iniciar sesión.', 'INTERNAL_ERROR');
}
