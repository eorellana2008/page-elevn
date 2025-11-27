const User = require('../models/User');
const Match = require('../models/Match');
const bcrypt = require('bcrypt');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const stats = await User.getStats(userId);
        const nextMatch = await Match.findNext();

        // 1. Calcular Efectividad
        let efficiency = 0;
        if (stats && stats.total_played > 0) {
            efficiency = Math.round((stats.total_hits / stats.total_played) * 100);
        }

        // 2. Calcular Ranking
        let myRankDisplay = '-';
        try {
            const rank = await User.getUserRank(userId);
            myRankDisplay = rank ? `#${rank}` : '-';
        } catch (err) {
            console.error("Error calculando ranking:", err);
            // No fallamos todo el perfil si falla el ranking
        }

        delete user.password_hash;

        res.json({
            ...user,
            stats: {
                efficiency: efficiency,
                played: stats ? stats.total_played : 0,
                hits: stats ? stats.total_hits : 0,
                rank: myRankDisplay
            },
            nextMatch: nextMatch || null
        });
    } catch (error) {
        console.error("Error crítico en getProfile:", error);
        res.status(500).json({ error: 'Error interno al cargar perfil' });
    }
};

const updateMyProfile = async (req, res) => {
    const userId = req.user.userId;
    const { username, email, avatar, country_id } = req.body;

    if (!username || !email || !country_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    try {
        const safeAvatar = avatar || 'default';
        const safeCountry = parseInt(country_id);

        await User.updateBasicInfo(userId, username, email, safeAvatar, safeCountry);
        res.json({ message: 'Perfil actualizado correctamente.' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El usuario o correo ya está registrado.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar perfil.' });
    }
};

const changePassword = async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user || !user.password_hash) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });

        const hash = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(userId, hash);
        res.json({ message: 'Contraseña actualizada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar contraseña.' });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const compId = req.query.competition ? parseInt(req.query.competition) : null;
        const rows = await User.getLeaderboard(compId);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en ranking' });
    }
};

module.exports = { getProfile, updateMyProfile, changePassword, getLeaderboard };