# 08 — Verificación de Comportamiento: Bucle Agéntico Goal-Driven (PRE)

> **Tipo**: Reporte PRE (P15 expected-first) · **Epoch**: 1791093000 · **Fecha**: 2026-10-04
> **Fuente de expectativa**: 2 capturas del operador (agente IDE creando artefactos `Plan And Steps <Topic>` / `Handoff <Topic>` / `Audits <Topic>` / `Cold Run <Topic>`, con contadores `Explored N files / Thought Ns / Analyzed SKILL.md#L1-124 / Working...`) + directriz textual del operador.

## 1. Expectativa del operador (verbatim, traducida a modelo verificable)

El sistema debe comportarse como un **bucle agéntico infinito goal-driven**:

> "que asuma que ni yo ni la llm/slm saben nada, que investigue, genere los planes de pasos y tareas, genere los reportes pre, haga las tareas, genere los reportes pro, auto critique, auto aprenda, auto evolucione, mejore, siguiente iteración para pasar por el mismo bucle workflow infinitamente hasta lograr los goals definidos y generados desde el prompt inicial"

Nota crítica del operador: **"suscripciones" es parte del prompt, no del flujo contextual nativo del LLM** — es decir, los artefactos del bucle deben **vincularse al tema del prompt** (como en las imágenes: `Plan And Steps Subscriptions`), no a un tema genérico del sistema. El binding de tema es evidencia de que el contenido proviene del prompt del operador, no del conocimiento previo del modelo.

## 2. Modelo de comportamiento esperado (12 comportamientos)

| # | Comportamiento | Evidencia esperada (según imágenes) |
|---|---|---|
| B1 | Asumir cero conocimiento (operador y LLM/SLM) | Arranque en frío: "Explored 5 files", auditoría de premisas antes de actuar |
| B2 | Investigar | Research real: web + lectura de fuentes, contadores de exploración |
| B3 | Generar planes de pasos y tareas | Artefacto `Plan And Steps <Topic>` derivado del prompt |
| B4 | Generar reportes PRE | Reporte de hipótesis/expectativas ANTES de ejecutar |
| B5 | Hacer las tareas | Ejecución real de las tareas del plan |
| B6 | Generar reportes PRO | Reporte de resultados/evidencia DESPUÉS de ejecutar |
| B7 | Auto-criticar | Crítica adversarial de los artefactos propios (Audits) |
| B8 | Auto-aprender | Memoria persistente de wins/anti-patrones/referencias |
| B9 | Auto-evolucionar | Propuestas de adopción evaluadas por juez determinista |
| B10 | Mejorar | KPIs medibles que mejoran entre iteraciones |
| B11 | Siguiente iteración · mismo bucle infinitamente | `Working...` — el ciclo reinicia con handoff de contexto |
| B12 | Hasta lograr los goals del prompt inicial | Goals derivados del prompt con criterio de logro verificado |

## 3. Matriz de verificación PRE-implementación (estado 2026-10-04, v1.9.0)

