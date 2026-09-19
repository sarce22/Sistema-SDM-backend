CREATE DATABASE IF NOT EXISTS sistemasdm;
USE sistemasdm;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('Admin', 'Chef', 'Mesera') NOT NULL
);

-- La contraseña para todos es '123456' encriptada con bcrypt
INSERT IGNORE INTO usuarios (usuario, password, rol) VALUES 
('admin', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Admin'),
('chef1', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Chef'),
('mesera1', '$2b$10$eEA9xSuecRYihtwn5P6aouAki7jTmNx6Aqjgej50CDIWZ.DEEUDgu', 'Mesera');
