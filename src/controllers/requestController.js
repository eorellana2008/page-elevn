const requestService = require('../services/requestService');
const Request = require('../models/Request');

const createRequest = async (req, res) => {
    if(!req.body.message) return res.status(400).json({error: 'Mensaje vacío'});
    try {
        await requestService.create(req.user.userId, req.body.type, req.body.message);
        res.status(201).json({ message: 'Enviado.' });
    } catch (e) { res.status(500).json({ error: 'Error.' }); }
};

const respondAndResolve = async (req, res) => {
    if(!req.body.responseMessage) return res.status(400).json({error: 'Respuesta vacía'});
    try {
        await requestService.respond(req.params.id, req.body.responseMessage);
        res.json({ message: 'Resuelto.' });
    } catch (e) { res.status(500).json({ error: 'Error.' }); }
};

module.exports = { 
    createRequest, 
    respondAndResolve, 
    getRequests: async (req, res) => res.json(await Request.getPending()), 
    getMyResolvedRequests: async (req, res) => res.json(await Request.getResolvedByUser(req.user.userId)) 
};