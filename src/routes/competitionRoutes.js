const express = require('express');
const router = express.Router();
const { getCompetitions } = require('../controllers/competitionController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getCompetitions);

module.exports = router;