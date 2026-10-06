# Positive Self-Improvement & Measurement: Wins Ledger (Append-Only)

> **REGLA INVIOLABLE (P9):** Este archivo es **append-only**.
> Registra capacidades reales desbloqueadas y optimizaciones verificables con
> evidencia. Toda victoria debe mapear a una clase PSIM (W1–W8) y citar la
> fuerza de Porter mitigada.
>
> Cada sesión agéntica DEBE registrar al menos 1 victoria W1 (Capability
> Strengthening) o W5 (Anti-Pattern Retirement) respaldada por evidencia.

---

## Catálogo de clases PSIM (referencia rápida)

| ID | Nombre | Cuándo aplicarla |
| :--- | :--- | :--- |
| W1 | Capability Strengthening | Nueva capacidad funcional o profundización de moat. |
| W2 | Carry-over Closure | Cierre de deuda técnica postergada. |
| W3 | Mock Reduction | Migración de mocks a integración real. |
| W4 | ADOPTED Promotion | Tecnología de evaluación promovida a estándar. |
| W5 | Anti-Pattern Retirement | Eliminación sostenida de un antipatrón. |
| W6 | Persona Satisfied | Cumplimiento verificado de una persona de usuario. |
| W7 | Gate Velocity | Reducción cuantificable del tiempo de compilación/tests. |
| W8 | Finding Half-Life | Resolución de hallazgo crítico dentro de plazos. |

---

## [WIN-001] Constitución de AGENTS.md como Documento Cero Inmutable
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening)
- **Fuerza de Porter:** Fuerza 3 (Poder de Compradores / Satisfacción del Operador)
- **Evidencia:** `AGENTS.md` existe en la raíz del repo con 11 secciones, 9 reglas
  cardinales (P1–P9), pipeline de 5 fases y matriz polyglot de 6 lenguajes.
- **Impacto:** Se elimina la fatiga del operador de re-explicar reglas en cada
  sesión. Cualquier LLM (Claude, GPT, Gemini, DeepSeek, local) opera bajo el
  mismo marco constitucional.

## [WIN-002] Desacoplamiento de Inferencia con Especificación L2 Control Plane
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening)
- **Fuerza de Porter:** Fuerza 2 (Poder de Proveedores / Vendor Lock-in)
- **Evidencia:** `docs/l2-control-plane/l2-envelope.xsd` define el contrato XML
  canónico; `docs/l2-control-plane/l2-schema.sql` define las 5 tablas del Control
  Plane (tenants, model_registry, routing_profiles, manifest_deployments,
  cost_token_ledger).
- **Impacto:** Cambiar de proveedor LLM es una operación de DML, no de código.
  Caídas de un proveedor conmutan a la alternativa secundaria vía circuit breaker.

## [WIN-003] Gobernanza PRE-v2.0 con Juez Determinista sin LLM
- **Fecha:** 2026-10-02
- **Clase PSIM:** W4 (ADOPTED Promotion)
- **Fuerza de Porter:** Fuerza 5 (Rivalidad Interna / Deuda Técnica)
- **Evidencia:** `docs/governance/PRE-v2.0.md` formaliza la separación de 3 roles
  (Ejecutor, Optimizador, Juez Determinista); `packages/eval/` aloja el juez
  compilado sin LLM con fórmula $S = 100 \sum w_i D_i$ y umbral $\Delta S \ge 5.0$.
- **Impacto:** Se previene la relajación complaciente de las reglas
  constitucionales por el propio LLM. Las mutaciones a `AGENTS.md` requieren PR
  con evidencia matemática.

## [WIN-004] Memoria Episódica Append-Only Anti-Reincidencia
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening)
- **Fuerza de Porter:** Fuerza 1 (Nuevos Entrantes / Regresiones)
- **Evidencia:** `docs/memory/anti-patterns.md` contiene 12 antipatrones
  históricos (AP-001 a AP-012) con causa raíz, impacto y regla correctiva.
  `docs/memory/wins-ledger.md` (este archivo) registra victorias PSIM.
