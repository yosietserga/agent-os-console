# ════════════════════════════════════════════════════════════════════════
# Agent OS Console — imagen de producción
# Multi-stage: build con bun (bun.lock) → runtime con node (standalone
# nativo + engines de Prisma). Contexto: raíz del repo.
# ════════════════════════════════════════════════════════════════════════

# ── Etapa 1: build (bun) ─────────────────────────────────────────────────
FROM oven/bun:1-debian AS build

WORKDIR /app

# Dependencias de sistema para Prisma (engines) y TLS
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# 1) Dependencias (capa cacheada)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2) Cliente Prisma (requiere el schema)
COPY prisma ./prisma
RUN bunx prisma generate

# 3) Código + build de producción (standalone)
#    DATABASE_URL con ruta válida in-container; PrismaClient es lazy,
#    el build no abre la base.
COPY . .
ENV NODE_ENV=production \
    DATABASE_URL=file:/app/db/custom.db \
    NEXT_TELEMETRY_DISABLED=1
RUN bun run build
# build script copia .next/static + public + assets dentro de standalone
# (assets/agent-os-boilerplate es fuente de lectura en runtime).

# ── Etapa 2: runtime (node) ──────────────────────────────────────────────
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Todo el árbol de build: standalone completo + node_modules íntegro
# (prisma CLI operativo para db push en el arranque) + prisma/ + scripts/
COPY --from=build /app ./

# SQLite vive en volumen (montado por compose en /app/db)
RUN mkdir -p /app/db

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=file:/app/db/custom.db

EXPOSE 3000

COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
