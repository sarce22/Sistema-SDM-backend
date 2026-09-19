/**
 * @fileoverview Configuración de la conexión a la base de datos MySQL usando un pool de conexiones.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Pool de conexiones a la base de datos.
 * Se configura utilizando las variables de entorno para mayor seguridad.
 * @type {mysql.Pool}
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'sistemasdm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
