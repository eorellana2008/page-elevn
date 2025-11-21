const Country = require('../models/Country');

const getCountries = async (req, res) => {
    try {
        const countries = await Country.getAll();
        res.json(countries);
    } catch (error) {
        console.error('Error al obtener países:', error);
        res.status(500).json({ error: 'Error interno.' });
    }
};

module.exports = { getCountries };