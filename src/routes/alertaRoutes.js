/**
 * @fileoverview Rutas para la gestión de alertas del sistema.
 * Requiere privilegios de Administrador para todas las operaciones.
 * @module routes/alertaRoutes
 */
const express = require('express');
const router = express.Router();
const alertaController = require('../controllers/alertaController');
const { verificarToken, verificarRolAdmin } = require('../middlewares/authMiddleware');

// Solo el Admin puede ver y manejar las alertas
router.use(verificarToken, verificarRolAdmin);

router.get('/', alertaController.listarAlertas);
router.get('/count/unread', alertaController.contarNoLeidas);
router.put('/leidas/todas', alertaController.marcarTodasLeidas);
router.put('/:id/leida', alertaController.marcarLeida);

module.exports = router;
