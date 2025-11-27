const League = require('../models/League');
const leagueService = require('../services/leagueService');

const createLeague = async (req, res) => {
    if (!req.body.name) return res.status(400).json({ error: 'Nombre requerido.' });
    try {
        const result = await leagueService.create(req.user.userId, req.body.name);
        res.status(201).json({ message: 'Liga creada.', code: result.code });
    } catch (error) { res.status(500).json({ error: 'Error creando liga.' }); }
};

const joinLeague = async (req, res) => {
    if (!req.body.code) return res.status(400).json({ error: 'Código requerido.' });
    try {
        const name = await leagueService.join(req.user.userId, req.body.code);
        res.json({ message: `Te uniste a ${name}` });
    } catch (error) { res.status(400).json({ error: error.message }); }
};

const getMyLeagues = async (req, res) => {
    try {
        const leagues = await League.getMyLeagues(req.user.userId);
        res.json(leagues);
    } catch (error) { res.status(500).json({ error: 'Error loading leagues' }); }
};

const getLeagueDetails = async (req, res) => {
    try {
        const isMember = await League.isMember(req.params.id, req.user.userId);
        if (!isMember) return res.status(403).json({ error: 'No eres miembro.' });
        const ranking = await League.getLeagueRanking(req.params.id);
        res.json(ranking);
    } catch (error) { res.status(500).json({ error: 'Error details' }); }
};

const leaveLeague = async (req, res) => {
    try {
        const league = await League.getAdmin(req.params.id);
        if (league.admin_id === req.user.userId) return res.status(400).json({ error: 'Admin no puede salir.' });
        await League.leave(req.params.id, req.user.userId);
        res.json({ message: 'Saliste de la liga.' });
    } catch (e) { res.status(500).json({ error: 'Error leaving' }); }
};

const deleteLeague = async (req, res) => {
    try {
        const league = await League.getAdmin(req.params.id);
        if (league.admin_id !== req.user.userId) return res.status(403).json({ error: 'No permitido' });
        await League.delete(req.params.id);
        res.json({ message: 'Liga eliminada.' });
    } catch (e) { res.status(500).json({ error: 'Error deleting' }); }
};

const addMatch = async (req, res) => {
    try {
        await leagueService.addMatch(req.user.userId, req.params.id, req.body.match_id);
        res.json({ message: 'Partido agregado.' });
    } catch (e) { res.status(403).json({ error: e.message }); }
};

const removeMatch = async (req, res) => {
    try {
        await leagueService.removeMatch(req.user.userId, req.params.id, req.body.match_id);
        res.json({ message: 'Partido removido.' });
    } catch (e) { res.status(403).json({ error: e.message }); }
};

const getAvailableMatches = async (req, res) => {
    try {
        const matches = await League.getAvailableMatches(req.params.id);
        res.json(matches);
    } catch (e) { res.status(500).json({ error: 'Error getting matches' }); }
};

const getLeagueMatches = async (req, res) => {
    try {
        const matches = await League.getLeagueMatches(req.params.id);
        res.json(matches);
    } catch (e) { res.status(500).json({ error: 'Error getting matches' }); }
};

const savePrediction = async (req, res) => {
    const { match_id, pred_home, pred_away } = req.body;
    try {
        // Reutilizamos la logica de servicio de prediccion aqui, pero por ahora directo
        const Match = require('../models/Match');
        const match = await Match.findById(match_id);
        if (new Date() >= new Date(match.match_date)) return res.status(400).json({ error: 'Tiempo agotado' });
        
        await League.savePrediction(req.params.id, req.user.userId, match_id, pred_home, pred_away);
        res.json({ message: 'Guardado.' });
    } catch (e) { res.status(500).json({ error: 'Error save' }); }
};

const getMyPredictions = async (req, res) => {
    try {
        const preds = await League.getPredictions(req.params.id, req.user.userId);
        res.json(preds);
    } catch (e) { res.status(500).json({ error: 'Error getting preds' }); }
};

module.exports = { createLeague, joinLeague, getMyLeagues, getLeagueDetails, leaveLeague, deleteLeague, addMatch, removeMatch, getAvailableMatches, getLeagueMatches, savePrediction, getMyPredictions };