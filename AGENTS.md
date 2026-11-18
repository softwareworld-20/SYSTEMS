# AGENTS.md

This git repo contains three independent apps and has no root `package.json`.
Work from the app directory; do not install or run npm at the repo root.

- `happy_pets/` — React + Express npm-workspaces app (covered below).
- `caridad/` — separate React/Express app (AyudApp); follow `caridad/README.md`.
- `MUSIC/` — React + Express welcome page for ListenU (covered below).

## Happy Pets

All commands run from `happy_pets/` (Node 20+):

```bash
cd happy_pets
npm install      # root install; installs server and client workspaces
npm run dev      # API + Vite together
npm run build    # builds client/dist only
npm start        # Express on :4100, serves client/dist
```

- Dev URLs: web `http://localhost:5174`, API `http://localhost:4100/api/health`.
  (`:5173` and `:4000` belong to `caridad/`; `:5175` and `:4200` to `MUSIC/`.)
- There are no test, lint, typecheck, or format scripts. Verify changes with
  `npm run build` and a manual request to `/api/health`; don't invent commands.
- `npm run dev:server` / `npm run dev:client` run one side only.

### Architecture / gotchas

- `server/src/index.js` is the API entrypoint; auth lives in
  `server/src/auth.js` and `server/src/routes/auth.js` (mounted at `/api/auth`).
  Add routes **before** the `app.use("/api", ...)` 404 handler or they will be
  swallowed.
- Admin login uses `POST /api/auth/login` and `GET /api/auth/session`. The
  client stores the token in localStorage as `happy-pets:adminToken`.
- Demo credentials are `admin@happypets.com` / `Admin123`; override with
  `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `AUTH_SECRET`. Passwords max 8 characters
  with no repeated characters (same policy as `caridad/`).
- Server is ESM on Express 5. A bare `"*"` route pattern is invalid; use
  middleware or a named wildcard such as `/*splat`.
- Production static serving is decided once at startup by checking whether
  `client/dist` exists. Build before `npm start`; restart the server if
  `client/dist` was created after it started.
- The Vite dev proxy hardcodes `/api` → port 4100. If you override `PORT`,
  update `client/vite.config.js` too.
- Client routes are registered in `client/src/App.jsx`. Add a page under
  `client/src/pages/` and, if it belongs in the header, a link in
  `client/src/components/Navbar.jsx`.
- `/administracion` is a hidden nested route with its own nav in
  `pages/Administracion.jsx`. `veterinaria` and `inventario` are still
  placeholders rendering `AdminNotFound`; the public Navbar is hidden for every
  `/administracion*` path.
- `/administracion/adopcion` (`pages/AdminAdopcion.jsx`) is intentionally
  full-width; don't wrap it in the narrow centered containers used by the
  welcome/404 pages.
- Adoptions persist in `server/data/adoptions.json` through
  `server/src/adoptions.js`. `GET/POST/DELETE /api/admin/adoptions` require the
  Bearer token. Photos are client-compressed to data URLs (`client/src/image.js`)
  and stored in that JSON; Express JSON limit is 6 MB.
- Each adoption gets a unique random 6-digit `code`; `addAdoption` keeps the
  client-supplied code when it is valid and unused, otherwise generates a new
  one. `readAdoptions` backfills codes for legacy records.
- The adoption list uses fixed column widths on desktop; at `≤900px` rows
  become stacked cards via `.admin-adopcion__cell--*` grid rules in
  `client/src/styles.css`.
- All styling is global in `client/src/styles.css`: BEM-like class names and
  CSS variables. No Tailwind, CSS modules, or UI framework. Reuse the existing
  `--sky-surge`, `--alabaster-grey`, and derived tokens.
- User-facing copy and `<html lang>` are Spanish; keep new UI text in Spanish.

## MUSIC (ListenU)

All commands run from `MUSIC/` (Node 20+):

```bash
cd MUSIC
npm install      # root install; installs server and client workspaces
npm run dev      # API + Vite together
npm run build    # builds client/dist only
npm start        # Express on :4200, serves client/dist
```

- Dev URLs: web `http://localhost:5175`, API `http://localhost:4200/api/health`.
- There are no test, lint, typecheck, or format scripts. Verify changes with
  `npm run build` and a manual request to `/api/health`; don't invent commands.
- The welcome is the only screen for now: no router, no Navbar. `App.jsx`
  renders `components/SplineBackground.jsx` (3D background) plus
  `pages/Welcome.jsx`.
- The background is a Spline scene (`@splinetool/react-spline`, lazy-loaded) in
  `components/SplineBackground.jsx`; `SCENE_URL` is the only knob to swap it for
  a scene published from the user's own Spline account. Don't add a scene ID
  without checking the license: community scenes need CC BY attribution, hence
  the "Made with Spline" link in the footer.
- Palette is applied to the 3D layer in CSS: the canvas is desaturated and a
  `mix-blend-mode: color` layer tints it with `--blue-bell`/`--blue`; a vignette
  keeps the copy readable. Keep decorative styling on the background only —
  the foreground (icon, title, tagline, "Próximamente") stays flat, no glass.
- The background is `aria-hidden`, `pointer-events: none`, and is not mounted at
  all when `prefers-reduced-motion: reduce` or WebGL is unavailable (gradient
  fallback). It also unmounts itself after a 20s load timeout.
- Palette lives in `client/src/styles.css`: `--blue-bell: #009dff`,
  `--blue: #0d00fd`, `--black: #000`. Black background, white copy; `--blue`
  only works as glow/haze, never as text color.
- Typography: Black Ops One (`--font-display`, used for "ListenU") and Sora
  (`--font-body`), both Google Fonts with system fallbacks. Styling is global
  CSS with BEM-like class names, same convention as `happy_pets/`.
