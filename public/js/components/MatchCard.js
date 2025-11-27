/* COMPONENTE VISUAL: TARJETA DE PARTIDO (ICONOS MINIMALISTAS) */
import { getAvatarColor, formatDateShort } from '../utils/dom.js';

export function MatchCard(match, prediction, contextLabel = 'Global') {
    const homeVal = prediction ? prediction.pred_home : '';
    const awayVal = prediction ? prediction.pred_away : '';
    const pts = prediction ? prediction.points : 0;

    const dateStr = formatDateShort(match.match_date);
    const colorHome = getAvatarColor(match.team_home);
    const colorAway = getAvatarColor(match.team_away);
    const isFinished = match.status === 'finished';
    const isLocked = !isFinished && new Date() >= new Date(match.match_date);

    const roundHtml = match.match_round ? `<span style="background:var(--bg-input); color:var(--text-main); padding:2px 6px; border-radius:4px; font-size:0.75em; font-weight:bold; border:1px solid var(--border); margin-left:5px;">${match.match_round}</span>` : '';
    const compHtml = match.competition_name ? `<span style="background:var(--accent); color:#000; padding:2px 6px; border-radius:4px; font-size:0.75em; font-weight:bold;">${match.competition_name}</span>` : '';

    const teamsHtml = `
        <div class="teams-display">
            <div class="team-item">
                <div class="team-avatar" style="border-color:${colorHome}; color:${colorHome}">${match.team_home.charAt(0)}</div>
                <span class="team-name">${match.team_home}</span>
            </div>
            <div class="vs-divider">VS</div>
            <div class="team-item">
                <div class="team-avatar" style="border-color:${colorAway}; color:${colorAway}">${match.team_away.charAt(0)}</div>
                <span class="team-name">${match.team_away}</span>
            </div>
        </div>
    `;

    if (isFinished) {
        let ptsBadge = '<span class="badge-points none">No jugado</span>';
        if (prediction) {
            // CAMBIO: Iconos Remix
            if (pts === 3) ptsBadge = '<span class="badge-points perfect"><i class="ri-star-fill"></i> +3 Pts (Pleno)</span>';
            else if (pts === 1) ptsBadge = '<span class="badge-points hit"><i class="ri-check-line"></i> +1 Pt (Acierto)</span>';
            else ptsBadge = '<span class="badge-points miss"><i class="ri-close-line"></i> 0 Pts</span>';
        }
        return `
            <div class="match-card">
                <div class="match-header"><span>${dateStr}</span> <div>${compHtml}${roundHtml}</div></div>
                <div class="match-body">
                    ${teamsHtml}
                    <div class="match-footer" style="text-align:center; margin-top:15px; border-top:1px solid #333; padding-top:10px;">
                        <div style="font-size:1.5em; font-weight:bold; letter-spacing:2px; color:#fff;">${match.score_home} - ${match.score_away}</div>
                        <div style="color:#888; font-size:0.85em; margin:5px 0;">Tú: <b>${homeVal !== '' ? homeVal : '-'}</b> - <b>${awayVal !== '' ? awayVal : '-'}</b></div>
                        <div>${ptsBadge}</div>
                    </div>
                </div>
            </div>`;
    }

    if (isLocked) {
        return `
            <div class="match-card">
                <div class="match-header"><span>${dateStr}</span> <div>${compHtml}${roundHtml}</div></div>
                <div class="match-body">
                    ${teamsHtml}
                    <div class="score-inputs-row" style="opacity: 0.6;">
                        <div class="score-input-modern" style="display:flex; align-items:center; justify-content:center; font-size:1.5em; border-style:dashed;">${homeVal !== '' ? homeVal : '-'}</div>
                        <div class="score-input-modern" style="display:flex; align-items:center; justify-content:center; font-size:1.5em; border-style:dashed;">${awayVal !== '' ? awayVal : '-'}</div>
                    </div>
                </div>
                <div class="status-closed"><i class="ri-lock-line"></i> Cerrado</div>
            </div>`;
    }

    return `
        <div class="match-card">
            <div class="match-header"><span>${dateStr}</span> <div>${compHtml}${roundHtml}</div></div>
            <div class="match-body">
                ${teamsHtml}
                <div class="score-inputs-row">
                    <input type="number" id="ph_${match.match_id}" value="${homeVal}" class="score-input-modern" placeholder="-" min="0">
                    <input type="number" id="pa_${match.match_id}" value="${awayVal}" class="score-input-modern" placeholder="-" min="0">
                </div>
            </div>
            <button onclick="window.controllers.results.savePrediction(${match.match_id})" class="btn-predict">Guardar ${contextLabel}</button>
        </div>`;
}