// ==========================================
// ESTADO DE LA APLICACIÓN (Contexto)
// ==========================================
let currentContext = 'global'; // 'global', 'competition', 'league'
let currentId = null;          // ID de la competición o de la liga
let currentUserLeagues = [];   // Para guardar info de mis ligas

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Sesión
    if (!sessionStorage.getItem('userToken')) {
        window.location.href = '/index.html';
        return;
    }

    // 2. Renderizar Pestañas (Global + Ligas Privadas)
    await renderTabs();

    // 3. Cargar datos iniciales
    cargarQuiniela();
});

// ==========================================
// LÓGICA DE PESTAÑAS
// ==========================================
async function renderTabs() {
    const container = document.getElementById('tabsContainer');
    if (!container) return; // Si no agregaste el div en el HTML aún

    try {
        currentUserLeagues = await api.getMyLeagues();
    } catch (e) {
        console.error("Error cargando ligas:", e);
    }

    let html = `
        <button class="filter-chip active" onclick="cambiarContexto('global', null, this)">
            🌎 Global
        </button>
        <button class="filter-chip" onclick="cambiarContexto('competition', 1, this)">
            🏆 Mundial Histórico
        </button>
        <div style="width:1px; background:#333; margin:0 5px;"></div>
    `;

    if (currentUserLeagues.length > 0) {
        currentUserLeagues.forEach(l => {
            html += `
                <button class="filter-chip" onclick="cambiarContexto('league', ${l.league_id}, this)">
                    🔒 ${l.name}
                </button>`;
        });
    } else {
        html += `<span style="font-size:0.8em; color:#666; padding:5px;">Sin ligas privadas</span>`;
    }

    container.innerHTML = html;
}

window.cambiarContexto = (type, id, btn) => {
    // Actualizar estilo visual
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Actualizar Estado
    currentContext = type;
    currentId = id;

    // Recargar datos
    cargarQuiniela();
};

