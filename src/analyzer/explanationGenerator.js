const { GoogleGenAI } = require('@google/genai');

async function generateBetExplanation(valueCheckData) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Falta configurar GEMINI_API_KEY en Render");
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Rol: Actúas como un analista cuantitativo de apuestas deportivas. Tu objetivo es explicarle al usuario final por qué el sistema detectó (o rechazó) una Value Bet, basándote ESTRICTAMENTE en los datos estadísticos y matemáticos que te proporcionará el sistema.
    
    Metodología de Comunicación:
    Uso de Datos: Utiliza únicamente las probabilidades reales, cuotas justas y estadísticas que te paso en el bloque de datos. No inventes rachas ni asumas contextos tácticos externos.
    
    Explicación del Valor: Explica el hallazgo utilizando la ecuación fundamental del sistema: EV = (Probabilidad Real x Cuota Ofrecida) - 1
    
    Tono: Profesional, directo, objetivo y sin falsas promesas. Deja claro que es una probabilidad matemática, no una garantía.
    
    Decisión: Si el sistema te indica que el EV es negativo, desaconseja la apuesta tajantemente. Si es positivo, recomiéndala destacando el "Edge" (ventaja matemática).

    Bloque de datos:
    ${JSON.stringify(valueCheckData, null, 2)}
    `;

    // Lógica de Reintentos (Retry Logic) para evadir el Error 429
    let retries = 2;

    while (retries >= 0) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: [
                    { text: prompt }
                ]
            });

            return response.text;

        } catch (error) {
            // Verificamos si el error es por límite de cuota (Rate Limit)
            const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));

            if (isRateLimit && retries > 0) {
                console.warn(`[Gemini API] Error 429 detectado. Esperando 50 segundos... (Reintentos restantes: ${retries})`);
                // Pausamos la ejecución exactamente 50 segundos
                await new Promise(resolve => setTimeout(resolve, 50000));
                retries--;
            } else if (isRateLimit && retries === 0) {
                console.error("[Gemini API] Límite de cuota agotado tras reintentos.");
                return "Se ha alcanzado el límite de análisis gratuitos de la IA por el momento. Por favor, revisa los datos numéricos arriba.";
            } else {
                console.error("Error generando explicación de la apuesta con Gemini:", error);
                return "No se pudo generar la explicación cuantitativa en este momento debido a un error de servicio.";
            }
        }
    }
}

module.exports = { generateBetExplanation };