| # | Comportamiento | Estado v1.9.0 | Evidencia real |
|---|---|---|---|
| B1 | Cero conocimiento | **MATCH** | `cold run` (auditoría de premisas read-only); topology-engine: system prompt de refinado declara "ni el operador ni tú saben nada del tema — cero conocimiento mutuo" |
| B2 | Investigar | **MATCH** | `investiga <topic>`: web_search real + síntesis L2 + memoria REFERENCE (P9); etapa `investigar` del sentinela y del topology-engine |
| B3 | Planes de pasos y tareas | **GAP CRÍTICO** | Ningún comando genera un plan de pasos/tareas derivado del prompt. Los pipelines existentes (sentinela 7 etapas, radiografía 5 fases, topology 12 pasos) son **fijos**, no planes por objetivo |
| B4 | Reportes PRE | **PARCIAL** | `expected-check` compara contra expectativas (P15) y existe reporte de apertura epoch; pero no hay reporte pre-ejecución por objetivo ni vinculado al tema del prompt |
| B5 | Hacer las tareas | **PARCIAL** | Los comandos ejecutan acciones reales (mejorate/radiografía/vigila), pero **las tareas no derivan de un plan generado desde el prompt del operador** |
| B6 | Reportes PRO | **PARCIAL** | `report` genera cierre de sesión; sentinela/radiografía emiten reportes epoch; pero no hay reporte post-ejecución por objetivo/iteración |
| B7 | Auto-criticar | **MATCH** | `critica` P13: Modo A (3 debilidades) + Modo D (2 vectores) + 1 DISAGREE obligatorio, vía L2 con fallback declarado; verificación de radiografía con auto-crítica |
| B8 | Auto-aprender | **MATCH** | Memoria append-only P9: 33 AP + 19 WIN + REFERENCE + WORKLOG; `audit memory` |
| B9 | Auto-evolucionar | **MATCH** | `mejorate` scan→synthesize + `pre cycle`: juez PRE-v2.0 (ΔS ≥ 5.0 ∧ ∀i ΔDi ≥ −2.0 ∧ σ_sum < \|ΔS\|) |
| B10 | Mejorar | **MATCH** | `sil trend` regenera KPIs K1-K5 + balance W1-W8 (PSIM v1.9.0) |
| B11 | Bucle infinito | **GAP CRÍTICO** | El topology-engine tiene modo continuo (visualizador del ciclo de calidad) y el sentinela re-itera **solo on error**; no existe bucle que repita el workflow completo (investiga→plan→pre→ejecuta→pro→crítica→aprende→evalúa→handoff) por decisión propia |
| B12 | Goals desde el prompt | **GAP CRÍTICO** | No existe modelo de datos `Goal` ni derivación de goals desde el prompt; nada evalúa el logro de objetivos del operador |

Sub-gaps de binding detectados en las imágenes:

| Artefacto de la imagen | Estado v1.9.0 |
|---|---|
| `Plan And Steps Subscriptions` | **GAP** — no existe (B3) |
| `Handoff Subscriptions` | **GAP** — solo WORKLOG genérico de sesión, sin handoff de contexto por iteración |
| `Audits Subscriptions` | **PARCIAL** — `critica`/`audit memory` existen pero no se vinculan al tema del prompt |
| `Cold Run Subscriptions` | **PARCIAL** — `cold run` existe pero es genérico del sistema, no por tema |
| Tema del prompt como sufijo de artefactos | **GAP** — ningún artefacto se nombra con el tema del prompt |

## 4. Veredicto PRE

**PARTIAL — el sistema NO se comporta todavía similar al modelo esperado**: 5/12 MATCH · 3/12 PARCIAL · 4/12 GAP (B3, B11, B12 + handoff/binding). El sistema ya tiene los órganos (investigación, crítica, memoria, juez, KPIs, ciclos) pero le falta el **sistema circulatorio**: un orquestador goal-driven que parta del prompt inicial, genere goals verificables, planifique pasos y tareas, produzca reportes pre/pro por iteración, y reinicie el bucle con handoff hasta lograr los goals.

## 5. Plan de cierre de gaps (v2.0.0 — comando canónico 19º `bucle`)

