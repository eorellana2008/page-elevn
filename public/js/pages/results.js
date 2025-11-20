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
            const card = document.createElement('div');
            card.className = 'match-card';
            const dateStr = new Date(match.match_date).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

            let contenidoHTML = `
                <div style="font-size:0.8em; color:#aaa; margin-bottom:10px;">${dateStr}</div>
                <div class="teams-row">
                    <span>${match.team_home}</span>
                    <span class="vs-badge">VS</span>
                    <span>${match.team_away}</span>
                </div>
            `;

            if (match.status === 'finished') {
                // PARTIDO FINALIZADO: Muestra resultados y puntos
                let pointsHtml = '<span style="color:#FF6347; font-size:0.8em;">No participaste</span>';
                if (miPred) {
                    const pts = miPred.points;
                    let color = '#667eea'; // Default (Error)
                    let texto = 'Error';
                    if (pts === 3) { color = '#00FFC0'; texto = '+3 Pts 🎯'; }
                    else if (pts === 1) { color = '#FFD700'; texto = '+1 Pt ✅'; }
                    else if (pts === 0) { color = '#FF6347'; texto = '0 Pts ❌'; }

                    pointsHtml = `<span style="background:${color}; color:${pts === 1 ? '#121212' : 'white'}; padding:4px 10px; border-radius:10px; font-weight:bold; font-size:0.9em; text-shadow: 0 0 5px #000;">${texto}</span>`;
                }

                contenidoHTML += `
                    <div style="background:#222; padding:10px; border-radius:8px;">
                        <div style="color:#888; font-size:0.8em;">Resultado Final</div>
                        <div class="final-score">${match.score_home} - ${match.score_away}</div>
                        <div style="border-top:1px solid #444; margin-top:5px; padding-top:10px;">
                            <small style="color:#ccc;">Tu predicción: <b>${homeVal !== '' ? homeVal : '?'} - ${awayVal !== '' ? awayVal : '?'}</b></small><br><br>
                            ${pointsHtml}
                        </div>
                    </div>
                `;
            } else {
                // PARTIDO PENDIENTE: Muestra inputs
                contenidoHTML += `
                    <div class="prediction-box">
                        <input type="number" class="pred-input" id="p_home_${match.match_id}" value="${homeVal}" min="0">
                        <span style="font-weight:bold;">-</span>
                        <input type="number" class="pred-input" id="p_away_${match.match_id}" value="${awayVal}" min="0">
                    </div>
                    <button onclick="guardarPrediccion(${match.match_id})" class="nav-btn" style="width:100%; margin-top:15px; background:#00FFC0; color:black;">
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

// FUNCIÓN PARA RANKING
window.abrirRanking = async () => {
    const token = sessionStorage.getItem('userToken');
    const modal = document.getElementById('modalRanking');
    const tbody = document.getElementById('rankingBody');

    modal.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#aaa;">Cargando...</td></tr>';

    try {
        const res = await fetch('/api/users/leaderboard', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#aaa;">Aún no hay puntajes.</td></tr>';
            return;
        }

        data.forEach((user, index) => {
            let medalla = '';
            if (index === 0) medalla = '🥇';
            else if (index === 1) medalla = '🥈';
            else if (index === 2) medalla = '🥉';

            const row = `
                <tr style="border-bottom:1px solid #333;">
                    <td style="padding:10px;">${index + 1} ${medalla}</td>
                    <td style="font-weight:bold;">${user.username}</td>
                    <td style="text-align:right; color:#00FFC0; font-weight:bold;">${user.total_points}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (e) { tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Error al cargar ranking.</td></tr>'; }
};