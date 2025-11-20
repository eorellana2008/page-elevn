const pool = require('../../db/connection');

const User = {

    saveResetToken: async (userId, token) => {
        // El token expira en 1 hora
        const expires = new Date(Date.now() + 3600000);
        const query = 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?';
        return await pool.query(query, [token, expires, userId]);
    },

    //  NUEVO: Buscar usuario por token válido
    findByResetToken: async (token) => {
        const query = `
            SELECT * FROM users 
            WHERE reset_token = ? 
            AND reset_token_expires > NOW()
        `;
        const [rows] = await pool.query(query, [token]);
        return rows[0];
    },

    //  NUEVO: Limpiar token después de usarlo
    clearResetToken: async (userId) => {
        const query = 'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?';
        return await pool.query(query, [userId]);
    },

    // Usado en Login
    findByUsername: async (username) => {
        const query = `
            SELECT u.user_id, u.username, u.password_hash, r.name AS role 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.username = ?
        `;
        const [rows] = await pool.query(query, [username]);
        return rows[0];
    },

    findByEmail: async (email) => {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.query(query, [email]);
        return rows[0];
    },

    // Usado en Registro y Crear Admin
    create: async (userData) => {
        const { username, email, password_hash, role_id, municipality_id } = userData;
        const query = `
            INSERT INTO users (username, email, password_hash, role_id, municipality_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        return await pool.query(query, [username, email, password_hash, role_id, municipality_id]);
    },

    // Usado en Admin Panel (Lista completa)
    getAllDetailed: async () => {
        const query = `
            SELECT u.user_id, u.username, u.email, m.name as municipality, 
                   d.name as department, r.name as role 
            FROM users u 
            LEFT JOIN municipalities m ON u.municipality_id = m.municipality_id 
            LEFT JOIN departments d ON m.department_id = d.department_id 
            JOIN roles r ON u.role_id = r.role_id 
            ORDER BY u.user_id ASC
        `;
        const [rows] = await pool.query(query);
        return rows;
    },

    findById: async (id) => {
        const query = `
            SELECT u.user_id, u.username, u.email, u.created_at, 
                   u.password_hash, u.avatar, u.municipality_id, /* <--- AGREGADO */
                   m.name as municipality, d.name as department, r.name as role,
                   (SELECT COALESCE(SUM(points), 0) FROM predictions WHERE user_id = u.user_id) as total_points
            FROM users u
            LEFT JOIN municipalities m ON u.municipality_id = m.municipality_id
            LEFT JOIN departments d ON m.department_id = d.department_id
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.user_id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    },

    // Usado para actualizar datos básicos
    update: async (id, data) => {
        const { username, email, role_id } = data;
        const query = `UPDATE users SET username = ?, email = ?, role_id = ? WHERE user_id = ?`;
        return await pool.query(query, [username, email, role_id, id]);
    },

    // Usado para cambiar contraseña
    updatePassword: async (id, newHash) => {
        return await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, id]);
    },

    // Usado para borrar
    delete: async (id) => {
        return await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
    },

    // Usado para el Ranking
    getLeaderboard: async () => {
        const query = `
            SELECT u.username, COALESCE(SUM(p.points), 0) as total_points
            FROM users u
            LEFT JOIN predictions p ON u.user_id = p.user_id
            GROUP BY u.user_id
            ORDER BY total_points DESC
            LIMIT 10
        `;
        const [rows] = await pool.query(query);
        return rows;
    },

    getStats: async (userId) => {
        // Contar predicciones totales y cuántas han sumado puntos (> 0)
        const query = `
            SELECT 
                COUNT(*) as total_played,
                SUM(CASE WHEN points > 0 THEN 1 ELSE 0 END) as total_hits
            FROM predictions 
            WHERE user_id = ?
        `;
        const [rows] = await pool.query(query, [userId]);
        return rows[0];
    },

    updateBasicInfo: async (id, username, email, avatar, municipality_id) => {
        const query = 'UPDATE users SET username = ?, email = ?, avatar = ?, municipality_id = ? WHERE user_id = ?';
        return await pool.query(query, [username, email, avatar, municipality_id, id]);
    },
};

module.exports = User;