const pool = require('../../db/connection');

const Request = {
    // Usuario crea solicitud
    create: async (userId, type, message) => {
        const query = 'INSERT INTO requests (user_id, type, message) VALUES (?, ?, ?)';
        return await pool.query(query, [userId, type, message]);
    },

    // Admin lee solicitudes pendientes (con nombre de usuario)
    getPending: async () => {
        const query = `
            SELECT r.request_id, r.type, r.message, r.status, r.created_at, u.username 
            FROM requests r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.status = 'pending'
            ORDER BY r.created_at ASC
        `;
        const [rows] = await pool.query(query);
        return rows;
    },

    respondAndResolve: async (id, responseMessage) => {
        const query = "UPDATE requests SET status = 'resolved', admin_response = ? WHERE request_id = ?";
        return await pool.query(query, [responseMessage, id]);
    },

    getResolvedByUser: async (userId) => {
        const query = `
            SELECT request_id, type, message, admin_response, created_at
            FROM requests
            WHERE user_id = ? AND status = 'resolved'
            ORDER BY created_at DESC
        `;
        const [rows] = await pool.query(query, [userId]);
        return rows;
    }
};

module.exports = Request;