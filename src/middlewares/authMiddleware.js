/**
 * @fileoverview Middlewares para validación de tokens JWT y control de acceso basado en roles (RBAC).
 */
const jwt = require('jsonwebtoken');

/**
 * Verifica la existencia y validez de un token JWT en el encabezado de autorización.
 * Si es válido, decodifica el token e inyecta los datos del usuario en req.user.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para continuar con la cadena de middlewares.
 * @returns {void} Llama a next() si el token es válido o responde con un error 401 si no lo es.
 */
exports.verificarToken = (req, res, next) => {
    const header = req.header('Authorization');
    if (!header) return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });

    const token = header.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acceso denegado. Formato de token inválido.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contiene id, rol, usuario
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

/**
 * Verifica que el usuario autenticado tenga el rol de 'Mesera' o 'Admin'.
 * Requiere que `verificarToken` se haya ejecutado previamente.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función next de Express.
 * @returns {void} Llama a next() si el usuario tiene los permisos o responde con 403 / 500 en caso contrario.
 */
exports.verificarRolMeseraOAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({ error: 'Error interno: falta validar token antes del rol' });
    }

    const rol = req.user.rol;
    if (rol === 'Mesera' || rol === 'Admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso prohibido. Sección exclusiva para meseras y administradores.' });
    }
};

/**
 * Verifica que el usuario autenticado tenga el rol de 'Chef' o 'Admin'.
 * Requiere que `verificarToken` se haya ejecutado previamente.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función next de Express.
 * @returns {void} Llama a next() si el usuario tiene los permisos o responde con 403 / 500 en caso contrario.
 */
exports.verificarRolChefOAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({ error: 'Error interno: falta validar token antes del rol' });
    }

    const rol = req.user.rol;
    if (rol === 'Chef' || rol === 'Admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso prohibido. Sección exclusiva para el Chef y administradores.' });
    }
};

/**
 * Verifica que el usuario autenticado tenga el rol de 'Admin'.
 * Requiere que `verificarToken` se haya ejecutado previamente.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función next de Express.
 * @returns {void} Llama a next() si el usuario tiene privilegios de administrador o responde con 403 / 500 en caso contrario.
 */
exports.verificarRolAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({ error: 'Error interno: falta validar token antes del rol' });
    }

    if (req.user.rol === 'Admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de Administrador.' });
    }
};

/**
 * Middleware generador que verifica si un módulo específico está habilitado en la sede activa de la petición.
 * Si el módulo está desactivado (0) en la sede, responde con HTTP 403 Forbidden.
 *
 * @param {'mod_meseras'|'mod_chef'|'mod_alertas'|'mod_propinas'|'mod_accesos'} nombreModulo - Columna del módulo a validar.
 * @returns {import('express').RequestHandler} Middleware de Express.
 */
exports.verificarModuloSede = (nombreModulo) => {
    return async (req, res, next) => {
        try {
            const sedesController = require('../controllers/sedesController');
            const sedeId = req.user?.rol === 'Admin'
                ? (req.query?.sede_id || req.body?.sede_id || req.user?.sede_id || 1)
                : (req.user?.sede_id || 1);

            const configSede = await sedesController.obtenerConfigSede(sedeId);

            if (configSede && Number(configSede[nombreModulo]) === 0) {
                return res.status(403).json({
                    error: `El módulo solicitado no está habilitado en la sede "${configSede.nombre}".`
                });
            }

            next();
        } catch (error) {
            console.error('Error verificando módulo de sede:', error);
            next();
        }
    };
};
