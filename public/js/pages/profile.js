document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('userToken');

    // Variable para guardar los datos actuales del usuario (para el modal de edición)
    let currentUserData = {};

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

    // Configurar Toggles de Cambio de Contraseña
    setupToggle('current_pass', 'toggleCurrentPass');
    setupToggle('new_pass', 'toggleNewPass');

    // 1. CARGAR DATOS DEL PERFIL
    try {
        const res = await fetch('/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) throw new Error('Token expirado');
        const user = await res.json();

        // Guardamos los datos para usarlos luego en el modal
        currentUserData = user;

        document.getElementById('profileName').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;
        // Muestra Superadmin / Admin / Moderator / User
        document.getElementById('profileRole').textContent = user.role.toUpperCase();
        document.getElementById('profileLocation').textContent = `${user.municipality || 'N/A'}, ${user.department || ''}`;
        document.getElementById('profilePoints').textContent = user.total_points;

        // --- LÓGICA DE AVATAR (ACTUALIZADO) ---
        const avatarEl = document.getElementById('profileAvatar');

        // Mapa de iconos (Nombre BD -> Clase RemixIcon)
        const avatarMap = {
            'default': 'ri-user-3-line',
            'ball': 'ri-football-line',
            'robot': 'ri-robot-line',
            'alien': 'ri-aliens-line',
            'trophy': 'ri-cup-line',
            'star': 'ri-star-line',
            'fire': 'ri-fire-line',
            'flash': 'ri-flashlight-line',
            'shield': 'ri-shield-line',
            'ghost': 'ri-ghost-line',
            'rocket': 'ri-rocket-line',
            'crown': 'ri-vip-crown-fill'
        };

        // Si no tiene avatar o es desconocido, usa default
        const iconClass = avatarMap[user.avatar] || 'ri-user-3-line';
        avatarEl.innerHTML = `<i class="${iconClass}"></i>`;

        // 🚨 LÓGICA DE ROLES: Muestra botón si es Staff
        const staffRoles = ['superadmin', 'admin', 'moderator'];
        if (staffRoles.includes(user.role)) {
            const btnAdmin = document.getElementById('btnAdminPanel');
            if (btnAdmin) btnAdmin.classList.remove('hidden');
        }

        // Estadísticas
        if (user.stats) {
            document.getElementById('profileEfficiency').textContent = `${user.stats.efficiency}%`;
            if (user.stats.efficiency >= 50) document.getElementById('profileEfficiency').style.color = 'var(--success)';
        }

        // Próximo Partido
        const nextMatchEl = document.getElementById('nextMatchInfo');
        const nextTimeEl = document.getElementById('nextMatchTime');

        if (user.nextMatch) {
            const date = new Date(user.nextMatch.match_date);
            const timeStr = date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            nextMatchEl.innerHTML = `${user.nextMatch.team_home} <span style="color:var(--text-muted)">vs</span> ${user.nextMatch.team_away}`;
            nextTimeEl.textContent = timeStr;

            document.getElementById('nextMatchCard').style.cursor = 'pointer';
            document.getElementById('nextMatchCard').onclick = () => window.location.href = '/results.html';
        } else {
            nextMatchEl.textContent = "No hay partidos pendientes.";
            nextTimeEl.textContent = "";
        }
    } catch (error) {
        console.error(error);
        sessionStorage.clear();
        window.location.href = '/index.html';
    }

    // 2. CAMBIAR CONTRASEÑA
    const formChangePass = document.getElementById('formChangePass');
    if (formChangePass) {
        formChangePass.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current_pass').value;
            const newPassword = document.getElementById('new_pass').value;

            try {
                const res = await fetch('/api/users/profile/password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await res.json();

                if (res.ok) {
                    alert('¡Contraseña actualizada! Inicia sesión de nuevo.');
                    sessionStorage.clear();
                    window.location.href = '/index.html';
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // 3. SOPORTE
    const formSupport = document.getElementById('formSupport');
    if (formSupport) {
        formSupport.addEventListener('submit', async (e) => {
            e.preventDefault();
            const type = document.getElementById('support_type').value;
            const message = document.getElementById('support_msg').value;

            try {
                const res = await fetch('/api/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ type, message })
                });
                if (res.ok) {
                    alert('Solicitud enviada.');
                    window.toggleModal('modalSupport', false);
                    document.getElementById('support_msg').value = '';
                } else { alert('Error al enviar'); }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // 4. HISTORIAL TICKETS (Función Global)
    window.abrirModalHistorial = async () => {
        const historyList = document.getElementById('historyList');
        window.toggleModal('modalHistory', true);
        historyList.innerHTML = '<p style="text-align: center; color: #888;">Cargando historial...</p>';

        try {
            const res = await fetch('/api/requests/myresolved', { headers: { 'Authorization': `Bearer ${token}` } });
            const history = await res.json();

            if (history.length === 0) {
                historyList.innerHTML = '<p style="text-align: center; color: #888;">No tienes tickets resueltos.</p>';
                return;
            }

            historyList.innerHTML = history.map(req => {
                const date = new Date(req.created_at).toLocaleDateString();
                return `
                    <div style="border: 1px solid var(--border); padding: 15px; margin-bottom: 10px; border-radius: 8px; background: var(--bg-input);">
                        <span style="color: var(--accent); font-weight: bold;">Ticket #${req.request_id} (${req.type.toUpperCase()})</span>
                        <span style="float: right; color: var(--text-muted); font-size: 0.8em;">${date}</span>
                        <p style="margin-top: 5px; font-size: 0.9em; color: var(--text-main);">${req.message}</p>
                        <div style="border-left: 3px solid var(--accent); padding-left: 10px; margin-top: 10px;">
                            <strong style="color: var(--accent); font-size: 0.8em;">Respuesta Staff:</strong>
                            <p style="font-size: 0.9em; color: var(--text-muted); margin-top: 2px;">${req.admin_response || 'Sin respuesta'}</p>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            historyList.innerHTML = '<p style="text-align: center; color: var(--danger);">Error al cargar historial.</p>';
        }
    };

    // 5. HISTORIAL PUNTOS (Función Global)
    window.abrirHistorialPuntos = async () => {
        const listContainer = document.getElementById('pointsList');
        window.toggleModal('modalPointsHistory', true);
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Cargando...</p>';

        try {
            const res = await fetch('/api/predictions/history', { headers: { 'Authorization': `Bearer ${token}` } });
            const history = await res.json();

            if (history.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Aún no tienes partidos finalizados.</p>';
                return;
            }

            listContainer.innerHTML = history.map(h => {
                let badgeColor = '#FF6347'; // Rojo (0 pts)
                let ptsText = '+0';
                if (h.points === 3) { badgeColor = '#00FFC0'; ptsText = '+3 🎯'; }
                else if (h.points === 1) { badgeColor = '#FFD700'; ptsText = '+1 ✅'; }

                const date = new Date(h.match_date).toLocaleDateString();

                return `
                    <div style="background: var(--bg-input); border: 1px solid var(--border); padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; font-size: 0.95em; color: var(--text-main);">
                                ${h.team_home} <span style="color: var(--text-muted); font-size: 0.8em;">vs</span> ${h.team_away}
                            </div>
                            <div style="font-size: 0.8em; color: var(--text-muted); margin-top: 4px;">
                                Real: <b>${h.score_home}-${h.score_away}</b> | Tú: ${h.pred_home}-${h.pred_away}
                            </div>
                            <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 2px;">${date}</div>
                        </div>
                        <div style="background: ${badgeColor}; color: #111; font-weight: bold; padding: 5px 10px; border-radius: 12px; font-size: 0.9em; min-width: 50px; text-align: center;">
                            ${ptsText}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            console.error(e);
            listContainer.innerHTML = '<p style="text-align: center; color: var(--danger);">Error al cargar datos.</p>';
        }
    };

    // 6. EDITAR PERFIL (Abrir Modal)
    window.abrirModalEditarPerfil = async () => {
        // 1. Pre-llenar datos básicos
        document.getElementById('my_username').value = document.getElementById('profileName').textContent;
        document.getElementById('my_email').value = document.getElementById('profileEmail').textContent;

        // 2. Cargar Municipios (Si el select está vacío o solo tiene 'Cargando...')
        const muniSelect = document.getElementById('my_municipality');

        // Usamos una bandera simple para no recargar si ya están cargados
        if (muniSelect.options.length <= 1) {
            try {
                const munis = await api.getMunicipalities(); // Usamos tu función helper existente
                muniSelect.innerHTML = '<option value="">Selecciona tu ubicación...</option>' +
                    munis.map(m => `<option value="${m.municipality_id}">${m.municipality_name} (${m.department_name})</option>`).join('');
            } catch (e) {
                muniSelect.innerHTML = '<option value="">Error al cargar</option>';
            }
        }

        // 3. Pre-seleccionar el MUNICIPIO actual
        // (currentUserData lo definimos al inicio del archivo en pasos anteriores)
        if (currentUserData && currentUserData.municipality_id) {
            muniSelect.value = currentUserData.municipality_id;
        }

        // 4. Pre-seleccionar el AVATAR actual
        const currentAvatar = currentUserData.avatar || 'default';
        const radioToCheck = document.querySelector(`input[name="avatar"][value="${currentAvatar}"]`);
        if (radioToCheck) radioToCheck.checked = true;

        window.toggleModal('modalEditProfile', true);
    };

    // 7. GUARDAR PERFIL (Actualizado con Municipio)
    const formEditProfile = document.getElementById('formEditProfile');
    if (formEditProfile) {
        formEditProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('my_username').value;
            const email = document.getElementById('my_email').value;
            const municipality_id = document.getElementById('my_municipality').value; // <--- NUEVO

            let selectedAvatar = 'default';
            const checkedInput = document.querySelector('input[name="avatar"]:checked');
            if (checkedInput) selectedAvatar = checkedInput.value;

            try {
                const res = await fetch('/api/users/profile/edit', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    // Enviamos municipality_id también
                    body: JSON.stringify({ username, email, avatar: selectedAvatar, municipality_id })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('Perfil actualizado.');
                    location.reload();
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (e) {
                alert('Error de conexión');
            }
        });
    }
});