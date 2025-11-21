// ==========================================
// GESTIÓN DE MODALES
// ==========================================
window.abrirModalCrear = () => window.toggleModal('modalCreate', true);
window.abrirModalUnirse = () => window.toggleModal('modalJoin', true);

// ==========================================
// 1. CARGAR LIGAS (Principal)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('leaguesContainer');
    const token = sessionStorage.getItem('userToken');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    // Obtener mi ID para saber si soy Admin
    let myUserId = null;
    try {
        const me = await api.getProfile();
        if (me) myUserId = me.user_id;
    } catch (e) { console.error("Error perfil", e); }

    await cargarLigas(myUserId);

    // LISTENERS DE FORMULARIOS
    setupFormListeners();
});

async function cargarLigas(myUserId) {
    const container = document.getElementById('leaguesContainer');
    container.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Cargando...</p>';

    try {
        const leagues = await api.getMyLeagues();
        container.innerHTML = '';

        if (leagues.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 8px;">
                    <i class="ri-trophy-line" style="font-size: 3em; margin-bottom: 10px; display:block; opacity: 0.5;"></i>
                    <p>No estás en ninguna liga aún.</p>
                    <button onclick="abrirModalCrear()" style="margin-top:10px; background:transparent; color:var(--accent); border:none; cursor:pointer; font-weight:bold; font-size: 1em;">Crear una ahora</button>
                </div>`;
            return;
        }

        leagues.forEach(l => {
            const isAdmin = (l.admin_id === myUserId);

            // BOTONES DE ACCIÓN SEGÚN ROL
            let actionBtns = '';
            
            if (isAdmin) {
                // ADMIN: Gestionar (⚙️) y Borrar (🗑️)
                actionBtns = `
                    <button onclick="abrirGestionMatches(${l.league_id}, '${l.name}')" title="Gestionar Jornada" 
                        style="background:var(--bg-input); border:1px solid var(--accent); color:var(--accent); cursor:pointer; margin-right:5px; border-radius:4px; padding:5px 10px; transition:0.2s;">
                        <i class="ri-settings-3-line"></i>
                    </button>
                    <button onclick="borrarLiga(${l.league_id})" title="Eliminar Liga" 
                        style="background:transparent; border:none; color:var(--danger); cursor:pointer; margin-right:10px;">
                        <i class="ri-delete-bin-line" style="font-size:1.2em;"></i>
                    </button>
                `;
            } else {
                // MIEMBRO: Salir (🚪)
                actionBtns = `
                    <button onclick="salirLiga(${l.league_id})" title="Salir de la Liga" 
                        style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; margin-right:10px;">
                        <i class="ri-logout-box-r-line" style="font-size:1.2em;"></i>
                    </button>
                `;
            }

            const card = document.createElement('div');
            card.style = "background: var(--bg-input); padding: 20px; border-radius: 8px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;";

            card.innerHTML = `
                <div>
                    <h3 style="margin:0; color:var(--text-main); font-size:1.1em;">
                        ${l.name} 
                        ${isAdmin ? '<span style="font-size:0.6em; background:var(--accent); color:#111; padding:2px 6px; border-radius:4px; vertical-align:middle; margin-left:5px; font-weight:bold;">ADMIN</span>' : ''}
                    </h3>
                    <div style="color:var(--text-muted); font-size:0.85em; margin-top:5px;">
                        Código: <strong style="color:var(--accent); letter-spacing:1px; font-family: monospace; font-size: 1.1em; cursor:pointer;" onclick="navigator.clipboard.writeText('${l.code}'); alert('Código copiado!')" title="Copiar">${l.code} <i class="ri-file-copy-line" style="font-size:0.8em;"></i></strong>
                    </div>
                    <div style="color:var(--text-muted); font-size:0.75em; margin-top:4px;">
                        <i class="ri-group-line"></i> ${l.members_count} miembro(s)
                    </div>
                </div>
                <div style="display:flex; align-items:center;">
                    ${actionBtns}
                    <button onclick="verRankingLiga(${l.league_id}, '${l.name}')" class="action-btn" style="background:var(--bg-card); border:1px solid var(--border); width:45px; height:45px; border-radius:50%; color: var(--text-main); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="ri-arrow-right-s-line" style="font-size: 1.5em;"></i>
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="text-align:center;">Error al cargar ligas.</p>';
    }
}

// ==========================================
// 2. GESTIÓN DE PARTIDOS (ADMIN)
// ==========================================
window.abrirGestionMatches = async (id, name) => {
    const container = document.getElementById('manageMatchesContainer');
    window.toggleModal('modalManageMatches', true);
    
    // Actualizar título del modal
    const titleEl = document.getElementById('manageTitle');
    if(titleEl) titleEl.innerHTML = `<i class="ri-settings-3-line"></i> ${name}`;
    
    container.innerHTML = '<p style="text-align:center; padding:20px;">Cargando partidos...</p>';

    try {
        // Cargar datos en paralelo
        const [current, available] = await Promise.all([
            api.getLeagueMatches(id),
            api.getAvailableMatches(id)
        ]);

        let html = '';

        // A) PARTIDOS ACTIVOS
        html += `<div style="margin-bottom:20px;">`;
        html += `<h4 style="color:var(--success); font-size:0.9em; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px;">ACTIVOS EN LA LIGA (${current.length})</h4>`;
        
        if (current.length === 0) {
            html += '<p style="color:#666; font-size:0.85em; font-style:italic;">No hay partidos seleccionados. La quiniela de esta liga está vacía.</p>';
        } else {
            current.forEach(m => {
                const dateStr = new Date(m.match_date).toLocaleDateString(undefined, {day:'2-digit', month:'2-digit'});
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(79, 209, 197, 0.05); margin-bottom:6px; border-radius:6px; border:1px solid rgba(79, 209, 197, 0.2);">
                        <div style="font-size:0.9em;">
                            <span style="color:var(--accent); font-weight:bold; font-size:0.8em; margin-right:5px;">${dateStr}</span>
                            <strong>${m.team_home}</strong> <span style="color:#666">vs</span> <strong>${m.team_away}</strong>
                        </div>
                        <button onclick="quitarPartido(${id}, ${m.match_id}, '${name}')" title="Quitar de la liga" 
                            style="color:var(--danger); background:transparent; border:none; cursor:pointer; padding:5px;">
                            <i class="ri-close-circle-line" style="font-size:1.3em;"></i>
                        </button>
                    </div>`;
            });
        }
        html += `</div>`;

        // B) PARTIDOS DISPONIBLES
        html += `<div>`;
        html += `<h4 style="color:var(--text-muted); font-size:0.9em; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px;">DISPONIBLES (GLOBALES)</h4>`;
        
        if (available.length === 0) {
            html += '<p style="color:#666; font-size:0.85em;">No hay más partidos disponibles para agregar.</p>';
        } else {
            available.forEach(m => {
                const dateStr = new Date(m.match_date).toLocaleDateString(undefined, {day:'2-digit', month:'2-digit'});
                const compName = m.competition_name || 'Amistoso';
                
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg-input); margin-bottom:6px; border-radius:6px; border:1px solid var(--border);">
                        <div>
                            <div style="font-size:0.9em;">
                                <span style="color:#888; font-size:0.8em; margin-right:5px;">${dateStr}</span>
                                <strong>${m.team_home}</strong> <span style="color:#666">vs</span> <strong>${m.team_away}</strong>
                            </div>
                            <div style="font-size:0.75em; color:#666; margin-top:2px;">${compName}</div>
                        </div>
                        <button onclick="agregarPartido(${id}, ${m.match_id}, '${name}')" title="Agregar a la liga"
                            style="color:var(--accent); background:transparent; border:none; cursor:pointer; padding:5px;">
                            <i class="ri-add-circle-line" style="font-size:1.4em;"></i>
                        </button>
                    </div>`;
            });
        }
        html += `</div>`;

        container.innerHTML = html;

    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color:var(--danger); text-align:center;">Error al cargar datos.</p>';
    }
};

window.agregarPartido = async (lid, mid, name) => {
    // Feedback visual simple (opcional)
    await api.addMatchToLeague(lid, mid);
    abrirGestionMatches(lid, name); // Recargar modal para ver cambios
};

window.quitarPartido = async (lid, mid, name) => {
    if(!confirm('¿Quitar este partido de la liga? Se borrarán las predicciones asociadas de los miembros.')) return;
    await api.removeMatchFromLeague(lid, mid);
    abrirGestionMatches(lid, name); // Recargar modal
};

// ==========================================
// 3. RANKING DE LA LIGA
// ==========================================
window.verRankingLiga = async (id, name) => {
    const modal = document.getElementById('modalRanking');
    const tbody = document.getElementById('rankingBody');
    const title = document.getElementById('leagueTitleRanking');
    
    title.innerText = name;
    modal.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Cargando...</td></tr>';
    
    try {
        const ranking = await api.getLeagueDetails(id);
        tbody.innerHTML = '';
        
        if (!ranking || ranking.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#666;">Nadie ha sumado puntos aún.</td></tr>';
            return;
        }
        
        ranking.forEach((user, index) => {
            let iconHtml = `<span style="font-weight:bold; color:var(--text-muted); font-size:0.9em;">#${index + 1}</span>`;
            let rowBg = 'transparent';
            let nameColor = 'var(--text-main)';
            
            if (index === 0) { 
                iconHtml = `<i class="ri-trophy-fill" style="color: #FFD700; font-size: 1.2em;"></i>`; 
                rowBg = 'rgba(255, 215, 0, 0.05)';
                nameColor = '#FFD700';
            }
            else if (index === 1) iconHtml = `<i class="ri-trophy-fill" style="color: #C0C0C0;"></i>`;
            else if (index === 2) iconHtml = `<i class="ri-trophy-fill" style="color: #CD7F32;"></i>`;

            tbody.innerHTML += `
                <tr style="border-bottom:1px solid var(--border); background:${rowBg}">
                    <td style="padding:12px; text-align:center;">${iconHtml}</td>
                    <td style="padding:12px; font-weight:600; color: ${nameColor};">${user.username}</td>
                    <td style="padding:12px; text-align:right; color:var(--accent); font-weight:bold;">${user.total_points}</td>
                </tr>`;
        });
    } catch (e) { 
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Error al cargar ranking.</td></tr>'; 
    }
};

// ==========================================
// 4. UTILIDADES Y FORMULARIOS
// ==========================================
window.borrarLiga = async (id) => {
    if (!confirm('⚠️ PELIGRO: ¿Eliminar esta liga?\n\nSe borrarán todos los datos, miembros y predicciones asociadas a ella de forma permanente.')) return;
    try {
        const res = await api.deleteLeague(id);
        if (res.message) { 
            // Recargar la lista
            const me = await api.getProfile();
            cargarLigas(me ? me.user_id : null);
        } else { alert(res.error); }
    } catch (e) { alert('Error al conectar.'); }
};

window.salirLiga = async (id) => {
    if (!confirm('¿Seguro que quieres salirte de esta liga?')) return;
    try {
        const res = await api.leaveLeague(id);
        if (res.message) { 
            const me = await api.getProfile();
            cargarLigas(me ? me.user_id : null);
        } else { alert(res.error); }
    } catch (e) { alert('Error al conectar.'); }
};

function setupFormListeners() {
    const formCreate = document.getElementById('formCreate');
    if (formCreate) {
        formCreate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('league_name').value;
            try {
                const res = await api.createLeague({ name });
                if (res.message) {
                    alert(`¡Liga creada! Código: ${res.code}`);
                    window.toggleModal('modalCreate', false);
                    // Recargar
                    const me = await api.getProfile();
                    cargarLigas(me.user_id);
                } else { alert(res.error); }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    const formJoin = document.getElementById('formJoin');
    if (formJoin) {
        formJoin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('league_code').value;
            try {
                const res = await api.joinLeague({ code });
                if (res.message) {
                    alert(res.message);
                    window.toggleModal('modalJoin', false);
                    // Recargar
                    const me = await api.getProfile();
                    cargarLigas(me.user_id);
                } else { alert(res.error); }
            } catch (e) { alert('Error de conexión'); }
        });
    }
}