const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const leagueController = require('../controllers/leagueController');
// ==========================================
// RUTAS DE GESTIÓN DE LIGAS (Básicas)
// ==========================================
router.post('/create', verifyToken, leagueController.createLeague);
router.post('/join', verifyToken, leagueController.joinLeague);    
router.get('/my', verifyToken, leagueController.getMyLeagues);
router.get('/:id', verifyToken, leagueController.getLeagueDetails);
router.delete('/:id/leave', verifyToken, leagueController.leaveLeague);
router.delete('/:id', verifyToken, leagueController.deleteLeague);
// ==========================================
// RUTAS DE GESTIÓN DE PARTIDOS (Admin de Liga)
// ==========================================
router.get('/:id/available', verifyToken, leagueController.getAvailableMatches);
router.get('/:id/matches', verifyToken, leagueController.getLeagueMatches);
router.post('/:id/add-match', verifyToken, leagueController.addMatch);
router.post('/:id/remove-match', verifyToken, leagueController.removeMatch);

// ==========================================
// RUTAS DE PREDICCIONES PRIVADAS (Jugadores)
// ==========================================
router.post('/:id/predict', verifyToken, leagueController.savePrediction);
router.get('/:id/predictions', verifyToken, leagueController.getMyPredictions);

module.exports = router;