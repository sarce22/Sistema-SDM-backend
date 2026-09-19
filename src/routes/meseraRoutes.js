/**
 * @fileoverview Rutas para la gestión del inventario de productos de las Meseras.
 * Requiere privilegios de Mesera o Administrador.
 * @module routes/meseraRoutes
 */
const express = require('express');
const router = express.Router();
const meseraController = require('../controllers/meseraController');
const { verificarToken, verificarRolMeseraOAdmin } = require('../middlewares/authMiddleware');

// Validar en todas las rutas de este router
router.use(verificarToken, verificarRolMeseraOAdmin);

router.get('/', meseraController.listarItems);
router.post('/', meseraController.agregarItem);
router.put('/:id', meseraController.editarItem);
router.put('/:id/alerta', meseraController.toggleAlerta);
router.delete('/:id', meseraController.eliminarItem);

module.exports = router;
