# Agente de proyecto — ListenU (`MUSIC/`)

Esta guía aplica **solo** a la app ListenU dentro de `MUSIC/`. El repositorio
`SYSTEMS/` contiene otras tres apps independientes (`happy_pets/`, `caridad/`);
no mezcles sus convenciones con esta. El `AGENTS.md` del root es genérico del
monorepo: ante un conflicto, manda **el código fuente de `MUSIC/`**.

## Fuentes de verdad

- `client/src/App.jsx` y `client/src/components/NavLayout.jsx` → rutas y layout.
- `client/src/api/tracks.js` + `client/src/hooks/useTracks.js` → persistencia vía API.
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
- La autenticación y la persistencia son reales: el cliente usa PostgreSQL a
  través de la API (`client/src/api/tracks.js`). No queda estado musical en el
  navegador; solo las sugerencias de artista/álbum del formulario siguen en
  `localStorage` como comodidad de UI.

## Base de datos (migración en curso)

- PostgreSQL 18 local: base `db_music` y rol de DB `music_user` (no confundir con
  el usuario de la app `SamuelS`).
- `MUSIC/.env` está ignorado por git; plantilla en `.env.example`. Los scripts
  del server cargan `../.env` con `node --env-file` (ruta relativa a `server/`).
- `pg` vive en el workspace `server`. `server/src/db.js` exporta `pool`, `query`
  y `checkDb`; nunca loguees `DATABASE_URL` porque contiene la contraseña.
- Esquema versionado en `server/db/migrations/001_init.sql`: `app_users` (demo
  `SamuelS` con hash bcrypt de pgcrypto), `tracks` (metadatos + `data bytea`) y
  `album_meta`. Aplicar con
  `psql "$DATABASE_URL" -f server/db/migrations/001_init.sql`.
- Decisión de arquitectura: el audio se guarda en `BYTEA` para poder escucharlo
  desde laptop o celular; así un único `pg_dump` incluye esquema, datos y audio.
- `GET /api/health` añade `"db": "ok" | "error"` tras ejecutar `SELECT 1`.

### API de autenticación

- `server/src/auth.js` firma tokens HMAC con SHA-256 y TTL de 8 h usando
  `AUTH_SECRET` de `.env`. Si falta, usa un secreto efímero (las sesiones se
  invalidan al reiniciar) y avisa por consola.
- `server/src/requireAuth.js` exige `Authorization: Bearer <token>` y deja el
  usuario en `req.user`; responde 401 si falta o es inválido/caducado.
- `POST /api/auth/login` comprueba la contraseña contra `app_users` con
  `crypt()` de pgcrypto y devuelve `{ token, username, expiresIn }`.
  `GET /api/auth/session` devuelve `{ user }`.
- Registradas en `server/src/index.js` **antes** del 404 de `/api`. El cliente
  ya usa este login: `client/src/auth.js` guarda el token en sessionStorage
  (`listen-u:token`, con respaldo en memoria) y el usuario en `listen-u:user`.
- Cambiaron los scripts del server (`--env-file=../.env`), así que hay que
  reiniciar un `npm run dev` que ya estuviera corriendo.

### API de canciones

- `server/src/routes/tracks.js` está montado en `/api/tracks` detrás de
  `requireAuth`. Todas las consultas llevan `owner_id = req.user.id`.
- `GET /api/tracks` devuelve metadatos (sin `data`), ordenados alfabéticamente.
- `POST /api/tracks` es `multipart/form-data`: campo `files` (hasta 20, máx.
  100 MB cada uno) y campo opcional `metadata` con un JSON array alineado con
  los archivos (`title`, `artist`, `album`, `cover`, `duration`). Se insertan
  todos en una transacción y se guarda el audio en `data bytea` con el MIME
  normalizado por `server/src/audio.js` (espejo de `client/src/audio.js`).
- `GET /api/tracks/:id/audio` sirve el `bytea` con el MIME guardado, soporta
  `Range: bytes=…` (206) y devuelve 404/416 según corresponda.
- `PATCH /api/tracks/:id` solo toca `title`, `artist`, `album` y `cover`; nunca
  modifica `id`, duración, tamaño ni audio. `DELETE /api/tracks/:id` responde 204.
- Los errores de `multer` se convierten a JSON en español (413 si el archivo
  excede el límite, 400 si se pasa de 20 archivos).
- `GET /api/albums` devuelve `{ album, cover, description }` por usuario;
  `PATCH /api/albums` hace upsert de esa fila (carátula/descripción del álbum).

## Frontend (React 19 + Vite + react-router-dom 7)

