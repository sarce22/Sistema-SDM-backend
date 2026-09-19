/**
 * @fileoverview Controlador para la gestión del inventario del Chef (Verduras y Pescados).
 */
const db = require('../config/db');
const alertaController = require('./alertaController');

/**
 * Valida y formatea la categoría del inventario del Chef.
 * 
 * @param {string} cat - Categoría recibida en la petición.
 * @returns {string|null} La categoría formateada ('Verduras' o 'Pescados') o null si es inválida.
 */
const validarCategoria = (cat) => {
    const categoriaFormateada = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
    if (['Verduras', 'Pescados'].includes(categoriaFormateada)) {
        return categoriaFormateada;
    }
    return null;
};

/**
 * Obtiene todos los ítems de una categoría específica del inventario del Chef.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `categoria` en req.params.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con la lista de ítems de la categoría.
 */
exports.listarItems = async (req, res) => {
    try {
        const categoria = validarCategoria(req.params.categoria);
        if (!categoria) return res.status(400).json({ error: 'Categoría inválida' });

        const sede_id = req.user.rol === 'Admin' ? (req.query.sede_id || 1) : req.user.sede_id;
        const [rows] = await db.execute('SELECT * FROM inventario_chef WHERE categoria = ? AND sede_id = ?', [categoria, sede_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error listando inventario chef:', error);
        res.status(500).json({ error: 'Error al obtener el inventario' });
    }
};

/**
 * Agrega un nuevo ítem al inventario del Chef en la categoría especificada.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `nombre`, `cantidad`, `unidad_medida` en req.body.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de éxito y el ID del nuevo ítem.
 */
exports.agregarItem = async (req, res) => {
    try {
        const categoria = validarCategoria(req.params.categoria);
        if (!categoria) return res.status(400).json({ error: 'Categoría inválida' });

        const { nombre, cantidad, unidad_medida } = req.body;
        const usuario_id = req.user.id;
        const sede_id = req.user.rol === 'Admin' ? (req.body.sede_id || 1) : req.user.sede_id;

        if (!nombre || !unidad_medida) {
            return res.status(400).json({ error: 'El nombre y la unidad_medida (kg/unidades) son obligatorios' });
        }

        if (!['kg', 'unidades'].includes(unidad_medida.toLowerCase())) {
            return res.status(400).json({ error: 'La unidad de medida debe ser "kg" o "unidades"' });
        }

        const [result] = await db.execute(
            'INSERT INTO inventario_chef (nombre, categoria, cantidad, unidad_medida, usuario_id, sede_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, categoria, cantidad || 0, unidad_medida.toLowerCase(), usuario_id, sede_id]
        );

        res.status(201).json({ message: `${categoria} agregado con éxito`, id: result.insertId });
    } catch (error) {
        console.error('Error agregando ítem:', error);
        res.status(500).json({ error: 'Error interno al agregar el ítem' });
    }
};

/**
 * Edita un ítem existente en el inventario del Chef.
 * También verifica si el stock queda bajo (menor a 10) para disparar una alerta si está activada.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `id` en params y campos a actualizar en req.body.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de éxito o error 404 si no se encuentra el ítem.
 */
exports.editarItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, cantidad, unidad_medida } = req.body;

        if (unidad_medida && !['kg', 'unidades'].includes(unidad_medida.toLowerCase())) {
            return res.status(400).json({ error: 'La unidad de medida debe ser "kg" o "unidades"' });
        }

        const [result] = await db.execute(
            'UPDATE inventario_chef SET nombre = COALESCE(?, nombre), cantidad = COALESCE(?, cantidad), unidad_medida = COALESCE(?, unidad_medida) WHERE id = ?',
            [
                nombre !== undefined ? nombre : null,
                cantidad !== undefined ? cantidad : null,
                unidad_medida !== undefined ? unidad_medida.toLowerCase() : null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ítem no encontrado' });
        }

        // Revisar si hay stock bajo
        const [rows] = await db.execute('SELECT nombre, categoria, cantidad, unidad_medida, alerta_activada, sede_id FROM inventario_chef WHERE id = ?', [id]);
        if (rows.length > 0) {
            const item = rows[0];
            if (item.cantidad < 10 && item.alerta_activada) {
                await alertaController.crearAlertaInterna(
                    `¡Stock Bajo! Quedan ${item.cantidad} ${item.unidad_medida} de ${item.nombre} en ${item.categoria}.`,
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
 * Elimina un ítem del inventario del Chef.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera el `id` del ítem en req.params.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de éxito o error 404.
 */
exports.eliminarItem = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute('DELETE FROM inventario_chef WHERE id = ?', [id]);

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
 * Activa o desactiva la alerta de stock bajo para un ítem específico del Chef.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera el `id` del ítem en req.params.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con el nuevo estado de la alerta.
 */
exports.toggleAlerta = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT alerta_activada FROM inventario_chef WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Ítem no encontrado' });
        
        const nuevoEstado = !rows[0].alerta_activada;
        await db.execute('UPDATE inventario_chef SET alerta_activada = ? WHERE id = ?', [nuevoEstado, id]);
        
        res.json({ message: 'Estado de alerta actualizado', alerta_activada: nuevoEstado });
    } catch (error) {
        console.error('Error al cambiar alerta:', error);
        res.status(500).json({ error: 'Error interno al cambiar estado de alerta' });
    }
};