// ==========================================
// CARGA DE PARTIDOS Y PREDICCIONES
// ==========================================
async function cargarQuiniela() {
    const container = document.getElementById('matchesContainer');
    container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">Cargando...</p>';

    try {
        let matches = [];
        let myPreds = [];

        // --- 1. DECIDIR QUÉ API LLAMAR SEGÚN CONTEXTO ---
        if (currentContext === 'league') {
            // MODO LIGA PRIVADA
            [matches, myPreds] = await Promise.all([
                api.getLeagueMatches(currentId),
                api.getLeagueMyPredictions(currentId)
            ]);
        } else {
            // MODO GLOBAL (O FILTRO COMPETICIÓN)
            // Si es 'competition', pasamos el ID como filtro
            const compFilter = currentContext === 'competition' ? currentId : null;
            
            [matches, myPreds] = await Promise.all([
                api.getMatches(compFilter),
                api.getMyPredictions()
            ]);
        }

        // --- 2. RENDERIZADO ---
        container.innerHTML = '';

        if (!matches || matches.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--text-muted);">
                    <i class="ri-ghost-line" style="font-size: 3em; margin-bottom: 10px; display:block; opacity: 0.5;"></i>
                    <p>No hay partidos activos en esta sección.</p>
                    ${currentContext === 'league' ? '<small>Pide al administrador de la liga que gestione la jornada.</small>' : ''}
                </div>`;
            return;
        }

        const now = new Date();

        matches.forEach(match => {
            // Buscar mi predicción para este partido
            const miPred = myPreds.find(p => p.match_id === match.match_id);
            const homeVal = miPred ? miPred.pred_home : '';
            const awayVal = miPred ? miPred.pred_away : '';
            const pts = miPred ? miPred.points : 0;

            // Datos visuales
            const matchDate = new Date(match.match_date);
            const dateStr = matchDate.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            const yaEmpezo = now >= matchDate;
            
            // Etiqueta de Torneo (Si existe)
            const torneoTag = match.competition_name 
                ? `<span style="font-size:0.7em; background:var(--bg-input); padding:2px 6px; border-radius:4px; margin-bottom:5px; display:inline-block; color:#aaa;">${match.competition_name}</span>` 
                : '';

            const card = document.createElement('div');
            card.className = 'match-card';

            let contenidoHTML = `
                ${torneoTag}
                <div style="font-size:0.8em; color: var(--text-muted); margin-bottom:10px;">${dateStr}</div>
                <div class="teams-row">
                    <span style="width:40%; text-align:right;">${match.team_home}</span>
                    <span class="vs-badge">VS</span>
                    <span style="width:40%; text-align:left;">${match.team_away}</span>
                </div>
            `;

            // CASO A: Partido Finalizado
            if (match.status === 'finished') {
                let pointsHtml = '';
                
                // Solo mostrar puntos si participé
                if (miPred) {
                    if (pts === 3) {
                        pointsHtml = `<div style="color:#00FFC0; font-weight:bold; font-size:0.9em;"><i class="ri-star-fill"></i> +3 Puntos</div>`;
                    } else if (pts === 1) {
                        pointsHtml = `<div style="color:#FFD700; font-weight:bold; font-size:0.9em;"><i class="ri-check-double-line"></i> +1 Punto</div>`;
                    } else {
                        pointsHtml = `<div style="color:var(--danger); font-size:0.9em;">0 Puntos</div>`;
                    }
                } else {
                    pointsHtml = `<div style="color:var(--text-muted); font-size:0.8em;">No jugado</div>`;
                }

                contenidoHTML += `
                    <div style="background:var(--bg-input); padding:10px; border-radius:8px; margin-top:10px; border:1px solid var(--border);">
                        <div style="color:var(--text-muted); font-size:0.75em; text-transform:uppercase;">Resultado Final</div>
                        <div class="final-score" style="font-size:1.4em; margin:5px 0;">${match.score_home} - ${match.score_away}</div>
                        <div style="font-size:0.9em; border-top:1px solid #333; padding-top:5px; margin-top:5px;">
                            <span style="color:#888;">Tú:</span> <strong>${homeVal !== '' ? homeVal : '-'} - ${awayVal !== '' ? awayVal : '-'}</strong>
                        </div>
                        <div style="margin-top:5px;">${pointsHtml}</div>
                    </div>`;
            }
            // CASO B: Partido En Juego / Tiempo Cumplido (Cerrado)
            else if (yaEmpezo) {
                contenidoHTML += `
                     <div style="background:rgba(255, 215, 0, 0.05); border:1px solid #555; padding:15px; border-radius:8px; margin-top:10px;">
                        <div style="color:#FFD700; font-weight:bold; font-size:0.85em; margin-bottom:5px; text-transform:uppercase;">
                            <i class="ri-lock-line"></i> Cerrado
                        </div>
                        <div style="color:var(--text-main); font-size:0.9em;">
                            Tu predicción: <strong>${homeVal !== '' ? homeVal : '-'}</strong> - <strong>${awayVal !== '' ? awayVal : '-'}</strong>
                        </div>
                    </div>`;
            }
            // CASO C: Partido Abierto (JUGAR)
            else {
                contenidoHTML += `
                    <div class="prediction-box">
                        <input type="number" class="pred-input" id="p_home_${match.match_id}" value="${homeVal}" min="0" placeholder="-">
                        <span style="font-weight:bold;">-</span>
                        <input type="number" class="pred-input" id="p_away_${match.match_id}" value="${awayVal}" min="0" placeholder="-">
                    </div>
                    <button onclick="procesarPrediccion(${match.match_id})" class="nav-btn" 
                        style="width:100%; margin-top:15px; background:var(--accent); color:#111;">
                        Guardar ${currentContext === 'league' ? '(Liga)' : ''}
                    </button>`;
            }

            card.innerHTML = contenidoHTML;
            container.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="color:var(--danger)">Error cargando datos.</p>';
    }
}

// ==========================================
// GUARDAR PREDICCIONES
// ==========================================
window.procesarPrediccion = async (matchId) => {
    const pred_home = document.getElementById(`p_home_${matchId}`).value;
    const pred_away = document.getElementById(`p_away_${matchId}`).value;

    if (pred_home === '' || pred_away === '') return alert('Ingresa ambos marcadores.');

    const btn = document.querySelector(`button[onclick="procesarPrediccion(${matchId})"]`);
    const originalText = btn.innerText;
    btn.innerText = '...';
    btn.disabled = true;

    try {
        let res;
        const data = {
            match_id: matchId,
            pred_home: parseInt(pred_home),
            pred_away: parseInt(pred_away)
        };

        // DECISIÓN CRÍTICA: ¿A DÓNDE LO MANDO?
        if (currentContext === 'league') {
            // Guardar en Tabla Privada (league_predictions)
            res = await api.saveLeaguePrediction(currentId, data);
        } else {
            // Guardar en Tabla Global (predictions)
            res = await api.savePrediction(data);
        }

        if (res.message) {
            // Feedback visual sutil
            btn.innerText = '¡Listo!';
            btn.style.background = 'var(--success)';
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = 'var(--accent)';
                btn.disabled = false;
            }, 1500);
        } else {
            alert('Error: ' + (res.error || 'No se pudo guardar'));
            btn.innerText = originalText;
            btn.disabled = false;
        }

    } catch (e) {
        alert('Error de conexión');
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// ==========================================
// RANKING DINÁMICO
// ==========================================
window.abrirRanking = async () => {
    const modal = document.getElementById('modalRanking');
    const tbody = document.getElementById('rankingBody');
    const title = modal.querySelector('h2'); // Título del modal

    modal.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">Calculando posiciones...</td></tr>';

    try {
        let data = [];
        
        // Si estoy en una liga, muestro SU ranking. Si no, el global.
        if (currentContext === 'league') {
            // Buscar el nombre de la liga actual para el título
            const ligaActual = currentUserLeagues.find(l => l.league_id === currentId);
            title.innerHTML = `<i class="ri-trophy-line"></i> Ranking: ${ligaActual ? ligaActual.name : 'Liga'}`;
            
            // Usar el endpoint que ya trae el ranking calculado de esa liga
            data = await api.getLeagueDetails(currentId); 

        } else {
            title.innerHTML = `<i class="ri-earth-line"></i> Ranking Global`;
            data = await api.getLeaderboard();
        }

        // Renderizar Tabla
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">Aún no hay puntajes.</td></tr>';
            return;
        }

        data.forEach((user, index) => {
            let iconHtml = `<span style="font-weight:bold; color:var(--text-muted); font-size:0.9em;">#${index + 1}</span>`;
            let rowBg = 'transparent';
            let nameColor = 'var(--text-main)';

            // Top 3 Styles
            if (index === 0) {
                iconHtml = `<i class="ri-trophy-fill" style="color: #FFD700; font-size: 1.4em;"></i>`;
                rowBg = 'rgba(255, 215, 0, 0.05)';
                nameColor = '#FFD700';
            } else if (index === 1) {
                iconHtml = `<i class="ri-trophy-fill" style="color: #C0C0C0; font-size: 1.2em;"></i>`;
            } else if (index === 2) {
                iconHtml = `<i class="ri-trophy-fill" style="color: #CD7F32; font-size: 1.1em;"></i>`;
            }

            const row = `
                <tr style="border-bottom:1px solid var(--border); background: ${rowBg};">
                    <td style="padding:12px; text-align:center; width: 50px;">${iconHtml}</td>
                    <td style="padding:12px; font-weight:600; color: ${nameColor};">
                        ${user.username}
                    </td>
                    <td style="padding:12px; text-align:right; color:var(--accent); font-weight:bold; font-size:1.1em;">
                        ${user.total_points} <span style="font-size:0.7em; color:var(--text-muted); font-weight:400;">pts</span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Error al cargar ranking.</td></tr>';
    }
};