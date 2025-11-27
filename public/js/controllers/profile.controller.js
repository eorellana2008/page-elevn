/* CONTROLADOR: PERFIL USUARIO */
import { api } from '../services/api.js';
import { initSession } from '../utils/session.js';
import { toggleModal, formatDateShort, navigateTo, getAvatarColor } from '../utils/dom.js';

const avatarMap = { 'default': 'ri-user-3-line', 'ball': 'ri-football-line', 'robot': 'ri-robot-line', 'alien': 'ri-aliens-line', 'trophy': 'ri-cup-line', 'star': 'ri-star-line', 'fire': 'ri-fire-line', 'flash': 'ri-flashlight-line', 'shield': 'ri-shield-line', 'ghost': 'ri-ghost-line', 'rocket': 'ri-rocket-line', 'crown': 'ri-vip-crown-fill' };

let currentUser = {};

document.addEventListener('DOMContentLoaded', async () => {
    initSession();

    // ACTIVAR EL OJITO DE LAS CONTRASEÑAS
    setupToggle('current_pass', 'toggleCurrentPass');
    setupToggle('new_pass', 'toggleNewPass');

    try {
        const user = await api.getProfile();
        if (!user) throw new Error('Usuario no encontrado');
        currentUser = user;
        renderProfileV8(user);
        loadTabContent('history');
    } catch (e) {
        console.error(e);
        sessionStorage.clear(); window.location.href = '/index.html';
    }

    setupForms();
});

// --- FUNCIÓN PARA EL OJITO ---
function setupToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (input && toggle) {
        toggle.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            // Cambiar icono
            toggle.innerHTML = type === 'password' ? '<i class="ri-eye-line"></i>' : '<i class="ri-eye-off-line"></i>';
        });
    }
}

function renderProfileV8(user) {
    // ... (Header y Avatar igual que antes) ...
    document.getElementById('profileName').textContent = user.username;
    document.getElementById('profileRole').textContent = user.role === 'user' ? 'Miembro' : user.role;
    const icon = avatarMap[user.avatar] || 'ri-user-3-line';
    document.getElementById('profileAvatar').innerHTML = `<i class="${icon}"></i>`;
    const locInfo = user.country_name ? `${user.country_name}, ${user.country_code}` : 'Sin ubicación';
    document.getElementById('profileLocationInfo').innerHTML = `<i class="ri-map-pin-user-line"></i> <span>${locInfo}</span>`;

    // Puntos
    document.getElementById('profilePoints').textContent = user.total_points;

    // Stats y Ranking
    if (user.stats) {
        document.getElementById('profileEfficiency').textContent = user.stats.efficiency + '%';

        // CORRECCIÓN RANKING: Buscamos el contenedor específico
        // Buscamos la caja que tiene el icono de medalla
        const rankingBox = document.querySelector('.stat-box i.ri-medal-line').parentElement;
        if (rankingBox) {
            const rankNum = rankingBox.querySelector('.stat-num');
            if (rankNum) {
                // Si rank viene del backend, úsalo. Si no, muestra '-'
                rankNum.textContent = user.stats.rank || '-';
                // Opcional: Si es Top 3, darle color
                if (user.stats.rank === '#1') rankNum.style.color = '#FFD700';
            }
        }
    }

    // ... (Admin Links y Widget Próximo Partido igual) ...
    if (['admin', 'superadmin', 'moderator'].includes(user.role)) {
        document.querySelectorAll('.admin-link').forEach(el => el.classList.remove('hidden'));
    }
    const nextMatchCard = document.getElementById('nextMatchCardWidget');
    if (user.nextMatch && nextMatchCard) {
        document.getElementById('nextMatchInfoWidget').innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="color:${getAvatarColor(user.nextMatch.team_home)}">${user.nextMatch.team_home}</span>
                <small>vs</small>
                <span style="color:${getAvatarColor(user.nextMatch.team_away)}">${user.nextMatch.team_away}</span>
            </div>`;
        document.getElementById('nextMatchTimeWidget').textContent = formatDateShort(user.nextMatch.match_date);
        nextMatchCard.style.cursor = 'pointer';
        nextMatchCard.onclick = () => window.location.href = '/results.html';
    } else if (nextMatchCard) {
        document.getElementById('nextMatchInfoWidget').textContent = "Sin partidos pendientes";
    }
}

window.switchProfileTab = async (tabName) => {
    document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[onclick*="${tabName}"]`).classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    loadTabContent(tabName);
};

