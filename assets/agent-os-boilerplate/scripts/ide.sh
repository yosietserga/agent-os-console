#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# ide.sh — Comando canónico: `ide [detect|<ide-name>|all]`
#
# Genera y aplica un prompt extendido y especializado que le ordena al IDE
# (Cursor, Claude Code, Gemini, Copilot, Windsurf, Cline, Codex CLI, RooCode,
# OpenCode, Antigravity, ZCode, Trae, VS Code, etc.) autoaplicar los
# lineamientos base de AGENTS.md y autoconfigurarse para que NO haya
# necesidad de escribir siempre los comandos canónicos.
#
# Soluciona el problema: "qué pasa si el operador envía un prompt sin
# 'lee AGENTS.md, ejecuta:'" → con `ide`, TODO prompt se trata como canónico.
#
# Inspirado en:
# - living-topology-visualizer/skills/coding-agent/ (frontmatter YAML, scope ONLY/NEVER)
# - system-prompts-and-models-of-ai-tools/ (anatomía real de prompts de 15+ IDEs)
# - ai-prompts-for-developers/prompt.md (ciclo Draft→Critique→Improve)
# ════════════════════════════════════════════════════════════════════════
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

IDE_INTEGRATIONS_DIR="docs/ide-integrations"
log() { printf '\033[1;36m[IDE]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[ERR]\033[0m %s\n' "$*" >&2; }

# ── Catálogo de IDEs soportados ──
# Formato: "id|nombre|archivo_config|tipo_prompt"
SUPPORTED_IDES=(
  "cursor|Cursor|.cursor/rules/agent-os.mdc|mdc"
  "cursor-legacy|Cursor (legacy .cursorrules)|.cursorrules|plain"
  "claude-code|Claude Code|CLAUDE.md|plain"
  "gemini|Gemini CLI / Jules|GEMINI.md|plain"
  "copilot|GitHub Copilot|.github/copilot-instructions.md|plain"
  "windsurf|Windsurf (Codeium)|.windsurfrules|plain"
  "cline|Cline|.clinerules|plain"
  "codex|Codex CLI (OpenAI)|CODEX.md|plain"
  "roocode|RooCode|.roo/rules/agent-os.md|plain"
  "opencode|OpenCode|opencode.md|plain"
  "trae|Trae|.trae/rules/agent-os.md|plain"
  "antigravity|Antigravity (Google)|.antigravity/rules/agent-os.md|plain"
  "zcode|ZCode (Z.ai)|.zcode/rules/agent-os.md|plain"
  "vscode|VS Code (genérico)|.vscode/settings.json|json"
  "aider|Aider|.aider.conf.yml|yaml"
  "continue|Continue|.continue/config.json|json"
)

