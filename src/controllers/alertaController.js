/**
 * @fileoverview Controlador para la gestión de notificaciones y alertas del sistema.
 */
const db = require('../config/db');

// Función interna para ser usada por otros controladores
/**
 * Función interna para crear alertas desde otros controladores (ej. inventario bajo).
 * 
 * @param {string} mensaje - El texto descriptivo de la alerta.
 * @param {string} tipo - El tipo o categoría de la alerta (ej. 'Inventario').
 * @param {number|null} usuario_id - ID del usuario que disparó la acción, si aplica.
 * @returns {Promise<void>} No retorna datos al cliente, solo inserta en BD.
 */
exports.crearAlertaInterna = async (mensaje, tipo, usuario_id, sede_id = 1) => {
    try {
        await db.execute(
            'INSERT INTO alertas (mensaje, tipo, usuario_id, sede_id) VALUES (?, ?, ?, ?)',
            [mensaje, tipo, usuario_id || null, sede_id]
        );
    } catch (error) {
        console.error('Error interno al crear alerta:', error);
    }
};

/**
 * Obtiene la lista completa de alertas registradas en el sistema.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} JSON con un arreglo de alertas ordenadas por fecha descendente.
 */
exports.listarAlertas = async (req, res) => {
    try {
        const sede_id = req.user.rol === 'Admin' ? (req.query.sede_id || 1) : req.user.sede_id;
        const [rows] = await db.execute('SELECT a.*, u.usuario as usuario_nombre, u.rol as usuario_rol FROM alertas a LEFT JOIN usuarios u ON a.usuario_id = u.id WHERE a.sede_id = ? ORDER BY a.fecha DESC', [sede_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error listando alertas:', error);
        res.status(500).json({ error: 'Error al obtener las alertas' });
    }
};

/**
 * Marca una alerta específica como leída en la base de datos.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera el `id` en req.params.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de éxito o error 404 si no se encuentra.
 */
exports.marcarLeida = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute('UPDATE alertas SET leida = TRUE WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Alerta no encontrada' });
        }

        res.json({ message: 'Alerta marcada como leída' });
    } catch (error) {
        console.error('Error actualizando alerta:', error);
        res.status(500).json({ error: 'Error interno al actualizar la alerta' });
    }
};

/**
 * Cuenta y retorna el número total de alertas que aún no han sido leídas.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} JSON con la propiedad `unreadCount`.
 */
exports.contarNoLeidas = async (req, res) => {
    try {
        const sede_id = req.user.rol === 'Admin' ? (req.query.sede_id || 1) : req.user.sede_id;
        const [rows] = await db.execute('SELECT COUNT(*) as unreadCount FROM alertas WHERE leida = FALSE AND sede_id = ?', [sede_id]);
        res.json({ unreadCount: rows[0].unreadCount });
    } catch (error) {
        console.error('Error contando alertas:', error);
        res.status(500).json({ error: 'Error al contar alertas' });
    }
};

/**
 * Marca todas las alertas no leídas como leídas en una sola operación.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de éxito.
 */
exports.marcarTodasLeidas = async (req, res) => {
    try {
        const sede_id = req.user.rol === 'Admin' ? (req.body.sede_id || req.query.sede_id || 1) : req.user.sede_id;
        await db.execute('UPDATE alertas SET leida = TRUE WHERE leida = FALSE AND sede_id = ?', [sede_id]);
        res.json({ message: 'Todas las alertas marcadas como leídas' });
    } catch (error) {
        console.error('Error marcando todas las alertas como leídas:', error);
        res.status(500).json({ error: 'Error interno al actualizar las alertas' });
    }
};
