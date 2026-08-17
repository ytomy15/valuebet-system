async function generateBetExplanation(valueCheckData) {
    const { match, market, value, odds, fairOdds, probability, edge } = valueCheckData;

    // Formatear porcentajes y decimales
    const probPercent = probability ? (probability * 100).toFixed(2) : "N/A";
    const edgePercent = edge ? (edge * 100).toFixed(2) : "N/A";
    const fOdds = fairOdds ? fairOdds.toFixed(2) : "N/A";

    let explanation = `Análisis para ${match} (${market}):\n\n`;
    explanation += `La ecuación fundamental del sistema es: EV = (Probabilidad Real x Cuota Ofrecida) - 1.\n`;
    explanation += `Basado en los datos estadísticos extraídos, la probabilidad real de que este evento ocurra es del ${probPercent}% (lo que equivale a una Cuota Justa de ${fOdds}).\n`;
    explanation += `La casa de apuestas está ofreciendo una cuota de ${odds}.\n\n`;

    if (value && edge > 0) {
        explanation += `Decisión: RECOMENDADA. Al aplicar la fórmula, obtenemos un "Edge" (ventaja matemática) positivo del ${edgePercent}%. Esta cuota tiene valor a largo plazo.`;
    } else {
        explanation += `Decisión: RECHAZADA. El EV (Expected Value) calculado es negativo o nulo, lo que indica que la cuota ofrecida (${odds}) es peor que la cuota justa matemática (${fOdds}). Apostar a esta cuota generará pérdidas a largo plazo.`;
    }

    return explanation;
}

module.exports = { generateBetExplanation };