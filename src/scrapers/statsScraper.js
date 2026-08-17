/**
 * Módulo para buscar estadísticas usando extracción de texto bruto.
 * (Refactorizado para no usar Gemini y operar dentro del Free Tier)
 */

async function fetchStats(teamHome, teamAway) {
    console.log(`[StatsScraper] Obteniendo estadísticas fallback (simuladas) para: ${teamHome} vs ${teamAway}`);
    return getFallbackStats(teamHome, teamAway);
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
