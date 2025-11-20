document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('userToken');
    if (!token) return;

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

    // Configurar Toggles Admin
    setupToggle('new_password', 'toggleCreateUserPass');
    setupToggle('reset_new_password', 'toggleResetPass');

    const tableBody = document.querySelector('#usersTable tbody');

    // 1. CARGAR USUARIOS
    if (tableBody) {
        try {
            const users = await api.getUsers(token);

            if (users.error) {
                console.error("Error permisos:", users.error);
                return;
            }

            tableBody.innerHTML = users.map(user => {
                const inicial = user.username.charAt(0).toUpperCase();
                const safeUser = window.UI ? UI.escapeHTML(user.username) : user.username;
                const safeEmail = window.UI ? UI.escapeHTML(user.email) : user.email;

                // Colores para la jerarquía de 4 roles
                let roleColor = 'var(--bg-input)';
                let textColor = 'var(--text-muted)';

                if (user.role === 'superadmin') { roleColor = '#FFD700'; textColor = '#000'; } // Dorado
                else if (user.role === 'admin') { roleColor = '#FF4500'; textColor = '#FFF'; } // Rojo
                else if (user.role === 'moderator') { roleColor = 'var(--accent)'; textColor = '#000'; } // Verde Agua

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

    // 2. CARGAR MUNICIPIOS (NUEVO: ESTO FALTABA)
    // Se ejecuta al cargar la página para llenar el select del Modal Crear
    await cargarMunicipiosAdmin();

    // 3. LISTENER: CREAR USUARIO
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
                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(newUser)
                });
                const json = await res.json();
                if (res.ok) {
                    alert('Usuario creado correctamente');
                    location.reload();
                }
                else alert('Error: ' + json.error);
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // 4. LISTENER: EDITAR USUARIO
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
                const res = await fetch(`/api/users/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(data)
                });

                if (res.ok) { alert('Usuario actualizado'); location.reload(); }
                else {
                    const err = await res.json();
                    alert('Error: ' + (err.error || 'No se pudo actualizar'));
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // 5. LISTENER: RESET PASSWORD
    const formReset = document.getElementById('formReset');
    if (formReset) {
        formReset.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('reset_id').value;
            const newPassword = document.getElementById('reset_new_password').value;

            try {
                const res = await fetch(`/api/users/${id}/password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ newPassword })
                });

                if (res.ok) {
                    alert('Contraseña restablecida correctamente.');
                    window.toggleModal('modalReset', false);
                    document.getElementById('reset_new_password').value = '';
                } else {
                    alert('Error al cambiar contraseña.');
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }
});

// --- FUNCIONES DE AYUDA ---

// Nueva función para llenar el select
async function cargarMunicipiosAdmin() {
    const select = document.getElementById('new_municipality');
    if (!select) return;

    try {
        // Usamos la función existente en api.js
        const munis = await api.getMunicipalities();

        if (munis && munis.length > 0) {
            let options = '<option value="">Seleccione una ubicación...</option>';
            munis.forEach(m => {
                options += `<option value="${m.municipality_id}">${m.municipality_name} (${m.department_name})</option>`;
            });
            select.innerHTML = options;
        } else {
            select.innerHTML = '<option value="">No se encontraron datos</option>';
        }
    } catch (e) {
        console.error(e);
        select.innerHTML = '<option value="">Error al cargar</option>';
    }
}

function filtrarRolesEnSelect(selectId) {
    const myRole = sessionStorage.getItem('userRole'); // 'superadmin', 'admin', etc.
    const select = document.getElementById(selectId);
    if (!select) return;

    // Mapa de Poder (Debe coincidir con backend para lógica visual)
    const ROLE_POWER = { 'superadmin': 100, 'admin': 50, 'moderator': 20, 'user': 1 };
    const myPower = ROLE_POWER[myRole] || 0;

    // Opciones posibles
    const allRoles = [
        { val: 'user', label: 'Usuario', power: 1 },
        { val: 'moderator', label: 'Moderador', power: 20 },
        { val: 'admin', label: 'Administrador', power: 50 },
        { val: 'superadmin', label: 'Super Admin', power: 100 }
    ];

    // Limpiamos el select
    select.innerHTML = '';

    allRoles.forEach(role => {
        // REGLA: Solo muestro roles MENORES al mío
        // EXCEPCIÓN: El Superadmin ve todo (o todo menos superadmin si quieres)

        if (myRole === 'superadmin') {
            // Superadmin ve todo
            const option = document.createElement('option');
            option.value = role.val;
            option.textContent = role.label;
            select.appendChild(option);
        } else {
            // Mortales solo ven roles inferiores
            if (role.power < myPower) {
                const option = document.createElement('option');
                option.value = role.val;
                option.textContent = role.label;
                select.appendChild(option);
            }
        }
    });
}


// ==========================================
// FUNCIONES GLOBALES
// ==========================================


window.abrirModalEditUser = (id, user, email, role) => {
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_username').value = user;
    document.getElementById('edit_email').value = email;
    
    // 1. Filtramos primero
    filtrarRolesEnSelect('edit_role');
    
    // 2. Intentamos seleccionar el rol actual del usuario
    const select = document.getElementById('edit_role');
    select.value = role; 

    // 3. Si el rol del usuario es mayor o igual al mio, el select quedará vacío o null
    // En ese caso, deshabilitamos el select para que no se pueda cambiar
    if (select.value === "") {
        // Opción cosmética: agregar una opción dummy
        const opt = document.createElement('option');
        opt.text = role.toUpperCase() + " (Sin permiso)";
        opt.value = role;
        select.add(opt);
        select.value = role;
        select.disabled = true;
    } else {
        select.disabled = false;
    }

    if(window.toggleModal) window.toggleModal('modalEditar', true);
};

window.abrirModalCrear = () => { 
    // Filtramos las opciones antes de abrir
    filtrarRolesEnSelect('new_role');
    
    if(window.toggleModal) window.toggleModal('modalCrear', true); 
};

window.eliminarUsuario = async (id) => {
    if (!confirm('¿Borrar usuario?')) return;
    const token = sessionStorage.getItem('userToken');
    try {
        const res = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) { alert('Usuario eliminado'); location.reload(); }
        else {
            const data = await res.json();
            alert('Error: ' + (data.error || 'No se pudo eliminar'));
        }
    } catch (e) { alert('Error de conexión'); }
};

window.abrirModalReset = (id) => {
    document.getElementById('reset_id').value = id;
    window.toggleModal('modalReset', true);
};