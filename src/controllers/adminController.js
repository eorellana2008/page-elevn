const User = require('../models/User');
const bcrypt = require('bcrypt');

// ⚡ MAPA DE PODER
const ROLE_POWER = {
    'superadmin': 100,
    'admin': 50,
    'moderator': 20,
    'user': 1
};

// 1. LISTAR TODOS (Solo Staff)
const getAllUsers = async (req, res) => {
    try { 
        const users = await User.getAllDetailed(); 
        res.json(users); 
    } catch (error) { res.status(500).json({ error: 'Error al listar.' }); }
};

// 2. CREAR USUARIO (Admin crea a otros)
const createUser = async (req, res) => {
    if (req.user.role === 'moderator') {
        return res.status(403).json({ error: 'Acceso denegado. Solo Admins pueden crear usuarios.' });
    }

    const { username, email, password, role, municipality_id } = req.body;
    
    const myPower = ROLE_POWER[req.user.role] || 0;
    const targetPower = ROLE_POWER[role] || 0;

    if (req.user.role !== 'superadmin' && targetPower >= myPower) {
        return res.status(403).json({ error: `No tienes rango para crear un ${role.toUpperCase()}.` });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        let role_id = (role === 'superadmin') ? 1 : (role === 'admin' ? 2 : (role === 'moderator' ? 3 : 4));
        const muni = municipality_id ? parseInt(municipality_id) : 1;

        await User.create({ username, email, password_hash: hash, role_id, municipality_id: muni });
        res.status(201).json({ message: 'Usuario creado correctamente.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Usuario/Email ya existe.' });
        res.status(500).json({ error: 'Error al crear.' });
    }
};

// 3. EDITAR OTRO USUARIO
const updateUser = async (req, res) => {
    if (req.user.role === 'moderator') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const { id } = req.params;
    const { username, email, role } = req.body;
    
    try {
        const targetUser = await User.findById(id);
        const myPower = ROLE_POWER[req.user.role];
        const targetPower = ROLE_POWER[targetUser.role];
        const newRolePower = ROLE_POWER[role];

        if (req.user.role !== 'superadmin') {
            if (targetPower >= myPower) return res.status(403).json({ error: 'No puedes editar a este usuario.' });
            if (newRolePower >= myPower) return res.status(403).json({ error: 'No puedes ascender a este nivel.' });
        }

        let role_id = (role === 'superadmin') ? 1 : (role === 'admin' ? 2 : (role === 'moderator' ? 3 : 4));
        // Nota: Aquí usamos el método genérico 'update' que tenías en v1, no el 'updateBasicInfo' nuevo
        await User.update(id, { username, email, role_id });
        res.json({ message: 'Actualizado correctamente' });
    } catch (error) { res.status(500).json({ error: 'Error al actualizar' }); }
};

// 4. ELIMINAR USUARIO
const deleteUser = async (req, res) => {
    if (req.user.role === 'moderator') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const { id } = req.params;
    if (req.user.userId == id) return res.status(400).json({ error: 'No auto-eliminar.' });

    try {
        const targetUser = await User.findById(id);
        const myPower = ROLE_POWER[req.user.role];
        const targetPower = ROLE_POWER[targetUser.role];

        if (req.user.role !== 'superadmin' && targetPower >= myPower) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar a este usuario.' });
        }

        await User.delete(id);
        res.json({ message: 'Usuario eliminado.' });
    } catch (error) { res.status(500).json({ error: 'Error al eliminar.' }); }
};

// 5. RESET PASSWORD DE OTRO (Admin)
const adminResetPassword = async (req, res) => {
    if (req.user.role === 'moderator') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    
    try {
        const targetUser = await User.findById(id);
        const myPower = ROLE_POWER[req.user.role];
        const targetPower = ROLE_POWER[targetUser.role];

        if (req.user.role !== 'superadmin' && targetPower >= myPower) {
            return res.status(403).json({ error: 'No tienes rango para cambiar esta contraseña.' });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(id, hash);
        res.json({ message: 'Contraseña restablecida.' });
    } catch (error) { res.status(500).json({ error: 'Error al restablecer.' }); }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser, adminResetPassword };