async function loadTabContent(tabName) {
    const container = document.getElementById(`tab-${tabName}`);
    if (container.dataset.loaded) return;
    container.innerHTML = '<div class="text-center" style="padding:20px; opacity:0.6;"><i class="ri-loader-4-line ri-spin" style="font-size:2em;"></i></div>';

    try {
        if (tabName === 'history') {
            const data = await api.getMyResolvedRequests();
            if (data.length > 0) {
                container.innerHTML = `<div style="display:flex; flex-direction:column; gap:10px;">${data.map(item => `
                    <div style="background:var(--bg-input); padding:15px; border-radius:10px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:${item.type === 'reclamo' ? 'var(--danger)' : 'var(--accent)'}; text-transform:uppercase;">${item.type}</strong>
                             <p style="margin:5px 0; font-size:0.9em;">"${item.message}"</p>
                             <small style="color:var(--text-muted);">${formatDateShort(item.created_at)}</small>
                        </div>
                        ${item.admin_response ? '<span style="color:var(--success); font-size:1.2em;"><i class="ri-check-double-line"></i></span>' : ''}
                    </div>`).join('')}</div>`;
            } else {
                container.innerHTML = '<div class="empty-state-pane"><i class="ri-file-list-3-line"></i><p>Sin actividad reciente.</p></div>';
            }
        } else if (tabName === 'leagues') {
            const data = await api.getMyLeagues();
            if (data.length > 0) {
                container.innerHTML = data.map(l => `
                    <div class="league-card" style="margin-bottom:10px; cursor:pointer;" onclick="window.location.href='/leagues.html'">
                        <div class="league-info"><h3><i class="ri-shield-star-line" style="color:var(--warning)"></i> ${l.name}</h3><div class="league-members"><i class="ri-group-line"></i> ${l.members_count} miembros</div></div>
                        <div class="league-code" style="font-size:1em;">Ir <i class="ri-arrow-right-s-line"></i></div>
                    </div>`).join('');
            } else {
                container.innerHTML = '<div class="empty-state-pane"><i class="ri-trophy-line"></i><p>No te has unido a ligas.</p><button class="nav-btn mt-20" onclick="window.location.href=\'/leagues.html\'" style="width:auto; margin: 20px auto;">Explorar</button></div>';
            }
        }
        container.dataset.loaded = true;
    } catch (e) { container.innerHTML = '<p class="text-center error">Error.</p>'; }
}

function setupForms() {
    document.getElementById('formEditProfile')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            username: document.getElementById('my_username').value,
            email: document.getElementById('my_email').value,
            country_id: document.getElementById('my_country').value,
            avatar: document.querySelector('input[name="avatar"]:checked')?.value || 'default'
        };
        const res = await api.updateProfile(data);
        if (res.message) location.reload(); else alert(res.error);
    });

    document.getElementById('formChangePass')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.changePassword({ currentPassword: document.getElementById('current_pass').value, newPassword: document.getElementById('new_pass').value });
        if (res.message) { alert('Contraseña cambiada'); toggleModal('modalChangePass', false); } else alert(res.error);
    });

    document.getElementById('formSupport')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await api.createRequest({ type: document.getElementById('support_type').value, message: document.getElementById('support_msg').value });
        if (res.message) { alert('Enviado'); toggleModal('modalSupport', false); } else alert(res.error);
    });
}

window.controllers = window.controllers || {};
window.controllers.profile = {
    openEdit: async () => {
        document.getElementById('my_username').value = currentUser.username;
        document.getElementById('my_email').value = currentUser.email;
        const sel = document.getElementById('my_country');
        if (sel.options.length <= 1) { const c = await api.getCountries(); sel.innerHTML = '<option value="">Selecciona...</option>' + c.map(x => `<option value="${x.country_id}">${x.name}</option>`).join(''); }
        sel.value = currentUser.country_id;
        const radio = document.querySelector(`input[name="avatar"][value="${currentUser.avatar || 'default'}"]`);
        if (radio) radio.checked = true;
        toggleModal('modalEditProfile', true);
    }
};
window.toggleModal = toggleModal;