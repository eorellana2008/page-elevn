const pool = require('../../db/connection');

const User = {
    saveResetToken: async (userId, token) => {
        const expires = new Date(Date.now() + 3600000);
        const query = 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?';
        return await pool.query(query, [token, expires, userId]);
    },

    findByResetToken: async (token) => {
        const query = 'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()';
        const [rows] = await pool.query(query, [token]);
        return rows[0];
    },

    clearResetToken: async (userId) => {
        const query = 'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?';
        return await pool.query(query, [userId]);
    },

    findByUsername: async (username) => {
        const query = 'SELECT u.user_id, u.username, u.password_hash, r.name AS role FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.username = ?';
        const [rows] = await pool.query(query, [username]);
        return rows[0];
    },

    findByEmail: async (email) => {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.query(query, [email]);
        return rows[0];
    },

    create: async (userData) => {
        const { username, email, password_hash, role_id, country_id } = userData;
        const query = 'INSERT INTO users (username, email, password_hash, role_id, country_id) VALUES (?, ?, ?, ?, ?)';
        return await pool.query(query, [username, email, password_hash, role_id, country_id]);
    },

    getAllDetailed: async () => {
        const query = 'SELECT u.user_id, u.username, u.email, c.name as country_name, c.code as country_code, r.name as role FROM users u LEFT JOIN countries c ON u.country_id = c.country_id JOIN roles r ON u.role_id = r.role_id ORDER BY u.user_id ASC';
        const [rows] = await pool.query(query);
        return rows;
    },

    findById: async (id) => {
        const query = `
            SELECT u.user_id, u.username, u.email, u.created_at, u.password_hash, u.avatar, u.country_id, 
                   c.name as country_name, c.code as country_code, 
                   r.name as role,
                   (SELECT COALESCE(SUM(points), 0) FROM predictions WHERE user_id = u.user_id) as total_points
            FROM users u
            LEFT JOIN countries c ON u.country_id = c.country_id
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.user_id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    },

    update: async (id, data) => {
        const { username, email, role_id } = data;
        const query = 'UPDATE users SET username = ?, email = ?, role_id = ? WHERE user_id = ?';
        return await pool.query(query, [username, email, role_id, id]);
    },

    updatePassword: async (id, newHash) => {
        return await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, id]);
    },

    delete: async (id) => {
        return await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
    },

    getLeaderboard: async (competitionId = null) => {
        let query = `
            SELECT u.username, COALESCE(SUM(p.points), 0) as total_points
            FROM users u
            LEFT JOIN predictions p ON u.user_id = p.user_id
        `;
        let params = [];

        if (competitionId) {
            query += ` LEFT JOIN matches m ON p.match_id = m.match_id WHERE m.competition_id = ? `;
            params.push(competitionId);
        }

        query += ` GROUP BY u.user_id ORDER BY total_points DESC LIMIT 10`;

        const [rows] = await pool.query(query, params);
        return rows;
    },

    getStats: async (userId) => {
        const query = `
            SELECT COUNT(*) as total_played, 
                   SUM(CASE WHEN points > 0 THEN 1 ELSE 0 END) as total_hits 
            FROM predictions WHERE user_id = ?
        `;
        const [rows] = await pool.query(query, [userId]);
        return rows[0];
    },

    updateBasicInfo: async (id, username, email, avatar, country_id) => {
        const query = 'UPDATE users SET username = ?, email = ?, avatar = ?, country_id = ? WHERE user_id = ?';
        return await pool.query(query, [username, email, avatar, country_id, id]);
    },

    // CORREGIDO: Usamos 'ranking' en lugar de 'rank' para evitar error de palabra reservada
    getUserRank: async (userId) => {
        const query = `
            SELECT COUNT(*) + 1 as ranking
            FROM (
                SELECT u.user_id, COALESCE(SUM(p.points), 0) as total_points 
                FROM users u
                LEFT JOIN predictions p ON u.user_id = p.user_id 
                GROUP BY u.user_id
            ) as scores
            WHERE total_points > (
                SELECT COALESCE(SUM(p2.points), 0) 
                FROM users u2 
                LEFT JOIN predictions p2 ON u2.user_id = p2.user_id 
                WHERE u2.user_id = ?
            )
        `;
        const [rows] = await pool.query(query, [userId]);
        return rows[0] ? rows[0].ranking : 1; // Leemos .ranking
    }
};

module.exports = User;