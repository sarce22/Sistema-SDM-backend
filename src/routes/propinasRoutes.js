/**
 * @fileoverview Rutas para la creación y distribución semanal de propinas.
 * Requiere privilegios de Mesera o Administrador.
 * @module routes/propinasRoutes
 */
const express = require('express');
const router = express.Router();
const propinasController = require('../controllers/propinasController');
const { verificarToken, verificarRolMeseraOAdmin } = require('../middlewares/authMiddleware');

router.use(verificarToken);
router.use(verificarRolMeseraOAdmin);

router.get('/', propinasController.getSemanas);
router.post('/', propinasController.createSemana);
router.get('/:id', propinasController.getSemana);
router.put('/:id', propinasController.updateSemana);
router.put('/:id_semana/distribucion/:id_usuario', propinasController.updateDistribucion);

module.exports = router;