# ── Detección automática ──
detect_ide() {
  log "Detectando IDE..."
  local detected=()
  # Detecta por presencia de archivos de configuración característicos
  [ -f ".cursor/rules" ] || [ -d ".cursor" ] && detected+=("cursor")
  [ -f ".cursorrules" ] && detected+=("cursor-legacy")
  [ -f "CLAUDE.md" ] && detected+=("claude-code")
  [ -f "GEMINI.md" ] && detected+=("gemini")
  [ -f ".github/copilot-instructions.md" ] && detected+=("copilot")
  [ -f ".windsurfrules" ] && detected+=("windsurf")
  [ -f ".clinerules" ] && detected+=("cline")
  [ -f ".roo" ] || [ -d ".roo" ] && detected+=("roocode")
  [ -f "opencode.md" ] || [ -d ".opencode" ] && detected+=("opencode")
  [ -d ".trae" ] && detected+=("trae")
  [ -d ".antigravity" ] && detected+=("antigravity")
  [ -d ".zcode" ] && detected+=("zcode")
  [ -d ".vscode" ] && detected+=("vscode")
  [ -f ".aider.conf.yml" ] && detected+=("aider")
  [ -d ".continue" ] && detected+=("continue")

  # Detecta por variables de entorno de IDEs
  [ -n "${CURSOR_DEBUG:-}" ] && detected+=("cursor")
  [ -n "${CLAUDE_CODE_ENTRYPOINT:-}" ] && detected+=("claude-code")
  [ -n "${GEMINI_CLI:-}" ] && detected+=("gemini")
  [ -n "${WINDSURF_USER_TOKEN:-}" ] && detected+=("windsurf")
  [ -n "${CLINE_IDE:-}" ] && detected+=("cline")
  [ -n "${VSCODE_PID:-}" ] || [ -n "${VSCODE_CWD:-}" ] && detected+=("vscode")
  [ -n "${TRAE_ENV:-}" ] && detected+=("trae")

  # Deduplicar
  local unique_detected=()
  for d in "${detected[@]:-}"; do
    [ -n "$d" ] && [[ ! " ${unique_detected[*]:-} " =~ " $d " ]] && unique_detected+=("$d")
  done

  if [ ${#unique_detected[@]} -eq 0 ]; then
    log "  No se detectó ningún IDE automáticamente."
    log "  IDEs soportados: cursor, claude-code, gemini, copilot, windsurf,"
    log "    cline, codex, roocode, opencode, trae, antigravity, zcode, vscode,"
    log "    aider, continue"
    log ""
    log "  Uso: bash scripts/ide.sh <ide-name>   (ej: claude-code)"
    log "       bash scripts/ide.sh all           (genera para todos)"
    return 1
  fi

  log "  IDEs detectados: ${unique_detected[*]}"
  printf '%s\n' "${unique_detected[@]}"
}

# ── Generar prompt extendido para un IDE ──
generate_extended_prompt() {
  local ide_id="$1" ide_name="$2" config_file="$3" prompt_type="$4"

  # SAFEGUARD: nunca sobrescribir archivos constitucionales (Regla P9 + gobernanza PRE-v2.0)
  case "$config_file" in
    AGENTS.md|docs/governance/*|docs/catalogs/*|docs/memory/anti-patterns.md|docs/memory/wins-ledger.md|docs/memory/state.json|docs/memory/worklog.md)
      err "RECHAZADO: '$config_file' es constitucional (P9 / PRE-v2.0). No se sobrescribe."
      err "  Codex CLI lee AGENTS.md nativamente; el wrapper vive en CODEX.md aparte."
      return 1
      ;;
  esac

  log "Generando configuración para: $ide_name → $config_file"

  # Crear directorio padre si no existe
  local parent_dir
  parent_dir=$(dirname "$config_file")
  mkdir -p "$parent_dir"

  # El prompt extendido es el mismo núcleo para todos los IDEs;
  # el wrapper (frontmatter, formato) varía según prompt_type
  case "$prompt_type" in
    mdc)
      # Cursor .mdc format con frontmatter YAML
      cat > "$config_file" << 'EOF'
---
description: Agent OS Boilerplate — auto-aplica AGENTS.md sin comandos canónicos
globs: "*"
alwaysApply: true
---

EOF
      cat >> "$config_file" << 'PROMPT_BODY'
# Agent OS — Auto-Activation Layer (Cursor)

> **PROPÓSITO:** Garantizar que TODO prompt del operador (incluso sin
> "lee AGENTS.md, ejecuta:") sea tratado como canónico. Este archivo se
> carga automáticamente en cada sesión de Cursor.

## Comportamiento obligatorio del agente

### 1. Fase 0 automática (antes de cualquier acción)
ANTES de responder o ejecutar cualquier cosa, el agente DEBE:
0. **[BOOTSTRAP CHECK]**: Si los catálogos en `docs/catalogs/` están vacíos o el proyecto es un "Fresh Clone", dispara inmediatamente el **Protocolo 11 de AGENTS.md (Zero-Shot Project Bootstrap)** antes de hacer nada más.
1. Leer `AGENTS.md` completo (Documento Cero, constitución inmutable).
2. Leer `docs/memory/anti-patterns.md` (evitar reincidencias).
3. Leer el último bloque de `docs/memory/worklog.md` (contexto del estado).
4. Leer los últimos 3 reportes de `docs/reports/` (epoch desc).
5. Declarar `DEV_OS` y `DEPLOY_OS` (Regla P10) del `.env`.
6. Declarar el alcance planificado antes de mutar.

### 2. Las 11 Reglas Cardinales (P1-P11) siempre activas
- **P1** Read-After-Edit: tras editar, releer para verificar diff.
- **P2** Gate Honesty: nunca PASS sin comando ejecutado + exit code + stdout.
- **P3** Closes-Finding Guard: no cerrar hallazgos solo en mocks.
- **P4** Sync atómica: código + contrato + docs + memoria en mismo commit.
- **P5** Estilo Apple Light Mode (#ffffff, #f5f5f7, #1d1d1f, #0071e3).
- **P6** Layout 7 posiciones canónicas.
- **P7** Zero-Placeholder, Zero-Emoji (SVG icons).
- **P8** LLM-Agnóstico: no importar SDKs de proveedor en código de negocio.
- **P9** Memoria append-only: solo anexar, nunca sobrescribir.
- **P10** Entornos Dev/Deploy declarados (DEV_OS/DEPLOY_OS).
- **P11** Onboarding Tour obligatorio en vistas complejas (>3 secciones).

### 3. Interpretación de prompts no canónicos
Si el operador envía un prompt SIN "lee AGENTS.md, ejecuta:":
- NO asumas que es un prompt simple. Trátalo como canónico.
- Detecta el verbo operativo implícito:
  - "implementa / crea / agrega / arregla" → `itera`
  - "audita / revisa / chequa" → `cold run`
  - "verifica / compila / tests" → `verify`
  - "test ui / prueba pantalla" → `ui test <ruta>`
  - "persona / usuario / perfil" → `persona check <ruta>`
  - "reporte / cierra / entrega" → `report`
  - "configura el ide" → `ide`
- Ejecuta Fase 0 automática antes de cualquier acción.

### 4. Comandos canónicos equivalentes (atalajos del IDE)
El agente puede usar herramientas nativas de Cursor, pero el resultado debe
ser equivalente al comando canónico:
- Edit file → tras editar, usar `read_file` para verificar (P1).
- Run terminal → reportar exit code + stdout reales (P2).
- Semantic search → antes de asumir estructura del código (P2 + BP #8).

### 5. Estilo de respuesta
- Pragmático, sin sobre-explicar.
- Tras cada edición: `git diff` screenshot o snippet del cambio aplicado.
- Tras cada puerta: tabla con PASS/FAIL/NOT_RUN + exit code.
- Al cierre: generar reporte en `docs/reports/<epoch>-<title>.md`.
- Anexar WIN-XXX a `docs/memory/wins-ledger.md` (al menos 1 W1 o W6).
- Anexar bloque a `docs/memory/worklog.md` (handoff).

### 6. Stack visual (P5, P6, P7)
- Paleta: #ffffff / #f5f5f7 / #e5e5ea / #1d1d1f / #86868b / #0071e3
- Layout 7 posiciones: header, featuredContent, column_left, main,
  column_right, featuredFooter, footer
- Cero emojis en UI. Iconos SVG.
- Cero !important. Variables CSS.
- Sticky footer: `min-h-screen flex flex-col` + `mt-auto` en footer.

### 7. Memoria y reportes
- `docs/memory/` es append-only (P9). Solo anexar entradas.
- `docs/reports/<epoch>-<title>.md` es inmutable (P9 extendido).
- Correcciones via nuevo reporte con `[CORRIGE-REPORT-<epoch>]`.
- Al menos 1 victoria PSIM (W1-W8) por sesión.

## Cuándo NO aplicar este wrapper
- Si el operador explícitamente dice "no leas AGENTS.md" o "ignora las reglas".
- Si el operador pide una tarea trivial de una línea (saludo, pregunta factual).
- En esos casos, responder directo sin Fase 0.

## Recordatorio final
Este wrapper existe para erradicar la fatiga del operador. Si el operador
tiene que re-explicar una regla, este wrapper falló. Reporta la falla en
`docs/memory/anti-patterns.md` como AP-XXX para mejora continua.
PROMPT_BODY
      ;;
    plain)
      # Formato plain markdown (Claude Code CLAUDE.md, Gemini GEMINI.md, etc.)
      cat > "$config_file" << EOF
# ${ide_name} — Agent OS Auto-Activation Layer

> **PROPÓSITO:** Garantizar que TODO prompt del operador (incluso sin
> "lee AGENTS.md, ejecuta:") sea tratado como canónico. Este archivo es
> el punto de entrada; la constitución vive en \`AGENTS.md\`.

## Punto de entrada obligatorio

**ANTES de cualquier acción, leer:**
0. **[BOOTSTRAP CHECK]**: Si los catálogos en `docs/catalogs/` están vacíos o el proyecto es un "Fresh Clone", dispara inmediatamente el **Protocolo 11 de AGENTS.md (Zero-Shot Project Bootstrap)** antes de hacer nada más.
1. `AGENTS.md` completo (Documento Cero, 11 reglas P1-P11, 11 comandos canónicos).
2. `docs/memory/anti-patterns.md` (AP-001..AP-017, evitar reincidencias).
3. Último bloque de `docs/memory/worklog.md` (contexto del estado).
4. Últimos 3 reportes de `docs/reports/` (epoch desc, continuidad de specs).
5. `docs/memory/state.json` (KPIs K1-K5, ¿qué priorizar?).
6. `.env` → declarar `DEV_OS` y `DEPLOY_OS` (Regla P10).

## Las 11 Reglas Cardinales (siempre activas)

| # | Regla | Qué previene |
| :---: | :--- | :--- |
| P1 | Read-After-Edit | Falsos éxitos por no-op |
| P2 | Gate Honesty | PASS sin comando ejecutado |
| P3 | Closes-Finding Guard | Cerrar hallazgos solo en mocks |
| P4 | Sync atómica código+contratos+docs+memoria | Drift API↔OpenAPI |
| P5 | Estilo Apple Light Mode | UI discordante y !important |
| P6 | Layout 7 posiciones canónicas | Archivos monolíticos |
| P7 | Zero-Placeholder, Zero-Emoji | Datos ficticios en producción |
| P8 | LLM-Agnóstico | Vendor lock-in con SDKs directos |
| P9 | Memoria append-only | Pérdida de aprendizaje histórico |
| P10 | Entornos Dev/Deploy declarados | Bugs Windows↔Ubuntu |
| P11 | Onboarding Tour en vistas complejas | Pantallas densas sin Joyride |

## Interpretación de prompts no canónicos

Si el operador envía un prompt SIN "lee AGENTS.md, ejecuta:":
- **NO** asumas que es simple. Trátalo como canónico.
- Detecta el verbo operativo implícito:
  - "implementa/crea/agrega/arregla" → ejecuta \`itera\`
  - "audita/revisa/checa" → ejecuta \`cold run [scope]\`
  - "verifica/compila/tests" → ejecuta \`verify\`
  - "test ui/prueba pantalla <ruta>" → ejecuta \`ui test <ruta>\`
  - "persona/usuario/perfil <ruta>" → ejecuta \`persona check <ruta>\`
  - "reporte/cierra/entrega" → ejecuta \`report\`
  - "configura el ide" → ejecuta \`ide\`
- Ejecuta Fase 0 automática antes de cualquier mutación.

## Los 11 comandos canónicos

\`\`\`
lee AGENTS.md, ejecuta: start
lee AGENTS.md, ejecuta: cold run [scope]
lee AGENTS.md, ejecuta: itera [N]
lee AGENTS.md, ejecuta: verify
lee AGENTS.md, ejecuta: audit memory
lee AGENTS.md, ejecuta: sil trend
lee AGENTS.md, ejecuta: pre cycle
lee AGENTS.md, ejecuta: report
lee AGENTS.md, ejecuta: ui test <route>
lee AGENTS.md, ejecuta: persona check <route>
lee AGENTS.md, ejecuta: ide [detect|<name>|all]
\`\`\`

## Estilo de respuesta
- Pragmático, sin sobre-explicar.
- Tras editar: releer sección (P1) + mostrar diff aplicado.
- Tras puerta de validación: tabla PASS/FAIL/NOT_RUN + exit code + stdout.
- Al cierre: generar \`docs/reports/<epoch>-<title>.md\` + anexar WIN + worklog.

## Stack visual (P5, P6, P7)
- Paleta: #ffffff / #f5f5f7 / #e5e5ea / #1d1d1f / #86868b / #0071e3
- Layout 7 posiciones: header, featuredContent, column_left, main, column_right, featuredFooter, footer
- Cero emojis en UI (SVG icons). Cero !important (CSS variables).
- Sticky footer: \`min-h-screen flex flex-col\` + \`mt-auto\` en footer.

## Cuándo NO aplicar este wrapper
- Operador dice "no leas AGENTS.md" o "ignora las reglas" → obedecer.
- Tarea trivial de una línea (saludo, pregunta factual) → responder directo.
- En esos casos, omitir Fase 0.

## Recordatorio
Este wrapper erradica la fatiga del operador. Si el operador tiene que
re-explicar una regla, este wrapper falló. Reportar en \`docs/memory/anti-patterns.md\`.

---
> Documento generado por \`scripts/ide.sh\` (comando canónico \`ide\`).
> La constitución vive en \`AGENTS.md\`. Este archivo es solo el auto-activador.
EOF
      ;;
    json)
      # VS Code settings.json / Continue config.json
      if [ "$ide_id" = "vscode" ]; then
        cat > "$config_file" << 'EOF'
{
  "$schema": "https://json.schemastore.org/vscode-settings.json",
  "agent-os.autoActivate": true,
  "agent-os.documentZero": "AGENTS.md",
  "agent-os.memoryDir": "docs/memory/",
  "agent-os.reportsDir": "docs/reports/",
  "agent-os.personasDir": "docs/personas/",
  "agent-os.rules": ["P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11"],
  "agent-os.commands": [
    "start", "cold run", "itera", "verify", "audit memory",
    "sil trend", "pre cycle", "report", "ui test", "persona check", "ide"
  ],
  "agent-os.devOS": "${env:DEV_OS}",
  "agent-os.deployOS": "${env:DEPLOY_OS}",
  "github.copilot.advanced": {
    "debug.overrideCAPIPrompt": "[Agent OS] [BOOTSTRAP CHECK]: If this is a fresh clone (empty catalogs), trigger AGENTS.md Protocol 11 first. Before any action, read AGENTS.md (document zero), docs/memory/anti-patterns.md, last worklog block, and last 3 docs/reports/*.md. Apply P1-P11. Treat all prompts as canonical (auto-detect verb: implementa→itera, audita→cold run, verifica→verify, test ui→ui test, persona→persona check). Style: Apple Light Mode (#ffffff/#f5f5f7/#1d1d1f). Zero emoji. Sticky footer min-h-screen flex flex-col."
  },
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,
  "[markdown]": { "files.trimTrailingWhitespace": false },
  "editor.formatOnSave": true,
  "editor.rulers": [80, 120],
  "search.exclude": {
    "**/node_modules": true,
    "**/vendor": true,
    "**/target": true,
    "**/.worktrees": true
  },
  "extensions.recommendations": [
    "GitHub.copilot",
    "anthropic.claude-code",
    "Continue.continue",
    "Google.geminicodeassist"
  ]
}
EOF
      elif [ "$ide_id" = "continue" ]; then
        cat > "$config_file" << 'EOF'
{
  "models": [
    { "title": "Agent OS (default)", "provider": "anthropic", "model": "claude-sonnet-4-5", "apiKey": "${ANTHROPIC_API_KEY}" }
  ],
  "systemPrompt": "[Agent OS Auto-Activation] [BOOTSTRAP CHECK]: If fresh clone, trigger AGENTS.md Protocol 11 first. Before any action: read AGENTS.md, docs/memory/anti-patterns.md, last worklog block, last 3 docs/reports/*.md. Apply P1-P11. Treat all prompts as canonical (auto-detect verb: implementa→itera, audita→cold run, verifica→verify, test ui→ui test, persona→persona check). Style: Apple Light Mode. Zero emoji. Sticky footer.",
  "tabAutocompleteModel": { "title": "Autocomplete", "provider": "anthropic", "model": "claude-haiku-4" },
  "allowAnonymousTelemetry": false,
  "embeddingsProvider": { "provider": "openai", "model": "text-embedding-3-small" }
}
EOF
      fi
      ;;
    yaml)
      # Aider .aider.conf.yml
      cat > "$config_file" << 'EOF'
