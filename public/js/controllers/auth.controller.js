/* CONTROLADOR: AUTENTICACIÓN
   --------------------------------------------------------------
   Maneja Login, Registro y Recuperación de Contraseña.
*/
import { api } from '../services/api.js';
import { initSession } from '../utils/session.js';
import { navigateTo, showGlobalLoader, hideGlobalLoader } from '../utils/dom.js';

document.addEventListener('DOMContentLoaded', async () => {
    initSession();

    setupPasswordToggle('login_password', 'toggleLoginPassword');
    setupPasswordToggle('password', 'toggleRegisterPassword');
    setupPasswordToggle('new_password', 'toggleResetPass');

    const switchForm = (hideId, showId) => {
        const hideEl = document.getElementById(hideId);
        const showEl = document.getElementById(showId);
        if (!hideEl || !showEl) return;

        hideEl.classList.add('animate-out');
        setTimeout(() => {
            hideEl.classList.add('hidden');
            hideEl.classList.remove('animate-out');
            showEl.classList.remove('hidden');
            showEl.classList.add('animate-in');
            setTimeout(() => showEl.classList.remove('animate-in'), 300);
        }, 300);
    };

    // --- LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Mostrar Loader
            showGlobalLoader();

            const creds = {
                username: document.getElementById('login_username').value,
                password: document.getElementById('login_password').value
            };

            try {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Espera estética
                const data = await api.login(creds);
                if (data.token) {
                    sessionStorage.setItem('userToken', data.token);
                    sessionStorage.setItem('userRole', data.role);
                    window.location.href = '/profile.html';
                } else {
                    hideGlobalLoader();
                    alert(data.error || 'Credenciales incorrectas');
                }
            } catch (e) {
                hideGlobalLoader();
                alert('Error de conexión');
            }
        });

        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            switchForm('loginView', 'registerView');
        });
    }

    // --- REGISTRO ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        await cargarPaises('country');

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Creando..."; btn.disabled = true;

            const data = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                email: document.getElementById('email').value,
                country_id: document.getElementById('country').value
            };
            try {
                const res = await api.register(data);
                if (res.message) {
                    alert('¡Cuenta creada con éxito!');
                    switchForm('registerView', 'loginView');
                    registerForm.reset();
                } else { alert(res.error); }
            } catch (e) { alert('Error de conexión'); }

            btn.innerText = originalText; btn.disabled = false;
        });

        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            switchForm('registerView', 'loginView');
        });
    }

    // --- RESET & FORGOT ---
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = forgotForm.querySelector('button');
            btn.disabled = true; btn.innerText = "Enviando...";
            try {
                await api.forgotPassword({ email: document.getElementById('forgot_email').value });
                const msg = document.getElementById('message');
                msg.innerText = "Correo enviado (Revisa spam)";
                msg.className = 'message-display success';
                msg.classList.remove('hidden');
            } catch (e) { alert('Error'); }
            btn.disabled = false; btn.innerText = "Enviar Enlace";
        });
    }

    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const params = new URLSearchParams(window.location.search);
            try {
                const res = await api.resetPassword({ token: params.get('token'), newPassword: document.getElementById('new_password').value });
                if (res.message) { alert('Contraseña cambiada.'); navigateTo('/index.html'); }
                else { alert(res.error); }
            } catch (e) { alert('Error'); }
        });
    }
});

function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (input && toggle) {
        toggle.addEventListener('click', () => {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            toggle.innerHTML = type === 'password' ? '<i class="ri-eye-line"></i>' : '<i class="ri-eye-off-line"></i>';
        });
    }
}

async function cargarPaises(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    try {
        const countries = await api.getCountries();
        select.innerHTML = '<option value="">Selecciona...</option>' + countries.map(c => `<option value="${c.country_id}">${c.name}</option>`).join('');
    } catch (e) { select.innerHTML = '<option>Error cargando</option>'; }
}