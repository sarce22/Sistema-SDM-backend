CREATE TABLE IF NOT EXISTS sedes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    mod_meseras TINYINT(1) DEFAULT 1,
    mod_chef TINYINT(1) DEFAULT 1,
    mod_alertas TINYINT(1) DEFAULT 1,
    mod_propinas TINYINT(1) DEFAULT 1,
    mod_accesos TINYINT(1) DEFAULT 1
);

ALTER TABLE sedes ADD COLUMN IF NOT EXISTS mod_meseras TINYINT(1) DEFAULT 1;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS mod_chef TINYINT(1) DEFAULT 1;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS mod_alertas TINYINT(1) DEFAULT 1;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS mod_propinas TINYINT(1) DEFAULT 1;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS mod_accesos TINYINT(1) DEFAULT 1;

INSERT IGNORE INTO sedes (id, nombre, mod_meseras, mod_chef, mod_alertas, mod_propinas, mod_accesos) VALUES (1, 'Sede Centro', 1, 1, 1, 1, 1), (2, 'Sede Norte', 1, 1, 1, 1, 1);

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
