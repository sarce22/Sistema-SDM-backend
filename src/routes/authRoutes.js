/**
 * @fileoverview Rutas públicas para la autenticación de usuarios en el sistema.
 * @module routes/authRoutes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

module.exports = router;
