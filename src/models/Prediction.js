const pool = require('../../db/connection');

const Prediction = {
    // Guardar o Actualizar una predicción (Upsert)
    save: async (userId, matchId, predHome, predAway) => {
        const query = `
            INSERT INTO predictions (user_id, match_id, pred_home, pred_away)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE pred_home = VALUES(pred_home), pred_away = VALUES(pred_away)
        `;
        return await pool.query(query, [userId, matchId, predHome, predAway]);
    },

    // Obtener todas las predicciones de un usuario
    getByUser: async (userId) => {
        const [rows] = await pool.query('SELECT * FROM predictions WHERE user_id = ?', [userId]);
        return rows;
    },

    // Obtener todas las predicciones de un partido específico (para calcular puntos)
    getByMatch: async (matchId) => {
        const [rows] = await pool.query('SELECT * FROM predictions WHERE match_id = ?', [matchId]);
        return rows;
    },

    // Actualizar los puntos de una predicción específica
    updatePoints: async (predictionId, points) => {
        return await pool.query('UPDATE predictions SET points = ? WHERE prediction_id = ?', [points, predictionId]);
    }
};

module.exports = Prediction;