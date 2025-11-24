// ==========================================
// ESTADO DE LA APLICACIÓN
// ==========================================
let currentContext = 'global'; // 'global', 'competition', 'league'
let currentId = null;
let currentUserLeagues = [];
const ID_MUNDIAL_HISTORICO = 1; // Para excluirlo de las pestañas activas

// ==========================================
// HELPER: COLORES ESCUDOS (Visual)
// ==========================================
function getAvatarColor(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#2EC4B6', '#6A0572', '#AB83A1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Sesión
    if (!sessionStorage.getItem('userToken')) {
        window.location.href = '/index.html';
        return;
    }

    // 2. Cargar Pestañas y Quiniela Inicial
    await renderTabs();
    cargarQuiniela();
});

// ==========================================
// PESTAÑAS DINÁMICAS
// ==========================================
async function renderTabs() {
    const container = document.getElementById('tabsContainer');
    if (!container) return;

    try {
        // 1. Obtener Mis Ligas Privadas
        currentUserLeagues = await api.getMyLeagues();
        // 2. Obtener Competiciones Públicas (Champions, Premier, etc.)
        const allComps = await api.getCompetitions();

        let html = `
            <button class="filter-chip active" onclick="cambiarContexto('global', null, this)">
                🌎 Global
            </button>
        `;

        // AGREGAR COMPETICIONES PÚBLICAS (Excluyendo Mundial Histórico)
        if (allComps && allComps.length > 0) {
            allComps.forEach(c => {
                if (c.competition_id !== ID_MUNDIAL_HISTORICO) {
                    html += `
                    <button class="filter-chip" onclick="cambiarContexto('competition', ${c.competition_id}, this)">
                        🏆 ${c.name}
                    </button>`;
                }
            });
        }

        html += `<div style="width:1px; background:#333; margin:0 5px;"></div>`;

        // AGREGAR LIGAS PRIVADAS
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
    } catch (e) { console.error(e); }
}

window.cambiarContexto = (type, id, btn) => {
    // Actualizar estilo visual de botones
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Actualizar Estado
    currentContext = type;
    currentId = id;

    // Recargar datos
    cargarQuiniela();
};

