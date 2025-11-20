document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('userToken');
    const container = document.getElementById('matchesContainer');
    if (!token) return;

    try {
        // Pedimos partidos y predicciones al mismo tiempo
        const [matches, myPreds] = await Promise.all([
            api.getMatches(token),
            fetch('/api/predictions/my', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);

        container.innerHTML = '';
        if (matches.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#aaa;">No hay partidos programados.</p>';
            return;
        }

        matches.forEach(match => {
            const miPred = myPreds.find(p => p.match_id === match.match_id);
            const homeVal = miPred ? miPred.pred_home : '';
            const awayVal = miPred ? miPred.pred_away : '';

            // CÁLCULO DE TIEMPO (NUEVO)
            const now = new Date();
            const matchDate = new Date(match.match_date);
            const yaEmpezo = now >= matchDate; // True si ya pasó la hora

            const card = document.createElement('div');
            card.className = 'match-card';
            const dateStr = matchDate.toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

            let contenidoHTML = `
                <div style="font-size:0.8em; color: var(--text-muted); margin-bottom:10px;">${dateStr}</div>
                <div class="teams-row">
                    <span>${match.team_home}</span>
                    <span class="vs-badge">VS</span>
                    <span>${match.team_away}</span>
                </div>
            `;

            // CASO 1: Partido Finalizado (MEJORADO)
            if (match.status === 'finished') {
                // Diseño por defecto (No participaste)
                let pointsHtml = `
                    <div style="display:flex; align-items:center; gap:5px; color:var(--text-muted); font-size:0.85em; background:var(--bg-input); padding:5px 10px; border-radius:6px; width:fit-content;">
                        <i class="ri-prohibited-line"></i> No participaste
                    </div>`;

                if (miPred) {
                    const pts = miPred.points;

                    if (pts === 3) {
                        // PLENO (3 Puntos) - Verde Brillante
                        pointsHtml = `
                        <div style="background: rgba(0, 255, 192, 0.15); color: #00FFC0; border: 1px solid #00FFC0; padding: 6px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; font-weight: bold; font-size: 0.9em;">
                            <i class="ri-star-fill"></i> +3 Puntos
                        </div>`;
                    }
                    else if (pts === 1) {
                        // ACIERTO (1 Punto) - Dorado/Amarillo
                        pointsHtml = `
                        <div style="background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid #FFD700; padding: 6px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; font-weight: bold; font-size: 0.9em;">
                            <i class="ri-check-double-line"></i> +1 Punto
                        </div>`;
                    }
                    else {
                        // FALLO (0 Puntos) - Rojo
                        pointsHtml = `
                        <div style="background: rgba(252, 129, 129, 0.15); color: var(--danger); border: 1px solid var(--danger); padding: 6px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; font-weight: bold; font-size: 0.9em;">
                            <i class="ri-close-circle-line"></i> 0 Puntos
                        </div>`;
                    }
                }

                contenidoHTML += `
                    <div style="background:var(--bg-input); padding:15px; border-radius:8px; margin-top:10px; border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <div style="color:var(--text-muted); font-size:0.75em; text-transform:uppercase; letter-spacing:1px;">Resultado Final</div>
                            <div class="final-score" style="font-size:1.2em; margin:0;">${match.score_home} - ${match.score_away}</div>
                        </div>
                        
                        <div style="border-top:1px solid var(--border); padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
                            <div style="font-size:0.9em;">
                                <span style="color:var(--text-muted);">Tu pronóstico:</span> 
                                <strong style="color:var(--text-main); margin-left:5px;">${homeVal !== '' ? homeVal : '-'} - ${awayVal !== '' ? awayVal : '-'}</strong>
                            </div>
                            ${pointsHtml}
                        </div>
                    </div>
                `;
            }
            // CASO 2: Partido En Juego / Tiempo Cumplido (NUEVO)
            else if (yaEmpezo) {
                contenidoHTML += `
                     <div style="background:rgba(255, 215, 0, 0.1); border:1px solid #FFD700; padding:15px; border-radius:8px; margin-top:10px;">
                        <div style="color:#FFD700; font-weight:bold; font-size:0.9em; margin-bottom:5px;">
                            <i class="ri-time-line"></i> APUESTAS CERRADAS
                        </div>
                        <div style="color:var(--text-main); font-size:0.9em;">
                            Tu predicción: <strong>${homeVal !== '' ? homeVal : '-'}</strong> vs <strong>${awayVal !== '' ? awayVal : '-'}</strong>
                        </div>
                    </div>
                `;
            }
            // CASO 3: Partido Pendiente (Se puede apostar)
            else {
                contenidoHTML += `
                    <div class="prediction-box">
                        <input type="number" class="pred-input" id="p_home_${match.match_id}" value="${homeVal}" min="0" placeholder="-">
                        <span style="font-weight:bold;">-</span>
                        <input type="number" class="pred-input" id="p_away_${match.match_id}" value="${awayVal}" min="0" placeholder="-">
                    </div>
                    <button onclick="guardarPrediccion(${match.match_id})" class="nav-btn" style="width:100%; margin-top:15px; background:var(--accent); color:#111;">
                        Guardar
                    </button>
                `;
            }

            card.innerHTML = contenidoHTML;
            container.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p>Error cargando la quiniela.</p>';
    }
});

// FUNCIÓN PARA GUARDAR PREDICCIÓN
window.guardarPrediccion = async (matchId) => {
    const token = sessionStorage.getItem('userToken');
    const pred_home = document.getElementById(`p_home_${matchId}`).value;
    const pred_away = document.getElementById(`p_away_${matchId}`).value;

    if (pred_home === '' || pred_away === '') return alert('Ingresa ambos marcadores.');

    try {
        const res = await fetch('/api/predictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ match_id: matchId, pred_home: parseInt(pred_home), pred_away: parseInt(pred_away) })
        });
        const data = await res.json();
        if (res.ok) alert('✅ Pronóstico guardado');
        else alert('Error: ' + data.error);
    } catch (e) { alert('Error de conexión'); }
};

// FUNCIÓN PARA RANKING MEJORADO
window.abrirRanking = async () => {
    const token = sessionStorage.getItem('userToken');
    // Obtenemos el nombre del usuario actual para resaltarlo en la tabla
    const currentUserName = document.getElementById('profileName') ? document.getElementById('profileName').textContent : '';

    const modal = document.getElementById('modalRanking');
    const tbody = document.getElementById('rankingBody');

    modal.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">Cargando cracks...</td></tr>';

    try {
        const res = await fetch('/api/users/leaderboard', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">Aún no hay puntajes.</td></tr>';
            return;
        }

        data.forEach((user, index) => {
            let iconHtml = `<span style="font-weight:bold; color:var(--text-muted); font-size:0.9em;">#${index + 1}</span>`;
            let rowBg = 'transparent';
            let nameColor = 'var(--text-main)';

            // TOP 3: Iconos de Trofeo con Colores
            if (index === 0) { // ORO
                iconHtml = `<i class="ri-trophy-fill" style="color: #FFD700; font-size: 1.4em;"></i>`;
                rowBg = 'rgba(255, 215, 0, 0.05)'; // Fondo dorado muy suave
            } else if (index === 1) { // PLATA
                iconHtml = `<i class="ri-trophy-fill" style="color: #C0C0C0; font-size: 1.2em;"></i>`;
            } else if (index === 2) { // BRONCE
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