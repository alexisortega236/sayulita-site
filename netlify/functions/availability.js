// netlify/functions/availability.js
// Consulta disponibilidad en Cloudbeds API
// Fase 1: redirige al motor de reservas de Cloudbeds
// Fase 2: consulta real a la API con credenciales

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  const { property, checkin, checkout, guests = 1, currency = 'mxn' } = event.queryStringParameters || {};

  if (!property || !checkin || !checkout) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'property, checkin y checkout son requeridos' }),
    };
  }

  // Booking URLs por propiedad
  const BOOKING_URLS = {
    nawalli: 'https://hotels.cloudbeds.com/en/reservation/yk2YrU',
    amari: 'https://us2.cloudbeds.com/en/reservation/34jEsi',
    kaliva: 'https://kalivasayulita.com/villa-reservations/',
  };

  const baseUrl = BOOKING_URLS[property];

  if (!baseUrl) {
    return {
      statusCode: 404,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Propiedad no encontrada' }),
    };
  }

  // Para Cloudbeds, construir URL con fechas
  let bookingUrl = baseUrl;
  if (property !== 'kaliva') {
    bookingUrl = `${baseUrl}?checkin=${checkin}&checkout=${checkout}&currency=${currency}`;
  }

  // ── FASE 2: Cuando tengas credenciales de Cloudbeds API ──
  // Descomentar y agregar las variables de entorno correspondientes:
  //
  // const clientId = property === 'nawalli'
  //   ? process.env.CLOUDBEDS_CLIENT_ID_NAWALLI
  //   : process.env.CLOUDBEDS_CLIENT_ID_AMARI;
  //
  // const clientSecret = property === 'nawalli'
  //   ? process.env.CLOUDBEDS_CLIENT_SECRET_NAWALLI
  //   : process.env.CLOUDBEDS_CLIENT_SECRET_AMARI;
  //
  // const response = await fetch('https://api.cloudbeds.com/api/v1.2/getAvailableRoomTypes', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //     'Authorization': `Bearer ${accessToken}`,
  //   },
  //   body: new URLSearchParams({
  //     startDate: checkin,
  //     endDate: checkout,
  //     adults: guests,
  //   }),
  // });
  // const data = await response.json();
  // return { statusCode: 200, body: JSON.stringify(data) };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      property,
      checkin,
      checkout,
      guests: parseInt(guests),
      currency,
      booking_url: bookingUrl,
      status: 'redirect', // fase 1: redirect al motor de Cloudbeds
      message: 'Redirigiendo al motor de reservas',
    }),
  };
};
