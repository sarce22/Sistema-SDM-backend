CREATE TABLE IF NOT EXISTS inventario_chef (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria ENUM('Verduras', 'Pescados') NOT NULL,
    cantidad DECIMAL(10,2) DEFAULT 0,
    unidad_medida ENUM('kg', 'unidades') NOT NULL,
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
