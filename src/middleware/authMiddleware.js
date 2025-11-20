const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const secret = process.env.JWT_SECRET;

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido.' });
        }
        req.user = user;
        next();
    });
};

const verifyStaff = (req, res, next) => {
    const role = req.user.role ? req.user.role.toLowerCase() : '';

    const allowedRoles = ['superadmin', 'admin', 'moderator'];

    if (allowedRoles.includes(role)) {
        next();
    } else {
        return res.status(403).json({ error: 'Acceso denegado. Requiere permisos de Staff.' });
    }
};

const verifySuperAdmin = (req, res, next) => {
    const role = req.user.role ? req.user.role.toLowerCase() : '';

    if (role === 'superadmin') {
        next();
    } else {
        return res.status(403).json({ error: 'Acceso denegado. Requiere Super Admin.' });
    }
};

module.exports = { verifyToken, verifyStaff, verifySuperAdmin };