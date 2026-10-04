#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# persona-check.sh — Comando canónico: `persona check <route>`
# Itera sobre los perfiles de persona definidos en docs/personas/
# y para cada uno navega la ruta verificando que cumple su meta (W6).
# Emite reporte en docs/reports/<epoch>-persona-check-<route-slug>.md
# ════════════════════════════════════════════════════════════════════════
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ROUTE="${1:-}"
if [ -z "$ROUTE" ]; then
  echo "Usage: bash scripts/persona-check.sh <route> [base_url]"
  echo "Example: bash scripts/persona-check.sh /dashboard http://localhost:3000"
  exit 1
fi
BASE_URL="${2:-${APP_URL:-http://localhost:3000}}"
FULL_URL="${BASE_URL}${ROUTE}"

EPOCH=$(date +%s)
SLUG=$(echo "$ROUTE" | sed 's|^/||; s|/|-|g; s|[?&=]|-|g; s|[^a-zA-Z0-9-]||g' | head -c 40)
[ -z "$SLUG" ] && SLUG="root"
REPORT="docs/reports/${EPOCH}-persona-check-${SLUG}.md"

PERSONAS_DIR="docs/personas"
log() { printf '\033[1;36m[PERSONA-CHECK]\033[0m %s\n' "$*"; }

log "Route:       $ROUTE"
log "Base URL:    $BASE_URL"
log "Personas:    $PERSONAS_DIR"
log "Report:      $REPORT"
echo ""

mkdir -p docs/reports

# ── Cargar personas ──
if [ ! -d "$PERSONAS_DIR" ] || [ -z "$(ls -A "$PERSONAS_DIR" 2>/dev/null | grep -v '^\.')" ]; then
  log "No personas defined in $PERSONAS_DIR/. Seeding default personas..."
  mkdir -p "$PERSONAS_DIR"
  cat > "$PERSONAS_DIR/executive.md" << 'EOF'
# Persona: Executive

- **Id:** executive
- **Rol:** Decision-maker (C-level / gerente)
- **Meta principal:** Ver KPIs y métricas de un vistazo; tomar decisiones rápidas.
- **Permisos:** Lectura de dashboards, exportación de reportes.
- **Dispositivo típico:** Desktop (1920×1080) y tablet.
- **Rutas esperadas:** /dashboard, /reports, /analytics
- **Criterios de éxito:**
  - Dashboard carga en <2s.
  - KPIs visibles sin scroll horizontal.
  - Botones de exportación accesibles en el primer viewport.
- **Criterios de fracaso:**
  - Datos ficticios o placeholders.
  - Errores de consola visibles.
  - Tablas crudas sin formato de tarjetas.
EOF
  cat > "$PERSONAS_DIR/operator.md" << 'EOF'
# Persona: Operator

- **Id:** operator
- **Rol:** Usuario operativo (data entry, soporte, atención al cliente)
- **Meta principal:** Completar transacciones rápidas y precisas.
- **Permisos:** CRUD sobre entidades operativas; lectura de auditoría.
- **Dispositivo típico:** Desktop (1366×768).
- **Rutas esperadas:** /cms/posts, /orders, /customers
- **Criterios de éxito:**
  - Formularios con validación inmediata (no al submit).
  - Acciones destructivas piden confirmación.
  - Estados loading/empty/error/success visibles.
- **Criterios de fracaso:**
  - Formularios que pierden datos tras error.
  - Botones táctiles <44px.
  - Lenguaje técnico en mensajes al usuario.
EOF
  cat > "$PERSONAS_DIR/analyst.md" << 'EOF'
# Persona: Analyst

- **Id:** analyst
- **Rol:** Analista de datos / BI
- **Meta principal:** Explorar datos, construir reportes custom, detectar anomalías.
- **Permisos:** Lectura de tablas + acceso a vistas materializadas; export CSV/Excel.
- **Dispositivo típico:** Desktop ultrawide (2560×1080).
- **Rutas esperadas:** /analytics, /reports/builder, /data-explorer
- **Criterios de éxito:**
  - Filtros facetados y búsqueda semántica.
  - Paginación inteligente o scroll infinito con memoria de posición.
  - Gráficos (no tablas crudas) para dashboards.
