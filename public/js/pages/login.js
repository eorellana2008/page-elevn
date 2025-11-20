document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('loginView');
    const registerView = document.getElementById('registerView');
    const msgDisplay = document.getElementById('message'); 

    // --- 1. FUNCIÓN PARA ACTIVAR LOS OJOS (TOGGLE) ---
    const setupToggle = (inputId, toggleId) => {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);
        
        if (input && toggle) {
            // Limpiamos listeners previos clonando el nodo (opcional, pero seguro)
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);

            newToggle.addEventListener('click', () => {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                
                // Cambiar icono: Ojo abierto (ver) vs Ojo tachado (ocultar)
                if (type === 'password') {
                    newToggle.innerHTML = '<i class="ri-eye-line"></i>';
                } else {
                    newToggle.innerHTML = '<i class="ri-eye-off-line"></i>';
                }
            });
        }
    };

    // Configurar los ojos para Login y Registro
    setupToggle('login_password', 'toggleLoginPassword');
    setupToggle('password', 'toggleRegisterPassword');

    // --- 2. NAVEGACIÓN ENTRE LOGIN Y REGISTRO ---
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginView.classList.add('hidden');
            registerView.classList.remove('hidden');
            if(msgDisplay) msgDisplay.classList.add('hidden');
            document.getElementById('loginForm').reset();
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerView.classList.add('hidden');
            loginView.classList.remove('hidden');
            if(msgDisplay) msgDisplay.classList.add('hidden');
            document.getElementById('registerForm').reset();
        });
    }

    // --- 3. LÓGICA DE LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const credentials = {
                username: document.getElementById('login_username').value,
                password: document.getElementById('login_password').value
            };

            try {
                const data = await api.login(credentials);

                if (data.token) {
                    sessionStorage.setItem('userToken', data.token);
                    sessionStorage.setItem('userRole', data.role);
                    
                    if (msgDisplay) {
                        msgDisplay.textContent = `Bienvenido, ${data.username}...`;
                        msgDisplay.className = 'message-display success';
                        msgDisplay.classList.remove('hidden');
                        msgDisplay.style.color = '#00FFC0';
                    }

                    setTimeout(() => {
                        window.location.href = '/profile.html';
                    }, 1000);
                } else {
                    alert(data.error || 'Error de acceso');
                }
            } catch (error) {
                alert('Error de conexión');
            }
        });
    }

    // --- 4. LÓGICA DE REGISTRO ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                email: document.getElementById('email').value,
                municipality_id: parseInt(document.getElementById('municipality').value)
            };

            try {
                const data = await api.register(userData);
                if (data.message && !data.error) {
                    alert('¡Registro exitoso! Inicia sesión.');
                    registerForm.reset(); 
                    setTimeout(() => {
                        if (showLogin) showLogin.click(); 
                    }, 500);
                } else {
                    alert(data.error || 'Error al registrar');
                }
            } catch (error) {
                alert('Error de conexión');
            }
        });
        
        loadMunicipalities();
    }
});

async function loadMunicipalities() {
    const select = document.getElementById('municipality');
    if (!select) return;
    try {
        const munis = await api.getMunicipalities();
        if (munis.length > 0) {
            select.innerHTML = '<option value="">Seleccione...</option>' + 
                munis.map(m => `<option value="${m.municipality_id}">${m.municipality_name} (${m.department_name})</option>`).join('');
        }
    } catch (e) {
        select.innerHTML = '<option value="">Error al cargar</option>';
    }
}