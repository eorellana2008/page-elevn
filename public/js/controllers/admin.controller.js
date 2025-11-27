/* CONTROLADOR: ADMIN PANEL
   --------------------------------------------------------------
   Maneja Usuarios, Partidos y Solicitudes.
   Controla permisos visuales (Moderador vs Admin).
*/
import { api } from '../services/api.js';
import { initSession } from '../utils/session.js';
import { toggleModal } from '../utils/dom.js';
import { UserRow, MatchRow, RequestRow } from '../components/AdminComponents.js';

let cache = { users: [], matches: [], requests: [], competitions: [] };

document.addEventListener('DOMContentLoaded', async () => {
    initSession();

    // Cargar competiciones al inicio (necesario para selects de partidos)
    try { cache.competitions = await api.getCompetitions(); } catch (e) { }

    const role = sessionStorage.getItem('userRole');
    if (role === 'moderator') {
        const btnUsers = document.getElementById('tab-btn-users');
        const btnReq = document.getElementById('tab-btn-requests');
        if (btnUsers) btnUsers.style.display = 'none';
        if (btnReq) btnReq.style.display = 'none';
        switchTab('matches');
    } else {
        switchTab('users');
    }

    setupAdminForms();
});

window.switchTab = async (tabName) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-btn-${tabName}`)?.classList.add('active');
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
    if (tabName === 'users') loadUsers();
    if (tabName === 'matches') loadMatches();
    if (tabName === 'requests') loadRequests();
};

async function loadUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
    const data = await api.getUsers();
    cache.users = data;
    tbody.innerHTML = data.length ? data.map(UserRow).join('') : '<tr><td colspan="6" class="text-center">No hay usuarios.</td></tr>';
}

async function loadMatches() {
    const tbody = document.querySelector('#matchesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
    const data = await api.getMatches();
    cache.matches = data;
    tbody.innerHTML = data.length ? data.map(MatchRow).join('') : '<tr><td colspan="6" class="text-center">No hay partidos.</td></tr>';
}

async function loadRequests() {
    const tbody = document.querySelector('#requestsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
    const data = await api.getAllRequests();
    cache.requests = data;
    tbody.innerHTML = data.length ? data.map(RequestRow).join('') : '<tr><td colspan="5" class="text-center" style="padding:20px;">Buzón vacío.</td></tr>';
}

function setupAdminForms() {
    // 1. Crear Usuario
    document.getElementById('formCrear')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.createUser({
            username: document.getElementById('new_username').value,
            email: document.getElementById('new_email').value,
            password: document.getElementById('new_password').value,
            role: document.getElementById('new_role').value,
            country_id: document.getElementById('new_country').value
        });
        if (res.message) { toggleModal('modalCrear', false); loadUsers(); } else alert(res.error);
    });

    // 2. Editar Usuario
    document.getElementById('formEditar')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.updateUser(document.getElementById('edit_id').value, {
            username: document.getElementById('edit_username').value,
            email: document.getElementById('edit_email').value,
            role: document.getElementById('edit_role').value
        });
        if (res.message) { toggleModal('modalEditar', false); loadUsers(); } else alert(res.error);
    });

    // 3. Reset Password (NUEVO FORMULARIO AGREGADO)
    document.getElementById('formReset')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.adminResetPassword(
            document.getElementById('reset_id').value,
            document.getElementById('reset_new_password').value
        );
        if (res.message) { alert('Contraseña restablecida'); toggleModal('modalReset', false); document.getElementById('reset_new_password').value = ''; }
        else alert(res.error);
    });

    // 4. Crear Partido
    document.getElementById('formMatch')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.createMatch({
            team_home: document.getElementById('team_home').value,
            team_away: document.getElementById('team_away').value,
            match_date: document.getElementById('match_date').value,
            competition_id: document.getElementById('match_competition').value,
            match_round: document.getElementById('match_round').value
        });
        if (res.message) { toggleModal('modalMatch', false); loadMatches(); } else alert(res.error);
    });

    // 5. Editar Partido (NUEVO)
    document.getElementById('formEditMatch')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.updateMatch(document.getElementById('edit_match_id').value, {
            team_home: document.getElementById('edit_team_home').value,
            team_away: document.getElementById('edit_team_away').value,
            match_date: document.getElementById('edit_match_date').value,
            competition_id: document.getElementById('edit_match_competition').value,
            match_round: document.getElementById('edit_match_round').value
        });
        if (res.message) { toggleModal('modalEditMatch', false); loadMatches(); } else alert(res.error);
    });

    // 6. Score
    document.getElementById('formScore')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.updateMatchScore(document.getElementById('score_id').value, {
            score_home: document.getElementById('score_home').value,
            score_away: document.getElementById('score_away').value
        });
        if (res.message) { toggleModal('modalScore', false); loadMatches(); } else alert(res.error);
    });

    // 7. Responder Solicitud
    document.getElementById('formResponse')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.respondRequest(document.getElementById('response_id').value, document.getElementById('response_msg').value);
        if (res.message) { alert('Enviado'); toggleModal('modalResponse', false); document.getElementById('response_msg').value = ''; loadRequests(); }
        else alert(res.error || 'Error');
    });
}

// LOGICA DE ROLES (Seguridad visual)
function fillRoleSelect(selectId, currentRole) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const myRole = sessionStorage.getItem('userRole');

    // Poder de roles: 100=SuperAdmin, 50=Admin, 20=Mod, 1=User
    const power = { 'superadmin': 100, 'admin': 50, 'moderator': 20, 'user': 1 };
    const myPower = power[myRole] || 0;

    // Opciones posibles
    const roles = [
        { val: 'user', txt: 'Usuario', p: 1 },
        { val: 'moderator', txt: 'Moderador', p: 20 },
        { val: 'admin', txt: 'Administrador', p: 50 },
        { val: 'superadmin', txt: 'Super Admin', p: 100 }
    ];

    select.innerHTML = '';
    roles.forEach(r => {
        // Solo muestro roles inferiores o iguales a mi poder
        if (r.p <= myPower) {
            const opt = document.createElement('option');
            opt.value = r.val;
            opt.innerText = r.txt;
            select.appendChild(opt);
        }
    });
    if (currentRole) select.value = currentRole;
}

// LOGICA DE COMPETICIONES (Llenar selects)
function fillCompSelect(selectId, currentVal) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Amistoso --</option>' +
        cache.competitions.map(c => `<option value="${c.competition_id}">${c.name}</option>`).join('');
    if (currentVal) sel.value = currentVal;
}

// MÉTODOS PÚBLICOS
window.controllers = window.controllers || {};
window.controllers.admin = {
    openCreateUser: async () => {
        toggleModal('modalCrear', true);
        fillRoleSelect('new_role');
        const sel = document.getElementById('new_country');
        if (sel.options.length <= 1) { const c = await api.getCountries(); sel.innerHTML = c.map(x => `<option value="${x.country_id}">${x.name}</option>`).join(''); }
    },
    openEditUser: (id) => {
        const u = cache.users.find(x => x.user_id === id);
        if (!u) return;
        document.getElementById('edit_id').value = id;
        document.getElementById('edit_username').value = u.username;
        document.getElementById('edit_email').value = u.email;
        fillRoleSelect('edit_role', u.role);
        toggleModal('modalEditar', true);
    },
    deleteUser: async (id) => { if (confirm('¿Borrar usuario?')) { await api.deleteUser(id); loadUsers(); } },
    openResetUser: (id) => {
        document.getElementById('reset_id').value = id;
        toggleModal('modalReset', true);
    },

    openCreateMatch: () => {
        toggleModal('modalMatch', true);
        fillCompSelect('match_competition');
    },
    openEditMatch: (id) => {
        const m = cache.matches.find(x => x.match_id === id);
        if (!m) return;
        document.getElementById('edit_match_id').value = id;
        document.getElementById('edit_team_home').value = m.team_home;
        document.getElementById('edit_team_away').value = m.team_away;
        // Ajuste fecha para input datetime-local (YYYY-MM-DDTHH:mm)
        const d = new Date(m.match_date);
        const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        document.getElementById('edit_match_date').value = iso;
        document.getElementById('edit_match_round').value = m.match_round || '';

        fillCompSelect('edit_match_competition', m.competition_id);
        toggleModal('modalEditMatch', true);
    },
    deleteMatch: async (id) => { if (confirm('¿Borrar partido?')) { await api.deleteMatch(id); loadMatches(); } },
    openScoreMatch: (id) => {
        document.getElementById('score_id').value = id;
        document.getElementById('score_home').value = '';
        document.getElementById('score_away').value = '';
        toggleModal('modalScore', true);
    },

    openReply: (id) => {
        const r = cache.requests.find(x => x.request_id === id);
        if (!r) return;
        document.getElementById('response_id').value = id;
        document.getElementById('requestMessage').innerText = `"${r.message}"`;
        document.getElementById('response_msg').value = '';
        toggleModal('modalResponse', true);
    }
};
window.toggleModal = toggleModal;