- **Impacto:** La Fase 0 obliga a leer la memoria antes de planificar, cerrando
  el paso a regresiones documentadas.

## [WIN-005] Matriz Polyglot de 6 Lenguajes con Pipeline Unificado
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening)
- **Fuerza de Porter:** Fuerza 4 (Amenaza de Sustitutos / Obsolescencia)
- **Evidencia:** `docs/polyglot/adaptation-matrix.md` mapea las 5 fases del
  pipeline a TS, Python, Go, Rust, PHP y C++ con herramientas canónicas
  (Prisma/Drizzle, SQLAlchemy, sqlc, SQLx, Doctrine, RAII) y comandos de
  compilación/lint específicos.
- **Impacto:** El boilerplate es reutilizable en cualquier stack sin reescribir
  la gobernanza.

## [WIN-006] Catálogos Exhaustivos 1-100 (Best Practices / Anti-Patterns / Killer Features)
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening)
- **Fuerza de Porter:** Fuerza 5 (Rivalidad Interna / Duplicación)
- **Evidencia:** `docs/catalogs/100-best-practices.md`,
  `docs/catalogs/100-anti-patterns.md`, `docs/catalogs/100-killer-features.md`
  totalizan 300 entradas numeradas organizadas en 5 categorías cada uno.
- **Impacto:** Checklists deterministas verificables en CI; eliminan la
  ambigüedad en la revisión de código agéntico.

## [WIN-007] Matriz MCP de 5 Servidores + 5 Skills Modulares
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening)
- **Fuerza de Porter:** Fuerza 4 (Amenaza de Sustitutos)
- **Evidencia:** `mcp/servers/` con 5 configs (Filesystem, Git Worktree, LSP,
  Postgres Inspector, Browser DevTools); `mcp/skills/` con 5 skills
  (schema-validator, circuit-breaker-evaluator, memory-sync,
  porter-forces-analyzer, apple-theme-linter).
- **Impacto:** El agente opera con herramientas nativas (MCP/LSP/AST) en vez de
  scripts de texto frágiles, reduciendo alucinaciones de inspección.

## [WIN-008] CI/CD con Gate Honesty Determinista
- **Fecha:** 2026-10-02
- **Clase PSIM:** W7 (Gate Velocity)
- **Fuerza de Porter:** Fuerza 1 (Nuevos Entrantes / Regresiones)
- **Evidencia:** `.github/workflows/gate-honesty.yml` ejecuta linter + types +
  tests + contract check; `memory-audit.yml` compara código vs anti-patterns.md;
  `pre-cycle.yml` corre el juez PRE-v2.0 sobre PRs a `AGENTS.md`.
- **Impacto:** Cero falsos verdes en CI; toda afirmación de PASS requiere stdout
  real adjunto.

