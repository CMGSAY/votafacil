// backend/src/services/votes.service.js
const pool = require('../config/db');

// Comprobar si un usuario ya ha participado en una votación
const checkHasVoted = async (pollId, userId) => {
    const query = 'SELECT id FROM participantes_votacion WHERE votacion_id = ? AND usuario_id = ?';
    const [rows] = await pool.query(query, [pollId, userId]);
    return rows.length > 0;
};

// Registrar un voto (o actualizarlo) en una transacción
const registerVote = async (poll, userId, optionIds) => {
    const pollId = poll.id;
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Verificar si ya voto
        const hasVoted = await checkHasVoted(pollId, userId);

        if (hasVoted) {
            if (!poll.permitir_cambio_voto) {
                throw new Error('VOTE_ALREADY_SUBMITTED');
            }
            // Si permite cambio, eliminar los votos anteriores y la participacion
            await connection.query('DELETE FROM votos WHERE votacion_id = ? AND usuario_id = ?', [pollId, userId]);
            await connection.query('DELETE FROM participantes_votacion WHERE votacion_id = ? AND usuario_id = ?', [pollId, userId]);
        } else {
            // Verificar limite de participantes si esta configurado
            if (poll.max_participantes) {
                const [countRows] = await connection.query(
                    'SELECT COUNT(id) AS count FROM participantes_votacion WHERE votacion_id = ?',
                    [pollId]
                );
                if (countRows[0].count >= poll.max_participantes) {
                    throw new Error('POLL_MAX_PARTICIPANTS_REACHED');
                }
            }
        }

        // 2. Registrar los nuevos votos en la tabla de votos
        const insertVoteQuery = `
            INSERT INTO votos (votacion_id, opcion_id, usuario_id)
            VALUES (?, ?, ?)
        `;
        
        const voteInsertions = optionIds.map(optionId => {
            return connection.query(insertVoteQuery, [pollId, optionId, userId]);
        });
        await Promise.all(voteInsertions);

        // 3. Registrar la participacion unica del usuario en la votacion
        await connection.query(
            'INSERT INTO participantes_votacion (votacion_id, usuario_id) VALUES (?, ?)',
            [pollId, userId]
        );

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Obtener resultados de la votación
const getResults = async (poll) => {
    const pollId = poll.id;

    // 1. Obtener conteo de votos por opcion
    const queryVotes = `
        SELECT ov.id AS opcion_id, ov.texto_opcion, ov.posicion, COUNT(v.id) AS votos_count
        FROM opciones_votacion ov
        LEFT JOIN votos v ON ov.id = v.opcion_id
        WHERE ov.votacion_id = ?
        GROUP BY ov.id, ov.texto_opcion, ov.posicion
        ORDER BY ov.posicion ASC
    `;
    const [votesCount] = await pool.query(queryVotes, [pollId]);

    // 2. Obtener total de participantes unicos en la votacion
    const queryTotal = 'SELECT COUNT(id) AS total FROM participantes_votacion WHERE votacion_id = ?';
    const [totalRows] = await pool.query(queryTotal, [pollId]);
    const totalParticipantes = totalRows[0].total;

    // Calcular porcentajes
    const resultados = votesCount.map(row => {
        const count = parseInt(row.votos_count, 10);
        const porcentaje = totalParticipantes > 0 ? parseFloat(((count / totalParticipantes) * 100).toFixed(2)) : 0;
        return {
            opcion_id: row.opcion_id,
            texto_opcion: row.texto_opcion,
            posicion: row.posicion,
            votos: count,
            porcentaje
        };
    });

    const response = {
        resultados,
        total_participantes: totalParticipantes,
        visibilidad: poll.visibilidad
    };

    // 3. Si la votacion es publica, incluir la lista de quien voto por que
    if (poll.visibilidad === 'publica') {
        const queryPublicVotes = `
            SELECT v.opcion_id, u.id AS usuario_id, u.nombre_usuario
            FROM votos v
            JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.votacion_id = ?
            ORDER BY v.votado_en ASC
        `;
        const [publicVotes] = await pool.query(queryPublicVotes, [pollId]);
        response.detalle_votos = publicVotes;
    }

    return response;
};

module.exports = {
    checkHasVoted,
    registerVote,
    getResults
};
