# Paso 6 — Migración de PostgreSQL al VPS

La idea es **no cambiar una sola línea de código**: solo `DATABASE_URL`.
El esquema, los metadatos y el audio viajan en un único dump.

Estado real de este despliegue:

- VPS: Ubuntu 24.04, Node 22, PostgreSQL 16.15, pm2, nginx + Certbot.
- Repo: `/var/www/SYSTEMS`, rama `test_app`.
- App: `pm2 start npm --name listen-u -- start` (puerto **3001**).
- URL pública: `https://music.sworlddevelop.com` (nginx → `127.0.0.1:3001`).
- Local: PostgreSQL 18.6 en `127.0.0.1:5432`, app en el puerto 4200.

---

## 1. Preparar PostgreSQL en el VPS

```bash
ssh softwareworld@5.253.234.225
```

El rol `music_user` y la base `db_music` se crean **una sola vez** (necesita
`sudo`). La contraseña se genera en el propio VPS y queda solo en `.env`:

```bash
cd /var/www/SYSTEMS/MUSIC
DBPASS=$(openssl rand -hex 16)

sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'music_user') THEN
    CREATE ROLE music_user LOGIN PASSWORD '$DBPASS';
  ELSE
    ALTER ROLE music_user WITH LOGIN PASSWORD '$DBPASS';
  END IF;
END
\$\$;
SQL

sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='db_music'" \
  | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE db_music OWNER music_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE db_music TO music_user;"

umask 077
printf 'PORT=3001\nDATABASE_URL=postgresql://music_user:%s@127.0.0.1:5432/db_music\nAUTH_SECRET=%s\n' \
  "$DBPASS" "$(openssl rand -hex 32)" > .env
unset DBPASS
```

> `psql` **no** interpola variables dentro de un bloque `DO $$ … $$`: por eso la
> contraseña se inyecta desde el shell con un heredoc sin comillas.

---

## 2. Volcar la BD local

`pg_dump` de PostgreSQL 18 produce un archivo `custom` que **pg_restore 16 no
puede leer** (`unsupported version (1.16)`). Tampoco entiende `transaction_timeout`
ni `\restrict`. Por eso se usa el dump SQL portable:

```bash
scripts/backup-db-portable.sh /tmp/opencode/listenu-portable.sql
scp /tmp/opencode/listenu-portable.sql softwareworld@5.253.234.225:/tmp/listenu.sql
```

`scripts/restore-db.sh` sigue siendo válido para dumps `custom` cuando ambos
servidores tienen la misma versión de PostgreSQL.

---

## 3. Restaurar en el VPS

```bash
ssh softwareworld@5.253.234.225
cd /var/www/SYSTEMS/MUSIC
set -a; . ./.env; set +a
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/listenu.sql
psql "$DATABASE_URL" -c 'SELECT count(*) FROM tracks;'
rm /tmp/listenu.sql
```

Si no quieres subir el archivo, abre un túnel con
`scripts/tunnel-vps.sh softwareworld@5.253.234.225` y usa `127.0.0.1:5433` en la
`DATABASE_URL` del proceso que hace `pg_restore`.

---

## 4. Desplegar y arrancar

```bash
ssh softwareworld@5.253.234.225
cd /var/www/SYSTEMS
git pull --ff-only origin test_app
cd MUSIC
npm ci
npm run build
pm2 start npm --name listen-u -- start
pm2 save
```

Si el VPS tiene un lockfile modificado por otro `npm`, guardarlo antes con
`git stash push -- MUSIC/package-lock.json`.

`client/dist` debe existir antes de arrancar: Express lo comprueba una sola vez
al iniciar. El `AUTH_SECRET` del VPS es distinto del local (así las sesiones no
se comparten entre entornos).

### Reverse proxy

`/etc/nginx/sites-available/music.sworlddevelop.com` ya sirve `client/dist`,
redirige 80 → 443 con Certbot y hace `proxy_pass` a `127.0.0.1:3001`. No hace
falta tocar nginx: basta con que Express escuche en 3001 (`PORT` del `.env`).
El proxy `/api` de `client/vite.config.js` solo afecta al `npm run dev`.

Para que pm2 se levante solo tras un reinicio, ejecuta una vez (requiere sudo):

```bash
pm2 startup      # copia y ejecuta el comando sudo que imprime
pm2 save
```

---

## 5. Verificación

```bash
curl -sS https://music.sworlddevelop.com/api/health
# {"ok":true,...,"db":"ok"}

curl -sS -X POST https://music.sworlddevelop.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"SamuelS","password":"Samu3l!9"}'
```

En el navegador: entrar en `https://music.sworlddevelop.com`, iniciar sesión
con `SamuelS`, comprobar `/playlist` y reproducir una pista (el audio se baja
con el token mediante `fetch`).

---

## Seguridad

- PostgreSQL escucha solo en localhost; no exponer el puerto 5432.
- `.env` está ignorado por git: un `git pull` nunca lo crea ni lo sobrescribe.
  Cada entorno tiene su propia `DATABASE_URL` y su propio `AUTH_SECRET`.
- No subir dumps ni contraseñas al repositorio. Borrar el dump del VPS tras
  restaurar.
