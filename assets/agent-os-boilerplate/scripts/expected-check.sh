#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# expected-check.sh — Comando canónico: `expected-check <topic>`
#
# Compara el resultado real (vía browser headless, P14) contra el documento
# de expectativas generado previamente (P15) en docs/expected/<topic>.md.
#
# Implementa la Regla P15 (Expected-First Workflow).
# ════════════════════════════════════════════════════════════════════════
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\033[1;36m[EXPECTED-CHECK]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[ERR]\033[0m %s\n' "$*" >&2; }

TOPIC="${1:-}"
if [ -z "$TOPIC" ]; then
  echo "Uso: bash scripts/expected-check.sh <topic> [base_url]"
  echo ""
  echo "Requiere que exista docs/expected/<topic>.md (documento de expectativas"
  echo "generado por el skill expected-spec-generator o por el agente)."
  echo ""
  echo "El script:"
  echo "  1. Lee el documento de expectativas."
  echo "  2. Para cada criterio de aceptación (CA), verifica vía browser headless."
  echo "  3. Genera reporte en docs/reports/<epoch>-expected-check-<topic>.md"
  echo "  4. Veredicto: MATCH / BETTER / WORSE / FAIL."
  exit 1
fi
BASE_URL="${2:-${APP_URL:-http://localhost:3000}}"

EXPECTED_FILE="docs/expected/${TOPIC}.md"
if [ ! -f "$EXPECTED_FILE" ]; then
  err "No se encontró el documento de expectativas: $EXPECTED_FILE"
  err "Genera uno primero con el skill expected-spec-generator o manualmente."
  err "Ver docs/security/headless-verify-and-expected-first-protocol.md"
  exit 1
fi

EPOCH=$(date +%s)
REPORT="docs/reports/${EPOCH}-expected-check-${TOPIC}.md"

mkdir -p docs/reports

log "Tópico: $TOPIC"
log "Documento de expectativas: $EXPECTED_FILE"
log "Base URL: $BASE_URL"
log "Reporte: $REPORT"
echo ""

# Verificar disponibilidad del server (P14: browser headless, no curl aislado)
log "Paso 0: Verificar server disponible (browser headless, P14)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL" 2>/dev/null || echo "000")
if ! echo "$HTTP_CODE" | grep -qE '^(2|3)'; then
  err "Server no disponible en $BASE_URL (HTTP $HTTP_CODE). Abortando."
  err "NOTA: este check de server es el ÚNICO caso donde curl aislado es válido"
  err "(healthcheck). La verificación real DEBE ser por browser headless (P14)."
  exit 1
fi
log "  [OK] Server reachable (HTTP $HTTP_CODE)"

# Extraer criterios de aceptación del documento
log "Paso 1: Extrayendo criterios de aceptación (CA)..."
CAS=$(grep -oE '^- \[ \] CA[0-9]+:' "$EXPECTED_FILE" | sed 's/^- \[ \] //; s/:$//' | tr '\n' ' ')
CA_COUNT=$(echo "$CAS" | wc -w)
log "  Criterios encontrados: $CA_COUNT"
log "  CAs: $CAS"
echo ""

# Generar reporte con template
log "Paso 2: Generando reporte de comparación..."

cat > "$REPORT" << EOF
# Expected-Check Report — $TOPIC

> **Epoch:** $EPOCH
> **Timestamp:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
> **Generado por:** \`scripts/expected-check.sh\` (comando canónico \`expected-check <topic>\`)
> **Documento de expectativas:** \`$EXPECTED_FILE\`
> **Base URL verificada:** \`$BASE_URL\` (HTTP $HTTP_CODE)
> **Reglas aplicadas:** P14 (Headless Browser Verification) + P15 (Expected-First Workflow) + P13 (Auto-Crítica)

## Resumen

| Métrica | Valor |
| :--- | :--- |
| Criterios de aceptación (CA) | $CA_COUNT |
| Verificados vía browser headless | (completar tras ejecución) |
| PASS | (completar) |
| FAIL | (completar) |
| BETTER | (completar) |
| WORSE | (completar) |

## Verificación por browser headless (P14)

> El agente ejecutor DEBE completar esta sección usando el MCP browser-devtools.
> NO se acepta curl/fetch aislado para rutas HTML (AP-027).

### 1. Navegación y captura HTTP real

\`\`\`bash
# Ejecutar via MCP browser-devtools:
browser-devtools.navigate(url="$BASE_URL")
# Capturar: HTTP status real, networkidle wait, redirects
\`\`\`

- HTTP status real: __
- Redirects: __
- networkidle alcanzado: __

### 2. Console errors

\`\`\`bash
browser-devtools.get_console_errors()
\`\`\`

- Cero console.error: __ (PASS/FAIL)
- Cero uncaught exceptions: __ (PASS/FAIL)

### 3. Network failures

\`\`\`bash
browser-devtools.get_network_failures()
\`\`\`

- Cero 4xx/5xx en assets: __ (PASS/FAIL)
- Cero 4xx/5xx en APIs: __ (PASS/FAIL)
- Cero CORS errors: __ (PASS/FAIL)

### 4. Screenshot visual

\`\`\`bash
browser-devtools.screenshot({ fullPage: true, path: "docs/reports/${EPOCH}-expected-check-${TOPIC}/screenshot.png" })
\`\`\`

- Screenshot guardado: __
- Compara contra wireframe ASCII esperado: __ (MATCH/DIFF)

### 5. WCAG audit

\`\`\`bash
browser-devtools.audit_wcag({ standard: 'wcag21aa' })
\`\`\`

- Violations críticas: __
- Violations serias: __
- Veredicto WCAG: __ (PASS/FAIL)

### 6. Layout 7-posiciones (P6)

\`\`\`bash
browser-devtools.check_layout_7pos(url="$BASE_URL")
\`\`\`

- Posiciones presentes: __
- Posiciones faltantes: __

### 7. Sticky footer (P73)

\`\`\`bash
browser-devtools.check_sticky_footer(url="$BASE_URL")
\`\`\`

- Footer sticks en página corta: __ (PASS/FAIL)

### 8. Paleta Apple (P5)

\`\`\`bash
browser-devtools.check_palette(url="$BASE_URL")
\`\`\`

- Paleta canónica: __ (PASS/FAIL)
- !important detectados: __

### 9. OnboardingTour (P11, si vista compleja)

- Tour presente: __ (PASS/FAIL/N/A)

### 10. CTA Glowing (si aplica)

- CTA con gradient + glow: __ (PASS/FAIL/N/A)
- Touch target ≥44px: __ (PASS/FAIL/N/A)

## Tabla de criterios de aceptación (P15)

| CA | Esperado | Obtenido (real vía browser) | Veredicto |
| :---: | :--- | :--- | :---: |
EOF

# Anexar cada CA al reporte
for ca in $CAS; do
  EXPECTED_DESC=$(grep -E "^- \[ \] ${ca}:" "$EXPECTED_FILE" | sed "s/^- \[ \] ${ca}: //")
  echo "| $ca | $EXPECTED_DESC | (completar con evidencia browser) | PENDING |" >> "$REPORT"
done

cat >> "$REPORT" << EOF

## Análisis comparativo (esperado vs obtenido)

> Para cada CA, el agente ejecutor DEBE:
> 1. Ejecutar la verificación vía browser headless (MCP browser-devtools).
> 2. Capturar evidencia (screenshot, console output, network log).
> 3. Asignar veredicto: PASS / FAIL / BETTER / WORSE.
> 4. Si FAIL o WORSE: detallar gap y plan de corrección.

### Veredictos por CA

(detallar uno por uno, con evidencia)

## Auto-crítica (P13 obligatoria)

### Modo A — Self-revision (3 debilidades reales)

#### Debilidad 1
**Área:** <marcar>
**Descripción:** <concreta>
**Severidad:** <low/medium/high/critical>
**Acción:** <addressar/agendar/aceptar>

#### Debilidad 2
**Área:** ...
**Descripción:** ...
**Severidad:** ...
**Acción:** ...

#### Debilidad 3
**Área:** ...
**Descripción:** ...
**Severidad:** ...
**Acción:** ...

### Modo D — Adversario (si toca seguridad/input externo/tools)

#### Vector 1
**Vector:** <concreto>
**Prueba:** <cómo se explotaría>
**¿Bloqueado?:** <sí/no/parcial>

#### Vector 2
**Vector:** <concreto>
**Prueba:** <cómo se explotaría>
**¿Bloqueado?:** <sí/no/parcial>

## Tabla AGREE/DISAGREE (P13)

| Hipótesis | Esperado | Obtenido | Veredicto |
| :--- | :--- | :--- | :--- |
| H1: La implementación cumple las expectativas | (de docs/expected/) | (real) | AGREE/DISAGREE |
| H2: La verificación fue por browser headless (no curl) | Sí | __ | AGREE/DISAGREE |
| H3: Las expectativas eran realistas | Sí | __ | AGREE/DISAGREE |

### Reglas AGREE/DISAGREE
- Al menos 1 DISAGREE si exploró algo nuevo.
- Cero DISAGREEs = sospechoso (sesgo confirmatorio).

## Análisis crítico contrario (¿hay mejores formas?)

- ¿La expectativa era demasiado alta? ¿muy baja?
- ¿Hubiera sido mejor no generar expectativas y dejar al LLM proponer?
- ¿La verificación por browser capturó todo lo importante?

## Veredicto final

- [ ] **MATCH** — la implementación cumple las expectativas
- [ ] **BETTER** — supera las expectativas (detallar en qué)
- [ ] **WORSE** — inferior a las expectativas (detallar gaps, iterar)
- [ ] **FAIL** — no cumple criterios críticos (iterar o escalar a humano)

## Próximos pasos

- [ ] Si MATCH/BETTER: anexar WIN-XXX al wins-ledger (W6 si satisface persona)
- [ ] Si WORSE/FAIL: aplicar correcciones y re-ejecutar expected-check
- [ ] Si se detectó AP nuevo: anexar a anti-patterns.md
- [ ] Si se detectó BP nueva: anexar a catálogo
- [ ] Actualizar worklog.md con handoff

---

> Reporte inmutable (Regla P9 extendida a \`docs/reports/\`).
> Correcciones via nuevo reporte con \`[CORRIGE-EXPECTED-CHECK-$EPOCH]\`.
> Generado por \`scripts/expected-check.sh\` — comando canónico \`expected-check\`.
EOF

log "Reporte template generado: $REPORT"
log ""
log "═══ Próximos pasos (algoritmo Ejecutor) ═══"
log "El agente (LLM o humano) debe ahora:"
log "  1. Abrir MCP browser-devtools (headless)"
log "  2. Para cada sección 1-10 del reporte: ejecutar verificación real"
log "  3. Para cada CA: asignar PASS/FAIL/BETTER/WORSE con evidencia"
log "  4. Completar auto-crítica Modo A + Modo D (P13)"
log "  5. Completar tabla AGREE/DISAGREE (al menos 1 DISAGREE si exploró)"
log "  6. Asignar veredicto final: MATCH/BETTER/WORSE/FAIL"
log "  7. Si WORSE/FAIL: iterar y re-ejecutar"
log ""
log "Reporte: $REPORT"
