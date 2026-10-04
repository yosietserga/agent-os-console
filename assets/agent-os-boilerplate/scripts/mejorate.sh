#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# mejorate.sh — Comando canónico: `mejorate|improve yourself`
#
# Autoaplica todo el refinamiento: escanea repositorios de referencia
# en busca de patrones agénticos ventajosos, los sintetiza, y propone
# adoptions al boilerplate via PRE-v2.0.
#
# SOLUCIÓN META: este comando erradica la fatiga del propio sistema.
# En vez de esperar que el operador pase nuevos patrones manualmente,
# el sistema se auto-mejora escaneando referencias externas.
#
# Inspirado en:
# - ai-prompts-for-developers/prompt.md (ciclo Draft→Critique→Improve)
# - Anthropic Cookbook "Building Effective Agents" (Evaluator-Optimizer)
# - PRE-v2.0 (3 roles: Ejecutor/Optimizador/Juez)
# ════════════════════════════════════════════════════════════════════════
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\033[1;36m[MEJORATE]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[ERR]\033[0m %s\n' "$*" >&2; }

# ── Catálogo de repos de referencia ──
# Formato: "owner/repo|categoría|descripción"
REFERENCE_REPOS=(
  "jujumilk3/leaked-system-prompts|system-prompts|Prompts reales filtrados de Claude 4.7, GPT-5, Cursor, Cline, Windsurf"
  "LouisShark/chatgpt_system_prompt|system-prompts|Colección masiva de prompts de GPTs, Copilot, Cursor"
  "dontriskit/awesome-ai-system-prompts|system-prompts|Awesome list con prompts de 20+ IDEs (Cursor, Claude, Devin, Bolt, v0, Manus, Jules)"
  "PatrickJS/awesome-cursorrules|rules-catalog|Directorio curado de reglas por stack (Next.js, FastAPI, NestJS, Rust, Go)"
  "Aider-AI/aider|agent-arch|Pair programming CLI con Repo Map (tree-sitter) y bloques Search/Replace"
  "SWE-agent/SWE-agent|agent-arch|Agente autónomo de Princeton con Agent-Computer Interface (ACI) y navegación por líneas"
  "OpenHands/OpenHands|agent-arch|Plataforma modular con EventStream, subagentes Planner/Coder/Browser, sandbox Docker"
  "BerriAI/litellm|control-plane|Proxy universal LLM con circuit breakers, fallbacks, presupuestos por tenant"
  "modelcontextprotocol/servers|mcp-tools|Servidores MCP oficiales: filesystem, git, memory, sequentialthinking, fetch, time"
  "anthropics/anthropic-cookbook|patterns|Recetas Anthropic: Prompt Chaining, Routing, Orchestrator-Workers, Evaluator-Optimizer"
)

# ── Modos de operación ──
MODE="${1:-scan}"

case "$MODE" in
  scan|"")
    log "Modo: scan (escaneo read-only de repos de referencia)"
    log "Repos a escanear: ${#REFERENCE_REPOS[@]}"
    log ""

    # Verificar PAT (opcional, para rate-limit)
    PAT="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
    if [ -z "$PAT" ]; then
      log "WARN: GITHUB_TOKEN no seteado. Rate limit unauthenticated: 60 req/hr."
      AUTH_HEADER=""
    else
      log "GITHUB_TOKEN detectado. Rate limit: 5000 req/hr."
      AUTH_HEADER="-H \"Authorization: token $PAT\""
    fi

    mkdir -p docs/mejorate-scans
    SCAN_TS=$(date -u +"%Y%m%dT%H%M%SZ")
    SCAN_FILE="docs/mejorate-scans/${SCAN_TS}-scan.md"

    cat > "$SCAN_FILE" << EOF
# Mejorate Scan — $SCAN_TS

> Generado por: \`scripts/mejorate.sh scan\`
> Repos escaneados: ${#REFERENCE_REPOS[@]}
> Modo: read-only via GitHub API

## Resumen de patrones detectados

EOF

    for entry in "${REFERENCE_REPOS[@]}"; do
      IFS='|' read -r repo category desc <<< "$entry"
      log "Escaneando: $repo ($category)"
      log "  $desc"

      # Metadata del repo
      META=$(curl -s ${AUTH_HEADER} "https://api.github.com/repos/$repo" 2>/dev/null)
      STARS=$(echo "$META" | python3 -c "import json,sys; r=json.load(sys.stdin); print(r.get('stargazers_count','?'))" 2>/dev/null || echo "?")
      SIZE=$(echo "$META" | python3 -c "import json,sys; r=json.load(sys.stdin); print(r.get('size','?'))" 2>/dev/null || echo "?")
      DEFAULT_BRANCH=$(echo "$META" | python3 -c "import json,sys; r=json.load(sys.stdin); print(r.get('default_branch','main'))" 2>/dev/null || echo "main")

      cat >> "$SCAN_FILE" << EOF

### $repo
- **Categoría:** $category
- **Stars:** $STARS · **Tamaño:** ${SIZE}KB · **Branch:** $DEFAULT_BRANCH
- **Descripción:** $desc

EOF

      # Árbol de archivos (top-level)
      TREE=$(curl -s ${AUTH_HEADER} "https://api.github.com/repos/$repo/git/trees/$DEFAULT_BRANCH?recursive=1" 2>/dev/null)
      TOP_DIRS=$(echo "$TREE" | python3 -c "
import json, sys
d = json.load(sys.stdin)
tree = d.get('tree', [])
top = sorted(set(t['path'].split('/')[0] for t in tree if t['type']=='tree' and '/' not in t['path'] and not t['path'].startswith('.')))
print(', '.join(top[:15]))
" 2>/dev/null || echo "(no se pudo obtener árbol)")

      cat >> "$SCAN_FILE" << EOF
- **Top-level dirs:** $TOP_DIRS

EOF

      # Buscar archivos agénticos clave
      KEY_FILES=$(echo "$TREE" | python3 -c "
import json, sys
d = json.load(sys.stdin)
tree = d.get('tree', [])
patterns = ['agents.md', '.cursorrules', 'claude.md', 'gemini.md', 'copilot', 'system-prompt', 'system_prompt', 'prompt.md', 'prompts/', 'personas/', '.pre/', 'skill.md', 'aci', 'repo_map', 'repomap', 'search_replace', 'editblock', 'event', 'planner', 'fallback', 'circuit', 'router']
matches = [t for t in tree if t['type']=='blob' and any(p in t['path'].lower() for p in patterns)]
for f in matches[:8]:
    print(f'  - {f[\"path\"]}  ({f[\"size\"]}b)')
" 2>/dev/null || echo "  (no se pudieron buscar archivos clave)")

      cat >> "$SCAN_FILE" << EOF
- **Archivos agénticos clave:**
\`\`\`
$KEY_FILES
\`\`\`

EOF
    done

    log ""
    log "Scan completado. Reporte: $SCAN_FILE"
    log ""
    log "Próximos pasos sugeridos (algoritmo del Optimizador PRE-v2.0):"
    log "  1. Leer $SCAN_FILE y extraer patrones concretos por repo."
    log "  2. Para cada patrón: decidir si adoptar (BP/AP/Killer/skill/widget)."
    log "  3. Sintetizar adoptions en una propuesta PRE-v2.0 (rama pre/propose/*)."
    log "  4. Aplicar adoptions al boilerplate (este script NO muta; solo escanea)."
    log "  5. Commitear + pushear. Anexar WIN-XXX al wins-ledger."
    log ""
    log "Para ejecutar la síntesis automática: bash scripts/mejorate.sh synthesize $SCAN_FILE"
    ;;

  synthesize)
    SCAN_FILE="${2:-}"
    if [ -z "$SCAN_FILE" ] || [ ! -f "$SCAN_FILE" ]; then
      err "Uso: bash scripts/mejorate.sh synthesize <scan-file.md>"
      err "Ejecuta primero: bash scripts/mejorate.sh scan"
      exit 1
    fi
    log "Modo: synthesize (extraer patrones del scan $SCAN_FILE)"
    log ""
    log "Síntesis de patrones detectados:"
    log ""

    # Heurística: extraer categorías y proponer adoptions
    SYN_TS=$(date -u +"%Y%m%dT%H%M%SZ")
    SYN_FILE="docs/mejorate-scans/${SYN_TS}-synthesis.md"

    cat > "$SYN_FILE" << 'EOF'
# Mejorate Synthesis — Patrones Extraídos y Adoptions Propuestas

> Generado por: `scripts/mejorate.sh synthesize`
> Trabajo del rol Optimizador de PRE-v2.0 (propone; el Juez decide).

## Patrones extraídos por categoría

### 1. System Prompts (jujumilk3, LouisShark, dontriskit)
- Claude Code usa `{{CLAUDE_PROJECTS}}\{{PROJECT_SLUG}}\memory\` con MEMORY.md index
- Frontmatter YAML por memoria: name, description, metadata.type (user/feedback/project/reference)
- Linking liberal con `[[name]]` aunque el target no exista aún
- Tipos de memoria: user (rol), feedback (correcciones + why), project (work), reference (URLs)
- Cursor Agent (32KB): tools declaradas, reglas anti-fuga, delimitadores de contexto
- Bolt/v0: instrucciones de UI/UX (no romper componentes, design systems consistentes)
- Cursor: cuándo reemplazo completo vs diff quirúrgico (optimización de tokens)

### 2. Catálogos de Reglas (PatrickJS/awesome-cursorrules)
- Reglas por stack: Next.js, FastAPI, NestJS, Rust, Go, Tailwind
- Inyectables como extensiones modulares en memoria empírica
- Convenciones: cero `any` en TS, `Result`/`Option` en Rust, Pydantic en Python
- Orden de imports estandarizado: builtins → third-party → workspace → relative

### 3. Arquitecturas de Agentes (Aider, SWE-agent, OpenHands)
- **Aider Repo Map**: tree-sitter para mapa comprimido de símbolos
- **Aider Search/Replace**: bloques `<<<< SEARCH` / `==== REPLACE` estrictos
- **SWE-agent ACI**: comandos `search_dir`, `view_lines_window`, `apply_patch`
- **SWE-agent windowed navigation**: leer por rangos de líneas, no archivos gigantes
- **OpenHands EventStream**: eventos tipados (bash, edit, browse) desacoplados
- **OpenHands subagentes**: Planner → Coder + Browser, sin contexto monolítico
- **OpenHands .agents/skills/**: SKILL.md + references/guide.md (carga lazy)

### 4. Control Plane LLM (LiteLLM)
- Router con fallbacks por modelo
- Circuit breakers basados en tasa de errores
- Backoff exponencial con jitter
- Ledger financiero: presupuesto por tenant, costo real-time, auditoría inmutable
- 100+ proveedores vía formato OpenAI

### 5. MCP Tools (modelcontextprotocol/servers)
- Servidores oficiales: filesystem, git, memory, sequentialthinking, fetch, time
- `sequentialthinking`: obliga al modelo a estructurar proceso cognitivo en pasos
- `memory`: Knowledge graph persistente entre sesiones
- Contratos formales de herramientas (JSON schema estricto)

### 6. Patrones de Orquestación (Anthropic Cookbook)
- Prompt Chaining: tarea → sub-tarea → sub-tarea
- Routing: clasificar entrada → dispatch a handler especializado
- Parallelization: múltiples tareas concurrentes
- Orchestrator-Workers: planner distribuye a workers tipados
- Evaluator-Optimizer: loop de mejora con juez sintético
- Principio: código determinista > framework monolítico complejo

## Adoptions propuestas para el boilerplate

| # | Adopción | Tipo | Origen |
| :---: | :--- | :--- | :--- |
| 1 | MEMORY.md index con frontmatter YAML por entrada | skill enhancement | Claude Code (jujumilk3) |
| 2 | Tipos de memoria: user/feedback/project/reference | skill enhancement | Claude Code |
| 3 | Reglas por stack inyectables (TS/Py/Go/Rust/PHP) | new file: docs/polyglot/stack-rules.md | awesome-cursorrules |
| 4 | Repo Map con tree-sitter (conceptual, agnóstico) | new skill: repo-mapper | Aider |
| 5 | Search/Replace block format para ediciones | new BP + enhancement skill-filesystem | Aider |
| 6 | ACI: navegación por rangos de líneas, no archivos gigantes | new BP + AP | SWE-agent |
| 7 | EventStream tipado para acciones del agente | new BP | OpenHands |
| 8 | Subagentes: Planner → Coder + Browser (orquestación) | new BP + skill | OpenHands |
| 9 | Skills con references/guide.md (carga lazy) | skill structure enhancement | OpenHands |
| 10 | Sequential Thinking MCP server | new MCP server config | modelcontextprotocol |
| 11 | Memory MCP server (knowledge graph) | new MCP server config | modelcontextprotocol |
| 12 | Patrones de orquestación (5 del Cookbook) | new doc: docs/patterns/orchestration.md | Anthropic Cookbook |
| 13 | Evaluator-Optimizer loop (juez sintético) | enhancement PRE-v2.0 | Anthropic Cookbook |

## Siguientes pasos (algoritmo Optimizador)

Para cada adopción propuesta:
1. Verificar que NO reintroduce un antipatrón existente (anti-patterns.md).
2. Verificar que NO duplica una BP existente (catálogo 100+5).
3. Crear el artefacto (BP/AP/Killer/skill/widget/MCP config).
4. Anexar entrada a wins-ledger.md con W1 (Capability Strengthening).
5. Commitear + pushear via rama `pre/propose/mejorate-<ts>`.

**Nota:** Este script NO muta archivos; solo propone. La mutación la hace
el agente humano o el LLM ejecutor siguiendo estas propuestas.
EOF

    cat "$SYN_FILE"
    log ""
    log "Síntesis guardada: $SYN_FILE"
    ;;

  list)
    log "Repos de referencia configurados (${#REFERENCE_REPOS[@]}):"
    for entry in "${REFERENCE_REPOS[@]}"; do
      IFS='|' read -r repo category desc <<< "$entry"
      printf '  %-45s  [%s]  %s\n' "$repo" "$category" "${desc:0:60}"
    done
    ;;

  add)
    REPO_TO_ADD="${2:-}"
    if [ -z "$REPO_TO_ADD" ]; then
      err "Uso: bash scripts/mejorate.sh add owner/repo|categoria|descripcion"
      exit 1
    fi
    log "Para añadir un repo permanentemente, edita scripts/mejorate.sh"
    log "y añade a REFERENCE_REPOS:"
    log "  \"$REPO_TO_ADD\""
    ;;

  help|-h|--help)
    echo "Uso: bash scripts/mejorate.sh [scan|synthesize|list|add|help]"
    echo ""
    echo "Comandos:"
    echo "  scan                   Escanea los ${#REFERENCE_REPOS[@]} repos de referencia (read-only)"
    echo "  synthesize <scan.md>   Extrae patrones del scan y propone adoptions"
    echo "  list                   Lista los repos de referencia configurados"
    echo "  add owner/repo|cat|d   Sugiere añadir un nuevo repo al catálogo"
    echo "  help                   Esta ayuda"
    echo ""
    echo "Flujo completo:"
    echo "  1. bash scripts/mejorate.sh scan        # genera docs/mejorate-scans/<ts>-scan.md"
    echo "  2. bash scripts/mejorate.sh synthesize docs/mejorate-scans/<ts>-scan.md"
    echo "                                         # genera docs/mejorate-scans/<ts>-synthesis.md"
    echo "  3. Aplicar adoptions propuestas al boilerplate (manual o via agente)"
    echo "  4. Commit + push. Anexar WIN-XXX al wins-ledger."
    ;;

  *)
    err "Comando desconocido: $MODE"
    err "Ver: bash scripts/mejorate.sh help"
    exit 1
    ;;
esac
