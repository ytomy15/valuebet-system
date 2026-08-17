const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

async function processOddsImage(imagePath, teamHome, teamAway, mimeType) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Falta configurar GEMINI_API_KEY en Render");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const imageBuffer = fs.readFileSync(imagePath);

        const prompt = `
        Rol: Eres un sistema de extracción óptica de datos (OCR) especializado en casas de apuestas deportivas. Tu único objetivo es leer la imagen proporcionada y devolver los datos en formato JSON puro.
        
        Reglas Inquebrantables:
        1. Cero Alucinaciones: Solo puedes extraer los mercados, selecciones y cuotas que sean 100% legibles en la imagen.
        2. Datos Faltantes: Si un número está borroso, cortado o dudoso, debes asignarle el valor null. JAMÁS intentes deducir, redondear o adivinar una cuota.
        3. Cero Análisis: No evalúes si la cuota es buena o mala. No des consejos. No agregues texto introductorio ni conclusiones.
        4. Formato Estricto: Devuelve ÚNICAMENTE un objeto JSON válido, sin bloques de código Markdown ni comillas invertidas.

        Extrae las cuotas para los equipos: ${teamHome} y ${teamAway}.

        Formato esperado (ejemplo estricto):
        {
            "match": "${teamHome} vs ${teamAway}",
            "markets": [
                { "name": "Match Winner", "selection": "${teamHome}", "currentOdd": 2.10 },
                { "name": "Total Córners", "selection": "+8.5", "currentOdd": 1.85 },
                { "name": "Tarjetas", "selection": "+4.5", "currentOdd": null }
            ]
        }
        `;

        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        const maxRetries = 3;
        let responseText = "";

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [
                        { text: prompt },
                        { inlineData: { data: imageBuffer.toString("base64"), mimeType: mimeType } }
                    ]
                });
                responseText = response.text;
                break; // Exit loop on success
            } catch (err) {
                console.warn(`[Intento ${attempt}/${maxRetries}] Falló la API de Gemini: ${err.message}`);
                if (attempt === maxRetries) {
                    throw new Error(`Error 429: Límite de IA excedido tras 3 intentos. Detalle: ${err.message}`);
                }
                // Esperar 5 segundos antes de reintentar
                await delay(5000);
            }
        }
        
        // Extraer el JSON usando Expresiones Regulares por si la IA añade texto extra
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No se encontró estructura JSON en la respuesta de la IA.");
        }
        
        const jsonData = JSON.parse(jsonMatch[0]);
        return jsonData;

    } catch (error) {
        console.error("Error procesando imagen con Gemini Interactions API:", error);
        throw error;
    }
}

module.exports = { processOddsImage };
