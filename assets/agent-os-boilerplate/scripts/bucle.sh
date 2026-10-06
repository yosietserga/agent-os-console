#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# bucle.sh — Comando canónico: `bucle <prompt>` (19º, v2.0.0)
#
# Bucle Agéntico Goal-Driven para entornos file-based (§8.4 de AGENTS.md).
# El operador entrega un prompt inicial; el orquestador asume CERO
# conocimiento, deriva el tema y 3-5 goals SOLO del prompt (cada oración del
# prompt con sustancia es un goal con su criterio de aceptación), y ejecuta
# iteraciones de 10 etapas: METAS → INVESTIGA (web real vía investiga.sh) →
# PLAN → REPORTE PRE → EJECUTA (verificación de evidencia de artefactos) →
# REPORTE PRO → CRÍTICA (critica.sh) → APRENDE (MEMORY append-only P9) →
# EVALÚA (goals vs criterio, evidencia real — P2) → HANDOFF.
# El run queda PAUSED tras cada iteración (bucle infinito entre
# invocaciones): `bucle continúa` reanuda, `bucle estado` reporta.
# Honestidad P2: cada etapa declara lo que hizo DE VERDAD; si investiga.sh
# o critica.sh no existen/fallan, la etapa se registra como degradada —
# jamás se fabrican hallazgos ni logros.
# Uso: ./scripts/bucle.sh "<prompt inicial>"
#      ./scripts/bucle.sh continúa
#      ./scripts/bucle.sh estado
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RUN_DIR="docs/workflow"
RUN_FILE="$RUN_DIR/run.json"
mkdir -p "$RUN_DIR" docs/reports

log()  { printf '[BUCLE] %s\n' "$*"; }
warn() { printf '[BUCLE] %s\n' "$*" >&2; }

slugify() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-' | tr -s '-' | cut -c1-32; }

# ── Derivación de goals SOLO del prompt (cero conocimiento previo) ───────
derive_goals() {
  # Cada oración con ≥5 palabras del prompt es un goal candidato; máx. 5.
  printf '%s' "$1" | tr '\n' ' ' | sed 's/\([.!?;]\) /\1\n/g' \
    | awk 'NF>=5 && length($0)>15' | grep -vE '^(por favor|gracias|saludos)' \
    | head -5
}

run_json() { # run_json <tema> <iteration> <status> <goals_file> <handoff>
  python3 - "$@" << 'PYEOF'
import json, sys
tema, iteration, status, goals_file, handoff = sys.argv[1:6]
goals = []
with open(goals_file) as f:
    for i, line in enumerate(f, 1):
        line = line.strip()
        if line:
            goals.append({"id": f"G{i}", "statement": line,
                          "criterion": f"Evidencia verificable de: {line}",
                          "status": "IN_PROGRESS"})
doc = {"tema": tema, "iteration": int(iteration), "status": status,
       "goals": goals, "handoff": handoff, "updated": __import__('time').strftime('%Y-%m-%dT%H:%M:%SZ', __import__('time').gmtime())}
with open("docs/workflow/run.json", "w") as f:
    json.dump(doc, f, indent=2, ensure_ascii=False)
PYEOF
}

# ── Subcomandos: estado / continúa / <nuevo prompt> ──────────────────────
ARG="${1:-}"
case "$ARG" in
  estado)
    if [ ! -f "$RUN_FILE" ]; then log "Sin run activo (docs/workflow/run.json inexistente)."; exit 0; fi
    log "Run: $(python3 -c "import json;d=json.load(open('$RUN_FILE'));print(f\"{d['tema']} · iter {d['iteration']} · {d['status']}\")")"
    python3 -c "
