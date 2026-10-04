# Gobernanza PRE-v2.0 — Perpetual Rule Evolution

> Protocolo de evolución perpetua de las reglas constitucionales del sistema
> agéntico. Diseñado para impedir que los LLMs relajen o degraden sus propias
> restricciones a lo largo del tiempo mediante separación estricta de roles y
> juez determinista sin IA.

---

## 1. El Problema: Auto-Aprobación Complaciente

Sin gobernanza, un agente LLM que escribe código tiende a:
- Proponer relajaciones de las reglas que le resultan incómodas.
- Aprobar sus propias propuestas (sesgo de auto-evaluación).
- Degradar la constitución en cada iteración ("rule drift").

**Antipatrón catalogado:** #65 "Auto-Aprobación Complaciente de Reglas".

---

## 2. Los 3 Roles de PRE-v2.0

```
┌─────────────────────────┐    ┌──────────────────────────┐    ┌───────────────────────────┐
│      EJECUTOR           │    │      OPTIMIZADOR         │    │   JUEZ DETERMINISTA       │
│      (Code Agent)       │    │    (Rule Engineer)       │    │     (packages/eval)       │
│                         │    │                          │    │                           │
│  Escribe código         │    │  Propone cambios a       │    │  Software compilado       │
│  siguiendo AGENTS.md.   │    │  AGENTS.md en rama       │    │  SIN LLM. Evalúa          │
│                         │    │  pre/propose/* con       │    │  propuestas contra        │
│  ❌ NO puede modificar  │    │  análisis de causa raíz. │    │  benchmark histórico.     │
│     archivos de reglas. │    │                          │    │                           │
│                         │    │  ❌ NO puede mergear.    │    │  ✅ Decisión matemática   │
│                         │    │                          │    │     inviolable.           │
└─────────────────────────┘    └──────────────────────────┘    └───────────────────────────┘
            │                                │                              │
            │                                 │                              │
            └─────────────►  PR a main  ◄─────┴──────────  merge autorizado  ┘
                              (solo si ΔS ≥ ε)
```

### 2.1 Rol 1: Ejecutor (Code Agent)

- **Permitido:** escribir código de aplicación siguiendo `AGENTS.md`.
- **Prohibido:** modificar `AGENTS.md`, `docs/governance/`, `docs/catalogs/` o
  cualquier archivo de reglas constitucionales.
- **Implementación:** branch protection en GitHub: solo el juez determinista
  (vía CI `pre-cycle.yml`) puede aprobar PRs a esos archivos.

### 2.2 Rol 2: Optimizador (Rule Engineer)

- **Permitido:** abrir PRs contra `AGENTS.md` desde ramas `pre/propose/*`.
- **Obligatorio:** cada PR debe incluir:
  1. **Análisis de causa raíz** del problema que motiva la propuesta.
  2. **Evidencia empírica** (métrica, incidente, benchmark) que la justifica.
  3. **Diff contra `docs/memory/anti-patterns.md`** (¿retira o añade un antipatrón?).
  4. **Diff contra `docs/memory/wins-ledger.md`** (¿qué victoria PSIM habilita?).
- **Prohibido:** mergear su propia propuesta.

### 2.3 Rol 3: Juez Determinista (`packages/eval`)

- **Permitido:** ejecutar el benchmark y emitir veredicto matemático.
- **Prohibido:** contener LLM. Es software determinista puro.
- **Implementación:** el workflow `.github/workflows/pre-cycle.yml` invoca el
  juez sobre cada PR a `AGENTS.md`. Solo si el veredicto es `PROMOTE` el PR
  puede ser mergeado.

---

## 3. Puntuación Constitucional

El juez determinista calcula una puntuación $S$ sobre 100 puntos:

$$S = 100 \times \sum_{i=1}^{6} (w_i \cdot D_i)$$

Donde $D_i \in [0, 1]$ es la puntuación normalizada de la dimensión $i$ y $w_i$
es su peso:

| Dim. | Nombre | Peso $w_i$ | Qué mide |
| :---: | :--- | :---: | :--- |
| $D_1$ | Compilación / Tipado | $0.20$ | ¿El código compila con cero errores? ¿Cero `any`? |
| $D_2$ | Fidelidad de Contratos | $0.15$ | ¿OpenAPI/Protobuf coincide con la implementación? |
| $D_3$ | Adherencia al Pipeline | $0.20$ | ¿Se siguieron las 5 fases del pipeline? |
| $D_4$ | Casos Ocultos | $0.20$ | Rendimiento sobre el 30% del benchmark ciego (no expuesto). |
| $D_5$ | Eficiencia de Tokens | $0.10$ | ¿Tokens usados vs. baseline para tarea equivalente? |
| $D_6$ | Arquitectura / Reglas Críticas | $0.15$ | ¿Respeta P1-P9 y la matriz polyglot? |

**Suma de pesos:** $0.20 + 0.15 + 0.20 + 0.20 + 0.10 + 0.15 = 1.00$ ✓

---

## 4. Condición de Promoción Inviolable

