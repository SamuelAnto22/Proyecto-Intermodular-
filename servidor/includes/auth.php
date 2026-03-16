<?php
// ============================================================
// Helpers de Autenticación (basado en sesiones PHP)
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
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
