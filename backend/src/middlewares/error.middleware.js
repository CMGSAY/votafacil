// backend/src/middlewares/error.middleware.js

// Middleware global para manejo centralizado de errores
const errorHandler = (err, req, res, next) => {
    console.error('Error no controlado capturado por el middleware:', err);

    // Si los encabezados ya fueron enviados al cliente, delegar al manejador por defecto de Express
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Ocurrio un error interno en el servidor.';

    res.status(statusCode).json({
        success: false,
        message,
        // Solo mostrar stack trace en entorno de desarrollo local, no en produccion (Render)
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
