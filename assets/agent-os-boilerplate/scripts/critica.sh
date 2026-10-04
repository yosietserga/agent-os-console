#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# critica.sh — Comando canónico: `critica <file>`
#
# Ejecuta auto-crítica Modo A (self-revision) + Modo D (adversario) sobre
# un artefacto (código, reporte, doc, prompt). Genera reporte en
# docs/reports/<epoch>-critica-<file-slug>.md.
#
# Implementa el protocolo de `docs/security/auto-critica-protocol.md`.
# ════════════════════════════════════════════════════════════════════════
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\033[1;36m[CRITICA]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[ERR]\033[0m %s\n' "$*" >&2; }

FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Uso: bash scripts/critica.sh <file>"
  echo ""
  echo "Ejecuta auto-crítica Modo A (self-revision) + Modo D (adversario)"
  echo "sobre el archivo indicado. Genera reporte en docs/reports/."
  echo ""
  echo "Ejemplos:"
  echo "  bash scripts/critica.sh AGENTS.md"
  echo "  bash scripts/critica.sh scripts/ide.sh"
  echo "  bash scripts/critica.sh docs/reports/1790930597-foo.md"
  exit 1
fi

FILE_SLUG=$(echo "$FILE" | sed 's|^.*/||; s|\.[^.]*$||; s|[^a-zA-Z0-9]|-|g; s|--*|-|g; s|^-||; s|-$||' | head -c 50)
EPOCH=$(date +%s)
REPORT="docs/reports/${EPOCH}-critica-${FILE_SLUG}.md"

mkdir -p docs/reports

log "Archivo a criticar: $FILE"
log "Reporte: $REPORT"
echo ""

# Verificar que el archivo existe
LINES=$(wc -l < "$FILE" 2>/dev/null || echo "?")
BYTES=$(wc -c < "$FILE" 2>/dev/null || echo "?")
log "Tamaño: $LINES líneas, $BYTES bytes"
echo ""

# ── Modo A: Self-revision ──
log "═══ MODO A: Self-revision ═══"
log "El agente asume rol crítico sobre su propio trabajo."
log ""

# Generar template de auto-crítica (el LLM que ejecute esto la completa)
cat > "$REPORT" << EOF
# Auto-Crítica — $FILE

> **Epoch:** $EPOCH
> **Timestamp:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
> **Generado por:** \`scripts/critica.sh\` (comando canónico \`critica <file>\`)
> **Modos aplicados:** A (self-revision) + D (adversario)
> **Archivo criticado:** \`$FILE\` ($LINES líneas, $BYTES bytes)
> **Protocolo:** \`docs/security/auto-critica-protocol.md\`

## Modo A — Self-revision

> El agente que produjo este artefacto ahora asume el rol crítico.
> DEBE identificar al menos 3 debilidades reales. Cero debilidades es
> sospechoso (sesgo de auto-aprobación, Antipatrón #65).

### Debilidad 1
**Área:** <marcar: arquitectura | seguridad | rendimiento | legibilidad | mantenimiento | contrato | testing | docs>
**Descripción:** <concreta, con referencia a línea/sección>
**Severidad:** <low | medium | high | critical>
**Acción:** <addressar ahora | agendar | aceptar con justificación>

### Debilidad 2
**Área:** ...
**Descripción:** ...
**Severidad:** ...
**Acción:** ...

### Debilidad 3
**Área:** ...
**Descripción:** ...
**Severidad:** ...
**Acción:** ...

### ¿Se addressaron las debilidades?
- [ ] Sí, todas
- [ ] Parcialmente (detallar cuáles no)
- [ ] No (justificar por qué)

## Modo D — Adversario (red team interno)

> Requerido si el artefacto toca: seguridad, input externo, tools, prompts
> que manejan contenido no confiable. Si no aplica, marcar "N/A" y justificar.

### ¿Aplica Modo D?
- [ ] Sí (razón: ...)
- [ ] N/A (razón: ...)

### Vector de ataque 1
**Vector:** <ej: prompt injection, path traversal, race condition, ...>
**Prueba:** <cómo se explotaría concretamente>
**¿Bloqueado?:** <sí | no | parcial>
**Si no bloqueado, mitigación propuesta:** ...

### Vector de ataque 2
**Vector:** ...
**Prueba:** ...
**¿Bloqueado?:** ...
**Mitigación:** ...

## Veredicto AGREE/DISAGREE (tabla obligatoria)

| Hipótesis | Esperado | Observado | Veredicto |
| :--- | :--- | :--- | :--- |
| H1: El artefacto cumple su propósito | ... | ... | AGREE / DISAGREE |
| H2: El artefacto no reintroduce APs | ... | ... | AGREE / DISAGREE |
| H3: El artefacto cumple BP aplicables | ... | ... | AGREE / DISAGREE |
| H4: El artefacto es seguro (P12) | ... | ... | AGREE / DISAGREE |

### Reglas AGREE/DISAGREE
- **AGREE**: observado coincide con esperado.
- **DISAGREE**: observado difiere. No es fracaso; es información.
- Toda crítica debe tener **al menos 1 DISAGREE** si exploró algo nuevo.
  Cero DISAGREEs es sospechoso (sesgo de confirmación).

## Análisis crítico contrario (¿hay mejores formas?)

> Inspirado en el prompt del operador: "analyze with contrary and critic
> perspective to ensure there are not better ways or newer ways".

- ¿Existe una forma más moderna (2026) de lograr lo mismo?
  - <análisis>
- ¿Existe una forma más confiable?
  - <análisis>
- ¿Existe una forma más simple?
  - <análisis>

## Veredicto final

- [ ] **PROMOTE** — el artefacto se aprueba tras auto-crítica
- [ ] **ITERATE** — el artefacto necesita revisión (detallar)
- [ ] **REJECT** — el artefacto tiene fallas críticas (detallar)

## Próximos pasos

- [ ] Si ITERATE/REJECT: aplicar correcciones y re-ejecutar \`critica\`
- [ ] Si PROMOTE: anexar WIN-XXX al wins-ledger (W4 si es adopción, W5 si
      retira un antipatrón)
- [ ] Si se detectó AP nuevo: anexar a anti-patterns.md
- [ ] Si se detectó BP nueva: anexar a catálogo

---

> Reporte inmutable (Regla P9 extendida a \`docs/reports/\`).
> Correcciones via nuevo reporte con \`[CORRIGE-CRITICA-$EPOCH]\`.
EOF

log "Template de auto-crítica generado."
log ""
log "═══ Próximos pasos (algoritmo Ejecutor) ═══"
log "El agente (LLM o humano) debe ahora:"
log "  1. Leer $FILE completo"
log "  2. Completar el template en $REPORT:"
log "     - 3 debilidades reales (Modo A)"
log "     - 2 vectores de ataque (Modo D, si aplica)"
log "     - Tabla AGREE/DISAGREE (al menos 1 DISAGREE si exploró)"
log "     - Análisis crítico contrario"
log "     - Veredicto final"
log "  3. Si ITERATE/REJECT: aplicar correcciones y re-ejecutar critica"
log "  4. Si PROMOTE: anexar WIN-XXX al wins-ledger"
log ""
log "Reporte: $REPORT"
