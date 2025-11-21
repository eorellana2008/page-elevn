document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('userToken');

    // Variable Global para compartir datos con el otro archivo
    window.currentUserData = {};

    // Helper para mostrar/ocultar contraseña (visual)
    const setupToggle = (inputId, toggleId) => {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);
        if (input && toggle) {
            toggle.addEventListener('click', () => {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                toggle.innerHTML = type === 'password' ? '<i class="ri-eye-line"></i>' : '<i class="ri-eye-off-line"></i>';
            });
        }
    };
    setupToggle('current_pass', 'toggleCurrentPass');
    setupToggle('new_pass', 'toggleNewPass');

    // --- CARGA DE DATOS ---
    try {
        const user = await api.getProfile();
        window.currentUserData = user;

        // Llenar Textos Básicos
        document.getElementById('profileName').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileRole').textContent = user.role.toUpperCase();

        // --- CORRECCIÓN V5: Usar País  ---
        const locationText = user.country_name ? `${user.country_name} (${user.country_code})` : 'Sin ubicación';
        document.getElementById('profileLocation').textContent = locationText;

        document.getElementById('profilePoints').textContent = user.total_points;

        // Renderizar Avatar
        const avatarEl = document.getElementById('profileAvatar');
        const avatarMap = {
            'default': 'ri-user-3-line', 'ball': 'ri-football-line', 'robot': 'ri-robot-line',
            'alien': 'ri-aliens-line', 'trophy': 'ri-cup-line', 'star': 'ri-star-line',
            'fire': 'ri-fire-line', 'flash': 'ri-flashlight-line', 'shield': 'ri-shield-line',
            'ghost': 'ri-ghost-line', 'rocket': 'ri-rocket-line', 'crown': 'ri-vip-crown-fill'
        };
        const iconClass = avatarMap[user.avatar] || 'ri-user-3-line';
        avatarEl.innerHTML = `<i class="${iconClass}"></i>`;

        // Mostrar Botón Admin (si corresponde)
        const staffRoles = ['superadmin', 'admin', 'moderator'];
        if (staffRoles.includes(user.role)) {
            const btnAdmin = document.getElementById('btnAdminPanel');
            if (btnAdmin) btnAdmin.classList.remove('hidden');
        }

        // Renderizar Estadísticas
        if (user.stats) {
            const effEl = document.getElementById('profileEfficiency');
            effEl.textContent = `${user.stats.efficiency}%`;
            if (user.stats.efficiency >= 50) effEl.style.color = 'var(--success)';
        }

        // Renderizar Próximo Partido
        const nextMatchEl = document.getElementById('nextMatchInfo');
        const nextTimeEl = document.getElementById('nextMatchTime');
        const nextCard = document.getElementById('nextMatchCard');

        if (user.nextMatch) {
            const date = new Date(user.nextMatch.match_date);
            const timeStr = date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            nextMatchEl.innerHTML = `${user.nextMatch.team_home} <span style="color:var(--text-muted)">vs</span> ${user.nextMatch.team_away}`;
            nextTimeEl.textContent = timeStr;

            nextCard.style.cursor = 'pointer';
            nextCard.onclick = () => window.location.href = '/results.html';
        } else {
            nextMatchEl.textContent = "No hay partidos pendientes.";
            nextTimeEl.textContent = "";
        }

    } catch (error) {
        console.error(error);
        sessionStorage.clear();
        window.location.href = '/index.html';
    }
});