const League = require('../models/League')

// Helper para generar código aleatorio (6 caracteres mayúsculas/números)
const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const leagueController = {
    // 1. CREAR LIGA
    createLeague: async (req, res) => {
        const userId = req.user.userId;
        const { name } = req.body;

        if (!name) return res.status(400).json({ error: 'La liga necesita un nombre.' });

        try {
            // Generar código único (intentamos hasta que no exista, simple por ahora)
            let code = generateCode();
            // Nota: En un sistema masivo, aquí verificaríamos si el código ya existe en DB.
            
            // Crear la liga
            const leagueId = await League.create(name, code, userId);

            // Unir al creador automáticamente como miembro
            await League.addMember(leagueId, userId);

            res.status(201).json({ message: 'Liga creada con éxito.', code: code });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear la liga.' });
        }
    },

    // 2. UNIRSE A LIGA
    joinLeague: async (req, res) => {
        const userId = req.user.userId;
        const { code } = req.body;

        if (!code) return res.status(400).json({ error: 'Falta el código de invitación.' });

        try {
            // Buscar liga
            const league = await League.findByCode(code.toUpperCase());
            if (!league) return res.status(404).json({ error: 'Código inválido. No existe esa liga.' });

            // Verificar si ya soy miembro
            const isMember = await League.isMember(league.league_id, userId);
            if (isMember) return res.status(409).json({ error: 'Ya perteneces a esta liga.' });

            // Unirse
            await League.addMember(league.league_id, userId);
            
            res.json({ message: `¡Te has unido a "${league.name}"!` });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al unirse a la liga.' });
        }
    },

    // 3. VER MIS LIGAS
    getMyLeagues: async (req, res) => {
        const userId = req.user.userId;
        try {
            const leagues = await League.getMyLeagues(userId);
            res.json(leagues);
        } catch (error) {
            res.status(500).json({ error: 'Error al cargar ligas.' });
        }
    },

    // 4. VER DETALLES Y RANKING DE UNA LIGA
    getLeagueDetails: async (req, res) => {
        const userId = req.user.userId;
        const { id } = req.params;

        try {
            // Verificar si el usuario es miembro para dejarle ver
            const isMember = await League.isMember(id, userId);
            if (!isMember) return res.status(403).json({ error: 'No perteneces a esta liga.' });

            // Obtener ranking
            const ranking = await League.getLeagueRanking(id);
            
            // Opcional: Podrías obtener también info básica de la liga (nombre, código) aquí
            // Por ahora devolvemos solo el ranking
            res.json(ranking);

        } catch (error) {
            res.status(500).json({ error: 'Error al cargar la liga.' });
        }
    }
};

module.exports = leagueController;