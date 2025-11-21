const League = require('../models/League');
const Match = require('../models/Match');

// Helper para generar código aleatorio
const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const leagueController = {
    // ==========================================
    // GESTIÓN BÁSICA DE LIGAS
    // ==========================================

    createLeague: async (req, res) => {
        const userId = req.user.userId;
        const { name } = req.body;

        if (!name) return res.status(400).json({ error: 'La liga necesita un nombre.' });

        try {
            let code = generateCode();
            // Crear liga
            const leagueId = await League.create(name, code, userId);
            // Unir al creador automáticamente
            await League.addMember(leagueId, userId);

            res.status(201).json({ message: 'Liga creada con éxito.', code: code });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear la liga.' });
        }
    },

    joinLeague: async (req, res) => {
        const userId = req.user.userId;
        const { code } = req.body;

        if (!code) return res.status(400).json({ error: 'Falta el código de invitación.' });

        try {
            const league = await League.findByCode(code.toUpperCase());
            if (!league) return res.status(404).json({ error: 'Código inválido. No existe esa liga.' });

            const isMember = await League.isMember(league.league_id, userId);
            if (isMember) return res.status(409).json({ error: 'Ya perteneces a esta liga.' });

            await League.addMember(league.league_id, userId);

            res.json({ message: `¡Te has unido a "${league.name}"!` });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al unirse a la liga.' });
        }
    },

    getMyLeagues: async (req, res) => {
        const userId = req.user.userId;
        try {
            const leagues = await League.getMyLeagues(userId);
            res.json(leagues);
        } catch (error) {
            res.status(500).json({ error: 'Error al cargar ligas.' });
        }
    },

    getLeagueDetails: async (req, res) => {
        const userId = req.user.userId;
        const { id } = req.params;

        try {
            const isMember = await League.isMember(id, userId);
            if (!isMember) return res.status(403).json({ error: 'No perteneces a esta liga.' });

            // Obtiene el ranking basado SOLO en league_predictions y league_matches
            const ranking = await League.getLeagueRanking(id);
            res.json(ranking);
        } catch (error) {
            res.status(500).json({ error: 'Error al cargar la liga.' });
        }
    },

    leaveLeague: async (req, res) => {
        const userId = req.user.userId;
        const { id } = req.params;

        try {
            const league = await League.getAdmin(id);
            if (!league) return res.status(404).json({ error: 'Liga no encontrada.' });

            if (league.admin_id === userId) {
                return res.status(400).json({ error: 'El administrador no puede salirse. Debe eliminar la liga.' });
            }

            await League.leave(id, userId);
            res.json({ message: 'Te has salido de la liga.' });
        } catch (error) {
            res.status(500).json({ error: 'Error al salir de la liga.' });
        }
    },

    deleteLeague: async (req, res) => {
        const userId = req.user.userId;
        const { id } = req.params;

        try {
            const league = await League.getAdmin(id);
            if (!league) return res.status(404).json({ error: 'Liga no encontrada.' });

            if (league.admin_id !== userId) {
                return res.status(403).json({ error: 'No tienes permiso para eliminar esta liga.' });
            }

            await League.delete(id);
            res.json({ message: 'Liga eliminada correctamente.' });
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar la liga.' });
        }
    },

    // ==========================================
    // GESTIÓN DE PARTIDOS (ADMIN DE LIGA)
    // ==========================================

    addMatch: async (req, res) => {
        const userId = req.user.userId;
        const { id } = req.params; // league_id
        const { match_id } = req.body;

        try {
            const league = await League.getAdmin(id);
            if (!league) return res.status(404).json({ error: 'Liga no encontrada' });
            if (league.admin_id !== userId) return res.status(403).json({ error: 'Solo el admin puede gestionar partidos.' });

            await League.addMatchToLeague(id, match_id);
            res.json({ message: 'Partido agregado a la liga.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al agregar partido.' });
        }
    },

    removeMatch: async (req, res) => {
        const userId = req.user.userId;
        const { id } = req.params;
        const { match_id } = req.body;

        try {
            const league = await League.getAdmin(id);
            if (!league) return res.status(404).json({ error: 'Liga no encontrada' });
            if (league.admin_id !== userId) return res.status(403).json({ error: 'Acceso denegado.' });

            await League.removeMatchFromLeague(id, match_id);
            res.json({ message: 'Partido removido de la liga.' });
        } catch (error) {
            res.status(500).json({ error: 'Error al remover partido.' });
        }
    },

    getAvailableMatches: async (req, res) => {
        const { id } = req.params;
        try {
            const matches = await League.getAvailableMatches(id);
            res.json(matches);
        } catch (error) { res.status(500).json({ error: 'Error al cargar partidos disponibles.' }); }
    },

    getLeagueMatches: async (req, res) => {
        const { id } = req.params;
        try {
            const matches = await League.getLeagueMatches(id);
            res.json(matches);
        } catch (error) { res.status(500).json({ error: 'Error al cargar partidos de liga.' }); }
    },

    // ==========================================
    // PREDICCIONES PRIVADAS
    // ==========================================

    savePrediction: async (req, res) => {
        const userId = req.user.userId;
        const { id } = req.params; // League ID
        const { match_id, pred_home, pred_away } = req.body;

        try {
            // 1. VERIFICACIÓN DE TIEMPO (NUEVO)
            const Match = require('../models/Match'); // Asegúrate de importar Match arriba
            const match = await Match.findById(match_id);

            if (!match) return res.status(404).json({ error: 'Partido no encontrado.' });

            const now = new Date();
            const matchDate = new Date(match.match_date);

            if (now >= matchDate || match.status === 'finished') {
                return res.status(400).json({ error: '⏳ El partido ya comenzó. Predicciones cerradas.' });
            }

            // 2. Guardar si está a tiempo
            await League.savePrediction(id, userId, match_id, pred_home, pred_away);
            res.json({ message: 'Pronóstico privado guardado.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al guardar pronóstico privado.' });
        }
    },

    getMyPredictions: async (req, res) => {
        const userId = req.user.userId;
        const { id } = req.params;
        try {
            const preds = await League.getPredictions(id, userId);
            res.json(preds);
        } catch (error) { res.status(500).json({ error: 'Error al cargar predicciones privadas.' }); }
    }
};

module.exports = leagueController;