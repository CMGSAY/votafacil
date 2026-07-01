// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
require('./config/db');

const app = express();

// Configuracion de seguridad HTTP
app.use(helmet());

// Configuracion de CORS dinamica
// Esto permite que el backend acepte peticiones tanto de tu entorno local (cualquier puerto)
// como de cualquier despliegue en Vercel (*.vercel.app), solucionando el bloqueo de forma definitiva.
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como mobile apps, curl o Postman)
        if (!origin) return callback(null, true);
        
        // Expresiones regulares para validar orígenes permitidos
        const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
        const isVercel = /\.vercel\.app$/.test(origin);
        
        // Tambien permitir si coincide exactamente con la variable de entorno FRONTEND_URL
        const isAllowedEnv = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;

        if (isLocalhost || isVercel || isAllowedEnv) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por CORS: Origen no permitido'));
        }
    },
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