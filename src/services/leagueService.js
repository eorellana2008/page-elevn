const League = require('../models/League');

const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
};

const leagueService = {
    create: async (userId, name) => {
        const code = generateCode();
        const leagueId = await League.create(name, code, userId);
        await League.addMember(leagueId, userId);
        return { leagueId, code };
    },

    join: async (userId, code) => {
        const league = await League.findByCode(code.toUpperCase());
        if (!league) throw new Error('Código inválido.');
        
        const isMember = await League.isMember(league.league_id, userId);
        if (isMember) throw new Error('Ya estás en esta liga.');

        await League.addMember(league.league_id, userId);
        return league.name;
    },

    addMatch: async (userId, leagueId, matchId) => {
        const league = await League.getAdmin(leagueId);
        if (!league) throw new Error('Liga no encontrada');
        if (league.admin_id !== userId) throw new Error('Solo el admin puede gestionar.');
        return await League.addMatchToLeague(leagueId, matchId);
    },

    removeMatch: async (userId, leagueId, matchId) => {
        const league = await League.getAdmin(leagueId);
        if (!league) throw new Error('Liga no encontrada');
        if (league.admin_id !== userId) throw new Error('Solo el admin puede gestionar.');
        return await League.removeMatchFromLeague(leagueId, matchId);
    }
};

module.exports = leagueService;