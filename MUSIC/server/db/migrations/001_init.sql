-- Esquema inicial de ListenU.
-- Aplicar con: psql "$DATABASE_URL" -f server/db/migrations/001_init.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Usuarios de la app (distintos del rol de PostgreSQL music_user).
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Canciones: metadatos + audio en BYTEA para que se reproduzca desde cualquier dispositivo.
CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title text NOT NULL,
  artist text NOT NULL DEFAULT 'Artista desconocido',
  album text NOT NULL DEFAULT '—',
  cover text,
  duration double precision,
  file_name text NOT NULL,
  mime text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  data bytea,
  added_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tracks_owner_added_idx ON tracks (owner_id, added_at DESC);
CREATE INDEX IF NOT EXISTS tracks_owner_title_idx ON tracks (owner_id, lower(title));

-- Carátula/descripción por álbum (antes en localStorage).
CREATE TABLE IF NOT EXISTS album_meta (
  owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  album text NOT NULL,
  cover text,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, album)
);

-- Usuario de demostración. La clave es la misma de client/src/auth.js; se guarda como hash.
INSERT INTO app_users (username, password_hash)
VALUES ('SamuelS', crypt('Samu3l!9', gen_salt('bf', 10)))
ON CONFLICT (username) DO NOTHING;
