/* COMPONENTES VISUALES: PERFIL
   --------------------------------------------------------------
   Genera HTML para listas de historial y tickets.
*/
import { formatDateShort } from '../utils/dom.js';

export const TicketItem = (req) => {
    const statusColor = req.admin_response ? 'var(--success)' : 'var(--text-muted)';
    return `
        <div style="background:var(--bg-input); padding:15px; border-radius:8px; margin-bottom:10px; border:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-weight:bold; color:var(--accent); text-transform:uppercase;">${req.type}</span>
                <span style="font-size:0.8em; color:var(--text-muted);">${formatDateShort(req.created_at)}</span>
            </div>
            <p style="color:var(--text-main); margin-bottom:10px;">${req.message}</p>
            ${req.admin_response ? 
                `<div style="border-left:3px solid var(--accent); padding-left:10px; margin-top:10px;">
                    <small style="color:var(--accent)">Respuesta Staff:</small>
                    <p style="color:var(--text-muted); font-size:0.9em;">${req.admin_response}</p>
                 </div>` 
                : '<small style="color:var(--text-muted)">Esperando respuesta...</small>'}
        </div>
    `;
};

export const PointHistoryItem = (h) => {
    let badge = '';
    if (h.points === 3) badge = '<span class="badge-points perfect">+3 🎯</span>';
    else if (h.points === 1) badge = '<span class="badge-points hit">+1 ✅</span>';
    else badge = '<span class="badge-points miss">0 ❌</span>';

    return `
        <div style="background:var(--bg-input); padding:10px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border);">
            <div>
                <div style="font-weight:600; font-size:0.9em;">${h.team_home} vs ${h.team_away}</div>
                <div style="font-size:0.8em; color:var(--text-muted);">Real: ${h.score_home}-${h.score_away} | Tú: ${h.pred_home}-${h.pred_away}</div>
            </div>
            <div>${badge}</div>
        </div>
    `;
};