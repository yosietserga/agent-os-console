#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# vigila.sh — Comando canónico: `vigila` (18º, v1.9.0)
#
# Ciclo Autónomo de Calidad (Sentinela) para entornos file-based.
# Escanea registros de ejecución (ERROR, FAILED, exit 1) sin procesar y abre
# por cada falla real un ciclo de 7 etapas: DETECTAR → ANALIZAR →
# INVESTIGAR → CORREGIR → VERIFICAR → CRITERIOS POSTERIORES → REPORTAR.
# Clasificación determinista: NO_DEFECT (input inválido del operador —
# respuesta correcta), BUDGET (gateway >25s/504/timeout), EXTERNAL, INTERNAL.
# Si un ciclo falla > 3 intentos consecutivos: escalar a humano.
# Implementa BP #129. Erradica AP-031. Respeta §4.2 (3 roles): NO muta
# reglas — documenta planes y sugiere ramas `pre/propose/*`.
# Uso: ./scripts/vigila.sh [--source <file>] [--epoch <segundos-unix>]
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SOURCE="docs/memory/worklog.md"
EPOCH="$(date +%s)"
while [ $# -gt 0 ]; do
  case "$1" in
    --source) SOURCE="$2"; shift 2 ;;
    --epoch)  EPOCH="$2";  shift 2 ;;
    *) printf '[VIGILA] Argumento desconocido: %s (NO_DEFECT)\n' "$1"; exit 2 ;;
  esac
done
[ -f "$SOURCE" ] || { printf '[VIGILA] Fuente inexistente: %s — nada que vigilar.\n' "$SOURCE"; exit 0; }

log()  { printf '\033[1;36m[VIGILA]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[VIGILA]\033[0m %s\n' "$*"; }
CURSOR_FILE="docs/memory/.vigila-cursor"
AP_LEDGER="docs/memory/anti-patterns.md"
mkdir -p docs/reports
SLUG="$(basename "$SOURCE" .md | tr -cd 'a-zA-Z0-9-' | cut -c1-24)"; [ -n "$SLUG" ] || SLUG="sesion"
REPORT="docs/reports/${EPOCH}-vigila-${SLUG}.md"

# ── FASE 1 DETECTAR: fallas sin procesar (tras el cursor de línea) ──────
log "Fase 1 DETECTAR — fuente: $SOURCE"
LAST_LINE=0
[ -f "$CURSOR_FILE" ] && LAST_LINE="$(grep "^$SOURCE " "$CURSOR_FILE" 2>/dev/null | tail -1 | awk '{print $2}' || echo 0)"
[ -n "$LAST_LINE" ] || LAST_LINE=0
TOTAL_LINES="$(wc -l < "$SOURCE")"
HITS="$(mktemp)"
awk -v n="$LAST_LINE" 'NR>n' "$SOURCE" | grep -nE 'ERROR|FAILED|exit 1' \
  | awk -F: -v n="$LAST_LINE" -v s="$SOURCE" '{print s ":" ($1+n) ":" substr($0, index($0,":")+1)}' > "$HITS" || true
NEW_FAILURES="$(grep -c . "$HITS" || true)"
log "  Cursor línea $LAST_LINE → $TOTAL_LINES · fallas sin procesar: ${NEW_FAILURES:-0}"

# ── FASE 2 ANALIZAR: clasificación determinista por clase ───────────────
log "Fase 2 ANALIZAR — clasificación determinista"
F_LINE=(); F_CLASS=(); F_TEXT=(); F_APS=(); F_PLAN=()
N_FINDINGS=0
NO_DEFECT=0; BUDGET=0; EXTERNAL=0; INTERNAL=0
classify() {
  case "$1" in
    *desconocido*|*unknown*|*inválida*|*invalid*|*canónico*|*rechaz*) echo NO_DEFECT ;;
    *504*|*timeout*|*presupuesto*|*budget*|*gateway*|*Unexpected\ token*|*25s*|*30s*|*durationMs*) echo BUDGET ;;
    *externo*|*external*|*network*|*page_reader*|*429*|*ECONNREFUSED*|*DNS*|*fetch*|*Error\ de\ red*) echo EXTERNAL ;;
    *) echo INTERNAL ;;
  esac
}
while IFS= read -r entry; do
  [ -z "$entry" ] && continue
  F_LINE+=("$(printf '%s' "$entry" | cut -d: -f1-2)")
  txt="$(printf '%s' "$entry" | cut -d: -f3- | sed 's/^ //' | cut -c1-80)"
  F_TEXT+=("$txt")
  N_FINDINGS=$((N_FINDINGS+1))
  cls="$(classify "$txt")"; F_CLASS+=("$cls")
  case "$cls" in
    NO_DEFECT) NO_DEFECT=$((NO_DEFECT+1)) ;;
    BUDGET) BUDGET=$((BUDGET+1)) ;;
    EXTERNAL) EXTERNAL=$((EXTERNAL+1)) ;;
    INTERNAL) INTERNAL=$((INTERNAL+1)) ;;
  esac