- **Criterios de fracaso:**
  - Sin paginación (carga miles de registros).
  - JSON crudo en UI.
  - Sin accesibilidad WCAG 2.1 AA (contraste insuficiente).
EOF
  log "Seeded 3 default personas: executive, operator, analyst"
fi

PERSONAS=$(ls "$PERSONAS_DIR"/*.md 2>/dev/null | xargs -n1 basename 2>/dev/null | sed 's/\.md$//' || true)
if [ -z "$PERSONAS" ]; then
  log "ERROR: no personas found even after seeding."
  exit 1
fi

# ── Verificar disponibilidad del servidor ──
log "Server availability check..."
HTTP_CODE=$(curl -s -o /tmp/persona-check-body.html -w "%{http_code}" --max-time 5 "$FULL_URL" 2>/dev/null || echo "000")
log "  HTTP code: $HTTP_CODE"
if ! echo "$HTTP_CODE" | grep -qE '^(2|3)'; then
  log "  [FAIL] Server returned $HTTP_CODE. Aborting."
  exit 1
fi

# ── Evaluar cada persona ──
log ""
log "Evaluating route against personas..."
HTML=$(cat /tmp/persona-check-body.html 2>/dev/null || echo "")

declare -a RESULTS
TOTAL_PASS=0; TOTAL_FAIL=0; TOTAL_WARN=0

for p in $PERSONAS; do
  PERSONA_FILE="$PERSONAS_DIR/$p.md"
  log ""
  log "== Persona: $p =="

  # Extraer criterios de éxito del archivo de persona (líneas bajo "Criterios de éxito:")
  SUCCESS_CRITERIA=$(awk '/^## Criterios de éxito:/{flag=1;next}/^## Criterios de fracaso:/{flag=0}flag' "$PERSONA_FILE" \
    | grep -E '^\s*-\s+' | sed 's/^\s*-\s*//' || true)
  FAIL_CRITERIA=$(awk '/^## Criterios de fracaso:/{flag=1;next}/^## /{flag=0}flag' "$PERSONA_FILE" \
    | grep -E '^\s*-\s+' | sed 's/^\s*-\s*//' || true)

  # Verificar rutas esperadas
  EXPECTED_ROUTES=$(grep -E '^\s*-\s\*\*Rutas esperadas:\*\*' "$PERSONA_FILE" | sed 's/.*\*\*Rutas esperadas:\*\*\s*//' || echo "")
  ROUTE_OK=false
  if [ -n "$EXPECTED_ROUTES" ]; then
    for er in $(echo "$EXPECTED_ROUTES" | tr ',' '\n'); do
      er=$(echo "$er" | xargs)
      # Comprobar si la ruta actual cae dentro de las esperadas (prefijo)
      if echo "$ROUTE" | grep -qi "^$er"; then
        ROUTE_OK=true
        break
      fi
    done
  fi
  if $ROUTE_OK; then
    log "  [OK] Route $ROUTE matches expected for $p"
    TOTAL_PASS=$((TOTAL_PASS+1))
  else
    log "  [WARN] Route $ROUTE not in expected list for $p ($EXPECTED_ROUTES)"
    TOTAL_WARN=$((TOTAL_WARN+1))
  fi

  # Verificar criterios de éxito (heurística: keywords presentes en HTML)
  for crit in "$SUCCESS_CRITERIA"; do
    # Heurística simple: si el criterio menciona algo detectable en HTML
    if echo "$crit" | grep -qi 'loading\|empty\|error\|success' && \
       echo "$HTML" | grep -qiE 'skeleton|loading|spinner|empty-state|error-state'; then
      log "  [OK] Success criterion: $crit"
      TOTAL_PASS=$((TOTAL_PASS+1))
    fi
  done

  # Verificar criterios de fracaso (penalizar si aparecen)
  for crit in "$FAIL_CRITERIA"; do
    if echo "$crit" | grep -qi 'placeholder\|ficticio' && \
       echo "$HTML" | grep -qiE '555-0199|example@|test@test'; then
      log "  [FAIL] Failure criterion triggered: $crit"
      TOTAL_FAIL=$((TOTAL_FAIL+1))
    elif echo "$crit" | grep -qi 'consola' && \
         echo "$HTML" | grep -qiE 'console\.error'; then
      log "  [FAIL] Failure criterion triggered: $crit"
      TOTAL_FAIL=$((TOTAL_FAIL+1))
    elif echo "$crit" | grep -qi '44px' && \
         echo "$HTML" | grep -qiE 'btn-sm|h-6\b|h-7\b'; then
      log "  [WARN] Possible small touch target: $crit"
      TOTAL_WARN=$((TOTAL_WARN+1))
    fi
  done

  RESULTS+=("$p|$([ "$ROUTE_OK" = "true" ] && echo OK || echo WARN)")
done

# ── Generar reporte ──
log ""
log "Generating report: $REPORT"

cat > "$REPORT" << EOF
# Persona Check Report — Route $ROUTE

> **Epoch:** $EPOCH
> **Timestamp:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
> **Full URL:** $FULL_URL
> **HTTP code:** $HTTP_CODE
> **Generated by:** \`scripts/persona-check.sh\` (comando canónico \`persona check <route>\`)
> **PSIM class:** W6 (Persona Satisfied)

## Resumen

| Métrica | Valor |
| :--- | :--- |
| Personas evaluadas | $(echo "$PERSONAS" | wc -w) |
| Criterios pasados (PASS) | $TOTAL_PASS |
| Criterios fallidos (FAIL) | $TOTAL_FAIL |
| Advertencias (WARN) | $TOTAL_WARN |
| Veredicto global | $([ "$TOTAL_FAIL" -eq 0 ] && echo "PERSONA_SATISFIED (W6)" || echo "PERSONA_GAPS_DETECTED") |

## Resultados por persona

| Persona | Route match | Notas |
| :--- | :---: | :--- |
EOF

for r in "${RESULTS[@]}"; do
  IFS='|' read -r name verdict <<< "$r"
  echo "| $name | $verdict | Ver detalles en \`docs/personas/$name.md\` |" >> "$REPORT"
done

cat >> "$REPORT" << EOF

## Notas metodológicas

- Esta es una verificación **heurística estática**. Para validación completa
  con navegación real por cada persona (login como la persona, interacción
  con la UI, captura de métricas de latencia percibida), ejecutar contra el
  MCP \`browser-devtools\` con un perfil de cookies por persona.
- Las personas se definen en \`docs/personas/*.md\` y son extensibles: cualquier
  nuevo archivo \`.md\` en ese directorio se considera una nueva persona.
- Cada persona debe declarar: Id, Rol, Meta principal, Permisos, Dispositivo
  típico, Rutas esperadas, Criterios de éxito, Criterios de fracaso.

## Próximos pasos

- [ ] Para fallos detectados: abrir issue y registrar en worklog
- [ ] Para WARN: revisar manualmente si es falso positivo
- [ ] Si una persona nueva es necesaria: crear \`docs/personas/<nueva>.md\`
- [ ] Si una ruta es crítica para una persona faltante: anexar AP a anti-patterns.md

---

> Reporte inmutable (Regla P9 extendida a \`docs/reports/\`).
EOF

log "Report saved."
log "Veredicto: $([ "$TOTAL_FAIL" -eq 0 ] && echo "PERSONA_SATISFIED (W6)" || echo "PERSONA_GAPS_DETECTED")"
log "  PASS=$TOTAL_PASS  FAIL=$TOTAL_FAIL  WARN=$TOTAL_WARN"

[ "$TOTAL_FAIL" -gt 0 ] && exit 1 || exit 0
