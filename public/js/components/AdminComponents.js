/* COMPONENTES VISUALES: ADMIN PANEL
   --------------------------------------------------------------
   Genera filas de tabla para Usuarios, Partidos y Solicitudes.
*/
import { formatDateShort } from '../utils/dom.js';

// FILA DE USUARIO
export const UserRow = (u) => {
    // Colores de Rol
    const roleColors = {
        'superadmin': '#FFD700',
        'admin': '#FF4500',
        'moderator': '#4FD1C5',
        'user': 'var(--text-muted)'
    };

    // Formato de Ubicación (Recuperado)
    const locationText = u.country_name
        ? `${u.country_name} <small style="opacity:0.7">(${u.country_code})</small>`
        : '<span style="opacity:0.3">Sin datos</span>';

    // Avatar o Inicial
    const avatarHtml = `<div class="avatar" style="display:inline-flex; width:25px; height:25px; border-radius:50%; background:#333; align-items:center; justify-content:center; font-size:0.7em; margin-right:8px;">${u.username.charAt(0).toUpperCase()}</div>`;

    return `
        <tr>
            <td style="color:#666; font-size:0.8em;">#${u.user_id}</td>
            <td>
                <div style="display:flex; align-items:center;">
                    ${avatarHtml}
                    <span style="font-weight:600; color:var(--text-main);">${u.username}</span>
                </div>
            </td>
            <td style="font-size:0.9em;">${u.email}</td>
            <td style="font-size:0.9em;">${locationText}</td>
            <td>
                <span style="color:${roleColors[u.role] || '#fff'}; font-weight:bold; text-transform:uppercase; font-size:0.75em; border:1px solid ${roleColors[u.role]}; padding:2px 6px; border-radius:4px;">
                    ${u.role}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-icon-small edit" onclick="window.controllers.admin.openEditUser(${u.user_id})" title="Editar"><i class="ri-pencil-line"></i></button>
                    <button class="btn-icon-small delete" onclick="window.controllers.admin.deleteUser(${u.user_id})" title="Borrar"><i class="ri-delete-bin-line"></i></button>
                    <button class="btn-icon-small" style="color:#FFD700" onclick="window.controllers.admin.openResetUser(${u.user_id})" title="Reset Pass"><i class="ri-key-2-line"></i></button>
                </div>
            </td>
        </tr>
    `;
};

// FILA DE PARTIDO
export const MatchRow = (m) => {
    const isFinished = m.status === 'finished';

    const statusHtml = isFinished
        ? `<span style="color:var(--success); font-weight:bold; font-size:0.85em;"><i class="ri-checkbox-circle-line"></i> Final</span>`
        : `<span style="color:var(--text-muted); font-size:0.85em;"><i class="ri-time-line"></i> Pendiente</span>`;

    const scoreHtml = isFinished
        ? `<span style="background:#222; padding:4px 8px; border-radius:4px; border:1px solid #444; font-weight:bold;">${m.score_home} - ${m.score_away}</span>`
        : `<span style="color:var(--accent); font-weight:bold; font-size:0.8em;">VS</span>`;

    return `
        <tr>
            <td style="color:var(--text-muted); font-size:0.9em;">${formatDateShort(m.match_date)}</td>
            <td style="color:var(--accent); font-weight:600; font-size:0.9em;">${m.competition_name || '<span style="opacity:0.5">Amistoso</span>'}</td>
            <td class="text-center" style="font-weight:600;">${m.team_home}</td>
            <td class="text-center">${scoreHtml}</td>
            <td class="text-center" style="font-weight:600;">${m.team_away}</td>
            <td>${statusHtml}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-icon-small edit" onclick="window.controllers.admin.openEditMatch(${m.match_id})" title="Editar"><i class="ri-pencil-line"></i></button>
                    <button class="btn-icon-small" style="color:var(--accent)" onclick="window.controllers.admin.openScoreMatch(${m.match_id})" title="Marcador"><i class="ri-football-line"></i></button>
                    <button class="btn-icon-small delete" onclick="window.controllers.admin.deleteMatch(${m.match_id})" title="Borrar"><i class="ri-delete-bin-line"></i></button>
                </div>
            </td>
        </tr>
    `;
};

// FILA DE SOLICITUD (BUZÓN) - ¡Estilos visuales recuperados!
export const RequestRow = (r) => {
    let typeStyle = '';
    let iconHtml = '';

    // Lógica visual exacta de la v6
    switch (r.type) {
        case 'reclamo':
            typeStyle = 'background: rgba(252, 129, 129, 0.15); color: var(--danger); border: 1px solid var(--danger);';
            iconHtml = '<i class="ri-alarm-warning-line"></i>';
            break;
        case 'sugerencia':
            typeStyle = 'background: rgba(79, 209, 197, 0.15); color: var(--accent); border: 1px solid var(--accent);';
            iconHtml = '<i class="ri-lightbulb-line"></i>';
            break;
        case 'bug':
            typeStyle = 'background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid #FFD700;';
            iconHtml = '<i class="ri-bug-line"></i>';
            break;
        case 'cuenta':
            typeStyle = 'background: rgba(66, 153, 225, 0.15); color: #4299e1; border: 1px solid #4299e1;';
            iconHtml = '<i class="ri-user-settings-line"></i>';
            break;
        default:
            typeStyle = 'background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border);';
            iconHtml = '<i class="ri-file-list-2-line"></i>';
    }

    return `
        <tr>
            <td style="color:var(--text-muted); font-size:0.85em;">${formatDateShort(r.created_at)}</td>
            <td style="font-weight:600;">${r.username}</td>
            <td>
                <span style="${typeStyle} padding: 4px 10px; border-radius: 12px; font-size: 0.75em; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; gap:5px;">
                    ${iconHtml} ${r.type}
                </span>
            </td>
            <td style="max-width: 300px; font-size: 0.9em; color: var(--text-main);">${r.message}</td>
            <td class="text-center">
                <button class="action-btn" style="color: var(--accent); background: rgba(79, 209, 197, 0.1); padding:5px 10px; border-radius:4px; border:1px solid var(--accent); cursor:pointer;" 
                    onclick="window.controllers.admin.openReply(${r.request_id})"
                    title="Responder">
                    <i class="ri-reply-line"></i> Responder
                </button>
            </td>
        </tr>
    `;
};