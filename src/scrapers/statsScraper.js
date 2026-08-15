/**
 * Módulo para buscar estadísticas usando extracción de texto bruto.
 * En esta Fase 3, usamos mocks avanzados integrados para simular la recolección
 * de las 5 webs sin sobrecargar la RAM del servidor de Render con 5 pestañas de Chrome.
 */

async function fetchStats(teamHome, teamAway) {
    console.log(`[StatsScraper] Simulando extracción web pesada para: ${teamHome} vs ${teamAway}`);

    // Para evitar que Render colapse abriendo 6 navegadores simultáneos (1 para Aposta, 5 para Stats),
    // esta función retorna la estructura real cruzada necesaria para el valueCalculator,
    // simulando que Puppeteer fue a las 5 páginas y procesó los datos con Regex.
    
    return {
        // 1. TotalCorner
        corners: {
            homeAvgFor: 5.8,
            homeAvgAgainst: 4.2,
            awayAvgFor: 4.9,
            awayAvgAgainst: 5.5
        },
        
        // 2. Sofascore
        context: {
            homeMissingPlayers: ["Arquero Titular"],
            awayMissingPlayers: ["Defensa Central"],
            h2hTrend: "Empates frecuentes",
            refereeAssigned: "Eber Aquino"
        },
        
        // 3. FootyStats
        form: {
            homeLast5: ["W", "D", "W", "W", "L"],
            awayLast5: ["D", "D", "L", "L", "W"],
            homeXG: 1.65,
            awayXG: 1.10,
            homePossession: 55,
            awayPossession: 45
        },
        
        // 4. Corner-Stats
        refereeStats: {
            avgYellowCards: 6.2,
            avgRedCards: 0.5,
            homeFoulsPerGame: 15.5,
            awayFoulsPerGame: 14.8
        },
        
        // 5. TheStatsDontLie
        hitRates: {
            over8_5_corners: { home: 0.75, away: 0.70 },
            over9_5_corners: { home: 0.55, away: 0.50 },
            over2_5_goals: { home: 0.60, away: 0.45 }
        }
    };
}

async function getRecentMatchHistory(matchName) {
    const teams = matchName.split(' vs ');
    const teamHome = teams[0] || "Local";
    const teamAway = teams[1] || "Visitante";
    return await fetchStats(teamHome, teamAway);
}

module.exports = { getRecentMatchHistory };
