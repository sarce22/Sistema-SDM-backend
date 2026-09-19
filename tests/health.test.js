const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
    it('debe responder 200 y status ok en /api/health', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            status: 'ok',
            message: 'Servidor funcionando correctamente'
        });
    });

    it('debe responder 404 en una ruta inexistente', async () => {
        const res = await request(app).get('/api/ruta-que-no-existe');
        expect(res.statusCode).toBe(404);
    });
});
