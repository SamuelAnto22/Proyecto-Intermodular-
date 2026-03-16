<?php
// ============================================================
// API: Guardar Configuración del Coche
// POST   — guardar nueva configuración (JSON)
// GET    — obtener configuraciones del usuario logueado
// DELETE — borrar una configuración por ID
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ─── POST: Guardar nueva configuración ───────────────────────
if ($method === 'POST') {
    requireLogin();

    $input = json_decode(file_get_contents('php://input'), true);

    $modelo     = trim($input['modelo']     ?? '');
    $color      = trim($input['color']      ?? '');
    $llantas    = trim($input['llantas']     ?? '');
    $suspension = trim($input['suspension']  ?? '');

    if ($modelo === '' || $color === '' || $llantas === '' || $suspension === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios.']);
        exit;
    }

    $userId = getUserId();

    // Insertar configuración
    $stmt = $pdo->prepare(
        'INSERT INTO configuraciones (usuario_id, modelo, color, llantas, suspension) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $modelo, $color, $llantas, $suspension]);
    $configId = (int) $pdo->lastInsertId();

    // Crear pedido asociado automáticamente
    $stmt = $pdo->prepare(
        'INSERT INTO pedidos (configuracion_id, usuario_id, estado) VALUES (?, ?, ?)'
    );
    $stmt->execute([$configId, $userId, 'pendiente']);

    echo json_encode(['success' => true, 'id' => $configId, 'message' => 'Configuración guardada.']);
    exit;
}

// ─── GET: Obtener configuraciones del usuario logueado ───────
if ($method === 'GET') {
    requireLogin();

    $userId = getUserId();

    $stmt = $pdo->prepare(
        'SELECT c.id, c.modelo, c.color, c.llantas, c.suspension, c.created_at,
                p.estado AS pedido_estado
         FROM configuraciones c
         LEFT JOIN pedidos p ON p.configuracion_id = c.id
         WHERE c.usuario_id = ?
         ORDER BY c.created_at DESC'
    );
    $stmt->execute([$userId]);
    $configs = $stmt->fetchAll();

    echo json_encode(['ok' => true, 'data' => $configs]);
    exit;
}

// ─── DELETE: Borrar una configuración ────────────────────────
if ($method === 'DELETE') {
    requireLogin();

    $input = json_decode(file_get_contents('php://input'), true);
    $id    = (int) ($input['id'] ?? 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'ID no válido.']);
        exit;
    }

    $userId = getUserId();

    // Solo puede borrar sus propias configuraciones (o admin borra cualquiera)
    if (esAdmin()) {
        $stmt = $pdo->prepare('DELETE FROM configuraciones WHERE id = ?');
        $stmt->execute([$id]);
    } else {
        $stmt = $pdo->prepare('DELETE FROM configuraciones WHERE id = ? AND usuario_id = ?');
        $stmt->execute([$id, $userId]);
    }

    echo json_encode(['ok' => true, 'message' => 'Configuración eliminada.']);
    exit;
}

// ─── Método no soportado ─────────────────────────────────────
http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);
