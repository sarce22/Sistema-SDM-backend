/**
 * @fileoverview Configuración de la aplicación Express para SistemaSDM.
 * Exporta la instancia de app para su uso en producción y pruebas.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const meseraRoutes = require('./routes/meseraRoutes');
const chefRoutes = require('./routes/chefRoutes');
const alertaRoutes = require('./routes/alertaRoutes');
const propinasRoutes = require('./routes/propinasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const emailRoutes = require('./routes/emailRoutes');
const asignacionesRoutes = require('./routes/asignacionesRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/meseras', meseraRoutes);
app.use('/api/chef', chefRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/propinas', propinasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/asignaciones', asignacionesRoutes);

/**
 * @route GET /api/health
 * @description Endpoint de salud para verificar que el servidor está en funcionamiento.
 * @returns {Object} 200 - Objeto con el estado y un mensaje de confirmación.
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

module.exports = app;
