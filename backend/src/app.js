// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
require('./config/db');

const app = express();

// Configuracion de seguridad HTTP
app.use(helmet());

// Configuracion de CORS actualizada con arreglo de origenes
// Esto permite que el backend acepte peticiones tanto de tu entorno local
// como directamente desde Vercel, solucionando el bloqueo.
const corsOptions = {
    origin: [
        'http://localhost:5500',
        'https://votafacil-plum.vercel.app', 
        process.env.FRONTEND_URL
    ].filter(Boolean), // Esta pequeña función evita errores si la variable es nula
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