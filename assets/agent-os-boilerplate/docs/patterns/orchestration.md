# Patrones de Orquestación Agéntica

> Adaptado de Anthropic Cookbook "Building Effective Agents" y síntesis de
> `mejorate.sh scan` (2026-10-02). 5 patrones canónicos para orquestar
> agentes LLM/SLM sin sobreingeniería.

---

## Principio rector

> *"Code is cheaper than tokens. The most reliable agentic systems use
> deterministic code for orchestration and reserve LLM calls for the
> genuinely probabilistic parts."* — Anthropic Cookbook

El boilerplate prefiere **bucles deterministas basados en código** sobre
frameworks agénticos monolíticos complejos. Los 5 patrones siguientes son
canónicos.

---

## Patrón 1 — Prompt Chaining (encadenamiento)

```
   input → [LLM 1: extraer] → [deterministic code: validar] → [LLM 2: traducir] → output
```

**Cuándo usarlo:** tarea descompone en sub-tareas secuenciales predecibles.
**Ejemplo:** "extraer entidades del documento → validar schema → traducir al
idioma destino".
**En el boilerplate:** Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5
del pipeline es un Prompt Chain determinista.

```typescript
// Patrón (ilustrativo, agnóstico al lenguaje)
const extracted = await llm.extract(document);
const validated = validateSchema(extracted);  // determinista
if (!validated.ok) throw new Error(validated.error);
const translated = await llm.translate(validated.data, targetLang);
return translated;
```

---

## Patrón 2 — Routing (dispatch por clasificación)

```
                    ┌──► [handler: vision] ──► output
   input → [LLM:   ├──► [handler: ocr]     ──► output
   clasificar] ────┼──► [handler: chat]    ──► output
                    └──► [handler: fraud]   ──► output
```

**Cuándo usarlo:** entrada tiene tipos distintos que requieren handling
separado. El LLM clasifica; el código dispatcha.
**En el boilerplate:** los 4 arquetipos satélite (Vision-to-Spec, Accounting-OCR,
Commerce-Bot, Fraud-Guard) son rutas L2 distintas. El comando `ide` detecta
verbo implícito (implementa→itera, audita→cold run) es routing.

```typescript
const category = await llm.classify(input);
const handler = ROUTES[category];
if (!handler) throw new Error(`No handler for ${category}`);
return handler(input);
```

---

## Patrón 3 — Parallelization (tareas concurrentes)

```
                       ┌──► [LLM: task A] ──┐
   input ──► fan-out ──┼──► [LLM: task B] ──┼──► aggregate ──► output
                       └──► [LLM: task C] ──┘
```

**Cuándo usarlo:** tarea se descompone en sub-tareas independientes que pueden
correr en paralelo.
**En el boilerplate:** Fase 0 lee 7 archivos en paralelo (AGENTS.md,
anti-patterns.md, worklog, state.json, 3 reportes). CI corre 6 gates de stack
en paralelo (ts, py, go, rust, php, cpp).

```typescript
const [a, b, c] = await Promise.all([
  llm.taskA(input),
  llm.taskB(input),
  llm.taskC(input),
]);
return aggregate(a, b, c);
```

---

## Patrón 4 — Orchestrator-Workers (planner distribuye)

```
                  ┌──► [worker: coder]   ──┐
   input → [LLM:  ├──► [worker: browser] ──┼──► [LLM: synthesizer] → output
   planner] ──────┤                        │
                  └──► [worker: qa]      ──┘
```

**Cuándo usarlo:** tarea requiere múltiples tipos de sub-agente con
especialización distinta. El planner decide qué workers invocar y cómo
sintetizar.
**En el boilerplate:** PRE-v2.0 es Orchestrator-Workers: el Optimizador
(planner) propone → el Juez Determinista (worker especializado en
evaluación) decide → el Ejecutor (worker de código) aplica.

```typescript
const plan = await orchestrator.plan(input);
const results = await Promise.all(
  plan.tasks.map(task => WORKERS[task.type](task))
);
return orchestrator.synthesize(results);
```

---

## Patrón 5 — Evaluator-Optimizer (loop de mejora)

```
   input → [LLM: generator] → output_draft → [evaluator] → score
                              ▲                                │
                              └──── feedback ──────────────────┘
                                   (si score < threshold)
```

**Cuándo usarlo:** existe un evaluador claro (juez sintético o determinista)
y la mejora iterativa añade valor.
**En el boilerplate:** PRE-v2.0 completo es Evaluator-Optimizer: el
Optimizador genera candidatos → el Juez evalúa (6 dimensiones D1-D6) →
si ΔS ≥ 5.0 sin regresiones, promote; si no, el Optimizador itera con feedback.

```typescript
let candidate = await generator(input);
let score = await evaluator(candidate);
while (score < THRESHOLD && attempts < MAX_ATTEMPTS) {
  const feedback = evaluator.explainWeaknesses(candidate);
  candidate = await generator.refine(candidate, feedback);
  score = await evaluator(candidate);
  attempts++;
}
return candidate;
```

---

## Anti-patrones de orquestación (a evitar)

| Anti-patrón | Síntoma | Solución |
| :--- | :--- | :--- |
| **Framework monolítico** | Un solo agente hace todo, contexto enorme, caro | Descomponer en uno de los 5 patrones |
| **LLM para lo que código hace mejor** | LLM decide rutas que un `if/else` resolvería | Routing determinista; LLM solo para clasificación ambigua |
| **Loop sin techo** | Itera indefinidamente esperando mejora | MAX_ATTEMPTS + escalar a humano (Regla de 3, BP #96) |
| **Evaluator subjetivo** | "Se ve bien" sin métrica | Juez determinista con D1-D6 (PRE-v2.0) |
| **Workers sin aislamiento** | Workers comparten estado, colisionan | Worktrees aislados (BP #17) o EventStream desacoplado |

---

## Mapa al boilerplate

| Patrón | Dónde vive en el boilerplate |
| :--- | :--- |
| Prompt Chaining | Pipeline 5 fases (AGENTS.md §2) |
| Routing | Comando `ide` (verbo implícito) + arquetipos L2 |
| Parallelization | Fase 0 lecturas + CI gates multi-stack |
| Orchestrator-Workers | PRE-v2.0 (3 roles) + squad en worktrees |
| Evaluator-Optimizer | PRE-v2.0 completo (Juez con ΔS ≥ 5.0) |

---

## Referencias

- Anthropic Cookbook "Building Effective Agents" (2024-12)
- `jujumilk3/leaked-system-prompts` (Claude 4.7 system prompt, 150KB)
- `OpenHands/OpenHands` (EventStream + subagentes Planner/Coder/Browser)
- `SWE-agent/SWE-agent` (ACI para navegación acotada)
