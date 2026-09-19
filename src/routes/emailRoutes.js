/**
 * @fileoverview Rutas para la integración de correos electrónicos.
 * Requiere autenticación para enviar correos.
 */
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Ruta: POST /api/email/enviar
router.post('/enviar', verificarToken, emailController.enviarReportePDF);

module.exports = router;
