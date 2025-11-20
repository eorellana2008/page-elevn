document.addEventListener('DOMContentLoaded', async () => {
    // El token lo maneja api.js
    const matchesBody = document.querySelector('#matchesTable tbody');
    if (!matchesBody) return;

    // 1. CARGAR PARTIDOS
    try {
        const matches = await api.getMatches(); // <--- API CLEAN

        matchesBody.innerHTML = matches.map(match => {
            const dateObj = new Date(match.match_date);
            const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Ajuste de zona horaria manual para el input date (simple) o usar ISO directo
            // Truco para datetime-local: new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            const isoDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

            const estadoHtml = match.status === 'finished'
                ? `<span style="color: var(--success); font-size: 0.85em; font-weight: 600;"><i class="ri-checkbox-circle-line"></i> Finalizado</span>`
                : `<span style="color: var(--text-muted); font-size: 0.85em;"><i class="ri-time-line"></i> Pendiente</span>`;

            const marcador = match.status === 'finished'
                ? `<span style="background: var(--bg-input); padding: 4px 10px; border-radius: 10px; font-weight: bold; color: var(--text-main); border: 1px solid var(--border);">${match.score_home} - ${match.score_away}</span>`
                : `<span style="color: var(--accent); font-weight: 600; font-size: 0.9em;">VS</span>`;

            return `
                <tr>
                    <td style="color: var(--text-muted); font-size: 0.9em;">${dateStr}</td>
                    <td class="text-center" style="font-weight: 600;">${match.team_home}</td>
                    <td class="text-center">${marcador}</td>
                    <td class="text-center" style="font-weight: 600;">${match.team_away}</td>
                    <td>${estadoHtml}</td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="action-btn btn-edit" title="Editar Datos" 
                                onclick="abrirModalEditMatch('${match.match_id}', '${match.team_home}', '${match.team_away}', '${isoDate}')">
                                <i class="ri-pencil-line"></i>
                            </button>

                            <button class="action-btn" style="color: var(--accent);" title="Marcador" 
                                onclick="abrirModalScore(${match.match_id}, '${match.team_home}', '${match.team_away}')">
                                <i class="ri-football-line"></i>
                            </button>

                            <button class="action-btn btn-delete" title="Borrar" onclick="eliminarPartido(${match.match_id})">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) { console.error(e); }

    // 2. LISTENER: CREAR PARTIDO
    const formMatch = document.getElementById('formMatch');
    if (formMatch) {
        formMatch.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                team_home: document.getElementById('team_home').value,
                team_away: document.getElementById('team_away').value,
                match_date: document.getElementById('match_date').value
            };

            try {
                const res = await api.createMatch(data); // <--- API CLEAN
                if (res.message) {
                    alert('Partido creado');
                    location.reload();
                } else {
                    alert('Error: ' + (res.error || 'No se pudo crear'));
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // 3. LISTENER: EDITAR DATOS
    const formEditMatch = document.getElementById('formEditMatch');
    if (formEditMatch) {
        formEditMatch.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit_match_id').value;
            const data = {
                team_home: document.getElementById('edit_team_home').value,
                team_away: document.getElementById('edit_team_away').value,
                match_date: document.getElementById('edit_match_date').value
            };

            try {
                const res = await api.updateMatch(id, data); // <--- API CLEAN
                if (res.message) {
                    alert('Partido actualizado');
                    location.reload();
                } else {
                    alert('Error: ' + (res.error || 'No se pudo actualizar'));
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // 4. LISTENER: PONER GOLES
    const formScore = document.getElementById('formScore');
    if (formScore) {
        formScore.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('score_id').value;
            const data = {
                score_home: document.getElementById('score_home').value,
                score_away: document.getElementById('score_away').value
            };

            try {
                const res = await api.updateMatchScore(id, data); // <--- API CLEAN
                if (res.message) {
                    alert('Resultado guardado y puntos calculados.');
                    location.reload();
                } else {
                    alert('Error: ' + (res.error || 'No se pudo guardar score'));
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }
});

// --- GLOBALES ---
window.abrirModalMatch = () => window.toggleModal('modalMatch', true);

window.abrirModalEditMatch = (id, home, away, date) => {
    document.getElementById('edit_match_id').value = id;
    document.getElementById('edit_team_home').value = home;
    document.getElementById('edit_team_away').value = away;
    document.getElementById('edit_match_date').value = date;
    window.toggleModal('modalEditMatch', true);
};

window.abrirModalScore = (id, home, away) => {
    document.getElementById('score_id').value = id;
    document.getElementById('scoreMatchLabel').innerText = `${home} vs ${away}`;
    document.getElementById('score_home').value = '';
    document.getElementById('score_away').value = '';
    window.toggleModal('modalScore', true);
};

window.eliminarPartido = async (id) => {
    if (!confirm('¿Borrar partido?')) return;
    try {
        const res = await api.deleteMatch(id); // <--- API CLEAN
        if (res.message) {
            alert('Partido eliminado');
            location.reload();
        } else {
            alert('Error: ' + (res.error || 'No se pudo eliminar'));
        }
    } catch (e) { alert('Error de conexión'); }
};