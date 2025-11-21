document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('leaguesContainer');
    const token = sessionStorage.getItem('userToken');
    if (!token) return;

    // 1. CARGAR MIS LIGAS
    await cargarLigas();

    async function cargarLigas() {
        try {
            const leagues = await api.getMyLeagues();
            
            container.innerHTML = '';
            
            if (leagues.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding: 40px; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 8px;">
                        <i class="ri-trophy-line" style="font-size: 3em; margin-bottom: 10px; display:block;"></i>
                        <p>No estás en ninguna liga aún.</p>
                        <button onclick="abrirModalCrear()" style="margin-top:10px; background:transparent; color:var(--accent); border:none; cursor:pointer; font-weight:bold;">Crear una ahora</button>
                    </div>
                `;
                return;
            }

            leagues.forEach(l => {
                // Tarjeta de Liga
                const card = document.createElement('div');
                card.style = "background: var(--bg-input); padding: 20px; border-radius: 8px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;";
                
                card.innerHTML = `
                    <div>
                        <h3 style="margin:0; color:var(--text-main); font-size:1.1em;">${l.name}</h3>
                        <div style="color:var(--text-muted); font-size:0.85em; margin-top:5px;">
                            Código: <strong style="color:var(--accent); letter-spacing:1px;">${l.code}</strong>
                        </div>
                        <div style="color:var(--text-muted); font-size:0.75em; margin-top:2px;">
                            <i class="ri-group-line"></i> ${l.members_count} miembros
                        </div>
                    </div>
                    <button onclick="verRankingLiga(${l.league_id}, '${l.name}')" class="action-btn" style="background:var(--bg-card); border:1px solid var(--border); width:40px; height:40px; border-radius:50%;">
                        <i class="ri-arrow-right-s-line"></i>
                    </button>
                `;
                container.appendChild(card);
            });

        } catch (e) {
            console.error(e);
            container.innerHTML = '<p class="text-center">Error al cargar ligas.</p>';
        }
    }

    // 2. CREAR LIGA
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
                    cargarLigas(); // Recargar lista
                } else {
                    alert(res.error || 'Error al crear');
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }

    // 3. UNIRSE A LIGA
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
                    cargarLigas(); // Recargar lista
                } else {
                    alert(res.error || 'Código incorrecto o ya estás unido.');
                }
            } catch (e) { alert('Error de conexión'); }
        });
    }
});

// --- GLOBALES ---
window.abrirModalCrear = () => window.toggleModal('modalCreate', true);
window.abrirModalUnirse = () => window.toggleModal('modalJoin', true);

window.verRankingLiga = async (id, name) => {
    const modal = document.getElementById('modalRanking');
    const tbody = document.getElementById('rankingBody');
    const title = document.getElementById('leagueTitleRanking');

    title.innerText = name;
    modal.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';

    try {
        const ranking = await api.getLeagueDetails(id);
        
        tbody.innerHTML = '';
        if (!ranking || ranking.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">Sin datos.</td></tr>';
            return;
        }

        ranking.forEach((user, index) => {
            let iconHtml = `<span style="font-weight:bold; color:var(--text-muted); font-size:0.9em;">#${index + 1}</span>`;
            let rowBg = 'transparent';

            if (index === 0) { 
                iconHtml = `<i class="ri-trophy-fill" style="color: #FFD700; font-size: 1.2em;"></i>`;
                rowBg = 'rgba(255, 215, 0, 0.05)';
            } else if (index === 1) {
                iconHtml = `<i class="ri-trophy-fill" style="color: #C0C0C0;"></i>`;
            } else if (index === 2) {
                iconHtml = `<i class="ri-trophy-fill" style="color: #CD7F32;"></i>`;
            }

            tbody.innerHTML += `
                <tr style="border-bottom:1px solid var(--border); background:${rowBg}">
                    <td style="padding:12px; text-align:center;">${iconHtml}</td>
                    <td style="padding:12px; font-weight:600;">${user.username}</td>
                    <td style="padding:12px; text-align:right; color:var(--accent); font-weight:bold;">${user.total_points}</td>
                </tr>
            `;
        });

    } catch (e) { alert('Error al cargar ranking'); }
};