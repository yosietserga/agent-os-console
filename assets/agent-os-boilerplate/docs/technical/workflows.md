# Workflows — Agent OS Boilerplate v1.8.0

> 4 types of paths: sequential, alternate, reciprocal, parallel.
> For animated interactive version, see [`html/index.html#workflows`](./html/index.html#workflows).

---

## 1. Master Workflow (Every Prompt)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         WORKFLOW MAESTRO DE CADA PROMPT                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

 [OPERADOR]  "lee AGENTS.md, ejecuta: <comando>"
     │
     ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │  PASO 1 — INGESTA DEL PROMPT                                             │
 │  Detecta patrón canónico "lee AGENTS.md, ejecuta: X"                    │
 └──────────────────────────────────┬───────────────────────────────────────┘
                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │  PASO 2 — FASE 0 (PATHS PARALELOS)                                       │
 │  ╔═══════════════╗ ╔═══════════════╗ ╔═══════════════╗                  ║
 │  ║ leer AGENTS  ║ ║ leer anti-     ║ ║ leer worklog  ║                  ║
 │  ║ .md          ║ ║ patterns.md    ║ ║ último bloque ║                  ║
 │  ╚═══════╤═══════╝ ╚═══════╤═══════╝ ╚═══════╤═══════╝                  ║
 │          └──────────┬──────┴─────────────────┘                          ║
 │                     ▼                                                    ║
 │  ╔═══════════════════════════════════════════════════╗                  ║
 │  ║  Leer últimos 3 reportes docs/reports/           ║                  ║
 │  ║  Declarar DEV_OS / DEPLOY_OS (P10)               ║                  ║
 │  ╚═══════════════════════════════════════════════════╝                  ║
 └──────────────────────────────────┬───────────────────────────────────────┘
                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │  PASO 3 — DISPATCH (PATHS ALTERNOS — 16 rutas + alias rayos-x)           │
 │  ┌── start ───────────► [bootstrap]                                      │
 │  ├── cold run ────────► [auditoría]                                      │
 │  │   └─ reverse-eng ──► [radiografía 5 etapas]                           │
 │  │   └─ rayos-x ──────► [alias]                                          │
 │  ├── itera ───────────► [worklog tasks]                                  │
 │  ├── verify ──────────► [gate-honesty]                                   │
 │  ├── audit memory ────► [anti-reincidencia]                              │
 │  ├── sil trend ───────► [K1–K5 + W1–W8]                                  │
 │  ├── pre cycle ───────► [juez PRE-v2.0]                                  │
 │  ├── report ──────────► [AGREE/DISAGREE]                                 │
 │  ├── ui test ─────────► [browser MCP + P5/P6/P7]                         │
 │  ├── persona check ───► [10 personas → W6]                               │
 │  ├── ide ─────────────► [auto-activation 16 IDEs]                        │
 │  ├── mejorate ────────► [10 repos GitHub]                                │
 │  ├── investiga ───────► [web search + page reader]                       │
 │  ├── critica ─────────► [Modo A + D + AGREE/DISAGREE]                    │
 │  ├── expected-check ──► [MATCH/BETTER/WORSE/FAIL]                        │
 │  ├── gaps-finder ─────► [15 checks sync, MANDATORIO]                     │
 │  └── <otro> ──────────► [rechazar: no canónico]                          │
 └──────────────────────────────────┬───────────────────────────────────────┘
                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │  PASO 4 — EJECUCIÓN (PATH SECUENCIAL + LOOPS RECÍPROCOS)                 │
 │  F0 ──► F1 ──► F2 ──► F3 ──► F4 ──► F5                                  │
 │  Si F5 falla > 3 veces ──► abortar ──► escalar humano                    │
 └──────────────────────────────────┬───────────────────────────────────────┘
                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │  PASO 5 — GATE HONESTY (PATH RECÍPROCO)                                  │
 │  ejecutar cmd ──► exit code + stdout ──► PASS / FAIL / NOT_RUN           │
 │  si FAIL ──► ↺ Paso 4 ──► si > 3 fails ──► escalar humano                │
 └──────────────────────────────────┬───────────────────────────────────────┘
                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │  PASO 6 — CIERRE (PATHS PARALELOS)                                       │
 │  ╔═══════════════╗ ╔═══════════════╗ ╔═══════════════╗                  ║
 │  ║ append WIN    ║ ║ append AP     ║ ║ append worklog ║                  ║
 │  ╚═══════╤═══════╝ ╚═══════╤═══════╝ ╚═══════╤═══════╝                  ║
 │          └──────────┬──────┴─────────────────┘                          ║
 │                     ▼                                                    ║
 │  ╔═══════════════════════════════════════════════════╗                  ║
 │  ║  Generar docs/reports/<epoch>-<title>.md         ║                  ║
 │  ║  Auto-crítica P13 (Modo A + D + AGREE/DISAGREE)  ║                  ║
 │  ║  Ejecutar gaps-finder (MANDATORIO, 0 gaps crit)  ║                  ║
 │  ║  Actualizar state.json                           ║                  ║
 │  ╚═══════════════════════════════════════════════════╝                  ║
 └──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Path Secuencial — Pipeline 5 Fases

```
  F0 ──► F1 ──► F2 ──► F3 ──► F4 ──► F5
  │      │      │      │      │      │
  │      │      │      │      │      └──► ¿compila? ──no──► ↺ (max 3)
  │      │      │      │      │                          │ sí
  │      │      │      │      └──► sync docs + memoria   │
  │      │      │      └──► UI + widgets + 4 estados ◄───┘
  │      │      └──► OpenAPI + wrapper {success,data,error,meta}
  │      └──► Datos + dominio + tipado estricto
  └──► Premisas + memory sync
```

---

## 3. Paths Alternos — Dispatch (7 Grupos)

```
                ┌─── GRUPO A (bootstrap)     ── start
                ├─── GRUPO B (auditoría)      ── cold run, verify
                ├─── GRUPO C (governance)     ── audit memory, sil trend
  comando ──────┼─── GRUPO D (iteración)      ── itera
                ├─── GRUPO E (UI/UX)          ── ui test, persona check
                ├─── GRUPO F (reglas)         ── pre cycle
                └─── GRUPO G (cierre)         ── report
                                                   │
                                                   ▼
                                          docs/reports/<epoch>-<title>.md
```

**Extended dispatch (v1.8.0):**
```
                ├─── ide ──────────► [auto-activation 16 IDEs]
                ├─── mejorate ─────► [10 repos GitHub scan]
                ├─── investiga ────► [web search + page reader]
                ├─── critica ──────► [Modo A + D + AGREE/DISAGREE]
                ├─── expected-check ► [MATCH/BETTER/WORSE/FAIL]
                └─── gaps-finder ──► [15 checks, MANDATORIO]
```

---

## 4. Paths Recíprocos — 5 Feedback Loops

### 4.1 Memory Loop (entre sesiones)

```
  SESIÓN N                    MEMORIA                SESIÓN N+1
  ┌─────────┐               ┌─────────┐             ┌─────────┐
  │ Escribe │──── anexa ───►│ anti-   │◄─── lee ────│ Lee en  │
  │ AP-XXX  │               │patterns │    Fase 0   │ Fase 0  │
  └─────────┘               │  .md    │             └─────────┘
                            └─────────┘
  ┌─────────┐               ┌─────────┐             ┌─────────┐
  │ Escribe │──── anexa ───►│  wins-  │◄─── lee ────│ Lee en  │
  │ WIN-XXX │               │ledger.md│    Fase 0   │ Fase 0  │
  └─────────┘               └─────────┘             └─────────┘
       ▲                                                   │
       └───────── continuidad garantizada ◄───────────────┘
```

### 4.2 Gate Honesty Loop (dentro de sesión)

```
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │ Editar  │────►│ Releer  │────►│ diff OK?│── sí ──► continuar
  └─────────┘     │ (P1)    │     └────┬────┘
                  └─────────┘          │ no
                                       ▼
                                  ┌─────────┐
                                  │ Reeditar│◄── ↺ (max 3)
                                  └────┬────┘
                                       │ > 3
                                       ▼
                                  ┌─────────┐
                                  │ ESCALAR │
                                  │ HUMANO  │
                                  └─────────┘
```

### 4.3 Circuit Breaker Loop (L2)

```
  CLOSED ──(R_fail ≥ 0.40)──► OPEN ──(T_reset)──► HALF_OPEN
     ▲                                              │
     └──────────(canary OK)────────────────────────┘
                                               │ canary FAIL
                                               ▼
                                          OPEN (reset)
```

### 4.4 PRE-v2.0 Governance Loop

```
  EJECUTOR ──(feedback)──► OPTIMIZADOR ──(propone)──► JUEZ
     ▲                                              │
     │                                              │ PROMOTE
     │                                              ▼
     └──(nueva regla en main)──────────────── merge ◄┘
                        │
                        └──► WIN-XXX (W4 ADOPTED) en wins-ledger
```

### 4.5 PSIM Measurement Loop

```
  SESIÓN N ──(registra)──► wins-ledger.md ──(sil trend)──► state.json
                                                              │
  SESIÓN N+1 ◄──(lee KPIs, prioriza deuda)──────────────────┘
```

---

## 5. Paths Paralelos — 5 Concurrencia Patterns

### 5.1 Squad de Agentes en Worktrees

```
  repo main (protegido)
       │
       ├── .worktrees/agent-A/ (rama: agent-A/task-123)
       ├── .worktrees/agent-B/ (rama: agent-B/task-456)
       └── .worktrees/agent-C/ (rama: agent-C/task-789)

  merges ordenados por blast radius: bajo ──► medio ──► alto
```

### 5.2 MCP Servers Paralelos

```
  AGENTE LLM ──┬── filesystem MCP (read/write + P1 verify)
               ├── git-worktree MCP (squads aislados)
               ├── lsp-bridge MCP (diagnósticos polyglot)
               ├── postgres-inspector MCP (readonly, RLS check)
               ├── browser-devtools MCP (WCAG + 7pos + palette)
               ├── sequential-thinking MCP (cognitive steps)
               └── memory MCP (knowledge graph, append-only)
```

### 5.3 Fase 0 Lecturas Paralelas

```
  t=0ms ─┬── leer AGENTS.md
         ├── leer anti-patterns.md
         ├── leer worklog.md (último bloque)
         ├── leer state.json
         ├── leer docs/reports/[-1]
         ├── leer docs/reports/[-2]
         └── leer docs/reports/[-3]
  t≈Xms ─┬── todos los reads resueltos
         └──► [síntesis de contexto lista]
```

### 5.4 Cierre de Sesión Escrituras Paralelas

```
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ append WIN   │ │ append AP    │ │ append work- │
  │ a wins-ledger│ │ a anti-patt. │ │ log handoff  │
  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
         └──────────┬─────┴────────────────┘
                    ▼
         ┌──────────────────┐
         │ write reporte    │
         │ docs/reports/    │
         │ <epoch>-<title>  │
         └────────┬─────────┘
                  ▼
         ┌──────────────────┐
         │ update state.json│
         │ + gaps-finder    │
         └──────────────────┘
```

### 5.5 CI/CD Workflows Paralelos

```
  [PR abierto]
       │
       ├── gate-honesty.yml
       │     ├── detect-stack
       │     ├── ts-gate (si package.json)
       │     ├── py-gate (si pyproject.toml)
       │     ├── go-gate (si go.mod)
       │     ├── rust-gate (si Cargo.toml)
       │     ├── php-gate (si composer.json)
       │     ├── cpp-gate (si CMakeLists.txt)
       │     └── gate-honesty-report (comenta en PR)
       │
       ├── memory-audit.yml
       │     └── anti-reincidencia AP check
       │
       └── pre-cycle.yml (si toca AGENTS.md)
             └── juez determinista → PROMOTE/REJECT
