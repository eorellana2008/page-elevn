/* CONTROLADOR: LIGAS (V8 - ICONOS MINIMALISTAS) */
import { api } from '../services/api.js';
import { toggleModal } from '../utils/dom.js';
import { LeagueCard } from '../components/LeagueCard.js';

let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!sessionStorage.getItem('userToken')) return window.location.href = '/index.html';
    const profile = await api.getProfile();
    if (profile) currentUserId = profile.user_id;
    cargarLigas();
    setupFormListeners();
});

async function cargarLigas() {
    const container = document.getElementById('leaguesContainer');
    container.innerHTML = '<p style="text-align:center; color:#888;">Cargando ligas...</p>';
    try {
        const leagues = await api.getMyLeagues();
        if (!leagues || leagues.length === 0) {
            container.innerHTML = '<p style="text-align:center; margin-top:20px;">No te has unido a ninguna liga.</p>';
            return;
        }
        container.innerHTML = leagues.map(l => LeagueCard(l, currentUserId)).join('');
    } catch (e) { container.innerHTML = '<p style="text-align:center; color:red;">Error al cargar datos.</p>'; }
}

function setupFormListeners() {
    document.getElementById('formCreate')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.createLeague({ name: document.getElementById('league_name').value });
        if (res.message) { toggleModal('modalCreate', false); cargarLigas(); } else alert(res.error);
    });
    document.getElementById('formJoin')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.joinLeague({ code: document.getElementById('league_code').value });
        if (res.message) { toggleModal('modalJoin', false); cargarLigas(); } else alert(res.error);
    });
}

const controller = {
    openCreate: () => toggleModal('modalCreate', true),
    openJoin: () => toggleModal('modalJoin', true),
    deleteLeague: async (id) => { if (confirm('¿Eliminar liga permanentemente?')) { await api.deleteLeague(id); cargarLigas(); } },
    leaveLeague: async (id) => { if (confirm('¿Salir de la liga?')) { await api.leaveLeague(id); cargarLigas(); } },

    // RANKING LIGA (Actualizado)
    showRanking: async (lid, name) => {
        document.getElementById('leagueTitleRanking').innerText = name;
        toggleModal('modalRanking', true);
        const tbody = document.getElementById('rankingBody');
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';

        try {
            const data = await api.getLeagueDetails(lid);
            if (!data.length) tbody.innerHTML = '<tr><td colspan="3" class="text-center">Sin datos.</td></tr>';
            else {
                tbody.innerHTML = data.map((u, index) => {
                    let iconHtml = `<span style="font-weight:bold; color:var(--text-muted); font-size:0.9em;">#${index + 1}</span>`;
                    let rowStyle = '';
                    let nameColor = 'var(--text-main)';

                    if (index === 0) {
                        iconHtml = `<i class="ri-trophy-fill" style="color: #FFD700; font-size: 1.3em;"></i>`;
                        rowStyle = 'background:rgba(255, 215, 0, 0.08); border-left: 3px solid #FFD700;';
                        nameColor = '#FFD700';
                    }
                    else if (index === 1) { iconHtml = `<i class="ri-trophy-fill" style="color: #C0C0C0; font-size: 1.1em;"></i>`; }
                    else if (index === 2) { iconHtml = `<i class="ri-trophy-fill" style="color: #CD7F32; font-size: 1.1em;"></i>`; }

                    return `
                    <tr style="border-bottom:1px solid var(--border); ${rowStyle}">
                        <td style="padding:12px; text-align:center; width:50px;">${iconHtml}</td>
                        <td style="padding:12px; font-weight:600; color:${nameColor};">${u.username}</td>
                        <td style="padding:12px; text-align:right; color:var(--accent); font-weight:bold;">${u.total_points}</td>
                    </tr>`;
                }).join('');
            }
        } catch (e) { tbody.innerHTML = '<tr><td colspan="3">Error</td></tr>'; }
    },

    openManage: async (id, name) => {
        document.getElementById('manageTitle').innerText = name;
        toggleModal('modalManageMatches', true);
        const container = document.getElementById('manageMatchesContainer');
        container.innerHTML = 'Cargando...';
        try {
            const [active, available] = await Promise.all([
                api.getLeagueMatches(id),
                api.getAvailableMatches(id)
            ]);
            let html = `<h4 style="border-bottom:1px solid #333; margin-bottom:10px; color:var(--success)">ACTIVOS (${active.length})</h4>`;
            active.forEach(m => {
                html += `<div class="match-item-active" style="display:flex; justify-content:space-between; padding:10px; background:rgba(79,209,197,0.05); margin-bottom:5px; border-radius:5px;">
                    <span style="font-size:0.9em;">${m.team_home} vs ${m.team_away}</span>
                    <button onclick="window.controllers.leagues.removeMatch(${id}, ${m.match_id})" class="btn-icon-small delete"><i class="ri-close-circle-line"></i></button>
                </div>`;
            });
            html += `<h4 style="border-bottom:1px solid #333; margin:15px 0 10px 0;">DISPONIBLES</h4>`;
            available.forEach(m => {
                html += `<div class="match-item-available" style="display:flex; justify-content:space-between; padding:10px; background:var(--bg-input); margin-bottom:5px; border-radius:5px;">
                    <span style="font-size:0.9em;">${m.team_home} vs ${m.team_away}</span>
                    <button onclick="window.controllers.leagues.addMatch(${id}, ${m.match_id})" class="btn-icon-small edit"><i class="ri-add-circle-line"></i></button>
                </div>`;
            });
            container.innerHTML = html;
        } catch (e) { container.innerHTML = 'Error'; }
    },
    addMatch: async (lid, mid) => { await api.addMatchToLeague(lid, mid); controller.openManage(lid, document.getElementById('manageTitle').innerText); },
    removeMatch: async (lid, mid) => { await api.removeMatchFromLeague(lid, mid); controller.openManage(lid, document.getElementById('manageTitle').innerText); }
};

window.controllers = window.controllers || {};
window.controllers.leagues = controller;
window.toggleModal = toggleModal;