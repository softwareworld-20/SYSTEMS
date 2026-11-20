#!/usr/bin/env bash
# Restaura un dump en la BD de destino (debe estar vacía).
# Uso: TARGET_DATABASE_URL='postgres://...' scripts/restore-db.sh archivo.dump
set -euo pipefail

DUMP="${1:?Uso: scripts/restore-db.sh archivo.dump}"
: "${TARGET_DATABASE_URL:?Define TARGET_DATABASE_URL con la cadena del destino}"

pg_restore \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  --dbname "$TARGET_DATABASE_URL" \
  "$DUMP"

echo "Restauración completada."
