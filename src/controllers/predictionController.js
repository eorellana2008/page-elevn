const predictionService = require('../services/predictionService');
const Prediction = require('../models/Prediction');

const savePrediction = async (req, res) => {
    const { match_id, pred_home, pred_away } = req.body;
    if (!match_id || pred_home === undefined) return res.status(400).json({ error: 'Datos incompletos' });

    try {
        await predictionService.save(req.user.userId, match_id, pred_home, pred_away);
        res.json({ message: 'Guardado.' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getMyPredictions = async (req, res) => {
    try {
        const preds = await Prediction.getByUser(req.user.userId);
        res.json(preds);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
};

const getHistory = async (req, res) => {
    try {
        const hist = await Prediction.getHistory(req.user.userId);
        res.json(hist);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
};

module.exports = { savePrediction, getMyPredictions, getHistory };