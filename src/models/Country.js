const pool = require('../../db/connection');

const Country = {
    getAll: async () => {
        const query = 'SELECT country_id, name, code FROM countries ORDER BY name ASC';
        const [rows] = await pool.query(query);
        return rows;
    }
};

module.exports = Country;