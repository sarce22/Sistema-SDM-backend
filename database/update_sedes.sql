CREATE TABLE IF NOT EXISTS sedes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

INSERT IGNORE INTO sedes (id, nombre) VALUES (1, 'Sede Centro'), (2, 'Sede Norte');

-- Añadir sede_id a las tablas existentes (por defecto Sede 1)
ALTER TABLE usuarios ADD COLUMN sede_id INT DEFAULT 1;
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_sede FOREIGN KEY (sede_id) REFERENCES sedes(id);

ALTER TABLE alertas ADD COLUMN sede_id INT DEFAULT 1;
ALTER TABLE alertas ADD CONSTRAINT fk_alertas_sede FOREIGN KEY (sede_id) REFERENCES sedes(id);

ALTER TABLE inventario_chef ADD COLUMN sede_id INT DEFAULT 1;
ALTER TABLE inventario_chef ADD CONSTRAINT fk_chef_sede FOREIGN KEY (sede_id) REFERENCES sedes(id);

ALTER TABLE items_mesera ADD COLUMN sede_id INT DEFAULT 1;
ALTER TABLE items_mesera ADD CONSTRAINT fk_mesera_sede FOREIGN KEY (sede_id) REFERENCES sedes(id);

ALTER TABLE trabajadores ADD COLUMN sede_id INT DEFAULT 1;
ALTER TABLE trabajadores ADD CONSTRAINT fk_trabajadores_sede FOREIGN KEY (sede_id) REFERENCES sedes(id);

ALTER TABLE propinas_semanas ADD COLUMN sede_id INT DEFAULT 1;
ALTER TABLE propinas_semanas ADD CONSTRAINT fk_propinas_sede FOREIGN KEY (sede_id) REFERENCES sedes(id);

-- Para evitar que se pise el admin en todas las sedes, podemos dejar al admin (id=1) sin sede o en sede 1.
-- El frontend de admin controlará en qué sede está trabajando pasándolo por parámetro.
