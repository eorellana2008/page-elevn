// Variable global para almacenar las solicitudes temporalmente (para el modal de respuesta)
window.currentRequestsData = [];

document.addEventListener('DOMContentLoaded', async () => {
    const reqBody = document.querySelector('#requestsTable tbody');
    if (!reqBody) return;

    try {
        // 1. OBTENER DATOS CON API
        const requests = await api.getAllRequests(); // <--- API CLEAN

        // Guardar en memoria
        window.currentRequestsData = requests;

        if (!requests || requests.length === 0) {
            reqBody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px; color: var(--text-muted);">No hay mensajes pendientes.</td></tr>';
            return;
        }

        reqBody.innerHTML = requests.map(r => {
            const date = new Date(r.created_at).toLocaleDateString();
            const safeMsg = window.escapeHTML ? window.escapeHTML(r.message) : r.message;
            const safeUser = window.escapeHTML ? window.escapeHTML(r.username) : r.username;

            // --- ESTILOS E ICONOS (V2.0) ---
            let typeStyle = '';
            let iconHtml = '';

            switch (r.type) {
                case 'reclamo':
                    typeStyle = 'background: rgba(252, 129, 129, 0.15); color: var(--danger); border: 1px solid var(--danger);';
                    iconHtml = '<i class="ri-alarm-warning-line" style="vertical-align: bottom; margin-right: 4px;"></i>';
                    break;
                case 'sugerencia':
                    typeStyle = 'background: rgba(79, 209, 197, 0.15); color: var(--accent); border: 1px solid var(--accent);';
                    iconHtml = '<i class="ri-lightbulb-line" style="vertical-align: bottom; margin-right: 4px;"></i>';
                    break;
                case 'bug':
                    typeStyle = 'background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid #FFD700;';
                    iconHtml = '<i class="ri-bug-line" style="vertical-align: bottom; margin-right: 4px;"></i>';
                    break;
                case 'cuenta':
                    typeStyle = 'background: rgba(66, 153, 225, 0.15); color: #4299e1; border: 1px solid #4299e1;';
                    iconHtml = '<i class="ri-user-settings-line" style="vertical-align: bottom; margin-right: 4px;"></i>';
                    break;
                default:
                    typeStyle = 'background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border);';
                    iconHtml = '<i class="ri-file-list-2-line" style="vertical-align: bottom; margin-right: 4px;"></i>';
            }

            return `
                <tr>
                    <td style="color: var(--text-muted); font-size: 0.85em;">${date}</td>
                    <td style="font-weight: 600;">${safeUser}</td>
                    <td>
                        <span style="${typeStyle} padding: 4px 10px; border-radius: 12px; font-size: 0.75em; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center;">
                            ${iconHtml} ${r.type}
                        </span>
                    </td>
                    <td style="max-width: 300px; font-size: 0.9em; color: var(--text-main);">${safeMsg}</td>
                    <td class="text-center">
                        <button class="action-btn" style="color: var(--accent); background: rgba(79, 209, 197, 0.1);" 
                            onclick="prepararRespuesta(${r.request_id})"
                            title="Responder">
                            <i class="ri-reply-line"></i> Responder
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) { console.error(e); }

    // 2. ENVIAR RESPUESTA
    const formResponse = document.getElementById('formResponse');
    if (formResponse) {
        formResponse.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('response_id').value;
            const responseMessage = document.getElementById('response_msg').value;

            if (!responseMessage) return alert('Escribe una respuesta.');

            try {
                const res = await api.respondRequest(id, responseMessage); // <--- API CLEAN

                if (res.message) {
                    alert('Respuesta enviada.');
                    location.reload();
                } else {
                    alert('Error: ' + (res.error || 'No se pudo enviar'));
                }
            } catch (e) { alert('Error de conexión.'); }
        });
    }
});

// 3. HELPER SEGURO
window.prepararRespuesta = (id) => {
    const request = window.currentRequestsData.find(r => r.request_id === id);
    if (request) {
        document.getElementById('response_id').value = request.request_id;
        document.getElementById('requestUserLabel').innerText = `Usuario: ${request.username}`;
        document.getElementById('requestTypeLabel').innerText = `Tipo: ${request.type.toUpperCase()}`;
        document.getElementById('requestMessage').innerText = `Mensaje: ${request.message}`;
        document.getElementById('response_msg').value = '';

        if (window.toggleModal) window.toggleModal('modalResponse', true);
    }
};