const express = require('express');
const router = express.Router();
const { getMatches, createMatch, updateMatchScore, deleteMatch, updateMatchDetails} = require('../controllers/matchController');
const { verifyToken, verifyStaff } = require('../middleware/authMiddleware');

// Rutas Públicas
router.get('/', verifyToken, getMatches);

// Rutas de Staff
router.post('/', verifyToken, verifyStaff, createMatch); 
router.put('/:id/score', verifyToken, verifyStaff, updateMatchScore); 
router.delete('/:id', verifyToken, verifyStaff, deleteMatch);
router.put('/:id', verifyToken, verifyStaff, updateMatchDetails);

module.exports = router;