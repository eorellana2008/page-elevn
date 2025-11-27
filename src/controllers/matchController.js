const Match = require('../models/Match');
const matchService = require('../services/matchService'); 

const getMatches = async (req, res) => {
    try {
        const competitionId = req.query.competition ? parseInt(req.query.competition) : null;
        const matches = await Match.getAll(competitionId);
        res.json(matches);
    } catch (error) { res.status(500).json({ error: 'Error getting matches' }); }
};

const createMatch = async (req, res) => {
    try {
        await Match.create(req.body);
        res.status(201).json({ message: 'Partido creado' });
    } catch (error) { res.status(500).json({ error: 'Error creating match' }); }
};

const updateMatchDetails = async (req, res) => {
    try {
        await Match.updateDetails(req.params.id, req.body);
        res.json({ message: 'Datos actualizados' });
    } catch (error) { res.status(500).json({ error: 'Error updating match' }); }
};

const deleteMatch = async (req, res) => {
    try {
        await Match.delete(req.params.id);
        res.json({ message: 'Partido eliminado' });
    } catch (error) { res.status(500).json({ error: 'Error deleting match' }); }
};

const updateMatchScore = async (req, res) => {
    const { id } = req.params;
    const score_home = parseInt(req.body.score_home);
    const score_away = parseInt(req.body.score_away);

    if (isNaN(score_home) || isNaN(score_away)) return res.status(400).json({ error: 'Marcadores inválidos' });

    try {
        const result = await matchService.processMatchResult(id, score_home, score_away);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar resultados.' });
    }
};

module.exports = { getMatches, createMatch, updateMatchDetails, deleteMatch, updateMatchScore };