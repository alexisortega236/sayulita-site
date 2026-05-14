// netlify/functions/properties.js
// Retorna el catálogo de propiedades
// Por ahora: datos estáticos + redirección a Cloudbeds
// Fase 2: conectar Cloudbeds API con credenciales reales

const PROPERTIES = [
  {
    id: 'nawalli',
    name: 'Casa Nawalli Puerto Vallarta',
    location: 'Puerto Vallarta, Jalisco',
    dest: 'pv',
    description: 'Boutique hotel en el corazón de Puerto Vallarta. Alberca, bar, desayuno continental y traslado al aeropuerto.',
    description_en: 'Boutique hotel in the heart of Puerto Vallarta. Pool, bar, continental breakfast and airport shuttle.',
    price_from: 2800,
    currency: 'MXN',
    rating: 4.9,
    reviews: 38,
    guests_max: 6,
    checkin: '15:00',
    checkout: '11:30',
    amenities: ['Alberca', 'Bar', 'Desayuno', 'AC', 'Traslado aeropuerto'],
    amenities_en: ['Pool', 'Bar', 'Breakfast', 'AC', 'Airport shuttle'],
    images: [
      'https://h-img3.cloudbeds.com/uploads/308137/casnawallipv_sitioweb_1__gallery~~667e151788b23.jpg',
      'https://h-img3.cloudbeds.com/uploads/308137/casnawallipv_sitioweb_3_~~667e15281287e.jpg',
      'https://h-img2.cloudbeds.com/uploads/308137/casnawallipv_sitioweb_4_~~667e1529940e0.png',
    ],
    booking_url: 'https://hotels.cloudbeds.com/en/reservation/yk2YrU',
    website: 'https://nawallivallarta.com',
    phone: '3221699480',
    email: 'casanawalliresortpv@gmail.com',
    coordinates: { lat: 20.61254883, lng: -105.23117065 },
    badge: 'Puerto Vallarta',
    platform: 'cloudbeds',
  },
  {
    id: 'amari',
    name: 'Amari Sayulita Hotel Tropical',
    location: 'Sayulita, Nayarit',
    dest: 'sayulita',
    description: 'Hotel boutique en el lado norte de Sayulita. Suites con cocina, alberca, internet Starlink y santuario de bienestar.',
    description_en: 'Boutique hotel on Sayulita\'s North Side. Suites with kitchens, pool, Starlink internet and wellness sanctuary.',
    price_from: 1900,
    currency: 'MXN',
    rating: 4.8,
    reviews: 91,
    guests_max: 4,
    checkin: '15:00',
    checkout: '11:00',
    amenities: ['Alberca', 'Suites con cocina', 'Starlink', 'Wellness', 'Concierge'],
    amenities_en: ['Pool', 'Kitchen suites', 'Starlink', 'Wellness', 'Concierge'],
    images: [
      'https://h-img2.us2.cloudbeds.com/uploads/8951190014656528/3_beach_ambiance_sunset_gallery~~67e59d05e68a1.jpg',
      'https://h-img2.us2.cloudbeds.com/uploads/8951190014656528/2_pool_1~~67e59d07a57bd.jpeg',
      'https://h-img3.us2.cloudbeds.com/uploads/8951190014656528/4_fountain~~67e59d0a58075.jpg',
    ],
    booking_url: 'https://us2.cloudbeds.com/en/reservation/34jEsi',
    website: 'https://www.amarisayulita.com',
    phone: '+15822459244',
    email: 'Info@amarisayulita.com',
    coordinates: { lat: 20.8724, lng: -105.434 },
    badge: 'Sayulita',
    platform: 'cloudbeds',
  },
  {
    id: 'kaliva',
    name: 'Kaliva Sayulita Villas',
    location: 'Sayulita, Nayarit',
    dest: 'sayulita',
    description: 'Villas exclusivas en Sayulita. Check-in 3PM, check-out 11AM. Depósito requerido para confirmar reserva.',
    description_en: 'Exclusive villas in Sayulita. Check-in 3PM, check-out 11AM. Deposit required to confirm booking.',
    price_from: 3500,
    currency: 'MXN',
    rating: 4.9,
    reviews: 24,
    guests_max: 8,
    checkin: '15:00',
    checkout: '11:00',
    amenities: ['Villas privadas', 'Limpieza incluida', 'Sin mascotas'],
    amenities_en: ['Private villas', 'Cleaning included', 'No pets'],
    images: [
      'https://kalivasayulita.com/wp-content/uploads/2026/03/Buena-Vida-Indoor-seating.jpg',
    ],
    booking_url: 'https://kalivasayulita.com/villa-reservations/',
    website: 'https://kalivasayulita.com',
    phone: '+15307219790',
    coordinates: { lat: 20.87, lng: -105.43 },
    badge: 'Villas · Sayulita',
    platform: 'external',
  },
];

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

  const { dest, guests } = event.queryStringParameters || {};

  let results = [...PROPERTIES];

  // Filter by destination
  if (dest && dest !== '') {
    results = results.filter(p => p.dest === dest);
  }

  // Filter by guests
  if (guests) {
    results = results.filter(p => p.guests_max >= parseInt(guests));
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300', // 5 min cache
    },
    body: JSON.stringify({
      properties: results,
      total: results.length,
      timestamp: new Date().toISOString(),
    }),
  };
};
