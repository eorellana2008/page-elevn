const API_BASE = '/api';

async function fetchWithAuth(endpoint, options = {}) {
    const token = sessionStorage.getItem('userToken');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    if (response.status === 401 || response.status === 403) {
        const data = await response.clone().json().catch(() => ({}));
        if (data.error && (data.error.includes('Token') || data.error.includes('Acceso'))) {
            sessionStorage.clear();
            window.location.href = '/index.html';
            return null;
        }
    }
    return response;
}

const api = {
    // --- AUTH ---
    login: async (creds) => {
        const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) });
        return res.json();
    },
    register: async (data) => {
        const res = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.json();
    },
    forgotPassword: async (data) => {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.json();
    },
    resetPassword: async (data) => {
        const res = await fetch(`${API_BASE}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.json();
    },

    // --- UTILS ---
    getCountries: async () => { const res = await fetch(`${API_BASE}/countries`); return res.json(); },

    // --- PROFILE ---
    getProfile: async () => { const res = await fetchWithAuth('/users/profile'); return res ? res.json() : null; },
    updateProfile: async (data) => { const res = await fetchWithAuth('/users/profile/edit', { method: 'PUT', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    changePassword: async (data) => { const res = await fetchWithAuth('/users/profile/password', { method: 'PUT', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    getLeaderboard: async () => { const res = await fetchWithAuth('/users/leaderboard'); return res ? res.json() : []; },

    // --- GLOBAL MATCHES & PREDICTIONS ---
    getMatches: async (competitionId = null) => {
        let url = '/matches';
        if (competitionId) url += `?competition=${competitionId}`;
        const res = await fetchWithAuth(url);
        return res ? res.json() : [];
    },
    getMyPredictions: async () => { const res = await fetchWithAuth('/predictions/my'); return res ? res.json() : []; },
    savePrediction: async (data) => { const res = await fetchWithAuth('/predictions', { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    getPointsHistory: async () => { const res = await fetchWithAuth('/predictions/history'); return res ? res.json() : []; },

    // --- LIGAS PRIVADAS (NUEVO) ---
    createLeague: async (data) => { const res = await fetchWithAuth('/leagues/create', { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    joinLeague: async (data) => { const res = await fetchWithAuth('/leagues/join', { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    getMyLeagues: async () => { const res = await fetchWithAuth('/leagues/my'); return res ? res.json() : []; },
    getLeagueDetails: async (id) => { const res = await fetchWithAuth(`/leagues/${id}`); return res ? res.json() : []; },
    leaveLeague: async (id) => { const res = await fetchWithAuth(`/leagues/${id}/leave`, { method: 'DELETE' }); return res ? res.json() : { error: 'Error' }; },
    deleteLeague: async (id) => { const res = await fetchWithAuth(`/leagues/${id}`, { method: 'DELETE' }); return res ? res.json() : { error: 'Error' }; },
    
    // Gestión de Partidos en Ligas
    getLeagueMatches: async (id) => { const res = await fetchWithAuth(`/leagues/${id}/matches`); return res ? res.json() : []; },
    getAvailableMatches: async (id) => { const res = await fetchWithAuth(`/leagues/${id}/available`); return res ? res.json() : []; },
    addMatchToLeague: async (leagueId, matchId) => { 
        const res = await fetchWithAuth(`/leagues/${leagueId}/add-match`, { method: 'POST', body: JSON.stringify({ match_id: matchId }) }); 
        return res ? res.json() : { error: 'Error' }; 
    },
    removeMatchFromLeague: async (leagueId, matchId) => { 
        const res = await fetchWithAuth(`/leagues/${leagueId}/remove-match`, { method: 'POST', body: JSON.stringify({ match_id: matchId }) }); 
        return res ? res.json() : { error: 'Error' }; 
    },

    // Predicciones Privadas
    getLeagueMyPredictions: async (leagueId) => { const res = await fetchWithAuth(`/leagues/${leagueId}/predictions`); return res ? res.json() : []; },
    saveLeaguePrediction: async (leagueId, data) => { 
        const res = await fetchWithAuth(`/leagues/${leagueId}/predict`, { method: 'POST', body: JSON.stringify(data) }); 
        return res ? res.json() : { error: 'Error' }; 
    },

    // --- SUPPORT ---
    createRequest: async (data) => { const res = await fetchWithAuth('/requests', { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    getMyResolvedRequests: async () => { const res = await fetchWithAuth('/requests/myresolved'); return res ? res.json() : []; },

    // --- ADMIN PANEL ---
    getUsers: async () => { const res = await fetchWithAuth('/users'); return res ? res.json() : []; },
    createUser: async (data) => { const res = await fetchWithAuth('/users', { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : {}; },
    updateUser: async (id, data) => { const res = await fetchWithAuth(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }); return res ? res.json() : {}; },
    deleteUser: async (id) => { const res = await fetchWithAuth(`/users/${id}`, { method: 'DELETE' }); return res ? res.json() : {}; },
    adminResetPassword: async (id, newPassword) => { const res = await fetchWithAuth(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }); return res ? res.json() : {}; },
    
    createMatch: async (data) => { const res = await fetchWithAuth('/matches', { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : {}; },
    updateMatch: async (id, data) => { const res = await fetchWithAuth(`/matches/${id}`, { method: 'PUT', body: JSON.stringify(data) }); return res ? res.json() : {}; },
    updateMatchScore: async (id, data) => { const res = await fetchWithAuth(`/matches/${id}/score`, { method: 'PUT', body: JSON.stringify(data) }); return res ? res.json() : {}; },
    deleteMatch: async (id) => { const res = await fetchWithAuth(`/matches/${id}`, { method: 'DELETE' }); return res ? res.json() : {}; },

    getAllRequests: async () => { const res = await fetchWithAuth('/requests'); return res ? res.json() : []; },
    respondRequest: async (id, responseMessage) => { const res = await fetchWithAuth(`/requests/${id}/respond`, { method: 'PUT', body: JSON.stringify({ responseMessage }) }); return res ? res.json() : {}; },
    
    getCompetitions: async () => { const res = await fetchWithAuth('/competitions'); return res ? res.json() : []; },
};