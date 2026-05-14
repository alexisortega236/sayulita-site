# OGPHOTOS — Plataforma Web

Sitio web completo para OGPHOTOS, estudio creativo en Sayulita, México.

## Stack

| Capa | Herramienta | Costo |
|---|---|---|
| Frontend + Functions | Netlify | $0 |
| IA Bot (Oli) | Gemini 2.5 Flash | $0 (free tier) |
| Base de datos | Firebase Firestore | $0 (free tier) |
| **Total** | | **$0/mes** |

## Estructura

```
ogphotos/
├── index.html                    # Landing page
├── netlify.toml                  # Config de Netlify
├── package.json                  # Dependencias
├── .env.example                  # Plantilla de variables
├── .gitignore
└── netlify/
    └── functions/
        ├── chat.js               # Bot Oli con Gemini
        ├── properties.js         # Catálogo de propiedades
        ├── availability.js       # Disponibilidad Cloudbeds
        └── leads.js              # Captura de leads
```

## Setup

### 1. Clonar e instalar

```bash
git clone https://github.com/alexisortega236/sayulita-site.git
cd sayulita-site
npm install
```

### 2. Variables de entorno

En el dashboard de Netlify → Site Settings → Environment Variables:

```
GEMINI_API_KEY=           # aistudio.google.com
FIREBASE_CREDENTIALS=     # JSON de cuenta de servicio
CLOUDBEDS_CLIENT_ID_NAWALLI=
CLOUDBEDS_CLIENT_SECRET_NAWALLI=
CLOUDBEDS_CLIENT_ID_AMARI=
CLOUDBEDS_CLIENT_SECRET_AMARI=
```

### 3. Desarrollo local

```bash
npm install -g netlify-cli
netlify dev
```

Abre `http://localhost:8888`

### 4. Deploy

Conectar el repo a Netlify desde netlify.com → Import from GitHub.
Cada push a `main` hace deploy automático.

## Endpoints

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/chat` | POST | Bot Oli con Gemini |
| `/api/properties` | GET | Lista de propiedades |
| `/api/availability` | GET | Disponibilidad por fechas |
| `/api/leads` | POST | Guardar lead calificado |

## Propiedades

| ID | Nombre | Plataforma |
|---|---|---|
| `nawalli` | Casa Nawalli Puerto Vallarta | Cloudbeds |
| `amari` | Amari Sayulita Hotel Tropical | Cloudbeds |
| `kaliva` | Kaliva Sayulita Villas | Externo |

## Roadmap

- [x] Landing page estática
- [x] Bot Oli (frontend)
- [x] Sección Instagram
- [x] Sección Stays / Book
- [x] Netlify Functions (chat, properties, availability, leads)
- [ ] Conectar Gemini API key
- [ ] Conectar Firebase Firestore
- [ ] Conectar Cloudbeds API (credenciales pendientes)
- [ ] Imágenes reales del cliente
