<?php
declare(strict_types=1);

// ============================================================
// Funciones auxiliares compartidas por los endpoints de la API
// ============================================================

/**
 * Enviar una respuesta JSON estandarizada y terminar la ejecución.
 */
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

/**
 * Generar la ruta relativa hacia un archivo del cliente.
 * Útil para devolver URLs de redirección desde la API.
 */
function rutaCliente(string $archivo): string
{
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $base = preg_replace('#/servidor/api/[^/]+$#', '', $scriptName) ?? '';

    return rtrim($base, '/') . '/cliente/' . ltrim($archivo, '/');
}

// ============================================================
// Funciones de Rate Limiting y Protección Anti-Fuerza Bruta
// ============================================================

/**
 * Obtener la IP real del cliente.
 * En entorno local se usa REMOTE_ADDR exclusivamente.
 * En producción, si se configura APP_ENV=production y hay un proxy inverso conocido,
 * se puede confiar en HTTP_X_FORWARDED_FOR bajo verificación.
 */
function getClientIp(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    // En producción con proxy de confianza, se puede descomentar la siguiente línea:
    // $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $ip;

    if (str_contains($ip, ',')) {
        $ip = trim(explode(',', $ip)[0]);
    }

    return mb_substr($ip, 0, 45);
}

/**
 * Limpiar intentos de login antiguos fuera de la ventana de tiempo.
 */
function limpiarIntentosAntiguos(PDO $pdo, int $ventanaSeg): void
{
    $stmt = $pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL ? SECOND)');
    $stmt->execute([$ventanaSeg]);
}

/**
 * Contar intentos de login recientes para un email o IP.
 */
function contarIntentosRecientes(PDO $pdo, string $email, string $ip, int $ventanaSeg): int
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS total
         FROM login_attempts
         WHERE attempted_at >= (NOW() - INTERVAL ? SECOND)
           AND (email = ? OR ip = ?)'
    );
    $stmt->execute([$ventanaSeg, $email, $ip]);

    return (int) ($stmt->fetch()['total'] ?? 0);
}

/**
 * Registrar un intento de login fallido.
 */
function registrarIntentoFallido(PDO $pdo, string $email, string $ip): void
{
    $stmt = $pdo->prepare('INSERT INTO login_attempts (email, ip) VALUES (?, ?)');
    $stmt->execute([$email, $ip]);
}

/**
 * Limpiar intentos de login tras un login exitoso.
 */
function limpiarIntentosExitosos(PDO $pdo, string $email, string $ip): void
{
    $stmt = $pdo->prepare('DELETE FROM login_attempts WHERE email = ? OR ip = ?');
    $stmt->execute([$email, $ip]);
}

// ============================================================
// Funciones de Acceso a Datos Compartidas
// ============================================================

/**
 * Obtener todas las configuraciones de un usuario con el estado de su pedido.
 * Query compartida por perfil.php y guardar_config.php para evitar duplicación.
 *
 * @return array<array<string, mixed>>
 */
function obtenerConfiguracionesUsuario(PDO $pdo, int $usuarioId): array
{
    $stmt = $pdo->prepare(
        'SELECT c.id, c.modelo, c.color, c.llantas, c.created_at,
                p.estado AS pedido_estado
         FROM configuraciones c
         LEFT JOIN pedidos p ON p.configuracion_id = c.id
         WHERE c.usuario_id = ?
         ORDER BY c.created_at DESC'
    );
    $stmt->execute([$usuarioId]);

    return $stmt->fetchAll();
}