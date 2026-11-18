# ListenU — OWN VIBES 🎧

Welcome de **ListenU**, una plataforma de música con identidad propia.
Fondo negro con una onda 3D de **Spline** teñida en azul; el contenido va
plano y legible, sin cristal ni adornos encima.

- **Frontend:** React 19 + Vite
- **Backend:** Node.js + Express 5
- **Tipografía:** Black Ops One para la marca y Sora para el resto (Google Fonts)
- **Fondo:** escena de Spline (`@splinetool/react-spline`) + tinte y viñeta CSS
- **Paleta:**

| Token        | HEX       | Uso                          |
| ------------ | --------- | ---------------------------- |
| `--blue-bell`| `#009DFF` | brillos, partículas, acentos |
| `--blue`     | `#0D00FD` | nebulosas y halos            |
| `--black`    | `#000000` | fondo                        |

## Pantallas

| Ruta | Descripción                                                    |
| ---- | -------------------------------------------------------------- |
| `/`  | Welcome a pantalla completa, sin nav ni rutas adicionales.      |

## Puesta en marcha

Requiere Node.js 20+.

```bash
npm install
npm run dev
```

- Web: <http://localhost:5175>
- API: <http://localhost:4200/api/health>

Para producción:

```bash
npm run build
npm start
```

El servidor Express sirve `client/dist` en <http://localhost:4200>.

### Puertos

| App           | Web     | API   |
| ------------- | ------- | ----- |
| `happy_pets/` | `:5174` | `:4100` |
| `caridad/`    | `:5173` | `:4000` |
| `MUSIC/`      | `:5175` | `:4200` |

## Estructura

```
MUSIC/
├── client/
│   ├── index.html
│   ├── vite.config.js       # :5175, proxy /api → :4200
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles.css       # paleta, fondo Spline y welcome
│       ├── components/
│       │   └── SplineBackground.jsx  # escena 3D + tinte azul
│       └── pages/
│           └── Welcome.jsx
└── server/
    └── src/index.js         # API + static de client/dist
```

## Notas

- El fondo es una escena pública de Spline cargada con `@splinetool/react-spline`
  (import diferido, en su propio chunk). `SCENE_URL` en
  `client/src/components/SplineBackground.jsx` es el único sitio que hay que
  tocar para usar una escena propia: publica la escena en Spline y pega la URL
  `https://prod.spline.design/<id>/scene.splinecode`.
- La paleta se consigue en CSS: el canvas va en escala de grises y una capa con
  `mix-blend-mode: color` lo tiñe de `--blue-bell`/`--blue`; la viñeta mantiene
  el texto legible.
- El fondo no recibe punteros (`pointer-events: none`) y queda `aria-hidden`.
- Con `prefers-reduced-motion: reduce` o sin WebGL no se monta la escena: queda
  el degradado azul de respaldo.
- Si no hay red o la escena tarda más de 20 s, se descarta y queda el degradado.
- Crédito "Made with Spline" en el pie: es obligatorio al usar escenas de la
  comunidad (licencia CC BY 4.0).
- No hay router todavía: la welcome es la única pantalla.
