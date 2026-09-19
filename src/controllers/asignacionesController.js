const db = require('../config/db');

exports.obtenerAsignaciones = async (req, res) => {
    try {
        // Usamos una fecha constante para representar el estado actual permanente
        const fechaConstante = '2000-01-01';

        // Obtener todos los trabajadores activos y hacer LEFT JOIN con asignaciones_diarias para la fecha indicada
        // También hacer JOIN con sedes para traer el nombre de la sede si aplica.
        const query = `
            SELECT 
                u.id AS trabajador_id, 
                u.nombre, 
                CASE WHEN u.rol = 'Chef' THEN 'Cocina' ELSE 'Mesero' END AS cargo, 
                u.sede_id AS sede_defecto,
                ad.sede_id AS sede_asignada,
                ad.fijado,
                s.nombre AS nombre_sede_asignada
            FROM usuarios u
            LEFT JOIN asignaciones_diarias ad 
                ON u.id = ad.usuario_id AND ad.fecha = ?
            LEFT JOIN sedes s 
                ON ad.sede_id = s.id
            WHERE u.rol != 'Admin'
            ORDER BY cargo, u.nombre
        `;
        const [rows] = await db.execute(query, [fechaConstante]);

        // Convertir fijado a booleano para el frontend
        const asignaciones = rows.map(r => ({
            ...r,
            fijado: r.fijado === 1
        }));

        res.json({ asignaciones });
    } catch (error) {
        console.error('Error al obtener asignaciones:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.guardarAsignaciones = async (req, res) => {
    try {
        const { asignaciones } = req.body;
        const fechaConstante = '2000-01-01';
        
        if (!Array.isArray(asignaciones)) {
            return res.status(400).json({ error: 'Faltan datos requeridos (asignaciones)' });
        }

        // Para evitar problemas, primero podemos eliminar las asignaciones de ese día 
        // (o hacer INSERT ON DUPLICATE KEY UPDATE)
        
        // Empecemos la transacción
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const asig of asignaciones) {
                const { trabajador_id, sede_id } = asig;
                
                // Si sede_id es null, "eliminar" la asignación
                if (sede_id === null) {
                    await connection.execute(
                        'DELETE FROM asignaciones_diarias WHERE usuario_id = ? AND fecha = ?',
                        [trabajador_id, fechaConstante]
                    );
                } else {
                    // Actualizar o insertar, incluyendo el estado de fijado
                    const fijadoVal = asig.fijado ? 1 : 0;
                    await connection.execute(
                        `INSERT INTO asignaciones_diarias (usuario_id, sede_id, fecha, fijado) 
                         VALUES (?, ?, ?, ?) 
                         ON DUPLICATE KEY UPDATE sede_id = VALUES(sede_id), fijado = VALUES(fijado)`,
                        [trabajador_id, sede_id, fechaConstante, fijadoVal]
                    );
                }
            }
            
            await connection.commit();
            res.json({ message: 'Asignaciones guardadas correctamente' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al guardar asignaciones:', error);
        res.status(500).json({ error: 'Error del servidor al guardar' });
    }
};
