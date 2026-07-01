// backend/src/controllers/polls.controller.js
const pollsService = require('../services/polls.service');
const roomsService = require('../services/rooms.service');
const votesService = require('../services/votes.service');
const pool = require('../config/db');

// Función auxiliar para comprobar si un usuario tiene acceso a una sala
async function checkRoomAccess(salaId, userId, userRol) {
    const room = await roomsService.getRoomById(salaId);
    if (!room) return { exists: false, hasAccess: false };

    if (room.tipo === 'publica') {
        return { exists: true, hasAccess: true, room };
    }

    // Si es privada, comprobar si es el propietario o admin
    const isOwner = parseInt(room.propietario_id, 10) === parseInt(userId, 10);
    const isAdmin = userRol === 'administrador';

    if (isOwner || isAdmin) {
        return { exists: true, hasAccess: true, room };
    }

    // Comprobar membresia
    const [membership] = await pool.query(
        'SELECT id FROM miembros_sala WHERE sala_id = ? AND usuario_id = ?',
        [salaId, userId]
    );

    return {
        exists: true,
        hasAccess: membership.length > 0,
        room
    };
}

// Crear una votación
// POST /api/polls
const createPoll = async (req, res) => {
    try {
        const { sala_id, titulo, tipo_voto, opciones } = req.body;
        const creadorId = req.user.id;
        const userRol = req.user.rol;

        // Validacion basica
        if (!sala_id) {
            return res.status(400).json({
                success: false,
                message: 'El ID de la sala (sala_id) es obligatorio.'
            });
        }

        if (!titulo || titulo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El titulo de la votacion es obligatorio.'
            });
        }

        // Verificar acceso a la sala y que sea el propietario o admin
        const { exists, hasAccess, room } = await checkRoomAccess(sala_id, creadorId, userRol);
        if (!exists) {
            return res.status(404).json({
                success: false,
                message: 'La sala especificada no existe.'
            });
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. No tiene acceso a esta sala privada.'
            });
        }

        const isOwner = parseInt(room.propietario_id, 10) === parseInt(creadorId, 10);
        const isAdmin = userRol === 'administrador';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo el propietario de la sala puede crear votaciones.'
            });
        }

        // Validar opciones segun tipo de voto
        const tipo = tipo_voto || 'seleccion_unica';
        if (tipo === 'seleccion_unica' || tipo === 'seleccion_multiple') {
            if (!opciones || !Array.isArray(opciones) || opciones.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Para votaciones de seleccion unica o multiple, se requieren al menos 2 opciones de respuesta.'
                });
            }
        }

        const newPoll = await pollsService.createPoll(creadorId, req.body);

        res.status(201).json({
            success: true,
            message: 'Votacion creada exitosamente.',
            poll: newPoll
        });
    } catch (error) {
        console.error('Error al crear votacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al crear la votacion.'
        });
    }
};

// Obtener detalle de una votación
// GET /api/polls/:id
const getPollById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRol = req.user.rol;

        const poll = await pollsService.getPollById(id);

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Votacion no encontrada.'
            });
        }

        // Verificar acceso a la sala de la votacion
        const { hasAccess } = await checkRoomAccess(poll.sala_id, userId, userRol);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. No tiene acceso a la sala de esta votacion.'
            });
        }

        const hasVoted = await votesService.checkHasVoted(id, userId);

        // Obtener cantidad de personas que han votado
        const [voterCountRows] = await pool.query(
            'SELECT COUNT(id) AS count FROM participantes_votacion WHERE votacion_id = ?',
            [id]
        );
        const totalVotos = voterCountRows[0].count;

        res.status(200).json({
            success: true,
            poll,
            hasVoted,
            totalVotos
        });
    } catch (error) {
        console.error('Error al obtener votacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener la votacion.'
        });
    }
};

