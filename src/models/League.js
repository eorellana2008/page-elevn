const pool = require('../../db/connection');

const League = {
    // --- FUNCIONES BÁSICAS (Crear, Unirse, Salir) ---
    create: async (name, code, adminId) => {
        const query = 'INSERT INTO leagues (name, code, admin_id) VALUES (?, ?, ?)';
        const [result] = await pool.query(query, [name, code, adminId]);
        return result.insertId;
    },

    addMember: async (leagueId, userId) => {
        const query = 'INSERT INTO league_members (league_id, user_id) VALUES (?, ?)';
        return await pool.query(query, [leagueId, userId]);
    },

    findByCode: async (code) => {
        const query = 'SELECT * FROM leagues WHERE code = ?';
        const [rows] = await pool.query(query, [code]);
        return rows[0];
    },

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

    isMember: async (leagueId, userId) => {
        const query = 'SELECT id FROM league_members WHERE league_id = ? AND user_id = ?';
        const [rows] = await pool.query(query, [leagueId, userId]);
        return rows.length > 0;
    },

    leave: async (leagueId, userId) => {
        const query = 'DELETE FROM league_members WHERE league_id = ? AND user_id = ?';
        return await pool.query(query, [leagueId, userId]);
    },

    delete: async (leagueId) => {
        const query = 'DELETE FROM leagues WHERE league_id = ?';
        return await pool.query(query, [leagueId]);
    },

    getAdmin: async (leagueId) => {
        const query = 'SELECT admin_id FROM leagues WHERE league_id = ?';
        const [rows] = await pool.query(query, [leagueId]);
        return rows[0];
    },

    // --- GESTIÓN DE PARTIDOS DE LIGA ---

    addMatchToLeague: async (leagueId, matchId) => {
        const query = 'INSERT IGNORE INTO league_matches (league_id, match_id) VALUES (?, ?)';
        return await pool.query(query, [leagueId, matchId]);
    },

    removeMatchFromLeague: async (leagueId, matchId) => {
        const query = 'DELETE FROM league_matches WHERE league_id = ? AND match_id = ?';
        return await pool.query(query, [leagueId, matchId]);
    },

    getLeagueMatches: async (leagueId) => {
        const query = `
            SELECT m.*, c.name as competition_name 
            FROM matches m
            JOIN league_matches lm ON m.match_id = lm.match_id
            LEFT JOIN competitions c ON m.competition_id = c.competition_id
            WHERE lm.league_id = ?
            ORDER BY m.match_date ASC
        `;
        const [rows] = await pool.query(query, [leagueId]);
        return rows;
    },

    getAvailableMatches: async (leagueId) => {
        const query = `
            SELECT m.*, c.name as competition_name 
            FROM matches m
            LEFT JOIN competitions c ON m.competition_id = c.competition_id
            WHERE m.match_id NOT IN (SELECT match_id FROM league_matches WHERE league_id = ?)
            AND m.status != 'finished' -- Opcional: solo mostrar pendientes
            ORDER BY m.match_date ASC
        `;
        const [rows] = await pool.query(query, [leagueId]);
        return rows;
    },

    // --- PREDICCIONES PRIVADAS (DOBLE TABLA) ---

    savePrediction: async (leagueId, userId, matchId, home, away) => {
        const query = `
            INSERT INTO league_predictions (league_id, user_id, match_id, pred_home, pred_away)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE pred_home = VALUES(pred_home), pred_away = VALUES(pred_away)
        `;
        return await pool.query(query, [leagueId, userId, matchId, home, away]);
    },

    getPredictions: async (leagueId, userId) => {
        const query = 'SELECT match_id, pred_home, pred_away, points FROM league_predictions WHERE league_id = ? AND user_id = ?';
        const [rows] = await pool.query(query, [leagueId, userId]);
        return rows;
    },

    getLeagueRanking: async (leagueId) => {
        const query = `
            SELECT u.username, u.avatar, COALESCE(SUM(lp.points), 0) as total_points
            FROM league_members lm
            JOIN users u ON lm.user_id = u.user_id
            LEFT JOIN league_predictions lp ON u.user_id = lp.user_id AND lp.league_id = lm.league_id
            WHERE lm.league_id = ?
            -- Aseguramos que solo sume puntos de partidos que siguen estando en la liga
            AND (lp.match_id IS NULL OR lp.match_id IN (SELECT match_id FROM league_matches WHERE league_id = ?))
            GROUP BY u.user_id
            ORDER BY total_points DESC
        `;
        const [rows] = await pool.query(query, [leagueId, leagueId]);
        return rows;
    },

    // Actualización masiva de puntos privados cuando termina un partido
    updatePoints: async (matchId, resultHome, resultAway) => {
        const query = `
            UPDATE league_predictions 
            SET points = CASE 
                WHEN pred_home = ? AND pred_away = ? THEN 3
                WHEN SIGN(pred_home - pred_away) = SIGN(? - ?) THEN 1
                ELSE 0
            END
            WHERE match_id = ?
        `;
        return await pool.query(query, [resultHome, resultAway, resultHome, resultAway, matchId]);
    }
};

module.exports = League;