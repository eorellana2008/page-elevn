const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/emails');

const JWT_SECRET = process.env.JWT_SECRET;

const authService = {
    register: async ({ username, password, email, country_id }) => {
        const password_hash = await bcrypt.hash(password, 10);
        // Role 4 = User por defecto
        return await User.create({
            username, email, password_hash, role_id: 4, country_id
        });
    },

    login: async (username, password) => {
        const user = await User.findByUsername(username);
        if (!user) throw new Error('Credenciales inválidas.');

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) throw new Error('Credenciales inválidas.');

        const token = jwt.sign(
            { userId: user.user_id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        return { token, username: user.username, role: user.role };
    },

    forgotPassword: async (email) => {
        const user = await User.findByEmail(email);
        if (!user) throw new Error('No existe una cuenta con este correo.');

        const token = crypto.randomBytes(20).toString('hex');
        await User.saveResetToken(user.user_id, token);

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/reset.html?token=${token}`;

        const message = `
            <h1>Recuperación de Contraseña</h1>
            <p>Has solicitado restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente enlace para continuar:</p>
            <a href="${resetUrl}" style="background:#4FD1C5; color:black; padding:10px 20px; text-decoration:none; border-radius:5px;">Restablecer Contraseña</a>
            <p>Este enlace expira en 1 hora.</p>
        `;

        await sendEmail(user.email, 'Recuperación - ELEVN', message);
        return true;
    },

    resetPassword: async (token, newPassword) => {
        const user = await User.findByResetToken(token);
        if (!user) throw new Error('Token inválido o expirado.');

        const hash = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(user.user_id, hash);
        await User.clearResetToken(user.user_id);
        return true;
    }
};

module.exports = authService;