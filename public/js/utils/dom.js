/* UTILIDADES GLOBALES (DOM & FORMATO)
   --------------------------------------------------------------
   Aquí residen funciones helpers. 
   ¡CUIDADO!: La función `escapeHTML` es vital para la seguridad.
   No la borres ni la modifiques si no sabes lo que haces, 
   o podrías permitir ataques XSS (inyección de código).
*/
export const toggleModal = (modalId, show = true) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (show) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    }
};

export const escapeHTML = (str) => {
    return str ? str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[tag]) : '';
};

export const formatDateShort = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }) +
        ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

export const getAvatarColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#2EC4B6', '#6A0572', '#AB83A1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// --- NAVEGACIÓN SUAVE ---
export const navigateTo = (url, delay = 500) => {
    document.body.classList.add('page-exiting');
    setTimeout(() => {
        window.location.href = url;
    }, delay);
};

// --- PANTALLA DE CARGA GLOBAL ---
export const showGlobalLoader = () => {
    // 1. Verificar si ya existe
    let loader = document.getElementById('globalLoader') || document.getElementById('loginLoader');

    // 2. Si no existe, lo creamos dinámicamente (Magia para Perfil/Admin)
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="spinner-wrapper">
                <div class="spinner-ring"></div>
                <div class="spinner-ring-2"></div>
                <img src="img/logo/logo-solitario.png" alt="Loading" class="spinner-logo">
            </div>
        `;
        document.body.appendChild(loader);
    }

    // 3. Activar
    setTimeout(() => loader.classList.add('active'), 10);
};

export const hideGlobalLoader = () => {
    const loader = document.getElementById('globalLoader') || document.getElementById('loginLoader');
    if (loader) loader.classList.remove('active');
};