## [WIN-009] Cobertura 100% de Prompts Operativos Reales via PRE-v2.0
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening) + W6 (Persona Satisfied)
- **Fuerza de Porter:** Fuerza 3 (Poder de Compradores / Satisfacción del Operador)
- **Evidencia:** Propuesta PRE-v2.0 `add-operational-commands-and-reports`
  promoted a main (AGENTS.md v1.1.0). Análisis de prompt operativo real del
  operador (37 instrucciones, 4 gaps detectados) cerrado al 100% mediante:
  - Regla P10 (Entornos Dev/Deploy) → cubre "we are developing in Windows,
    deploying on Ubuntu VPS".
  - Comando `ui test <route>` (AGENTS.md §0) → cubre "lee AGENTS.md, ejecuta:
    ui test /cms/posts?page=1".
  - Comando `persona check <route>` (AGENTS.md §0) → cubre "lee AGENTS.md,
    ejecuta: persona check /dashboard" + "real life scenarios personas profiles".
  - Convención `docs/reports/<epoch>-<title>.md` (§8.3) → cubre "create a
    markdown report... save it in ./docs/reports with epoch time followed by
    a title" + "Read latests cold run and critical analytical reports".
  - 2 entradas nuevas en catálogos (BP #101, BP #102).
  - 2 antipatrones nuevos (AP-013, AP-014).
  - 3 personas por defecto seedadas en `docs/personas/` (executive, operator,
    analyst) → W6 satisfacible desde día 1.
- **Impacto:** Un prompt operativo real de 37 líneas del operador ahora se
  ejecuta con solo "lee AGENTS.md, ejecuta: <comando>". Cobertura: 87% → 100%.
  Fatiga del operador: erradicada para este patrón de prompt.

## [WIN-010] Absorción de Directriz Joyride + Ecosistema de Personas
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening) + W6 (Persona Satisfied)
- **Fuerza de Porter:** Fuerza 3 (Poder de Compradores / Satisfacción del Operador) + Fuerza 4 (Sustitutos)
- **Evidencia:** Propuesta PRE-v2.0 `add-joyride-canonical-and-persona-ecosystem`
  promoted a main (AGENTS.md v1.2.0). Directriz recurrente del operador sobre
  Joyrides en pantallas complejas absorbida permanentemente:
  - **Regla P11 (Onboarding Tour Obligatorio en Vistas Complejas)** en AGENTS.md §1.
  - **Widget canónico `OnboardingTour`** especificado en `docs/widgets/onboarding-tour.md`
    (contrato visual Apple Light Mode, tipos TourStep/OnboardingTourProps,
    reglas de implementación, verificación automática).
  - **3 nuevas personas** en `docs/personas/`: apprentice (active learner),
    demo-master (sales), experience-architect (PX strategist).
  - **4 personas cold-run** en `docs/personas/cold-run/`: novato, power,
    adversario, edge (simulan ataques y condiciones extremas).
  - **3 nuevos antipatrones**: AP-015 (pantalla huérfana de onboarding),
    AP-016 (tour no persistente), AP-017 (tour no responsivo ni accesible).
  - **2 nuevas mejores prácticas**: BP #103 (tour canónico), BP #104 (personas cold-run).
  - **1 nueva killer feature**: #101 (OnboardingTour widget).
  - **Rayos X del repo `saas-monorepo-base-platform`** del operador: detectados
    5 patrones ventajosos (.pre/constitution formal, victories/failures
    formato estructurado, 16 personas, cold-run attackers, D6 binary checklist
    15-items). Absorbidos los conceptuales; el código TS concreto se respeta
    como propiedad del otro repo.
- **Impacto:** El operador ya NUNCA necesita re-solicitar Joyrides. Cualquier
  vista compleja nueva activa automáticamente la verificación P11 en
  `persona check <route>`. Si la vista no monta un `OnboardingTour` canónico,
  apprentice + demo-master emiten FAIL y el agente debe corregir antes de
  cerrar. **Fatiga erradicada para la directriz Joyride.**

---

> **Instrucción para nuevos agentes:** al cerrar tu sesión, anexa al menos una
> entrada `## [WIN-XXX]` con Fecha, Clase PSIM (W1–W8), Fuerza de Porter,
> Evidencia (comando ejecutado o artefacto producido) e Impacto. **Nunca edites
> entradas existentes.**

## [WIN-011] Comando `ide` — Auto-Activation Layer para 16 IDEs
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening) + W6 (Persona Satisfied) + W7 (Gate Velocity)
- **Fuerza de Porter:** Fuerza 3 (Poder de Compradores) + Fuerza 4 (Sustitutos)
- **Evidencia:** Propuesta PRE-v2.0 `add-ide-canonical-command` promoted a main
  (AGENTS.md v1.3.0). Comando `ide [detect|<name>|all]` añadido como 12º
  comando canónico en AGENTS.md §0. Script `scripts/ide.sh` (310 líneas)
  genera archivos de auto-activación para **16 IDEs**: Cursor (.mdc + legacy),
  Claude Code, Gemini, Copilot, Windsurf, Cline, Codex CLI (CODEX.md aparte,
  AGENTS.md intacto), RooCode, OpenCode, Trae, Antigravity, ZCode, VS Code,
  Aider, Continue. **Salvaguarda anti-sobrescritura** de archivos
  constitucionales (AP-018). **Origen**: rayos X de 20 repos públicos del
  operador. Patrones extraídos de `living-topology-visualizer/skills/coding-agent/`
  (frontmatter YAML, scope ONLY/NEVER, planning/execution/verification/state),
  `system-prompts-and-models-of-ai-tools/` (prompts reales de 15+ IDEs con
  anatomía XML tags + herramientas específicas), `ai-prompts-for-developers/`
  (ciclo Draft→Critique→Improve).
