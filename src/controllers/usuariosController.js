/**
 * @fileoverview Controlador para la administración de usuarios del sistema (cuentas de acceso).
 */
const bcrypt = require('bcrypt');
const db = require('../config/db');
const alertaController = require('./alertaController');

/**
 * Obtiene la lista de todos los usuarios registrados (id, usuario, rol).
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} JSON con la lista de usuarios.
 */
exports.getUsuarios = async (req, res) => {
    try {
        const sede_id = req.query.sede_id;
        let query = 'SELECT id, usuario, nombre, rol, sede_id FROM usuarios';
        const queryParams = [];

        if (sede_id) {
            query += ' WHERE sede_id = ?';
            queryParams.push(sede_id);
        }

        query += ' ORDER BY rol, usuario ASC';

        const [rows] = await db.execute(query, queryParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

/**
 * Crea una nueva cuenta de usuario. Verifica que el nombre de usuario no exista
 * previamente y hashea la contraseña antes de guardar.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `usuario`, `password`, `rol` en req.body.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con el ID del nuevo usuario y mensaje de éxito o error 400.
 */
exports.crearUsuario = async (req, res) => {
    try {
        const { usuario, nombre, password, rol } = req.body;
        // Si no mandan nombre, usamos el usuario como nombre por defecto
        const nombreFinal = nombre || usuario;
        
        if (!usuario || !password || !rol) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        
        const [existente] = await db.execute('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
        if (existente.length > 0) return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.execute('INSERT INTO usuarios (usuario, nombre, password, rol) VALUES (?, ?, ?, ?)', [usuario, nombreFinal, hash, rol]);
        
        res.status(201).json({ id: result.insertId, usuario, nombre: nombreFinal, rol, message: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

/**
 * Elimina una cuenta de usuario. Previene que un usuario se elimine a sí mismo.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `id` en params.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de éxito o error 400.
 */
exports.eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (id == req.user.id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta mientras estás conectado.' });
        
        await db.execute('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

/**
 * Edita la información de un usuario. Permite actualizar el nombre de usuario,
 * el rol, y opcionalmente la contraseña (hasheándola si se proporciona una nueva).
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `id` en params, campos en body.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de éxito o error 400 si el usuario ya existe.
 */
exports.editarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario, nombre, password, rol } = req.body;
        
        if (!usuario || !rol) return res.status(400).json({ error: 'El nombre de usuario y el rol son obligatorios' });
        
        // Verificar si el nuevo nombre de usuario ya existe en otro id
        const [existente] = await db.execute('SELECT id FROM usuarios WHERE usuario = ? AND id != ?', [usuario, id]);
        if (existente.length > 0) return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        
        const nombreFinal = nombre || usuario;

        if (password) {
            const hash = await bcrypt.hash(password, 10);
            await db.execute('UPDATE usuarios SET usuario = ?, nombre = ?, password = ?, rol = ? WHERE id = ?', [usuario, nombreFinal, hash, rol, id]);
        } else {
            await db.execute('UPDATE usuarios SET usuario = ?, nombre = ?, rol = ? WHERE id = ?', [usuario, nombreFinal, rol, id]);
        }
        
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al editar usuario' });
    }
};
