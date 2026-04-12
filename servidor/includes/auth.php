<?php
declare(strict_types=1);

// ============================================================
// Helpers de Autenticación (basado en sesiones PHP)
//
// Convención de nombres:
//   - Funciones de lógica de negocio en español (usuarioLogueado, esAdmin,
//     requireLogin, requireAdmin, requireCsrfToken, getCsrfToken).
//   - Funciones getters de sesión en inglés (getUserId, getUserName,
//     getUserRole) por seguir la convención estándar getter de PHP/OOP.
// ============================================================

function appEnv(): string
{
    $env = $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'local';
    return strtolower(trim((string) $env));
}

if (session_status() === PHP_SESSION_NONE) {
    $isProduction = appEnv() === 'production';
    $sameSite = $_ENV['SESSION_SAMESITE'] ?? getenv('SESSION_SAMESITE') ?: 'Lax';
    $sameSite = in_array($sameSite, ['Lax', 'Strict', 'None'], true) ? $sameSite : 'Lax';

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    $secureCookie = $isProduction ? true : $isHttps;

    // Chrome exige Secure cuando SameSite=None.
    if ($sameSite === 'None') {
        $secureCookie = true;
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $secureCookie,
        'httponly' => true,
        'samesite' => $sameSite,
    ]);
    session_start();

}

/**
 * Comprobar si hay un usuario logueado.
 */
function usuarioLogueado(): bool
{
    return isset($_SESSION['user_id']);
}

/**
 * Obtener el ID del usuario logueado.
 */
function getUserId(): ?int
{
    return $_SESSION['user_id'] ?? null;
}

/**
 * Obtener el nombre del usuario logueado.
 */
function getUserName(): ?string
{
    return $_SESSION['user_name'] ?? null;
}

/**
 * Obtener el rol del usuario logueado.
 */
function getUserRole(): ?string
{
    return $_SESSION['user_role'] ?? null;
}

/**
 * Comprobar si el usuario logueado es admin.
 */
function esAdmin(): bool
{
    return (getUserRole() === 'admin');
}

/**
 * Exigir que haya sesión activa. Si no, devuelve 401 y corta.
 */
function requireLogin(): void
{
    if (!usuarioLogueado()) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'NO_SESSION', 'message' => 'Debes iniciar sesión.']);
        exit;
    }
}

/**
 * Exigir que el usuario sea admin. Si no, devuelve 403 y corta.
 */
function requireAdmin(): void
{
    requireLogin();
    if (!esAdmin()) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'FORBIDDEN', 'message' => 'Acceso solo para administradores.']);
        exit;
    }
}


/**
 * Generar token CSRF.
 */          
function getCsrfToken(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}


/**
 * Exigir token CSRF válido.
 */
function requireCsrfToken(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || $token === '' || !hash_equals(getCsrfToken(), $token)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'CSRF_INVALID', 'message' => 'Token CSRF inválido.']);
        exit;
    }
}