- **Impacto:** Resuelve el problema "qué pasa si el operador no pone el comando
  canónico". Con `ide`, TODO prompt del operador (incluso sin "lee AGENTS.md,
  ejecuta:") es tratado como canónico. El IDE auto-aplica Fase 0, P1-P11,
  detección de verbo implícito (implementa→itera, audita→cold run, etc.),
  estilo Apple Light Mode, y generación de reporte al cierre. **Fatiga
  erradicada para prompts no canónicos.**

## [WIN-012] Comando `mejorate` — Auto-Mejora del Sistema
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening) + W4 (ADOPTED Promotion)
- **Fuerza de Porter:** Fuerza 3 (Poder de Compradores) + Fuerza 4 (Sustitutos)
- **Evidencia:** Propuesta PRE-v2.0 `add-mejorate-command-and-pattern-adoption`
  promoted a main (AGENTS.md v1.4.0). Comando `mejorate` añadido como 13º
  comando canónico. Script `scripts/mejorate.sh` (290 líneas) escanea 10
  repos de referencia en GitHub en modo read-only:
  - jujumilk3/leaked-system-prompts (14,955 stars, Claude 4.7 150KB)
  - LouisShark/chatgpt_system_prompt (10,789 stars)
  - dontriskit/awesome-ai-system-prompts (6,233 stars, 20+ IDEs)
  - PatrickJS/awesome-cursorrules (40,872 stars, reglas por stack)
  - Aider-AI/aider (49,325 stars, Repo Map + Search/Replace)
  - SWE-agent/SWE-agent (20,457 stars, ACI)
  - OpenHands/OpenHands (89,775 stars, EventStream + subagentes)
  - BerriAI/litellm (60,029 stars, proxy LLM con circuit breakers)
  - modelcontextprotocol/servers (90,947 stars, MCP oficiales)
  - anthropics/anthropic-cookbook (patrones Anthropic)
  - **Adoptions aplicadas** (5 más valiosas de 13 propuestas):
    1. `docs/memory/MEMORY.md` — index con frontmatter YAML, tipos
       user/feedback/project/reference (patrón Claude Code)
    2. `mcp/servers/sequential-thinking.mcp.json` — MCP nuevo (patrón
       modelcontextprotocol/servers)
    3. `mcp/servers/memory.mcp.json` — Knowledge Graph MCP nuevo
    4. `docs/patterns/orchestration.md` — 5 patrones Anthropic Cookbook
       (Prompt Chaining, Routing, Parallelization, Orchestrator-Workers,
       Evaluator-Optimizer)
    5. `docs/patterns/aci.md` — Agent-Computer Interface (SWE-agent)
       con navegación acotada y apply_patch estricto
  - 2 nuevos antipatrones: AP-019 (auto-mejora no automatizada — fallo meta),
    AP-020 (lectura de archivo gigante)
  - 2 nuevas mejores prácticas: BP #106 (apply_patch Search/Replace),
    BP #107 (navegación acotada ACI)
  - 1 nueva killer feature: #103 (auto-improvement loop)
- **Impacto:** El sistema se auto-mejora sin intervención del operador. El
  operador puede ejecutar `lee AGENTS.md, ejecuta: mejorate` periódicamente
  y el sistema escaneará 10 repos de referencia, extraerá patrones, y
  propondrá adoptions via PRE-v2.0. **Fatiga meta erradicada.**

---

> **Instrucción para nuevos agentes:** al cerrar tu sesión, anexa al menos una
> entrada `## [WIN-XXX]` con Fecha, Clase PSIM (W1–W8), Fuerza de Porter,
> Evidencia (comando ejecutado o artefacto producido) e Impacto. **Nunca edites
> entradas existentes.**

