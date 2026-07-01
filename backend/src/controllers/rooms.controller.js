// backend/src/controllers/rooms.controller.js
const roomsService = require('../services/rooms.service');
const pool = require('../config/db');

// Listar salas públicas
// GET /api/rooms
const getPublicRooms = async (req, res) => {
    try {
        const rooms = await roomsService.getAllPublicRooms();
        res.status(200).json({
            success: true,
            rooms
        });
    } catch (error) {
        console.error('Error al listar salas:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener las salas.'
        });
    }
};

// Crear una sala
// POST /api/rooms
const createRoom = async (req, res) => {
    try {
        const { nombre, descripcion, url_imagen, tipo, codigo_acceso } = req.body;
        const propietarioId = req.user.id;

        // Validaciones
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la sala es obligatorio.'
            });
        }

        if (tipo !== 'publica' && tipo !== 'privada') {
            return res.status(400).json({
                success: false,
                message: 'El tipo de sala debe ser "publica" o "privada".'
            });
        }

        if (tipo === 'privada' && (!codigo_acceso || codigo_acceso.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'Las salas privadas requieren un codigo de acceso.'
            });
        }

        const newRoom = await roomsService.createRoom(
            propietarioId,
            nombre,
            descripcion,
            url_imagen,
            tipo,
            codigo_acceso
        );

        // Si es privada, registrar al creador automaticamente como miembro de su propia sala
        if (tipo === 'privada') {
            await pool.query(
                'INSERT INTO miembros_sala (sala_id, usuario_id) VALUES (?, ?)',
                [newRoom.id, propietarioId]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Sala creada exitosamente.',
            room: newRoom
        });
    } catch (error) {
        console.error('Error al crear sala:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al crear la sala.'
        });
    }
};

// Obtener detalle de sala (con validacion de privacidad)
// GET /api/rooms/:id
const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRol = req.user.rol;
        const { codigo } = req.query; // Para acceder a salas privadas

        const room = await roomsService.getRoomById(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Sala no encontrada.'
            });
        }

        // Si la sala es privada, verificar permisos de acceso
        if (room.tipo === 'privada') {
            const isOwner = parseInt(room.propietario_id, 10) === parseInt(userId, 10);
            const isAdmin = userRol === 'administrador';

            if (!isOwner && !isAdmin) {
                // Verificar si ya es miembro de la sala
                const [membership] = await pool.query(
                    'SELECT id FROM miembros_sala WHERE sala_id = ? AND usuario_id = ?',
                    [id, userId]
                );

                if (membership.length === 0) {
                    // Si no es miembro, verificar si proporciono el codigo correcto
                    if (codigo && codigo === room.codigo_acceso) {
                        // Unir al usuario como miembro de la sala
                        await pool.query(
                            'INSERT INTO miembros_sala (sala_id, usuario_id) VALUES (?, ?)',
                            [id, userId]
                        );
                    } else {
                        // Denegar acceso y solicitar el codigo
                        return res.status(403).json({
                            success: false,
                            requiresCode: true,
                            message: 'Esta sala es privada. Se requiere un codigo de acceso valido para ingresar.'
                        });
                    }
                }
            }
        }

        // Ocultar codigo de acceso en la respuesta si el usuario no es el dueño ni admin
        const responseRoom = { ...room };
        if (room.tipo === 'privada' && parseInt(room.propietario_id, 10) !== parseInt(userId, 10) && userRol !== 'administrador') {
            delete responseRoom.codigo_acceso;
        }

        res.status(200).json({
            success: true,
            room: responseRoom
        });
    } catch (error) {
        console.error('Error al obtener sala:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener el detalle de la sala.'
        });
    }
};

// Actualizar sala
// PUT /api/rooms/:id
const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, url_imagen, tipo, codigo_acceso } = req.body;
        const userId = req.user.id;
        const userRol = req.user.rol;

        const room = await roomsService.getRoomById(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Sala no encontrada.'
            });
        }

        // Validar que solo el propietario o el administrador puedan editar (Fase 5.8)
        if (parseInt(room.propietario_id, 10) !== parseInt(userId, 10) && userRol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo el propietario puede editar esta sala.'
            });
        }

        // Validaciones
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la sala es obligatorio.'
            });
        }

        if (tipo !== 'publica' && tipo !== 'privada') {
            return res.status(400).json({
                success: false,
                message: 'El tipo de sala debe ser "publica" o "privada".'
            });
        }

        if (tipo === 'privada' && (!codigo_acceso || codigo_acceso.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'Las salas privadas requieren un codigo de acceso.'
            });
        }

        const updatedRoom = await roomsService.updateRoom(
            id,
            nombre,
            descripcion,
            url_imagen,
            tipo,
            codigo_acceso
        );

        res.status(200).json({
            success: true,
            message: 'Sala actualizada exitosamente.',
            room: updatedRoom
        });
    } catch (error) {
        console.error('Error al actualizar sala:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al actualizar la sala.'
        });
    }
};

// Eliminar sala
// DELETE /api/rooms/:id
const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRol = req.user.rol;

        const room = await roomsService.getRoomById(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Sala no encontrada.'
            });
        }

        // Validar que solo el propietario o el administrador puedan eliminar (Fase 5.8)
        if (parseInt(room.propietario_id, 10) !== parseInt(userId, 10) && userRol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo el propietario puede eliminar esta sala.'
            });
        }

        await roomsService.deleteRoom(id);

        res.status(200).json({
            success: true,
            message: 'Sala eliminada exitosamente.'
        });
    } catch (error) {
        console.error('Error al eliminar sala:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al eliminar la sala.'
        });
    }
};

module.exports = {
    getPublicRooms,
    createRoom,
    getRoomById,
    updateRoom,
    deleteRoom
};
