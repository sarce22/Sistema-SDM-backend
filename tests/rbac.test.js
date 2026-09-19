const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock de la base de datos para no requerir conexión activa
jest.mock('../src/config/db', () => ({
    execute: jest.fn().mockResolvedValue([[]])
}));

const app = require('../src/app');

describe('Control de Acceso por Roles (RBAC) y Validación de Tokens', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';

    const createTestToken = (rol, usuario = 'usuarioTest', id = 1, sede_id = 1) => {
        return jwt.sign({ id, rol, usuario, sede_id }, JWT_SECRET, { expiresIn: '1h' });
    };

    describe('Validación de Token JWT', () => {
        it('debe rechazar con 401 si no se envía encabezado de autorización', async () => {
            const res = await request(app).get('/api/usuarios');
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toContain('Token no proporcionado');
        });

        it('debe rechazar con 401 si el formato del token es inválido', async () => {
            const res = await request(app)
                .get('/api/usuarios')
                .set('Authorization', 'FormatoInvalidoSinEspacio');
            expect(res.statusCode).toBe(401);
        });

        it('debe rechazar con 401 si el token tiene una firma falsa o expiró', async () => {
            const fakeToken = jwt.sign({ id: 1, rol: 'Admin' }, 'firma-falsa');
            const res = await request(app)
                .get('/api/usuarios')
                .set('Authorization', `Bearer ${fakeToken}`);
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toContain('Token inválido o expirado');
        });
    });

    describe('Protección de Rutas por Rol', () => {
        it('debe prohibir a un Chef (403) acceder al módulo de propinas', async () => {
            const chefToken = createTestToken('Chef');
            const res = await request(app)
                .get('/api/propinas')
                .set('Authorization', `Bearer ${chefToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toContain('exclusiva para meseras y administradores');
        });

        it('debe prohibir a una Mesera (403) acceder al módulo de inventario del Chef', async () => {
            const meseraToken = createTestToken('Mesera');
            const res = await request(app)
                .get('/api/chef/verduras')
                .set('Authorization', `Bearer ${meseraToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toContain('exclusiva para el Chef y administradores');
        });

        it('debe prohibir a usuarios no administradores (403) gestionar usuarios', async () => {
            const meseraToken = createTestToken('Mesera');
            const res = await request(app)
                .get('/api/usuarios')
                .set('Authorization', `Bearer ${meseraToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toContain('privilegios de Administrador');
        });

        it('debe permitir a un Admin acceder a rutas restringidas de administración', async () => {
            const adminToken = createTestToken('Admin');
            const res = await request(app)
                .get('/api/usuarios')
                .set('Authorization', `Bearer ${adminToken}`);

            // Supera la validación de roles del middleware
            expect(res.statusCode).not.toBe(401);
            expect(res.statusCode).not.toBe(403);
        });
    });
});
