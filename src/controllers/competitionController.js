const Competition = require('../models/Competition');

const getCompetitions = async (req, res) => {
    try {
        const comps = await Competition.getAll();
        res.json(comps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener competiciones' });
    }
};

module.exports = { getCompetitions };