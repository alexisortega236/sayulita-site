// netlify/functions/kaliva.js
// Integración con Kaliva Sayulita — Checkfront API 3.0
// Código de referido: REF:OGPHOTOS

const CHECKFRONT_ENDPOINT = 'https://kaliva-sayulita.checkfront.com/api/3.0';
const API_KEY = process.env.CHECKFRONT_KALIVA_KEY;
const API_SECRET = process.env.CHECKFRONT_KALIVA_SECRET;

// Known lodging items (category 6 = Lodging) — confirmed from Checkfront panel
const KNOWN_VILLAS = [
  { id: 24, name: 'Casa Buena Vida',    sku: 'casabuenavida',    description: 'Villa con vista en Sayulita. El espacio perfecto para una estancia memorable.', price: null, image: 'https://kalivasayulita.com/wp-content/uploads/2026/03/Buena-Vida-Indoor-seating.jpg' },
  { id: 25, name: 'Hora Feliz',         sku: 'studio',           description: 'Studio acogedor en Kaliva Sayulita. Diseño moderno con todo lo necesario.', price: null, image: null },
  { id: 26, name: 'El Desvan',          sku: 'loft',             description: 'Loft con diseño único y vistas privilegiadas en Sayulita.', price: null, image: null },
  { id: 27, name: 'El Nuevo Dias',      sku: 'villa',            description: 'Villa completa con todas las amenidades para una estancia de lujo.', price: null, image: null },
  { id: 32, name: 'Villas at Kaliva',   sku: 'villas-at-kaliva', description: 'Complejo de villas exclusivas en Sayulita. Privacidad y naturaleza.', price: null, image: null },
];

const VILLA_IDS = KNOWN_VILLAS.map(v => v.id);

function getAuthHeader() {
  const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
}

exports.handler = async (event) => {
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

    // ── INVENTORY: lista de villas ──
    if (event.httpMethod === 'GET' && action === 'inventory') {
      let items = KNOWN_VILLAS;

      try {
        const res = await fetch(`${CHECKFRONT_ENDPOINT}/item?category_id=6`, {
          headers: { Authorization: getAuthHeader() },
        });
        const data = await res.json();
        const apiItems = Object.values(data.item || {})
          .filter(item => VILLA_IDS.includes(parseInt(item.item_id)));

        if (apiItems.length > 0) {
          items = apiItems.map(item => ({
            id: item.item_id,
            name: item.name,
            description: item.description || '',
            price: item.price || null,
            currency: 'MXN',
            sku: item.sku,
            image: item.image?.full || KNOWN_VILLAS.find(v => v.id == item.item_id)?.image || null,
          }));
        }
      } catch (e) {
        console.warn('API fetch failed, using known villas:', e.message);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          property: 'kaliva',
          name: 'Kaliva Sayulita Villas',
          location: 'Sayulita, Nayarit',
          booking_url: 'https://kalivasayulita.com/villa-reservations/',
          items,
          total: items.length,
          ref: 'REF:OGPHOTOS',
        }),
      };
    }

    // ── AVAILABILITY: consulta disponibilidad por fechas ──
    if (event.httpMethod === 'GET' && action === 'availability') {
      const { start_date, end_date, item_id } = event.queryStringParameters || {};

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
      if (item_id) params.set('item_id', item_id);

      const res = await fetch(`${CHECKFRONT_ENDPOINT}/availability?${params}`, {
        headers: { Authorization: getAuthHeader() },
      });
      const data = await res.json();

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

    // ── BOOKING: crear reserva con REF:OGPHOTOS ──
    if (event.httpMethod === 'POST' && action === 'booking') {
      const body = JSON.parse(event.body || '{}');
      const { item_id, start_date, end_date, guest_name, guest_email, guest_phone = '', guests = 2, notes = '' } = body;

      if (!item_id || !start_date || !end_date || !guest_name || !guest_email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Campos requeridos: item_id, start_date, end_date, guest_name, guest_email' }),
        };
      }

      const bookingNote = [
        'REF:OGPHOTOS',
        'Canal: ogcreativeandexperiences.com',
        notes ? `Nota: ${notes}` : '',
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
        'booking[code]': 'OGPHOTOS',
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

      const villa = KNOWN_VILLAS.find(v => v.id == item_id);
      const waMsg = encodeURIComponent(
        `🏡 NUEVA RESERVA KALIVA — REF:OGPHOTOS\n\n` +
        `👤 Huésped: ${guest_name}\n` +
        `📧 Email: ${guest_email}\n` +
        `📅 Llegada: ${start_date}\n` +
        `📅 Salida: ${end_date}\n` +
        `🏠 Villa: ${villa?.name || item_id}\n` +
        `👥 Huéspedes: ${guests}\n` +
        `🔑 ID: ${data.booking?.booking_id || 'Pendiente'}\n` +
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
          message_en: "Booking submitted! We'll confirm via email shortly.",
          admin_notify: `https://wa.me/523221699480?text=${waMsg}`,
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Acción no válida. Usa: inventory, availability, booking' }),
    };

  } catch (error) {
    console.error('Kaliva error:', error);
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