# Agent OS — Aider configuration
# Auto-activa AGENTS.md en cada sesión de Aider.

read:
  - AGENTS.md
  - docs/memory/anti-patterns.md
  - docs/memory/worklog.md
  - docs/memory/state.json

auto-commits: false
auto-lint: true
lint-cmd: "bun run lint"
test-cmd: "bun run test"
weak-model: "claude-haiku-4"
model: "claude-sonnet-4-5"

# System prompt extendido (inyectado en cada sesión)
system-prompt: |
  [Agent OS Auto-Activation] [BOOTSTRAP CHECK]: If fresh clone, trigger AGENTS.md Protocol 11 first.
  Before any action: read AGENTS.md (document zero), docs/memory/anti-patterns.md,
  last worklog block, last 3 docs/reports/*.md. Apply P1-P11 cardinal rules.
  Treat all prompts as canonical (auto-detect verb: implementa→itera, audita→cold run,
  verifica→verify, test ui→ui test, persona→persona check, configura ide→ide).
  Style: Apple Light Mode (#ffffff/#f5f5f7/#1d1d1f). Zero emoji. Sticky footer.
  After edit: re-read to verify (P1). After gate: report exit code + stdout (P2).
EOF
      ;;
  esac

  log "  [OK] Generado: $config_file ($prompt_type)"
}

# ── Generar para un IDE por id ──
generate_for_ide() {
  local target="$1"
  local found=0
  for entry in "${SUPPORTED_IDES[@]}"; do
    IFS='|' read -r id name config_file prompt_type <<< "$entry"
    if [ "$id" = "$target" ]; then
      found=1
      generate_extended_prompt "$id" "$name" "$config_file" "$prompt_type"
      return
    fi
  done
  if [ "$found" = "0" ]; then
    err "IDE no soportado: $target"
    err "IDEs soportados: cursor, cursor-legacy, claude-code, gemini, copilot, windsurf, cline, codex, roocode, opencode, trae, antigravity, zcode, vscode, aider, continue"
    return 1
  fi
}

# ── Generar para todos los IDEs ──
generate_all() {
  log "Generando configuración para TODOS los IDEs soportados..."
  for entry in "${SUPPORTED_IDES[@]}"; do
    IFS='|' read -r id name config_file prompt_type <<< "$entry"
    generate_extended_prompt "$id" "$name" "$config_file" "$prompt_type"
  done
  log ""
  log "Done. ${#SUPPORTED_IDES[@]} IDEs configurados."
  log "Cada IDE ahora auto-activa AGENTS.md sin necesidad de comandos canónicos."
}

# ── Resumen post-generación ──
print_summary() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo " Resumen — Comando \`ide\` aplicado"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "Archivos generados (auto-activation layer):"
  for entry in "${SUPPORTED_IDES[@]}"; do
    IFS='|' read -r id name config_file prompt_type <<< "$entry"
    if [ -f "$config_file" ]; then
      size=$(wc -c < "$config_file")
      printf '  ✓ %-30s  (%d bytes)\n' "$config_file" "$size"
    fi
  done
  echo ""
  echo "Efecto: a partir de ahora, cualquier prompt del operador"
  echo "(incluso sin 'lee AGENTS.md, ejecuta:') será tratado como"
  echo "canónico por el IDE detectado."
  echo ""
  echo "El IDE auto-aplicará:"
  echo "  - Fase 0 (lectura de AGENTS.md + memoria + reportes)"
  echo "  - Las 11 reglas cardinales P1-P11"
  echo "  - Detección de verbo implícito (implementa→itera, etc.)"
  echo "  - Estilo Apple Light Mode + sticky footer + zero emoji"
  echo "  - Reporte en docs/reports/<epoch>-<title>.md al cierre"
  echo ""
}

# ── Main ──
case "${1:-detect}" in
  detect|"")
    mapfile -t detected_ides < <(detect_ide)
    if [ ${#detected_ides[@]} -gt 0 ]; then
      log ""
      log "Generando para IDEs detectados..."
      for ide in "${detected_ides[@]}"; do
        generate_for_ide "$ide"
      done
      print_summary
    fi
    ;;
  all)
    generate_all
    print_summary
    ;;
  list)
    log "IDEs soportados:"
    for entry in "${SUPPORTED_IDES[@]}"; do
      IFS='|' read -r id name config_file prompt_type <<< "$entry"
      printf '  %-18s  →  %s\n' "$id" "$config_file"
    done
    ;;
  help|-h|--help)
    echo "Uso: bash scripts/ide.sh [detect|<ide-name>|all|list]"
    echo ""
    echo "Comandos:"
    echo "  detect       (default) detecta IDEs presentes y genera config"
    echo "  <ide-name>   genera config para un IDE específico"
    echo "  all          genera config para todos los IDEs soportados"
    echo "  list         lista IDEs soportados"
    echo ""
    echo "IDEs soportados:"
    for entry in "${SUPPORTED_IDES[@]}"; do
      IFS='|' read -r id name _ _ <<< "$entry"
      printf '  %-18s  %s\n' "$id" "$name"
    done
    ;;
  *)
    generate_for_ide "$1"
    print_summary
    ;;
esac
