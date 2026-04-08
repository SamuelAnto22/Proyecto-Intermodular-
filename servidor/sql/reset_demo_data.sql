-- ==========================================================
-- MIDNIGHT CUSTOMS - RESETEO RÁPIDO DE DATOS DEMO
-- ==========================================================
-- Uso:
--   mysql -u root -p < servidor/sql/reset_demo_data.sql

USE midnight_customs_demo;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE pedidos;
TRUNCATE TABLE configuraciones;
TRUNCATE TABLE login_attempts;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- Usuarios demo funcionales (bcrypt validado)
-- admin@midnight.com  / admin123
-- carlos@ejemplo.com  / cliente123
INSERT INTO usuarios (id, nombre, email, password, rol) VALUES
(1, 'Admin Midnight', 'admin@midnight.com', '$2y$12$K3TUmUf1FktjPCf0mBbbz.cmlvNxlB5EDB0.HFbpgkPEHkUvhnggW', 'admin'),
(2, 'Carlos Cliente', 'carlos@ejemplo.com', '$2y$12$R78QE9AzzOKvR65M/h6DQukw.76Xgvv4qGpDjJg9QrD.fAIFAR2MO', 'cliente'),
(3, 'Elena Prueba', 'elena@ejemplo.com', '$2y$12$R78QE9AzzOKvR65M/h6DQukw.76Xgvv4qGpDjJg9QrD.fAIFAR2MO', 'cliente');

INSERT INTO configuraciones (id, usuario_id, modelo, color, llantas) VALUES
(1, 2, 'audi_a3', 'rojo', 'deportiva'),
(2, 2, 'toyota_supra', 'negro', 'competicion'),
(3, 3, 'bmw_serie1', 'blanco', 'multiradio'),
(4, 3, 'volkswagen_golf', 'verde', 'palos');

INSERT INTO pedidos (id, usuario_id, configuracion_id, estado) VALUES
(1, 2, 1, 'solicitado'),
(2, 2, 2, 'en proceso'),
(3, 3, 3, 'terminado'),
(4, 3, 4, 'solicitado');

-- Dataset de referencia para defensas (evita desalineaciones entre profesores)
-- dataset_version: demo-2026.04
-- dataset_date: 2026-04-08
