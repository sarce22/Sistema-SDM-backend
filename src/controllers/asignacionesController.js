const db = require('../config/db');

const DIAS_POR_DEFECTO = ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const parsearDias = (raw) => {
    if (!raw) return [...DIAS_POR_DEFECTO];
    if (Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [...DIAS_POR_DEFECTO];
    } catch {
        return [...DIAS_POR_DEFECTO];
    }
};

exports.obtenerAsignaciones = async (req, res) => {
    try {
        // Usamos una fecha constante para representar el estado actual permanente
        const fechaConstante = '2000-01-01';

        const query = `
            SELECT 
                u.id AS trabajador_id, 
                u.nombre, 
                CASE WHEN u.rol = 'Chef' THEN 'Cocina' ELSE 'Mesero' END AS cargo, 
                u.sede_id AS sede_defecto,
                ad.sede_id AS sede_asignada,
                ad.fijado,
                ad.horario,
                ad.dias_trabajo,
                ad.dia_libre,
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

        const asignaciones = rows.map(r => ({
            ...r,
            fijado: r.fijado === 1,
            horario: r.horario || '11:00 AM - 8:00 PM',
            dias_trabajo: parsearDias(r.dias_trabajo),
            dia_libre: r.dia_libre || 'Lunes'
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

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const asig of asignaciones) {
                const {
                    trabajador_id,
                    sede_id,
                    fijado,
                    horario = '11:00 AM - 8:00 PM',
                    dias_trabajo = DIAS_POR_DEFECTO,
                    dia_libre = 'Lunes'
                } = asig;

                const fijadoVal = fijado ? 1 : 0;
                const diasStr = Array.isArray(dias_trabajo) ? JSON.stringify(dias_trabajo) : JSON.stringify(DIAS_POR_DEFECTO);

                // Guardamos siempre el registro (incluso si sede_id es null) para conservar su horario, días y día libre
                await connection.execute(
                    `INSERT INTO asignaciones_diarias (usuario_id, sede_id, fecha, fijado, horario, dias_trabajo, dia_libre) 
                     VALUES (?, ?, ?, ?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE 
                        sede_id = VALUES(sede_id), 
                        fijado = VALUES(fijado),
                        horario = VALUES(horario),
                        dias_trabajo = VALUES(dias_trabajo),
                        dia_libre = VALUES(dia_libre)`,
                    [trabajador_id, sede_id ?? null, fechaConstante, fijadoVal, horario, diasStr, dia_libre]
                );
            }
            
            await connection.commit();
            res.json({ message: 'Asignaciones y turnos guardados correctamente' });
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
