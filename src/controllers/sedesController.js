/**
 * @fileoverview Controlador para la gestión dinámica de sedes y sus módulos habilitados (Feature Flags).
 */
const db = require('../config/db');

/**
 * Caché en memoria de configuración de sedes para lecturas rápidas en middlewares.
 * Se sincroniza automáticamente en cada lectura o escritura de sedes.
 * @type {Map<number, Object>}
 */
const cacheSedes = new Map([
    [1, { id: 1, nombre: 'Sede Centro', mod_meseras: 1, mod_chef: 1, mod_alertas: 1, mod_propinas: 1, mod_accesos: 1 }],
    [2, { id: 2, nombre: 'Sede Norte', mod_meseras: 1, mod_chef: 1, mod_alertas: 1, mod_propinas: 1, mod_accesos: 1 }]
]);

/**
 * Normaliza un registro de sede asegurando valores numéricos (0 o 1) para cada módulo.
 *
 * @param {Object} row - Fila de la tabla sedes.
 * @returns {Object} Objeto de sede normalizado.
 */
const normalizarSede = (row) => ({
    id: Number(row.id),
    nombre: row.nombre,
    mod_meseras: row.mod_meseras !== undefined && row.mod_meseras !== null ? (row.mod_meseras ? 1 : 0) : 1,
    mod_chef: row.mod_chef !== undefined && row.mod_chef !== null ? (row.mod_chef ? 1 : 0) : 1,
    mod_alertas: row.mod_alertas !== undefined && row.mod_alertas !== null ? (row.mod_alertas ? 1 : 0) : 1,
    mod_propinas: row.mod_propinas !== undefined && row.mod_propinas !== null ? (row.mod_propinas ? 1 : 0) : 1,
    mod_accesos: row.mod_accesos !== undefined && row.mod_accesos !== null ? (row.mod_accesos ? 1 : 0) : 1
});

/**
 * Obtiene la configuración de una sede desde caché o base de datos.
 *
 * @param {number|string} sedeId - ID de la sede a consultar.
 * @returns {Promise<Object|null>} Configuración de la sede o null si no existe.
 */
exports.obtenerConfigSede = async (sedeId) => {
    const idNum = Number(sedeId) || 1;
    if (cacheSedes.has(idNum)) {
        return cacheSedes.get(idNum);
    }

    try {
        const [rows] = await db.execute(
            'SELECT id, nombre, mod_meseras, mod_chef, mod_alertas, mod_propinas, mod_accesos FROM sedes WHERE id = ?',
            [idNum]
        );
        if (rows && rows.length > 0) {
            const sede = normalizarSede(rows[0]);
            cacheSedes.set(idNum, sede);
            return sede;
        }
    } catch (error) {
        console.error('Error consultando configuración de sede:', error);
    }
    return null;
};

/**
 * Actualiza manualmente una sede en la caché (útil para pruebas y sincronización interna).
 *
 * @param {Object} sede - Datos de la sede.
 */
exports.actualizarCacheSede = (sede) => {
    const normalizada = normalizarSede(sede);
    cacheSedes.set(normalizada.id, normalizada);
};

/**
 * Restablece la caché de sedes al estado por defecto.
 */
exports.resetearCacheSedes = () => {
    cacheSedes.clear();
    cacheSedes.set(1, { id: 1, nombre: 'Sede Centro', mod_meseras: 1, mod_chef: 1, mod_alertas: 1, mod_propinas: 1, mod_accesos: 1 });
    cacheSedes.set(2, { id: 2, nombre: 'Sede Norte', mod_meseras: 1, mod_chef: 1, mod_alertas: 1, mod_propinas: 1, mod_accesos: 1 });
};

/**
 * Lista todas las sedes registradas junto con sus módulos activos.
 *
 * @param {import('express').Request} req - Petición de Express.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con el listado de sedes.
 */
exports.listarSedes = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, nombre, mod_meseras, mod_chef, mod_alertas, mod_propinas, mod_accesos FROM sedes ORDER BY id ASC'
        );
        const sedes = rows.map(normalizarSede);
        sedes.forEach(s => cacheSedes.set(s.id, s));
        res.json(sedes);
    } catch (error) {
        console.error('Error listando sedes:', error);
        res.status(500).json({ error: 'Error al obtener las sedes' });
    }
};

/**
 * Obtiene el detalle de una sede específica por su ID.
 *
 * @param {import('express').Request} req - Petición de Express.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con la sede solicitada o error 404.
 */
exports.obtenerSede = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute(
            'SELECT id, nombre, mod_meseras, mod_chef, mod_alertas, mod_propinas, mod_accesos FROM sedes WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Sede no encontrada' });
        }

        const sede = normalizarSede(rows[0]);
        cacheSedes.set(sede.id, sede);
        res.json(sede);
    } catch (error) {
        console.error('Error obteniendo sede:', error);
        res.status(500).json({ error: 'Error al obtener la sede' });
    }
};

/**
 * Crea una nueva sede con nombre y configuración personalizada de módulos.
 *
 * @param {import('express').Request} req - Petición de Express.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con la sede creada o error de validación.
 */
