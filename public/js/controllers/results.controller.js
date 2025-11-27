/* CONTROLADOR: RESULTADOS (V8 FINAL - CORREGIDO) */
import { api } from '../services/api.js';
import { MatchCard } from '../components/MatchCard.js';
import { toggleModal, navigateTo } from '../utils/dom.js';
import { initSession } from '../utils/session.js'; // <--- ESTO FALTABA

let state = { context: 'global', id: null, leagues: [], competitions: [] };
const TRANSITION_DELAY = 1000;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. INICIALIZAR SESIÓN (Esto activa los botones de logout)
    initSession();

    // Verificación de seguridad extra (por si acaso)
    if (!sessionStorage.getItem('userToken')) return window.location.href = '/index.html';

    const role = sessionStorage.getItem('userRole');
    if (['admin', 'superadmin', 'moderator'].includes(role)) {
        document.querySelectorAll('.admin-link').forEach(el => el.classList.remove('hidden'));
    }

    await cargarFiltros();
    renderTabs();
    cargarQuiniela();
    loadMiniLeaderboard();
});

async function cargarFiltros() {
    try {
        const [comps, leagues] = await Promise.all([api.getCompetitions(), api.getMyLeagues()]);
        state.competitions = comps || [];
        state.leagues = leagues || [];
    } catch (e) { console.error(e); }
}

function renderTabs() {
    const container = document.getElementById('tabsContainer');
    if (!container) return;

    let html = `<button class="filter-chip ${state.context === 'global' ? 'active' : ''}" onclick="window.controllers.results.switchContext('global', null)"><i class="ri-earth-line"></i> Global</button>`;

    const publicComps = state.competitions.filter(c => c.competition_id !== 1);
    if (publicComps.length > 0) {
        html += `<div class="tab-separator-label">Torneos</div>`;
        publicComps.forEach(c => {
            html += `<button class="filter-chip ${state.context === 'competition' && state.id === c.competition_id ? 'active' : ''}" onclick="window.controllers.results.switchContext('competition', ${c.competition_id})"><i class="ri-cup-line"></i> ${c.name}</button>`;
        });
    }
    if (state.leagues.length > 0) {
        html += `<div class="tab-separator-label">Privadas</div>`;
        state.leagues.forEach(l => {
            html += `<button class="filter-chip ${state.context === 'league' && state.id === l.league_id ? 'active' : ''}" onclick="window.controllers.results.switchContext('league', ${l.league_id})"><i class="ri-lock-2-line"></i> ${l.name}</button>`;
        });
    }
    container.innerHTML = html;
}

const controller = {
    switchContext: (type, id) => {
        state.context = type;
        state.id = id;
        renderTabs();

        const container = document.getElementById('matchesContainer');
        const rankingContainer = document.getElementById('miniLeaderboard');

        container.classList.add('fade-content', 'fading-out');
        if (rankingContainer) rankingContainer.classList.add('fade-content', 'fading-out');

        setTimeout(async () => {
            await Promise.all([cargarQuiniela(), loadMiniLeaderboard()]);
            container.classList.remove('fading-out');
            if (rankingContainer) rankingContainer.classList.remove('fading-out');
        }, TRANSITION_DELAY);
    },

    savePrediction: async (matchId) => {
        const ph = document.getElementById(`ph_${matchId}`).value;
        const pa = document.getElementById(`pa_${matchId}`).value;
        if (ph === '' || pa === '') return alert('Faltan datos');
        const btn = document.querySelector(`button[onclick*="${matchId}"]`);
        const originalText = btn ? btn.innerText : 'Guardar';
        if (btn) { btn.innerText = '...'; btn.disabled = true; }
        let res;
        const data = { match_id: matchId, pred_home: ph, pred_away: pa };
        if (state.context === 'league') res = await api.saveLeaguePrediction(state.id, data);
        else res = await api.savePrediction(data);
        if (btn) {
            btn.disabled = false;
            if (res.message) {
                btn.innerText = '¡Listo!'; btn.style.background = '#00FFC0'; btn.style.color = '#000';
                setTimeout(() => { btn.innerText = originalText; btn.style = ''; }, 2000);
            } else { alert(res.error); btn.innerText = originalText; }
        }
    },
    openRanking: () => { toggleModal('modalRanking', true); cargarRanking(); }
};