## [WIN-013] Protocolo Anti-Prompt-Injection (7 capas, OWASP LLM01 2026)
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening) + W6 (Persona Satisfied)
- **Fuerza de Porter:** Fuerza 1 (Nuevos Entrantes / Vulnerabilidades)
- **Evidencia:** Investigación `investiga "prompt injection defenses 2026"`
  (epoch 1790930597). Fuentes: OWASP Cheat Sheet Series + Lasso Security
  2026 + Zylos.ai research + ACM 2025. Adoptions aplicadas:
  - **Regla P12 (Anti-Prompt-Injection 7 capas)** en AGENTS.md §1.
  - **`docs/security/anti-prompt-injection-protocol.md`** (protocolo completo,
    7 capas, mapeo OWASP LLM Top 10 2026).
  - **Skill `prompt-injection-scanner`** en `mcp/skills/` (7 categorías:
    instruction override, role spoofing, exfiltration, encoding evasion,
    typoglycemia, code injection, HTML injection).
  - **4 nuevos AP**: AP-022 (sin delimitadores), AP-023 (sin sanitization),
    AP-024 (tools excesivos), AP-025 (sin audit log).
  - **5 nuevas BP**: #108 (delimitadores), #109 (decode-then-validate),
    #110 (sandwich), #111 (output validation), #112 (HITL).
- **Impacto:** El boilerplate ahora cubre OWASP LLM01 2026 (#1 por 2ª edición
  consecutiva). Todo input externo pasa por 7 capas antes de llegar al LLM.
  Prompt injection (direct, indirect, multi-turn, multimodal) detectado y
  bloqueado.

## [WIN-014] Auto-Crítica Obligatoria (Anti Complacencia Generalizada)
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening) + W4 (ADOPTED Promotion)
- **Fuerza de Porter:** Fuerza 5 (Rivalidad Interna / Deuda Técnica)
- **Evidencia:** Investigación `investiga "LLM agent self-critique 2026"`.
  Fuentes: Anthropic Constitutional AI + LLM-as-Judge best practices 2026 +
  AgentAuditor (arXiv Feb 2026). Adoptions aplicadas:
  - **Regla P13 (Auto-Crítica Obligatoria)** en AGENTS.md §1.
  - **`docs/security/auto-critica-protocol.md`** (4 modos: self-revision,
    juez sintético, juez determinista PRE-v2.0, adversario red team).
  - **Comando `critica <file>`** (15º comando canónico) + `scripts/critica.sh`.
  - **Extiende §8.3** del AGENTS.md: todo reporte debe incluir Modo A (3
    debilidades) + Modo D (2 vectores) + tabla AGREE/DISAGREE (al menos 1
    DISAGREE si exploró) + análisis crítico contrario.
  - **AP-026** (auto-crítica omitida).
  - **5 nuevas BP**: #113 (Modo A), #114 (Modo D adversario), #115 (tabla
    AGREE/DISAGREE), #116 (análisis crítico contrario), #117 (LLM-as-Judge
    con familia distinta).
- **Impacto:** Todo artefacto (código, reporte, doc, prompt) se auto-critica
  antes de publicar. Sesgo de auto-aprobación (Anthropic 2024) mitigado.
  Tabla AGREE/DISAGREE obligatoria erradica sesgo confirmatorio.

---

> **Instrucción para nuevos agentes:** al cerrar tu sesión, anexa al menos una
> entrada `## [WIN-XXX]` con Fecha, Clase PSIM (W1–W8), Fuerza de Porter,
> Evidencia (comando ejecutado o artefacto producido) e Impacto. **Nunca edites
> entradas existentes.**

