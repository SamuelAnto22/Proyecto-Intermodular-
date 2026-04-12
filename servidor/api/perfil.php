<?php
declare(strict_types=1);

// ============================================================
// API: Perfil de Usuario
// GET  — devuelve datos del usuario logueado + sus configs
// POST — actualiza la contraseña del usuario logueado
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

requireLogin();

try {

$method = $_SERVER['REQUEST_METHOD'];
$userId = getUserId();

// ─── GET: Obtener datos del perfil + configuraciones ─────────
if ($method === 'GET') {
    // Datos del usuario
    $stmt = $pdo->prepare('SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = ?');
    $stmt->execute([$userId]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'Usuario no encontrado.', 'error' => 'USER_NOT_FOUND']);
        exit;
    }

    // Configuraciones (garaje)
    $configuraciones = obtenerConfiguracionesUsuario($pdo, $userId);

    echo json_encode([
        'ok'      => true,
        'usuario' => $usuario,
        'garaje'  => $configuraciones
    ]);
    exit;
}

// ─── POST: Actualizar contraseña ──────────────────────────────
if ($method === 'POST') {
    requireCsrfToken();
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'JSON inválido.']);
        exit;
    }

    $passwordActual  = $input['password_actual']  ?? '';
    $passwordNuevo   = $input['password_nuevo']   ?? '';
    $passwordConfirm = $input['password_confirm']  ?? '';

    if ($passwordActual === '' || $passwordNuevo === '' || $passwordConfirm === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Rellena todos los campos.']);
        exit;
    }

    if (strlen($passwordNuevo) < 8 || strlen($passwordNuevo) > 72) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'La nueva contraseña debe tener entre 8 y 72 caracteres.']);
        exit;
    }

    // Coherencia de complejidad con registro.php
    $forzarComplejidad = filter_var($_ENV['PASSWORD_REQUIRE_COMPLEXITY'] ?? getenv('PASSWORD_REQUIRE_COMPLEXITY') ?: '0', FILTER_VALIDATE_BOOL);
    if ($forzarComplejidad) {
        $tieneMayus = preg_match('/[A-Z]/', $passwordNuevo) === 1;
        $tieneMinus = preg_match('/[a-z]/', $passwordNuevo) === 1;
        $tieneNumero = preg_match('/\d/', $passwordNuevo) === 1;
        $tieneSimbolo = preg_match('/[^a-zA-Z\d]/', $passwordNuevo) === 1;
        if (!$tieneMayus || !$tieneMinus || !$tieneNumero || !$tieneSimbolo) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'message' => 'La nueva contraseña debe incluir mayúscula, minúscula, número y símbolo.']);
            exit;
        }
    }

    if ($passwordNuevo !== $passwordConfirm) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'La nueva contraseña y la confirmación no coinciden.']);
        exit;
    }

    // Verificar contraseña actual
    $stmt = $pdo->prepare('SELECT password FROM usuarios WHERE id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($passwordActual, $row['password'])) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'message' => 'La contraseña actual no es correcta.']);
        exit;
    }

    // Actualizar contraseña
    $hash = password_hash($passwordNuevo, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('UPDATE usuarios SET password = ? WHERE id = ?');
    $stmt->execute([$hash, $userId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'Usuario no encontrado o contraseña sin cambios.']);
        exit;
    }

    echo json_encode(['ok' => true, 'message' => '¡Contraseña actualizada correctamente!']);
    exit;
}

// ─── Método no soportado ──────────────────────────────────────────
http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);
exit;

} catch (Throwable $e) {
    error_log('[perfil.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error interno del servidor.', 'error' => 'INTERNAL_ERROR']);
    exit;
}
