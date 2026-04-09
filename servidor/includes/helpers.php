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
