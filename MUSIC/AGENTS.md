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
- No hay backend de autenticación ni base de datos: el login es una compuerta
  de demostración en el cliente (`auth.js`) y todo el estado musical vive en el
  navegador.

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

### Acceso de demostración

- `auth.js` define `SamuelS` / `Samu3l!9` (8 caracteres, ninguno repetido). No
  es seguridad real: está a la vista en el bundle (no se muestra en el login).
- `signIn` guarda la marca de sesión en `sessionStorage` (`listen-u:session`,
  con respaldo en memoria) y `RequireAuth` redirige a `/login` si no hay sesión.
  `signOut` limpia esa marca y el menú del perfil vuelve a `/login`.

## Datos y persistencia (solo cliente)

| Dato | Parte | Clave / ubicación |
| --- | --- | --- |
| Metadatos de canciones | `hooks/useTracks.js` | localStorage `listen-u:tracks` |
| Blobs de audio | `trackFiles.js` | IndexedDB `listen-u`, store `track-files` (clave = id del track) |
| Sugerencias de artista/álbum | `components/UploadModal.jsx` | localStorage `listen-u:artists`, `listen-u:albums` |
| Carátula/descripción de álbum | `albumMeta.js` | localStorage `listen-u:album-meta` |
| Sesión de demo | `auth.js` | sessionStorage `listen-u:session` |

- Cada track tiene `id = crypto.randomUUID()` y un flag `hasFile`. Los metadatos
  y el blob se guardan por separado; si falla IndexedDB, el track se añade igual
  con `hasFile: false` y el reproductor mostrará "El audio de esta canción no
  está disponible.".
- `addTrack` recibe `{ file, ...meta }`: separa el `File` antes de guardar la
  metadata en localStorage (nunca guardes el `File` ahí). `addTracks(items)` es
  la versión múltiple: guarda los blobs en orden y añade todas las canciones de
  una sola vez.
- `buildAlbums(tracks)` agrupa por `album`, usa `—` para "Sin álbum" (va al
  final), y toma la carátula de `albumMeta` o de la primera canción con cover.

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
  precarga los datos. Guardar llama a `updateTrack(id, patch)`, que conserva
  `id`, `hasFile`, duración y el blob de IndexedDB; el alta sigue usando
  `addTrack`.
- `audio.js` centraliza `isAudioFile`, `audioMime` y `normalizeAudio`. Los blobs
  sin MIME (o con MIME de vídeo, típico en `.m4a`) se guardan como `File` con el
  MIME correcto para que el object URL sea reproducible. El track guarda
  además el campo `mime`.
- `mp3.js` importa `jsmediatags` de forma diferida al seleccionar el primer
  archivo y lee título/artista/álbum/carátula (ID3 → data URL). En formatos no
  MP3 suele devolver campos vacíos; la subida usa entonces el nombre del
  archivo. No es un error de la app.
- `media.js` lee la duración con un `<audio>` temporal sobre el blob
  normalizado (revoca el object URL) y formatea `m:ss` / `h:mm:ss`.
- `Player.jsx` es un drawer lateral derecho: reproduce el blob de IndexedDB
  mediante object URL normalizado, lo revoca al cambiar de pista y al desmontar,
  y usa `ElasticSlider` para el volumen. Si el códec no es compatible con el
  navegador, muestra un error claro en español en vez de fallar en silencio.
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
