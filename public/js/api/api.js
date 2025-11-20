const API_BASE = '/api';

// Helper interno para manejar tokens y errores
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
        // Solo redirigir si es error de auth real, no errores de validación (400/409)
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
    forgotPassword: async (data) => {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        return res.json();
    },
    resetPassword: async (data) => {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        return res.json();
    },

    // --- LOCATION ---
    getMunicipalities: async () => {
        const res = await fetch(`${API_BASE}/location/municipalities`);
        return res.json();
    },

    // --- USERS & PROFILE (Público) ---
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

    // ==========================================
    // --- ADMIN PANEL (Solo Staff) ---
    // ==========================================

    // 1. Gestión de Usuarios
    getUsers: async () => {
        const res = await fetchWithAuth('/users');
        return res ? res.json() : [];
    },
    createUser: async (data) => {
        const res = await fetchWithAuth('/users', { method: 'POST', body: JSON.stringify(data) });
        return res ? res.json() : {};
    },
    updateUser: async (id, data) => {
        const res = await fetchWithAuth(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        return res ? res.json() : {};
    },
    deleteUser: async (id) => {
        const res = await fetchWithAuth(`/users/${id}`, { method: 'DELETE' });
        return res ? res.json() : {};
    },
    adminResetPassword: async (id, newPassword) => {
        const res = await fetchWithAuth(`/users/${id}/password`, {
            method: 'PUT', body: JSON.stringify({ newPassword })
        });
        return res ? res.json() : {};
    },

    // 2. Gestión de Partidos
    createMatch: async (data) => {
        const res = await fetchWithAuth('/matches', { method: 'POST', body: JSON.stringify(data) });
        return res ? res.json() : {};
    },
    updateMatch: async (id, data) => {
        const res = await fetchWithAuth(`/matches/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        return res ? res.json() : {};
    },
    updateMatchScore: async (id, data) => {
        const res = await fetchWithAuth(`/matches/${id}/score`, { method: 'PUT', body: JSON.stringify(data) });
        return res ? res.json() : {};
    },
    deleteMatch: async (id) => {
        const res = await fetchWithAuth(`/matches/${id}`, { method: 'DELETE' });
        return res ? res.json() : {};
    },

    // 3. Gestión de Soporte
    getAllRequests: async () => {
        const res = await fetchWithAuth('/requests');
        return res ? res.json() : [];
    },
    respondRequest: async (id, responseMessage) => {
        const res = await fetchWithAuth(`/requests/${id}/respond`, {
            method: 'PUT', body: JSON.stringify({ responseMessage })
        });
        return res ? res.json() : {};
    }
};  