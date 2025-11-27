const User = require('../models/User');
const userService = require('../services/userService');
const bcrypt = require('bcrypt');

const getAllUsers = async (req, res) => {
    try { 
        const users = await User.getAllDetailed(); 
        res.json(users); 
    } catch (error) { res.status(500).json({ error: 'Error listar' }); }
};

const createUser = async (req, res) => {
    try {
        await userService.adminCreateUser(req.user.role, req.body);
        res.status(201).json({ message: 'Usuario creado.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe.' });
        res.status(403).json({ error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        await userService.adminUpdateUser(req.user.role, req.params.id, req.body);
        res.json({ message: 'Actualizado.' });
    } catch (error) { res.status(403).json({ error: error.message }); }
};

const deleteUser = async (req, res) => {
    try {
        await userService.adminDeleteUser(req.user.role, req.user.userId, req.params.id);
        res.json({ message: 'Eliminado.' });
    } catch (error) { res.status(403).json({ error: error.message }); }
};

const adminResetPassword = async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.newPassword, 10);
        await User.updatePassword(req.params.id, hash);
        res.json({ message: 'Reset exitoso.' });
    } catch (e) { res.status(500).json({ error: 'Error reset.' }); }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser, adminResetPassword };