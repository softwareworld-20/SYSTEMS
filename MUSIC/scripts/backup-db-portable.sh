#!/usr/bin/env bash
# Dump SQL portable: se puede restaurar con psql en una versión ANTERIOR de PostgreSQL.
# El formato 'custom' de scripts/backup-db.sh solo se puede leer con la misma
# versión (o superior) de pg_restore; este quita las directivas nuevas de PG 18.
# Uso: scripts/backup-db-portable.sh [archivo.sql]
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
. ./.env
set +a

OUTPUT="${1:-/tmp/opencode/listenu-portable.sql}"
mkdir -p "$(dirname "$OUTPUT")"

pg_dump "$DATABASE_URL" --format=plain --no-owner --no-privileges \
  | sed -E '/^\\restrict/d; /^\\unrestrict/d; /^SET transaction_timeout/d' \
  > "$OUTPUT"

echo "Backup portable creado: $OUTPUT"
