const Prediction = require('../models/Prediction');
const Match = require('../models/Match');

// Guardar Predicción GLOBAL (Juego principal)
const savePrediction = async (req, res) => {
    const userId = req.user.userId;
    const { match_id, pred_home, pred_away } = req.body;

    if (!match_id || pred_home === undefined || pred_away === undefined) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    try {
        const match = await Match.findById(match_id);

        if (!match) return res.status(404).json({ error: 'Partido no existe' });

        if (match.status === 'finished') {
            return res.status(400).json({ error: 'El partido ya terminó.' });
        }

        const now = new Date();
        const matchDate = new Date(match.match_date);

        if (now >= matchDate) {
            return res.status(400).json({ error: '⏳ El partido ya comenzó. Predicciones cerradas.' });
        }

        // Guardar en tabla GLOBAL
        await Prediction.save(userId, match_id, pred_home, pred_away);

        res.json({ message: 'Pronóstico global guardado' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al guardar pronóstico' });
    }
};

const getMyPredictions = async (req, res) => {
    const userId = req.user.userId;
    try {
        const predictions = await Prediction.getByUser(userId);
        res.json(predictions);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo predicciones' });
    }
};

const getHistory = async (req, res) => {
    const userId = req.user.userId;
    try {
        const history = await Prediction.getHistory(userId);
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
};

module.exports = { savePrediction, getMyPredictions, getHistory };