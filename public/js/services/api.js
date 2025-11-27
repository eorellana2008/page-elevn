const API_BASE = '/api';

// Función interna para manejar el token y el logout automático
async function fetchWithAuth(endpoint, options = {}) {
    const token = sessionStorage.getItem('userToken');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);

        // Manejo de sesión expirada
        if (response.status === 401 || response.status === 403) {
            const data = await response.clone().json().catch(() => ({}));
            if (data.error && (data.error.includes('Token') || data.error.includes('Acceso') || data.error.includes('jwt'))) {
                console.warn('Sesión expirada o inválida');
                sessionStorage.clear();
                window.location.href = '/index.html';
                return null;
            }
        }
        return response;
    } catch (error) {
        console.error('Error de red:', error);
        throw error;
    }
}

export const api = {
    // ==========================================
    // 1. AUTENTICACIÓN Y UTILS
    // ==========================================
    login: async (creds) => (await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) })).json(),
    register: async (data) => (await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
    forgotPassword: async (data) => (await fetch(`${API_BASE}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
    resetPassword: async (data) => (await fetch(`${API_BASE}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),

    getCountries: async () => {
        const res = await fetch(`${API_BASE}/countries`);
        return res.json();
    },

    // ==========================================
    // 2. PERFIL DE USUARIO
    // ==========================================
    getProfile: async () => { const res = await fetchWithAuth('/users/profile'); return res ? res.json() : null; },
    updateProfile: async (data) => { const res = await fetchWithAuth('/users/profile/edit', { method: 'PUT', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    changePassword: async (data) => { const res = await fetchWithAuth('/users/profile/password', { method: 'PUT', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },

    // ACTUALIZADO: Soporta compId para filtrar ranking
    getLeaderboard: async (compId = null) => {
        let url = '/users/leaderboard';
        if (compId) url += `?competition=${compId}`;
        const res = await fetchWithAuth(url);
        return res ? res.json() : [];
    },

    // Historial y Soporte
    createRequest: async (data) => { const res = await fetchWithAuth('/requests', { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    getMyResolvedRequests: async () => { const res = await fetchWithAuth('/requests/myresolved'); return res ? res.json() : []; },
    getPointsHistory: async () => { const res = await fetchWithAuth('/predictions/history'); return res ? res.json() : []; },

    // ==========================================
    // 3. ADMIN PANEL
    // ==========================================
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

    // ==========================================
    // 4. LIGAS PRIVADAS
    // ==========================================
    getMyLeagues: async () => { const res = await fetchWithAuth('/leagues/my'); return res ? res.json() : []; },
    createLeague: async (data) => { const res = await fetchWithAuth('/leagues/create', { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    joinLeague: async (data) => { const res = await fetchWithAuth('/leagues/join', { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    leaveLeague: async (id) => { const res = await fetchWithAuth(`/leagues/${id}/leave`, { method: 'DELETE' }); return res ? res.json() : { error: 'Error' }; },
    deleteLeague: async (id) => { const res = await fetchWithAuth(`/leagues/${id}`, { method: 'DELETE' }); return res ? res.json() : { error: 'Error' }; },
    getLeagueDetails: async (id) => { const res = await fetchWithAuth(`/leagues/${id}`); return res ? res.json() : []; },

    getLeagueMatches: async (id) => { const res = await fetchWithAuth(`/leagues/${id}/matches`); return res ? res.json() : []; },
    getAvailableMatches: async (id) => { const res = await fetchWithAuth(`/leagues/${id}/available`); return res ? res.json() : []; },
    addMatchToLeague: async (lid, mid) => { const res = await fetchWithAuth(`/leagues/${lid}/add-match`, { method: 'POST', body: JSON.stringify({ match_id: mid }) }); return res ? res.json() : { error: 'Error' }; },
    removeMatchFromLeague: async (lid, mid) => { const res = await fetchWithAuth(`/leagues/${lid}/remove-match`, { method: 'POST', body: JSON.stringify({ match_id: mid }) }); return res ? res.json() : { error: 'Error' }; },

    // ==========================================
    // 5. QUINIELA
    // ==========================================
    getCompetitions: async () => { const res = await fetchWithAuth('/competitions'); return res ? res.json() : []; },
    getMatches: async (compId = null) => {
        let url = '/matches';
        if (compId) url += `?competition=${compId}`;
        const res = await fetchWithAuth(url);
        return res ? res.json() : [];
    },
    getMyPredictions: async () => { const res = await fetchWithAuth('/predictions/my'); return res ? res.json() : []; },
    getLeagueMyPredictions: async (lid) => { const res = await fetchWithAuth(`/leagues/${lid}/predictions`); return res ? res.json() : []; },
    savePrediction: async (data) => { const res = await fetchWithAuth('/predictions', { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
    saveLeaguePrediction: async (lid, data) => { const res = await fetchWithAuth(`/leagues/${lid}/predict`, { method: 'POST', body: JSON.stringify(data) }); return res ? res.json() : { error: 'Error' }; },
};