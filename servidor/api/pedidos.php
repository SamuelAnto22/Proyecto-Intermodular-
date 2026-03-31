<?php
// ============================================================
// API: Gestión de Pedidos (Admin)
// GET  — listar todos los pedidos
// POST — actualizar estado de un pedido (accion: 'cambiar_estado')
//        eliminar un pedido (accion: 'eliminar')
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: Listar todos los pedidos + estadísticas ────────────
if ($method === 'GET') {
    requireAdmin();

    // Pedidos con detalle
    $stmt = $pdo->query(
        'SELECT p.id,
                u.nombre AS cliente,
                u.email  AS cliente_email,
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

    // Estadísticas
    $totalClientes = $pdo->query("SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente'")->fetchColumn();
    $totalPedidos  = $pdo->query("SELECT COUNT(*) FROM pedidos")->fetchColumn();
    $pendientes    = $pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado = 'pendiente'")->fetchColumn();
    $solicitados   = $pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado = 'solicitado'")->fetchColumn();
    $enProceso     = $pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado = 'en proceso'")->fetchColumn();
    $terminados    = $pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado = 'terminado'")->fetchColumn();

    echo json_encode([
        'ok'   => true,
        'data' => $pedidos,
        'stats' => [
            'total_clientes' => (int)$totalClientes,
            'total_pedidos'  => (int)$totalPedidos,
            'pendientes'     => (int)$pendientes,
            'solicitados'    => (int)$solicitados,
            'en_proceso'     => (int)$enProceso,
            'terminados'     => (int)$terminados
        ]
    ]);
    exit;
}

// ─── POST: Cambiar estado o eliminar pedido ──────────────────
if ($method === 'POST') {
    requireAdmin();

    $input  = json_decode(file_get_contents('php://input'), true);
    $accion = $input['accion'] ?? '';

    // ── Cambiar estado ───────────────────────────────────────
    if ($accion === 'cambiar_estado') {
        $id     = (int) ($input['id']     ?? 0);
        $estado = trim($input['estado']   ?? '');

        $estadosValidos = ['pendiente', 'solicitado', 'en proceso', 'terminado'];

        if ($id <= 0 || !in_array($estado, $estadosValidos, true)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'message' => 'Datos no válidos.']);
            exit;
        }

        $stmt = $pdo->prepare('UPDATE pedidos SET estado = ? WHERE id = ?');
        $stmt->execute([$estado, $id]);

        echo json_encode(['ok' => true, 'message' => 'Estado actualizado a: ' . $estado]);
        exit;
    }

    // ── Eliminar pedido ──────────────────────────────────────
    if ($accion === 'eliminar') {
        $id = (int) ($input['id'] ?? 0);

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

    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Acción no reconocida.']);
    exit;
}

// ─── Método no soportado ─────────────────────────────────────
http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);
