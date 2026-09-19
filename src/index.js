/**
 * @fileoverview Punto de entrada principal de la aplicación del backend de SistemaSDM.
 * Configura el servidor Express, middlewares, rutas y maneja el inicio del servidor.
 */
require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 3000;

/**
 * Inicializa el servidor Express y lo pone a escuchar en el puerto configurado.
 */
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

