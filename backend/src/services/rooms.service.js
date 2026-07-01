// backend/src/services/rooms.service.js
const pool = require('../config/db');

// Listar todas las salas públicas activas
const getAllPublicRooms = async () => {
    const query = `
        SELECT s.id, s.propietario_id, s.nombre, s.descripcion, s.url_imagen, s.tipo, s.creado_en,
               u.nombre_usuario AS propietario_nombre
        FROM salas s
        JOIN usuarios u ON s.propietario_id = u.id
        WHERE s.activo = 1
        ORDER BY s.creado_en DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
};

// Crear una nueva sala
const createRoom = async (propietarioId, nombre, descripcion, urlImagen, tipo, codigoAcceso) => {
    // Si la sala es publica, el codigo de acceso debe ser null
    const finalCodigo = tipo === 'privada' ? codigoAcceso : null;
    
    const query = `
        INSERT INTO salas (propietario_id, nombre, descripcion, url_imagen, tipo, codigo_acceso)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [propietarioId, nombre, descripcion, urlImagen, tipo, finalCodigo]);
    
    return {
        id: result.insertId,
        propietario_id: propietarioId,
        nombre,
        descripcion,
        url_imagen: urlImagen,
        tipo,
        codigo_acceso: finalCodigo
    };
};

// Obtener sala por ID
const getRoomById = async (id) => {
    const query = `
        SELECT s.id, s.propietario_id, s.nombre, s.descripcion, s.url_imagen, s.tipo, s.codigo_acceso, s.activo, s.creado_en,
               u.nombre_usuario AS propietario_nombre
        FROM salas s
        JOIN usuarios u ON s.propietario_id = u.id
        WHERE s.id = ? AND s.activo = 1
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
};

// Actualizar sala
const updateRoom = async (id, nombre, descripcion, urlImagen, tipo, codigoAcceso) => {
    const finalCodigo = tipo === 'privada' ? codigoAcceso : null;

    const query = `
        UPDATE salas 
        SET nombre = ?, descripcion = ?, url_imagen = ?, tipo = ?, codigo_acceso = ?
        WHERE id = ?
    `;
    await pool.query(query, [nombre, descripcion, urlImagen, tipo, finalCodigo, id]);
    
    return {
        id,
        nombre,
        descripcion,
        url_imagen: urlImagen,
        tipo,
        codigo_acceso: finalCodigo
    };
};

// Eliminar sala
const deleteRoom = async (id) => {
    // Hacemos un delete real para disparar el ON DELETE CASCADE en cascada
    const query = 'DELETE FROM salas WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
};

module.exports = {
    getAllPublicRooms,
    createRoom,
    getRoomById,
    updateRoom,
    deleteRoom
};
