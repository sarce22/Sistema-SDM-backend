const request = require('supertest');
const bcrypt = require('bcrypt');
const db = require('../src/config/db');

// Mock del pool de base de datos
jest.mock('../src/config/db', () => ({
    execute: jest.fn()
}));

const app = require('../src/app');

describe('Autenticación - POST /api/auth/login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debe responder 400 si falta el usuario o la contraseña', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ usuario: 'admin' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Por favor, ingrese usuario y contraseña');
    });

    it('debe responder 401 si el usuario no existe en la base de datos', async () => {
        db.execute.mockResolvedValueOnce([[]]); // No se encontró usuario

        const res = await request(app)
            .post('/api/auth/login')
            .send({ usuario: 'inexistente', password: '123' });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Credenciales inválidas');
        expect(db.execute).toHaveBeenCalledWith(
            'SELECT * FROM usuarios WHERE usuario = ?',
            ['inexistente']
        );
    });

    it('debe responder 401 si la contraseña es incorrecta', async () => {
        const hashedPassword = await bcrypt.hash('passwordCorrecto', 10);
        db.execute.mockResolvedValueOnce([[
            { id: 1, usuario: 'admin', password: hashedPassword, rol: 'Admin', sede_id: 1 }
        ]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ usuario: 'admin', password: 'passwordIncorrecto' });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Credenciales inválidas');
    });

    it('debe responder 200 y retornar token JWT si las credenciales son válidas', async () => {
        const passwordPlana = '1234';
        const hashedPassword = await bcrypt.hash(passwordPlana, 10);
        db.execute.mockResolvedValueOnce([[
            { id: 2, usuario: 'chef1', password: hashedPassword, rol: 'Chef', sede_id: 1 }
        ]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ usuario: 'chef1', password: passwordPlana });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Login exitoso');
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toEqual({
            id: 2,
            usuario: 'chef1',
            rol: 'Chef',
            sede_id: 1
        });
    });
});
