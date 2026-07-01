// backend/src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware para verificar la validez del JWT
const verifyToken = (req, res, next) => {
    // Obtener el encabezado de autorizacion
    const authHeader = req.headers['authorization'];
    
    // Verificar si existe y tiene formato "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. Token no proporcionado o formato invalido.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verificar firma y expiracion del token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_defecto');
        
        // Adjuntar datos del usuario decodificados al objeto de peticion req
        req.user = decoded;
        
        next();
    } catch (error) {
        console.error('Error al verificar token:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'El token ha expirado. Por favor, inicie sesion nuevamente.'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Token invalido.'
        });
    }
};

module.exports = {
    verifyToken
};
