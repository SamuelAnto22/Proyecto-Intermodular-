<?php
// ============================================================
// API: Gestión de Configuraciones del Coche
// POST   — crear / actualizar / solicitar (según campo "accion")
// GET    — obtener configuraciones del usuario logueado
// DELETE — borrar una configuración por ID
// ============================================================

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ─── POST: Crear, Actualizar o Solicitar ─────────────────────
if ($method === 'POST') {
    requireLogin();

    $input = json_decode(file_get_contents('php://input'), true);
    $accion = $input['accion'] ?? 'crear';
    $userId = getUserId();

    // ── Acción: SOLICITAR (cambiar estado del pedido) ────────
    if ($accion === 'solicitar') {
        $configId    = (int) ($input['configuracion_id'] ?? 0);
        $nuevoEstado = trim($input['estado'] ?? '');

        $estadosPermitidos = ['solicitado', 'pendiente'];

        if ($configId <= 0 || !in_array($nuevoEstado, $estadosPermitidos, true)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'message' => 'Datos no válidos.']);
            exit;
        }

        $stmt = $pdo->prepare(
            'UPDATE pedidos SET estado = ? WHERE configuracion_id = ? AND usuario_id = ?'
        );
        $stmt->execute([$nuevoEstado, $configId, $userId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'message' => 'Pedido no encontrado.']);
            exit;
        }

        echo json_encode(['ok' => true, 'estado' => $nuevoEstado, 'message' => 'Estado actualizado.']);
        exit;
    }

    // ── Acción: ACTUALIZAR (editar config existente) ─────────
    if ($accion === 'actualizar') {
        $id      = (int) ($input['id']     ?? 0);
        $modelo  = substr(htmlspecialchars(trim($input['modelo']    ?? ''), ENT_QUOTES, 'UTF-8'), 0, 50);
        $color   = substr(htmlspecialchars(trim($input['color']     ?? ''), ENT_QUOTES, 'UTF-8'), 0, 50);
        $llantas = substr(htmlspecialchars(trim($input['llantas']   ?? ''), ENT_QUOTES, 'UTF-8'), 0, 50);

        if ($id <= 0 || $modelo === '' || $color === '' || $llantas === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios.']);
            exit;
        }

        $stmt = $pdo->prepare(
            'UPDATE configuraciones SET modelo = ?, color = ?, llantas = ?
             WHERE id = ? AND usuario_id = ?'
        );
        $stmt->execute([$modelo, $color, $llantas, $id, $userId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Configuración no encontrada.']);
            exit;
        }

        // Resetear estado del pedido a "pendiente" porque la config cambió
        $stmt2 = $pdo->prepare('UPDATE pedidos SET estado = ? WHERE configuracion_id = ? AND usuario_id = ?');
        $stmt2->execute(['pendiente', $id, $userId]);

        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Configuración actualizada.']);
        exit;
    }

    // ── Acción: CREAR (nueva configuración — por defecto) ────
    $modelo  = substr(htmlspecialchars(trim($input['modelo']  ?? ''), ENT_QUOTES, 'UTF-8'), 0, 50);
    $color   = substr(htmlspecialchars(trim($input['color']   ?? ''), ENT_QUOTES, 'UTF-8'), 0, 50);
    $llantas = substr(htmlspecialchars(trim($input['llantas'] ?? ''), ENT_QUOTES, 'UTF-8'), 0, 50);

    if ($modelo === '' || $color === '' || $llantas === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios.']);
        exit;
    }

    // Insertar configuración
    $stmt = $pdo->prepare(
        'INSERT INTO configuraciones (usuario_id, modelo, color, llantas) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $modelo, $color, $llantas]);
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
        'SELECT c.id, c.modelo, c.color, c.llantas, c.created_at,
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
