const express = require('express');
const router = express.Router();
const { verifyToken, verifyStaff, verifySuperAdmin } = require('../middleware/authMiddleware');

const userController = require('../controllers/userController');

// Rutas PERFIL (Cualquier usuario logueado)
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile/password', verifyToken, userController.changePassword);
router.get('/leaderboard', verifyToken, userController.getLeaderboard);
router.put('/profile/edit', verifyToken, userController.updateMyProfile);

// Rutas ADMIN
router.get('/', verifyToken, verifyStaff, userController.getAllUsers);
router.post('/', verifyToken, verifyStaff, userController.createUser);
router.put('/:id', verifyToken, verifyStaff, userController.updateUser);
router.delete('/:id', verifyToken, verifyStaff, userController.deleteUser);
router.put('/:id/password', verifyToken, verifyStaff, userController.adminResetPassword);

module.exports = router;