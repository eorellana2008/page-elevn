const express = require('express');
const router = express.Router();
const { verifyToken, verifyStaff } = require('../middleware/authMiddleware');

// Importamos los DOS controladores nuevos
const profileController = require('../controllers/profileController');
const adminController = require('../controllers/adminController');

// ==========================================
// 1. RUTAS DE PERFIL (Usuario Logueado)
// ==========================================
router.get('/profile', verifyToken, profileController.getProfile);
router.put('/profile/edit', verifyToken, profileController.updateMyProfile); // Mantenemos la ruta /edit
router.put('/profile/password', verifyToken, profileController.changePassword);
router.get('/leaderboard', verifyToken, profileController.getLeaderboard);

// ==========================================
// 2. RUTAS DE ADMINISTRACIÓN (Requieren Staff)
// ==========================================
router.get('/', verifyToken, verifyStaff, adminController.getAllUsers);
router.post('/', verifyToken, verifyStaff, adminController.createUser);
router.put('/:id', verifyToken, verifyStaff, adminController.updateUser);
router.delete('/:id', verifyToken, verifyStaff, adminController.deleteUser);
router.put('/:id/password', verifyToken, verifyStaff, adminController.adminResetPassword);

module.exports = router;