# AyudApp 🤝

Red comunitaria para **pedir y ofrecer ayuda**. Cualquier persona puede enviar
una necesidad o una ayuda; el equipo la revisa desde el panel de administración
y, si la acepta, se publica en el muro público.

- **Frontend:** React 19 + Vite + React Router
- **Backend:** Node.js + Express 5
- **UI del panel:** MUI (Material UI) + MUI X Charts
- **Datos:** archivos JSON (sin base de datos por ahora)
- **Tipografía:** DM Serif Display (Google Fonts) para títulos y eslogan
- **Paleta:** `#0E872C` (verde bosque), `#79FF9B` (verde claro) y `#F8EDEF`
  (lavender blush)

## Pantallas

| Ruta                    | Descripción                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `/`                     | Inicio con el eslogan a la derecha y los pasos “Publica, comenta y resuelve”. |
| `/Explorar_comunidad`   | Muro público con diseño glassmorphism. Solo muestra solicitudes `publicada`. |
| `/admin`                | Login y, tras entrar, dashboard MUI + gestión de solicitudes.               |

Los datos empiezan **vacíos**: `server/data/requests.json` es `[]`, así que el
muro de `/Explorar_comunidad` muestra su estado vacío hasta que se publique la
primera solicitud.

## Puesta en marcha

Requiere Node.js 20+ (probado con Node 26).

```bash
npm install
npm run dev
```

- Web: <http://localhost:5173>
- Explorar la comunidad: <http://localhost:5173/Explorar_comunidad>
- Administración: <http://localhost:5173/admin>
- API: <http://localhost:4000/api>

El frontend usa un proxy de Vite hacia `/api`, así que no hay que configurar
nada para desarrollo.

### Producción

```bash
npm run build   # genera client/dist
npm start       # Express sirve la API y el build en http://localhost:4000
```

Variables opcionales:

| Variable         | Dónde    | Descripción                                                |
| ---------------- | -------- | ---------------------------------------------------------- |
| `PORT`           | servidor | Puerto de la API (por defecto 4000).                       |
| `VITE_API_URL`   | cliente  | URL base de la API si no usas proxy.                       |
| `ADMIN_USER`     | servidor | Usuario del panel (por defecto `admin`).                   |
| `ADMIN_PASSWORD` | servidor | Contraseña del panel (por defecto `Admin123`).             |
| `AUTH_SECRET`    | servidor | Secreto para firmar los tokens de sesión. Cámbialo.        |

## Acceso al panel

`/admin` ya no aparece en el menú público: se entra escribiendo la URL.

- Credenciales de demostración: **admin / Admin123**.
- La pantalla de acceso se divide en dos: imagen a la izquierda (marcador
  temporal) y formulario a pantalla completa a la derecha; en móvil se muestra
  solo el formulario.
- La contraseña admite **máximo 8 caracteres y no puede repetir ninguno**.
- La sesión se guarda en `localStorage` y caduca a las 8 horas.
- El servidor protege `/api/admin/*` con un token Bearer firmado con HMAC.
- Cambia las credenciales antes de publicar:

```bash
ADMIN_USER=mi-usuario \
ADMIN_PASSWORD=Clave123 \
AUTH_SECRET="una-cadena-larga-y-aleatoria" \
npm start
```

Si `ADMIN_PASSWORD` incumple la política, el servidor muestra un aviso al
arrancar (la política se valida también al iniciar sesión).

### Dashboard

Tras iniciar sesión, `/admin` muestra un dashboard con MUI:

- Tarjetas de pendientes, publicadas, rechazadas y respuestas recibidas.
- Gráfica de barras por estado (`abierta`, `en_proceso`, `resuelta`).
- Gráfica de dona por tipo (`necesito` / `ofrezco`).
- Línea de actividad de los últimos 7 días.
- Barras horizontales por categoría.

Debajo sigue la bandeja de gestión con pestañas, buscador y acciones de
moderación.

## Flujo de moderación

```text
Solicitud pública (POST /api/requests)
        │
        ▼
    pendiente ──► admin la lee ──► publicada ──► aparece en /Explorar_comunidad
        │                           │
        └──────── rechazada ◄───────┘   (también se puede ocultar y volver a pendiente)
```

- Las solicitudes enviadas desde el sitio público **nunca** se muestran hasta
  que un administrador las aprueba.
- El panel permite además crear solicitudes propias y decidir si se publican al
  guardar o quedan pendientes.
- Una solicitud publicada puede ocultarse (vuelve a `pendiente`) o rechazarse.
- El estado de la solicitud (`abierta`, `en_proceso`, `resuelta`) es
  independiente de la moderación.

## Estructura

```text
caridad/
├── client/                  # React + Vite
│   ├── src/
│   │   ├── components/      # Brand/Logo, login, dashboard MUI, tabla y modales…
│   │   ├── hooks/           # useLocalStorage
│   │   ├── pages/           # Landing, Explore (muro) y Admin (login + gestión)
│   │   ├── api.js           # cliente de la API (añade el token Bearer)
│   │   ├── auth.js          # guarda y limpia el token del panel
│   │   ├── theme.js         # tema MUI con la paleta de AyudApp
│   │   ├── constants.js     # etiquetas, estados y formato de fechas
│   │   ├── App.jsx          # rutas (Admin se carga de forma diferida)
│   │   └── styles.css       # estilos (CSS puro, responsive)
│   └── vite.config.js
├── server/
│   ├── data/                # persistencia JSON
│   │   ├── categories.json
│   │   └── requests.json    # []
│   └── src/
│       ├── routes/          # requests, admin, auth, categories, stats
│       ├── auth.js          # login, política de contraseña y tokens HMAC
│       ├── request-data.js  # validación y reglas comunes
│       ├── db.js            # lectura/escritura atómica y serializada
│       └── index.js         # arranque de Express
└── package.json             # workspaces + scripts
```

