// backend/src/services/polls.service.js
const pool = require('../config/db');

// Crear una votación con sus opciones en una transacción
const createPoll = async (creadorId, pollData) => {
    const {
        sala_id,
        titulo,
        descripcion,
        tipo_voto,
        visibilidad,
        mostrar_resultados,
        permitir_cambio_voto,
        max_opciones_por_usuario,
        max_participantes,
        inicia_en,
        termina_en,
        cierre_automatico,
        estado,
        opciones
    } = pollData;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Insertar la votación
        const insertPollQuery = `
            INSERT INTO votaciones (
                sala_id, creador_id, titulo, descripcion, tipo_voto, visibilidad,
                mostrar_resultados, permitir_cambio_voto, max_opciones_por_usuario,
                max_participantes, inicia_en, termina_en, cierre_automatico, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [pollResult] = await connection.query(insertPollQuery, [
            sala_id,
            creadorId,
            titulo,
            descripcion || null,
            tipo_voto || 'seleccion_unica',
            visibilidad || 'secreta',
            mostrar_resultados || 'al_finalizar',
            permitir_cambio_voto ? 1 : 0,
            max_opciones_por_usuario || 1,
            max_participantes || null,
            inicia_en || null,
            termina_en || null,
            cierre_automatico ? 1 : 0,
            estado || 'borrador'
        ]);

        const pollId = pollResult.insertId;

        // 2. Insertar opciones
        let finalOpciones = opciones || [];
        if (tipo_voto === 'si_no' && finalOpciones.length === 0) {
            finalOpciones = ['Sí', 'No'];
        } else if (tipo_voto === 'calificacion' && finalOpciones.length === 0) {
            finalOpciones = ['1', '2', '3', '4', '5'];
        }

        const insertOptionQuery = `
            INSERT INTO opciones_votacion (votacion_id, texto_opcion, posicion)
            VALUES (?, ?, ?)
        `;

        const optionInsertions = finalOpciones.map((opc, idx) => {
            const texto = typeof opc === 'string' ? opc : opc.texto;
            const pos = typeof opc === 'string' ? idx : (opc.posicion !== undefined ? opc.posicion : idx);
            return connection.query(insertOptionQuery, [pollId, texto, pos]);
        });

        await Promise.all(optionInsertions);

        await connection.commit();

        return {
            id: pollId,
            sala_id,
            creador_id: creadorId,
            titulo,
            descripcion,
            tipo_voto,
            visibilidad,
            mostrar_resultados,
            permitir_cambio_voto,
            max_opciones_por_usuario,
            max_participantes,
            inicia_en,
            termina_en,
            cierre_automatico,
            estado,
            opciones: finalOpciones
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Obtener una votación por ID (incluyendo sus opciones y datos del creador)
const getPollById = async (id) => {
    // 1. Obtener la votación
    const pollQuery = `
        SELECT v.*, u.nombre_usuario AS creador_nombre
        FROM votaciones v
        JOIN usuarios u ON v.creador_id = u.id
        WHERE v.id = ?
    `;
    const [polls] = await pool.query(pollQuery, [id]);
    
    if (polls.length === 0) return null;
    const poll = polls[0];

    // Verificar si debe cerrarse automáticamente por fecha
    let finalEstado = poll.estado;
    if (poll.estado === 'activa' && poll.cierre_automatico && poll.termina_en) {
        const now = new Date();
        const endDate = new Date(poll.termina_en);
        if (now >= endDate) {
            // Actualizar estado en la base de datos
            await pool.query('UPDATE votaciones SET estado = "cerrada" WHERE id = ?', [id]);
            finalEstado = 'cerrada';
            poll.estado = 'cerrada';
        }
    }

    // 2. Obtener las opciones de la votación
    const optionsQuery = `
        SELECT id, texto_opcion, posicion
        FROM opciones_votacion
        WHERE votacion_id = ?
        ORDER BY posicion ASC
    `;
    const [options] = await pool.query(optionsQuery, [id]);
    
    poll.opciones = options;
    return poll;
};

// Actualizar una votación (solo sus campos generales)
const updatePoll = async (id, pollData) => {
    const {
        titulo,
        descripcion,
        tipo_voto,
        visibilidad,
        mostrar_resultados,
        permitir_cambio_voto,
        max_opciones_por_usuario,
        max_participantes,
        inicia_en,
        termina_en,
        cierre_automatico,
        estado
    } = pollData;

    const query = `
        UPDATE votaciones SET
            titulo = ?, descripcion = ?, tipo_voto = ?, visibilidad = ?,
            mostrar_resultados = ?, permitir_cambio_voto = ?, max_opciones_por_usuario = ?,
            max_participantes = ?, inicia_en = ?, termina_en = ?, cierre_automatico = ?, estado = ?
        WHERE id = ?
    `;

    await pool.query(query, [
        titulo,
        descripcion || null,
        tipo_voto,
        visibilidad,
        mostrar_resultados,
        permitir_cambio_voto ? 1 : 0,
        max_opciones_por_usuario,
        max_participantes || null,
        inicia_en || null,
        termina_en || null,
        cierre_automatico ? 1 : 0,
        estado,
        id
    ]);

    return {
        id,
        titulo,
        descripcion,
        tipo_voto,
        visibilidad,
        mostrar_resultados,
        permitir_cambio_voto,
        max_opciones_por_usuario,
        max_participantes,
        inicia_en,
        termina_en,
        cierre_automatico,
        estado
    };
};

// Eliminar votación
const deletePoll = async (id) => {
    const query = 'DELETE FROM votaciones WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
};

// Listar votaciones de una sala
const getPollsByRoom = async (salaId) => {
    const query = `
        SELECT v.id, v.sala_id, v.creador_id, v.titulo, v.descripcion, v.tipo_voto, v.visibilidad,
               v.mostrar_resultados, v.estado, v.inicia_en, v.termina_en, v.cierre_automatico, v.creado_en,
               u.nombre_usuario AS creador_nombre
        FROM votaciones v
        JOIN usuarios u ON v.creador_id = u.id
        WHERE v.sala_id = ?
        ORDER BY v.creado_en DESC
    `;
    const [rows] = await pool.query(query, [salaId]);

    // Verificar y cerrar automáticamente las votaciones activas cuya fecha de finalización haya expirado
    const now = new Date();
    const checkedRows = await Promise.all(rows.map(async (poll) => {
        if (poll.estado === 'activa' && poll.cierre_automatico && poll.termina_en) {
            const endDate = new Date(poll.termina_en);
            if (now >= endDate) {
                await pool.query('UPDATE votaciones SET estado = "cerrada" WHERE id = ?', [poll.id]);
                poll.estado = 'cerrada';
            }
        }
        return poll;
    }));

    return checkedRows;
};

module.exports = {
    createPoll,
    getPollById,
    updatePoll,
    deletePoll,
    getPollsByRoom
};
