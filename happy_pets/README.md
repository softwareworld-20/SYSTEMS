# Happy Pets

Base del proyecto en **Node + React** (Express 5 + Vite).

## Estructura

```
happy_pets/
├── client/                 # React 19 + Vite + react-router-dom
│   ├── index.html
│   ├── vite.config.js      # puerto 5174, proxy /api → 4100
│   └── src/
│       ├── App.jsx         # rutas públicas y de administración
│       ├── api.js          # cliente HTTP (/api)
│       ├── auth.js         # token del panel en localStorage
│       ├── image.js        # optimización de fotos antes de guardarlas
│       ├── main.jsx
│       ├── components/Navbar.jsx
│       ├── components/AdminLogin.jsx
│       ├── pages/Home.jsx  # "Bienvenido"
│       ├── pages/About.jsx
│       ├── pages/Adopcion.jsx
│       ├── pages/Veterinario.jsx
│       ├── pages/Administracion.jsx
│       ├── pages/AdminHome.jsx
│       ├── pages/AdminAdopcion.jsx
│       ├── pages/AdminNotFound.jsx
│       ├── pages/NotFound.jsx
│       └── styles.css      # paleta y estilos base
└── server/
    ├── data/adoptions.json # adopciones guardadas en JSON
    ├── package.json
    └── src/
        ├── adoptions.js    # lectura/escritura del JSON
        ├── auth.js         # tokens y política de contraseña
        ├── routes/adoptions.js
        ├── routes/auth.js  # /api/auth/login y /api/auth/session
        └── index.js        # Express 5 y estáticos de client/dist
```

## Requisitos

- Node.js 20 o superior (probado con Node 26) y npm.

## Instalación

```bash
cd SYSTEMS/happy_pets
npm install
```

## Desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:5174
- API: http://localhost:4100 (`GET /api/health`)

## Administración

- URL: http://localhost:5174/administracion (sin enlace en el navbar público).
- Acceso de demostración: `admin@happypets.com` / `Admin123`.
- La contraseña admite **máximo 8 caracteres y ninguno repetido**.
- Se puede cambiar el acceso con las variables `ADMIN_EMAIL`, `ADMIN_PASSWORD`
  y `AUTH_SECRET`.
- **Panel de adopción** (`/administracion/adopcion`): permite añadir mascotas
  con foto, nombre opcional, raza, edad, paso por veterinaria y descripción.
  La información se guarda en `server/data/adoptions.json` (la foto se guarda
  optimizada como data URL dentro del mismo JSON).
- Cada mascota recibe al crearse un **número de identificación aleatorio de
  6 dígitos**; los registros antiguos sin código se completan al leerlos.
- El panel permite **borrar** publicaciones y alternar entre vista de **lista**
  y **widgets**; la preferencia se recuerda en el navegador.
- La lista se compacta en escritorio y, en pantallas de hasta 900 px, cada fila
  se convierte en una tarjeta apilada.
- **Registro veterinaria** e **Inventario de material** siguen mostrando un 404
  interno por ahora.
- API protegida con token: `GET/POST/DELETE /api/admin/adoptions`.

## Producción

```bash
npm run build   # genera client/dist
npm start       # Express sirve la app en http://localhost:4100
```

## Paleta

| Token | Valor |
| --- | --- |
| `--sky-surge` | `#62B6D5` |
| `--alabaster-grey` | `#E2E2E2` |

Definidos en `client/src/styles.css` como variables CSS; el resto de tonos
(`--sky-surge-strong`, `--sky-surge-soft`, `--ink`, `--ink-soft`) se derivan de
esos dos colores.

## Rutas

- `/` → Home, muestra el mensaje de bienvenida.
- `/adopcion` → Adopción (título provisional).
- `/veterinario` → Veterinario (título provisional).
- `/about` → About Us (contenido provisional).
- `/administracion` → Login del panel; al entrar muestra “Bienvenido”.
- `/administracion/adopcion` → Panel de adopción (lista/widgets y formulario).
- `/administracion/veterinaria` → 404 provisional.
- `/administracion/inventario` → 404 provisional.
- `*` → 404 con enlace al inicio.