import json; d=json.load(open('$RUN_FILE'))
[print(f\"  {g['id']} [{g['status']}] {g['statement'][:72]}\") for g in d['goals']]"
    exit 0 ;;
  continúa|continua|sigue|resume)
    [ -f "$RUN_FILE" ] || { warn "No hay run PAUSED que reanudar."; exit 1; }
    PROMPT="$(python3 -c "import json;print(json.load(open('$RUN_FILE'))['tema'])")"
    ITERATION="$(python3 -c "import json;print(json.load(open('$RUN_FILE'))['iteration'])")"
    TEMA_SLUG="$(slugify "$PROMPT")"; [ -n "$TEMA_SLUG" ] || TEMA_SLUG="tema"
    ITERATION=$((ITERATION + 1)) ;;
  "")
    warn "Uso: bucle.sh \"<prompt>\" | bucle.sh continúa | bucle.sh estado"; exit 2 ;;
  *)
    PROMPT="$ARG"; TEMA_SLUG="$(slugify "$PROMPT")"; [ -n "$TEMA_SLUG" ] || TEMA_SLUG="tema"
    ITERATION=1
    log "Etapa 1 METAS — derivando goals SOLO del prompt (asumo cero conocimiento)"
    GOALS_TMP="$(mktemp)"; derive_goals "$PROMPT" > "$GOALS_TMP"
    N_GOALS="$(grep -c . "$GOALS_TMP" || true)"
    if [ "$N_GOALS" -lt 3 ]; then
      # El prompt es corto: el goal único es el prompt íntegro + goals operativos del protocolo
      { printf '%s\n' "$PROMPT"
        printf 'Investigar el dominio del tema con fuentes reales antes de planear\n'
        printf 'Generar plan de pasos y tareas verificables vinculado al tema\n'
        printf 'Producir reportes PRE y PRO y handoff re-iterables\n'; } > "$GOALS_TMP"
      N_GOALS="$(grep -c . "$GOALS_TMP")"
    fi
    log "  Tema: $TEMA_SLUG · $N_GOALS goals derivados del prompt"
    run_json "$PROMPT" "$ITERATION" "RUNNING" "$GOALS_TMP" "Run inicializado desde el prompt"
    ;;
esac

EPOCH="$(date +%s)"
PLAN="$RUN_DIR/plan-$TEMA_SLUG.md"
HANDOFF="$RUN_DIR/handoff-$TEMA_SLUG.md"
PRE_REPORT="docs/reports/${EPOCH}-pre-${TEMA_SLUG}-it${ITERATION}.md"
PRO_REPORT="docs/reports/${EPOCH}-pro-${TEMA_SLUG}-it${ITERATION}.md"

# ── Etapa 2 INVESTIGA: web real vía investiga.sh (degradación honesta) ────
log "Etapa 2 INVESTIGA — asumo cero conocimiento: investigación web real"
RESEARCH_REPORT=""
if [ -x scripts/investiga.sh ] || [ -f scripts/investiga.sh ]; then
  if bash scripts/investiga.sh "$TEMA_SLUG" >/dev/null 2>&1; then
    RESEARCH_REPORT="$(ls -t docs/research/*-"$(slugify "$TEMA_SLUG")".md 2>/dev/null | head -1 || true)"
    log "  Investigación real: ${RESEARCH_REPORT:-sin archivo}"
  else
    log "  DEGRADADO: investiga.sh falló (sin red/cuota) — el plan declara el déficit (P2)"
  fi
else
  log "  DEGRADADO: investiga.sh no disponible — el plan declara el déficit (P2)"
fi

