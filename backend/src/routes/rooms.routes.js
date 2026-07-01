// backend/src/routes/rooms.routes.js
const express = require('express');
const router = express.Router();
const { getPublicRooms, createRoom, getRoomById, updateRoom, deleteRoom } = require('../controllers/rooms.controller');
const { getPollsByRoom } = require('../controllers/polls.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Rutas de salas
router.get('/', getPublicRooms); // Listar salas publicas (publico para navegacion inicial)
router.post('/', verifyToken, createRoom); // Crear sala (privado)
router.get('/:id', verifyToken, getRoomById); // Obtener sala por ID (privado, verifica acceso/membresia)
router.get('/:id/polls', verifyToken, getPollsByRoom); // Listar votaciones de una sala (privado, verifica acceso)
router.put('/:id', verifyToken, updateRoom); // Actualizar sala (privado, verifica propietario)
router.delete('/:id', verifyToken, deleteRoom); // Eliminar sala (privado, verifica propietario)

module.exports = router;
