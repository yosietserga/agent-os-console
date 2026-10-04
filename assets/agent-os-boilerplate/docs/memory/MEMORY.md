# MEMORY.md — Index of Empirical Memory Entries

> Inspirado en Claude Code (jujumilk3/leaked-system-prompts) y OpenHands
> `.agents/skills/` pattern.
>
> Una línea por entrada de memoria. No poner contenido aquí; solo hooks.
> El contenido vive en los archivos referenciados.

## Cómo usar este index

- Cada entrada de `docs/memory/anti-patterns.md` o `docs/memory/wins-ledger.md`
  se referencia aquí con un hook de una línea.
- La Fase 0 (AGENTS.md §8.1) carga este index automáticamente; el agente
  decide cuáles entradas leer completas según el contexto de la tarea.
- Tipos de memoria (adaptado de Claude Code):
  - `user` — quién es el operador (rol, expertise, preferencias)
  - `feedback` — correcciones confirmadas (con **Why:** y **How to apply:**)
  - `project` — work en curso, goals, constraints no derivables del código
  - `reference` — punteros a recursos externos (URLs, dashboards, tickets)

## Anti-Patterns (AP-001 .. AP-018)

- [AP-001 Falso Éxito por No-Op](anti-patterns.md#ap-001) — scripts regex que no coinciden silenciosamente
- [AP-002 Invocación Directa de APIs LLM](anti-patterns.md#ap-002) — sin Control Plane L2 (P8)
- [AP-003 Omisión de Tenant ID](anti-patterns.md#ap-003) — filtración cruzada
- [AP-004 Puertas Falsificadas](anti-patterns.md#ap-004) — PASS cableado (P2)
- [AP-005 Pruebas Aisladas sobre Stubs](anti-patterns.md#ap-005) — overfit-backend (P3)
- [AP-006 !important y Layout Monolítico](anti-patterns.md#ap-006) — degradación visual (P5, P6)
- [AP-007 Emojis y Placeholders Ficticios](anti-patterns.md#ap-007) — (P7)
- [AP-008 Reintentos Ciegos sin Backoff](anti-patterns.md#ap-008) — thundering herd
- [AP-009 Sobreajuste de Modelos Costosos](anti-patterns.md#ap-009) — tier mal asignado
- [AP-010 Auto-Aprobación Complaciente](anti-patterns.md#ap-010) — sin juez determinista
- [AP-011 Borrado de Lecciones](anti-patterns.md#ap-011) — sobrescribir memoria (P9)
- [AP-012 Falta de AbortController](anti-patterns.md#ap-012) — hilos colgados
- [AP-013 Entornos Dev/Deploy No Declarados](anti-patterns.md#ap-013) — bugs Windows↔Ubuntu (P10)
- [AP-014 Reportes Sin Convención de Nombrado](anti-patterns.md#ap-014) — sin orden cronológico
- [AP-015 Pantalla Huérfana de Onboarding](anti-patterns.md#ap-015) — sin Joyride (P11)
- [AP-016 Tour No Persistente](anti-patterns.md#ap-016) — repetición molesta
- [AP-017 Tour No Responsivo Ni Accesible](anti-patterns.md#ap-017) — falla WCAG
- [AP-018 Sobrescritura de AGENTS.md por Script](anti-patterns.md#ap-018) — bug ide.sh (P1 lo detectó)
- [AP-019 Auto-Mejora No Automatizada](anti-patterns.md#ap-019) — sin comando `mejorate`

## Wins (WIN-001 .. WIN-011)

- [WIN-001 Constitución AGENTS.md](wins-ledger.md#win-001) — W1 (Capability Strengthening)
- [WIN-002 Desacoplamiento L2 Control Plane](wins-ledger.md#win-002) — W1
- [WIN-003 Gobernanza PRE-v2.0](wins-ledger.md#win-003) — W4 (ADOPTED Promotion)
- [WIN-004 Memoria Append-Only](wins-ledger.md#win-004) — W1
- [WIN-005 Matriz Polyglot 6 Lenguajes](wins-ledger.md#win-005) — W1
- [WIN-006 Catálogos 1-100](wins-ledger.md#win-006) — W1
- [WIN-007 Matriz MCP 5+5](wins-ledger.md#win-007) — W1
- [WIN-008 CI/CD Gate Honesty](wins-ledger.md#win-008) — W7 (Gate Velocity)
- [WIN-009 Cobertura 100% Prompts Operativos](wins-ledger.md#win-009) — W1+W6
- [WIN-010 Joyride + Ecosistema Personas](wins-ledger.md#win-010) — W1+W6
- [WIN-011 Comando `ide` 16 IDEs](wins-ledger.md#win-011) — W1+W6+W7
- [WIN-012 Comando `mejorate` + 10 repos escaneados](wins-ledger.md#win-012) — W1+W4 (auto-mejora)

## User (preferencias del operador)

- **Operador:** Yosiet Serga (`yosietserga`), Venezuela. PHP/Symfony/Laravel/WordPress + React/ReactNative.
- **Stack split:** Desarrolla en Windows, despliega en Ubuntu VPS (P10).
- **Estilo:** Pragmático, sin sobre-explicar, enterprise-grade.
- **Fatiga cero:** erradicar repetición de directrices recurrentes es prioridad máxima.

## Feedback (correcciones confirmadas)

- **NO usar emojis en UI** — Why: rompe sobriedad Apple Light Mode. How: SVG icons only.
- **NO `!important` en CSS** — Why: secuestra cascada. How: variables CSS.
- **Reportes con epoch time** — Why: orden cronológico lexicográfico. How: `docs/reports/<epoch>-<title>.md`.
- **Joyrides automáticos** — Why: pantallas complejas sin onboarding fallan Apprentice. How: widget `OnboardingTour` canónico (P11).
- **Auto-mejora del sistema** — Why: si el sistema erradica fatiga, debe auto-mejorarse sin intervención. How: comando `mejorate` escanea repos de referencia.

## Project (work en curso)

- **Versión actual:** 1.4.0 (2026-10-02)
- **Stack:** Boilerplate agnóstico (no coding), contextualización agéntica.
- **Repos de referencia escaneados:** 10 (ver `docs/mejorate-scans/`)
- **Patentes pendientes de aplicar:** 13 (ver synthesis.md)

## Reference (recursos externos)

- [saas-monorepo-base-platform](https://github.com/yosietserga/saas-monorepo-base-platform) — repo privado del operador con .pre/constitution formal, 16 personas, cold-run attackers
- [living-topology-visualizer](https://github.com/yosietserga/living-topology-visualizer) — skills/coding-agent mini-framework
- [system-prompts-and-models-of-ai-tools](https://github.com/yosietserga/system-prompts-and-models-of-ai-tools) — prompts reales de 15+ IDEs
- [jujumilk3/leaked-system-prompts](https://github.com/jujumilk3/leaked-system-prompts) — prompts Claude 4.7, GPT-5, Cursor actuales
- [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) — reglas por stack
- [Aider-AI/aider](https://github.com/Aider-AI/aider) — Repo Map + Search/Replace
- [SWE-agent/SWE-agent](https://github.com/SWE-agent/SWE-agent) — ACI + navegación por líneas
- [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) — EventStream + subagentes
- [BerriAI/litellm](https://github.com/BerriAI/litellm) — proxy LLM con circuit breakers
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) — MCP servers oficiales
