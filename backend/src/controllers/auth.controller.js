// backend/src/controllers/auth.controller.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro de usuario
// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { nombre_usuario, correo, clave } = req.body;

        // Validacion basica de entradas
        if (!nombre_usuario || !correo || !clave) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporcione nombre de usuario, correo y clave.'
            });
        }

        // Validacion del formato de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            return res.status(400).json({
                success: false,
                message: 'El formato de correo no es valido.'
            });
        }

        // Validacion de la longitud de clave
        if (clave.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La clave debe tener al menos 6 caracteres.'
            });
        }

        // Verificar si el correo o nombre de usuario ya existen
        const [existingUsers] = await pool.query(
            'SELECT id, correo, nombre_usuario FROM usuarios WHERE correo = ? OR nombre_usuario = ?',
            [correo, nombre_usuario]
        );

        if (existingUsers.length > 0) {
            const hasDuplicateEmail = existingUsers.some(u => u.correo.toLowerCase() === correo.toLowerCase());
            if (hasDuplicateEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'El correo electronico ya esta registrado.'
                });
            } else {
                return res.status(409).json({
                    success: false,
                    message: 'El nombre de usuario ya esta en uso.'
                });
            }
        }

        // Cifrar la clave (bcrypt)
        const saltRounds = 10;
        const clave_hash = await bcrypt.hash(clave, saltRounds);

        // Guardar el usuario en la base de datos
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre_usuario, correo, clave_hash) VALUES (?, ?, ?)',
            [nombre_usuario, correo, clave_hash]
        );

        const newUserId = result.insertId;

        // Generar token JWT para inicio de sesion automatico despues del registro
        const payload = {
            id: newUserId,
            nombre_usuario,
            rol: 'usuario'
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || 'clave_secreta_defecto', {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente.',
            token,
            user: {
                id: newUserId,
                nombre_usuario,
                correo,
                rol: 'usuario'
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al registrar el usuario.'
        });
    }
};

// Inicio de sesion
// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { correo, clave } = req.body;

        // Validacion basica
        if (!correo || !clave) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporcione correo y clave.'
            });
        }

        // Buscar al usuario por correo
        const [users] = await pool.query(
            'SELECT id, nombre_usuario, correo, clave_hash, rol, activo FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidas (el correo no esta registrado).'
            });
        }

        const user = users[0];

        // Verificar si el usuario esta activo
        if (!user.activo) {
            return res.status(403).json({
                success: false,
                message: 'La cuenta se encuentra desactivada.'
            });
        }

        // Verificar clave
        const passwordMatch = await bcrypt.compare(clave, user.clave_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidas (clave incorrecta).'
            });
        }

        // Generar JWT
        const payload = {
            id: user.id,
            nombre_usuario: user.nombre_usuario,
            rol: user.rol
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || 'clave_secreta_defecto', {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });

        res.status(200).json({
            success: true,
            message: 'Inicio de sesion exitoso.',
            token,
            user: {
                id: user.id,
                nombre_usuario: user.nombre_usuario,
                correo: user.correo,
                rol: user.rol
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al iniciar sesion.'
        });
    }
};

// Cierre de sesion
// POST /api/auth/logout
const logout = async (req, res) => {
    // La autenticacion con JWT es sin estado en el backend,
    // pero el endpoint se provee para consistencia con la API y para responder al cliente.
    res.status(200).json({
        success: true,
        message: 'Sesion cerrada exitosamente en el backend. Por favor, elimine el token en el cliente.'
    });
};

module.exports = {
    register,
    login,
    logout
};
