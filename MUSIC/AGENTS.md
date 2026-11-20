# Agente de proyecto — ListenU (`MUSIC/`)

Esta guía aplica **solo** a la app ListenU dentro de `MUSIC/`. El repositorio
`SYSTEMS/` contiene otras tres apps independientes (`happy_pets/`, `caridad/`);
no mezcles sus convenciones con esta. El `AGENTS.md` del root es genérico del
monorepo: ante un conflicto, manda **el código fuente de `MUSIC/`**.

## Fuentes de verdad

- `client/src/App.jsx` y `client/src/components/NavLayout.jsx` → rutas y layout.
- `client/src/hooks/useTracks.js`, `trackFiles.js`, `albumMeta.js` → persistencia.
- `server/src/index.js` → API y estáticos.

**`MUSIC/README.md` está obsoleto**: describe una welcome sin router, con fondo
de Spline. La app real tiene React Router, reproductor y un fondo WebGL propio.
No lo uses como referencia de arquitectura. Tampoco confíes en la nota del
`AGENTS.md` del root que dice que `/albums` muestra `ComingSoon`: `/albums` está
implementado (ver más abajo).

## Comandos (siempre desde `MUSIC/`)

```bash
npm install      # instala los workspaces server y client
npm run dev      # Express (:4200) + Vite (:5175) en paralelo
npm run build    # solo build de client/dist
npm start        # Express sirve API + client/dist
```

No hay scripts de `test`, `lint`, `typecheck` ni formateador, y tampoco CI; no
inventes comandos. Verifica con `npm run build` y un `GET /api/health`.

## Servidor (Express 5 + ESM)

- Entrada: `server/src/index.js`. Puerto por `PORT` (default `4200`).
- Registra cualquier ruta API **antes** del middleware 404 de `/api`.
- `client/dist` se comprueba **una sola vez al arrancar**: compila antes de
  `npm start` y reinicia el servidor si el `dist` aparece después.
- El proxy `/api` de `client/vite.config.js` apunta fijo a `http://localhost:4200`.
  Si cambias `PORT`, actualiza también el proxy.
- Sin autenticación ni base de datos en esta app: todo el estado musical vive
  en el navegador.

## Frontend (React 19 + Vite + react-router-dom 7)

- CSS global en `client/src/styles.css` y archivos colados por componente
  (`PillNav.css`, `DarkVeil.css`, `AnimatedList.css`, `Player.css`,
  `ElasticSlider.css`, `InfiniteMenu.css`). Estilos de playlist y modal en
  `client/src/styles/upload.css`, importados por `Playlist.jsx` y `Albums.jsx`.
- Copia de UI siempre en **español**; `client/index.html` usa `<html lang="es">`.
- Iconos con `@hugeicons/react` + `@hugeicons/core-free-icons`. **No hay MUI** en
  esta app (eso es solo el admin de `caridad/`).
- Paleta: `--blue-bell: #009dff`, `--blue: #0d00fd`, `--black`, `--white`.
  `--blue` solo para halos/glow/haze, nunca como color de texto. Tipografías:
  `--font-display` = Black Ops One, `--font-body` = Sora.

### Rutas

Todas están anidadas en `<Route element={<NavLayout />}>`:

| Ruta | Estado real |
| --- | --- |
| `/` | Welcome (`pages/Welcome.jsx`). |
| `/playlist` | Funcional: subir, listar, seleccionar, borrar y reproducir. |
| `/albums` | Funcional: `InfiniteMenu` + detalle de álbum con `AnimatedList`. |
| `/settings` | `ComingSoon` ("Configura ListenU a tu manera. Próximamente."). |
| `*` | `ComingSoon` de 404. |

`NavLayout` monta el `<PillNav>` con enlaces de React Router y el fondo WebGL.

## Datos y persistencia (solo cliente)

| Dato | Parte | Clave / ubicación |
| --- | --- | --- |
| Metadatos de canciones | `hooks/useTracks.js` | localStorage `listen-u:tracks` |
| Blobs MP3 | `trackFiles.js` | IndexedDB `listen-u`, store `track-files` (clave = id del track) |
| Sugerencias de artista/álbum | `components/UploadModal.jsx` | localStorage `listen-u:artists`, `listen-u:albums` |
| Carátula/descripción de álbum | `albumMeta.js` | localStorage `listen-u:album-meta` |

- Cada track tiene `id = crypto.randomUUID()` y un flag `hasFile`. Los metadatos
  y el blob se guardan por separado; si falla IndexedDB, el track se añade igual
  con `hasFile: false` y el reproductor mostrará "El audio de esta canción no
  está disponible.".
- `addTrack` recibe `{ file, ...meta }`: separa el `File` antes de guardar la
  metadata en localStorage (nunca guardes el `File` ahí).
- `buildAlbums(tracks)` agrupa por `album`, usa `—` para "Sin álbum" (va al
  final), y toma la carátula de `albumMeta` o de la primera canción con cover.

## Subida y reproducción

- `UploadModal.jsx`: portal a `document.body`, solo MP3 (`audio/mpeg` o
  extensión `.mp3`), cierra con Escape y bloquea el scroll del body.
- El mismo modal sirve para editar: la barra de selección de `Playlist` muestra
  `Editar` (habilitado solo con una canción marcada), pasa `track` al modal y
  precarga los datos. Guardar llama a `updateTrack(id, patch)`, que conserva
  `id`, `hasFile`, duración y el blob de IndexedDB; el alta sigue usando
  `addTrack`.
- `mp3.js` importa `jsmediatags` de forma diferida al seleccionar el primer MP3
  y lee título/artista/álbum/carátula (ID3 → data URL). Si falla, devuelve
  campos vacíos; no es un error de la app.
- `media.js` lee la duración con un `<audio>` temporal (revoca el object URL) y
  formatea `m:ss` / `h:mm:ss`.
- `Player.jsx` es un drawer lateral derecho: reproduce el blob de IndexedDB
  mediante object URL, la revoca al cambiar de pista y al desmontar, y usa
  `ElasticSlider` para el volumen. Errores y estados en español.

## Fondo y componentes visuales

- `NavLayout` monta `<DarkVeil>` (shader WebGL GLSL en `components/DarkVeil.jsx`)
  dentro de `.veil-background`: fijo, `aria-hidden`, `pointer-events: none` y
  respeta `prefers-reduced-motion`. No lo rompas añadiendo contenido encima.
- `components/SplineBackground.jsx` es **código muerto**: `@splinetool/react-spline`
  no está en `package.json`, así que importarlo rompe el build. No lo revivas
  sin añadir la dependencia.
- `AnimatedList`, `InfiniteMenu`, `ElasticSlider` y `PillNav` son componentes
  locales con CSS propio; mantén sus props actuales antes de cambiar su API.
