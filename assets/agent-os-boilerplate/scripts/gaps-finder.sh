#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# gaps-finder.sh — Comando canónico: `gaps-finder` (mandatorio en §8.2)
#
# Detecta desincronizaciones entre AGENTS.md, README.md, state.json,
# catálogos, scripts/, y la realidad del repo. Reporta TODOS los gaps
# con severidad para que el agente los corrija antes de cerrar sesión.
#
# Implementa: BP #128 (gaps-finder mandatorio en workflow).
# Resuelve: el operador detectó que el README mostraba "11 rutas" cuando
# ya hay 16 comandos + alias rayos-x. Este script hubiera capturado eso.
# ════════════════════════════════════════════════════════════════════════
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\033[1;36m[GAPS-FINDER]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[GAP]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[GAP CRÍTICO]\033[0m %s\n' "$*"; }

EPOCH=$(date +%s)
REPORT="docs/reports/${EPOCH}-gaps-finder.md"
mkdir -p docs/reports

GAPS_TOTAL=0
GAPS_CRITICAL=0
GAPS_HIGH=0
GAPS_MEDIUM=0
GAPS_LOW=0

declare -a GAPS_LIST

add_gap() {
  local severity="$1" category="$2" description="$3"
  GAPS_LIST+=("$severity|$category|$description")
  GAPS_TOTAL=$((GAPS_TOTAL+1))
  case "$severity" in
    critical) GAPS_CRITICAL=$((GAPS_CRITICAL+1)); fail "[$severity] $category: $description" ;;
    high)     GAPS_HIGH=$((GAPS_HIGH+1));     warn "[$severity] $category: $description" ;;
    medium)   GAPS_MEDIUM=$((GAPS_MEDIUM+1)); warn "[$severity] $category: $description" ;;
    low)      GAPS_LOW=$((GAPS_LOW+1));       log "[$severity] $category: $description" ;;
  esac
}

log "═══ GAPS-FINDER: Escaneo de desincronización ═══"
log "Repo: $REPO_ROOT"
log ""

# ──────────────────────────────────────────────────────────────────────
# CHECK 1: Conteo de comandos canónicos en AGENTS.md vs scripts/ reales
# ──────────────────────────────────────────────────────────────────────
log "Check 1: Comandos canónicos AGENTS.md vs scripts/ reales"