## Modelo de datos

Cada solicitud en `server/data/requests.json`:

```json
{
  "id": "req_9f3a1c2d",
  "type": "necesito",
  "title": "Silla de ruedas para mi abuela",
  "description": "Texto libre…",
  "category": "salud",
  "urgency": "alta",
  "location": "Vallecas, Madrid",
  "author": { "name": "Lucía M.", "contact": "lucia@example.com" },
  "moderation": "publicada",
  "publishedAt": "2026-11-13T09:00:00.000Z",
  "status": "abierta",
  "offers": [
    {
      "id": "off_7a1b2c3d",
      "name": "Marta G.",
      "message": "Tengo una silla plegable…",
      "createdAt": "2026-11-13T10:00:00.000Z"
    }
  ],
  "createdAt": "2026-11-12T17:05:00.000Z",
  "updatedAt": "2026-11-13T09:00:00.000Z"
}
```

- `type`: `necesito` | `ofrezco`
- `urgency`: `baja` | `media` | `alta` (en `ofrezco` siempre es `baja`)
- `moderation`: `pendiente` | `publicada` | `rechazada`
- `status`: `abierta` | `en_proceso` | `resuelta`
- `offers`: respuestas de la comunidad; la primera respuesta pasa la solicitud
  de `abierta` a `en_proceso`.

## API pública

| Método | Ruta                       | Descripción                                              |
| ------ | -------------------------- | -------------------------------------------------------- |
| GET    | `/api/health`              | Estado del servidor.                                     |
| GET    | `/api/categories`          | Lista de categorías.                                     |
| GET    | `/api/requests`            | Solicitudes publicadas. Filtros `type`, `status`, `category`, `q`, `limit`. |
| GET    | `/api/requests/:id`        | Detalle de una solicitud publicada.                      |
| POST   | `/api/requests`            | Envía una solicitud; queda `pendiente`.                  |
| PATCH  | `/api/requests/:id`        | Cambia el estado de una solicitud publicada.             |
| POST   | `/api/requests/:id/offers` | Añade una respuesta de ayuda.                            |
| GET    | `/api/stats`               | Totales de solicitudes publicadas.                       |

## API de autenticación

| Método | Ruta                | Descripción                                                  |
| ------ | ------------------- | ------------------------------------------------------------ |
| POST   | `/api/auth/login`   | Body `{ username, password }`. Devuelve `token` y `user`.    |
| GET    | `/api/auth/session` | Valida el token Bearer y devuelve el usuario de la sesión.   |

La contraseña debe tener entre 1 y 8 caracteres y ninguno repetido;
`Admin123` cumple la política.

## API de administración

Todas estas rutas requieren la cabecera `Authorization: Bearer <token>`.

| Método | Ruta                             | Descripción                                              |
| ------ | -------------------------------- | -------------------------------------------------------- |
| GET    | `/api/admin/stats`               | Totales por moderación, estado y tipo.                   |
| GET    | `/api/admin/requests`            | Todas las solicitudes. Filtros `moderation`, `type`, `status`, `q`. |
| GET    | `/api/admin/requests/:id`        | Cualquier solicitud, publicada o no.                     |
| POST   | `/api/admin/requests`            | Crea una solicitud; `publish: true` la publica al instante. |
| PATCH  | `/api/admin/requests/:id`        | Cambia `moderation` y/o `status`.                        |
| DELETE | `/api/admin/requests/:id`        | Elimina definitivamente.                                 |

Ejemplo: iniciar sesión y guardar el token.

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}' \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token))")
```

Ejemplo: aceptar y publicar una solicitud.

```bash
curl -X PATCH http://localhost:4000/api/admin/requests/req_1234 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"moderation":"publicada"}'
```

Ejemplo: crear y publicar desde administración.

```bash
curl -X POST http://localhost:4000/api/admin/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "necesito",
    "title": "Comida para dos días",
    "description": "Estamos sin ingresos este mes y necesitamos alimentos básicos.",
    "category": "alimentacion",
    "urgency": "alta",
    "location": "Carabanchel, Madrid",
    "authorName": "Ana",
    "contact": "ana@example.com",
    "publish": true
  }'
```

## Decisiones actuales (MVP)

- **El panel `/admin` tiene login propio** con token firmado (HMAC, 8 horas).
  No hay roles ni recuperación de contraseña todavía.
- Las credenciales de demostración son `admin` / `Admin123`; se cambian con
  `ADMIN_USER`, `ADMIN_PASSWORD` y `AUTH_SECRET`.
- La contraseña debe tener máximo 8 caracteres y ninguno repetido.
- El dashboard usa MUI y MUI X Charts; se carga solo al entrar en `/admin`.
- Sin registro para el público: el nombre se guarda en `localStorage` para
  comodidad y cada respuesta es pública.
- Los datos viven en JSON; `db.js` serializa escrituras y usa `rename` atómico
  para evitar archivos corruptos.
- Las respuestas (`offers`) funcionan como hilo de contacto; no hay chat en
  tiempo real.
- El contacto es opcional y visible en el detalle de la solicitud.

## Próximos pasos sugeridos

- Roles y recuperación de contraseña; sesiones revocables en servidor.
- Edición de solicitudes y notificaciones al autor cuando se publica.
- Chat o mensajería privada entre autor y quien ayuda.
- Moderación con motivos de rechazo e historial de cambios.
- Mapa/geolocalización por barrio.
- Migrar la persistencia a SQLite o PostgreSQL cuando haya más volumen.
- Tests de API (Node test runner) y de componentes (Testing Library).