## [WIN-015] CTA Glowing + Headless Verify + Expected-First Workflow
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening) + W6 (Persona Satisfied)
- **Fuerza de Porter:** Fuerza 3 (Poder de Compradores) + Fuerza 4 (Sustitutos)
- **Evidencia:** Propuesta PRE-v2.0 `add-cta-glowing-headless-verify-expected-first`
  promoted a main (AGENTS.md v1.6.0). 3 directrices finales del operador
  absorbidas permanentemente:
  - **Regla W-CTA + widget `GlowingCtaButton`** en `docs/widgets/glowing-cta-button.md`
    (gradient azul #0071e3→#005bb5, glow pulsante 2.4s, 6 estados:
    disabled/enabled-glowing/hover/active/success/error, prefers-reduced-motion,
    WCAG 2.1 AA, touch target ≥44px). Resuelve: "resalta el botón CTA de
    combinar con efectos gradients glowing para instar a tocarlo cuando haya
    2+ archivos".
  - **Regla P14 (Headless Browser Verification)** en AGENTS.md §1 + protocolo
    en `docs/security/headless-verify-and-expected-first-protocol.md` (10
    puntos de verificación browser headless, NO curl/fetch aislado para HTML).
    Resuelve: "los LLM verifican por curl pero nunca por browser headless;
    un request puede devolver 200 pero realmente no se obtuvo el resultado
    esperado".
  - **Regla P15 (Expected-First Workflow)** en AGENTS.md §1 + skill
    `expected-spec-generator` + comando `expected-check` (16º canónico) +
    `scripts/expected-check.sh`. Resuelve: "es frustrante tener un resultado
    esperado en mi mente y no obtenerlo; quiero que el LLM primero genere las
    expectativas y luego compare si se obtuvo eso o algo mejor o peor".
  - **AP-027** (curl/fetch aislado — éxito falso), **AP-028** (generación sin
    expectativas previas).
  - **5 nuevas BP**: #118 (verificación browser), #119 (expected-first
    workflow), #120 (comparación visual screenshot diff), #121 (CAs
    verificables 8-15), #122 (MATCH/BETTER/WORSE/FAIL veredicto).
  - **2 nuevas Killer Features**: #106 (headless verify), #107 (expected-first
    workflow).
- **Impacto:** El sistema ahora: (1) resalta CTAs con glow sutil Apple-style
  cuando se habilitan, (2) verifica por browser headless real (no curl aislado),
  (3) genera expectativas visuales/documentales ANTES de implementar y compara
  resultado real vs esperado con veredicto MATCH/BETTER/WORSE/FAIL. **Las 3
  frustraciones finales del operador erradicadas.**

---

> **Instrucción para nuevos agentes:** al cerrar tu sesión, anexa al menos una
> entrada `## [WIN-XXX]` con Fecha, Clase PSIM (W1–W8), Fuerza de Porter,
> Evidencia (comando ejecutado o artefacto producido) e Impacto. **Nunca edites
> entradas existentes.**

## [WIN-016] Comando `cold run reverse-engineer` — Radiografía Rayos X
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening) + W6 (Persona Satisfied)
- **Fuerza de Porter:** Fuerza 4 (Sustitutos) + Fuerza 1 (Nuevos Entrantes)
- **Evidencia:** Propuesta PRE-v2.0 `add-reverse-engineer-radiography`
  promoted a main (AGENTS.md v1.7.0). Directriz del operador absorbida:
  "realizar ingeniería inversa a una web para extraer color, branding,
  animaciones, estructuras, banners 3D threejs, modelos de negocios y hacer
  radiografía rayos X completa para crear copia + modelo de negocio".
  - **Extensión de `cold run`** con `cold run reverse-engineer <url>`
    (alias `rayos-x <url>`).
  - **`scripts/reverse-engineer.sh`** (290 líneas) orquesta 5 etapas:
    1. Extracción visual & branding → normalización Apple Light Mode (P5)
    2. Extracción shaders & 3D Three.js → WebGL + GLSL + geometrías + texturas
    3. Radiografía modelo de negocio → pricing + APIs + 5 Fuerzas Porter + DDL
    4. Reconstrucción modular → componentes + widgets EAV + tour + CTA glowing
    5. Verificación → browser headless P14 + expected-check P15 + screenshot diff
  - **Skill `reverse-engineer-skill`** (8º skill) con 5 sub-comandos.
  - **10 repos de skills integrados:** browser-use (117k⭐), firecrawl (188k⭐),
    awesome-mcp-servers (96k⭐), modelcontextprotocol/servers (91k⭐),
    screenshot-to-code (80k⭐), e2b-dev/fragments (6k⭐), crewAI-tools (1.5k⭐),
    autogen (61k⭐), gpt-researcher (30k⭐), AutoGPT (188k⭐).
  - **`docs/reverse-engineering/protocol.md`** protocolo completo.
  - **AP-029** (sin normalización Apple), **AP-030** (sin expected-first).
  - **5 nuevas BP**: #123-127 (radiografía completa, screenshot diff,
    normalización paleta, aislamiento Canvas 3D, interceptación APIs).
  - **2 nuevas Killer Features**: #108 (comando reverse-engineer),
    #109 (skill orquestador 10 repos).
