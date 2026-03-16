<?php
// ============================================================
// API: Gestión de Pedidos (Admin)
// GET    — listar todos los pedidos
// PUT    — actualizar estado de un pedido
// DELETE — eliminar un pedido
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: Listar todos los pedidos ───────────────────────────
if ($method === 'GET') {
    requireAdmin();

    $stmt = $pdo->query(
        'SELECT p.id,
                u.nombre AS cliente,
                c.modelo,
                c.color,
                c.llantas,
                c.suspension,
                p.estado,
                p.fecha
         FROM pedidos p
         JOIN usuarios u        ON u.id = p.usuario_id
         JOIN configuraciones c ON c.id = p.configuracion_id
         ORDER BY p.fecha DESC'
    );
    $pedidos = $stmt->fetchAll();

    echo json_encode(['ok' => true, 'data' => $pedidos]);
    exit;
}

// ─── PUT: Actualizar estado de un pedido ─────────────────────
if ($method === 'PUT') {
    requireAdmin();

    $input  = json_decode(file_get_contents('php://input'), true);
    $id     = (int) ($input['id']     ?? 0);
    $estado = trim($input['estado']   ?? '');

    $estadosValidos = ['pendiente', 'en proceso', 'terminado'];

    if ($id <= 0 || !in_array($estado, $estadosValidos, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Datos no válidos. Estados: pendiente, en proceso, terminado.']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE pedidos SET estado = ? WHERE id = ?');
    $stmt->execute([$estado, $id]);

    echo json_encode(['ok' => true, 'message' => 'Estado actualizado.']);
    exit;
}

// ─── DELETE: Eliminar un pedido ──────────────────────────────
if ($method === 'DELETE') {
    requireAdmin();

    $input = json_decode(file_get_contents('php://input'), true);
    $id    = (int) ($input['id'] ?? 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'ID no válido.']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM pedidos WHERE id = ?');
    $stmt->execute([$id]);

    echo json_encode(['ok' => true, 'message' => 'Pedido eliminado.']);
    exit;
}

// ─── Método no soportado ─────────────────────────────────────
http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);
