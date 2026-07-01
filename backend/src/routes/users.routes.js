// backend/src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getUserHistory } = require('../controllers/users.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Todas las rutas de usuarios requieren autenticacion (Fase 4.4)
router.get('/:id', verifyToken, getUserProfile);
router.put('/:id', verifyToken, updateUserProfile);
router.get('/:id/history', verifyToken, getUserHistory); // (Fase 8.1)

module.exports = router;