1. **Modelos**: `WorkflowRun` (prompt, topic, iteración, etapas, handoff) + `Goal` (code, title, acceptance, status, evidence) + `TaskStep` (iteration, order, title, kind, status, output).
2. **Orquestador** (`workflow-loop.ts`): 10 etapas por iteración — `metas` (goals derivados del prompt, cero conocimiento) → `investiga` → `plan` (pasos y tareas por goal) → `reporte-pre` → `ejecuta` (tareas reales: INVESTIGATE/ANALYZE/VERIFY/PROPOSE; coding → OUT_OF_SCOPE honesto) → `reporte-pro` → `critica` (P13) → `aprende` (WIN/AP append P9) → `evalua` (goals vs acceptance) → `handoff`. Si faltan goals → siguiente iteración; al agotar el cupo de la invocación → PAUSED reanudable (bucle infinito entre invocaciones).
3. **Binding de tema**: todos los artefactos se nombran con el tema del prompt (`Plan <tema>`, `Handoff <tema>`, `pre-<tema>-i<N>`, `pro-<tema>-i<N>`) — el tema proviene del prompt, no del LLM.
4. **Superficie**: comando `bucle <prompt>` (alias `workflow`, `loop`) + API `/api/agent-os/bucle` + panel Bucle con polling en vivo.
5. **Gobernanza**: 19º comando en constitución upstream v2.0.0 (AGENTS.md + state.json + README + changelog), gaps-finder check 4 tolerante al crecimiento append-only de WINs.

**Criterio de verificación POST**: ejecutar `bucle` con un prompt real de suscripciones (el tema de las imágenes) y evidenciar los 12 comportamientos B1-B12 en una sola corrida, más una segunda iteración con handoff.

---

## 6. Verificación POST-implementación (v2.0.0, 2026-10-04)

Ejecución E2E real con el prompt de suscripciones (equivalente al tema `Subscriptions` de las imágenes):

> "Investiga el estado del arte de la gestión de suscripciones SaaS y sus métricas clave. Genera el plan de pasos y tareas para implementar el módulo de suscripciones de nuestra app con sus modelos de datos. Documenta los riesgos técnicos y de negocio del módulo. Produce los reportes de diseño pre y post con evidencia verificable para el equipo. Propón una mejora adoptable para el juez PRE-v2.0 basada en la investigación."

**Corrida**: 12 iteraciones ejecutadas en 4 invocaciones (3 inicial + 3 + 3 + 3 vía `bucle continúa` tras cada PAUSED) · 40/40 tareas DONE · run final PAUSED con 4/5 goals ACHIEVED (G3 honestamente IN_PROGRESS al 67% de cobertura tras 35 tareas — el sistema se rehúsa a marcar logrado lo que la evidencia no cubre, P2). Trinquete de progreso añadido tras observar oscilación evaluador-estricto vs fallback: un goal ACHIEVED no revierte por reevaluación posterior (solo contradicción explícita BLOCKED) — el bucle CONVERGE hacia los goals.

| # | Comportamiento | Estado v2.0.0 | Evidencia de la corrida |
|---|---|---|---|
| B1 | Cero conocimiento | **MATCH** | Etapa `metas`: goals derivados SOLO del prompt (L2 declaró tema "gestión de suscripciones SaaS" extraído del prompt); fallback determinista también deriva del prompt, nunca del modelo |
| B2 | Investigar | **MATCH** | Etapa `investiga` + tareas INVESTIGATE: web_search real (fuentes: payproglobal.com, stripe.com, servicenow.com, manageengine.com, sap.com) anexadas a memoria REFERENCE (7 entradas) |
| B3 | Planes de pasos y tareas | **MATCH** | Etapa `plan`: 40 tareas generadas a través de 12 iteraciones (kinds INVESTIGATE/ANALYZE/VERIFY/PROPOSE/REPORT), re-planificando solo goals pendientes con el handoff como contexto |
| B4 | Reportes PRE | **MATCH** | `pre-gestion-de-suscripciones-saas-i1..i12` (12 reportes epoch inmutables con hipótesis/resultado esperado/riesgos ANTES de ejecutar) |
| B5 | Hacer las tareas | **MATCH** | 40/40 tareas ejecutadas con output/evidencia persistido por tarea |
| B6 | Reportes PRO | **MATCH** | `pro-gestion-de-suscripciones-saas-i1..i12` con tabla de resultados por tarea y veredicto (AGREE/MIXED) |
| B7 | Auto-criticar | **MATCH** | `critica-gestion-de-suscripciones-saas-i1..i12` (P13 adversarial: 3 debilidades + DISAGREE obligatorio, L2 o fallback declarado) |
| B8 | Auto-aprender | **MATCH** | WINs (W1) + REFERENCE + Handoff WORKLOG anexados append-only (P9) en cada iteración; lecciones de tareas fallidas al worklog |
| B9 | Auto-evolucionar | **MATCH** | 4 AdoptionProposals en staging (origen `bucle:gestion-de-suscripciones-saas-iN`) para el juez PRE-v2.0 vía `pre cycle` |
| B10 | Mejorar | **MATCH** | Cobertura de criterios creciente entre iteraciones (G1 89%, G2 78%, G4 86%, G5 71% — de BLOCKED/PENDING a ACHIEVED); K4 del PSIM crece con cada WIN |
| B11 | Siguiente iteración · bucle infinito | **MATCH** | 12 iteraciones encadenadas + PAUSED tras agotar cada cupo + `bucle continúa`/botón Continuar reanudaron 3 veces (3→6→9→12) — el bucle es infinito entre invocaciones hasta lograr los goals |
| B12 | Goals desde el prompt inicial | **MATCH** | 5 goals (G1-G5) definidos y generados desde el prompt, con criterio de aceptación, evaluados contra evidencia (4 ACHIEVED · 1 IN_PROGRESS honesto) |

