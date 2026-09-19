/**
 * @fileoverview Controlador para la autenticación de usuarios.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Autentica a un usuario verificando sus credenciales y retorna un token JWT.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `usuario` y `password` en req.body.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con el mensaje, el token y los datos del usuario, o un error (400, 401, 500).
 */
exports.login = async (req, res) => {
    try {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({ error: 'Por favor, ingrese usuario y contraseña' });
        }

        const [rows] = await db.execute('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = rows[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, rol: user.rol, usuario: user.usuario, sede_id: user.sede_id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                usuario: user.usuario,
                rol: user.rol,
                sede_id: user.sede_id
            }
        });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
