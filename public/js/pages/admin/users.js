document.addEventListener('DOMContentLoaded', async () => {
    // (api.js maneja el token)

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
    setupToggle('new_password', 'toggleCreateUserPass');
    setupToggle('reset_new_password', 'toggleResetPass');

    const tableBody = document.querySelector('#usersTable tbody');

    // 1. CARGAR USUARIOS
    if (tableBody) {
        try {
            const users = await api.getUsers(); // <--- API CLEAN

            if (users.error) {
                console.error("Error permisos:", users.error);
                return;
            }

            tableBody.innerHTML = users.map(user => {
                const inicial = user.username.charAt(0).toUpperCase();
                // Solo escapamos visualmente si existe la función, si no usamos raw
                const safeUser = window.escapeHTML ? window.escapeHTML(user.username) : user.username;
                const safeEmail = window.escapeHTML ? window.escapeHTML(user.email) : user.email;

                let roleColor = 'var(--bg-input)';
                let textColor = 'var(--text-muted)';

                if (user.role === 'superadmin') { roleColor = '#FFD700'; textColor = '#000'; }
                else if (user.role === 'admin') { roleColor = '#FF4500'; textColor = '#FFF'; }
                else if (user.role === 'moderator') { roleColor = 'var(--accent)'; textColor = '#000'; }

                return `
                    <tr>
                        <td>#${user.user_id}</td>
                        <td>
                            <div style="display:flex; align-items:center;">
                                <div class="avatar">${inicial}</div>
                                <span style="font-weight:600; color: var(--text-main);">${safeUser}</span>
                            </div>
                        </td>
                        <td>${safeEmail}</td>
                        <td>${user.municipality || 'N/A'}</td>
                        <td>
                            <span style="background: ${roleColor}; color: ${textColor}; padding: 4px 8px; border-radius: 4px; font-size: 0.75em; font-weight: 700; letter-spacing: 0.5px;">
                                ${user.role.toUpperCase()}
                            </span>
                        </td>
                        <td>
                            <div style="display: flex; gap: 5px;">
                                <button class="action-btn btn-edit" onclick="abrirModalEditUser('${user.user_id}', '${safeUser}', '${safeEmail}', '${user.role}')" title="Editar">
                                    <i class="ri-pencil-line"></i>
                                </button>
                                <button class="action-btn btn-delete" onclick="eliminarUsuario(${user.user_id})" title="Eliminar">
                                    <i class="ri-delete-bin-line"></i>
                                </button>
                                <button class="action-btn" style="color: #FFD700;" onclick="abrirModalReset('${user.user_id}')" title="Cambiar Pass">
                                    <i class="ri-key-2-line"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (e) { console.error("Error cargando usuarios:", e); }
    }

    // 2. CARGAR MUNICIPIOS (Para crear usuario)
    async function cargarMunicipiosAdmin() {
        const select = document.getElementById('new_municipality');
        if (!select) return;
        try {
            const munis = await api.getMunicipalities(); // <--- API CLEAN
            if (munis && munis.length > 0) {
                select.innerHTML = '<option value="">Seleccione una ubicación...</option>' +
                    munis.map(m => `<option value="${m.municipality_id}">${m.municipality_name} (${m.department_name})</option>`).join('');
            } else { select.innerHTML = '<option value="">No se encontraron datos</option>'; }
        } catch (e) { select.innerHTML = '<option value="">Error al cargar</option>'; }
    }
    await cargarMunicipiosAdmin();

    // 3. CREAR USUARIO
    const formCrear = document.getElementById('formCrear');
    if (formCrear) {
        formCrear.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUser = {
                username: document.getElementById('new_username').value,
                email: document.getElementById('new_email').value,
                password: document.getElementById('new_password').value,
                role: document.getElementById('new_role').value,
                municipality_id: document.getElementById('new_municipality').value
            };
            try {
                const res = await api.createUser(newUser); // <--- API CLEAN
                if (res.message) {
                    alert('Usuario creado correctamente');
                    location.reload();
                } else {
                    alert('Error: ' + (res.error || 'Error al crear'));
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // 4. EDITAR USUARIO
    const formEditar = document.getElementById('formEditar');
    if (formEditar) {
        formEditar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit_id').value;
            const data = {
                username: document.getElementById('edit_username').value,
                email: document.getElementById('edit_email').value,
                role: document.getElementById('edit_role').value
            };
            try {
                const res = await api.updateUser(id, data); // <--- API CLEAN
                if (res.message) { alert('Usuario actualizado'); location.reload(); }
                else { alert('Error: ' + (res.error || 'No se pudo actualizar')); }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // 5. RESET PASSWORD (ADMIN)
    const formReset = document.getElementById('formReset');
    if (formReset) {
        formReset.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('reset_id').value;
            const newPassword = document.getElementById('reset_new_password').value;
            try {
                const res = await api.adminResetPassword(id, newPassword); // <--- API CLEAN
                if (res.message) {
                    alert('Contraseña restablecida correctamente.');
                    window.toggleModal('modalReset', false);
                    document.getElementById('reset_new_password').value = '';
                } else { alert('Error: ' + (res.error || 'Falló el cambio')); }
            } catch (e) { alert('Error de conexión'); }
        });
    }
});

// --- HELPERS GLOBALES ---

function filtrarRolesEnSelect(selectId) {
    const myRole = sessionStorage.getItem('userRole');
    const select = document.getElementById(selectId);
    if (!select) return;

    const ROLE_POWER = { 'superadmin': 100, 'admin': 50, 'moderator': 20, 'user': 1 };
    const myPower = ROLE_POWER[myRole] || 0;

    const allRoles = [
        { val: 'user', label: 'Usuario', power: 1 },
        { val: 'moderator', label: 'Moderador', power: 20 },
        { val: 'admin', label: 'Administrador', power: 50 },
        { val: 'superadmin', label: 'Super Admin', power: 100 }
    ];

    select.innerHTML = '';
    allRoles.forEach(role => {
        if (myRole === 'superadmin' || role.power < myPower) {
            const option = document.createElement('option');
            option.value = role.val;
            option.textContent = role.label;
            select.appendChild(option);
        }
    });
}

window.abrirModalEditUser = (id, user, email, role) => {
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_username').value = user;
    document.getElementById('edit_email').value = email;
    filtrarRolesEnSelect('edit_role');

    const select = document.getElementById('edit_role');
    select.value = role;
    if (select.value === "") { // Si no tiene permiso para ese rol
        const opt = document.createElement('option');
        opt.text = role.toUpperCase() + " (Sin permiso)";
        opt.value = role;
        select.add(opt);
        select.value = role;
        select.disabled = true;
    } else {
        select.disabled = false;
    }
    if (window.toggleModal) window.toggleModal('modalEditar', true);
};

window.abrirModalCrear = () => {
    filtrarRolesEnSelect('new_role');
    if (window.toggleModal) window.toggleModal('modalCrear', true);
};

window.eliminarUsuario = async (id) => {
    if (!confirm('¿Borrar usuario?')) return;
    try {
        const res = await api.deleteUser(id); // <--- API CLEAN
        if (res.message) { alert('Usuario eliminado'); location.reload(); }
        else { alert('Error: ' + (res.error || 'No se pudo eliminar')); }
    } catch (e) { alert('Error de conexión'); }
};

window.abrirModalReset = (id) => {
    document.getElementById('reset_id').value = id;
    window.toggleModal('modalReset', true);
};