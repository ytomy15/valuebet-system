const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

async function processOddsImage(imagePath, teamHome, teamAway) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Falta configurar GEMINI_API_KEY en Render");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        // Determinar mimetype basico (asumimos png o jpeg)
        const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

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
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { data: base64Image, mimeType: mimeType } }
                    ]
                }
            ]
        });

        let rawText = response.text;
        
        // Limpiar posible formato Markdown del JSON (```json ... ```)
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonData = JSON.parse(rawText);
        return jsonData;

    } catch (error) {
        console.error("Error procesando imagen con Gemini:", error);
        throw new Error("No se pudo extraer la información de la imagen");
    }
}

module.exports = { processOddsImage };
