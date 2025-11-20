const User = require('../models/User');
const Match = require('../models/Match'); // Necesario para 'nextMatch'
const bcrypt = require('bcrypt');

// 1. VER PERFIL (Incluye stats y próximo partido)
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        const stats = await User.getStats(req.user.userId);
        const nextMatch = await Match.findNext();

        let efficiency = 0;
        if (stats.total_played > 0) {
            efficiency = Math.round((stats.total_hits / stats.total_played) * 100);
        }

        delete user.password_hash;

        res.json({
            ...user,
            stats: {
                efficiency: efficiency,
                played: stats.total_played,
                hits: stats.total_hits
            },
            nextMatch: nextMatch || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cargar perfil' });
    }
};

// 2. EDITAR MI PERFIL (Usuario se edita a sí mismo)
const updateMyProfile = async (req, res) => {
    const userId = req.user.userId;
    const { username, email, avatar, municipality_id } = req.body;

    if (!username || !email || !municipality_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    try {
        const safeAvatar = avatar || 'default';
        const safeMuni = parseInt(municipality_id);
        
        await User.updateBasicInfo(userId, username, email, safeAvatar, safeMuni);
        res.json({ message: 'Perfil actualizado correctamente.' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El usuario o correo ya está registrado.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar perfil.' });
    }
};

// 3. CAMBIAR CONTRASEÑA PROPIA
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
    } catch (error) { res.status(500).json({ error: 'Error al actualizar.' }); }
};

// 4. RANKING (Público para usuarios logueados)
const getLeaderboard = async (req, res) => {
    try { 
        const rows = await User.getLeaderboard(); 
        res.json(rows); 
    } catch (error) { res.status(500).json({ error: 'Error en ranking' }); }
};

module.exports = { getProfile, updateMyProfile, changePassword, getLeaderboard };