exports.crearSede = async (req, res) => {
    try {
        const {
            nombre,
            mod_meseras = 1,
            mod_chef = 1,
            mod_alertas = 1,
            mod_propinas = 1,
            mod_accesos = 1
        } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'El nombre de la sede es obligatorio' });
        }

        const nombreLimpio = nombre.trim();

        const [existente] = await db.execute(
            'SELECT id FROM sedes WHERE LOWER(nombre) = LOWER(?)',
            [nombreLimpio]
        );
        if (existente.length > 0) {
            return res.status(400).json({ error: 'Ya existe una sede con ese nombre' });
        }

        const mMeseras = mod_meseras ? 1 : 0;
        const mChef = mod_chef ? 1 : 0;
        const mAlertas = mod_alertas ? 1 : 0;
        const mPropinas = mod_propinas ? 1 : 0;
        const mAccesos = mod_accesos ? 1 : 0;

        if (!mMeseras && !mChef && !mAlertas && !mPropinas && !mAccesos) {
            return res.status(400).json({ error: 'Debes habilitar al menos un módulo para la sede' });
        }

        const [result] = await db.execute(
            `INSERT INTO sedes (nombre, mod_meseras, mod_chef, mod_alertas, mod_propinas, mod_accesos)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombreLimpio, mMeseras, mChef, mAlertas, mPropinas, mAccesos]
        );

        const nuevaSede = {
            id: result.insertId,
            nombre: nombreLimpio,
            mod_meseras: mMeseras,
            mod_chef: mChef,
            mod_alertas: mAlertas,
            mod_propinas: mPropinas,
            mod_accesos: mAccesos
        };

        cacheSedes.set(nuevaSede.id, nuevaSede);

        res.status(201).json({
            ...nuevaSede,
            message: 'Sede creada exitosamente'
        });
    } catch (error) {
        console.error('Error creando sede:', error);
        res.status(500).json({ error: 'Error al crear la sede' });
    }
};

/**
 * Actualiza el nombre y los módulos habilitados de una sede existente.
 *
 * @param {import('express').Request} req - Petición de Express.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con la sede actualizada o error.
 */
exports.editarSede = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            mod_meseras = 1,
            mod_chef = 1,
            mod_alertas = 1,
            mod_propinas = 1,
            mod_accesos = 1
        } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'El nombre de la sede es obligatorio' });
        }

        const nombreLimpio = nombre.trim();

        const [existente] = await db.execute(
            'SELECT id FROM sedes WHERE LOWER(nombre) = LOWER(?) AND id != ?',
            [nombreLimpio, id]
        );
        if (existente.length > 0) {
            return res.status(400).json({ error: 'Ya existe otra sede con ese nombre' });
        }

        const mMeseras = mod_meseras ? 1 : 0;
        const mChef = mod_chef ? 1 : 0;
        const mAlertas = mod_alertas ? 1 : 0;
        const mPropinas = mod_propinas ? 1 : 0;
        const mAccesos = mod_accesos ? 1 : 0;

        if (!mMeseras && !mChef && !mAlertas && !mPropinas && !mAccesos) {
            return res.status(400).json({ error: 'La sede debe tener al menos un módulo habilitado' });
        }

        const [result] = await db.execute(
            `UPDATE sedes 
             SET nombre = ?, mod_meseras = ?, mod_chef = ?, mod_alertas = ?, mod_propinas = ?, mod_accesos = ?
             WHERE id = ?`,
            [nombreLimpio, mMeseras, mChef, mAlertas, mPropinas, mAccesos, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sede no encontrada' });
        }

        const sedeActualizada = {
            id: Number(id),
            nombre: nombreLimpio,
            mod_meseras: mMeseras,
            mod_chef: mChef,
            mod_alertas: mAlertas,
            mod_propinas: mPropinas,
            mod_accesos: mAccesos
        };

        cacheSedes.set(sedeActualizada.id, sedeActualizada);

        res.json({
            ...sedeActualizada,
            message: 'Sede actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error editando sede:', error);
        res.status(500).json({ error: 'Error al actualizar la sede' });
    }
};

/**
 * Elimina una sede y reasigna sus usuarios a otra sede activa para mantener integridad referencial.
 *
 * @param {import('express').Request} req - Petición de Express.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} JSON con mensaje de confirmación o error.
 */
exports.eliminarSede = async (req, res) => {
    try {
        const { id } = req.params;

        const [otrasSedes] = await db.execute(
            'SELECT id FROM sedes WHERE id != ? ORDER BY id ASC',
            [id]
        );

        if (otrasSedes.length === 0) {
            return res.status(400).json({ error: 'No puedes eliminar la única sede del sistema' });
        }

        const sedeRespaldoId = otrasSedes[0].id;

        // Limpiar datos dependientes de la sede y reasignar usuarios a la sede de respaldo
        await db.execute('UPDATE asignaciones_diarias SET sede_id = NULL WHERE sede_id = ?', [id]);
        await db.execute('DELETE FROM alertas WHERE sede_id = ?', [id]);
        await db.execute('DELETE FROM items_mesera WHERE sede_id = ?', [id]);
        await db.execute('DELETE FROM inventario_chef WHERE sede_id = ?', [id]);
        await db.execute('DELETE FROM propinas_semanas WHERE sede_id = ?', [id]);
        await db.execute('UPDATE usuarios SET sede_id = ? WHERE sede_id = ?', [sedeRespaldoId, id]);

        const [result] = await db.execute('DELETE FROM sedes WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sede no encontrada' });
        }

        cacheSedes.delete(Number(id));

        res.json({ message: 'Sede eliminada exitosamente' });
    } catch (error) {
        console.error('Error eliminando sede:', error);
        res.status(500).json({ error: 'Error al eliminar la sede' });
    }
};
