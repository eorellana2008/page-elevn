require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db/connection'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/location', require('./src/routes/locationRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/matches', require('./src/routes/matchRoutes'));
app.use('/api/predictions', require('./src/routes/predictionRoutes'));
app.use('/api/requests', require('./src/routes/requestRoutes'));
app.use('/api/leagues', require('./src/routes/leagueRoutes'));

// Test DB
db.getConnection()
    .then(conn => {
        console.log(`✅ MySQL Conectado ID: ${conn.threadId}`);
        conn.release();
    })
    .catch(err => console.error('❌ Error DB:', err));

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});