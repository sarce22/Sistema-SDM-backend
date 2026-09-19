/**
 * @fileoverview Rutas para la administración de las cuentas de usuario (crear, editar, eliminar).
 * Requiere estrictamente privilegios de Administrador.
 * @module routes/usuariosRoutes
 */
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verificarToken, verificarRolAdmin } = require('../middlewares/authMiddleware');

router.use(verificarToken);
router.use(verificarRolAdmin);

router.get('/', usuariosController.getUsuarios);
router.post('/', usuariosController.crearUsuario);
router.put('/:id', usuariosController.editarUsuario);
router.delete('/:id', usuariosController.eliminarUsuario);

module.exports = router;
