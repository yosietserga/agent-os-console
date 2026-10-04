#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# deploy.sh — despliegue integral de Agent OS Console en un VPS vía SSH.
#
# Uso (desde la raíz del repo, en una máquina con ssh + rsync):
#   ./deploy/deploy.sh usuario@ip-del-vps [puerto]
#   REMOTE_DIR=/srv/agentos ./deploy/deploy.sh root@203.0.113.10 22
#
# Qué hace:
#   1) rsync del repo (excluye node_modules/.next/.git/db/secrets)
#   2) siembra inicial (solo primera vez): DB con el historial real,
#      .z-ai-config del entorno actual (plantilla), deploy/.env
#   3) en el VPS: instala Docker si falta + docker compose up -d --build
#   4) verificación local (app :3000 y engine :3003 desde el propio VPS)
#
# La URL pública la define SITE_ADDR en deploy/.env (dominio → HTTPS
# automático; ":80" → HTTP sobre IP). Ver deploy/README.md.
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

TARGET="${1:?Uso: ./deploy/deploy.sh usuario@host [puerto]  (ej: ./deploy/deploy.sh root@203.0.113.10)}"
PORT="${2:-22}"
REMOTE_DIR="${REMOTE_DIR:-/opt/agent-os}"

SSH_OPTS=(-p "$PORT" -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30)
SSH_CMD="ssh ${SSH_OPTS[*]}"

command -v rsync >/dev/null || { echo "ERROR: rsync no está instalado." >&2; exit 1; }
command -v ssh   >/dev/null || { echo "ERROR: ssh no está instalado."   >&2; exit 1; }

echo "[deploy] 1/4 — Sincronizando repo → ${TARGET}:${REMOTE_DIR}"
rsync -az --delete -e "$SSH_CMD" \
  --exclude-from=deploy/rsync.exclude \
  ./ "${TARGET}:${REMOTE_DIR}/"

echo "[deploy] 2/4 — Sembrando estado inicial (solo lo que no exista)"
ssh "${SSH_OPTS[@]}" "$TARGET" "mkdir -p ${REMOTE_DIR}/data/db ${REMOTE_DIR}/secrets"

# DB inicial: historial real (runs del bucle, instanciador, memoria) — solo 1ª vez
if [ -f db/custom.db ] && ! ssh "${SSH_OPTS[@]}" "$TARGET" "test -f ${REMOTE_DIR}/data/db/custom.db"; then
  echo "[deploy]   → copiando DB inicial con el historial ($(du -h db/custom.db | cut -f1))"
  scp -P "$PORT" db/custom.db "${TARGET}:${REMOTE_DIR}/data/db/custom.db"
fi

# .z-ai-config del entorno actual — SOLO como plantilla inicial:
# si su baseUrl es un endpoint interno de la nube de origen, el VPS no lo
# alcanzará; edítalo en el VPS con un baseUrl público + apiKey propios.
if [ -f /etc/.z-ai-config ] && ! ssh "${SSH_OPTS[@]}" "$TARGET" "test -f ${REMOTE_DIR}/secrets/.z-ai-config"; then
  echo "[deploy]   → copiando .z-ai-config como plantilla (rotar/ajustar baseUrl a público)"
  scp -P "$PORT" /etc/.z-ai-config "${TARGET}:${REMOTE_DIR}/secrets/.z-ai-config"
fi

# deploy/.env desde el .env local si no existe en el VPS
if [ -f .env ] && ! ssh "${SSH_OPTS[@]}" "$TARGET" "test -f ${REMOTE_DIR}/deploy/.env"; then
  echo "[deploy]   → creando deploy/.env a partir del .env local"
  scp -P "$PORT" .env "${TARGET}:${REMOTE_DIR}/deploy/.env"
fi

echo "[deploy] 3/4 — Build y arranque del stack en el VPS"
ssh "${SSH_OPTS[@]}" "$TARGET" "REMOTE_DIR=${REMOTE_DIR} bash -s" < deploy/remote-up.sh

echo "[deploy] 4/4 — Verificación desde el VPS"
ssh "${SSH_OPTS[@]}" "$TARGET" \
  "curl -s -o /dev/null -w 'app    127.0.0.1:3000 → HTTP %{http_code}\n' http://127.0.0.1:3000/ ; \
   curl -s -o /dev/null -w 'engine 127.0.0.1:3003 → HTTP %{http_code}\n' http://127.0.0.1:3003/"

echo ""
echo "[deploy] Listo. Publica el sitio según SITE_ADDR (deploy/.env en el VPS):"
echo "[deploy]   • dominio: registra el A record dominio→IP y docker compose restart caddy"
echo "[deploy]   • IP directa: ya está en http://<ip-del-vps>/ (SITE_ADDR=:80)"
