const pool = require('../../db/connection');

const Competition = {
    // Obtener todas las competiciones activas
    getAll: async () => {
        const query = 'SELECT competition_id, name, logo_url FROM competitions ORDER BY name ASC';
        const [rows] = await pool.query(query);
        return rows;
    },

    // Obtener una por ID (útil para títulos)
    findById: async (id) => {
        const query = 'SELECT * FROM competitions WHERE competition_id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }
};

module.exports = Competition;