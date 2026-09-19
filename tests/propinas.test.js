const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

jest.mock('../src/config/db', () => ({
    execute: jest.fn(),
    getConnection: jest.fn()
}));

const app = require('../src/app');

describe('Módulo de Propinas - /api/propinas', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    let adminToken;

    beforeAll(() => {
        adminToken = jwt.sign(
            { id: 1, usuario: 'admin', rol: 'Admin', sede_id: 1 },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/propinas', () => {
        it('debe listar las semanas de propinas de la sede', async () => {
            const mockSemanas = [
                { id: 1, fecha_inicio: '2026-09-01', fecha_fin: '2026-09-07', total_efectivo: 1500000 }
            ];
            db.execute.mockResolvedValueOnce([mockSemanas]);

            const res = await request(app)
                .get('/api/propinas')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockSemanas);
            expect(db.execute).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM propinas_semanas WHERE sede_id = ?'),
                [1]
            );
        });
    });

    describe('GET /api/propinas/:id', () => {
        it('debe responder 404 si la semana no existe', async () => {
            db.execute.mockResolvedValueOnce([[]]); // Semana no encontrada

            const res = await request(app)
                .get('/api/propinas/999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Semana no encontrada');
        });

        it('debe retornar la semana y su desglose de distribución de personal', async () => {
            const mockSemana = { id: 1, fecha_inicio: '2026-09-01', total_efectivo: 2000000 };
            const mockDistribucion = [
                { id_usuario: 2, nombre: 'Carlos Chef', cargo: 'Cocina', dias_trabajados: 6 },
                { id_usuario: 3, nombre: 'Ana Mesera', cargo: 'Mesero', dias_trabajados: 5 }
            ];

            db.execute
                .mockResolvedValueOnce([[mockSemana]])
                .mockResolvedValueOnce([mockDistribucion]);

            const res = await request(app)
                .get('/api/propinas/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('semana', mockSemana);
            expect(res.body).toHaveProperty('distribucion', mockDistribucion);
        });
    });

    describe('PUT /api/propinas/:id', () => {
        it('debe actualizar los totales de la semana exitosamente', async () => {
            db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .put('/api/propinas/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    total_efectivo: 2500000,
                    incluido_martes: 1,
                    descuento_cafe: 50000,
                    estado: 'Cerrado'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Semana actualizada');
            expect(db.execute).toHaveBeenCalledTimes(1);
        });
    });
});
