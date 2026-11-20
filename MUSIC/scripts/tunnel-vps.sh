#!/usr/bin/env bash
# Abre un túnel SSH: la BD del VPS queda en localhost:5433.
# Uso: scripts/tunnel-vps.sh usuario@host
set -euo pipefail

TARGET="${1:?Uso: scripts/tunnel-vps.sh usuario@host}"
echo "Túnel abierto en 127.0.0.1:5433 -> $TARGET:5432 (Ctrl+C para cerrar)"
exec ssh -N -o ServerAliveInterval=30 -L 5433:127.0.0.1:5432 "$TARGET"
