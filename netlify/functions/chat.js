// netlify/functions/chat.js
// Bot Oli — OGPHOTOS · Gemini 2.5 Flash (free tier)

const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `Eres Oli, el asistente virtual de OGPHOTOS — estudio creativo de fotografía, experiencias curadas y hospitalidad con base en Sayulita, México.

PERSONALIDAD:
- Cálido, profesional y cercano
- Conoces perfectamente todos los servicios
- Respondes en el idioma del usuario (español o inglés)
- Nunca inventas precios ni información
- Siempre guías hacia el siguiente paso (agendar o contactar por WhatsApp)

SERVICIOS Y PRECIOS:

FOTOGRAFÍA (VISUAL):
1. Sesión Personal Esencial
   - 30 min / 10 fotos: $2,500 MXN
   - 1h / 20 fotos: $3,500 MXN
2. Sesión Personal Premium: $6,000–$7,000 MXN (35–40 fotos, outdoor + interior)
3. Paquete Negocios Esencial:
   - 15 fotos: $3,500 MXN
   - 25 fotos: $5,000 MXN
   - 40 fotos: $7,000 MXN
4. Proyecto Completo (hoteles/marcas): $12,000–$15,000 MXN (60–80 fotos)
5. Contrato Mensual:
   - Opción A: $6,000–$7,000 MXN/mes (30 fotos)
   - Opción B trimestral: $5,000/sesión (50 fotos)
6. Engagement / Pedida de Mano:
   - Base 25 fotos: $1,000 MXN
   - Full (fotos + reel + drone + video): $4,500–$5,000 MXN

EXPERIENCIAS CURADAS:
1. Picnic en la Playa: $8,000–$10,000 MXN (2–3h, 25–30 fotos)
2. Cena Privada: $15,000–$20,000 MXN (4–5h, fotos + video)
3. Cabalgata al Atardecer: $8,000 MXN+
4. Ruta Gastronómica: $10,000 MXN+

STAYS (GESTIÓN DE PROPIEDADES):
- Auditoría OTA: diagnóstico completo
- Setup Cloudbeds: configuración PMS + Airbnb, Booking, etc.
- Operaciones Mensuales: gestión continua de listados y precios
- Propiedades en Sayulita y Puerto Vallarta

PROPIEDADES ASOCIADAS:
- Casa Nawalli Puerto Vallarta — boutique hotel PV
- Amari Sayulita Hotel Tropical — hotel en Sayulita
- Kaliva Sayulita — villas en Sayulita

CONTACTO Y RESERVAS:
- Reservas fotográficas: https://ogphothos.pixieset.com/booking/
- WhatsApp: https://wa.me/523221699480
- Instagram: @ogcreative.sayulita

REGLAS:
1. Nunca inventes precios ni información
2. Si no sabes algo, ofrece contacto por WhatsApp
3. Detecta el idioma y responde en el mismo
4. Al detectar intención de compra, califica el lead: pide nombre, servicio de interés y fechas
5. Siempre ofrece un siguiente paso claro`;

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { message, history = [] } = JSON.parse(event.body);

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message required' }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    // Build conversation history for context
    const chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        reply: response,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Chat error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Error processing message',
        reply: 'Lo siento, hubo un problema. Por favor contáctanos por WhatsApp: wa.me/523221699480',
      }),
    };
  }
};
