#!/bin/bash
# ════════════════════════════════════════════════════════════════════════
# entrypoint.sh — arranque del contenedor app
# 1) prisma db push (idempotente; SIN --accept-data-loss: si el schema
#    derivase en pérdida de datos el arranque falla ruidosamente (P2),
#    nunca pierde historial en silencio).
# 2) Next.js standalone con node (nativo).
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

cd /app
mkdir -p /app/db

echo "[entrypoint] Aplicando schema Prisma (idempotente)…"
npx --yes prisma db push --schema prisma/schema.prisma

echo "[entrypoint] Arrancando Agent OS Console (Next standalone, node)…"
exec node .next/standalone/server.js
