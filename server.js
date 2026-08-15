const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./src/database/db');
const authRoutes = require('./src/auth/auth');
const { scrapeApostaLa } = require('./src/scrapers/apostaScraper');
const { getRecentMatchHistory } = require('./src/scrapers/statsScraper');
const { checkValueBet } = require('./src/analyzer/valueCalculator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar Base de Datos
db.initialize();

// Rutas de API
app.use('/api/auth', authRoutes);

// Ruta para procesar el análisis de URL
app.post('/api/analyze', async (req, res) => {
    const { url, minOdds } = req.body;
    
    if (!url) return res.status(400).json({ success: false, error: "URL es requerida" });

    try {
        // 1. Extraer datos de Aposta.la
        const apostaData = await scrapeApostaLa(url);
        
        if (!apostaData || !apostaData.markets) {
            return res.status(404).json({ success: false, error: "No se pudieron extraer cuotas de Aposta.la" });
        }

        // 2. Extraer historial estadístico
        const statsHistory = await getRecentMatchHistory(apostaData.match);

        // 3. Calcular Valor
        const results = [];
        
        for (const market of apostaData.markets) {
            // El calculador ahora espera el objeto completo de advancedStats (statsHistory)
            const valueCheck = checkValueBet(market, statsHistory);
            
            if (valueCheck.value && valueCheck.odds >= minOdds) {
                valueCheck.match = apostaData.match;
                valueCheck.market = market.name;
                results.push(valueCheck);
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        console.error("Error en análisis:", error);
        res.status(500).json({ success: false, error: "Error analizando la URL" });
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