- CSS global en `client/src/styles.css` y archivos colados por componente
  (`PillNav.css`, `DarkVeil.css`, `AnimatedList.css`, `Player.css`,
  `ElasticSlider.css`, `InfiniteMenu.css`, `ThoughtLine.css`). Estilos de
  playlist y modal en
  `client/src/styles/upload.css`, importados por `Playlist.jsx` y `Albums.jsx`.
  La pantalla de login tiene `client/src/styles/login.css`, importado por
  `pages/Login.jsx`.
- Copia de UI siempre en **español**; `client/index.html` usa `<html lang="es">`.
- Iconos con `@hugeicons/react` + `@hugeicons/core-free-icons`. **No hay MUI** en
  esta app (eso es solo el admin de `caridad/`).
- Paleta: `--blue-bell: #009dff`, `--blue: #0d00fd`, `--black`, `--white`.
  `--blue` solo para halos/glow/haze, nunca como color de texto. Tipografías:
  `--font-display` = Playfair Display (Google Fonts), `--font-body` = Sora.

### Rutas

`/login` está fuera del layout. El resto está detrás de `<RequireAuth />` y
anidado en `<Route element={<NavLayout />}>`:

| Ruta | Estado real |
| --- | --- |
| `/login` | Formulario de acceso; mitad izquierda con el fondo WebGL, mitad derecha con el formulario. |
| `/` | Welcome (`pages/Welcome.jsx`). |
| `/playlist` | Funcional: buscar, subir, listar en orden alfabético con índice lateral, seleccionar, borrar, editar y reproducir en cola. |
| `/albums` | Funcional: `InfiniteMenu` + detalle de álbum con `AnimatedList`. |
| `/settings` | `ComingSoon` ("Configura ListenU a tu manera. Próximamente."). |
| `*` | `ComingSoon` de 404. |

`NavLayout` monta el `<PillNav>` con enlaces de React Router, el fondo WebGL y
un badge de perfil (`SamuelS`) en la esquina superior derecha: al pulsarlo se
despliega un menú con **Cerrar sesión**.
Los ajustes del shader están en `components/veilProps.js` y los comparten
`NavLayout` y `Login`.

### Acceso

- El usuario de la app es `SamuelS` / `Samu3l!9` (8 caracteres, ninguno
  repetido). La contraseña **no** está en el bundle: se comprueba en el servidor
  contra el hash bcrypt de `app_users`.
- `client/src/auth.js` envía `POST /api/auth/login`, guarda el token Bearer en
  sessionStorage (`listen-u:token`, con respaldo en memoria) y el usuario en
  `listen-u:user`. `RequireAuth` valida el token con `GET /api/auth/session` al
  entrar y redirige a `/login` si no es válido.
- `client/src/api/client.js` añade el header `Authorization` a todas las
  peticiones; si recibe 401 limpia la sesión y vuelve a `/login`.
- `signOut` limpia token y usuario; el menú del perfil vuelve a `/login`.
- El nombre mostrado en el badge sale del token (`currentUser()`), no harcodeado.

## Datos y persistencia

| Dato | Parte | Ubicación |
| --- | --- | --- |
| Metadatos y audio de canciones | tabla `tracks` | PostgreSQL `db_music`, columna `data bytea` |
| Carátula/descripción de álbum | tabla `album_meta` | PostgreSQL `db_music` |
| Sugerencias de artista/álbum | `components/UploadModal.jsx` | solo UI: localStorage `listen-u:artists`, `listen-u:albums` |
| Sesión | `auth.js` | sessionStorage `listen-u:token`, `listen-u:user` |

- `client/src/api/tracks.js` es el único puente: `listTracks`, `uploadTracks`,
  `updateTrack`, `removeTrack`, `fetchTrackAudio`, `listAlbumMeta`,
  `saveAlbumMeta`. Ningún archivo del cliente usa ya `localStorage` ni
  IndexedDB para guardar música.
- `useTracks` carga la lista al montar y expone `loading`/`error`/`reload`.
  `addTrack` envía un archivo y `addTracks(items)` envía el lote completo en una
  sola petición `multipart/form-data` con `metadata` alineado.
- Los ids los genera el servidor con `crypto.randomUUID()`; el track devuelto
  trae `fileName`, `mime`, `addedAt` y `updatedAt`. Ya no existe el flag `hasFile`.
- `buildAlbums(tracks, metas)` agrupa por `album`, usa `—` para "Sin álbum" (va
  al final), y toma la carátula de `album_meta` o de la primera canción con
  cover.

## Subida y reproducción

- `UploadModal.jsx`: portal a `document.body`, bloquea el scroll del body y
  **no cierra al hacer clic fuera**: se cierra con la X, con **Cancelar** o con
  Escape. Acepta **cualquier formato de audio** (`audio/*` más
  extensiones como `.m4a`, `.wav`, `.flac`, `.ogg`, `.aac`, `.webm`, `.wma`,
  `.aiff`, también `.mp4` de audio); el input permite varios archivos, máximo 20.