# ── Etapa 3 PLAN: pasos y tareas vinculados al tema del prompt ───────────
log "Etapa 3 PLAN — plan de pasos y tareas (tema: $TEMA_SLUG)"
{
  printf '# Plan And Steps — %s (iteración %d)\n\n' "$PROMPT" "$ITERATION"
  printf '> Generado por bucle.sh §8.4 · contenido derivado del prompt y la investigación\n\n'
  if [ -n "$RESEARCH_REPORT" ]; then
    printf '## Investigación (etapa 2, real)\n- Fuente: %s\n- Hallazgos aplicables: extraer secciones del reporte de investigación.\n\n' "$RESEARCH_REPORT"
  else
    printf '## Investigación (etapa 2, DEGRADADA — P2)\n- Sin investigación web disponible esta iteración. El ejecutor asume el déficit y lo declara.\n\n'
  fi
  printf '## Goals (derivados del prompt)\n'
  python3 -c "
import json; d=json.load(open('$RUN_FILE'))
[print(f\"{i+1}. {g['id']}: {g['statement']}\") for i,g in enumerate(d['goals'])]"
  printf '\n## Pasos por iteración (10 etapas §8.4)\n'
  printf '1. Metas (goals del prompt) — hecho\n2. Investiga — %s\n' "$([ -n "$RESEARCH_REPORT" ] && echo "real" || echo "degradado (declarado)")"
  printf '3. Plan (este documento)\n4. Reporte PRE\n5. Ejecuta (tareas del ejecutor: IDE/agente/humano — ver handoff)\n6. Reporte PRO\n7. Crítica (critica.sh sobre este plan)\n8. Aprende (append a MEMORY)\n9. Evalúa goals vs evidencia\n10. Handoff → siguiente iteración\n'
  printf '\n## Tareas de esta iteración (el ejecutor las toma del handoff)\n'
  python3 -c "
import json; d=json.load(open('$RUN_FILE'))
[print(f\"- [ ] TAREA {g['id']}: producir evidencia verificable de: {g['statement'][:90]}\") for g in d['goals']]"
} > "$PLAN"
log "  Plan: $PLAN"

# ── Etapa 4 REPORTE PRE ──────────────────────────────────────────────────
log "Etapa 4 REPORTE PRE — lo que esta iteración hará"
{
  printf '# Reporte PRE — %s (iteración %d)\n\n' "$TEMA_SLUG" "$ITERATION"
  printf -- '- Investigación: %s\n' "$([ -n "$RESEARCH_REPORT" ] && echo "real ($RESEARCH_REPORT)" || echo "DEGRADADA (P2 declarado)")"
  printf -- '- Plan: %s con %d goals y tareas verificables\n' "$PLAN" "$(python3 -c "import json;print(len(json.load(open('$RUN_FILE'))['goals']))")"
  printf -- '- Ejecución: el ejecutor (agente IDE/humano) toma las tareas del handoff; esta iteración NO declara logros sin evidencia (P2)\n'
} > "$PRE_REPORT"
log "  $PRE_REPORT"

# ── Etapa 5 EJECUTA: verificación de evidencia real (no fabricación) ─────
log "Etapa 5 EJECUTA — verifico evidencia real de artefactos del run"
# Evidencia HONESTA: archivos producidos por el ejecutor (código/docs/reportes
# propios) — NUNCA el andamiaje del bucle (plan/handoff/pre/pro/run.json),
# que menciona los goals por definición (evidencia circular = fabricación P2).
EXECUTED=0
while IFS= read -r goal_line; do
  [ -z "$goal_line" ] && continue
  if grep -rliF "$(printf '%s' "$goal_line" | cut -c1-40)" \
      --exclude-dir=.git --exclude-dir=node_modules \
      --exclude="plan-$TEMA_SLUG.md" --exclude="handoff-$TEMA_SLUG.md" \
      --exclude="$RUN_FILE" --exclude="*-pre-*" --exclude="*-pro-*" \
      src docs tests package.json 2>/dev/null | head -1 | grep -q .; then
    EXECUTED=$((EXECUTED + 1))
  fi
done < <(python3 -c "
import json; d=json.load(open('$RUN_FILE'))
[print(g['statement']) for g in d['goals']]")
log "  Goals con evidencia de artefacto del ejecutor: $EXECUTED (los demás quedan IN_PROGRESS — honesto)"

# ── Etapa 6 REPORTE PRO ──────────────────────────────────────────────────
log "Etapa 6 REPORTE PRO — lo que esta iteración produjo DE VERDAD"
{
  printf '# Reporte PRO — %s (iteración %d)\n\n' "$TEMA_SLUG" "$ITERATION"
  printf -- '- Plan generado: %s\n' "$PLAN"
  printf -- '- Investigación: %s\n' "$([ -n "$RESEARCH_REPORT" ] && echo "real" || echo "degradada (declarada)")"
  printf -- '- Evidencia previa verificada: %d goal(s)\n' "$EXECUTED"
  printf -- '- PROHIBIDO declarar logros sin evidencia (P2): los goals sin artefacto quedan IN_PROGRESS para el ejecutor.\n'
} > "$PRO_REPORT"
log "  $PRO_REPORT"

# ── Etapa 7 CRÍTICA: critica.sh sobre el plan (P13) ──────────────────────
log "Etapa 7 CRÍTICA — auto-crítica (P13)"
if [ -f scripts/critica.sh ]; then
  if bash scripts/critica.sh "$PLAN" >/dev/null 2>&1; then
    CRITICA="$(ls -t docs/reports/*-critica-plan-*.md 2>/dev/null | head -1 || true)"
    log "  Crítica real: ${CRITICA:-sin archivo}"
  else
    log "  DEGRADADO: critica.sh falló — crítica determinista: (1) el plan depende del ejecutor para las tareas; (2) sin investigación esta iteración el plan es más débil; (3) la evidencia debe verificarse en la próxima iteración"
  fi
else
  log "  DEGRADADO: critica.sh no disponible — crítica determinista declarada arriba (P2)"
fi

# ── Etapa 8 APRENDE: append a MEMORY (P9 inmutable) ──────────────────────
log "Etapa 8 APRENDE — registro append-only en memoria (P9)"
MEMORY_INDEX="docs/memory/MEMORY.md"
if [ -f "$MEMORY_INDEX" ]; then
  printf -- '- [project] Run bucle %s iteración %d: %s\n' "$TEMA_SLUG" "$ITERATION" \
    "$([ -n "$RESEARCH_REPORT" ] && echo "investigación real aplicada al plan" || echo "iteración con investigación degradada (P2)")" >> "$MEMORY_INDEX"
  log "  MEMORY.md actualizado (append-only)"
else
  log "  DEGRADADO: docs/memory/MEMORY.md inexistente — memoria no actualizada (declarado)"
fi

# ── Etapa 9 EVALÚA: goals vs criterio con evidencia ──────────────────────
log "Etapa 9 EVALÚA — goals contra criterio (evidencia real, P2)"
ACHIEVED=0
python3 - "$RUN_FILE" "$TEMA_SLUG" << 'PYEOF'
import json, sys, os, subprocess
run_path, tema = sys.argv[1], sys.argv[2]
d = json.load(open(run_path))
SCAFFOLD = {f"plan-{tema}.md", f"handoff-{tema}.md", "run.json"}
for g in d['goals']:
    key = g['statement'][:40]
    proc = subprocess.run(['grep', '-rliF', key, 'src', 'docs', 'tests', 'package.json'],
                          capture_output=True, text=True)
    hits = [h for h in proc.stdout.splitlines() if h]
    # Evidencia = artefactos del ejecutor; el andamiaje del bucle (plan/handoff/
    # run.json/pre/pro) menciona los goals por definición y NO cuenta (P2)
    real = [h for h in hits
            if os.path.basename(h) not in SCAFFOLD
            and '-pre-' not in os.path.basename(h)
            and '-pro-' not in os.path.basename(h)
            and not os.path.basename(h).startswith(('pre-', 'pro-'))]
    if len(real) >= 1:
        g['status'] = 'ACHIEVED'
d['goals_achieved'] = sum(1 for g in d['goals'] if g['status'] == 'ACHIEVED')
json.dump(d, open(run_path, 'w'), indent=2, ensure_ascii=False)
PYEOF
ACHIEVED="$(python3 -c "import json;print(json.load(open('$RUN_FILE')).get('goals_achieved',0))")"
TOTAL_GOALS="$(python3 -c "import json;print(len(json.load(open('$RUN_FILE'))['goals']))")"
log "  ACHIEVED: $ACHIEVED/$TOTAL_GOALS (los IN_PROGRESS re-iteran)"

# ── Etapa 10 HANDOFF: contexto para la siguiente iteración ───────────────
log "Etapa 10 HANDOFF — el bucle continúa entre invocaciones"
{
  printf '# Handoff — %s (tras iteración %d)\n\n' "$TEMA_SLUG" "$ITERATION"
  printf '## Estado\n- Goals: %s/%d ACHIEVED · run PAUSED (reanudar: `bucle continúa`)\n\n' "$ACHIEVED" "$TOTAL_GOALS"
  printf '## Tareas para el ejecutor (agente IDE/humano) — iteración %d\n' "$((ITERATION + 1))"
  python3 -c "
import json; d=json.load(open('$RUN_FILE'))
[print(f\"- [ ] {g['id']} [{g['status']}]: {g['statement'][:90]}\") for g in d['goals'] if g['status'] != 'ACHIEVED']"
  printf '\n## Contexto acumulado\n- Plan: %s\n- Reportes: %s · %s\n' "$PLAN" "$PRE_REPORT" "$PRO_REPORT"
  [ -n "${RESEARCH_REPORT:-}" ] && printf -- '- Investigación real: %s\n' "$RESEARCH_REPORT"
  printf '\n> La próxima iteración re-evalúa los goals con la evidencia producida por el ejecutor.\n'
} > "$HANDOFF"

STATUS="PAUSED"
[ "$ACHIEVED" -ge "$TOTAL_GOALS" ] && [ "$TOTAL_GOALS" -gt 0 ] && STATUS="COMPLETED"
python3 -c "
import json
d = json.load(open('$RUN_FILE'))
d['iteration'] = $ITERATION; d['status'] = '$STATUS'; d['handoff'] = '$HANDOFF'
json.dump(d, open('$RUN_FILE', 'w'), indent=2, ensure_ascii=False)"

printf '[BUCLE] ═══ Iteración %d completa: %s/%d goals · run %s · reanudar con `bucle continúa` ═══\n' \
  "$ITERATION" "$ACHIEVED" "$TOTAL_GOALS" "$STATUS"
[ "$STATUS" = "COMPLETED" ] && log "TODOS los goals ACHIEVED con evidencia — bucle cerrado."
exit 0
