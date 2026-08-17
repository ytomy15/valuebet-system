const { GoogleGenAI } = require('@google/genai');

/**
 * Módulo para buscar estadísticas usando extracción de texto bruto.
 * En esta Fase 3, usamos Gemini para recolectar información real
 * de las fuentes solicitadas (FootyStats, Sofascore, Corner-Stats).
 */

async function fetchStats(teamHome, teamAway) {
    console.log(`[StatsScraper] Extrayendo estadísticas reales de la web para: ${teamHome} vs ${teamAway}`);
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("Falta GEMINI_API_KEY. Usando fallback por defecto.");
        return getFallbackStats(teamHome, teamAway);
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Eres un analista de datos de fútbol experto. Busca la información más reciente de la temporada actual sobre estos equipos: ${teamHome} (Local) y ${teamAway} (Visitante).
    Utiliza como referencia los datos que encontrarías en FootyStats, Sofascore, Corner-Stats y TheStatsDontLie.
    REGLA INQUEBRANTABLE: Si no encuentras datos estadísticos exactos, numéricos y verificables para una métrica específica, debes asignarle ESTRICTAMENTE el valor null en el JSON. Tienes TOTALMENTE PROHIBIDO realizar estimaciones tácticas, proyecciones probabilísticas o rellenar huecos con deducciones históricas.

    Devuelve ÚNICAMENTE un JSON válido con este formato exacto:
    {
        "teamHome": "${teamHome}",
        "teamAway": "${teamAway}",
        "corners": {
            "homeAvgFor": 5.8,
            "homeAvgAgainst": 4.2,
            "awayAvgFor": 4.9,
            "awayAvgAgainst": 5.5
        },
        "context": {
            "homeMissingPlayers": ["Jugador A"],
            "awayMissingPlayers": [],
            "h2hTrend": "Empates frecuentes",
            "refereeAssigned": "Nombre del árbitro (si se sabe, si no pon 'Desconocido')"
        },
        "form": {
            "homeLast5": ["W", "D", "W", "W", "L"],
            "awayLast5": ["D", "D", "L", "L", "W"],
            "homeXG": 1.65,
            "awayXG": 1.10,
            "homePossession": 55,
            "awayPossession": 45
        },
        "refereeStats": {
            "avgYellowCards": 6.2,
            "avgRedCards": 0.5,
            "homeFoulsPerGame": 15.5,
            "awayFoulsPerGame": 14.8
        },
        "hitRates": {
            "over8_5_corners": { "home": 0.75, "away": 0.70 },
            "over9_5_corners": { "home": 0.55, "away": 0.50 },
            "over2_5_goals": { "home": 0.60, "away": 0.45 }
        }
    }
    No agregues explicaciones ni markdown. Solo el JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ text: prompt }]
        });

        const responseText = response.text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            console.warn("La respuesta de Gemini no tenía formato JSON.");
            return getFallbackStats(teamHome, teamAway);
        }
    } catch (error) {
        console.error("Error al extraer stats de Gemini:", error);
        return getFallbackStats(teamHome, teamAway);
    }
}

function getFallbackStats(teamHome, teamAway) {
    // Si falla la IA o la API, devolvemos un objeto neutro para no romper el programa
    return {
        teamHome: teamHome,
        teamAway: teamAway,
        corners: { homeAvgFor: 5.0, homeAvgAgainst: 5.0, awayAvgFor: 5.0, awayAvgAgainst: 5.0 },
        context: { homeMissingPlayers: [], awayMissingPlayers: [], h2hTrend: "Neutral", refereeAssigned: "Desconocido" },
        form: { homeLast5: ["D","D","D","D","D"], awayLast5: ["D","D","D","D","D"], homeXG: 1.3, awayXG: 1.3, homePossession: 50, awayPossession: 50 },
        refereeStats: { avgYellowCards: 4.5, avgRedCards: 0.2, homeFoulsPerGame: 12.0, awayFoulsPerGame: 12.0 },
        hitRates: { over8_5_corners: { home: 0.5, away: 0.5 }, over9_5_corners: { home: 0.4, away: 0.4 }, over2_5_goals: { home: 0.5, away: 0.5 } }
    };
}

async function getRecentMatchHistory(matchName) {
    const teams = matchName.split(' vs ');
    const teamHome = teams[0] || "Local";
    const teamAway = teams[1] || "Visitante";
    return await fetchStats(teamHome, teamAway);
}

module.exports = { getRecentMatchHistory };
