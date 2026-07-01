// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
require('./config/db');

const app = express();

// Configuracion de seguridad HTTP
app.use(helmet());

// Configuracion de CORS
// NOTA: Para produccion (despliegue en Render y Vercel), la URL del frontend
// estara en la variable de entorno FRONTEND_URL. Asegurarse de configurar
// esta variable en el panel de control de Render apuntando al dominio de Vercel.
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middlewares para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba inicial (Fase 1.10)
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor base de VotaFacil funcionando correctamente'
    });
});

// Rutas principales
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const roomRoutes = require('./routes/rooms.routes');
const pollRoutes = require('./routes/polls.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/polls', pollRoutes);

// Middleware de manejo de errores global (Fase 9.1)
const errorHandler = require('./middlewares/error.middleware');
app.use(errorHandler);

module.exports = app;
