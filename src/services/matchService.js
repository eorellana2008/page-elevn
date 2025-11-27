const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const League = require('../models/League');

const matchService = {
    processMatchResult: async (matchId, scoreHome, scoreAway) => {
        console.log(`Procesando partido ${matchId}: ${scoreHome}-${scoreAway}`);
        try {
            await Match.updateScore(matchId, scoreHome, scoreAway);

            const preds = await Prediction.getByMatch(matchId);
            const globalUpdates = preds.map(async (p) => {
                let puntos = 0;
                const predHome = parseInt(p.pred_home);
                const predAway = parseInt(p.pred_away);

                if (predHome === scoreHome && predAway === scoreAway) puntos = 3;
                else if (Math.sign(scoreHome - scoreAway) === Math.sign(predHome - predAway)) puntos = 1;

                await Prediction.updatePoints(p.prediction_id, puntos);
            });
            await Promise.all(globalUpdates);

            await League.updatePoints(matchId, scoreHome, scoreAway);
            return { success: true, message: 'Resultados procesados y puntos repartidos.' };
        } catch (error) {
            console.error("Error en matchService:", error);
            throw error;
        }
    }
};

module.exports = matchService;