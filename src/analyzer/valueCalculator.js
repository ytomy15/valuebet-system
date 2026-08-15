/**
 * Calcula la probabilidad de que ocurra exactamente 'k' eventos usando la Distribución de Poisson.
 * P(k) = (e^(-lambda) * lambda^k) / k!
 */
function poissonProbability(lambda, k) {
    const e = Math.E;
    let factorialK = 1;
    for (let i = 1; i <= k; i++) {
        factorialK *= i;
    }
    return (Math.pow(e, -lambda) * Math.pow(lambda, k)) / factorialK;
}

/**
 * Calcula la probabilidad de que haya 'MÁS DE X' eventos (Ej: Over 8.5 corners = Probabilidad de 9 o más)
 */
function poissonOverProbability(lambda, overLine) {
    let cumulativeProb = 0;
    // Calculamos la probabilidad de 0 hasta el límite de la línea
    for (let i = 0; i <= Math.floor(overLine); i++) {
        cumulativeProb += poissonProbability(lambda, i);
    }
    // La probabilidad de 'Over' es 1 - (probabilidad de que sea igual o menor)
    return 1 - cumulativeProb;
}

/**
 * Analiza si una cuota tiene valor utilizando los modelos avanzados.
 * 
 * @param {Object} bookmakerMarket - { name, selection, currentOdd }
 * @param {Object} advancedStats - Datos extraídos de las 5 webs
 * @returns {Object} - Objeto con los datos de valor calculado
 */
