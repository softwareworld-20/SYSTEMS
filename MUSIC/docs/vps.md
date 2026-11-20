# Paso 6 — Migración de PostgreSQL al VPS

La idea es **no cambiar una sola línea de código**: solo `DATABASE_URL`.
El esquema, los metadatos y el audio viajan en un único `pg_dump`.

## 0. Requisitos

- VPS con Ubuntu/Debian y acceso SSH (`usuario@host`).
- En el VPS: Node 20+ (se probó con Node 26), npm y PostgreSQL.
- En local: `.env` con la `DATABASE_URL` de `db_music` (ya configurada).

---

## 1. Preparar PostgreSQL en el VPS

Conectarse:

```bash
ssh usuario@host
```

Instalar (si no está):

```bash
sudo apt update
sudo apt install -y postgresql postgresql-client
sudo systemctl enable --now postgresql
```

Crear el rol y la base (elige una contraseña fuerte y **no la reutilices**):

```bash
sudo -u postgres psql <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'music_user') THEN
    CREATE ROLE music_user LOGIN PASSWORD 'CAMBIA_ESTA_CLAVE';
  ELSE
    ALTER ROLE music_user WITH LOGIN PASSWORD 'CAMBIA_ESTA_CLAVE';
  END IF;
END
$$;
SQL

sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='db_music'" \
  | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE db_music OWNER music_user;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE db_music TO music_user;"
```

> Deja la base **vacía**: el dump traerá las tablas. Si creas primero el esquema
> con la migración, `pg_restore` encontrará objetos duplicados.

---

## 2. Volcar la BD local y subir el dump

Desde `MUSIC/` en tu laptop:

```bash
scripts/backup-db.sh /tmp/opencode/listenu-dump.dump
scp /tmp/opencode/listenu-dump.dump usuario@host:/tmp/listenu-dump.dump
```

El dump es `custom` e incluye esquema, `app_users`, `tracks` (con `data bytea`)
y `album_meta`. No contiene la contraseña de `.env`.

---

## 3. Restaurar en el VPS

Con `DATABASE_URL` del VPS:

```bash
ssh usuario@host
export TARGET_DATABASE_URL='postgresql://music_user:CAMBIA_ESTA_CLAVE@127.0.0.1:5432/db_music'
scripts/restore-db.sh /tmp/listenu-dump.dump
psql "$TARGET_DATABASE_URL" -c 'SELECT count(*) AS tracks FROM tracks;'
```

Si prefieres restaurar desde tu laptop sin subir el dump, abre el túnel:

```bash
scripts/tunnel-vps.sh usuario@host        # deja 127.0.0.1:5433 apuntando al VPS
```

y en otra terminal:

```bash
export TARGET_DATABASE_URL='postgresql://music_user:CAMBIA_ESTA_CLAVE@127.0.0.1:5433/db_music'
scripts/restore-db.sh /tmp/opencode/listenu-dump.dump
```

---

## 4. Arrancar la app en el VPS

Subir el proyecto (sin `node_modules` ni `.env`):

```bash
rsync -av --exclude node_modules --exclude .git --exclude .env \
  ./ usuario@host:/home/usuario/listenu/
```

En el VPS:

```bash
cd /home/usuario/listenu
cp .env.example .env
# Editar .env:
#   DATABASE_URL=postgresql://music_user:CAMBIA_ESTA_CLAVE@127.0.0.1:5432/db_music
#   AUTH_SECRET=<openssl rand -hex 32>   <- distinto del secreto local
#   PORT=4200
npm ci
npm run build
npm start
```

`client/dist` debe existir antes de `npm start`: el servidor lo comprueba solo
una vez al arrancar. Para producción conviene `pm2 start npm -- start` o un
servicio systemd, y un reverse proxy (Nginx/Caddy) con HTTPS.

> Si el VPS tiene otro puerto para Express, cambia `PORT` **y** el proxy
> `target` en `client/vite.config.js`. El proxy solo afecta al `npm run dev`;
> en producción Express sirve `client/dist` directamente.

### Sobre GitHub y `git pull`

El código es el **mismo** en local y en el VPS, pero la configuración **no**:
`.env` está en `.gitignore` y **no se sube a GitHub**, así que un `git pull` en el
VPS nunca lo crea ni lo sobrescribe. Cada entorno tiene su propio `.env`:

- local: `DATABASE_URL` apunta a `127.0.0.1:5432` y su `AUTH_SECRET`;
- VPS: `DATABASE_URL` apunta a su propio PostgreSQL y **otro** `AUTH_SECRET`.

Las plantillas versionadas son `.env.example` y `.env.vps.example`. Usar un
`AUTH_SECRET` distinto en el VPS es lo correcto: invalida las sesiones del otro
entorno y evita compartir el secreto entre máquinas. Al cambiar de entorno hay
que volver a iniciar sesión (el token viejo dejará de ser válido).

---

## 5. Verificación

```bash
curl -sS http://localhost:4200/api/health
# {"ok":true,...,"db":"ok"}

curl -sS -X POST http://localhost:4200/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"SamuelS","password":"Samu3l!9"}'
# {"token":"...","username":"SamuelS","expiresIn":28800}
```

Desde el navegador: entrar con `SamuelS`, comprobar que `/playlist` lista las
canciones y que una pista suena (el audio se descarga con el token).

---

## Seguridad

- No expongas el puerto 5432 a Internet: solo localhost o túnel SSH.
- `AUTH_SECRET` debe ser distinto en local y VPS; cambiarlo invalida sesiones.
- `.env` está ignorado por git; nunca subas la contraseña ni el dump a un repo.
- El dump contiene el audio: guárdalo en una ruta privada y bórralo del VPS
  después de restaurar.
