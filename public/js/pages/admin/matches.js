document.addEventListener('DOMContentLoaded', async () => {
    const matchesBody = document.querySelector('#matchesTable tbody');

    // 1. CARGAR SELECTORES DE COMPETICIONES
    await cargarCompeticionesSelects();

    // 2. CARGAR PARTIDOS
    if (matchesBody) {
        try {
            const matches = await api.getMatches(); // Trae partidos (con competition_name)

            matchesBody.innerHTML = matches.map(match => {
                const dateObj = new Date(match.match_date);
                const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isoDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

                const estadoHtml = match.status === 'finished'
                    ? `<span style="color: var(--success); font-size: 0.85em; font-weight: 600;"><i class="ri-checkbox-circle-line"></i> Finalizado</span>`
                    : `<span style="color: var(--text-muted); font-size: 0.85em;"><i class="ri-time-line"></i> Pendiente</span>`;

                const marcador = match.status === 'finished'
                    ? `<span style="background: var(--bg-input); padding: 4px 10px; border-radius: 10px; font-weight: bold; color: var(--text-main); border: 1px solid var(--border);">${match.score_home} - ${match.score_away}</span>`
                    : `<span style="color: var(--accent); font-weight: 600; font-size: 0.9em;">VS</span>`;

                // Nombre del Torneo (o "Amistoso" si es null)
                const torneo = match.competition_name || '<span style="opacity:0.5">Amistoso</span>';

                return `
                    <tr>
                        <td style="color: var(--text-muted); font-size: 0.9em;">${dateStr}</td>
                        <td style="font-weight: 600; color: var(--accent); font-size: 0.9em;">${torneo}</td>
                        <td class="text-center" style="font-weight: 600;">${match.team_home}</td>
                        <td class="text-center">${marcador}</td>
                        <td class="text-center" style="font-weight: 600;">${match.team_away}</td>
                        <td>${estadoHtml}</td>
                        <td>
                            <div style="display: flex; gap: 5px;">
                                <button class="action-btn btn-edit" title="Editar Datos" 
                                    onclick="abrirModalEditMatch('${match.match_id}', '${match.team_home}', '${match.team_away}', '${isoDate}', '${match.competition_id || ''}', '${match.match_round || ''}')">
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
    }

    const formMatch = document.getElementById('formMatch');
    if (formMatch) {
        formMatch.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                team_home: document.getElementById('team_home').value,
                team_away: document.getElementById('team_away').value,
                match_date: document.getElementById('match_date').value,
                competition_id: document.getElementById('match_competition').value,
                match_round: document.getElementById('match_round').value // <--- NUEVO
            };

            try {
                const res = await api.createMatch(data);
                if (res.message) { location.reload(); }
                else { alert('Error: ' + (res.error || 'No se pudo crear')); }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // 4. EDITAR DATOS
    const formEditMatch = document.getElementById('formEditMatch');
    if (formEditMatch) {
        formEditMatch.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit_match_id').value;
            const data = {
                team_home: document.getElementById('edit_team_home').value,
                team_away: document.getElementById('edit_team_away').value,
                match_date: document.getElementById('edit_match_date').value,
                competition_id: document.getElementById('edit_match_competition').value,
                match_round: document.getElementById('edit_match_round').value // <--- NUEVO
            };

            try {
                const res = await api.updateMatch(id, data);
                if (res.message) { location.reload(); }
                else { alert('Error: ' + (res.error || 'No se pudo actualizar')); }
            } catch (e) { alert('Error de conexión'); }
        });
    }
    // 5. PONER GOLES (Se mantiene igual)
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
                const res = await api.updateMatchScore(id, data);
                if (res.message) {
                    alert('Resultado guardado.');
                    location.reload();
                } else { alert('Error al guardar score'); }
            } catch (e) { alert('Error'); }
        });
    }
});

// --- FUNCIONES GLOBALES ---

// Cargar lista de torneos en los selectores
async function cargarCompeticionesSelects() {
    try {
        const comps = await api.getCompetitions();
        const options = '<option value="">-- Amistoso / Ninguna --</option>' +
            comps.map(c => `<option value="${c.competition_id}">${c.name}</option>`).join('');

        const s1 = document.getElementById('match_competition');
        const s2 = document.getElementById('edit_match_competition');
        if (s1) s1.innerHTML = options;
        if (s2) s2.innerHTML = options;
    } catch (e) { console.error("Error cargando competiciones"); }
}

window.abrirModalMatch = () => window.toggleModal('modalMatch', true);

// Actualizado para recibir compId
window.abrirModalEditMatch = (id, home, away, date, compId, round) => { // <--- Recibe round
    document.getElementById('edit_match_id').value = id;
    document.getElementById('edit_team_home').value = home;
    document.getElementById('edit_team_away').value = away;
    document.getElementById('edit_match_date').value = date;
    document.getElementById('edit_match_competition').value = compId;
    document.getElementById('edit_match_round').value = round || ''; // <--- Asigna round
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
        const res = await api.deleteMatch(id);
        if (res.message) { alert('Partido eliminado'); location.reload(); }
        else { alert('Error al eliminar'); }
    } catch (e) { alert('Error'); }
};