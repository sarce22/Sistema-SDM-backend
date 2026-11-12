-- ========================================================
-- SISTEMASDM - SCRIPT MAESTRO DE INICIALIZACIÓN (TiDB / MySQL)
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS sistemasdm;
USE sistemasdm;

-- 1. Tabla de Sedes
CREATE TABLE IF NOT EXISTS sedes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    mod_meseras TINYINT(1) DEFAULT 1,
    mod_chef TINYINT(1) DEFAULT 1,
    mod_alertas TINYINT(1) DEFAULT 1,
    mod_propinas TINYINT(1) DEFAULT 1,
    mod_accesos TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO sedes (id, nombre, mod_meseras, mod_chef, mod_alertas, mod_propinas, mod_accesos) VALUES 
(1, 'Sede Centro', 1, 1, 1, 1, 1), 
(2, 'Sede Norte', 1, 1, 1, 1, 1),
(3, 'Sede Express Chapinero', 1, 1, 0, 0, 0);

-- 2. Tabla de Usuarios del Sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('Admin', 'Chef', 'Mesera') NOT NULL,
    sede_id INT DEFAULT 1,
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Semilla de usuarios (Contraseña/PIN por defecto para todos: '123456' encriptada con bcrypt)
INSERT IGNORE INTO usuarios (id, usuario, nombre, password, rol, sede_id) VALUES 
(1, 'admin', 'Sebastián Martínez (Admin)', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Admin', 1),
(2, 'chef1', 'Carlos Andrés Ramírez', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Chef', 1),
(3, 'mesera1', 'Valentina Ospina', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 1),
(4, 'diego.cocina', 'Diego Fernando Herrera', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Chef', 1),
(5, 'luisa.cocina', 'Luisa Fernanda Ríos', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Chef', 2),
(6, 'miguel.cocina', 'Miguel Ángel Castro', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Chef', 2),
(7, 'andres.cocina', 'Andrés Felipe Mora', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Chef', 3),
(8, 'Camila', 'Camila Andrea Vargas', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 1),
(9, 'santiago.m', 'Santiago Mejía López', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 1),
(10, 'daniela.m', 'Daniela Alejandra Parra', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 1),
(11, 'mariana.m', 'Mariana Restrepo Díaz', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 1),
(12, 'laura.m', 'Laura Sofía Mendoza', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 2),
(13, 'mateo.m', 'Mateo Cano Salazar', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 2),
(14, 'paula.m', 'Paula Andrea Quintero', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 2),
(15, 'nicolas.m', 'Nicolás Pineda Gómez', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 2),
(16, 'natalia.m', 'Natalia Giraldo Vélez', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 3);

-- 3. Tabla de Inventario de Cocina (Chef)
CREATE TABLE IF NOT EXISTS inventario_chef (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    cantidad DECIMAL(10,2) DEFAULT 0,
    unidad_medida VARCHAR(20) NOT NULL,
    alerta_activada TINYINT(1) DEFAULT 0,
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    sede_id INT DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabla de Inventario de Salón (Meseras)
CREATE TABLE IF NOT EXISTS items_mesera (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    cantidad INT DEFAULT 0,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    alerta_activada TINYINT(1) DEFAULT 0,
    usuario_id INT,
    sede_id INT DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabla de Alertas y Notificaciones Internas
CREATE TABLE IF NOT EXISTS alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mensaje VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    leida TINYINT(1) DEFAULT 0,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    sede_id INT DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabla de Asignaciones Diarias (Tablero Kanban de Personal y Turnos)
CREATE TABLE IF NOT EXISTS asignaciones_diarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    sede_id INT DEFAULT NULL,
    fecha DATE NOT NULL,
    fijado TINYINT(1) DEFAULT 0,
    horario VARCHAR(100) DEFAULT '11:00 AM - 8:00 PM',
    dias_trabajo TEXT,
    dia_libre VARCHAR(50) DEFAULT 'Lunes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_asignacion (usuario_id, fecha),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabla de Semanas de Liquidación de Propinas
CREATE TABLE IF NOT EXISTS propinas_semanas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    sede_id INT DEFAULT 1,
    total_efectivo DECIMAL(12,2) DEFAULT 0.00,
    incluido_martes TINYINT(1) DEFAULT 1,
    incluido_miercoles TINYINT(1) DEFAULT 1,
    incluido_jueves TINYINT(1) DEFAULT 1,
    incluido_viernes TINYINT(1) DEFAULT 1,
    incluido_sabado TINYINT(1) DEFAULT 1,
    incluido_domingo TINYINT(1) DEFAULT 1,
    incluido_lunes TINYINT(1) DEFAULT 1,
    estado VARCHAR(20) DEFAULT 'Borrador',
    descuento_cafe DECIMAL(12,2) DEFAULT 0.00,
    descuentos_meseros TEXT,
    descuentos_cocina TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabla de Distribución Individual de Propinas por Colaborador
CREATE TABLE IF NOT EXISTS propinas_distribucion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_semana INT NOT NULL,
    id_usuario INT NOT NULL,
    dias_trabajados INT DEFAULT 7,
    pagado TINYINT(1) DEFAULT 0,
    dias_seleccionados TEXT,
    FOREIGN KEY (id_semana) REFERENCES propinas_semanas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
