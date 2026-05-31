-- ============================================================
-- Midnight Customs - Esquema de Base de Datos
-- ============================================================

CREATE DATABASE IF NOT EXISTS midnight_customs
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE midnight_customs;

-- ============================================================
-- Tabla: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,           -- bcrypt hash
    rol         ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- Tabla: configuraciones
-- ============================================================
CREATE TABLE IF NOT EXISTS configuraciones (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT             NOT NULL,
    modelo      VARCHAR(50)     NOT NULL,
    color       VARCHAR(50)     NOT NULL,
    llantas     VARCHAR(50)     NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_configuraciones_usuario (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Tabla: pedidos
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    configuracion_id  INT             NOT NULL,
    usuario_id        INT             NOT NULL,
    estado            ENUM('pendiente','solicitado','en proceso','terminado') NOT NULL DEFAULT 'pendiente',
    fecha             TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_pedidos_configuracion (configuracion_id),
    INDEX idx_pedidos_usuario (usuario_id),
    INDEX idx_pedidos_estado (estado),
    UNIQUE KEY uq_pedidos_configuracion (configuracion_id),
    FOREIGN KEY (configuracion_id) REFERENCES configuraciones(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (usuario_id)       REFERENCES usuarios(id)        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- Tabla: login_attempts (protección anti fuerza bruta)
-- ============================================================
CREATE TABLE IF NOT EXISTS login_attempts (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(150)    NOT NULL,
    ip            VARCHAR(45)     NOT NULL,
    attempted_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_attempts_email_time (email, attempted_at),
    INDEX idx_login_attempts_ip_time (ip, attempted_at)
) ENGINE=InnoDB;