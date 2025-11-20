const Location = require('../models/Location');

const getMunicipalities = async (req, res) => {
    try {
        const municipalities = await Location.getAllMunicipalities();
        res.json(municipalities);
    } catch (error) {
        console.error('Error al obtener municipios:', error);
        res.status(500).json({ error: 'Error interno al cargar ubicaciones.' });
    }
};

module.exports = { getMunicipalities };