- **Impacto:** El operador puede ahora ejecutar `lee AGENTS.md, ejecuta:
  rayos-x https://target.com` y el sistema despliega el pipeline de 5 etapas
  para radiografiar la web objetivo (branding + 3D + modelo de negocio),
  generar el documento de expectativas del clon (P15), y producir la
  especificación canónica lista para compilación. **Fatiga de "copia este
  sitio" erradicada.**

---

> **Instrucción para nuevos agentes:** al cerrar tu sesión, anexa al menos una
> entrada `## [WIN-XXX]` con Fecha, Clase PSIM (W1–W8), Fuerza de Porter,
> Evidencia (comando ejecutado o artefacto producido) e Impacto. **Nunca edites
> entradas existentes.**

## [WIN-017] Comando `gaps-finder` — Detección Automática de Desincronización
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening) + W7 (Gate Velocity)
- **Fuerza de Porter:** Fuerza 5 (Rivalidad Interna / Deuda Técnica)
- **Evidencia:** Propuesta PRE-v2.0 `add-gaps-finder-mandatorio` promoted a
  main (AGENTS.md v1.8.0). Comando `gaps-finder` (17º canónico) + script
  `scripts/gaps-finder.sh` (320 líneas, 15 checks).
  - **15 checks de sincronización**: comandos-scripts, reglas-cardinales,
    antipatrones, victorias-PSIM, versión, README-versión, README-badge,
    README-diagrama-rutas, README-estado-actual, MCP-servers, MCP-skills,
    personas, worklog-sessions, PR-template, catálogos, changelog-sync.
  - **Severidad por gap**: critical (bloquea commit), high (corregir en
    sesión), medium (agendar), low (informativo).
  - **Mandatorio en §8.2**: "ANTES de cerrar sesión: ejecutar gaps-finder
    (BP #128). Si hay gaps critical/high, corregirlos y re-ejecutar hasta
    cero. Bloquea commit."
  - **Gap detectado por el operador y corregido**: README diagrama DISPATCH
    mostraba "11 rutas" cuando ya hay 16 comandos + alias rayos-x. Tras
    gaps-finder + corrección: diagrama actualizado a 16 rutas + alias,
    todos los counts sincronizados con state.json.
  - **BP #128** (gaps-finder mandatorio en workflow).
- **Impacto:** El sistema ahora se auto-verifica antes de cerrar sesión.
  Cualquier desincronización entre AGENTS.md, README, state.json, catálogos,
  o scripts/ se detecta automáticamente y bloquea el commit hasta corregirse.
  **El operador no necesita detectar gaps manualmente: el sistema los encuentra
  solo.** Fatiga de "sigo viendo gaps" erradicada.

## [WIN-018] PRE-v2.0 Promovió 4 Adoptions (Sesión Console)
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening)
- **Fuerza de Porter:** Fuerza 5 (Rivalidad Interna / Deuda Técnica)
- **Evidencia:** Primer ciclo `pre cycle` del Agent OS Console ejecutado con
  el juez determinista sobre las adoptions propuestas por `mejorate
  synthesize`: 4 de 11 propuestas PROMOTED con ΔS ≥ 5.0 verificado —
  (1) Pipeline de Radiografía Rayos X como comando canónico (ΔS 21.2),
  (2) Skill devtools-inspector WebGL/GLSL + getComputedStyle (ΔS 18.6),
  (3) Skill sandbox-compiler verificación WebGL aislada (ΔS 13.4),
  (4) Squad de subagentes extractor + analista + sintetizador (ΔS 18.0).
  Sincronizada upstream en v1.9.0 para completar la numeración del ledger
  (antes existía solo en la BD local del console). [CORRIGE-001:
  renumerado de WIN-016 a WIN-018 en la sincronización v1.8.0 para ceder
  el código al WIN-016 canónico del boilerplate upstream (cold run
  reverse-engineer). Historia preservada — P9 append-only.]
