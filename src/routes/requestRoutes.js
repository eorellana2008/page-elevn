const express = require('express');
const router = express.Router();
const { createRequest, getRequests, respondAndResolve, getMyResolvedRequests } = require('../controllers/requestController');
const { verifyToken, verifyStaff } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createRequest); 

router.get('/', verifyToken, verifyStaff, getRequests); 

router.put('/:id/respond', verifyToken, verifyStaff, respondAndResolve); 

router.get('/myresolved', verifyToken, getMyResolvedRequests);

module.exports = router;

module.exports = router;