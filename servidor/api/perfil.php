<?php
// ============================================================
// API: Perfil de Usuario
// GET  — devuelve datos del usuario logueado + sus configs
// POST — actualiza la contraseña del usuario logueado
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

requireLogin();

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
        echo json_encode(['ok' => false, 'error' => 'Usuario no encontrado.']);
        exit;
    }

    // Configuraciones (garaje)
    $stmt2 = $pdo->prepare(
        'SELECT c.id, c.modelo, c.color, c.llantas, c.suspension, c.created_at,
                p.estado AS pedido_estado
         FROM configuraciones c
         LEFT JOIN pedidos p ON p.configuracion_id = c.id
         WHERE c.usuario_id = ?
         ORDER BY c.created_at DESC'
    );
    $stmt2->execute([$userId]);
    $configuraciones = $stmt2->fetchAll();

    echo json_encode([
        'ok'      => true,
        'usuario' => $usuario,
        'garaje'  => $configuraciones
    ]);
    exit;
}

// ─── POST: Actualizar contraseña ──────────────────────────────
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $passwordActual  = $input['password_actual']  ?? '';
    $passwordNuevo   = $input['password_nuevo']   ?? '';
    $passwordConfirm = $input['password_confirm']  ?? '';

    if ($passwordActual === '' || $passwordNuevo === '' || $passwordConfirm === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Rellena todos los campos.']);
        exit;
    }

    if ($passwordNuevo !== $passwordConfirm) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'La nueva contraseña y la confirmación no coinciden.']);
        exit;
    }

    if (strlen($passwordNuevo) < 8) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'La nueva contraseña debe tener al menos 8 caracteres.']);
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

    echo json_encode(['ok' => true, 'message' => '¡Contraseña actualizada correctamente!']);
    exit;
}

// ─── Método no soportado ──────────────────────────────────────
http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);
