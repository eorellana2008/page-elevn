const UI = {
    // Función segura para evitar inyección de código HTML (XSS)
    escapeHTML: (str) => {
        return str ? str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        })[tag]) : '';
    },

    // Manejo de Modales (Abrir/Cerrar)
    toggleModal: (modalId, show = true) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (show) modal.classList.remove('hidden');
            else modal.classList.add('hidden');
        }
    },

    switchTab: (tabName) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        const targetContent = document.getElementById(`tab-${tabName}`);
        if (targetContent) targetContent.classList.add('active');

        const buttons = document.querySelectorAll('.tab-btn');
        if(tabName === 'users' && buttons[0]) buttons[0].classList.add('active');
        if(tabName === 'matches' && buttons[1]) buttons[1].classList.add('active');
        if(tabName === 'requests' && buttons[2]) buttons[2].classList.add('active');
    },

    showMessage: (elementId, msg, isSuccess = true) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = msg;
            el.className = isSuccess ? 'message-display success' : 'message-display error';
            el.style.color = isSuccess ? '#00FFC0' : '#FF6347'; 
            el.classList.remove('hidden');
        }
    }
};

window.toggleModal = UI.toggleModal;
window.switchTab = UI.switchTab;
window.escapeHTML = UI.escapeHTML;