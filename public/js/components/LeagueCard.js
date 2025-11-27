/* COMPONENTE VISUAL: TARJETA DE LIGA
   --------------------------------------------------------------
   Este archivo SOLO retorna strings de HTML. No tiene lógica.
   ¡CUIDADO!: Los eventos `onclick` apuntan a `window.controllers`.
   Si cambias el nombre del controlador en /js/controllers/, 
   estos botones dejarán de funcionar.
*/

export function LeagueCard(league, currentUserId) {
    const isAdmin = (league.admin_id === currentUserId);
    
    // Definimos qué botones mostrar según si soy admin o no
    let actionsHtml = '';
    
    if (isAdmin) {
        actionsHtml = `
            <button class="btn-icon-small edit" onclick="window.controllers.leagues.openManage(${league.league_id}, '${league.name}')" title="Gestionar Partidos">
                <i class="ri-settings-3-line"></i>
            </button>
            <button class="btn-icon-small delete" onclick="window.controllers.leagues.deleteLeague(${league.league_id})" title="Eliminar Liga">
                <i class="ri-delete-bin-line"></i>
            </button>
        `;
    } else {
        actionsHtml = `
            <button class="btn-icon-small delete" onclick="window.controllers.leagues.leaveLeague(${league.league_id})" title="Salir de la Liga">
                <i class="ri-logout-box-r-line"></i>
            </button>
        `;
    }

    // Retornamos el HTML limpio
    return `
        <div class="league-card" id="league-${league.league_id}">
            <div class="league-info">
                <h3>
                    ${league.name} 
                    ${isAdmin ? '<span class="league-badge-admin">ADMIN</span>' : ''}
                </h3>
                <div class="league-code-box">
                    Código: <span class="league-code" onclick="navigator.clipboard.writeText('${league.code}'); alert('¡Código copiado!')" title="Copiar">${league.code} <i class="ri-file-copy-line"></i></span>
                </div>
                <div class="league-members">
                    <i class="ri-group-line"></i> ${league.members_count} miembro(s)
                </div>
            </div>
            
            <div class="action-btn-group">
                ${actionsHtml}
                <button class="btn-icon-small arrow" onclick="window.controllers.leagues.showRanking(${league.league_id}, '${league.name}')" title="Ver Ranking">
                    <i class="ri-arrow-right-s-line"></i>
                </button>
            </div>
        </div>
    `;
}