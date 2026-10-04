#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# report.sh — Comando canónico: `report`
# Genera el informe de cierre de sesión con veredicto AGREE/DISAGREE,
# análisis de Fuerzas de Porter, balance de costos L2 y handoff.
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

WORKLOG="docs/memory/worklog.md"
WINS_FILE="docs/memory/wins-ledger.md"
AP_FILE="docs/memory/anti-patterns.md"
STATE_FILE="docs/memory/state.json"

log() { printf '\033[1;36m[REPORT]\033[0m %s\n' "$*"; }

SESSION_ID="SESSION-$(date -u +"%Y%m%dT%H%M%SZ")"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

log "Generating session closure report..."
log "  Session: $SESSION_ID"
log "  Timestamp: $TIMESTAMP"
echo ""

# ── 1. Balance de victorias PSIM ──
TOTAL_WINS=0
if [ -f "$WINS_FILE" ]; then
  TOTAL_WINS=$(grep -cE '^## \[WIN-[0-9]+\]' "$WINS_FILE" || echo 0)
fi

AP_COUNT=0
if [ -f "$AP_FILE" ]; then
  AP_COUNT=$(grep -cE '^## \[AP-[0-9]+\]' "$AP_FILE" || echo 0)
fi

# ── 2. Generar reporte ──
cat << EOF
═══════════════════════════════════════════════════════════════════════
 SESSION CLOSURE REPORT
 Session: $SESSION_ID
 Timestamp: $TIMESTAMP
═══════════════════════════════════════════════════════════════════════

1. AGREE/DISAGREE (placeholder — rellenar manualmente)
   ─────────────────────────────────────────────────────
   | Hipótesis | Esperado | Observado | Veredicto |
   | :--- | :--- | :--- | :--- |
   | H1 | _ | _ | AGREE/DISAGREE |
   | H2 | _ | _ | AGREE/DISAGREE |
   | H3 | _ | _ | AGREE/DISAGREE |

2. Balance de memoria empírica
   ─────────────────────────────────────────────────────
   - PSIM wins totales (W1-W8): $TOTAL_WINS
   - Anti-patterns documentados: $AP_COUNT
   - state.json last_updated: $(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('last_updated','?'))" 2>/dev/null || echo "?")

3. Fuerzas de Porter (estado)
   ─────────────────────────────────────────────────────
   F1 Nuevos Entrantes (regresiones):     mitigada (ledger append-only activo, $AP_COUNT entradas)
   F2 Poder de Proveedores (LLM lock-in): neutralizada (Control Plane L2)
   F3 Poder de Compradores (operador):    maximizada (boilerplate reutilizable)
   F4 Amenaza de Sustitutos (obsolesc.):  neutralizada (MCP/LSP/polyglot)
   F5 Rivalidad Interna (deuda técnica):  minimizada (contratos canónicos)

4. Handoff para la siguiente sesión
   ─────────────────────────────────────────────────────
   - Estado general: _(completar manualmente)_
   - Artefactos producidos esta sesión: _(listar)_
   - Siguientes pasos recomendados: _(listar)_
   - Gate Honesty: ver docs/memory/worklog.md última entrada

5. Recordatorios de cierre (Reglas P1-P9)
   ─────────────────────────────────────────────────────
   [ ] P1: ¿Releíste cada archivo editado esta sesión?
   [ ] P2: ¿Reportaste exit code + stdout reales de cada comando?
   [ ] P3: ¿Los hallazgos cerrados tienen fix en código de producción?
   [ ] P4: ¿Sincronizaste código + contrato + docs + memoria?
   [ ] P9: ¿Anexaste entrada al worklog antes de cerrar?

═══════════════════════════════════════════════════════════════════════
EOF

# ── 3. Recordatorio de anexar al worklog ──
log ""
log "Recuerda anexar tu bloque de handoff a $WORKLOG:"
log ""
cat << EOF
Bloque a anexar:

---
## [$SESSION_ID] $TIMESTAMP — <título de la sesión>

**Agente:** <nombre del agente/LLM>
**Alcance planificado:** <qué ibas a hacer>

**Comandos ejecutados:**
- <comando> → exit <N>
- ...

**Hipótesis y veredictos:**
| Hipótesis | Esperado | Observado | Veredicto |
| :--- | :--- | :--- | :--- |
| H1 | ... | ... | AGREE/DISAGREE |

**Artefactos producidos:**
1. ...

**Handoff para siguiente sesión:**
- Estado: ...
- Siguientes pasos: ...

**Gate Honesty:**
- verify.sh: <PASS/FAIL/NOT_RUN>
- audit-memory.sh: <PASS/FAIL>
EOF
log ""
log "Reporte generado. Cópialo al worklog antes de cerrar la sesión."
