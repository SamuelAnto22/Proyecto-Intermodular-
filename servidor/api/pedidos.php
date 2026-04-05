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

    $statsStmt = $pdo->query(
        "SELECT 
            COUNT(*) AS total_pedidos,
            SUM(estado = 'pendiente')   AS pendientes,
            SUM(estado = 'solicitado')  AS solicitados,
            SUM(estado = 'en proceso')  AS en_proceso,
            SUM(estado = 'terminado')   AS terminados
         FROM pedidos"
    );
    
    // Obtenemos los resultados (PDO::FETCH_ASSOC evita que devuelva un array con índices numéricos dobles)
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    // --- RESPUESTA JSON ---
    echo json_encode([
        'ok'   => true,
        'data' => $pedidos,
        'stats' => [
            'total_clientes' => (int) $totalClientes,
            // Usamos ?? 0 por si la tabla 'pedidos' está completamente vacía y SUM devuelve null
            'total_pedidos'  => (int) ($stats['total_pedidos'] ?? 0),
            'pendientes'     => (int) ($stats['pendientes'] ?? 0),
            'solicitados'    => (int) ($stats['solicitados'] ?? 0),
            'en_proceso'     => (int) ($stats['en_proceso'] ?? 0),
            'terminados'     => (int) ($stats['terminados'] ?? 0)
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
