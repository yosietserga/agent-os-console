# Commands Reference — Agent OS Boilerplate v1.8.0

> All 17 canonical commands with syntax, examples, and output specs.
> For interactive version with collapsible cards, see
> [`html/index.html#commands`](./html/index.html#commands).
>
> **Format benefits (Markdown):** searchable, copy-paste friendly, Git-diff
> friendly, GitHub native render.

---

## Quick Reference Table

| # | Command | Script | Lines | Purpose |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `start` | `start.sh` | 119 | Bootstrap DB/Redis/MQ + migrate + seed + serve |
| 2 | `cold run [scope]` | `cold-run.sh` | 111 | Read-only audit (types, contracts, P8 LLM-agnostic) |
| 2a | `cold run reverse-engineer <url>` | `reverse-engineer.sh` | 623 | Radiografía rayos X 5 etapas (alias: `rayos-x`) |
| 3 | `itera [N]` | (manual) | — | Process N worklog tasks |
| 4 | `verify` | `verify.sh` | 156 | Multi-stack gate-honesty (TS/Py/Go/Rust/PHP/C++) |
| 5 | `audit memory` | `audit-memory.sh` | 71 | Anti-reincidence check against anti-patterns.md |
| 6 | `sil trend` | `sil-trend.sh` | 148 | Recalculate K1–K5 + W1–W8 → state.json |
| 7 | `pre cycle` | `pre-cycle.sh` | 120 | Deterministic judge on rule proposal |
| 8 | `report` | `report.sh` | 120 | Session closure AGREE/DISAGREE + Porter |
| 9 | `ui test <route>` | `ui-test.sh` | 183 | Browser MCP + P5/P6/P7 + WCAG + sticky footer |
| 10 | `persona check <route>` | `persona-check.sh` | 248 | Iterate 10 personas → W6 (Persona Satisfied) |
| 11 | `ide [detect\|<name>\|all]` | `ide.sh` | 501 | Auto-activation layer for 16 IDEs |
| 12 | `mejorate` | `mejorate.sh` | 290 | Scan 10 GitHub repos → propose adoptions |
| 13 | `investiga <topic> [N]` | `investiga.sh` | 238 | Web search + page reader → docs/research/ |
| 14 | `critica <file>` | `critica.sh` | 176 | Self-critique Modo A + D + AGREE/DISAGREE |
| 15 | `expected-check <topic>` | `expected-check.sh` | 298 | Compare real vs expected P15 → MATCH/WORSE |
| 16 | `gaps-finder` | `gaps-finder.sh` | 410 | 15 sync checks (MANDATORY before commit) |

---

## Detailed Reference

### 1. `start` / `inicia`

**Script:** `scripts/start.sh` (119 lines)
**Purpose:** Bootstrap completo del proyecto.

```bash
lee AGENTS.md, ejecuta: start
```

**What it does:**
1. Loads `.env` (DEV_OS, DEPLOY_OS, DATABASE_URL, etc.)
2. Checks infrastructure ports (5432 PostgreSQL, 6379 Redis, 5672 RabbitMQ)
3. Detects stack (TS/Py/Go/Rust/PHP/C++) and runs migrations
4. Applies L2 Control Plane DDL (`docs/l2-control-plane/l2-schema.sql`)
5. Starts dev server (`pnpm run dev` / `uvicorn` / `go run` / `cargo run`)

---

### 2. `cold run [scope]`

**Script:** `scripts/cold-run.sh` (111 lines)
**Purpose:** Auditoría exhaustiva read-only sin modificar archivos.

```bash
lee AGENTS.md, ejecuta: cold run src/
```

**What it checks:**
- Memory sync (anti-patterns count, wins count, state.json)
- Stack detection (TS/Py/Go/Rust/PHP/C++)
- Type checking (tsc/mypy/go vet/cargo check)
- Contract fidelity (OpenAPI spec presence)
- **P8 LLM-agnostic check** (no direct SDK imports in business code)
- P9 memory append-only check

#### 2a. `cold run reverse-engineer <url>` (alias: `rayos-x`)

**Script:** `scripts/reverse-engineer.sh` (623 lines)
**Purpose:** Radiografía rayos X de una web/app en 5 etapas.

```bash
lee AGENTS.md, ejecuta: rayos-x https://target.com
```

**5 stages:**
1. Extracción visual & branding → normalización Apple Light Mode (P5)
2. Extracción shaders & 3D Three.js → WebGL + GLSL + geometrías
3. Radiografía modelo de negocio → pricing + APIs + 5 Fuerzas Porter
4. Reconstrucción modular → componentes + widgets EAV + tour + CTA
5. Verificación → browser headless P14 + expected-check P15 + screenshot diff

---

### 3. `itera [N]`

**Purpose:** Procesa hasta N tareas pendientes del worklog.

```bash
lee AGENTS.md, ejecuta: itera 5
```

---

### 4. `verify`

**Script:** `scripts/verify.sh` (156 lines)
**Purpose:** Batería de puertas deterministas con Gate Honesty (P2).

```bash
lee AGENTS.md, ejecuta: verify
```

**Gates per stack:**
| Stack | Gates |
| :--- | :--- |
| TypeScript | tsc --noEmit, lint --max-warnings=0, test, build |
| Python | mypy --strict, ruff check, pytest --cov |
| Go | go build, golangci-lint, go test -race -cover |
| Rust | cargo clippy -D warnings, cargo fmt --check, cargo test |
| PHP | phpstan --level=max, phpcs, pest --coverage |
| C++ | cmake build, clang-tidy, ctest |

**Output format (P2 Gate Honesty):**
```
  PASS:     12
  FAIL:     0
  NOT_RUN:  3
```

---

### 5. `audit memory`

**Script:** `scripts/audit-memory.sh` (71 lines)
**Purpose:** Compara código vs `docs/memory/anti-patterns.md`.

```bash
lee AGENTS.md, ejecuta: audit memory
```

---

### 6. `sil trend`

**Script:** `scripts/sil-trend.sh` (148 lines)
**Purpose:** Recalcula KPIs K1–K5 + balance W1–W8.

```bash
lee AGENTS.md, ejecuta: sil trend
```

---

### 7. `pre cycle`

**Script:** `scripts/pre-cycle.sh` (120 lines)
**Purpose:** Juez determinista PRE-v2.0 sobre propuesta de regla.

```bash
lee AGENTS.md, ejecuta: pre cycle pre/propose/add-p16-streaming
```

**Verdict:** PROMOTE / REJECT / INCONCLUSO

---

### 8. `report`

**Script:** `scripts/report.sh` (120 lines)
**Purpose:** Informe de cierre con veredicto AGREE/DISAGREE.

```bash
lee AGENTS.md, ejecuta: report
```

---

### 9. `ui test <route>`

**Script:** `scripts/ui-test.sh` (183 lines)
**Purpose:** Valida UI vía browser headless.

```bash
lee AGENTS.md, ejecuta: ui test /cms/posts?page=1
```

**Checks:** HTTP 2xx-3xx, header/main/footer (P6), Apple palette (P5),
zero-placeholder (P7), sticky footer, `!important` detection.

---

### 10. `persona check <route>`

**Script:** `scripts/persona-check.sh` (248 lines)
**Purpose:** Valida ruta contra 10 perfiles de persona (W6).

```bash
lee AGENTS.md, ejecuta: persona check /dashboard
```

**Personas:** executive, operator, analyst, apprentice, demo-master,
experience-architect + cold-run: novato, power, adversario, edge.

**P11 check:** En rutas complejas (>3 secciones), verifica `OnboardingTour`.

---

### 11. `ide [detect|<name>|all]`

**Script:** `scripts/ide.sh` (501 lines)
**Purpose:** Genera auto-activation layer para 16 IDEs.

```bash
lee AGENTS.md, ejecuta: ide all
```

**16 IDEs:** Cursor (.mdc + .cursorrules), Claude Code (CLAUDE.md),
Gemini (GEMINI.md), Copilot, Windsurf, Cline, Codex CLI (CODEX.md),
RooCode, OpenCode, Trae, Antigravity, ZCode, VS Code, Aider, Continue.

**Salvaguard:** rechaza sobrescribir AGENTS.md u otros archivos
constitucionales (AP-018).

---

### 12. `mejorate` / `improve yourself`

**Script:** `scripts/mejorate.sh` (290 lines)
**Purpose:** Auto-mejora escaneando 10 repos de referencia.

```bash
lee AGENTS.md, ejecuta: mejorate
```

**10 repos:** jujumilk3/leaked-system-prompts, LouisShark/chatgpt_system_prompt,
dontriskit/awesome-ai-system-prompts, PatrickJS/awesome-cursorrules,
Aider-AI/aider, SWE-agent/SWE-agent, OpenHands/OpenHands, BerriAI/litellm,
modelcontextprotocol/servers, anthropics/anthropic-cookbook.

**Modes:** `scan`, `synthesize <scan.md>`, `list`.

---

### 13. `investiga <topic> [N]`

**Script:** `scripts/investiga.sh` (238 lines)
**Purpose:** Investiga en internet asumiendo falta de conocimientos.

```bash
lee AGENTS.md, ejecuta: investiga "prompt injection defenses 2026"
```

**Uses:** z-ai CLI `web_search` + `page_reader`. Lee top 5 páginas.
**Output:** `docs/research/<epoch>-<topic-slug>.md` + adoptions propuestas.

---

### 14. `critica <file>`

**Script:** `scripts/critica.sh` (176 lines)
**Purpose:** Auto-crítica obligatoria de un artefacto (P13).

```bash
lee AGENTS.md, ejecuta: critica AGENTS.md
```

**Modes:**
- **Modo A** (self-revision): 3 debilidades reales obligatorias.
- **Modo D** (adversario): 2 vectores de ataque si toca seguridad.
- **Tabla AGREE/DISAGREE**: al menos 1 DISAGREE si exploró algo nuevo.
- **Análisis crítico contrario**: "¿hay mejores formas? ¿newer ways 2026?"

---

### 15. `expected-check <topic> [base_url]`

**Script:** `scripts/expected-check.sh` (298 lines)
**Purpose:** Compara resultado real vs expectativa previa (P15).

```bash
lee AGENTS.md, ejecuta: expected-check analytics-ventas
```

**Requires:** `docs/expected/<topic>.md` (generado por skill
`expected-spec-generator` ANTES de implementar).

**Verdict:** MATCH / BETTER / WORSE / FAIL.

**Verification via browser headless (P14):** navigate + console errors +
network failures + screenshot + WCAG audit + 7-pos + sticky footer +
palette + OnboardingTour + CTA Glowing.

---

### 16. `gaps-finder`

**Script:** `scripts/gaps-finder.sh` (410 lines)
**Purpose:** Detecta desincronizaciones. **MANDATORIO antes de commit (§8.2).**

```bash
lee AGENTS.md, ejecuta: gaps-finder
```

**15 checks:**
1. Comandos AGENTS.md vs scripts/ reales
2. Reglas cardinales AGENTS.md vs state.json
3. Antipatrones anti-patterns.md vs state.json
4. Victorias PSIM wins-ledger.md vs state.json
5. Versión state.json vs AGENTS.md changelog
6. README versión vs state.json
7. README diagrama DISPATCH rutas vs comandos (CRÍTICO)
8. README estado actual counts vs state.json
9. MCP servers configs vs state.json
10. MCP skills dirs vs state.json
11. Personas docs/personas/ vs state.json
12. Worklog SESSIONs consecutivas
13. PR template checkboxes vs reglas
14. Catálogos counts reales vs declarados
15. README changelog vs AGENTS.md changelog

**Exit code:** 0 = OK (cero critical/high), 1 = BLOCK (hay critical/high).
