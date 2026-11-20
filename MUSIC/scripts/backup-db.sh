#!/usr/bin/env bash
# Vuelca esquema + metadatos + audio (BYTEA) de la BD local en un archivo.
# Uso: scripts/backup-db.sh [archivo.dump]
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
. ./.env
set +a

OUTPUT="${1:-/tmp/opencode/listenu-dump.dump}"
mkdir -p "$(dirname "$OUTPUT")"

# --no-owner/--no-privileges permite restaurar con otro rol en el VPS.
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file "$OUTPUT"

echo "Backup creado: $OUTPUT"