// ==========================================
// CARGA DE PARTIDOS (Visual 2.0)
// ==========================================
async function cargarQuiniela() {
    const container = document.getElementById('matchesContainer');
    container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">Cargando...</p>';

    try {
        let matches = [];
        let myPreds = [];

        // --- DECIDIR API SEGÚN CONTEXTO ---
        if (currentContext === 'league') {
            // MODO LIGA PRIVADA
            [matches, myPreds] = await Promise.all([
                api.getLeagueMatches(currentId),
                api.getLeagueMyPredictions(currentId)
            ]);
        } else {
            // MODO GLOBAL O COMPETICIÓN
            const compFilter = currentContext === 'competition' ? currentId : null;
            [matches, myPreds] = await Promise.all([
                api.getMatches(compFilter),
                api.getMyPredictions()
            ]);
        }

        // --- RENDERIZADO ---
        container.innerHTML = '';

        if (!matches || matches.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--text-muted);">
                    <i class="ri-ghost-line" style="font-size: 3em; margin-bottom: 10px; display:block; opacity: 0.5;"></i>
                    <p>No hay partidos en esta sección.</p>
                    ${currentContext === 'league' ? '<small>Pide al administrador de la liga que gestione la jornada.</small>' : ''}
                </div>`;
            return;
        }

        const now = new Date();

        matches.forEach(match => {
            // Datos Predicción
            const miPred = myPreds.find(p => p.match_id === match.match_id);
            const homeVal = miPred ? miPred.pred_home : '';
            const awayVal = miPred ? miPred.pred_away : '';
            const pts = miPred ? miPred.points : 0;

            // Datos Fecha
            const matchDate = new Date(match.match_date);
            const dateStr = matchDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
                ' - ' + matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            const yaEmpezo = now >= matchDate;

            // Datos Visuales (Escudos Generados)
            const homeInitial = match.team_home.charAt(0);
            const awayInitial = match.team_away.charAt(0);
            const colorHome = getAvatarColor(match.team_home);
            const colorAway = getAvatarColor(match.team_away);

            // Info Fase/Jornada (Si existe)
            const roundInfo = match.match_round
                ? `<span style="background:var(--bg-input); color:var(--text-main); padding:2px 8px; border-radius:4px; font-size:0.8em; margin-left:5px; font-weight:bold;">${match.match_round}</span>`
                : '';

            const card = document.createElement('div');
            card.className = 'match-card';

            // --- ESTRUCTURA HTML ---
            let contenidoHTML = `
                <div class="match-header">
                    <span><i class="ri-calendar-event-line"></i> ${dateStr}</span>
                    <div>
                        ${match.competition_name ? `<span class="tournament-badge">${match.competition_name}</span>` : ''}
                        ${roundInfo}
                    </div>
                </div>

                <div class="match-body">
                    <div class="teams-display">
                        <div class="team-item">
                            <div class="team-avatar" style="border-color: ${colorHome}; color: ${colorHome};">
                                ${homeInitial}
                            </div>
                            <span class="team-name">${match.team_home}</span>
                        </div>

                        <div class="vs-divider">VS</div>

                        <div class="team-item">
                            <div class="team-avatar" style="border-color: ${colorAway}; color: ${colorAway};">
                                ${awayInitial}
                            </div>
                            <span class="team-name">${match.team_away}</span>
                        </div>
                    </div>
            `;

            // --- ESTADOS DEL PARTIDO ---

            // CASO A: FINALIZADO
            if (match.status === 'finished') {
                let pointsBadge = '';
                if (miPred) {
                    if (pts === 3) pointsBadge = `<span style="color:#00FFC0; font-size:0.85em; font-weight:bold;">★ +3 Pts (Pleno)</span>`;
                    else if (pts === 1) pointsBadge = `<span style="color:#FFD700; font-size:0.85em; font-weight:bold;">✓ +1 Pt (Acierto)</span>`;
                    else pointsBadge = `<span style="color:var(--danger); font-size:0.85em;">✗ 0 Pts</span>`;
                } else {
                    pointsBadge = `<span style="color:var(--text-muted); font-size:0.8em;">No jugado</span>`;
                }

                contenidoHTML += `
                    <div style="text-align:center; margin-top:15px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:0.7em; color:#666; text-transform:uppercase; letter-spacing:1px;">Resultado Final</div>
                        <div class="final-result-display">
                            ${match.score_home} - ${match.score_away}
                        </div>
                        <div style="font-size:0.85em; color:var(--text-muted); margin-bottom:5px;">
                            Tú: <b>${homeVal !== '' ? homeVal : '-'}</b> - <b>${awayVal !== '' ? awayVal : '-'}</b>
                        </div>
                        <div>${pointsBadge}</div>
                    </div>
                </div>`;
            }
            // CASO B: CERRADO (En Juego)
            else if (yaEmpezo) {
                contenidoHTML += `
                    <div style="text-align:center; margin-top:10px;">
                        <div class="score-inputs-row" style="opacity:0.7;">
                            <div class="score-input-modern" style="display:flex; align-items:center; justify-content:center; font-size:1.5em; border-style:dashed; cursor:not-allowed;">
                                ${homeVal !== '' ? homeVal : '-'}
                            </div>
                            <div class="score-input-modern" style="display:flex; align-items:center; justify-content:center; font-size:1.5em; border-style:dashed; cursor:not-allowed;">
                                ${awayVal !== '' ? awayVal : '-'}
                            </div>
                        </div>
                    </div>
                </div> <div class="status-closed">
                    <i class="ri-lock-line"></i> Predicciones Cerradas
                </div>`;
            }
            // CASO C: ABIERTO (Jugar)
            else {
                contenidoHTML += `
                    <div class="score-inputs-row">
                        <input type="number" id="p_home_${match.match_id}" value="${homeVal}" class="score-input-modern" placeholder="-" min="0">
                        <input type="number" id="p_away_${match.match_id}" value="${awayVal}" class="score-input-modern" placeholder="-" min="0">
                    </div>
                </div> <button onclick="procesarPrediccion(${match.match_id})" class="btn-predict">
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
    const originalBg = btn.style.background;

    btn.innerText = '...';
    btn.style.background = 'var(--text-muted)';
    btn.disabled = true;

    try {
        let res;
        const data = {
            match_id: matchId,
            pred_home: parseInt(pred_home),
            pred_away: parseInt(pred_away)
        };

        // Lógica Doble Tabla (Privada vs Global)
        if (currentContext === 'league') {
            res = await api.saveLeaguePrediction(currentId, data);
        } else {
            res = await api.savePrediction(data);
        }

        if (res.message) {
            // Feedback Visual Éxito
            btn.innerText = '¡Listo!';
            btn.style.background = 'var(--success)';
            btn.style.color = '#000';

            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = '';
                btn.style.color = '';
                btn.disabled = false;
            }, 2000);
        } else {
            alert('Error: ' + (res.error || 'No se pudo guardar'));
            btn.innerText = originalText;
            btn.style.background = originalBg;
            btn.disabled = false;
        }

    } catch (e) {
        alert('Error de conexión');
        btn.innerText = originalText;
        btn.style.background = originalBg;
        btn.disabled = false;
    }
};

// ==========================================
// RANKING DINÁMICO
// ==========================================
window.abrirRanking = async () => {
    const modal = document.getElementById('modalRanking');
    const tbody = document.getElementById('rankingBody');
    const title = modal.querySelector('h2');

    modal.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">Calculando posiciones...</td></tr>';

    try {
        let data = [];

        if (currentContext === 'league') {
            // Ranking de la Liga Privada
            const ligaActual = currentUserLeagues.find(l => l.league_id === currentId);
            title.innerHTML = `<i class="ri-trophy-line"></i> Ranking: ${ligaActual ? ligaActual.name : 'Liga'}`;
            data = await api.getLeagueDetails(currentId);
        } else {
            // Ranking Global (para Global y Competiciones)
            title.innerHTML = `<i class="ri-earth-line"></i> Ranking Global`;
            data = await api.getLeaderboard();
        }

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">Aún no hay puntajes.</td></tr>';
            return;
        }

        data.forEach((user, index) => {
            let iconHtml = `<span style="font-weight:bold; color:var(--text-muted); font-size:0.9em;">#${index + 1}</span>`;
            let rowBg = 'transparent';
            let nameColor = 'var(--text-main)';

            // Estilos Top 3
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