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
const poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'sistemasdm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// TiDB Cloud y proveedores en la nube requieren SSL/TLS
if (process.env.DB_SSL === 'true' || (process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1'))) {
    poolConfig.ssl = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED === 'true'
    };
    poolConfig.connectTimeout = 20000;
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;