async function cargarQuiniela() {
    const container = document.getElementById('matchesContainer');
    const rankingTitle = document.getElementById('miniRankTitle');

    try {
        let matches = [], predictions = [];
        if (state.context === 'league') {
            [matches, predictions] = await Promise.all([api.getLeagueMatches(state.id), api.getLeagueMyPredictions(state.id)]);
            if (rankingTitle) rankingTitle.innerHTML = '<i class="ri-trophy-line accent-icon"></i> Top Liga';
        } else {
            const compId = state.context === 'competition' ? state.id : null;
            [matches, predictions] = await Promise.all([api.getMatches(compId), api.getMyPredictions()]);
            if (rankingTitle) rankingTitle.innerHTML = state.context === 'competition' ? '<i class="ri-cup-line accent-icon"></i> Top Torneo' : '<i class="ri-vip-crown-fill accent-icon"></i> Top Global';
        }

        if (!matches || matches.length === 0) {
            container.innerHTML = `<div class="text-center" style="padding:40px; opacity:0.7; width:100%;"><i class="ri-ghost-line" style="font-size:3em;"></i><p>No hay partidos disponibles.</p></div>`;
        } else {
            const labelBtn = state.context === 'league' ? 'Liga' : 'Global';
            container.innerHTML = matches.map(match => {
                const pred = predictions.find(p => p.match_id === match.match_id);
                return MatchCard(match, pred, labelBtn);
            }).join('');
        }
    } catch (e) { container.innerHTML = '<p class="text-center error">Error de conexión.</p>'; }
}

async function loadMiniLeaderboard() {
    const container = document.getElementById('miniLeaderboard');
    if (!container) return;
    try {
        let data = [];
        if (state.context === 'league') data = await api.getLeagueDetails(state.id);
        else data = await api.getLeaderboard(state.id);

        if (data.length === 0) container.innerHTML = '<p class="text-muted text-center text-sm">Sin datos.</p>';
        else {
            const top5 = data.slice(0, 5);
            container.innerHTML = top5.map((u, i) => {
                let color = 'var(--text-muted)';
                if (i === 0) color = '#FFD700'; if (i === 1) color = '#C0C0C0'; if (i === 2) color = '#CD7F32';
                return `<div class="mini-rank-item"><span class="mini-rank-pos" style="color:${color}">#${i + 1}</span><span class="mini-rank-name">${u.username}</span><span class="mini-rank-pts">${u.total_points} pts</span></div>`;
            }).join('');
        }
    } catch (e) { container.innerHTML = '<p class="text-muted text-center">-</p>'; }
}

async function cargarRanking() {
    const tbody = document.getElementById('rankingBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Calculando...</td></tr>';
    try {
        let data = [];
        const titleEl = document.querySelector('#modalRanking h2');
        if (state.context === 'league') {
            const liga = state.leagues.find(l => l.league_id === state.id);
            titleEl.innerHTML = `<i class="ri-trophy-line"></i> ${liga ? liga.name : 'Tabla'}`;
            data = await api.getLeagueDetails(state.id);
        } else {
            titleEl.innerHTML = `<i class="ri-earth-line"></i> Ranking Global`;
            data = await api.getLeaderboard(state.id);
        }

        if (data.length === 0) tbody.innerHTML = '<tr><td colspan="3" class="text-center">Vacío</td></tr>';
        else {
            tbody.innerHTML = data.map((u, i) => {
                let iconHtml = `<span style="font-weight:bold; color:var(--text-muted); font-size:0.9em;">#${i + 1}</span>`;
                let rowStyle = '';
                if (i === 0) { iconHtml = `<i class="ri-trophy-fill" style="color: #FFD700; font-size: 1.3em;"></i>`; rowStyle = 'background:rgba(255, 215, 0, 0.08); border-left: 3px solid #FFD700;'; }
                else if (i === 1) { iconHtml = `<i class="ri-trophy-fill" style="color: #C0C0C0; font-size: 1.1em;"></i>`; }
                else if (i === 2) { iconHtml = `<i class="ri-trophy-fill" style="color: #CD7F32; font-size: 1.1em;"></i>`; }
                return `<tr style="${rowStyle}"><td style="text-align:center; width:50px;">${iconHtml}</td><td>${u.username}</td><td class="text-right"><b>${u.total_points}</b></td></tr>`;
            }).join('');
        }
    } catch (e) { tbody.innerHTML = '<tr><td colspan="3">Error</td></tr>'; }
}

window.controllers = window.controllers || {};
window.controllers.results = controller;
window.toggleModal = toggleModal;