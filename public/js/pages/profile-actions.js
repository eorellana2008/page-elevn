document.addEventListener('DOMContentLoaded', () => {
    // CAMBIAR CONTRASEÑA
    const formChangePass = document.getElementById('formChangePass');
    if (formChangePass) {
        formChangePass.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current_pass').value;
            const newPassword = document.getElementById('new_pass').value;

            try {
                const data = await api.changePassword({ currentPassword, newPassword });

                if (data.message) {
                    alert('¡Contraseña actualizada! Inicia sesión de nuevo.');
                    sessionStorage.clear();
                    window.location.href = '/index.html';
                } else {
                    alert('Error: ' + (data.error || 'No se pudo actualizar'));
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // SOPORTE
    const formSupport = document.getElementById('formSupport');
    if (formSupport) {
        formSupport.addEventListener('submit', async (e) => {
            e.preventDefault();
            const type = document.getElementById('support_type').value;
            const message = document.getElementById('support_msg').value;

            try {
                const data = await api.createRequest({ type, message });
                
                if (data.message) {
                    alert('Solicitud enviada.');
                    window.toggleModal('modalSupport', false);
                    document.getElementById('support_msg').value = '';
                } else {
                    alert('Error: ' + (data.error || 'Error al enviar'));
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // EDITAR PERFIL
    const formEditProfile = document.getElementById('formEditProfile');
    if (formEditProfile) {
        formEditProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('my_username').value;
            const email = document.getElementById('my_email').value;
            const country_id = document.getElementById('my_country').value;
            
            let selectedAvatar = 'default';
            const checkedInput = document.querySelector('input[name="avatar"]:checked');
            if (checkedInput) selectedAvatar = checkedInput.value;

            try {
                const data = await api.updateProfile({ username, email, avatar: selectedAvatar, country_id });

                if (data.message) {
                    alert('Perfil actualizado.');
                    location.reload();
                } else {
                    alert('Error: ' + (data.error || 'No se pudo actualizar'));
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }
});

// --- FUNCIONES GLOBALES (Modales) ---

// HISTORIAL DE TIKETS
window.abrirModalHistorial = async () => {
    const historyList = document.getElementById('historyList');
    window.toggleModal('modalHistory', true);
    historyList.innerHTML = '<p style="text-align: center; color: #888;">Cargando historial...</p>';
    
    try {
        const history = await api.getMyResolvedRequests();

        if (!history || history.length === 0) {
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
                </div>`;
        }).join('');
    } catch (e) { historyList.innerHTML = '<p style="color:var(--danger)">Error al cargar.</p>'; }
};

// HISTORIAL DE PUNTOS
window.abrirHistorialPuntos = async () => {
    const listContainer = document.getElementById('pointsList');
    window.toggleModal('modalPointsHistory', true);
    listContainer.innerHTML = '<p style="text-align: center;">Cargando...</p>';
    
    try {
        const history = await api.getPointsHistory();

        if (!history || history.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Sin partidos finalizados.</p>';
            return;
        }

        listContainer.innerHTML = history.map(h => {
            let badgeColor = h.points === 3 ? '#00FFC0' : (h.points === 1 ? '#FFD700' : '#FF6347');
            let ptsText = h.points === 3 ? '+3 🎯' : (h.points === 1 ? '+1 ✅' : '+0');
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
                    <div style="background: ${badgeColor}; color: #111; font-weight: bold; padding: 5px 10px; border-radius: 12px; font-size: 0.9em; min-width: 50px; text-align: center;">${ptsText}</div>
                </div>`;
        }).join('');
    } catch (e) { console.error(e); }
};

// ABRIR MODAL EDITAR
window.abrirModalEditarPerfil = async () => {
    document.getElementById('my_username').value = document.getElementById('profileName').textContent;
    document.getElementById('my_email').value = document.getElementById('profileEmail').textContent;

    const countrySelect = document.getElementById('my_country');
    if (countrySelect.options.length <= 1) {
        try {
            const countries = await api.getCountries();
            countrySelect.innerHTML = '<option value="">Selecciona...</option>' + 
                countries.map(c => `<option value="${c.country_id}">${c.name}</option>`).join('');
        } catch (e) {}
    }

    const userData = window.currentUserData || {};
    if (userData.country_id) countrySelect.value = userData.country_id;
    
    const currentAvatar = userData.avatar || 'default';
    const radioToCheck = document.querySelector(`input[name="avatar"][value="${currentAvatar}"]`);
    if (radioToCheck) radioToCheck.checked = true;

    window.toggleModal('modalEditProfile', true);
};