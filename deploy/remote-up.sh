#!/bin/bash
# ════════════════════════════════════════════════════════════════════════
# remote-up.sh — se ejecuta EN EL VPS (vía deploy.sh o manualmente).
# Precondición: el repo completo ya está en $REMOTE_DIR (rsync).
# Hace: docker (si falta) → secrets → docker compose up -d --build → estado.
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

REMOTE_DIR="${REMOTE_DIR:-/opt/agent-os}"
cd "$REMOTE_DIR"

# ── Docker presente (instala si falta) ──────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  echo "[up] Docker no encontrado — instalando vía get.docker.com…"
  curl -fsSL https://get.docker.com | sh
fi

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "ERROR: docker compose no disponible tras la instalación." >&2
  exit 1
fi

# ── Estructura runtime ──────────────────────────────────────────────────
mkdir -p data/db secrets

if [ ! -f deploy/.env ]; then
  cp deploy/.env.example deploy/.env
  echo "[up] deploy/.env creado desde el ejemplo."
  echo "[up] Edita GITHUB_TOKEN y SITE_ADDR, y vuelve a ejecutar."
  exit 1
fi

# SITE_ADDR garantizado (default :80 = HTTP sobre IP)
if ! grep -q '^SITE_ADDR=' deploy/.env; then
  printf '\nSITE_ADDR=:80\n' >> deploy/.env
  echo "[up] SITE_ADDR=:80 añadido a deploy/.env (HTTP sobre IP)."
  echo "[up] Para HTTPS: pon tu dominio en SITE_ADDR y reinicia (README §Operación)."
fi

if [ ! -f secrets/.z-ai-config ]; then
  echo "[up] AVISO: falta secrets/.z-ai-config."
  echo "[up]   El layer L2 (Instanciador con LLM, mejorate-synthesize, investiga,"
  echo "[up]   radiografia, inferencia del engine) operará en degradación honesta (P2)."
  echo "[up]   Para L2 completo: coloca ahí un JSON con baseUrl público + apiKey."
  echo "[up]   {\"baseUrl\":\"https://api.z.ai/api/paas/v4\",\"apiKey\":\"<tu-key>\"}"
fi

# ── Build + arranque ────────────────────────────────────────────────────
echo "[up] docker compose up -d --build (primer build: 2-5 min)…"
$DC -f deploy/docker-compose.yml --project-name agent-os up -d --build

sleep 4
echo ""
$DC -f deploy/docker-compose.yml --project-name agent-os ps
