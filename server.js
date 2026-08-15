const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./src/database/db');
const authRoutes = require('./src/auth/auth');

const { getRecentMatchHistory } = require('./src/scrapers/statsScraper');
const { checkValueBet } = require('./src/analyzer/valueCalculator');
const { processOddsImage } = require('./src/vision/imageProcessor');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Multer para recibir imágenes en memoria o carpeta temporal
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar Base de Datos
db.initialize();

// Rutas de API
app.use('/api/auth', authRoutes);

// Ruta de Análisis por Imagen (Fase 5)
app.post('/api/analyze-image', upload.single('oddsImage'), async (req, res) => {
    try {
        const { teamHome, teamAway, minOdds = 1.30 } = req.body;
        const imageFile = req.file;

        if (!imageFile || !teamHome || !teamAway) {
            return res.status(400).json({ success: false, error: "Faltan datos o imagen" });
        }

        // 1. Enviar imagen a Gemini para extraer cuotas
        const apostaData = await processOddsImage(imageFile.path, teamHome, teamAway, imageFile.mimetype);

        // Borrar imagen temporal
        const fs = require('fs');
        fs.unlinkSync(imageFile.path);

        if (!apostaData || !apostaData.markets) {
            return res.status(404).json({ success: false, error: "La IA no pudo extraer cuotas de la imagen" });
        }

        // 2. Extraer historial estadístico
        const statsHistory = await getRecentMatchHistory(apostaData.match);

        // 3. Calcular Valor
        const results = [];
        
        for (const market of apostaData.markets) {
            const valueCheck = checkValueBet(market, statsHistory);
            
            if (valueCheck.value && valueCheck.odds >= minOdds) {
                valueCheck.match = apostaData.match;
                valueCheck.market = market.name;
                results.push(valueCheck);
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        console.error("Error en análisis visual:", error);
        res.status(500).json({ success: false, error: "Error procesando la imagen con IA" });
    }
});

// Rutas de Vistas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
