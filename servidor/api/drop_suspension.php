<?php
// Script temporal: elimina la columna suspension de la tabla configuraciones
require_once __DIR__ . '/../includes/db.php';

try {
    $pdo->exec("ALTER TABLE configuraciones DROP COLUMN suspension");
    echo "✅ Columna 'suspension' eliminada de la tabla configuraciones.";
} catch (PDOException $e) {
    // Si ya no existe, no es un error crítico
    if (strpos($e->getMessage(), "check that column/key exists") !== false ||
        strpos($e->getMessage(), "Unknown column") !== false) {
        echo "ℹ️ La columna 'suspension' ya no existía (ya fue eliminada).";
    } else {
        echo "❌ Error: " . $e->getMessage();
    }
}
