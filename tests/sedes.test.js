const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const sedesController = require('../src/controllers/sedesController');

jest.mock('../src/config/db', () => ({
    execute: jest.fn(),
    getConnection: jest.fn()
}));

const app = require('../src/app');

describe('Módulo de Sedes Dinámicas y Feature Flags - /api/sedes', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    let adminToken;
    let meseraToken;

    beforeAll(() => {
        adminToken = jwt.sign(
            { id: 1, usuario: 'admin', rol: 'Admin', sede_id: 1 },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        meseraToken = jwt.sign(
            { id: 3, usuario: 'mesera1', rol: 'Mesera', sede_id: 3 },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
        sedesController.resetearCacheSedes();
    });

    describe('GET /api/sedes', () => {
        it('debe listar todas las sedes con sus módulos configurados', async () => {
            const mockSedes = [
                { id: 1, nombre: 'Sede Centro', mod_meseras: 1, mod_chef: 1, mod_alertas: 1, mod_propinas: 1, mod_accesos: 1 },
                { id: 3, nombre: 'Sede Express', mod_meseras: 1, mod_chef: 1, mod_alertas: 0, mod_propinas: 0, mod_accesos: 0 }
            ];
            db.execute.mockResolvedValueOnce([mockSedes]);

            const res = await request(app)
                .get('/api/sedes')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[1]).toEqual({
                id: 3,
                nombre: 'Sede Express',
                mod_meseras: 1,
                mod_chef: 1,
                mod_alertas: 0,
                mod_propinas: 0,
                mod_accesos: 0
            });
        });
    });

    describe('POST /api/sedes', () => {
        it('debe crear una sede solo con inventario meseras y de chef', async () => {
            db.execute
                .mockResolvedValueOnce([[]]) // No existe sede con ese nombre
                .mockResolvedValueOnce([{ insertId: 3 }]);

            const res = await request(app)
                .post('/api/sedes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nombre: 'Sede Solo Inventarios',
                    mod_meseras: 1,
                    mod_chef: 1,
                    mod_alertas: 0,
                    mod_propinas: 0,
                    mod_accesos: 0
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toMatchObject({
                id: 3,
                nombre: 'Sede Solo Inventarios',
                mod_meseras: 1,
                mod_chef: 1,
                mod_alertas: 0,
                mod_propinas: 0,
                mod_accesos: 0
            });
        });

        it('debe rechazar si se intenta crear una sede sin ningún módulo habilitado', async () => {
            db.execute.mockResolvedValueOnce([[]]);

            const res = await request(app)
                .post('/api/sedes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nombre: 'Sede Vacía',
                    mod_meseras: 0,
                    mod_chef: 0,
                    mod_alertas: 0,
                    mod_propinas: 0,
                    mod_accesos: 0
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('al menos un módulo');
        });

        it('debe prohibir (403) a usuarios no administradores crear sedes', async () => {
            const res = await request(app)
                .post('/api/sedes')
                .set('Authorization', `Bearer ${meseraToken}`)
                .send({ nombre: 'Sede Prohibida' });

            expect(res.statusCode).toBe(403);
        });
    });

    describe('PUT /api/sedes/:id', () => {
        it('debe actualizar el nombre y módulos de una sede existente', async () => {
            db.execute
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .put('/api/sedes/2')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nombre: 'Sede Norte Full',
                    mod_meseras: 1,
                    mod_chef: 1,
                    mod_alertas: 1,
                    mod_propinas: 0,
                    mod_accesos: 1
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.nombre).toBe('Sede Norte Full');
            expect(res.body.mod_propinas).toBe(0);
        });
    });

    describe('Bloqueo de Módulos Deshabilitados por Sede (403 Forbidden)', () => {
        it('debe bloquear con 403 el acceso a propinas si la sede tiene mod_propinas = 0', async () => {
            sedesController.actualizarCacheSede({
                id: 3,
                nombre: 'Sede Solo Inventarios',
                mod_meseras: 1,
                mod_chef: 1,
                mod_alertas: 0,
                mod_propinas: 0,
                mod_accesos: 0
            });

            const res = await request(app)
                .get('/api/propinas?sede_id=3')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toContain('no está habilitado');
        });

        it('debe permitir el acceso a meseras si la sede tiene mod_meseras = 1', async () => {
            sedesController.actualizarCacheSede({
                id: 3,
                nombre: 'Sede Solo Inventarios',
                mod_meseras: 1,
                mod_chef: 1,
                mod_alertas: 0,
                mod_propinas: 0,
                mod_accesos: 0
            });
            db.execute.mockResolvedValueOnce([[{ id: 10, nombre: 'Gaseosa', precio: 5000 }]]);

            const res = await request(app)
                .get('/api/meseras?sede_id=3')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });
});