- Subida múltiple (2 o más archivos): **no se muestra el formulario**. Se leen
  etiquetas incrustadas (cuando existen) y duración de cada archivo y se guardan
  tal cual (título = tag o nombre del archivo sin extensión, artista/álbum por
  defecto). Se insertan con `addTracks` en el orden elegido y luego se editan de
  una en una desde `Editar`.
- Mientras se procesa el lote, el modal muestra `components/ThoughtLine.jsx` en
  la columna derecha: lista de archivos a la izquierda y el indicador de
  progreso a la derecha. El componente es local (traído de react-bits) y usa
  `motion` (dependencia añadida a `client/package.json`) más `ThoughtLine.css`.
- El mismo modal sirve para editar: la barra de selección de `Playlist` muestra
  `Editar` (habilitado solo con una canción marcada), pasa `track` al modal y
  precarga los datos. Guardar llama a `PATCH /api/tracks/:id` vía
  `updateTrack(id, patch)`, que conserva `id`, duración, tamaño y audio; el alta
  sigue usando `addTrack`.
- `audio.js` centraliza `isAudioFile`, `audioMime` y `normalizeAudio`. Los blobs
  sin MIME (o con MIME de vídeo, típico en `.m4a`) se envían como `File` con el
  MIME correcto; el servidor guarda ese MIME normalizado en la columna `mime`.
- `mp3.js` importa `jsmediatags` de forma diferida al seleccionar el primer
  archivo y lee título/artista/álbum/carátula (ID3 → data URL). En formatos no
  MP3 suele devolver campos vacíos; la subida usa entonces el nombre del
  archivo. No es un error de la app.
- `media.js` lee la duración con un `<audio>` temporal sobre el blob
  normalizado (revoca el object URL) y formatea `m:ss` / `h:mm:ss`.
- `Player.jsx` es un drawer lateral derecho: pide el audio a
  `GET /api/tracks/:id/audio` con el token (`fetch` + `blob()`), crea un object
  URL, lo revoca al cambiar de pista y al desmontar, y usa `ElasticSlider` para
  el volumen. Un `<audio src>` directo no sirve porque no puede enviar el header
  `Authorization`. Si el códec no es compatible, muestra un error claro en
  español en vez de fallar en silencio.
- Cola de reproducción: `Player` recibe `queue` y `onSelectTrack`; al terminar
  una pista pasa a la siguiente del orden de la lista (no hace loop al final) y
  muestra controles de anterior/siguiente y la posición `n / total`. `Playlist`
  usa todas las canciones ordenadas como cola; el detalle de álbum usa las del
  álbum. Cambiar de pista se hace actualizando `activeId`, no montando otro
  reproductor.
- `Playlist.jsx` ordena por título (insensible a mayúsculas/acentos y con
  `localeCompare` en español) y busca por título, artista, álbum y nombre de
  archivo. El índice `# A…Z Ñ` a la derecha resalta la letra visible y salta a
  la primera canción de esa letra.
- `AnimatedList.jsx` expone de forma opcional una ref con `scrollToIndex(index)`
  y el callback `onVisibleIndexChange(index)`; el scroll es interno al
  componente y por eso el índice lateral usa esa API en vez de `scrollIntoView`.

## Fondo y componentes visuales

- `NavLayout` monta `<DarkVeil>` (shader WebGL GLSL en `components/DarkVeil.jsx`)
  dentro de `.veil-background`: fijo, `aria-hidden`, `pointer-events: none` y
  respeta `prefers-reduced-motion`. No lo rompas añadiendo contenido encima.
- `components/SplineBackground.jsx` es **código muerto**: `@splinetool/react-spline`
  no está en `package.json`, así que importarlo rompe el build. No lo revivas
  sin añadir la dependencia.
- `AnimatedList`, `InfiniteMenu`, `ElasticSlider` y `PillNav` son componentes
  locales con CSS propio; mantén sus props actuales antes de cambiar su API.

## Despliegue en VPS

- Repo en `/var/www/SYSTEMS`, rama `test_app`. App arrancada con pm2
  (`pm2 start npm --name listen-u -- start`) en el puerto **3001**.
- nginx sirve `client/dist` y hace `proxy_pass` a `127.0.0.1:3001` para
  `music.sworlddevelop.com` (HTTPS con Certbot). El puerto 4200 es solo local.
- En el VPS hay un `.env` propio con `PORT=3001` y otro `AUTH_SECRET`. `.env`
  está ignorado por git: `git pull` no lo toca.
- El dump `custom` de PostgreSQL 18 no lo lee `pg_restore` 16; para migrar
  entre versiones usa `scripts/backup-db-portable.sh` y restaura con `psql`.
  La guía completa está en `docs/vps.md`.
