# AGENTS.md

This git repo holds three independent apps. There is **no root `package.json`**, no shared tooling, and no CI: `cd` into an app before running npm. Each app has its own `package-lock.json`, `node_modules/`, and `client`/`server` npm workspaces.

| App | Web | API | What it is |
| --- | --- | --- | --- |
| `happy_pets/` | 5174 | 4100 | Happy Pets site + hidden admin panel |
| `caridad/` | 5173 | 4000 | AyudApp community help wall + MUI admin |
| `MUSIC/` | 5175 | 4200 | ListenU music app |

## Common commands (run from the app dir)

```bash
npm install      # installs both workspaces
npm run dev      # Express API + Vite web together
npm run build    # builds client/dist only
npm start        # Express serves API + client/dist
```

- No app has test, lint, typecheck, format, or CI scripts. Verify with `npm run build` and a manual `GET /api/health`; don't invent commands.
- All servers are Express 5 + ESM. Register API routes **before** the `app.use("/api", ...)` 404 handler.
- `client/dist` is checked only once at startup. Build before `npm start`; restart the server if `dist` appears later.
- All `vite.config.js` files hardcode the API port in the `/api` proxy. If you change a server `PORT`, update the client proxy too.
- Frontends are React 19 + Vite + `react-router-dom`, global CSS (no Tailwind/CSS modules), Spanish copy and `<html lang="es">`.
- Admin auth (Happy Pets/AyudApp) is an HMAC bearer token with an 8h TTL. Demo passwords follow the policy "max 8 chars, none repeated".

## Happy Pets (`happy_pets/`)

- Entrypoint `server/src/index.js`; auth in `server/src/auth.js` + `server/src/routes/auth.js` (mounted at `/api/auth`). Login: `POST /api/auth/login`, session: `GET /api/auth/session`; the client stores the token at localStorage `happy-pets:adminToken`.
- Demo login `admin@happypets.com` / `Admin123`; override with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_SECRET`.
- Client routes live in `client/src/App.jsx`. `/administracion` is a hidden nested route with its own nav (`pages/Administracion.jsx`); the public Navbar is hidden for every `/administracion*` path. `veterinaria` and `inventario` still render `AdminNotFound`.
- `/administracion/adopcion` (`pages/AdminAdopcion.jsx`) is intentionally full-width; don't wrap it in the narrow centered containers used by the welcome/404 pages.
- Adoptions persist in `server/data/adoptions.json` via `server/src/adoptions.js`. `GET/POST/DELETE /api/admin/adoptions` require the Bearer token.
- Photos are client-compressed in `client/src/image.js` (max 1280px, JPEG 0.82) to data URLs stored in the JSON. Express JSON limit is 6 MB; the photo data URL is capped at 4.5M chars.
- Each adoption gets a unique random 6-digit `code`; `addAdoption` keeps a valid unused client-supplied code, otherwise generates one. `readAdoptions` backfills legacy records.
- The adoption list uses fixed table columns on desktop; at `≤900px` rows become stacked cards (`.admin-adopcion__cell--*` rules in `client/src/styles.css`).
- Styling is global in `client/src/styles.css` with BEM-like class names. Tokens: `--sky-surge: #62B6D5`, `--alabaster-grey: #E2E2E2`; other tones derive from them. Keep UI copy in Spanish.

## AyudApp (`caridad/`)

- `caridad/README.md` is detailed and current; follow it for API/data-model details.
- Routes: `/`, `/Explorar_comunidad` (capital E, lowercase alias also works) and `/admin`. `/admin` is not linked publicly and is lazy-loaded with MUI + MUI X Charts; MUI is used only by the admin files, while public pages use plain CSS/glassmorphism.
- Public `POST /api/requests` always saves as `pendiente`; nothing appears on the wall until an admin publishes it. `status` (abierta/en_proceso/resuelta) is separate from `moderation`.
- Data lives in `server/data/*.json` (`requests.json` starts as `[]`). `server/src/db.js` serializes per-collection writes and uses temp-file + `rename` atomic writes.
- Admin login `admin` / `Admin123` (`POST /api/auth/login` with `username`/`password`); override with `ADMIN_USER`, `ADMIN_PASSWORD`, `AUTH_SECRET`.

## ListenU (`MUSIC/`)

- **`MUSIC/README.md` is stale**: it says "welcome only, no router, Spline background". The current app has React Router and a WebGL background; trust `client/src/App.jsx` and `components/NavLayout.jsx`.
- Routes under `NavLayout`: `/`, `/albums`, `/playlist`, `/settings`, plus a `ComingSoon` 404. Only `/playlist` is functional; `/albums` and `/settings` render `ComingSoon`.
- `/playlist` keeps metadata in localStorage `listen-u:tracks` (`hooks/useTracks.js`) and the MP3 blobs in IndexedDB `listen-u` / `track-files` (`trackFiles.js`). `UploadModal` reads ID3 tags and duration (`mp3.js`, `media.js`) to prefill title/artist/album/cover, then saves both metadata and file. `Player.jsx` is a right-side drawer that plays the stored blob via an object URL; it uses `ElasticSlider` for volume.
- The background is the fixed WebGL `<DarkVeil>` mounted by `NavLayout`, wrapped in `.veil-background` (`aria-hidden`, `pointer-events: none`, respects `prefers-reduced-motion`).
- `components/SplineBackground.jsx` is dead code and `@splinetool/react-spline` is not in `package.json`; importing it breaks the build. Don't revive it without adding the dependency.
- Palette/typography in `client/src/styles.css`: `--blue-bell: #009dff`, `--blue: #0d00fd`, black background, white copy; `--blue` works only as glow/haze, never as text. Black Ops One (`--font-display`) + Sora (`--font-body`).
- Component CSS is colocated (`PillNav.css`, `DarkVeil.css`, `AnimatedList.css`); page/layout styles stay in `styles.css`. Playlist and upload-modal styles live in `client/src/styles/upload.css`, imported by `Playlist.jsx`.
