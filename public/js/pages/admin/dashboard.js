document.addEventListener('DOMContentLoaded', () => {
    // Lógica de Permisos Visuales (Moderador)
    const role = sessionStorage.getItem('userRole');
    
    if (role === 'moderator') {
        // 1. Ocultar botones de pestañas prohibidas
        const btnUsers = document.getElementById('tab-btn-users');
        const btnRequests = document.getElementById('tab-btn-requests');
        
        if (btnUsers) btnUsers.style.display = 'none';
        if (btnRequests) btnRequests.style.display = 'none';
        
        // 2. Eliminar el contenido del DOM para seguridad visual
        // (Así ni inspeccionando elemento pueden ver la tabla vacía)
        const tabUsers = document.getElementById('tab-users');
        const tabRequests = document.getElementById('tab-requests');
        
        if (tabUsers) tabUsers.remove();
        if (tabRequests) tabRequests.remove();

        // 3. Forzar la pestaña de Partidos como la activa
        // (Usamos la función global switchTab que está en ui.js)
        if (window.switchTab) {
            window.switchTab('matches');
        }
        
        // 4. Asegurar visualmente que el botón de partidos esté activo
        const btnMatches = document.getElementById('tab-btn-matches');
        if (btnMatches) btnMatches.classList.add('active');
    }
});