/**
 * @fileoverview Controlador para la gestión y distribución de propinas semanales.
 */
const db = require('../config/db');

/**
 * Obtiene la lista de todas las semanas de propinas registradas.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} JSON con las semanas ordenadas por fecha de inicio descendente.
 */
exports.getSemanas = async (req, res) => {
    try {
        const sede_id = req.user.rol === 'Admin' ? (req.query.sede_id || 1) : req.user.sede_id;
        const [rows] = await db.execute('SELECT * FROM propinas_semanas WHERE sede_id = ? ORDER BY fecha_inicio DESC', [sede_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener semanas' });
    }
};

/**
 * Obtiene los detalles de una semana específica junto con su distribución por trabajador.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `id` en req.params.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con los datos de la semana y un arreglo con la distribución.
 */
exports.getSemana = async (req, res) => {
    try {
        const { id } = req.params;
        const sede_id = req.user.rol === 'Admin' ? (req.query.sede_id || 1) : req.user.sede_id;
        const [semana] = await db.execute('SELECT * FROM propinas_semanas WHERE id = ? AND sede_id = ?', [id, sede_id]);
        if (semana.length === 0) return res.status(404).json({ error: 'Semana no encontrada' });
        
        const [distribucion] = await db.execute(`
            SELECT pd.*, t.nombre, CASE WHEN t.rol = 'Chef' THEN 'Cocina' ELSE 'Mesero' END AS cargo 
            FROM propinas_distribucion pd 
            JOIN usuarios t ON pd.id_usuario = t.id 
            WHERE pd.id_semana = ?
            ORDER BY t.nombre ASC
        `, [id]);
        
        res.json({ semana: semana[0], distribucion });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener detalles de la semana' });
    }
};

/**
 * Crea una nueva semana de propinas y asigna automáticamente a todos los trabajadores activos
 * a la distribución con 0 días trabajados. Utiliza una transacción para garantizar la consistencia.
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `fecha_inicio` y `fecha_fin` en req.body.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con el ID de la nueva semana creada.
 */
exports.createSemana = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { fecha_inicio, fecha_fin } = req.body;
        const sede_id = req.user.rol === 'Admin' ? (req.body.sede_id || 1) : req.user.sede_id;
        
        const [result] = await connection.execute(
            'INSERT INTO propinas_semanas (fecha_inicio, fecha_fin, sede_id) VALUES (?, ?, ?)',
            [fecha_inicio, fecha_fin, sede_id]
        );
        const id_semana = result.insertId;

        // Añadir automáticamente a todos los usuarios activos de la sede con todos los días marcados por defecto (excepto Admins)
        const [trabajadores] = await connection.execute("SELECT id FROM usuarios WHERE rol != 'Admin' AND sede_id = ?", [sede_id]);
        
        const todosLosDiasStr = '[0,1,2,3,4,5,6]';
        for (let trab of trabajadores) {
            await connection.execute(
                'INSERT INTO propinas_distribucion (id_semana, id_usuario, dias_trabajados, pagado, dias_seleccionados) VALUES (?, ?, 7, FALSE, ?)',
                [id_semana, trab.id, todosLosDiasStr]
            );
        }

        await connection.commit();
        res.status(201).json({ id: id_semana, message: 'Semana creada con trabajadores activos' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error al crear la semana' });
    } finally {
        connection.release();
    }
};

/**
 * Actualiza los datos generales de una semana (totales en efectivo, días de apertura y estado).
 * 
 * @param {import('express').Request} req - Petición de Express. Espera el `id` en params y los campos en req.body.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de éxito.
 */
exports.updateSemana = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            total_efectivo, incluido_martes, incluido_miercoles, incluido_jueves, 
            incluido_viernes, incluido_sabado, incluido_domingo, incluido_lunes, estado,
            descuento_cafe, descuentos_meseros, descuentos_cocina
        } = req.body;

        const descMeserosStr = descuentos_meseros ? JSON.stringify(descuentos_meseros) : '[]';
        const descCocinaStr = descuentos_cocina ? JSON.stringify(descuentos_cocina) : '[]';

        await db.execute(`
            UPDATE propinas_semanas SET 
                total_efectivo = ?, incluido_martes = ?, incluido_miercoles = ?, 
                incluido_jueves = ?, incluido_viernes = ?, incluido_sabado = ?, 
                incluido_domingo = ?, incluido_lunes = ?, estado = ?,
                descuento_cafe = ?, descuentos_meseros = ?, descuentos_cocina = ?
            WHERE id = ?
        `, [
            total_efectivo || 0, incluido_martes || 0, incluido_miercoles || 0, incluido_jueves || 0, 
            incluido_viernes || 0, incluido_sabado || 0, incluido_domingo || 0, incluido_lunes || 0, estado || 'Borrador',
            descuento_cafe || 0, descMeserosStr, descCocinaStr, id
        ]);
        
        res.json({ message: 'Semana actualizada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar semana' });
    }
};

/**
 * Actualiza la distribución individual de un trabajador para una semana específica
 * (días trabajados y estado de pago).
 * 
 * @param {import('express').Request} req - Petición de Express. Espera `id_semana` e `id_trabajador` en params.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de éxito.
 */
exports.updateDistribucion = async (req, res) => {
    try {
        const { id_semana, id_usuario } = req.params;
        const { dias_trabajados, pagado, dias_seleccionados } = req.body;
        
        const diasStr = dias_seleccionados ? JSON.stringify(dias_seleccionados) : '[]';
        
        await db.execute(
            'UPDATE propinas_distribucion SET dias_trabajados = ?, pagado = ?, dias_seleccionados = ? WHERE id_semana = ? AND id_usuario = ?',
            [dias_trabajados || 0, pagado ? 1 : 0, diasStr, id_semana, id_usuario]
        );
        
        res.json({ message: 'Distribución actualizada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar distribución' });
    }
};
