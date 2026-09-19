/**
 * @fileoverview Controlador para la gestión del inventario de productos de las Meseras.
 */
const db = require('../config/db');
const alertaController = require('./alertaController');

/**
 * Obtiene todos los ítems del inventario de las Meseras.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} JSON con la lista completa de ítems.
 */
exports.listarItems = async (req, res) => {
    try {
        const sede_id = req.user.rol === 'Admin' ? (req.query.sede_id || 1) : req.user.sede_id;
        const [rows] = await db.execute('SELECT * FROM items_mesera WHERE sede_id = ?', [sede_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error listando ítems:', error);
        res.status(500).json({ error: 'Error al obtener los ítems' });
    }
};

/**
 * Agrega un nuevo ítem al inventario de las Meseras.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `nombre`, `descripcion`, `cantidad` y `precio` en req.body.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de éxito y el ID insertado.
 */
exports.agregarItem = async (req, res) => {
    try {
        const { nombre, descripcion, cantidad, precio } = req.body;
        const usuario_id = req.user.id;
        const sede_id = req.user.rol === 'Admin' ? (req.body.sede_id || 1) : req.user.sede_id;

        if (!nombre || precio === undefined) {
            return res.status(400).json({ error: 'El nombre y el precio son obligatorios' });
        }

        const [result] = await db.execute(
            'INSERT INTO items_mesera (nombre, descripcion, cantidad, precio, usuario_id, sede_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, descripcion || null, cantidad || 0, precio, usuario_id, sede_id]
        );

        res.status(201).json({ message: 'Ítem agregado con éxito', id: result.insertId });
    } catch (error) {
        console.error('Error agregando ítem:', error);
        res.status(500).json({ error: 'Error interno al agregar el ítem' });
    }
};

/**
 * Edita un ítem del inventario de las Meseras.
 * Verifica si el stock es menor a 10 y dispara una alerta si está configurada.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `id` en params y los campos a editar en req.body.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON confirmando la actualización o error 404.
 */
exports.editarItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, cantidad, precio } = req.body;

        const [result] = await db.execute(
            'UPDATE items_mesera SET nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion), cantidad = COALESCE(?, cantidad), precio = COALESCE(?, precio) WHERE id = ?',
            [
                nombre !== undefined ? nombre : null,
                descripcion !== undefined ? descripcion : null,
                cantidad !== undefined ? cantidad : null,
                precio !== undefined ? precio : null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ítem no encontrado' });
        }

        // Revisar si hay stock bajo
        const [rows] = await db.execute('SELECT nombre, cantidad, alerta_activada, sede_id FROM items_mesera WHERE id = ?', [id]);
        if (rows.length > 0) {
            const item = rows[0];
            if (item.cantidad < 10 && item.alerta_activada) {
                await alertaController.crearAlertaInterna(
                    `¡Stock Bajo! Quedan ${item.cantidad} unidades de ${item.nombre} en el stock de Meseras.`,
                    'Inventario',
                    req.user.id,
                    item.sede_id
                );
            }
        }

        res.json({ message: 'Ítem actualizado correctamente' });
    } catch (error) {
        console.error('Error editando ítem:', error);
        res.status(500).json({ error: 'Error interno al actualizar el ítem' });
    }
};

/**
 * Elimina un ítem del inventario de las Meseras.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `id` en req.params.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON confirmando la eliminación o error 404.
 */
exports.eliminarItem = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute('DELETE FROM items_mesera WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ítem no encontrado' });
        }

        res.json({ message: 'Ítem eliminado con éxito' });
    } catch (error) {
        console.error('Error eliminando ítem:', error);
        res.status(500).json({ error: 'Error interno al eliminar el ítem' });
    }
};

/**
 * Alterna el estado de alerta (encendida/apagada) para stock bajo de un ítem.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `id` en req.params.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con el nuevo estado de alerta de este ítem.
 */
exports.toggleAlerta = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT alerta_activada FROM items_mesera WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Ítem no encontrado' });
        
        const nuevoEstado = !rows[0].alerta_activada;
        await db.execute('UPDATE items_mesera SET alerta_activada = ? WHERE id = ?', [nuevoEstado, id]);
        
        res.json({ message: 'Estado de alerta actualizado', alerta_activada: nuevoEstado });
    } catch (error) {
        console.error('Error al cambiar alerta:', error);
        res.status(500).json({ error: 'Error interno al cambiar estado de alerta' });
    }
};
