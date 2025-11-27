const authService = require('../services/authService');

const registerUser = async (req, res) => {
    try {
        const { username, password, email, country_id } = req.body;
        if (!username || !password || !email || !country_id) return res.status(400).json({ error: 'Faltan datos.' });

        await authService.register(req.body);
        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Usuario/Email ya existe.' });
        res.status(500).json({ error: 'Error interno.' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Faltan datos.' });

        const result = await authService.login(username, password);
        res.status(200).json({ message: 'Login exitoso', ...result });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        await authService.forgotPassword(req.body.email);
        res.json({ message: 'Correo enviado.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        res.json({ message: 'Contraseña actualizada.' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };