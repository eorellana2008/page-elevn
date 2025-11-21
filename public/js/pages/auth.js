document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. LOGIN / REGISTRO
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Toggles de contraseña (Ojos)
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

    if (loginForm || registerForm) {
        setupToggle('login_password', 'toggleLoginPassword');
        setupToggle('password', 'toggleRegisterPassword');

        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const loginView = document.getElementById('loginView');
        const registerView = document.getElementById('registerView');
        const msgDisplay = document.getElementById('message');

        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                loginView.classList.add('hidden');
                registerView.classList.remove('hidden');
                if (msgDisplay) msgDisplay.classList.add('hidden');
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                registerView.classList.add('hidden');
                loginView.classList.remove('hidden');
                if (msgDisplay) msgDisplay.classList.add('hidden');
            });
        }

        // Lógica LOGIN
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
                        }, 1500);

                    } else {
                        alert(data.error || 'Credenciales inválidas');
                    }
                } catch (error) { alert('Error de conexión'); }
            });
        }

        // Lógica REGISTRO (ACTUALIZADA PAÍSES)
        if (registerForm) {
            // Cargar PAÍSES al iniciar
            cargarPaisesAuth();

            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const userData = {
                    username: document.getElementById('username').value,
                    password: document.getElementById('password').value,
                    email: document.getElementById('email').value,
                    country_id: parseInt(document.getElementById('country').value)
                };

                try {
                    const data = await api.register(userData);
                    if (data.message && !data.error) {
                        alert('¡Registro exitoso! Inicia sesión.');
                        registerForm.reset();
                        if (showLogin) showLogin.click();
                    } else {
                        alert(data.error || 'Error al registrar');
                    }
                } catch (error) { alert('Error de conexión'); }
            });
        }
    }

    // ==========================================
    // 2. PÁGINA OLVIDÉ CONTRASEÑA (forgot.html)
    // ==========================================
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot_email').value;
            const msg = document.getElementById('message');
            const btn = document.getElementById('btnSend');

            btn.disabled = true;
            btn.textContent = 'Enviando...';

            try {
                const data = await api.forgotPassword({ email });

                msg.textContent = data.message || data.error;
                msg.className = data.message ? 'message-display success' : 'message-display error';
                msg.classList.remove('hidden');

            } catch (err) {
                alert('Error de conexión');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Enviar Enlace';
            }
        });
    }

    // ==========================================
    // 3. PÁGINA RESETEAR CONTRASEÑA (reset.html)
    // ==========================================
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const msg = document.getElementById('message');

        if (!token) {
            if (msg) {
                msg.textContent = 'Token inválido o faltante.';
                msg.className = 'message-display error';
                msg.classList.remove('hidden');
            }
            const submitBtn = resetForm.querySelector('button');
            if (submitBtn) submitBtn.disabled = true;
        }

        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new_password').value;

            try {
                const data = await api.resetPassword({ token, newPassword });

                if (msg) {
                    msg.textContent = data.message || data.error;
                    msg.className = data.message ? 'message-display success' : 'message-display error';
                    msg.classList.remove('hidden');
                }

                if (data.message) {
                    setTimeout(() => window.location.href = '/index.html', 2000);
                }
            } catch (err) { alert('Error de conexión'); }
        });
    }
});

// Helper NUEVO para cargar PAÍSES
async function cargarPaisesAuth() {
    const select = document.getElementById('country');
    if (!select) return;
    try {
        const countries = await api.getCountries();
        if (countries.length > 0) {
            select.innerHTML = '<option value="">Selecciona tu país...</option>' +
                countries.map(c => `<option value="${c.country_id}">${c.name}</option>`).join('');
        }
    } catch (e) {
        select.innerHTML = '<option value="">Error al cargar</option>';
    }
}