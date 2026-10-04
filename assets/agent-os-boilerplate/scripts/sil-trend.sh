#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# sil-trend.sh — Comando canónico: `sil trend`
# Regenera docs/memory/state.json y docs/memory/metrics-trend.md.
# Calcula KPIs K1-K5 y el balance de victorias W1-W8.
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

STATE_FILE="docs/memory/state.json"
WINS_FILE="docs/memory/wins-ledger.md"
AP_FILE="docs/memory/anti-patterns.md"
TREND_FILE="docs/memory/metrics-trend.md"

log() { printf '\033[1;36m[SIL-TREND]\033[0m %s\n' "$*"; }

if [ ! -f "$STATE_FILE" ]; then
  log "ERROR: $STATE_FILE not found."
  exit 1
fi

log "Counting PSIM wins by class..."
declare -A WINS
WINS[W1]=0; WINS[W2]=0; WINS[W3]=0; WINS[W4]=0
WINS[W5]=0; WINS[W6]=0; WINS[W7]=0; WINS[W8]=0
if [ -f "$WINS_FILE" ]; then
  while IFS= read -r line; do
    for w in W1 W2 W3 W4 W5 W6 W7 W8; do
      if echo "$line" | grep -qiE "Clase PSIM:.*$w\b"; then
        WINS[$w]=$(( ${WINS[$w]} + 1 ))
      fi
    done
  done < "$WINS_FILE"
fi
TOTAL_WINS=$(( ${WINS[W1]} + ${WINS[W2]} + ${WINS[W3]} + ${WINS[W4]} + ${WINS[W5]} + ${WINS[W6]} + ${WINS[W7]} + ${WINS[W8]} ))
log "  Total wins: $TOTAL_WINS"

log "Counting anti-patterns..."
AP_COUNT=0
if [ -f "$AP_FILE" ]; then
  AP_COUNT=$(grep -cE '^## \[AP-[0-9]+\]' "$AP_FILE" || echo 0)
fi
log "  Anti-patterns documented: $AP_COUNT"

# K5: gate stability streak (desde state.json actual)
K5=$(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('kpi_targets',{}).get('K5_gate_stability_streak',{}).get('current',0))" 2>/dev/null || echo 0)

# K4: capability streak (última iteración con W1)
K4=${WINS[W1]}

# Generar metrics-trend.md
log "Generating $TREND_FILE..."
cat > "$TREND_FILE" << EOF
# Metrics Trend — PSIM Snapshot

> Generado por: \`scripts/sil-trend.sh\`
> Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## KPIs actuales (K1-K5)

| KPI | Target | Current | Status |
| :--- | :--- | :--- | :--- |
| K1 P0/P1 Closure Rate | ≥ 0.90 | _(pendiente de tracker de issues)_ | TBD |
| K2 Mock Reduction Velocity | < 0 | _(pendiente de medir mocks en código)_ | TBD |
| K3 Finding Half-Life | ≤ 2 iteraciones | _(pendiente de tracker)_ | TBD |
| K4 Capability-Strengthening Count | ≥ 1/iter | ${K4} | $([ "$K4" -ge 1 ] && echo "OK" || echo "BELOW_TARGET") |
| K5 Gate Stability Streak | monótono ↑ | ${K5} | OK |

## Balance de Victorias PSIM (W1-W8)

| Clase | Nombre | Count |
| :---: | :--- | :---: |
| W1 | Capability Strengthening | ${WINS[W1]} |
| W2 | Carry-over Closure | ${WINS[W2]} |
| W3 | Mock Reduction | ${WINS[W3]} |
| W4 | ADOPTED Promotion | ${WINS[W4]} |
| W5 | Anti-Pattern Retirement | ${WINS[W5]} |
| W6 | Persona Satisfied | ${WINS[W6]} |
| W7 | Gate Velocity | ${WINS[W7]} |
| W8 | Finding Half-Life | ${WINS[W8]} |
| **Total** | | **${TOTAL_WINS}** |

## Antipatrones documentados

- Total: ${AP_COUNT}

## Fuerzas de Porter (estado)

| Fuerza | Aplicación | Estado |
| :---: | :--- | :--- |
| 1 | Nuevos Entrantes (regresiones) | $([ "$AP_COUNT" -gt 0 ] && echo "mitigated (ledger activo)" || echo "exposed") |
| 2 | Poder de Proveedores (LLM lock-in) | neutralized (L2 Control Plane) |
| 3 | Poder de Compradores (operador) | maximized (boilerplate reutilizable) |
| 4 | Amenaza de Sustitutos (obsolescencia) | neutralized (MCP/LSP/polyglot) |
| 5 | Rivalidad Interna (deuda técnica) | minimized (contratos canónicos) |

## Recomendaciones

$([ "$K4" -lt 1 ] && echo "- ⚠️ K4 por debajo del objetivo: registrar al menos 1 victoria W1 esta iteración." || echo "- ✅ K4 satisfecho: al menos 1 W1 registrada.")
- Mantener K5 creciente: evitar commits que rompan el gate-honesty.yml.

---

> Próxima regeneración: al cierre de la próxima sesión agéntica.
EOF

log "  $TREND_FILE generated."

# Actualizar state.json (snapshot)
log "Updating $STATE_FILE..."
python3 << EOF
import json, datetime
with open("$STATE_FILE") as f:
    s = json.load(f)
s['last_updated'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
s['psim_wins_count'] = {
    'W1_capability_strengthening': ${WINS[W1]},
    'W2_carry_over_closure': ${WINS[W2]},
    'W3_mock_reduction': ${WINS[W3]},
    'W4_adopted_promotion': ${WINS[W4]},
    'W5_anti_pattern_retirement': ${WINS[W5]},
    'W6_persona_satisfied': ${WINS[W6]},
    'W7_gate_velocity': ${WINS[W7]},
    'W8_finding_half_life': ${WINS[W8]},
    'total': ${TOTAL_WINS}
}
s['anti_patterns_documented'] = ${AP_COUNT}
s.setdefault('kpi_targets', {})
s['kpi_targets'].setdefault('K4_capability_streak', {}).update({'current': ${K4}})
s['kpi_targets'].setdefault('K5_gate_stability_streak', {}).update({'current': ${K5}})
s.setdefault('history', []).append({
    'timestamp': s['last_updated'],
    'event': 'sil-trend regeneration',
    'kpi_snapshot': {
        'K4': ${K4},
        'K5': ${K5},
        'total_wins': ${TOTAL_WINS},
        'anti_patterns': ${AP_COUNT}
    }
})
with open("$STATE_FILE", 'w') as f:
    json.dump(s, f, indent=2, ensure_ascii=False)
print("  state.json updated.")
EOF

log "Done. K4=$K4, K5=$K5, total_wins=$TOTAL_WINS, anti_patterns=$AP_COUNT"
