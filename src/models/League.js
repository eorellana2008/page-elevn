const pool = require('../../db/connection');

const League = {
    // Crear una nueva liga
    create: async (name, code, adminId) => {
        const query = 'INSERT INTO leagues (name, code, admin_id) VALUES (?, ?, ?)';
        const [result] = await pool.query(query, [name, code, adminId]);
        return result.insertId;
    },

    // Agregar un miembro a una liga
    addMember: async (leagueId, userId) => {
        const query = 'INSERT INTO league_members (league_id, user_id) VALUES (?, ?)';
        return await pool.query(query, [leagueId, userId]);
    },

    // Buscar liga por código (Para unirse)
    findByCode: async (code) => {
        const query = 'SELECT * FROM leagues WHERE code = ?';
        const [rows] = await pool.query(query, [code]);
        return rows[0];
    },

    // Obtener las ligas a las que pertenezco
    getMyLeagues: async (userId) => {
        const query = `
            SELECT l.league_id, l.name, l.code, l.admin_id, 
                   (SELECT COUNT(*) FROM league_members WHERE league_id = l.league_id) as members_count
            FROM leagues l
            JOIN league_members lm ON l.league_id = lm.league_id
            WHERE lm.user_id = ?
            ORDER BY l.created_at DESC
        `;
        const [rows] = await pool.query(query, [userId]);
        return rows;
    },

    // Obtener el Ranking de una Liga específica
    getLeagueRanking: async (leagueId) => {
        const query = `
            SELECT u.username, COALESCE(SUM(p.points), 0) as total_points
            FROM league_members lm
            JOIN users u ON lm.user_id = u.user_id
            LEFT JOIN predictions p ON u.user_id = p.user_id
            WHERE lm.league_id = ?
            GROUP BY u.user_id
            ORDER BY total_points DESC
        `;
        const [rows] = await pool.query(query, [leagueId]);
        return rows;
    },
    
    // Verificar si ya soy miembro (Para no unirse doble)
    isMember: async (leagueId, userId) => {
        const query = 'SELECT id FROM league_members WHERE league_id = ? AND user_id = ?';
        const [rows] = await pool.query(query, [leagueId, userId]);
        return rows.length > 0;
    }
};

module.exports = League;