Una propuesta del Optimizador se promueve a `main` **solo si** se cumplen las
**tres** condiciones simultáneamente:

### 4.1 Mejora significativa

$$\Delta S = S_{\text{candidato}} - S_{\text{base}} \ge \epsilon \quad (\epsilon = 5.0)$$

La propuesta debe mejorar la puntuación total en al menos 5 puntos.

### 4.2 Sin regresiones severas

$$\forall i \in \{1..6\}, \quad \Delta D_i \ge -\delta \quad (\delta = 2.0)$$

Ninguna dimensión puede degradarse más de 2 puntos (en escala 0-100). Esto
impide "truco de Goodhart": subir el total colapsando una dimensión crítica.

### 4.3 Significancia estadística

$$(\sigma_{\text{candidato}} + \sigma_{\text{base}}) < |\Delta S|$$

La varianza combinada de las corridas (sobre el benchmark rotativo) debe ser
menor que la mejora observada. Esto impide promocionar una propuesta por una
corrida afortunada (Antipatrón #68).

---

## 5. Benchmark Rotativo Ciego Anti-Goodhart

El antipatrón #66 (Goodhart) ocurre cuando un sistema optimiza contra un
benchmark fijo hasta sobreajustarlo. PRE-v2.0 lo prevé:

### 5.1 Particionamiento

El benchmark total se divide en:
- **70% Expuesto:** conocido por el Optimizador; lo usa para iterar.
- **30% Ciego:** reservado; solo el Juez lo conoce; rota cada $N$ ciclos.

### 5.2 Rotación

Cada $N = 14$ días (configurable vía `PRE_BENCHMARK_ROTATION_DAYS`), el juez:
1. Genera nuevos casos sintéticos para el 30% ciego.
2. Mueve aleatoriamente el 10% del 70% expuesto al ciego (y viceversa).
3. Reevalúa todas las propuestas activas contra el nuevo benchmark.

### 5.3 Penalización por overfit

Si una propuesta aprobada pierde más de 5 puntos al ser reevaluada tras una
rotación, se marca `OVERFIT` y se abre automáticamente un PR de reversión.

---

## 6. Flujo de un PRE-cycle completo

```
1. Optimizador abre PR:  pre/propose/add-p10-streaming-first
   ├─ Diff a AGENTS.md
   ├─ Análisis de causa raíz
   └─ Evidencia empírica (WIN-014, K4 mejorado en +0.3)

2. CI dispara .github/workflows/pre-cycle.yml:
   a. Checkout base (main) y candidato (pre/propose/...)
   b. Ejecutar packages/eval sobre ambos con el benchmark actual
   c. Calcular S_base, S_candidato, σ_base, σ_candidato
   d. Verificar las 3 condiciones (ΔS ≥ 5.0, sin regresiones, significancia)
   e. Publicar veredicto como comment del PR:
      "VEREDICTO: PROMOTE  (ΔS=+7.3, max_regression=-0.8 en D5, σ=2.1 < 7.3)"
      o
      "VEREDICTO: REJECT  (ΔS=+2.1 < ε=5.0)"

3. Si PROMOTE: el branch protection permite el merge.
   Si REJECT:  el PR queda bloqueado; el Optimizador debe iterar.

4. Tras el merge: se anexa entrada a docs/memory/wins-ledger.md
   con clase W4 (ADOPTED Promotion).
```

---

## 7. Implementación de referencia (`packages/eval/`)

El juez determinista vive en `packages/eval/` y debe ser:
- **Compilable** (Rust recomendado por determinismo y velocidad; Go o TypeScript
  estricto son alternativas válidas).
- **Sin dependencias de LLM** (no importar `openai`, `@anthropic-ai/sdk`, etc.).
- **Reproducible** (mismo input → mismo output, sin aleatoriedad no controlada).

Ver `packages/eval/scoring-formula.md` para el desglose matemático completo y
`packages/eval/benchmark-blind/` para los casos sintéticos reservados.

---

## 8. Invariantes de seguridad

1. **Branch protection:** `AGENTS.md`, `docs/governance/`, `docs/catalogs/`,
   `docs/memory/anti-patterns.md` solo aceptan merges con veredicto `PROMOTE`
   del workflow `pre-cycle.yml`.
2. **Token del juez:** el CI usa `GITHUB_TOKEN` (no puede ser sobrescrito por el
   Optimizador).
3. **Audit log:** todo PRE-cycle (aprobado o rechazado) se anexa a
   `docs/memory/worklog.md` con timestamp, ΔS, y veredicto.
4. **Reversión obligatoria:** si una propuesta promovida causa una regresión
   detectada en producción, el juez abre automáticamente un PR de reversión.

---

## 9. Relación con PSIM

PRE-v2.0 es el **mecanismo**; PSIM es la **medición**. Toda promoción exitosa
genera una victoria W4 (ADOPTED Promotion) en el wins-ledger. Toda regresión
detectada genera una entrada en el anti-patterns ledger.

> Ver `docs/governance/PSIM.md` para el framework de medición positiva.
