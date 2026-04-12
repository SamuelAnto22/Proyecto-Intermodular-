<?php
declare(strict_types=1);

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

try {

// ============================================================
// GET: Listar todos los pedidos + estadísticas
// ============================================================
if ($method === 'GET') {
    requireAdmin();

    // Pedidos con detalle.
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

    // Estadísticas.
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
    
    // Usamos PDO::FETCH_ASSOC para evitar índices numéricos duplicados.
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    // Respuesta JSON.
    echo json_encode([
        'ok' => true,
        'data' => $pedidos,
        'stats' => [
            'total_clientes' => (int) $totalClientes,
            // SUM puede devolver null si no hay pedidos.
            'total_pedidos' => (int) ($stats['total_pedidos'] ?? 0),
            'pendientes' => (int) ($stats['pendientes'] ?? 0),
            'solicitados' => (int) ($stats['solicitados'] ?? 0),
            'en_proceso' => (int) ($stats['en_proceso'] ?? 0),
            'terminados' => (int) ($stats['terminados'] ?? 0),
        ],
    ]);
    exit;
}

// ============================================================
// POST: Cambiar estado o eliminar pedido
// ============================================================
if ($method === 'POST') {
    requireAdmin();
    requireCsrfToken();

    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'JSON inválido.']);
        exit;
    }
    $accion = $input['accion'] ?? '';

    // Cambiar estado.
    if ($accion === 'cambiar_estado') {
        $id = (int) ($input['id'] ?? 0);
        $estado = trim($input['estado'] ?? '');

        $estadosValidos = ['pendiente', 'solicitado', 'en proceso', 'terminado'];

        if ($id <= 0 || !in_array($estado, $estadosValidos, true)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'message' => 'Datos de entrada no válidos.']);
            exit;
        }
        $stmt = $pdo->prepare('UPDATE pedidos SET estado = ? WHERE id = ?');
        $stmt->execute([$estado, $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'message' => 'Pedido no encontrado o estado sin cambios.']);
            exit;
        }

        echo json_encode(['ok' => true, 'message' => 'Estado actualizado a: ' . $estado]);
        exit;

    }

    // Eliminar pedido.
    if ($accion === 'eliminar') {
        $id = (int) ($input['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'message' => 'ID no válido.']);
            exit;
        }

        // 1) Buscar configuracion_id del pedido.
        $stmt = $pdo->prepare('SELECT configuracion_id FROM pedidos WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'message' => 'Pedido no encontrado.']);
            exit;
        }

        $configId = (int) $row['configuracion_id'];

        // 2) Borrar configuración (elimina también su pedido por ON DELETE CASCADE).
        $stmt = $pdo->prepare('DELETE FROM configuraciones WHERE id = ?');
        $stmt->execute([$configId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'message' => 'Configuración asociada no encontrada.']);
            exit;
        }

        echo json_encode(['ok' => true, 'message' => 'Pedido y configuración eliminados.']);
        exit;
    }

    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Acción no reconocida.']);
    exit;
}

// ============================================================
// Método no soportado
// ============================================================
http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);
exit;

} catch (Throwable $e) {
    error_log('[pedidos.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error interno del servidor.', 'error' => 'INTERNAL_ERROR']);
    exit;
}
