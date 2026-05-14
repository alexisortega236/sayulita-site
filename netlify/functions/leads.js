// netlify/functions/leads.js
// Guarda leads calificados en Firebase Firestore

exports.handler = async (event) => {
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
    const lead = JSON.parse(event.body);
    const { name, service, dates, contact, lang = 'es' } = lead;

    if (!name || !contact) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'name y contact son requeridos' }),
      };
    }

    const leadData = {
      name,
      service: service || 'No especificado',
      dates: dates || 'No especificadas',
      contact,
      lang,
      status: 'new',
      source: 'bot',
      created_at: new Date().toISOString(),
    };

    // ── FASE 2: Guardar en Firebase cuando tengas credenciales ──
    // const admin = require('firebase-admin');
    // if (!admin.apps.length) {
    //   const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    //   admin.initializeApp({ credential: admin.credential.cert(credentials) });
    // }
    // const db = admin.firestore();
    // const ref = await db.collection('leads').add(leadData);
    // leadData.id = ref.id;

    // Por ahora logueamos el lead (Netlify Functions logs)
    console.log('NEW LEAD:', JSON.stringify(leadData));

    // Construir mensaje de WhatsApp para notificar al admin
    const waMsg = encodeURIComponent(
      `🌿 NUEVO LEAD — OGPHOTOS\n\n` +
      `👤 Nombre: ${name}\n` +
      `📸 Servicio: ${service || 'No especificado'}\n` +
      `📅 Fechas: ${dates || 'No especificadas'}\n` +
      `📱 Contacto: ${contact}\n` +
      `🕐 ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: lang === 'es'
          ? '¡Gracias! Te contactamos pronto por WhatsApp.'
          : 'Thanks! We\'ll contact you soon via WhatsApp.',
        whatsapp_notify: `https://wa.me/523221699480?text=${waMsg}`,
        lead: leadData,
      }),
    };
  } catch (error) {
    console.error('Lead error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Error guardando lead' }),
    };
  }
};
