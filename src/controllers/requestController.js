const Request = require('../models/Request');

// 1. CREAR TICKET (Usuario)
const createRequest = async (req, res) => {
    const userId = req.user.userId;
    const { type, message } = req.body;

    if (!message) return res.status(400).json({ error: 'El mensaje no puede estar vacío' });

    try {
        await Request.create(userId, type, message);
        res.status(201).json({ message: 'Solicitud enviada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al enviar solicitud.' });
    }
};

// 2. LEER TICKETS (Admin)
const getRequests = async (req, res) => {
    try {
        const requests = await Request.getPending();
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener solicitudes.' });
    }
};

// 3. RESPONDER Y RESOLVER TICKET (Admin) - Reemplaza resolveRequest
const respondAndResolve = async (req, res) => {
    const { id } = req.params;
    const { responseMessage } = req.body;

    if (!responseMessage) return res.status(400).json({ error: 'La respuesta no puede estar vacía.' });

    try {
        await Request.respondAndResolve(id, responseMessage);
        res.json({ message: 'Solicitud resuelta y respuesta enviada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al responder la solicitud.' });
    }
};

// 4. OBTENER TICKETS RESUELTOS DEL USUARIO
const getMyResolvedRequests = async (req, res) => {
    const userId = req.user.userId;

    try {
        const requests = await Request.getResolvedByUser(userId); 
        
        res.json(requests);
    } catch (error) {
        console.error('CRASH al obtener tickets resueltos:', error); 
        res.status(500).json({ error: 'Error al obtener solicitudes resueltas.' });
    }
};

module.exports = { createRequest, getRequests, respondAndResolve, getMyResolvedRequests };
