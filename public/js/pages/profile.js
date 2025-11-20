document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('userToken');

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
    
    // 1. CARGAR DATOS
    try {
        const res = await fetch('/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) throw new Error('Token expirado');
        const user = await res.json();

        document.getElementById('profileName').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;
        // Muestra Superadmin / Admin / Moderator / User
        document.getElementById('profileRole').textContent = user.role.toUpperCase();
        document.getElementById('profileLocation').textContent = `${user.municipality || 'N/A'}, ${user.department || ''}`;
        document.getElementById('profilePoints').textContent = user.total_points;

        // 🚨 LÓGICA DE ROLES ACTUALIZADA: Muestra botón si es Staff
        const staffRoles = ['superadmin', 'admin', 'moderator'];
        if (staffRoles.includes(user.role)) {
            const btnAdmin = document.getElementById('btnAdminPanel');
            btnAdmin.classList.remove('hidden');
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

    // 4. HISTORIAL (Función Global)
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
});