function checkValueBet(bookmakerMarket, advancedStats) {
    let probability = 0;
    let marketType = bookmakerMarket.name.toLowerCase();

    // 1. MODELO PARA CÓRNERS
    if (marketType.includes('corner') || marketType.includes('córner')) {
        const homeName = (advancedStats.teamHome || "local").toLowerCase();
        const awayName = (advancedStats.teamAway || "visitante").toLowerCase();
        
        // Paso 1 y 2: Determinar Esperanza Matemática (Lambda)
        const expectedHomeCorners = (advancedStats.corners.homeAvgFor + advancedStats.corners.awayAvgAgainst) / 2;
        const expectedAwayCorners = (advancedStats.corners.awayAvgFor + advancedStats.corners.homeAvgAgainst) / 2;
        
        let lambda = 0;
        
        // Detección inteligente del tipo de mercado
        if (marketType.includes(homeName)) {
            lambda = expectedHomeCorners;
        } else if (marketType.includes(awayName)) {
            lambda = expectedAwayCorners;
        } else {
            // Asumimos Total Córners
            lambda = expectedHomeCorners + expectedAwayCorners;
        }

        // Analizamos la selección. Asumimos formato "+8.5" o "Más de 4.5"
        const lineMatch = bookmakerMarket.selection.match(/\+?(\d+\.\d+)/);
        if (lineMatch) {
            const line = parseFloat(lineMatch[1]);
            
            // Paso 3: Probabilidad Real (Poisson)
            const overProb = poissonOverProbability(lambda, line);
            
            if (bookmakerMarket.selection.toLowerCase().includes('menos') || bookmakerMarket.selection.toLowerCase().includes('under') || bookmakerMarket.selection.includes('-')) {
                probability = 1 - overProb;
            } else {
                probability = overProb;
            }
        } else {
            probability = 0.5;
        }
    } 
    // 2. MODELO PARA TARJETAS (Usando Corner-Stats y Sofascore)
    else if (marketType.includes('tarjeta')) {
        const avgCards = advancedStats.refereeStats.avgYellowCards;
        const totalFouls = advancedStats.refereeStats.homeFoulsPerGame + advancedStats.refereeStats.awayFoulsPerGame;
        
        // Si hay muchas faltas esperadas y el árbitro es estricto, la probabilidad sube
        const cardFactor = (totalFouls / 25) * (avgCards / 4.5); // 25 y 4.5 son baselines de liga
        
        // Lógica simplificada para ejemplo:
        const lineMatch = bookmakerMarket.selection.match(/\+?(\d+\.\d+)/);
        if (lineMatch) {
            const line = parseFloat(lineMatch[1]);
            // Usamos un factor simple basado en el promedio esperado del árbitro vs la línea
            probability = avgCards > line ? 0.65 * cardFactor : 0.35 * cardFactor;
            // Cap a 0.99
            probability = Math.min(0.99, probability);
        } else {
            probability = 0.5;
        }
    }
    // 3. MODELO GENÉRICO (1X2, Goles)
    else {
        const homeXG = advancedStats.form.homeXG || 1.5;
        const awayXG = advancedStats.form.awayXG || 1.1;

        if (marketType.includes('resultado') || marketType.includes('1x2') || marketType.includes('winner') || marketType.includes('doble oportunidad')) {
            // Poisson Bivariado simple para 1X2
            let homeWinProb = 0;
            let drawProb = 0;
            let awayWinProb = 0;

            for (let i = 0; i <= 7; i++) {
                for (let j = 0; j <= 7; j++) {
                    const prob = poissonProbability(homeXG, i) * poissonProbability(awayXG, j);
                    if (i > j) homeWinProb += prob;
                    else if (i === j) drawProb += prob;
                    else awayWinProb += prob;
                }
            }

            const selectionLower = bookmakerMarket.selection.toLowerCase();
            const homeName = (advancedStats.teamHome || "").toLowerCase();
            const awayName = (advancedStats.teamAway || "").toLowerCase();

            if (homeName && selectionLower.includes(homeName)) {
                probability = homeWinProb;
            } else if (awayName && selectionLower.includes(awayName)) {
                probability = awayWinProb;
            } else if (selectionLower.includes('empate') || selectionLower === 'x' || selectionLower === 'draw') {
                probability = drawProb;
            } else if (selectionLower === '1x' || selectionLower.includes('1x')) {
                probability = homeWinProb + drawProb;
            } else if (selectionLower === 'x2' || selectionLower.includes('x2')) {
                probability = awayWinProb + drawProb;
            } else if (selectionLower === '12' || selectionLower.includes('12')) {
                probability = homeWinProb + awayWinProb;
            } else {
                // Fallback de seguridad, asumimos local si no podemos parsear, pero no 1.67 clavado
                probability = homeWinProb;
            }
            
            if(probability === 0) probability = 0.33;

        } else if (marketType.includes('gol') || marketType.includes('goal')) {
            const lambdaTotalGoals = homeXG + awayXG;
            const lineMatch = bookmakerMarket.selection.match(/\+?(\d+\.\d+)/);
            if (lineMatch) {
                const line = parseFloat(lineMatch[1]);
                const overProb = poissonOverProbability(lambdaTotalGoals, line);
                
                if (bookmakerMarket.selection.toLowerCase().includes('más') || bookmakerMarket.selection.toLowerCase().includes('over')) {
                    probability = overProb;
                } else {
                    probability = 1 - overProb; // Probabilidad de Under
                }
            } else {
                probability = 0.5;
            }
        } else {
            // Default estático si es un mercado totalmente desconocido
            probability = 0.5;
        }
    }

    // Calcular cuota justa y determinar valor
    if (probability <= 0.05) return { value: false };
    
    const fairOdds = 1 / probability;
    const hasValue = bookmakerMarket.currentOdd > fairOdds;

    const edge = (bookmakerMarket.currentOdd / fairOdds) - 1;

    return {
        market: bookmakerMarket.name,
        recommendation: bookmakerMarket.selection,
        odds: bookmakerMarket.currentOdd,
        fairOdds: parseFloat(fairOdds.toFixed(2)),
        probability: parseFloat((probability * 100).toFixed(2)),
        edge: parseFloat((edge * 100).toFixed(2)), // Porcentaje de ventaja
        value: hasValue
    };
}

module.exports = { poissonProbability, poissonOverProbability, checkValueBet };
