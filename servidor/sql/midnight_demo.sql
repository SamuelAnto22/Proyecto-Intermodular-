-- ==========================================================
-- MIDNIGHT CUSTOMS - BASE DE DATOS DE DEMO
-- ==========================================================

-- 1. Crear la base de datos (por si no existe)
CREATE DATABASE IF NOT EXISTS midnight_customs_demo
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE midnight_customs_demo;

-- 2. Eliminar tablas antiguas si existen (orden inverso)
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS configuraciones;
DROP TABLE IF EXISTS usuarios;

-- 3. Crear Estructura
CREATE TABLE usuarios (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(100)    NOT NULL,
    email      VARCHAR(150)    NOT NULL UNIQUE,
    password   VARCHAR(255)    NOT NULL,
    rol        ENUM('admin', 'cliente') DEFAULT 'cliente',
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE configuraciones (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT             NOT NULL,
    modelo      VARCHAR(50)     NOT NULL,
    color       VARCHAR(50)     NOT NULL,
    llantas     VARCHAR(50)     NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE pedidos (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id       INT NOT NULL,
    configuracion_id INT NOT NULL,
    estado           ENUM('pendiente', 'solicitado', 'en proceso', 'terminado') DEFAULT 'pendiente',
    fecha            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (configuracion_id) REFERENCES configuraciones(id) ON DELETE CASCADE
);


CREATE TABLE login_attempts (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(150)    NOT NULL,
    ip            VARCHAR(45)     NOT NULL,
    attempted_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_attempts_email_time (email, attempted_at),
    INDEX idx_login_attempts_ip_time (ip, attempted_at)
);

-- ==========================================================
-- DATOS DE PRUEBA PARA DEFENSA DE 2º DAW
-- ==========================================================

-- Usuarios (contraseña para todos: cliente123 y admin123)
INSERT INTO usuarios (id, nombre, email, password, rol) VALUES
(1, 'Admin Midnight', 'admin@midnight.com', '$2y$12$K3TUmUf1FktjPCf0mBbbz.cmlvNxlB5EDB0.HFbpgkPEHkUvhnggW', 'admin'),
(2, 'Carlos Cliente', 'carlos@ejemplo.com', '$2y$12$R78QE9AzzOKvR65M/h6DQukw.76Xgvv4qGpDjJg9QrD.fAIFAR2MO', 'cliente'),
(3, 'Elena Prueba', 'elena@ejemplo.com', '$2y$12$R78QE9AzzOKvR65M/h6DQukw.76Xgvv4qGpDjJg9QrD.fAIFAR2MO', 'cliente');

-- Configuraciones de coches (Usuario 2 y 3)
INSERT INTO configuraciones (id, usuario_id, modelo, color, llantas) VALUES
(1, 2, 'audi_a3', 'rojo', 'deportiva'),
(2, 2, 'toyota_supra', 'negro', 'competicion'),
(3, 3, 'bmw_serie1', 'blanco', 'multiradio'),
(4, 3, 'volkswagen_golf', 'verde', 'palos');

-- Pedidos (Estados distintos para el panel de admin)
INSERT INTO pedidos (usuario_id, configuracion_id, estado) VALUES
(2, 1, 'solicitado'),
(2, 2, 'en proceso'),
(3, 3, 'terminado'),
(3, 4, 'solicitado');
