/**
 * @fileoverview Rutas para la administración dinámica de sedes y sus módulos.
 * Cualquier usuario autenticado puede consultar sedes; solo Admin puede crear, editar o eliminar.
 * @module routes/sedesRoutes
 */
const express = require('express');
const router = express.Router();
const sedesController = require('../controllers/sedesController');
const { verificarToken, verificarRolAdmin } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', sedesController.listarSedes);
router.get('/:id', sedesController.obtenerSede);
router.post('/', verificarRolAdmin, sedesController.crearSede);
router.put('/:id', verificarRolAdmin, sedesController.editarSede);
router.delete('/:id', verificarRolAdmin, sedesController.eliminarSede);

module.exports = router;
