const pool = require('../../db/connection');

const Location = {
    getAllMunicipalities: async () => {
        const query = `
            SELECT 
                m.municipality_id, 
                m.name AS municipality_name, 
                d.name AS department_name
            FROM municipalities m
            JOIN departments d ON m.department_id = d.department_id
            ORDER BY d.name, m.name;
        `;
        const [rows] = await pool.query(query);
        return rows;
    }
};

module.exports = Location;