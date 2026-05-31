<?php
declare(strict_types=1);

// ============================================================
// API: Login de Usuario
// POST — recibe email, password (form-data)
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, false, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
}

$maxIntentosSesion = 5;
$maxIntentosGlobal = 10;
$ventanaSeg = 300; // 5 min
$retardoBaseMs = 250;
$retardoMaxMs = 3000;

if (!isset($_SESSION['login_attempts'])) {
    $_SESSION['login_attempts'] = [];
}

$_SESSION['login_attempts'] = array_values(array_filter(
    $_SESSION['login_attempts'],
    fn($ts) => ($ts > time() - $ventanaSeg)
));

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$ip = getClientIp();

if (count($_SESSION['login_attempts']) >= $maxIntentosSesion) {
    responder(401, false, 'Demasiados intentos en esta sesión. Espera 5 minutos.', 'TOO_MANY_ATTEMPTS');
}

if ($email === '' || $password === '') {
    responder(400, false, 'Rellena todos los campos.', 'MISSING_FIELDS');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(422, false, 'Introduce un email válido.', 'INVALID_EMAIL');
}

try {
    limpiarIntentosAntiguos($pdo, $ventanaSeg);

    $intentosGlobales = contarIntentosRecientes($pdo, $email, $ip, $ventanaSeg);
    if ($intentosGlobales >= $maxIntentosGlobal) {
        responder(401, false, 'Demasiados intentos para este usuario/IP. Espera 5 minutos.', 'TOO_MANY_ATTEMPTS');
    }

    // Retardo incremental para dificultar fuerza bruta.
    $intentosSesion = count($_SESSION['login_attempts']);
    $retardoMs = min($retardoMaxMs, $retardoBaseMs * max(0, $intentosSesion));
    if ($retardoMs > 0) {
        usleep($retardoMs * 1000);
    }

    $stmt = $pdo->prepare('SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if (!$usuario || !password_verify($password, $usuario['password'])) {
        $_SESSION['login_attempts'][] = time();
        registrarIntentoFallido($pdo, $email, $ip);
        responder(401, false, 'Credenciales inválidas.', 'INVALID_CREDENTIALS', [
            'delay_ms' => $retardoMs,
        ]);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = $usuario['id'];
    $_SESSION['user_name'] = $usuario['nombre'];
    $_SESSION['user_role'] = $usuario['rol'];
    $_SESSION['login_attempts'] = [];

    limpiarIntentosExitosos($pdo, $email, $ip);

    $destino = ($usuario['rol'] === 'admin')
        ? rutaCliente('admin.html')
        : rutaCliente('index.html');

    responder(200, true, 'Inicio de sesión correcto.', null, ['redirect' => $destino]);
} catch (Throwable $e) {
    error_log('[login.php] ' . $e->getMessage());
    responder(500, false, 'Error interno al iniciar sesión.', 'INTERNAL_ERROR');
}