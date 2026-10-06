# Architecture — Agent OS Boilerplate v1.8.0

> Technical reference with ASCII diagrams. For interactive SVG diagrams, see
> [`html/index.html#architecture`](./html/index.html#architecture).
>
> **Format benefits (Markdown):** portable, Git-diff friendly, GitHub native
> render, searchable, copy-paste code blocks.

---

## 1. Layered Architecture (4 Layers)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          LAYER 0 — CONSTITUTION                              ║
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────────┐   ║
║   │                         AGENTS.md (Documento Cero)                   │   ║
║   │  15 Reglas Cardinales P1–P15 + W-CTA  ·  17 comandos canónicos      │   ║
║   │  Pipeline 5 Fases  ·  Gobernanza PRE-v2.0  ·  PSIM W1–W8 / K1–K5   │   ║
║   └──────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
║   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             ║
║   │ CLAUDE-CODE.md  │  │  CURSOR-RULES   │  │   GEMINI.md     │  + 13 más  ║
║   │  (entrypoint)   │  │   .md (entry)   │  │  (entrypoint)   │  (16 IDEs) ║
║   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             ║
║            └────────────────────┼────────────────────┘                       ║
║                                 │ todos apuntan a AGENTS.md                  ║
╚═════════════════════════════════╪═══════════════════════════════════════════╝
                                  │
                                  ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                       LAYER -1 — EMPIRICAL MEMORY                            ║
║                          docs/memory/  (append-only, P9)                     ║
║                                                                              ║
║   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          ║
║   │ anti-patterns.md │  │  wins-ledger.md  │  │    worklog.md    │          ║
║   │   (AP-001..030)  │  │  (WIN-001..017)  │  │ (SESSION-000..)  │          ║
║   └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          ║
║            └────────────────────┼────────────────────┘                      ║
║                                 ▼                                             ║
║                       ┌──────────────────┐                                   ║
║                       │    state.json    │  KPIs K1–K5, baselines           ║
║                       │    MEMORY.md     │  Index with frontmatter          ║
║                       └──────────────────┘                                   ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    LAYER 1 — AGENTIC EXECUTION                               ║
║                                                                              ║
║   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        ║
║   │  Pipeline   │  │  Scripts    │  │  MCP         │  │  packages/  │        ║
║   │  5 Fases    │  │  (17 cmds)  │  │  (7 servers  │  │  eval/      │        ║
║   │  F0→F1→F5   │  │             │  │   + 8 skills)│  │  (Juez P3)  │        ║
║   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                  LAYER 2 — COGNITIVE CONTROL PLANE                           ║
║                                                                              ║
║   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          ║
║   │ l2_model_registry│  │ l2_app_routing   │  │ l2_cost_token   │          ║
║   │ (modelos LLM/SLM)│  │ _profiles (CB)   │  │ _ledger (P9)    │          ║
║   └──────────────────┘  └──────────────────┘  └──────────────────┘          ║
║                                                                              ║
║   Circuit Breaker:  CLOSED ⇌ OPEN ⇌ HALF_OPEN                                ║
║   Backoff:  T = min(Tmax, random(Tbase, Tprev × 3))                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. The 15 Cardinal Rules + W-CTA

```
  P1  Read-After-Edit ──────────────────── Falsos éxitos por no-op
  P2  Gate Honesty ─────────────────────── PASS sin comando ejecutado
  P3  Closes-Finding Guard ─────────────── Cerrar hallazgos solo en mocks
  P4  Sync atómica ─────────────────────── Drift API↔OpenAPI
  P5  Apple Light Mode ─────────────────── UI discordante + !important
  P6  Layout 7 posiciones ──────────────── Archivos monolíticos
  P7  Zero-Placeholder ─────────────────── Datos ficticios en producción
  P8  LLM-Agnóstico ────────────────────── Vendor lock-in con SDKs
  P9  Memoria append-only ──────────────── Pérdida de aprendizaje histórico
  P10 Entornos Dev/Deploy ──────────────── Bugs Windows↔Ubuntu
  P11 Onboarding Tour ──────────────────── Pantallas densas sin Joyride
  P12 Anti-Prompt-Injection (7 capas) ──── OWASP LLM01 2026
  P13 Auto-Crítica obligatoria ─────────── Auto-aprobación complaciente
  P14 Headless Browser Verification ────── curl/fetch aislado (éxito falso)
  P15 Expected-First Workflow ──────────── Generación sin expectativas
  W-CTA GlowingCtaButton ──────────────── CTAs grises sin invitar a tocar
```

---

## 3. The 17 Canonical Commands

```
  start                  Bootstrap + migrate + seed + serve
  cold run [scope]       Auditoría read-only
    └─ reverse-engineer  Radiografía rayos X 5 etapas (alias: rayos-x)
  itera [N]              Procesa N tareas del worklog
  verify                 Gate-honesty multi-stack
  audit memory           Anti-reincidencia AP
  sil trend              Recalcular K1–K5 + W1–W8
  pre cycle              Juez PRE-v2.0 sobre propuesta
  report                 Cierre AGREE/DISAGREE → docs/reports/
  ui test <route>        Browser MCP + P5/P6/P7 + WCAG
  persona check <route>  Iterar docs/personas/ → W6
  ide [detect|all]       Auto-activation 16 IDEs
  mejorate               Escanea 10 repos GitHub → adoptions
  investiga <topic>      Web search + page reader → docs/research/
  critica <file>         Auto-crítica Modo A + D + AGREE/DISAGREE
  expected-check <topic> Compara real vs expected P15 → MATCH/WORSE
  gaps-finder            Detecta desincronizaciones (15 checks, mandatorio)
```

---

## 4. Pipeline 5 Fases (Sequential Path)

```
  FASE 0          FASE 1          FASE 2          FASE 3          FASE 4          FASE 5
  Auditoría       Datos +         Contratos       UI + Widgets    Tests +         Validación
  Premisas        Dominio         API             4 Estados       Docs            Caliente
  + Memory        Tipado          OpenAPI         WCAG AA         Memoria         Smoke Test
      │               │               │               │               │               │
      ▼               ▼               ▼               ▼               ▼               ▼
  ┌───────┐      ┌───────┐      ┌───────┐      ┌───────┐      ┌───────┐      ┌───────┐
  │ anti-  │────►│ Prisma│────►│OpenAPI│────►│ 7-pos │────►│ Vitest│────►│ tsc   │
  │patterns│      │ Zod   │      │ Zod   │      │ EAV   │      │ Contr.│      │ lint  │
  │ worklog│      │ strict│      │ wrapper│      │ Tour  │      │ Docs  │      │ build │
  └───────┘      └───────┘      └───────┘      └───────┘      └───────┘      └───────┘
                                                                                  │
                                                                          ┌───────┴───────┐
                                                                          │               │
                                                                       PASS ◄───────── FAIL
                                                                          │               │
                                                                          │          ↺ corregir
                                                                          │          (max 3)
                                                                          ▼
                                                                     [Cierre Sesión]
```

---

## 5. Circuit Breaker State Machine (L2 Control Plane)

```
                    failure_rate ≥ 0.40
                    (N ≥ 10 muestras)
  ┌──────────┐  ─────────────────────────────►  ┌──────────┐
  │  CLOSED  │                                  │   OPEN   │
  │ (normal) │  ◄─────────────────────────────  │(bloqueado)│
  └──────────┘   canary OK tras T_reset         └─────┬────┘
       ▲                                             │
       │                                             │ tras T_reset_ms
       │                                             ▼
       │                                        ┌───────────┐
       └──────────  canary OK  ─────────────────│ HALF_OPEN │
                                          │     └───────────┘
                                          │ canary FAIL
                                          ▼
                                     ┌──────────┐
                                     │   OPEN   │
                                     │ (reset)  │
                                     └──────────┘
```

**Formula:** $R_{\text{fail}} = \frac{\sum \mathbb{I}(e_i \in \{5xx, 429, \text{Timeout}\})}{N}$

**Backoff:** $T_{\text{sleep}} = \min(T_{\max}, \text{random}(T_{\text{base}}, T_{\text{prev}} \times 3))$

---

## 6. PRE-v2.0 Governance (3 Roles)

```
  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
  │   EJECUTOR      │     │   OPTIMIZADOR    │     │  JUEZ DETERMINISTA  │
  │   (Code Agent)  │     │  (Rule Engineer) │     │   (packages/eval)   │
  │                 │     │                  │     │                     │
  │ Escribe código  │     │ Propone cambios  │     │ Software SIN LLM    │
  │ siguiendo       │     │ a AGENTS.md en   │     │ evalúa contra       │
  │ AGENTS.md       │     │ rama pre/propose │     │ benchmark histórico │
  │                 │     │                  │     │                     │
  │ ❌ NO toca      │     │ ❌ NO mergea     │     │ ✅ Decisión         │
  │    reglas       │     │                  │     │    matemática       │
  └─────────────────┘     └──────────────────┘     └─────────────────────┘
```

**Promotion condition:** $\Delta S \ge 5.0 \;\land\; \forall i, \Delta D_i \ge -2.0 \;\land\; (\sigma_c + \sigma_b) < |\Delta S|$

---

## 7. MCP Ecosystem (7 Servers + 8 Skills)

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    MCP SERVERS (7)                              │
  ├──────────────────┬──────────────────┬──────────────────┤        │
  │ filesystem       │ git-worktree     │ lsp-bridge       │        │
  │ (P1 Read-After)  │ (squads aislados)│ (polyglot 6 lang)│        │
  ├──────────────────┼──────────────────┼──────────────────┤        │
  │ postgres-insp.   │ browser-devtools │ sequential-think │        │
  │ (readonly, RLS)  │ (WCAG+7pos+PI)   │ (cognitive steps)│        │
  ├──────────────────┤                  │                  │        │
  │ memory           │                  │                  │        │
  │ (knowledge graph)│                  │                  │        │
  └──────────────────┴──────────────────┴──────────────────┘        │
  ┌─────────────────────────────────────────────────────────────────┐
  │                    MCP SKILLS (8)                               │
  ├──────────────┬──────────────┬──────────────┬──────────────┤     │
  │ schema-val.  │ circuit-brk. │ memory-sync  │ porter-force  │     │
  ├──────────────┼──────────────┼──────────────┼──────────────┤     │
  │ apple-theme  │ prompt-inj.  │ expected-spec│ reverse-eng.  │     │
  │ -linter      │ -scanner     │ -generator   │ -skill        │     │
  └──────────────┴──────────────┴──────────────┴──────────────┘     │
```

---

## 8. 4 Arquetipos Satélite (L2 Routing)

```
  ┌─────────────────┬──────────┬──────────────────┬────────────────────┬─────────────────┐
  │ Arquetipo       │ SLA      │ Primario         │ Fallback           │ Escalado        │
  ├─────────────────┼──────────┼──────────────────┼────────────────────┼─────────────────┤
  │ Vision-to-Spec  │ 8000ms   │ Gemini 2.5 Flash │ Qwen 2.5 VL 72B   │ Claude 4.5 Son. │
  │ Accounting-OCR  │ 4000ms   │ DeepSeek V3.2    │ GPT-4.1 mini      │ DeepSeek R2     │
  │ Commerce-Bot    │ 800ms    │ Llama 3.3 70B    │ Cerebras 3.1 8B   │ Mistral Small   │
  │ Fraud-Guard     │ 90ms     │ Micro-SLM vLLM   │ Reglas L1         │ Denegación      │
  └─────────────────┴──────────┴──────────────────┴────────────────────┴─────────────────┘
```

---

## 9. PSIM Measurement (W1–W8 + K1–K5)

```
  VICTORIAS (W1–W8)                          KPIs (K1–K5)
  ─────────────────                          ─────────────
  W1  Capability Strengthening               K1  P0/P1 Closure ≥ 90%
  W2  Carry-over Closure                     K2  Mock Reduction < 0
  W3  Mock Reduction                         K3  Finding Half-Life ≤ 2 iter
  W4  ADOPTED Promotion                      K4  Capability Count ≥ 1/iter
  W5  Anti-Pattern Retirement                K5  Gate Stability monótono ↑
  W6  Persona Satisfied
  W7  Gate Velocity
  W8  Finding Half-Life

  Current: 17 wins total (W1=15, W4=3, W6=6, W7=3)
```

---

## 10. File Structure (117 files)

```
agent-os-boilerplate/
├── AGENTS.md                    # Constitution (15 rules + 17 commands)
├── README.md                    # Main documentation (1200+ lines, diagram-rich)
├── docs/
│   ├── memory/                  # Append-only empirical memory (P9)
│   ├── reports/                 # Session reports (<epoch>-<title>.md)
│   ├── expected/                # P15 expected-first documents
│   ├── research/                # `investiga` research reports
│   ├── security/                # 3 security protocols
│   ├── patterns/                # Orchestration + ACI patterns
│   ├── mejorate-scans/          # `mejorate` scan reports
│   ├── reverse-engineering/     # Radiografía rayos X protocol
│   ├── personas/                # 10 personas (3 base + 3 joyride + 4 cold-run)
│   ├── widgets/                 # 2 canonical widget specs
│   ├── l2-control-plane/        # L2 schema + envelope + resilience math
│   ├── catalogs/                # 100+28 BP, 100 AP, 100+9 Killer Features
│   ├── governance/              # PRE-v2.0 + PSIM
│   ├── polyglot/                # 6-language adaptation matrix
│   ├── ide-integrations/        # 16 IDE auto-activation configs
│   ├── ci-workflows/            # 3 CI workflows (install via script)
│   └── technical/               # ← THIS DIRECTORY (MD + HTML docs)
├── mcp/
│   ├── servers/ (7)             # MCP server configs
│   └── skills/ (8)              # Modular skill specifications
├── packages/eval/               # Deterministic judge (PRE-v2.0)
├── scripts/ (17 + 1 util)       # Canonical command implementations
└── 16 IDE entrypoints           # .cursorrules, CLAUDE.md, GEMINI.md, etc.
```

---

## Cross-Reference

| Topic | Markdown | HTML (interactive) |
| :--- | :--- | :--- |
| Architecture | This file | [`html/index.html#architecture`](./html/index.html#architecture) |
| Commands | [`commands-reference.md`](./commands-reference.md) | [`html/index.html#commands`](./html/index.html#commands) |
| Rules | [`rules-reference.md`](./rules-reference.md) | (in `html/index.html#architecture`) |
| Workflows | [`workflows.md`](./workflows.md) | [`html/index.html#workflows`](./html/index.html#workflows) |