done < "$HITS"
log "  NO_DEFECT=$NO_DEFECT BUDGET=$BUDGET EXTERNAL=$EXTERNAL INTERNAL=$INTERNAL"
DEFECTS=$((BUDGET + EXTERNAL + INTERNAL))

# ── FASE 3 INVESTIGAR: memoria empírica (anti-patterns.md) ──────────────
log "Fase 3 INVESTIGAR — memoria empírica ($AP_LEDGER)"
for i in "${!F_LINE[@]}"; do
  case "${F_CLASS[$i]}" in
    BUDGET)   terms="gateway|presupuesto|timeout|504|JSON" ;;
    EXTERNAL) terms="externo|resiliencia|backoff|429|reintentos" ;;
    INTERNAL) terms="parser|regex|no-op|gate|honesty|comando" ;;
    NO_DEFECT) terms="input|comando|canónico" ;;
  esac
  cited="$(grep -iE "^## \[AP-[0-9]+\].*($terms)" "$AP_LEDGER" 2>/dev/null | sed 's/^## //' | head -3 | tr '\n' ';' || true)"
  [ -n "$cited" ] || cited="(sin AP directo — candidato a entrada nueva)"
  F_APS+=("$cited"); log "  ${F_LINE[$i]} [${F_CLASS[$i]}] → $cited"
done

# ── FASE 4 CORREGIR: plan documentado (NO muta reglas — rol Optimizador) ─
log "Fase 4 CORREGIR — planes documentados (rol Optimizador §4.2)"
for i in "${!F_LINE[@]}"; do
  case "${F_CLASS[$i]}" in
    NO_DEFECT) F_PLAN+=("Sin corrección: respuesta correcta del sistema al input inválido del operador.") ;;
    BUDGET) F_PLAN+=("Plan: paralelizar llamadas; pipeline largo a background con polling (POST <50ms); verificar content-type antes de res.json(); medir duración real. Propuesta: pre/propose/fix-gateway-budget.") ;;
    EXTERNAL) F_PLAN+=("Plan: aislar dependencia vía L2 (P8); backoff con jitter + circuit breaker; degradar determinista. Propuesta: pre/propose/fix-external-dependency.") ;;
    INTERNAL) F_PLAN+=("Plan: reproducir con comando exacto; causa raíz con P1; corrección sustantiva en producción (P3); test de regresión. Propuesta: pre/propose/fix-internal-defect.") ;;
  esac
done
log "  $DEFECTS planes generados ($NO_DEFECT exentas — sin defecto real)."

# ── FASE 5 VERIFICAR: verify.sh con exit code real (Gate Honesty P2) ─────
log "Fase 5 VERIFICAR — scripts/verify.sh (P2)"
VERIFY_STATUS="NOT RUN (scripts/verify.sh ausente)"; VERIFY_EXIT="n/a"
if [ -f "scripts/verify.sh" ]; then
  if bash scripts/verify.sh > /tmp/vigila-verify.log 2>&1; then VERIFY_EXIT=0; VERIFY_STATUS="PASS"
  else VERIFY_EXIT=$?; VERIFY_STATUS="FAIL"; fi
  log "  verify.sh exit code: $VERIFY_EXIT (real, P2)"
else
  log "  scripts/verify.sh no existe — NOT RUN declarado (P2)"
fi

# ── FASE 6 CRITERIOS POSTERIORES: gaps-finder (BP #128) ─────────────────
log "Fase 6 CRITERIOS POSTERIORES — scripts/gaps-finder.sh"
GAPS_STATUS="NOT RUN (scripts/gaps-finder.sh ausente)"; GAPS_EXIT="n/a"
if [ -f "scripts/gaps-finder.sh" ]; then
  if bash scripts/gaps-finder.sh > /tmp/vigila-gaps.log 2>&1; then GAPS_EXIT=0; GAPS_STATUS="PASS (cero gaps critical/high)"
  else GAPS_EXIT=$?; GAPS_STATUS="FAIL (gaps critical/high — corregir y re-ejecutar)"; fi
  log "  gaps-finder.sh exit code: $GAPS_EXIT — $GAPS_STATUS"
else
  log "  scripts/gaps-finder.sh no existe — NOT RUN declarado (P2)"
fi

# ── FASE 7 REPORTAR: epoch inmutable + worklog append-only (P9/P13) ─────
log "Fase 7 REPORTAR — $REPORT"
STAGE5="PASS"; [ "$VERIFY_STATUS" = "FAIL" ] && STAGE5="FAIL"
STAGE6="PASS"; [ "$GAPS_STATUS" = "FAIL" ] && STAGE6="FAIL"
STAGE4="PASS"; [ "$DEFECTS" -gt 0 ] && STAGE4="PLANNED"
FAILED_STAGES=0; [ "$STAGE5" = "FAIL" ] && FAILED_STAGES=$((FAILED_STAGES+1)); [ "$STAGE6" = "FAIL" ] && FAILED_STAGES=$((FAILED_STAGES+1))
CONSEC_FAILS=0
[ -f "$CURSOR_FILE" ] && CONSEC_FAILS="$(grep '^fails:' "$CURSOR_FILE" 2>/dev/null | awk '{print $2}' || echo 0)"
[ -n "$CONSEC_FAILS" ] || CONSEC_FAILS=0
[ "$FAILED_STAGES" -gt 0 ] && CONSEC_FAILS=$((CONSEC_FAILS+1)) || CONSEC_FAILS=0
ESCALATE="NO"; [ "$CONSEC_FAILS" -gt 3 ] && ESCALATE="SI — escalar a humano (>3 intentos fallidos consecutivos)"

