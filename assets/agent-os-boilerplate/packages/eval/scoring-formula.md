# Fórmula de Puntuación Constitucional — packages/eval

> Desglose matemático completo de la puntuación $S$ y las 6 dimensiones $D_i$
> usadas por el juez determinista PRE-v2.0.
>
> Este documento es la especificación formal; la implementación en
> `packages/eval/src/` DEBE coincidir exactamente.

---

## 1. Puntuación total

$$S = 100 \times \sum_{i=1}^{6} (w_i \cdot D_i)$$

Donde:
- $D_i \in [0, 1]$ es la puntuación normalizada de la dimensión $i$.
- $w_i$ es el peso de la dimensión $i$.
- $\sum_{i=1}^{6} w_i = 1.00$.

| $i$ | Dimensión | Peso $w_i$ |
| :---: | :--- | :---: |
| 1 | Compilación / Tipado | 0.20 |
| 2 | Fidelidad de Contratos | 0.15 |
| 3 | Adherencia al Pipeline | 0.20 |
| 4 | Casos Ocultos | 0.20 |
| 5 | Eficiencia de Tokens | 0.10 |
| 6 | Arquitectura / Reglas Críticas | 0.15 |

**Rango de $S$:** $[0, 100]$.

---

## 2. Dimensión $D_1$: Compilación / Tipado (peso 0.20)

Mide si el código compila sin errores y respeta el tipado estricto.

$$D_1 = 0.5 \cdot \mathbb{I}(\text{compila sin errores}) + 0.3 \cdot \mathbb{I}(\text{cero warnings}) + 0.2 \cdot \left(1 - \frac{\text{count}(\texttt{any})}{\max(1, \text{total tipos})}\right)$$

**Implementación:**
- TS: `tsc --noEmit` exit 0 + `eslint --max-warnings 0` + grep `: any` count.
- Python: `mypy --strict .` exit 0 + `ruff check .` exit 0.
- Go: `go build ./...` exit 0 + `golangci-lint run` exit 0.
- Rust: `cargo build` exit 0 + `cargo clippy -- -D warnings` exit 0.
- PHP: `phpstan analyse --level=max` exit 0.
- C++: `cmake --build build` exit 0 + `clang-tidy` sin warnings.

---

## 3. Dimensión $D_2$: Fidelidad de Contratos (peso 0.15)

Mide si los endpoints implementados coinciden con el contrato declarado
(OpenAPI / Protobuf).

$$D_2 = \frac{\text{endpoints que coinciden con contrato}}{\text{endpoints totales}}$$

**Implementación:**
- Generar tipos desde OpenAPI (`@asteasolutions/zod-to-openapi` reverse).
- Para cada endpoint, hacer una petición de smoke test y validar la respuesta
  contra el schema Zod derivado del contrato.
- $D_2$ = endpoints validados / total.

---

## 4. Dimensión $D_3$: Adherencia al Pipeline (peso 0.20)

Mide si el cambio respetó el orden de las 5 fases del pipeline (AGENTS.md §2).

$$D_3 = \frac{\text{fases completadas en orden}}{5}$$

**Heurística determinista:**
- Fase 1 presente: hay migración / schema en el diff.
- Fase 2 presente: hay cambio en controlador + contrato OpenAPI sincronizado.
- Fase 3 presente: hay cambio en componente UI con estados (loading/empty/error/success).
- Fase 4 presente: hay tests nuevos + entrada en memoria.
- Fase 5 presente: el CI pasó (gate-honesty.yml verde).

Si el diff salta de fase 1 a fase 3 sin fase 2 → $D_3$ penaliza.

---

## 5. Dimensión $D_4$: Casos Ocultos (peso 0.20)

Mide el rendimiento sobre el **30% ciego** del benchmark (no expuesto al
Optimizador). Es la dimensión anti-Goodhart.

$$D_4 = \frac{\text{casos ocultos aprobados}}{\text{casos ocultos totales}}$$

**Implementación:**
- El benchmark ciego (`benchmark-blind/current/*.case.json`) contiene casos
  sintéticos que simulan tareas reales del sistema.
- El juez aplica el diff del candidato a un repo de prueba y ejecuta los casos.
- $D_4$ = casos ocultos aprobados / total.

