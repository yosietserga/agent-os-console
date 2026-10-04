#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# start.sh — Comando canónico: `start` / `inicia`
# Bootstrap completo: verifica DB/Redis/MQ, migra, seed demo, arranca servers.
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\033[1;36m[START]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[ERR]\033[0m %s\n' "$*" >&2; }

# Cargar .env si existe
if [ -f .env ]; then
  set -a; . .env; set +a
  log ".env loaded"
else
  err ".env not found. Copy .env.example to .env and configure."
  exit 1
fi

# ── 1. Verificar infraestructura local ──
log "Checking infrastructure..."

check_port() {
  local port="$1" name="$2"
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn 2>/dev/null | grep -q ":${port} "; then
      log "  [OK] $name listening on :${port}"
      return 0
    fi
  fi
  log "  [NOT_RUN] $name on :${port} (ss not available or port closed)"
  return 1
}

check_port 5432 "PostgreSQL" || true
check_port 6379 "Redis" || true
check_port 5672 "RabbitMQ" || true

# ── 2. Detectar stack y aplicar migraciones ──
if [ -f package.json ]; then
  log "TypeScript/Node stack detected."
  command -v pnpm >/dev/null || { err "pnpm not installed"; exit 1; }
  log "Installing dependencies..."
  pnpm install --frozen-lockfile
  if [ -f prisma/schema.prisma ] && [ -n "${DATABASE_URL:-}" ]; then
    log "Running Prisma migrations..."
    pnpm exec prisma migrate deploy
    log "Running Prisma seed (if any)..."
    pnpm exec prisma db seed || log "  [NOT_RUN] no seed configured"
  fi
elif [ -f pyproject.toml ]; then
  log "Python stack detected."
  command -v uv >/dev/null || { err "uv not installed (pip install uv)"; exit 1; }
  uv sync --frozen
  if [ -d migrations ] && command -v alembic >/dev/null 2>&1; then
    log "Running Alembic migrations..."
    alembic upgrade head
  fi
elif [ -f go.mod ]; then
  log "Go stack detected."
  log "Building..."
  go build ./...
elif [ -f Cargo.toml ]; then
  log "Rust stack detected."
  cargo build --release
elif [ -f composer.json ]; then
  log "PHP stack detected."
  composer install --no-interaction --prefer-dist
  if [ -f bin/console ]; then
    log "Running Doctrine migrations..."
    php bin/console doctrine:migrations:migrate --no-interaction || true
  fi
elif [ -f CMakeLists.txt ]; then
  log "C++ stack detected."
  cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
  cmake --build build -j"$(nproc)"
else
  log "No language stack detected (boilerplate-only mode)."
  log "Skipping migrations and build steps."
fi

# ── 3. Aplicar DDL del Control Plane L2 (si hay PostgreSQL) ──
if [ -n "${DATABASE_URL:-}" ] && [ -f docs/l2-control-plane/l2-schema.sql ]; then
  if command -v psql >/dev/null 2>&1; then
    log "Applying L2 Control Plane DDL..."
    if psql "$DATABASE_URL" -f docs/l2-control-plane/l2-schema.sql; then
      log "  [OK] L2 schema applied (exit 0)"
    else
      err "  [FAIL] L2 schema application failed (exit $?)"
      exit 1
    fi
  else
    log "  [NOT_RUN] psql not available; L2 DDL not applied"
  fi
fi

# ── 4. Arrancar servidores (background) ──
log "Starting dev server..."
if [ -f package.json ]; then
  if grep -q '"dev"' package.json; then
    log "  [CMD] pnpm run dev"
    exec pnpm run dev
  fi
elif [ -f pyproject.toml ]; then
  log "  [CMD] uv run uvicorn app.main:app --reload"
  exec uv run uvicorn app.main:app --reload --port "${APP_PORT:-3000}"
elif [ -f go.mod ]; then
  log "  [CMD] go run ./cmd/server"
  exec go run ./cmd/server
elif [ -f Cargo.toml ]; then
  log "  [CMD] cargo run --release"
  exec cargo run --release
fi

log "Bootstrap complete. No dev server command found for this stack."
log "Done."
