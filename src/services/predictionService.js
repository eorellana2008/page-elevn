const Prediction = require('../models/Prediction');
const League = require('../models/League');
const Match = require('../models/Match');

const predictionService = {
    save: async (userId, matchId, home, away, leagueId = null) => {
        const match = await Match.findById(matchId);
        if (!match) throw new Error('Partido no existe.');
        if (match.status === 'finished') throw new Error('Partido finalizado.');
        
        const now = new Date();
        if (now >= new Date(match.match_date)) throw new Error('Tiempo agotado.');

        if (leagueId) {
            return await League.savePrediction(leagueId, userId, matchId, home, away);
        } else {
            return await Prediction.save(userId, matchId, home, away);
        }
    }
};

module.exports = predictionService;