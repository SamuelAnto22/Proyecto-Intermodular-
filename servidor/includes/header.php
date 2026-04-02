<?php
// ============================================================
// Cabeceras comunes para las respuestas de la API
// ============================================================

header('Content-Type: application/json; charset=utf-8');

// CORS — permitir peticiones solo desde localhost (ajuste de seguridad Día 1)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === 'http://localhost' || $origin === 'http://127.0.0.1') {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