cat > "$REPORT" << EOF
# Vigila — Ciclo Autónomo de Calidad (Sentinela)

> **Epoch:** $EPOCH · **Timestamp:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
> **Comando canónico:** \`vigila\` (18º, v1.9.0) — BP #129 · erradica AP-031
> **Fuente:** \`$SOURCE\` (líneas $LAST_LINE→$TOTAL_LINES)

## Ciclo de 7 etapas (PASS/FAIL + evidencia)

| # | Etapa | Estado | Evidencia |
| :---: | :--- | :---: | :--- |
| 1 | Detectar | PASS | ${NEW_FAILURES:-0} fallas sin procesar tras cursor línea $LAST_LINE |
| 2 | Analizar | PASS | NO_DEFECT=$NO_DEFECT BUDGET=$BUDGET EXTERNAL=$EXTERNAL INTERNAL=$INTERNAL |
| 3 | Investigar | PASS | memoria empírica consultada: \`$AP_LEDGER\` |
| 4 | Corregir | $STAGE4 | $DEFECTS planes documentados; $NO_DEFECT exentas |
| 5 | Verificar | $STAGE5 | verify.sh exit=$VERIFY_EXIT — $VERIFY_STATUS |
| 6 | Criterios posteriores | $STAGE6 | gaps-finder.sh exit=$GAPS_EXIT — $GAPS_STATUS |
| 7 | Reportar | PASS | este reporte epoch inmutable |

## Hallazgos (detalle)

| Línea | Clase | Extracto | APs citados | Plan |
| :--- | :---: | :--- | :--- | :--- |
EOF
for i in "${!F_LINE[@]}"; do
  echo "| ${F_LINE[$i]} | ${F_CLASS[$i]} | $(printf '%s' "${F_TEXT[$i]}" | sed 's/|/\\|/g') | $(printf '%s' "${F_APS[$i]}" | sed 's/|/\\|/g') | $(printf '%s' "${F_PLAN[$i]}" | sed 's/|/\\|/g' | cut -c1-150) |" >> "$REPORT"
done
cat >> "$REPORT" << EOF

## Clasificación

- NO_DEFECT: $NO_DEFECT (input inválido del operador — sin ciclo). BUDGET: $BUDGET · EXTERNAL: $EXTERNAL · INTERNAL: $INTERNAL
- Escalado a humano: $ESCALATE (fallos consecutivos: $CONSEC_FAILS)

## Tabla AGREE/DISAGREE (P13)

| Hipótesis | Veredicto | Razón |
| :--- | :---: | :--- |
| El ciclo detecta fallas sin intervención del operador | AGREE | ${NEW_FAILURES:-0} fallas encontradas, clasificadas y con plan |
| La clasificación determinista cubre todos los casos | DISAGREE | case por keywords es heurístico: un fallo sin keywords conocidos cae en INTERNAL por defecto |
| El script corrige por sí solo | DISAGREE | Fase 4 documenta planes y sugiere pre/propose/*; la mutación de reglas queda en el Optimizador (§4.2) |

## Auto-crítica Modo A (3 debilidades reales)

1. El grep de marcadores (ERROR/FAILED/exit 1) puede dar falsos positivos si el worklog cita errores en prosa.
2. El cursor es un archivo global único: sesiones concurrentes sobre fuentes distintas compiten por él.
3. La Fase 5 ejecuta verify.sh completo aunque el hallazgo sea puntual; en repos grandes el costo es desproporcionado.

---

> Reporte inmutable (P9 extendida a docs/reports/). Correcciones: nuevo reporte [CORRIGE-REPORT-$EPOCH].
EOF

printf '[%s] vigila: %s falla(s) escaneada(s) en %s — NO_DEFECT=%s BUDGET=%s EXTERNAL=%s INTERNAL=%s — reporte %s (escalado: %s)\n' \
  "$EPOCH" "$N_FINDINGS" "$SOURCE" "$NO_DEFECT" "$BUDGET" "$EXTERNAL" "$INTERNAL" "$REPORT" "$ESCALATE" >> docs/memory/worklog.md
{ echo "$SOURCE $TOTAL_LINES"; echo "fails: $CONSEC_FAILS"; } > "$CURSOR_FILE"
rm -f "$HITS"
log "Reporte: $REPORT · Worklog anexado (append-only P9) · Cursor → línea $TOTAL_LINES"
[ "$ESCALATE" = "NO" ] && exit 0
warn "ESCALADO A HUMANO: >3 intentos fallidos consecutivos del ciclo."; exit 1
