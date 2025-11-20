document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('userToken');
    
    const path = window.location.pathname.toLowerCase();

    const isPublicPage = path === '/' || path.includes('index.html');

    if (token) {
        if (isPublicPage) {
            window.location.href = '/profile.html';
        }
    } else {
        if (!isPublicPage) {
            window.location.href = '/index.html';
        }
    }

    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Cerrar sesión?')) {
                sessionStorage.removeItem('userToken');
                sessionStorage.removeItem('userRole');
                window.location.href = '/index.html';
            }
        });
    }
});