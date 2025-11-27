/* ⚠️ UTILIDAD: SESIÓN (CON LOADER AL SALIR) */
import { navigateTo, showGlobalLoader } from './dom.js';

export const initSession = () => {
    const token = sessionStorage.getItem('userToken');
    const path = window.location.pathname.toLowerCase();
    const isPublicPage = path === '/' || path.includes('index.html') || path.includes('forgot') || path.includes('reset');

    if (!token && !isPublicPage) {
        window.location.href = '/index.html';
        return false;
    }
    if (token && isPublicPage && !path.includes('reset')) {
        window.location.href = '/profile.html';
        return false;
    }

    // CONFIGURAR TODOS LOS BOTONES DE LOGOUT
    const logoutBtns = document.querySelectorAll('.logout-btn, #logoutButton, #logoutButtonWidget, #logoutButtonMobile');

    logoutBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        if (btn.parentNode) {
            btn.parentNode.replaceChild(newBtn, btn);
        }

        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('¿Cerrar sesión?')) {
                showGlobalLoader();

                await new Promise(r => setTimeout(r, 2000));
                sessionStorage.clear();
                window.location.href = '/index.html';
            }
        });
    });

    return true;
};

export const getCurrentUser = () => {
    return {
        token: sessionStorage.getItem('userToken'),
        role: sessionStorage.getItem('userRole')
    };
};