// backend/src/controllers/users.controller.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Obtener perfil de usuario
// GET /api/users/:id
const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar el usuario por ID en la base de datos
        const [users] = await pool.query(
            'SELECT id, nombre_usuario, correo, url_avatar, rol, activo, creado_en FROM usuarios WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        const user = users[0];

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener el perfil de usuario.'
        });
    }
};

// Actualizar perfil de usuario
// PUT /api/users/:id
const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_usuario, correo, url_avatar, clave } = req.body;

        // Validar que el usuario autenticado coincide con el ID que intenta modificar,
        // o bien es un administrador.
        if (parseInt(req.user.id, 10) !== parseInt(id, 10) && req.user.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. No tiene permisos para actualizar este perfil.'
            });
        }

        // Obtener el usuario actual
        const [currentUser] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
        if (currentUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        const user = currentUser[0];

        // Validaciones si se cambia el nombre de usuario
        let finalUsername = user.nombre_usuario;
        if (nombre_usuario && nombre_usuario !== user.nombre_usuario) {
            // Verificar duplicado
            const [duplicateUser] = await pool.query(
                'SELECT id FROM usuarios WHERE nombre_usuario = ? AND id != ?',
                [nombre_usuario, id]
            );
            if (duplicateUser.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'El nombre de usuario ya esta en uso.'
                });
            }
            finalUsername = nombre_usuario;
        }

        // Validaciones si se cambia el correo
        let finalEmail = user.correo;
        if (correo && correo !== user.correo) {
            // Validar formato
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato de correo no es valido.'
                });
            }
            // Verificar duplicado
            const [duplicateEmail] = await pool.query(
                'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
                [correo, id]
            );
            if (duplicateEmail.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'El correo electronico ya esta registrado.'
                });
            }
            finalEmail = correo;
        }

        // Manejar avatar
        let finalAvatar = url_avatar !== undefined ? url_avatar : user.url_avatar;

        // Manejar cambio de clave si se proporciona
        let finalHash = user.clave_hash;
        if (clave) {
            if (clave.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva clave debe tener al menos 6 caracteres.'
                });
            }
            const saltRounds = 10;
            finalHash = await bcrypt.hash(clave, saltRounds);
        }

        // Actualizar base de datos
        await pool.query(
            'UPDATE usuarios SET nombre_usuario = ?, correo = ?, url_avatar = ?, clave_hash = ? WHERE id = ?',
            [finalUsername, finalEmail, finalAvatar, finalHash, id]
        );

        res.status(200).json({
            success: true,
            message: 'Perfil de usuario actualizado exitosamente.',
            user: {
                id: parseInt(id, 10),
                nombre_usuario: finalUsername,
                correo: finalEmail,
                url_avatar: finalAvatar,
                rol: user.rol
            }
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al actualizar el perfil de usuario.'
        });
    }
};

// Obtener historial del usuario (Fase 8.1)
// GET /api/users/:id/history
const getUserHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRol = req.user.rol;

        // Validar permisos: solo el propio usuario o administrador
        if (parseInt(userId, 10) !== parseInt(id, 10) && userRol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. No tiene permisos para ver el historial de este usuario.'
            });
        }

        // 1. Obtener votaciones creadas por el usuario
        const createdPollsQuery = `
            SELECT v.id, v.titulo, v.descripcion, v.estado, v.tipo_voto, v.visibilidad, v.creado_en,
                   s.id AS sala_id, s.nombre AS sala_nombre
            FROM votaciones v
            JOIN salas s ON v.sala_id = s.id
            WHERE v.creador_id = ?
            ORDER BY v.creado_en DESC
        `;
        const [creadas] = await pool.query(createdPollsQuery, [id]);

        // 2. Obtener votaciones en las que participo (voto) el usuario
        const votedPollsQuery = `
            SELECT DISTINCT v.id, v.titulo, v.descripcion, v.estado, v.tipo_voto, v.visibilidad, pv.participado_en,
                   s.id AS sala_id, s.nombre AS sala_nombre
            FROM participantes_votacion pv
            JOIN votaciones v ON pv.votacion_id = v.id
            JOIN salas s ON v.sala_id = s.id
            WHERE pv.usuario_id = ?
            ORDER BY pv.participado_en DESC
        `;
        const [participadas] = await pool.query(votedPollsQuery, [id]);

        res.status(200).json({
            success: true,
            creadas,
            participadas
        });
    } catch (error) {
        console.error('Error al obtener historial del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener el historial.'
        });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserHistory
};