**Rotación:** cada 14 días, el 10% del 70% expuesto se mueve al 30% ciego (y
viceversa). Previene overfit al benchmark visible.

---

## 6. Dimensión $D_5$: Eficiencia de Tokens (peso 0.10)

Mide si el cambio mejora o degrada la eficiencia de tokens LLM para tareas
equivalentes.

$$D_5 = \min\left(1, \frac{\text{tokens base}}{\max(1, \text{tokens candidato})}\right)$$

- $D_5 = 1$ si el candidato usa $\le$ tokens que la base.
- $D_5 < 1$ si el candidato usa más tokens (más caro, más lento).
- Solo aplica a cambios que afectan prompts/manifiestos agénticos. Para otros
  cambios, $D_5 = 1$ (neutro).

**Fuente:** `l2_cost_token_ledger`, comparando promedio de tokens por request
en una ventana de 7 días antes y después del cambio.

---

## 7. Dimensión $D_6$: Arquitectura / Reglas Críticas (peso 0.15)

Mide adherencia a las 9 reglas cardinales P1-P9 y a la matriz polyglot.

$$D_6 = \frac{\text{reglas P1-P9 satisfechas}}{9}$$

**Implementación:** por cada regla, un check determinista:

| Regla | Check |
| :--- | :--- |
| P1 | El diff incluye relectura post-edición (en worklog) |
| P2 | El CI reporta exit code + stdout real (no `PASS` cableado) |
| P3 | Si cierra un hallazgo, el archivo de producción también cambió |
| P4 | Diff incluye código + contrato + docs + memoria en el mismo commit |
| P5 | `apple-theme-linter` passes |
| P6 | Cambios UI respetan las 7 posiciones canónicas |
| P7 | `apple-theme-linter` no detecta placeholders ni emojis |
| P8 | No hay imports de SDKs LLM en código de negocio |
| P9 | No se sobrescriben entradas existentes en `docs/memory/` |

---

## 8. Condición de promoción (recordatorio)

$$\Delta S = S_{\text{candidato}} - S_{\text{base}} \ge \epsilon = 5.0$$

$$\forall i \in \{1..6\}: \Delta D_i \ge -\delta = -2.0 \text{ (en escala 0-100)}$$

$$(\sigma_{\text{candidato}} + \sigma_{\text{base}}) < |\Delta S|$$

Las tres deben cumplirse simultáneamente para `PROMOTE`.

---

## 9. Worked example

Supongamos un PR que añade la Regla P10 (Streaming-First):

| Dim | Base | Candidato | $\Delta$ | Peso | Aporte a $\Delta S$ |
| :---: | :---: | :---: | :---: | :---: | :---: |
| $D_1$ | 0.95 | 0.95 | 0.00 | 0.20 | 0.0 |
| $D_2$ | 0.92 | 0.92 | 0.00 | 0.15 | 0.0 |
| $D_3$ | 0.88 | 0.92 | +0.04 | 0.20 | +0.8 |
| $D_4$ | 0.81 | 0.88 | +0.07 | 0.20 | +1.4 |
| $D_5$ | 1.00 | 1.00 | 0.00 | 0.10 | 0.0 |
| $D_6$ | 0.89 | 0.94 | +0.05 | 0.15 | +0.75 |

- $S_{\text{base}} = 100 \times (0.95 \times 0.20 + 0.92 \times 0.15 + 0.88 \times 0.20 + 0.81 \times 0.20 + 1.00 \times 0.10 + 0.89 \times 0.15) = 100 \times 0.9015 = 90.15$
- $S_{\text{candidato}} = 100 \times (0.95 \times 0.20 + 0.92 \times 0.15 + 0.92 \times 0.20 + 0.88 \times 0.20 + 1.00 \times 0.10 + 0.94 \times 0.15) = 100 \times 0.9315 = 93.15$
- $\Delta S = 93.15 - 90.15 = 3.0$
- **Veredicto:** REJECT ($\Delta S = 3.0 < \epsilon = 5.0$).

El Optimizador debe iterar (ej. añadir más casos al benchmark que beneficien
streaming) hasta lograr $\Delta S \ge 5.0$.