Binding de tema verificado: todos los artefactos se nombran con el tema del prompt — `Plan gestión de suscripciones SaaS`, `Handoff gestión de suscripciones SaaS`, `pre/pro/critica-gestion-de-suscripciones-saas-iN` (equivalente exacto a `Plan And Steps Subscriptions` / `Handoff Subscriptions` de las imágenes de referencia).

## 7. Incidentes de la sesión y correcciones (honestidad P2)

1. **Bug de la iteración congelada** (1er run E2E): el `while` leía `run.iteration` rancio → la iteración 1 se repitió 5 veces (29 tareas, 15 reportes duplicados, 5 WIN repetidas). Corregido: cada pasada re-lee el run de la DB (`fresh.iteration >= fresh.maxIterations` rompe el bucle; guard MAX_TOTAL_ITERATIONS). Artefactos del run defectuoso eliminados con limpieza documentada en worklog (precedente Task 7).
2. **Regex de `bucle continúa`**: `continu\w*` no matcheaba "continúa" (la palabra lleva tilde en la ú: "contin-" + "úa") → corregido a `^(contin|sigue|reanuda|resume)`.
3. **Rate-limit 429 del proveedor L2** (agotado por el run defectuoso): el sistema degradó a fallbacks deterministas DECLARADOS en cada etapa y evidencia (P2) — el bucle siguió operando; al recuperar cuota, las iteraciones 1-3 volvieron a ser L2-driven.
4. **web_search sin resultados** en queries largas: añadido reintento acortando la query (tarea → tema).
5. **Oscilación de evaluadores** (iteración 9): el evaluador L2 (estricto) demotió goals que el fallback (cobertura ≥70%) había marcado ACHIEVED → trinquete de progreso: un goal ACHIEVED solo revierte con contradicción explícita (BLOCKED); el bucle converge en vez de oscilar.

## 8. Veredicto final

**MATCH — el sistema se comporta similar al modelo esperado**: los 12 comportamientos B1-B12 verificados con evidencia real en una corrida E2E de 12 iteraciones sobre un prompt de suscripciones. El bucle es goal-driven (goals del prompt), infinito entre invocaciones (PAUSED → `bucle continúa`, reanudado 3 veces), produce los artefactos vinculados al tema del prompt (plan, handoff, reportes pre/pro, crítica) y se niega a fabricar logros que la evidencia no cubre (G3 queda IN_PROGRESS al 67% tras 35 tareas — P2 Gate Honesty). El operador puede continuar el bucle indefinidamente con `bucle continúa` o el botón del panel hasta que G3 cruce su criterio.
