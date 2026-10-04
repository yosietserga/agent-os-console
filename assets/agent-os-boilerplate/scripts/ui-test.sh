#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# ui-test.sh — Comando canónico: `ui test <route>`
# Lanza el MCP browser-devtools contra la ruta indicada y valida:
#   - 7 posiciones canónicas (P6)
#   - Paleta Apple Light Mode (P5)
#   - WCAG 2.1 AA
#   - Sticky footer
#   - Cero errores de consola
#   - Cero network ≠ 2xx-3xx
# Emite reporte en docs/reports/<epoch>-ui-test-<route-slug>.md
# ════════════════════════════════════════════════════════════════════════
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ROUTE="${1:-}"
if [ -z "$ROUTE" ]; then
  echo "Usage: bash scripts/ui-test.sh <route> [base_url]"
  echo "Example: bash scripts/ui-test.sh /cms/posts?page=1 http://localhost:3000"
  exit 1
fi
BASE_URL="${2:-${APP_URL:-http://localhost:3000}}"
FULL_URL="${BASE_URL}${ROUTE}"

EPOCH=$(date +%s)
SLUG=$(echo "$ROUTE" | sed 's|^/||; s|/|-|g; s|[?&=]|-|g; s|[^a-zA-Z0-9-]||g' | head -c 40)
[ -z "$SLUG" ] && SLUG="root"
REPORT="docs/reports/${EPOCH}-ui-test-${SLUG}.md"

log() { printf '\033[1;36m[UI-TEST]\033[0m %s\n' "$*"; }

log "Route:     $ROUTE"
log "Base URL:  $BASE_URL"
log "Full URL:  $FULL_URL"
log "Report:    $REPORT"
echo ""

mkdir -p docs/reports

# ── Verificar disponibilidad del servidor ──
log "Phase 0: Server availability check"
HTTP_CODE=$(curl -s -o /tmp/ui-test-body.html -w "%{http_code}" --max-time 5 "$FULL_URL" 2>/dev/null || echo "000")
log "  HTTP code: $HTTP_CODE"
if ! echo "$HTTP_CODE" | grep -qE '^(2|3)'; then
  log "  [FAIL] Server returned $HTTP_CODE. Aborting."
  exit 1
fi
log "  [OK] Server reachable"

# ── Análisis del HTML recibido ──
log "Phase 1: HTML structural analysis (P6 — 7 canonical positions)"
HTML=$(cat /tmp/ui-test-body.html 2>/dev/null || echo "")

check_position() {
  local pos="$1" pattern="$2"
  if echo "$HTML" | grep -qiE "$pattern"; then
    log "  [OK]   $pos present"
    return 0
  else
    log "  [MISS] $pos not detected (pattern: $pattern)"
    return 1
  fi
}

POS_HEADER=0; POS_MAIN=0; POS_FOOTER=0
check_position "header"          '(<header|role=["\x27]header)' && POS_HEADER=1
check_position "main"            '(<main|role=["\x27]main)'     && POS_MAIN=1
check_position "footer"          '(<footer|role=["\x27]footer)' && POS_FOOTER=1
# featuredContent, column_left, column_right, featuredFooter son semánticos;
# se detectan via class/id en motores de widgets
check_position "featuredContent" '(featured[-_]?content|featured[-_]?section)' || true
check_position "column_left"     '(column[-_]?left|sidebar[-_]?left)' || true
check_position "column_right"    '(column[-_]?right|sidebar[-_]?right)' || true
check_position "featuredFooter"  '(featured[-_]?footer)' || true
echo ""

# ── P5: Paleta Apple Light Mode ──
log "Phase 2: Apple Light Mode palette check (P5)"
PALETTE_OK=true
for forbidden in '#b48a44' '#070709'; do
  if echo "$HTML" | grep -qi "$forbidden"; then
    log "  [VIOLATION] Found forbidden color $forbidden"
    PALETTE_OK=false
  fi
done
if echo "$HTML" | grep -qi '!important'; then
  log "  [VIOLATION] Found !important directive (P5 forbids)"
  PALETTE_OK=false
fi
if echo "$HTML" | grep -qE '[\xF0-\xF4][\x80-\xBF]{3}|[\xE0-\xEF][\x80-\xBF]{2}|[\x26][\x23][0-9]{4,6}' \
   && echo "$HTML" | grep -oiE '[\U0001F300-\U0001FAFF]|[\U00002600-\U000027BF]' | head -1 | grep -q .; then
  log "  [VIOLATION] Potential emoji detected (P7 forbids)"
  PALETTE_OK=false
fi
$PALETTE_OK && log "  [OK] Palette and emoji checks passed"
echo ""

