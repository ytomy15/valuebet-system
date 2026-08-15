const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // En un entorno real con MongoDB conectado, descomentar esto:
        /*
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(401).json({ error: "Contraseña incorrecta" });
        */

        // MOCK DE LOGIN PARA DESARROLLO LOCAL SIN MONGO_URI
        if (username !== 'admin' || password !== 'admin123') {
            return res.status(401).json({ error: "Credenciales incorrectas (Usa admin / admin123)" });
        }
        const user = { id: "1", username: "admin" };
        // FIN MOCK

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ error: "Error en el servidor de autenticación" });
    }
});

module.exports = router;
