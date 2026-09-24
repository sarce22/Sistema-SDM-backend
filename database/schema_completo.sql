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
    nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO sedes (id, nombre) VALUES 
(1, 'Sede Centro'), 
(2, 'Sede Norte');

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

-- Semilla de usuarios (Contraseña por defecto para todos: '123456' encriptada con bcrypt)
INSERT IGNORE INTO usuarios (id, usuario, nombre, password, rol, sede_id) VALUES 
(1, 'admin', 'Administrador General', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Admin', 1),
(2, 'chef1', 'Carlos Cocina', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Chef', 1),
(3, 'mesera1', 'Ana Servicio', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera', 1);

-- 3. Tabla de Inventario de Cocina (Chef)
CREATE TABLE IF NOT EXISTS inventario_chef (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    cantidad DECIMAL(10,2) DEFAULT 0,
    unidad_medida VARCHAR(20) NOT NULL,
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

-- 6. Tabla de Asignaciones Diarias (Tablero Kanban de Personal)
CREATE TABLE IF NOT EXISTS asignaciones_diarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    sede_id INT DEFAULT NULL,
    fecha DATE NOT NULL,
    fijado TINYINT(1) DEFAULT 0,
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
