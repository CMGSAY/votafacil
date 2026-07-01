// backend/src/routes/polls.routes.js
const express = require('express');
const router = express.Router();
const { createPoll, getPollById, updatePoll, deletePoll } = require('../controllers/polls.controller');
const { vote, getPollResults } = require('../controllers/votes.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Rutas de votaciones (todas requieren autenticacion)
router.post('/', verifyToken, createPoll);
router.get('/:id', verifyToken, getPollById);
router.put('/:id', verifyToken, updatePoll);
router.delete('/:id', verifyToken, deletePoll);

// Rutas de participacion y resultados (Fase 7.9)
router.post('/:id/vote', verifyToken, vote);
router.get('/:id/results', verifyToken, getPollResults);

module.exports = router;
