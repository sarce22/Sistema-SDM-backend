const express = require('express');
const router = express.Router();
const asignacionesController = require('../controllers/asignacionesController');
const { verificarToken, verificarRolAdmin } = require('../middlewares/authMiddleware');

// Cualquier usuario puede ver las asignaciones de hoy o de un día específico
router.get('/', verificarToken, asignacionesController.obtenerAsignaciones);

// Sólo el administrador puede modificar las asignaciones
router.post('/', [verificarToken, verificarRolAdmin], asignacionesController.guardarAsignaciones);

module.exports = router;
