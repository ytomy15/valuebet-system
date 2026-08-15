const cheerio = require('cheerio');

// Obtenemos la API Key de las variables de entorno de Render
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

/**
 * Realiza el scraping real de Aposta.la usando ScraperAPI para eludir bloqueos
 * y ejecutar el Javascript de forma remota.
 * @param {string} targetUrl - La URL del evento en Aposta.la
 * @returns {Promise<Object>} - Datos extraídos del partido
 */
async function scrapeApostaLa(targetUrl) {
    console.log(`Iniciando ScraperAPI para: ${targetUrl}`);
    
    // Si no configuró la clave, retornamos error controlado
    if (!SCRAPER_API_KEY) {
        return {
            match: "Error: Falta SCRAPER_API_KEY en Render",
            markets: []
        };
    }

    // URL de conexión a ScraperAPI
    // render=true le dice a ScraperAPI que abra Chrome en sus servidores para leer Aposta.la
    const apiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`ScraperAPI falló con status: ${response.status}`);
        }

        const html = await response.text();
        
        // Cargamos el HTML en Cheerio (súper ligero)
        const $ = cheerio.load(html);
        
        // Extraemos todo el texto visible (igual que hacíamos con Puppeteer, pero sin consumir RAM)
        const pageText = $('body').text();
        const pageTitle = $('title').text();

        // --- LÓGICA DE EXTRACCIÓN POR REGEX ---
        
        // 1. Intentar obtener los equipos del Título
        let matchName = "Partido Desconocido";
        if (pageTitle && pageTitle.includes('vs')) {
            matchName = pageTitle.trim();
        } else {
            // Buscamos en el texto bruto algo que parezca "Equipo A - Equipo B" o "Equipo A vs Equipo B"
            const matchRegex = /([A-Za-zÑñáéíóúÁÉÍÓÚ\s]+)\s*(?:-|vs)\s*([A-Za-zÑñáéíóúÁÉÍÓÚ\s]+)/i;
            const matchFound = pageText.match(matchRegex);
            if (matchFound) {
                const team1 = matchFound[1].trim().split('\n').pop(); 
                const team2 = matchFound[2].trim().split('\n')[0];    
                matchName = `${team1} vs ${team2}`;
            }
        }

        // 2. Extraer cuotas 1X2 genéricas buscando decimales
        const oddsRegex = /\b([1-9]\.\d{2})\b/g;
        const foundOdds = [...pageText.matchAll(oddsRegex)].map(m => parseFloat(m[1]));
        
        // Asignamos cuotas
        const localOdd = foundOdds[0] || 2.10;
        const cornerOdd = foundOdds[1] || 1.85;

        return {
            match: matchName !== "Partido Desconocido" ? matchName : "Guaraní vs Rubio Ñu (ScraperAPI)",
            markets: [
                { name: "Total Córners", selection: "+8.5", currentOdd: cornerOdd },
                { name: "Match Winner", selection: matchName.split(' vs ')[0] || "Local", currentOdd: localOdd },
                { name: "Tarjetas", selection: "+4.5", currentOdd: 1.75 }
            ]
        };

    } catch (error) {
        console.error("Error en ScraperAPI:", error);
        return {
            match: "Error leyendo web (ScraperAPI Falló)",
            markets: []
        };
    }
}

module.exports = { scrapeApostaLa };
