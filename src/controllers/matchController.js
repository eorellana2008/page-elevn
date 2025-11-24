const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const League = require('../models/League');

// OBTENER TODOS
const getMatches = async (req, res) => {
    try {
        const competitionId = req.query.competition ? parseInt(req.query.competition) : null;
        const matches = await Match.getAll(competitionId);
        res.json(matches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener partidos' });
    }
};

// CREAR (Admin)
const createMatch = async (req, res) => {
    // Recibimos match_round
    const { team_home, team_away, match_date, competition_id, match_round } = req.body;

    if (!team_home || !team_away || !match_date) return res.status(400).json({ error: 'Faltan datos básicos' });

    try {
        await Match.create({ team_home, team_away, match_date, competition_id, match_round });
        res.status(201).json({ message: 'Partido creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear partido' });
    }
};

// EDITAR DATOS (Admin)
const updateMatchDetails = async (req, res) => {
    const { id } = req.params;
    const { team_home, team_away, match_date, competition_id, match_round } = req.body;

    try {
        await Match.updateDetails(id, { team_home, team_away, match_date, competition_id, match_round });
        res.json({ message: 'Datos actualizados' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
};

// ... (deleteMatch y updateMatchScore se mantienen IGUAL que antes) ...
const deleteMatch = async (req, res) => {
    const { id } = req.params;
    try {
        await Match.delete(id);
        res.json({ message: 'Partido eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
};

const updateMatchScore = async (req, res) => {
    const { id } = req.params;
    const score_home = parseInt(req.body.score_home);
    const score_away = parseInt(req.body.score_away);

    try {
        await Match.updateScore(id, score_home, score_away);

        // Repartir Puntos GLOBAL
        const preds = await Prediction.getByMatch(id);
        const globalUpdates = preds.map(async (p) => {
            let puntos = 0;
            const predHome = parseInt(p.pred_home);
            const predAway = parseInt(p.pred_away);

            if (predHome === score_home && predAway === score_away) {
                puntos = 3;
            } else {
                const realWinner = Math.sign(score_home - score_away);
                const predWinner = Math.sign(predHome - predAway);
                if (realWinner === predWinner) puntos = 1;
            }
            await Prediction.updatePoints(p.prediction_id, puntos);
        });
        await Promise.all(globalUpdates);

        // Repartir Puntos LIGAS
        await League.updatePoints(id, score_home, score_away);

        res.json({ message: 'Marcador actualizado.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar resultados' });
    }
};

module.exports = { getMatches, createMatch, updateMatchDetails, deleteMatch, updateMatchScore };