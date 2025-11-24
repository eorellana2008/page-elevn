const pool = require('../../db/connection');

const Match = {
    // Obtener partidos (Ahora incluye match_round)
    getAll: async (competitionId = null) => {
        let query = `
            SELECT m.*, c.name as competition_name 
            FROM matches m
            LEFT JOIN competitions c ON m.competition_id = c.competition_id
        `;
        const params = [];

        if (competitionId) {
            query += ' WHERE m.competition_id = ?';
            params.push(competitionId);
        }

        query += ' ORDER BY m.match_date ASC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM matches WHERE match_id = ?', [id]);
        return rows[0];
    },

    // CREAR: Añadimos match_round
    create: async (data) => {
        const { team_home, team_away, match_date, competition_id, match_round } = data;
        const query = 'INSERT INTO matches (team_home, team_away, match_date, competition_id, match_round) VALUES (?, ?, ?, ?, ?)';
        const compId = competition_id ? parseInt(competition_id) : null;
        return await pool.query(query, [team_home, team_away, match_date, compId, match_round]);
    },

    // ACTUALIZAR: Añadimos match_round
    updateDetails: async (id, data) => {
        const { team_home, team_away, match_date, competition_id, match_round } = data;
        const query = `
            UPDATE matches 
            SET team_home = ?, team_away = ?, match_date = ?, competition_id = ?, match_round = ?
            WHERE match_id = ?
        `;
        const compId = competition_id ? parseInt(competition_id) : null;
        return await pool.query(query, [team_home, team_away, match_date, compId, match_round, id]);
    },

    updateScore: async (id, homeScore, awayScore) => {
        const query = `
            UPDATE matches 
            SET score_home = ?, score_away = ?, status = 'finished' 
            WHERE match_id = ?
        `;
        return await pool.query(query, [homeScore, awayScore, id]);
    },

    delete: async (id) => {
        return await pool.query('DELETE FROM matches WHERE match_id = ?', [id]);
    },

    findNext: async () => {
        const query = `
            SELECT * FROM matches 
            WHERE match_date >= NOW() 
            AND (status != 'finished' OR status IS NULL)
            ORDER BY match_date ASC 
            LIMIT 1
        `;
        const [rows] = await pool.query(query);
        return rows[0];
    },
};

module.exports = Match;