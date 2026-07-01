// backend/src/controllers/votes.controller.js
const votesService = require('../services/votes.service');
const pollsService = require('../services/polls.service');
const pool = require('../config/db');

// Registrar un voto
// POST /api/polls/:id/vote
const vote = async (req, res) => {
    try {
        const { id } = req.params; // ID de la votacion
        const userId = req.user.id;
        const { opcion_id, opcion_ids } = req.body;

        // 1. Buscar la votacion y sus opciones
        const poll = await pollsService.getPollById(id);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Votacion no encontrada.'
            });
        }

        // 2. Validar que la votacion este activa (Fase 7.5)
        if (poll.estado !== 'activa') {
            return res.status(400).json({
                success: false,
                message: `No se pueden registrar votos. La votacion esta en estado: ${poll.estado}.`
            });
        }

        // 3. Validar limites de fecha/hora (Fase 7.5)
        const now = new Date();
        if (poll.inicia_en && now < new Date(poll.inicia_en)) {
            return res.status(400).json({
                success: false,
                message: 'La votacion aun no ha comenzado.'
            });
        }

        if (poll.termina_en && now > new Date(poll.termina_en)) {
            // Si el fin ya paso, cerrar la votacion automaticamente
            if (poll.cierre_automatico) {
                await pool.query('UPDATE votaciones SET estado = "cerrada" WHERE id = ?', [id]);
                poll.estado = 'cerrada';
            }
            return res.status(400).json({
                success: false,
                message: 'La votacion ha finalizado.'
            });
        }

        // 4. Normalizar opciones elegidas
        let selectedOptionIds = [];
        if (opcion_ids && Array.isArray(opcion_ids)) {
            selectedOptionIds = opcion_ids.map(oid => parseInt(oid, 10));
        } else if (opcion_id) {
            selectedOptionIds = [parseInt(opcion_id, 10)];
        }

        if (selectedOptionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe seleccionar al menos una opcion de respuesta para votar.'
            });
        }

        // 5. Validar que no exceda el maximo de opciones segun tipo de voto
        const isSingleChoice = ['seleccion_unica', 'si_no', 'calificacion'].includes(poll.tipo_voto);
        if (isSingleChoice && selectedOptionIds.length > 1) {
            return res.status(400).json({
                success: false,
                message: 'Esta votacion solo permite seleccionar una unica opcion.'
            });
        }

        if (poll.tipo_voto === 'seleccion_multiple' && selectedOptionIds.length > poll.max_opciones_por_usuario) {
            return res.status(400).json({
                success: false,
                message: `Ha seleccionado ${selectedOptionIds.length} opciones, pero el maximo permitido es ${poll.max_opciones_por_usuario}.`
            });
        }

        // 6. Validar que las opciones elegidas pertenezcan a la votacion
        const pollOptionIds = poll.opciones.map(opt => opt.id);
        const allOptionsValid = selectedOptionIds.every(oid => pollOptionIds.includes(oid));
        if (!allOptionsValid) {
            return res.status(400).json({
                success: false,
                message: 'Una o mas de las opciones seleccionadas no son validas para esta votacion.'
            });
        }

        // 7. Intentar registrar el voto en el servicio
        await votesService.registerVote(poll, userId, selectedOptionIds);

        res.status(200).json({
            success: true,
            message: 'Voto registrado exitosamente.'
        });
    } catch (error) {
        console.error('Error al registrar voto:', error.message);
        
        if (error.message === 'VOTE_ALREADY_SUBMITTED') {
            return res.status(400).json({
                success: false,
                message: 'Ya has participado en esta votacion y no esta permitido cambiar el voto.'
            });
        }

        if (error.message === 'POLL_MAX_PARTICIPANTS_REACHED') {
            return res.status(400).json({
                success: false,
                message: 'La votacion ha alcanzado el numero maximo permitido de participantes.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error en el servidor al registrar su voto.'
        });
    }
};

// Obtener resultados de la votación
// GET /api/polls/:id/results
const getPollResults = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRol = req.user.rol;

        // 1. Obtener la votación
        const poll = await pollsService.getPollById(id);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Votacion no encontrada.'
            });
        }

        // 2. Validar visibilidad de resultados (Fase 7.8)
        if (poll.mostrar_resultados === 'al_finalizar' && poll.estado !== 'cerrada') {
            const isCreator = parseInt(poll.creador_id, 10) === parseInt(userId, 10);
            const isAdmin = userRol === 'administrador';

            if (!isCreator && !isAdmin) {
                return res.status(403).json({
                    success: true,
                    resultsHidden: true,
                    message: 'Los resultados de esta votacion se mostraran unicamente cuando este cerrada.'
                });
            }
        }

        // 3. Obtener resultados agregados
        const results = await votesService.getResults(poll);

        res.status(200).json({
            success: true,
            results
        });
    } catch (error) {
        console.error('Error al obtener resultados:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener los resultados.'
        });
    }
};

module.exports = {
    vote,
    getPollResults
};
