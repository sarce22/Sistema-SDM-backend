/**
 * @fileoverview Rutas para la gestión del inventario del Chef (Verduras y Pescados).
 * Requiere privilegios de Chef o Administrador para todas las operaciones.
 * @module routes/chefRoutes
 */
const express = require('express');
const router = express.Router();
const chefController = require('../controllers/chefController');
const { verificarToken, verificarRolChefOAdmin } = require('../middlewares/authMiddleware');

// Validar en todas las rutas de este router
router.use(verificarToken, verificarRolChefOAdmin);

// Las rutas esperan una categoría (verduras o pescados)
router.get('/:categoria', chefController.listarItems);
router.post('/:categoria', chefController.agregarItem);
// Para editar o eliminar, no necesitamos la categoría en la URL, solo el ID
router.put('/item/:id', chefController.editarItem);
router.put('/item/:id/alerta', chefController.toggleAlerta);
router.delete('/item/:id', chefController.eliminarItem);

module.exports = router;
