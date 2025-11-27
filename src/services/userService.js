const User = require('../models/User');
const Match = require('../models/Match');
const bcrypt = require('bcrypt');

const ROLE_POWER = { 'superadmin': 100, 'admin': 50, 'moderator': 20, 'user': 1 };

const userService = {
    // --- PERFIL ---
    getProfile: async (userId) => {
        const user = await User.findById(userId);
        if (!user) throw new Error('Usuario no encontrado');

        const stats = await User.getStats(userId);
        const nextMatch = await Match.findNext();

        let efficiency = 0;
        if (stats.total_played > 0) {
            efficiency = Math.round((stats.total_hits / stats.total_played) * 100);
        }

        // Ranking Exacto (V8)
        const rank = await User.getUserRank(userId);
        const myRankDisplay = rank ? `#${rank}` : '-';

        delete user.password_hash;

        return {
            ...user,
            stats: { efficiency, played: stats.total_played, hits: stats.total_hits, rank: myRankDisplay },
            nextMatch: nextMatch || null
        };
    },

    updateProfile: async (userId, { username, email, avatar, country_id }) => {
        const safeAvatar = avatar || 'default';
        const safeCountry = parseInt(country_id);
        return await User.updateBasicInfo(userId, username, email, safeAvatar, safeCountry);
    },

    changePassword: async (userId, currentPassword, newPassword) => {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) throw new Error('Password incorrecto');

        const hash = await bcrypt.hash(newPassword, 10);
        return await User.updatePassword(userId, hash);
    },

    getLeaderboard: async (competitionId) => {
        return await User.getLeaderboard(competitionId);
    },

    // --- ADMIN ---
    adminCreateUser: async (adminRole, userData) => {
        const { role } = userData;
        const myPower = ROLE_POWER[adminRole] || 0;
        const targetPower = ROLE_POWER[role] || 0;

        if (adminRole !== 'superadmin' && targetPower >= myPower) {
            throw new Error(`No tienes rango para crear un ${role}.`);
        }

        const hash = await bcrypt.hash(userData.password, 10);
        const roleMap = { 'superadmin': 1, 'admin': 2, 'moderator': 3, 'user': 4 };
        const roleId = roleMap[role] || 4;

        return await User.create({ ...userData, password_hash: hash, role_id: roleId });
    },

    adminUpdateUser: async (adminRole, id, { username, email, role }) => {
        const targetUser = await User.findById(id);
        const myPower = ROLE_POWER[adminRole];
        const targetPower = ROLE_POWER[targetUser.role];
        const newRolePower = ROLE_POWER[role];

        if (adminRole !== 'superadmin') {
            if (targetPower >= myPower) throw new Error('No puedes editar a este usuario.');
            if (newRolePower >= myPower) throw new Error('No puedes ascender a este nivel.');
        }

        const roleMap = { 'superadmin': 1, 'admin': 2, 'moderator': 3, 'user': 4 };
        return await User.update(id, { username, email, role_id: roleMap[role] });
    },

    adminDeleteUser: async (adminRole, adminId, targetId) => {
        if (adminId == targetId) throw new Error('No auto-eliminar.');

        const targetUser = await User.findById(targetId);
        const myPower = ROLE_POWER[adminRole];
        const targetPower = ROLE_POWER[targetUser.role];

        if (adminRole !== 'superadmin' && targetPower >= myPower) {
            throw new Error('No tienes permiso para eliminar a este usuario.');
        }
        return await User.delete(targetId);
    }
};

module.exports = userService;