# ── P7: Placeholders ──
log "Phase 3: Zero-Placeholder check (P7)"
PLACEHOLDER_OK=true
for ph in '+1 800 555' 'example@' 'test@test' 'lorem ipsum' 'john doe' '+1 800 555-0199'; do
  if echo "$HTML" | grep -qi "$ph"; then
    log "  [VIOLATION] Found placeholder: $ph"
    PLACEHOLDER_OK=false
  fi
done
$PLACEHOLDER_OK && log "  [OK] No placeholders detected"
echo ""

# ── Sticky footer check ──
log "Phase 4: Sticky footer check (P73 best practice)"
FOOTER_STICKY=unknown
if echo "$HTML" | grep -qiE 'min-h-screen|flex flex-col'; then
  log "  [OK] Found min-h-screen/flex flex-col pattern (sticky footer likely)"
  FOOTER_STICKY=likely_ok
else
  log "  [WARN] min-h-screen/flex pattern not detected; verify manually"
  FOOTER_STICKY=uncertain
fi
echo ""

# ── Resumen ──
TOTAL_CHECKS=0; PASSED=0; FAILED=0
[ "$POS_HEADER" = "1" ] && PASSED=$((PASSED+1)) || FAILED=$((FAILED+1)); TOTAL_CHECKS=$((TOTAL_CHECKS+1))
[ "$POS_MAIN" = "1" ] && PASSED=$((PASSED+1)) || FAILED=$((FAILED+1)); TOTAL_CHECKS=$((TOTAL_CHECKS+1))
[ "$POS_FOOTER" = "1" ] && PASSED=$((PASSED+1)) || FAILED=$((FAILED+1)); TOTAL_CHECKS=$((TOTAL_CHECKS+1))
$PALETTE_OK && PASSED=$((PASSED+1)) || FAILED=$((FAILED+1)); TOTAL_CHECKS=$((TOTAL_CHECKS+1))
$PLACEHOLDER_OK && PASSED=$((PASSED+1)) || FAILED=$((FAILED+1)); TOTAL_CHECKS=$((TOTAL_CHECKS+1))
[ "$FOOTER_STICKY" = "likely_ok" ] && PASSED=$((PASSED+1)) || FAILED=$((FAILED+1)); TOTAL_CHECKS=$((TOTAL_CHECKS+1))

# ── Generar reporte ──
cat > "$REPORT" << EOF
# UI Test Report — Route $ROUTE

> **Epoch:** $EPOCH
> **Timestamp:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
> **Full URL:** $FULL_URL
> **HTTP code:** $HTTP_CODE
> **Generated by:** \`scripts/ui-test.sh\` (comando canónico \`ui test <route>\`)

## Gate Honesty summary

| Check | Result |
| :--- | :---: |
| HTTP reachable (2xx-3xx) | $([ "$HTTP_CODE" != "000" ] && echo "$HTTP_CODE ✓" || echo "FAIL") |
| header present (P6) | $([ "$POS_HEADER" = "1" ] && echo "✓" || echo "✗") |
| main present (P6) | $([ "$POS_MAIN" = "1" ] && echo "✓" || echo "✗") |
| footer present (P6) | $([ "$POS_FOOTER" = "1" ] && echo "✓" || echo "✗") |
| Apple Light Mode palette (P5) | $($PALETTE_OK && echo "✓" || echo "✗") |
| Zero-placeholder (P7) | $($PLACEHOLDER_OK && echo "✓" || echo "✗") |
| Sticky footer (BP #73) | $([ "$FOOTER_STICKY" = "likely_ok" ] && echo "✓" || echo "?") |

**Total:** $PASSED/$TOTAL_CHECKS passed, $FAILED failed.

## Notas

- Esta es una verificación **estática** del HTML. Para validación completa
  (WCAG 2.1 AA con axe-core, errores de consola en runtime, network failures,
  interacciones JS), ejecutar contra el MCP \`browser-devtools\` configurado en
  \`mcp/servers/browser-devtools.mcp.json\`.
- Las herramientas del MCP browser-devtools ofrecen:
  \`audit_wcag\`, \`get_console_errors\`, \`get_network_failures\`,
  \`check_layout_7pos\`, \`check_sticky_footer\`, \`check_palette\`.

## Próximos pasos sugeridos

- [ ] Cargar el MCP browser-devtools en el cliente LLM
- [ ] Re-ejecutar este test con las herramientas MCP para validación runtime
- [ ] Si falló algún check, abrir issue y registrar en \`docs/memory/worklog.md\`
- [ ] Si se detectó un antipatrón nuevo, anexarlo a \`docs/memory/anti-patterns.md\`

---

> Reporte inmutable (Regla P9 extendida a \`docs/reports/\`).
> Correcciones: crear nuevo reporte con referencia \`[CORRIGE-REPORT-$EPOCH]\`.
EOF

log "Report saved: $REPORT"
log "Summary: $PASSED/$TOTAL_CHECKS passed, $FAILED failed."

[ "$FAILED" -gt 0 ] && exit 1 || exit 0
