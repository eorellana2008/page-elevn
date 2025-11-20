const API_BASE = '/api';

// Helper interno para manejar tokens y errores
async function fetchWithAuth(endpoint, options = {}) {
    const token = sessionStorage.getItem('userToken');
    
    // Si no es login/register, inyectamos el token
    if (token) {
        options.headers = { 
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (response.status === 401 || response.status === 403) {
        sessionStorage.clear();
        window.location.href = '/index.html';
        return null;
    }
    return response;
}

const api = {
    // --- AUTH ---
    login: async (creds) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds)
        });
        return res.json();
    },
    register: async (data) => {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        return res.json();
    },
    
    // --- LOCATION ---
    getMunicipalities: async () => {
        const res = await fetch(`${API_BASE}/location/municipalities`);
        return res.json();
    },

    // --- USERS & PROFILE ---
    getProfile: async () => {
        const res = await fetchWithAuth('/users/profile');
        return res ? res.json() : null;
    },
    updateProfile: async (data) => {
        const res = await fetchWithAuth('/users/profile/edit', { method: 'PUT', body: JSON.stringify(data) });
        return res ? res.json() : { error: 'Error de conexión' };
    },
    changePassword: async (data) => {
        const res = await fetchWithAuth('/users/profile/password', { method: 'PUT', body: JSON.stringify(data) });
        return res ? res.json() : { error: 'Error' };
    },
    getLeaderboard: async () => {
        const res = await fetchWithAuth('/users/leaderboard');
        return res ? res.json() : [];
    },

    // --- MATCHES & PREDICTIONS ---
    getMatches: async () => {
        const res = await fetchWithAuth('/matches');
        return res ? res.json() : [];
    },
    getMyPredictions: async () => {
        const res = await fetchWithAuth('/predictions/my');
        return res ? res.json() : [];
    },
    savePrediction: async (data) => {
        const res = await fetchWithAuth('/predictions', { method: 'POST', body: JSON.stringify(data) });
        return res ? res.json() : { error: 'Error' };
    },
    getPointsHistory: async () => {
        const res = await fetchWithAuth('/predictions/history');
        return res ? res.json() : [];
    },

    // --- SUPPORT / REQUESTS ---
    createRequest: async (data) => {
        const res = await fetchWithAuth('/requests', { method: 'POST', body: JSON.stringify(data) });
        return res ? res.json() : { error: 'Error' };
    },
    getMyResolvedRequests: async () => {
        const res = await fetchWithAuth('/requests/myresolved');
        return res ? res.json() : [];
    },

    // --- ADMIN (Solo Staff) ---
    getUsers: async () => {
        const res = await fetchWithAuth('/users');
        return res ? res.json() : [];
    },
    createMatch: async (data) => {
        const res = await fetchWithAuth('/matches', { method: 'POST', body: JSON.stringify(data) });
        return res ? res.json() : {};
    },
    deleteMatch: async (id) => {
        const res = await fetchWithAuth(`/matches/${id}`, { method: 'DELETE' });
        return res ? res.json() : {};
    }
};