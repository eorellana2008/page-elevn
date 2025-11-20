const User = require('../models/User');
const Match = require('../models/Match');
const bcrypt = require('bcrypt');

// ⚡ MAPA DE PODER
const ROLE_POWER = {
    'superadmin': 100,
    'admin': 50,
    'moderator': 20,
    'user': 1
};

// --- FUNCIONES PÚBLICAS ---
const getProfile = async (req, res) => {
    try {
        // 1. Obtener datos básicos del usuario
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        // 2. Obtener estadísticas
        const stats = await User.getStats(req.user.userId);

        // 3. Obtener próximo partido
        const nextMatch = await Match.findNext();

        // 4. Calcular porcentaje (Evitar división por cero)
        let efficiency = 0;
        if (stats.total_played > 0) {
            efficiency = Math.round((stats.total_hits / stats.total_played) * 100);
        }

        // Limpiar hash
        delete user.password_hash;

        // 5. Enviar todo junto
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

const changePassword = async (req, res) => {
    // ... (Mismo código de cambio de contraseña propio que tenías) ...
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user || !user.password_hash) return res.status(404).json({ error: 'Hash no encontrado.' });

        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });

        const hash = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(userId, hash);
        res.json({ message: 'Contraseña actualizada.' });
    } catch (error) { res.status(500).json({ error: 'Error al actualizar.' }); }
};

const updateMyProfile = async (req, res) => {
    const userId = req.user.userId;
    // Agregamos municipality_id
    const { username, email, avatar, municipality_id } = req.body;

    if (!username || !email || !municipality_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    try {
        const safeAvatar = avatar || 'default';
        const safeMuni = parseInt(municipality_id); // Aseguramos que sea número

        // Pasamos los 5 argumentos
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

const getLeaderboard = async (req, res) => {
    try { const rows = await User.getLeaderboard(); res.json(rows); }
    catch (error) { res.status(500).json({ error: 'Error en ranking' }); }
};

// --- FUNCIONES ADMIN / STAFF (AHORA RESTRINGIDAS) ---

const getAllUsers = async (req, res) => {
    // Opcional: Si quieres que el Mod NI SIQUIERA VEA la lista, descomenta esto:
    /*
    if (req.user.role === 'moderator') {
        return res.status(403).json({ error: 'Los moderadores no tienen acceso a la lista de usuarios.' });
    }
    */
    try { const users = await User.getAllDetailed(); res.json(users); }
    catch (error) { res.status(500).json({ error: 'Error al listar.' }); }
};

const createUser = async (req, res) => {
    // 🚫 REGLA: MODERADORES NO CREAN USUARIOS
    if (req.user.role === 'moderator') {
        return res.status(403).json({ error: 'Acceso denegado. Solo Admins pueden crear usuarios.' });
    }

    const { username, email, password, role, municipality_id } = req.body;

    // Validación de Jerarquía para Admin vs Superadmin
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

const updateUser = async (req, res) => {
    // 🚫 REGLA: MODERADORES NO EDITAN USUARIOS
    if (req.user.role === 'moderator') {
        return res.status(403).json({ error: 'Acceso denegado. Solo Admins pueden editar usuarios.' });
    }

    const { id } = req.params;
    const { username, email, role } = req.body;

    try {
        // Validaciones de poder existentes...
        const targetUserCurrent = await User.findById(id);
        const myPower = ROLE_POWER[req.user.role];
        const targetPower = ROLE_POWER[targetUserCurrent.role];
        const newRolePower = ROLE_POWER[role];

        if (req.user.role !== 'superadmin') {
            if (targetPower >= myPower) return res.status(403).json({ error: 'No puedes editar a este usuario.' });
            if (newRolePower >= myPower) return res.status(403).json({ error: 'No puedes ascender a este nivel.' });
        }

        let role_id = (role === 'superadmin') ? 1 : (role === 'admin' ? 2 : (role === 'moderator' ? 3 : 4));
        await User.update(id, { username, email, role_id });
        res.json({ message: 'Actualizado correctamente' });
    } catch (error) { res.status(500).json({ error: 'Error al actualizar' }); }
};

const deleteUser = async (req, res) => {
    // 🚫 REGLA: MODERADORES NO BORRAN USUARIOS
    if (req.user.role === 'moderator') {
        return res.status(403).json({ error: 'Acceso denegado. Solo Admins pueden eliminar usuarios.' });
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

const adminResetPassword = async (req, res) => {
    // 🚫 REGLA: MODERADORES NO CAMBIAN CONTRASEÑAS
    if (req.user.role === 'moderator') {
        return res.status(403).json({ error: 'Acceso denegado. Contacta a un Admin.' });
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

module.exports = {
    getProfile, changePassword, updateMyProfile, // <-- Agregado
    getLeaderboard, getAllUsers, createUser, updateUser, deleteUser, adminResetPassword
};