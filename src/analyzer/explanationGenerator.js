const { GoogleGenAI } = require('@google/genai');

async function generateBetExplanation(valueCheckData) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Falta configurar GEMINI_API_KEY en Render");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const prompt = `
        Rol: Actúas como un analista cuantitativo de apuestas deportivas. Tu objetivo es explicarle al usuario final por qué el sistema detectó (o rechazó) una Value Bet, basándote ESTRICTAMENTE en los datos estadísticos y matemáticos que te proporcionará el sistema.
        
        Metodología de Comunicación:
        Uso de Datos: Utiliza únicamente las probabilidades reales, cuotas justas y estadísticas que te paso en el bloque de datos. No inventes rachas ni asumas contextos tácticos externos.
        
        Explicación del Valor: Explica el hallazgo utilizando la ecuación fundamental del sistema:
        $$EV = (Probabilidad Real \\times Cuota Ofrecida) - 1$$
        
        Tono: Profesional, directo, objetivo y sin falsas promesas. Deja claro que es una probabilidad matemática, no una garantía.
        
        Decisión: Si el sistema te indica que el EV es negativo, desaconseja la apuesta tajantemente. Si es positivo, recomiéndala destacando el "Edge" (ventaja matemática).

        Bloque de datos:
        ${JSON.stringify(valueCheckData, null, 2)}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [
                { text: prompt }
            ]
        });

        return response.text;
    } catch (error) {
        console.error("Error generando explicación de la apuesta con Gemini:", error);
        return "No se pudo generar la explicación cuantitativa en este momento debido a un error de servicio.";
    }
}

module.exports = { generateBetExplanation };
