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
    suspension  VARCHAR(50)     NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Tabla: pedidos
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    configuracion_id  INT             NOT NULL,
    usuario_id        INT             NOT NULL,
    estado            ENUM('pendiente','en proceso','terminado') NOT NULL DEFAULT 'pendiente',
    fecha             TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (configuracion_id) REFERENCES configuraciones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id)       REFERENCES usuarios(id)        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Usuario admin por defecto (contraseña: admin123)
-- El hash se genera con password_hash('admin123', PASSWORD_BCRYPT)
-- ============================================================
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Administrador', 'admin@midnight.com', '$2y$10$YJ1Xk0V3fK7vGxq5q5Q5eO9J6Z8zH4d2wKk5r3nA1bC7dE9fG0hI2', 'admin');
