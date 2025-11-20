const API_BASE = '/api';

// Función helper privada para manejar errores de token
async function fetchWithAuth(url, options = {}) {
    const response = await fetch(url, options);
    
    if (response.status === 401 || response.status === 403) {
        // El token expiró o es inválido
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('userRole');
        window.location.href = '/index.html'; // Redirigir al login
        return null;
    }
    return response;
}

const api = {
    // Auth
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

    // Location
    getMunicipalities: async () => {
        const res = await fetch(`${API_BASE}/location/municipalities`);
        return res.json();
    },

    // Users
    getUsers: async (token) => {
        const res = await fetchWithAuth(`${API_BASE}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        return res ? res.json() : [];
    },

    // Matches
    getMatches: async (token) => {
        const res = await fetchWithAuth(`${API_BASE}/matches`, { headers: { 'Authorization': `Bearer ${token}` } });
        return res ? res.json() : [];
    },
    createMatch: async (data, token) => {
        const res = await fetchWithAuth(`${API_BASE}/matches`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data)
        });
        return res ? res.json() : {};
    },
    deleteMatch: async (id, token) => {
        const res = await fetchWithAuth(`${API_BASE}/matches/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        return res ? res.json() : {};
    }
    // ... Agrega aquí el resto de tus funciones (deleteUser, etc.) si las necesitas encapsuladas
};