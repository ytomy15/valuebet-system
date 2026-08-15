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
        Eres un experto en apuestas deportivas. 
        Analiza esta captura de pantalla de las cuotas de un partido de fútbol.
        Extrae las cuotas para los equipos: ${teamHome} y ${teamAway}.
        
        Devuelve ÚNICAMENTE un objeto JSON con este formato exacto, sin markdown ni explicaciones adicionales:
        {
            "match": "${teamHome} vs ${teamAway}",
            "markets": [
                { "name": "Match Winner", "selection": "${teamHome}", "currentOdd": 2.10 },
                { "name": "Total Córners", "selection": "+8.5", "currentOdd": 1.85 },
                { "name": "Tarjetas", "selection": "+4.5", "currentOdd": 1.75 }
            ]
        }
        
        Asegúrate de que 'currentOdd' sea un número decimal. Si no encuentras algún mercado, omítelo o pon una cuota aproximada de lo que veas.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [
                { text: prompt },
                { inlineData: { data: imageBuffer.toString("base64"), mimeType: mimeType } }
            ]
        });

        const responseText = response.text;
        
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