AGENTS_COMMANDS=$(awk '/^## 0\./{flag=1;next}/^## 1\./{flag=0}flag' AGENTS.md | grep -cE '^\| `[a-z]')
SCRIPTS_SH=$(ls scripts/*.sh 2>/dev/null | wc -l)
# Restar scripts que no son comandos canónicos (install-ci-workflows.sh es utilidad)
NON_CANONICAL_SCRIPTS=1  # install-ci-workflows.sh

log "  Comandos en AGENTS.md §0: $AGENTS_COMMANDS"
log "  Scripts .sh en scripts/: $SCRIPTS_SH (esperados: $AGENTS_COMMANDS + $NON_CANONICAL_SCRIPTS utilidad = $((AGENTS_COMMANDS + NON_CANONICAL_SCRIPTS)))"

EXPECTED_SCRIPTS=$((AGENTS_COMMANDS + NON_CANONICAL_SCRIPTS))
if [ "$SCRIPTS_SH" -ne "$EXPECTED_SCRIPTS" ]; then
  add_gap high "comandos-scripts" "Scripts reales ($SCRIPTS_SH) != esperados ($EXPECTED_SCRIPTS = $AGENTS_COMMANDS comandos + $NON_CANONICAL_SCRIPTS utilidad)"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 2: Conteo de reglas cardinales en AGENTS.md vs state.json
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 2: Reglas cardinales AGENTS.md vs state.json"

AGENTS_RULES=$(grep -cE '^### 🔴 Regla P[0-9]+' AGENTS.md)
W_CTA=$(grep -cE '^### 🟡 Regla W-CTA' AGENTS.md)
STATE_RULES=$(python3 -c "import json; print(json.load(open('docs/memory/state.json'))['cardinal_rules_count'])" 2>/dev/null || echo "?")

log "  Reglas P en AGENTS.md §1: $AGENTS_RULES"
log "  Regla W-CTA: $W_CTA"
log "  state.json cardinal_rules_count: $STATE_RULES"

if [ "$AGENTS_RULES" != "$STATE_RULES" ]; then
  add_gap high "reglas-cardinales" "AGENTS.md tiene $AGENTS_RULES reglas P, state.json dice $STATE_RULES"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 3: Conteo de antipatrones en anti-patterns.md vs state.json
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 3: Antipatrones anti-patterns.md vs state.json"

AP_COUNT=$(grep -cE '^## \[AP-[0-9]+\]' docs/memory/anti-patterns.md)
STATE_AP=$(python3 -c "import json; print(json.load(open('docs/memory/state.json'))['anti_patterns_documented'])" 2>/dev/null || echo "?")

log "  AP en anti-patterns.md: $AP_COUNT"
log "  state.json anti_patterns_documented: $STATE_AP"

if [ "$AP_COUNT" != "$STATE_AP" ]; then
  add_gap high "antipatrones" "anti-patterns.md tiene $AP_COUNT APs, state.json dice $STATE_AP"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 4: Conteo de wins en wins-ledger.md vs state.json
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 4: Victorias PSIM wins-ledger.md vs state.json"

WIN_COUNT=$(grep -cE '^## \[WIN-[0-9]+\]' docs/memory/wins-ledger.md)
STATE_WIN=$(python3 -c "import json; print(json.load(open('docs/memory/state.json'))['psim_wins_count']['total'])" 2>/dev/null || echo "?")

log "  WINs en wins-ledger.md: $WIN_COUNT"
log "  state.json psim_wins_count.total: $STATE_WIN"

if [ "$WIN_COUNT" != "$STATE_WIN" ]; then
  add_gap high "victorias-psim" "wins-ledger.md tiene $WIN_COUNT WINs, state.json dice $STATE_WIN"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 5: state.json version vs AGENTS.md changelog última versión
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 5: Versión state.json vs AGENTS.md changelog"

STATE_VERSION=$(python3 -c "import json; print(json.load(open('docs/memory/state.json'))['version'])" 2>/dev/null || echo "?")
AGENTS_LAST_VERSION=$(grep -E '^\| 2026' AGENTS.md | tail -1 | awk -F'|' '{print $3}' | sed 's/^ *//; s/ *$//')

log "  state.json version: $STATE_VERSION"
log "  AGENTS.md changelog última: $AGENTS_LAST_VERSION"

if [ "$STATE_VERSION" != "$AGENTS_LAST_VERSION" ]; then
  add_gap high "version" "state.json versión ($STATE_VERSION) != AGENTS.md changelog última ($AGENTS_LAST_VERSION)"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 6: README versión vs state.json versión
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 6: README versión vs state.json versión"

README_VERSION=$(grep -oE 'Versión [0-9]+\.[0-9]+\.[0-9]+' README.md | head -1 | awk '{print $2}')
README_BADGE=$(grep -oE 'version-[0-9]+\.[0-9]+\.[0-9]+' README.md | head -1 | sed 's/version-//')

log "  README 'Versión X.Y.Z': $README_VERSION"
log "  README badge: $README_BADGE"
log "  state.json version: $STATE_VERSION"

if [ "$README_VERSION" != "$STATE_VERSION" ]; then
  add_gap critical "readme-version" "README dice Versión $README_VERSION, state.json dice $STATE_VERSION"
fi
if [ "$README_BADGE" != "$STATE_VERSION" ]; then
  add_gap critical "readme-badge" "README badge dice $README_BADGE, state.json dice $STATE_VERSION"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 7: README diagrama "PATHS ALTERNOS" — cuenta rutas vs comandos reales
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 7: README diagrama maestro — rutas alternas vs comandos reales"

README_ROUTES=$(grep -cE '├───|└───' README.md | head -1)
# Buscar específicamente el bloque "PASO 3 — DISPATCH DE COMANDO"
README_DISPATCH_ROUTES=$(awk '/PASO 3 — DISPATCH/,/PASO 4/' README.md | grep -cE '├───|└───')
log "  Rutas en bloque DISPATCH del README: $README_DISPATCH_ROUTES"
log "  Comandos canónicos en AGENTS.md: $AGENTS_COMMANDS"

if [ "$README_DISPATCH_ROUTES" -lt "$AGENTS_COMMANDS" ]; then
  add_gap critical "readme-diagrama-rutas" "README diagrama DISPATCH tiene $README_DISPATCH_ROUTES rutas, AGENTS.md tiene $AGENTS_COMMANDS comandos. Faltan $((AGENTS_COMMANDS - README_DISPATCH_ROUTES)) rutas en el diagrama."
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 8: README "Estado actual" — counts vs state.json
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 8: README 'Estado actual' vs state.json"

# Mapeo de keys state.json → etiquetas humanas en README
declare -A KEY_TO_LABEL
KEY_TO_LABEL[cardinal_rules_count]="Reglas cardinales"
KEY_TO_LABEL[canonical_commands_count]="Comandos canónicos"
KEY_TO_LABEL[anti_patterns_documented]="Antipatrones documentados"
KEY_TO_LABEL[psim_wins_count_total]="Victorias PSIM"
KEY_TO_LABEL[personas_documented]="Personas"
KEY_TO_LABEL[mcp_servers_count]="MCP servers"
KEY_TO_LABEL[mcp_skills_count]="MCP skills"
KEY_TO_LABEL[ide_integrations_count]="IDE integrations"
KEY_TO_LABEL[reference_repos_scanned]="Repos de referencia"

for key in cardinal_rules_count canonical_commands_count anti_patterns_documented personas_documented mcp_servers_count mcp_skills_count ide_integrations_count reference_repos_scanned; do
  STATE_VAL=$(python3 -c "import json; print(json.load(open('docs/memory/state.json'))['$key'])" 2>/dev/null || echo "?")
  LABEL="${KEY_TO_LABEL[$key]}"
  # Buscar en README tabla estado actual: | <Label> | <valor> |
  README_VAL=$(awk '/## Estado actual/,/## [0-9]/' README.md | grep -E "\| $LABEL" | grep -oE '\| [0-9]+' | head -1 | tr -d '| ')
  log "  $key ($LABEL): state.json=$STATE_VAL README=$README_VAL"
  if [ "$STATE_VAL" != "?" ] && [ -n "$README_VAL" ] && [ "$STATE_VAL" != "$README_VAL" ]; then
    add_gap medium "readme-estado-$key" "README estado actual dice $README_VAL para $LABEL, state.json dice $STATE_VAL"
  fi
  if [ "$STATE_VAL" != "?" ] && [ -z "$README_VAL" ]; then
    add_gap medium "readme-estado-$key" "README estado actual no encuentra $LABEL (state.json=$STATE_VAL)"
  fi
done

# Check especial para psim_wins_count.total
STATE_WINS_TOTAL=$(python3 -c "import json; print(json.load(open('docs/memory/state.json'))['psim_wins_count']['total'])" 2>/dev/null || echo "?")
README_WINS=$(awk '/## Estado actual/,/## [0-9]/' README.md | grep -E "Victorias PSIM" | grep -oE '\| [0-9]+' | head -1 | tr -d '| ')
log "  psim_wins.total (Victorias PSIM): state.json=$STATE_WINS_TOTAL README=$README_WINS"
if [ "$STATE_WINS_TOTAL" != "?" ] && [ -n "$README_WINS" ] && [ "$STATE_WINS_TOTAL" != "$README_WINS" ]; then
  add_gap medium "readme-estado-wins" "README estado actual dice $README_WINS para Victorias PSIM, state.json dice $STATE_WINS_TOTAL"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 9: MCP servers configs vs state.json
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 9: MCP servers configs vs state.json"

MCP_SERVERS_FILES=$(ls mcp/servers/*.mcp.json 2>/dev/null | wc -l)
STATE_MCP_SERVERS=$(python3 -c "import json; print(json.load(open('docs/memory/state.json'))['mcp_servers_count'])" 2>/dev/null || echo "?")

log "  Archivos .mcp.json en mcp/servers/: $MCP_SERVERS_FILES"
log "  state.json mcp_servers_count: $STATE_MCP_SERVERS"

if [ "$MCP_SERVERS_FILES" != "$STATE_MCP_SERVERS" ]; then
  add_gap high "mcp-servers" "mcp/servers/ tiene $MCP_SERVERS_FILES archivos, state.json dice $STATE_MCP_SERVERS"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 10: MCP skills dirs vs state.json
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 10: MCP skills dirs vs state.json"

MCP_SKILLS_DIRS=$(find mcp/skills -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)
STATE_MCP_SKILLS=$(python3 -c "import json; print(json.load(open('docs/memory/state.json'))['mcp_skills_count'])" 2>/dev/null || echo "?")

log "  Directorios en mcp/skills/: $MCP_SKILLS_DIRS"
log "  state.json mcp_skills_count: $STATE_MCP_SKILLS"

if [ "$MCP_SKILLS_DIRS" != "$STATE_MCP_SKILLS" ]; then
  add_gap high "mcp-skills" "mcp/skills/ tiene $MCP_SKILLS_DIRS directorios, state.json dice $STATE_MCP_SKILLS"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 11: Personas en docs/personas/ vs state.json
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 11: Personas docs/personas/ vs state.json"

PERSONAS_FILES=$(find docs/personas -name "*.md" -not -name "README.md" 2>/dev/null | wc -l)
STATE_PERSONAS=$(python3 -c "import json; print(json.load(open('docs/memory/state.json'))['personas_documented'])" 2>/dev/null || echo "?")

log "  Archivos .md en docs/personas/ (excluyendo README): $PERSONAS_FILES"
log "  state.json personas_documented: $STATE_PERSONAS"

if [ "$PERSONAS_FILES" != "$STATE_PERSONAS" ]; then
  add_gap medium "personas" "docs/personas/ tiene $PERSONAS_FILES archivos, state.json dice $STATE_PERSONAS"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 12: Worklog SESSIONs consecutivas
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 12: Worklog SESSIONs consecutivas sin saltos"

SESSIONS=$(grep -oE 'SESSION-[0-9]+' docs/memory/worklog.md | sort -u | sed 's/SESSION-//')
LAST_SESSION=$(echo "$SESSIONS" | sort -n | tail -1)
LAST_SESSION=$((10#$LAST_SESSION))  # forzar base 10
EXPECTED_SESSIONS=$((LAST_SESSION + 1))

log "  Sesiones en worklog: $(echo "$SESSIONS" | wc -l) (de SESSION-000 a SESSION-$(printf '%03d' $LAST_SESSION))"

# Verificar que no hay saltos (usar base 10 explícita para evitar error con leading zeros)
PREV=-1
for s in $(echo "$SESSIONS" | sort -n); do
  s=$((10#$s))  # forzar base 10
  if [ $PREV -ge 0 ] && [ $((PREV + 1)) -ne $s ]; then
    add_gap medium "worklog-sessions" "Salto en worklog: SESSION-$(printf '%03d' $PREV) → SESSION-$(printf '%03d' $s) (faltan sesiones)"
  fi
  PREV=$s
done

# ──────────────────────────────────────────────────────────────────────
# CHECK 13: PR template checkboxes vs reglas cardinales
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 13: PR template checkboxes vs reglas cardinales"

PR_CHECKBOXES=$(grep -cE '^\- \[ \] \*\*P[0-9]' .github/PULL_REQUEST_TEMPLATE.md)
log "  Checkboxes P en PR template: $PR_CHECKBOXES"
log "  Reglas P en AGENTS.md: $AGENTS_RULES"

if [ "$PR_CHECKBOXES" -lt "$AGENTS_RULES" ]; then
  add_gap high "pr-template" "PR template tiene $PR_CHECKBOXES checkboxes P, AGENTS.md tiene $AGENTS_RULES reglas P. Faltan $((AGENTS_RULES - PR_CHECKBOXES))."
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 14: Catálogos — BP máximas vs state.json (si existe el campo)
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 14: Catálogos — counts reales vs declarados"

BP_COUNT=$(grep -cE '^[0-9]+\. \*\*' docs/catalogs/100-best-practices.md)
KF_COUNT=$(grep -cE '^[0-9]+\. \*\*' docs/catalogs/100-killer-features.md)
AP_CATALOG_COUNT=$(grep -cE '^[0-9]+\. \*\*' docs/catalogs/100-anti-patterns.md)

log "  BP en catálogo: $BP_COUNT (esperado ≥100+extras)"
log "  Killer en catálogo: $KF_COUNT (esperado ≥100+extras)"
log "  AP en catálogo: $AP_CATALOG_COUNT (esperado ≥100)"

if [ "$BP_COUNT" -lt 122 ]; then
  add_gap medium "catalogo-bp" "Catálogo BP tiene $BP_COUNT entradas, esperado ≥122 (100 base + 22 extra)"
fi
if [ "$KF_COUNT" -lt 107 ]; then
  add_gap medium "catalogo-killer" "Catálogo Killer tiene $KF_COUNT entradas, esperado ≥107 (100 base + 7 extra)"
fi

# ──────────────────────────────────────────────────────────────────────
# CHECK 15: README changelog — todas las versiones presentes
# ──────────────────────────────────────────────────────────────────────
log ""
log "Check 15: README changelog vs AGENTS.md changelog"

README_CHANGELOG_ENTRIES=$(grep -cE '^\| 2026-' README.md)
AGENTS_CHANGELOG_ENTRIES=$(grep -cE '^\| 2026-' AGENTS.md)

log "  Entradas changelog README: $README_CHANGELOG_ENTRIES"
log "  Entradas changelog AGENTS.md: $AGENTS_CHANGELOG_ENTRIES"

if [ "$README_CHANGELOG_ENTRIES" -ne "$AGENTS_CHANGELOG_ENTRIES" ]; then
  add_gap medium "changelog-sync" "README changelog tiene $README_CHANGELOG_ENTRIES entradas, AGENTS.md tiene $AGENTS_CHANGELOG_ENTRIES"
fi

# ──────────────────────────────────────────────────────────────────────
# REPORTE FINAL
# ──────────────────────────────────────────────────────────────────────
log ""
log "═══ REPORTE GAPS-FINDER ═══"
log "Total gaps detectados: $GAPS_TOTAL"
log "  Critical: $GAPS_CRITICAL"
log "  High:     $GAPS_HIGH"
log "  Medium:   $GAPS_MEDIUM"
log "  Low:      $GAPS_LOW"
log ""

# Generar reporte
cat > "$REPORT" << EOF
# Gaps-Finder Report

> **Epoch:** $EPOCH
> **Timestamp:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
> **Generado por:** \`scripts/gaps-finder.sh\` (comando canónico \`gaps-finder\`)
> **Implementa:** BP #128 (gaps-finder mandatorio en workflow §8.2)

## Resumen

| Severidad | Count |
| :--- | :---: |
| Critical | $GAPS_CRITICAL |
| High | $GAPS_HIGH |
| Medium | $GAPS_MEDIUM |
| Low | $GAPS_LOW |
| **Total** | **$GAPS_TOTAL** |

## Gaps detectados (detalle)

| # | Severidad | Categoría | Descripción |
| :---: | :---: | :--- | :--- |
EOF

i=1
for gap in "${GAPS_LIST[@]:-}"; do
  [ -z "$gap" ] && continue
  severity=$(echo "$gap" | cut -d'|' -f1)
  category=$(echo "$gap" | cut -d'|' -f2)
  description=$(echo "$gap" | cut -d'|' -f3)
  echo "| $i | $severity | $category | $description |" >> "$REPORT"
  i=$((i+1))
done

cat >> "$REPORT" << EOF

## Acciones requeridas

- **Critical**: bloquear commit. Corregir ANTES de cerrar sesión.
- **High**: corregir en esta sesión. No cerrar sin addressar.
- **Medium**: agendar para próxima sesión si no se puede corregir ahora.
- **Low**: informativo. Corregir cuando sea conveniente.

## Próximos pasos

1. Para cada gap Critical/High: corregir el archivo desincronizado.
2. Re-ejecutar \`bash scripts/gaps-finder.sh\` hasta cero gaps Critical/High.
3. Si quedan Medium/Low: documentar en worklog como deuda técnica.
4. Cerrar sesión con auto-crítica P13 que incluye verificación gaps-finder.

---

> Reporte inmutable (Regla P9 extendida a \`docs/reports/\`).
> Generado por \`scripts/gaps-finder.sh\`.
EOF

log "Reporte: $REPORT"
log ""

if [ "$GAPS_CRITICAL" -gt 0 ] || [ "$GAPS_HIGH" -gt 0 ]; then
  log "❌ BLOCK: hay $GAPS_CRITICAL gaps críticos y $GAPS_HIGH altos. Corregir antes de cerrar."
  exit 1
else
  log "✅ OK: cero gaps críticos y cero altos. Gaps medium/low: $GAPS_MEDIUM/$GAPS_LOW."
  exit 0
fi
