#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# audit-memory.sh — Comando canónico: `audit memory`
# Compara el código contra docs/memory/anti-patterns.md.
# Falla de inmediato si detecta la reintroducción de un antipatrón conocido.
# Implementa Best Practice #93 (Penalización por Reincidencia).
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SCOPE="${1:-.}"
AP_FILE="docs/memory/anti-patterns.md"

log() { printf '\033[1;36m[MEMORY-AUDIT]\033[0m %s\n' "$*"; }

if [ ! -f "$AP_FILE" ]; then
  log "ERROR: $AP_FILE not found."
  exit 1
fi

log "Reading $AP_FILE..."
# Extrae títulos de antipatrones: ## [AP-XXX] Título
mapfile -t AP_ENTRIES < <(grep -E '^## \[AP-[0-9]+\]' "$AP_FILE" | sed 's/^## \[AP-\([0-9]\+\)\] //')

log "Found ${#AP_ENTRIES[@]} anti-patterns in ledger."
log "Scanning scope '$SCOPE' for reincidences..."
echo ""

HITS=0
for entry in "${AP_ENTRIES[@]}"; do
  # Heurística: extraer keywords significativos del título (>4 chars, alfabéticos)
  # Ejemplo: "Falso Éxito por No-Op en Scripts de Modificación" → keywords: falso, éxito, scripts, modificación
  keywords=$(echo "$entry" | tr '[:upper:]' '[:lower:]' | \
    grep -oE '[a-záéíóúñ]{5,}' | \
    grep -vE '^(por|para|con|sin|los|las|una|uno|del|desde|hacia|that|with|from|their|when|than|then)$' || true)

  for kw in $keywords; do
    # Buscar el keyword en el código (excluyendo docs/memory/, node_modules, etc.)
    matches=$(grep -rIl --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
                            --include='*.py' --include='*.go' --include='*.rs' --include='*.php' \
                            --include='*.cpp' --include='*.h' \
                            --exclude-dir=node_modules --exclude-dir=vendor --exclude-dir=target \
                            --exclude-dir=.git --exclude-dir=docs \
                            "$kw" "$SCOPE" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      # Verificar que no sea el propio archivo de memoria
      real_matches=$(echo "$matches" | grep -v 'docs/memory/' || true)
      if [ -n "$real_matches" ]; then
        printf '\033[1;33m[!] Potential reincidence\033[0m\n'
        printf '    Anti-pattern: %s\n' "$entry"
        printf '    Keyword:      %s\n' "$kw"
        printf '    Files:\n'
        echo "$real_matches" | head -5 | sed 's/^/      /'
        echo ""
        HITS=$((HITS+1))
      fi
    fi
  done
done

echo "═══════════════════════════════════════════════════════════════"
if [ "$HITS" -eq 0 ]; then
  printf '\033[1;32m[OK]\033[0m No anti-pattern reincidences detected.\n'
  exit 0
else
  printf '\033[1;31m[FAIL]\033[0m %d potential anti-pattern reincidence(s) detected.\n' "$HITS"
  printf 'Review manually. If real, REJECT the change and log in worklog.md.\n'
  exit 1
fi
