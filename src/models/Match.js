const pool = require('../../db/connection');

const Match = {
    getAll: async () => {
        const [rows] = await pool.query('SELECT * FROM matches ORDER BY match_date ASC');
        return rows;
    },

    findById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM matches WHERE match_id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
        const { team_home, team_away, match_date } = data;
        const query = 'INSERT INTO matches (team_home, team_away, match_date) VALUES (?, ?, ?)';
        return await pool.query(query, [team_home, team_away, match_date]);
    },

    updateDetails: async (id, data) => {
        const { team_home, team_away, match_date } = data;
        const query = `
            UPDATE matches 
            SET team_home = ?, team_away = ?, match_date = ? 
            WHERE match_id = ?
        `;
        return await pool.query(query, [team_home, team_away, match_date, id]);
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
    }
};

module.exports = Match;