// Actualizar votación
// PUT /api/polls/:id
const updatePoll = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRol = req.user.rol;

        const poll = await pollsService.getPollById(id);

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Votacion no encontrada.'
            });
        }

        // Validar permisos: solo el creador o admin pueden editar (Fase 6.8)
        if (parseInt(poll.creador_id, 10) !== parseInt(userId, 10) && userRol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo el creador de la votacion puede modificarla.'
            });
        }

        const { titulo, tipo_voto } = req.body;
        if (!titulo || titulo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El titulo de la votacion es obligatorio.'
            });
        }

        // Combinar datos existentes con los nuevos para actualizar
        const updatedData = {
            titulo,
            descripcion: req.body.descripcion !== undefined ? req.body.descripcion : poll.descripcion,
            tipo_voto: tipo_voto !== undefined ? tipo_voto : poll.tipo_voto,
            visibilidad: req.body.visibilidad !== undefined ? req.body.visibilidad : poll.visibilidad,
            mostrar_resultados: req.body.mostrar_resultados !== undefined ? req.body.mostrar_resultados : poll.mostrar_resultados,
            permitir_cambio_voto: req.body.permitir_cambio_voto !== undefined ? req.body.permitir_cambio_voto : poll.permitir_cambio_voto,
            max_opciones_por_usuario: req.body.max_opciones_por_usuario !== undefined ? req.body.max_opciones_por_usuario : poll.max_opciones_por_usuario,
            max_participantes: req.body.max_participantes !== undefined ? req.body.max_participantes : poll.max_participantes,
            inicia_en: req.body.inicia_en !== undefined ? req.body.inicia_en : poll.inicia_en,
            termina_en: req.body.termina_en !== undefined ? req.body.termina_en : poll.termina_en,
            cierre_automatico: req.body.cierre_automatico !== undefined ? req.body.cierre_automatico : poll.cierre_automatico,
            estado: req.body.estado !== undefined ? req.body.estado : poll.estado
        };

        const updatedPoll = await pollsService.updatePoll(id, updatedData);

        res.status(200).json({
            success: true,
            message: 'Votacion actualizada exitosamente.',
            poll: updatedPoll
        });
    } catch (error) {
        console.error('Error al actualizar votacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al actualizar la votacion.'
        });
    }
};

// Eliminar votación
// DELETE /api/polls/:id
const deletePoll = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRol = req.user.rol;

        const poll = await pollsService.getPollById(id);

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Votacion no encontrada.'
            });
        }

        // Validar permisos: solo el creador, el dueño de la sala o el admin pueden eliminar
        const room = await roomsService.getRoomById(poll.sala_id);
        const isRoomOwner = room && parseInt(room.propietario_id, 10) === parseInt(userId, 10);
        const isPollCreator = parseInt(poll.creador_id, 10) === parseInt(userId, 10);
        const isAdmin = userRol === 'administrador';

        if (!isPollCreator && !isRoomOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo el creador de la votacion o el propietario de la sala pueden eliminarla.'
            });
        }

        await pollsService.deletePoll(id);

        res.status(200).json({
            success: true,
            message: 'Votacion eliminada exitosamente.'
        });
    } catch (error) {
        console.error('Error al eliminar votacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al eliminar la votacion.'
        });
    }
};

// Listar votaciones de una sala
// GET /api/rooms/:id/polls
const getPollsByRoom = async (req, res) => {
    try {
        const { id } = req.params; // ID de la sala
        const userId = req.user.id;
        const userRol = req.user.rol;

        // Verificar acceso a la sala
        const { exists, hasAccess } = await checkRoomAccess(id, userId, userRol);
        if (!exists) {
            return res.status(404).json({
                success: false,
                message: 'Sala no encontrada.'
            });
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. No tiene acceso a esta sala privada para ver sus votaciones.'
            });
        }

        const polls = await pollsService.getPollsByRoom(id);

        res.status(200).json({
            success: true,
            polls
        });
    } catch (error) {
        console.error('Error al listar votaciones de sala:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener las votaciones de la sala.'
        });
    }
};

module.exports = {
    createPoll,
    getPollById,
    updatePoll,
    deletePoll,
    getPollsByRoom
};