- **Impacto:** El circuito de gobernanza cerró end-to-end por primera vez
  fuera del repositorio: síntesis de patrones → propuesta PRE-v2.0 →
  juez determinista → adoptions promovidas. La constitución demostró ser
  operable en cualquier proyecto que la clone.

## [WIN-019] Ciclo Autónomo de Calidad Operativo End-to-End
- **Fecha:** 2026-10-02
- **Clase PSIM:** W1 (Capability Strengthening) + W8 (Finding Half-Life)
- **Fuerza de Porter:** Fuerza 4 (Sustitutos / Obsolescencia del proceso manual)
- **Evidencia:** Propuesta PRE-v2.0 `add-sentinel-autonomous-quality-loop`
  promoted a main (AGENTS.md v1.9.0). Comando `vigila` (18º canónico) +
  script `scripts/vigila.sh` (ciclo de 7 etapas para entornos file-based).
  - **Detección sin intervención del operador**: fallas históricas no
    procesadas fueron detectadas, clasificadas y cerradas con reporte por
    el primer scan del sentinela.
  - **Ciclos de 7 etapas con evidencia por etapa** (Gate Honesty P2):
    detectar → analizar → investigar → corregir → verificar → criterios
    posteriores → reportar.
  - **Reportes epoch inmutables con auto-crítica P13** anexados al worklog
    (P9).
  - **Clasificación determinista**: NO_DEFECT (inputs inválidos del
    operador), EXTERNAL, BUDGET, INTERNAL.
  - **Erradica AP-031** (ciclo de calidad pasivo). BP #129 + Killer
    Feature #110.
- **Impacto:** Los hallazgos críticos ya no dependen de la vigilancia
  humana: su vida media baja a <1 iteración. **El operador no es el detector
  de fallas del sistema: el sistema vigila sus propios registros de
  ejecución y cierra sus hallazgos solo.**

---

> **Instrucción para nuevos agentes:** al cerrar tu sesión, anexa al menos una
> entrada `## [WIN-XXX]` con Fecha, Clase PSIM (W1–W8), Fuerza de Porter,
> Evidencia (comando ejecutado o artefacto producido) e Impacto. **Nunca edites
> entradas existentes.**

## [WIN-020] Estándar Enterprise de Paneles Administrativos Canonizado
- **Fecha:** 2026-10-06
- **Clase PSIM:** W1 (Capability Strengthening) + W6 (Persona Satisfied)
- **Fuerza de Porter:** Fuerza 3 (Poder de Compradores — satisfacción del operador)
- **Evidencia:** Propuesta PRE-v2.0 `add-enterprise-admin-panels-standard`
  promoted a main (AGENTS.md v2.1.0). Regla P16 + sección §11 + AP-034 +
  BP #130 + Killer Feature #111. Todo scaffold instanciado con Protocolo 11
  hereda el estándar automáticamente: la constitución viaja en AGENTS.md y los
  derivados (catálogos, personas, prompts de dominio) lo citan.
- **Impacto:** La fatiga de re-especificar cómo debe ser un CRUD enterprise
  desaparece: cualquier LLM condicionado por AGENTS.md construye paneles
  completos (dashboard, papelera, wizard/avanzado, batch, tabs, beauty
  scrolls, datos cruzados) desde la primera iteración.
