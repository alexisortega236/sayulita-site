// netlify/functions/kaliva.js
// Integración con Kaliva Sayulita — Checkfront API 3.0
// Código de referido: REF:OGPHOTOS

const CHECKFRONT_ENDPOINT = 'https://kaliva-sayulita.checkfront.com/api/3.0';
const API_KEY = process.env.CHECKFRONT_KALIVA_KEY;
const API_SECRET = process.env.CHECKFRONT_KALIVA_SECRET;

// Basic Auth header for Checkfront Token auth
function getAuthHeader() {
  const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
}

exports.handler = async (event) => {
  // CORS preflight
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const action = event.queryStringParameters?.action || 'inventory';

  try {
    // ── GET INVENTORY: lista de villas disponibles ──
    if (event.httpMethod === 'GET' && action === 'inventory') {
      const res = await fetch(`${CHECKFRONT_ENDPOINT}/item`, {
        headers: { Authorization: getAuthHeader() },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error?.message || 'Checkfront error');

      // Format items for our frontend
      const items = Object.values(data.item || {}).map(item => ({
        id: item.item_id,
        name: item.name,
        description: item.description,
        price: item.price,
        currency: 'MXN',
        type: item.type_name,
        sku: item.sku,
        image: item.image?.full || null,
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          property: 'kaliva',
          name: 'Kaliva Sayulita Villas',
          items,
          total: items.length,
          ref: 'REF:OGPHOTOS',
        }),
      };
    }

    // ── CHECK AVAILABILITY ──
    if (event.httpMethod === 'GET' && action === 'availability') {
      const { start_date, end_date } = event.queryStringParameters || {};

      if (!start_date || !end_date) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'start_date y end_date requeridos (YYYY-MM-DD)' }),
        };
      }

      const params = new URLSearchParams({
        start_date: start_date.replace(/-/g, ''),
        end_date: end_date.replace(/-/g, ''),
      });

      const res = await fetch(`${CHECKFRONT_ENDPOINT}/availability?${params}`, {
        headers: { Authorization: getAuthHeader() },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error?.message || 'Checkfront error');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          property: 'kaliva',
          start_date,
          end_date,
          availability: data,
          ref: 'REF:OGPHOTOS',
        }),
      };
    }

    // ── CREATE BOOKING ──
    if (event.httpMethod === 'POST' && action === 'booking') {
      const body = JSON.parse(event.body || '{}');
      const {
        item_id,
        start_date,
        end_date,
        guest_name,
        guest_email,
        guest_phone = '',
        guests = 2,
        notes = '',
      } = body;

      if (!item_id || !start_date || !end_date || !guest_name || !guest_email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Campos requeridos: item_id, start_date, end_date, guest_name, guest_email',
          }),
        };
      }

      // Build booking payload with REF:OGPHOTOS code
      const bookingNote = [
        'REF:OGPHOTOS',
        `Canal: ogcreativeandexperiences.com`,
        notes ? `Nota del cliente: ${notes}` : '',
      ].filter(Boolean).join(' | ');

      const formData = new URLSearchParams({
        'slip[item_id]': item_id,
        'slip[start_date]': start_date.replace(/-/g, ''),
        'slip[end_date]': end_date.replace(/-/g, ''),
        'slip[guests]': guests,
        'customer[name]': guest_name,
        'customer[email]': guest_email,
        'customer[phone]': guest_phone,
        'booking[note]': bookingNote,
        'booking[code]': 'OGPHOTOS', // referral code
      });

      const res = await fetch(`${CHECKFRONT_ENDPOINT}/booking`, {
        method: 'POST',
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error?.message || 'Error creando reserva');

      // Notify admin via WhatsApp message link
      const waMsg = encodeURIComponent(
        `🏡 NUEVA RESERVA KALIVA — REF:OGPHOTOS\n\n` +
        `👤 Huésped: ${guest_name}\n` +
        `📧 Email: ${guest_email}\n` +
        `📅 Llegada: ${start_date}\n` +
        `📅 Salida: ${end_date}\n` +
        `👥 Huéspedes: ${guests}\n` +
        `🔑 Reserva ID: ${data.booking?.booking_id || 'Pendiente'}\n` +
        `📌 REF:OGPHOTOS — Comisión aplicable`
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          booking_id: data.booking?.booking_id,
          status: data.booking?.status,
          ref: 'REF:OGPHOTOS',
          message_es: '¡Reserva enviada! Te confirmaremos por email en breve.',
          message_en: 'Booking submitted! We\'ll confirm via email shortly.',
          admin_notify: `https://wa.me/523221699480?text=${waMsg}`,
          raw: data,
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Acción no válida. Usa: inventory, availability, booking' }),
    };

  } catch (error) {
    console.error('Kaliva API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error conectando con Kaliva',
        detail: error.message,
        fallback_url: 'https://kalivasayulita.com/villa-reservations/',
      }),
    };
  }
};