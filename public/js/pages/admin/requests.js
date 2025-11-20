// Variable global para almacenar las solicitudes temporalmente
window.currentRequestsData = [];

document.addEventListener('DOMContentLoaded', async () => {
    // CAMBIO: sessionStorage
    const token = sessionStorage.getItem('userToken');
    if (!token) return;

    const reqBody = document.querySelector('#requestsTable tbody');
    if (!reqBody) return;

    try {
        const res = await fetch('/api/requests', { headers: { 'Authorization': `Bearer ${token}` } });
        const requests = await res.json();
        
        // 1. GUARDAR DATOS EN MEMORIA (Para no pasarlos por HTML inseguro)
        window.currentRequestsData = requests;

        if (!requests.length) {
            reqBody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px; color: var(--text-muted);">No hay mensajes pendientes.</td></tr>';
            return;
        }

        reqBody.innerHTML = requests.map(r => {
            const date = new Date(r.created_at).toLocaleDateString();
            // Solo escapamos visualmente para la tabla
            const safeMsg = window.escapeHTML ? window.escapeHTML(r.message) : r.message;
            const safeUser = window.escapeHTML ? window.escapeHTML(r.username) : r.username;
            
            let typeStyle = 'background: var(--bg-input); color: var(--text-muted);';
            if (r.type === 'reclamo') typeStyle = 'background: rgba(252, 129, 129, 0.15); color: var(--danger);';
            if (r.type === 'sugerencia') typeStyle = 'background: rgba(79, 209, 197, 0.15); color: var(--accent);';

            // 2. CAMBIO CLAVE: En el onclick solo pasamos el ID
            // La función 'prepararRespuesta' buscará los textos en window.currentRequestsData
            return `
                <tr>
                    <td style="color: var(--text-muted); font-size: 0.85em;">${date}</td>
                    <td style="font-weight: 600;">${safeUser}</td>
                    <td>
                        <span style="${typeStyle} padding: 4px 8px; border-radius: 4px; font-size: 0.75em; font-weight: 600; text-transform: uppercase;">
                            ${r.type}
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

    const formResponse = document.getElementById('formResponse');
    if (formResponse) {
        formResponse.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('response_id').value;
            const responseMessage = document.getElementById('response_msg').value;
            
            if (!responseMessage) return alert('Escribe una respuesta.');

            try {
                const res = await fetch(`/api/requests/${id}/respond`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ responseMessage })
                });

                if (res.ok) {
                    alert('Respuesta enviada.');
                    location.reload();
                } else {
                    alert('Error al enviar respuesta.');
                }
            } catch (e) { alert('Error de conexión.'); }
        });
    }
});

// 3. NUEVA FUNCIÓN SEGURA
window.prepararRespuesta = (id) => {
    // Buscamos el objeto completo en la memoria usando el ID
    const request = window.currentRequestsData.find(r => r.request_id === id);
    
    if (request) {
        document.getElementById('response_id').value = request.request_id;
        document.getElementById('requestUserLabel').innerText = `Usuario: ${request.username}`;
        document.getElementById('requestTypeLabel').innerText = `Tipo: ${request.type.toUpperCase()}`;
        document.getElementById('requestMessage').innerText = `Mensaje: ${request.message}`;
        document.getElementById('response_msg').value = '';
        
        if(window.toggleModal) window.toggleModal('modalResponse', true);
    } else {
        console.error("No se encontró la solicitud en memoria");
    }
};