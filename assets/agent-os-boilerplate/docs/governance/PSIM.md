# PSIM — Positive Self-Improvement & Measurement

> Framework de medición simétrica positiva del desempeño del agente.
> No solo registra fallos (eso lo hace `anti-patterns.md`): cuantifica las
> **capacidades adquiridas** y la **trayectoria de mejora** del sistema.

---

## 1. Filosofía: Por qué medir lo positivo

La mayoría de sistemas de gobernanza solo registran fallos. Esto genera un
sesgo de "reporte de defectos" (Antipatrón #74) que:
- Desmotiva al operador y al agente.
- Oculta capacidades reales desbloqueadas.
- Impide demostrar progreso a stakeholders.

PSIM establece que **toda sesión agéntica debe producir al menos una victoria
verificable** y registrarse en `docs/memory/wins-ledger.md` con evidencia.

---

## 2. Las 8 Clases de Victoria (W1-W8)

| ID | Nombre | Cuándo aplicarla | Fuerza de Porter típica |
| :---: | :--- | :--- | :--- |
| **W1** | Capability Strengthening | Nueva capacidad funcional o profundización de moat. | Fuerza 4 (Sustitutos) |
| **W2** | Carry-over Closure | Cierre de una deuda técnica postergada en rondas previas. | Fuerza 5 (Rivalidad) |
| **W3** | Mock Reduction | Migración de tests simulados hacia dependencias reales de integración. | Fuerza 5 (Rivalidad) |
| **W4** | ADOPTED Promotion | Promoción de una tecnología de evaluación a estándar del proyecto (vía PRE-v2.0). | Fuerza 5 (Rivalidad) |
| **W5** | Anti-Pattern Retirement | Eliminación comprobada y sostenida de un antipatrón en el código. | Fuerza 1 (Nuevos Entrantes) |
| **W6** | Persona Satisfied | Cumplimiento verificado de los requerimientos de una persona de usuario. | Fuerza 3 (Compradores) |
| **W7** | Gate Velocity | Reducción cuantificable del tiempo de compilación o ejecución de tests. | Fuerza 1 (Nuevos Entrantes) |
| **W8** | Finding Half-Life | Resolución de un hallazgo crítico dentro de los plazos establecidos. | Fuerza 1 (Nuevos Entrantes) |

### 2.1 Estructura obligatoria de una entrada WIN

```markdown
## [WIN-XXX] Título conciso de la victoria
- **Fecha:** YYYY-MM-DD (ISO 8601)
- **Clase PSIM:** Wn (Nombre de la clase)
- **Fuerza de Porter:** Fuerza k (Nombre)
- **Evidencia:** <comando ejecutado con exit code 0, o artefacto producido, o métrica>
- **Impacto:** <qué cambia para el sistema/operador/usuario>
```

**Sin evidencia verificable, no es una victoria.** Es una afirmación (Antipatrón #62).

---

## 3. Los 5 KPIs de Trayectoria (K1-K5)

Los KPIs miden la **trayectoria longitudinal** del sistema, no instantáneas.
Se recalculan en cada `sil trend` y se persisten en `docs/memory/state.json`.

### K1: P0/P1 Closure Rate

$$K_1 = \frac{\text{hallazgos P0/P1 cerrados}}{\text{hallazgos P0/P1 abiertos totales}}$$

- **Objetivo:** $K_1 \ge 0.90$
- **Frecuencia:** por iteración.
- **Fuente:** issues cerrados con label `P0` o `P1` / total abiertos.

### K2: Mock Reduction Velocity

$$K_2 = \frac{d(\text{stubs artificiales})}{dt}$$

- **Objetivo:** $K_2 < 0$ (pendiente negativa: menos stubs con el tiempo).
- **Frecuencia:** por iteración.
- **Fuente:** conteo de `// TODO: replace mock` / `jest.mock(` / `unittest.mock`
  en el codebase.

### K3: Finding Half-Life

$$K_3 = \text{mediana}\left(\text{iteraciones para cerrar un hallazgo P0/P1}\right)$$

- **Objetivo:** $K_3 \le 2$ iteraciones.
- **Frecuencia:** mediana móvil de los últimos 20 hallazgos.
- **Fuente:** timestamps de apertura y cierre de hallazgos.

### K4: Capability-Strengthening Count

$$K_4 = \text{victorias W1 registradas en la iteración}$$

- **Objetivo:** $K_4 \ge 1$ por iteración.
- **Frecuencia:** por iteración.
- **Fuente:** entradas `W1` en `docs/memory/wins-ledger.md` con timestamp de la
  iteración actual.

### K5: Gate Stability Streak

$$K_5 = \text{racha actual de compilaciones + tests + lint limpios}$$

- **Objetivo:** monótonamente creciente.
- **Frecuencia:** por commit.
- **Fuente:** CI `gate-honesty.yml`. Se reinicia a 0 ante cualquier fallo.

---

## 4. Snapshot de estado (`docs/memory/state.json`)

El archivo `state.json` es el único archivo de memoria **sobrescribible** (no
append-only). Es un snapshot del estado actual de los KPIs y baselines:

```json
{
  "version": "1.0.0",
  "last_updated": "2026-10-02T00:00:00Z",
  "kpi_targets": {
    "K1_p0_p1_closure_rate":      { "target": 0.90, "current": null },
    "K2_mock_reduction_velocity": { "target": -0.10, "current": null },
    "K3_finding_half_life_rounds":{ "target": 2.0, "current": null },
    "K4_capability_streak":       { "target": 1, "current": 8 },
    "K5_gate_stability_streak":   { "target": "monotonic_increase", "current": 1 }
  },
  "baselines": {
    "typecheck_errors": 0,
    "lint_warnings": 0,
    "test_coverage_percent": null,
    "build_duration_seconds": null,
    "circuit_breaker_p99_latency_ms": null
  },
  "psim_wins_count": { "W1": 6, "W2": 0, "W3": 0, "W4": 1, "W5": 0,
                        "W6": 0, "W7": 1, "W8": 0, "total": 8 },
  "anti_patterns_documented": 12,
  "porter_forces_status": { ... }
}
```

---

## 5. Comando `sil trend`

El script `scripts/sil-trend.sh` regenera `state.json` y produce
`docs/memory/metrics-trend.md` con:

1. KPIs actuales vs. targets.
2. Serie temporal de los últimos $N$ snapshots.
3. Balance de victorias W1-W8 del período.
4. Heatmap de Fuerzas de Porter.
5. Recomendaciones automáticas (ej. "K3 degradado: priorizar hallazgos P0
   pendientes").

---

## 6. Análisis de Fuerzas de Porter (aplicado al código)

Cada victoria y cada antipatrón se mapean a una fuerza competitiva. El sistema
mide el estado de las 5 fuerzas:

| Fuerza | Aplicación | Cómo se mide |
| :---: | :--- | :--- |
| **1** | Nuevos Entrantes (regresiones/vulnerabilidades) | Cantidad de antipatrones reincidentes (target: 0). |
| **2** | Poder de Proveedores (vendor lock-in LLM) | % de rutas con fallback funcional configurado (target: 100%). |
| **3** | Poder de Compradores (satisfacción del operador) | Victorias W6 + reducción de comandos manuales repetidos. |
| **4** | Amenaza de Sustitutos (obsolescencia técnica) | Antigüedad máxima de dependencias; % de skills MCP activos. |
| **5** | Rivalidad Interna (deuda técnica/duplicación) | Cantidad de utilidades duplicadas; ratio mock/integración. |

**Estado objetivo:** Fuerza 1, 2, 4, 5 → "neutralizada/mitigada"; Fuerza 3 →
"maximizada".

---

## 7. Reporte de cierre de sesión (`report`)

El comando `scripts/report.sh` genera al cierre de cada sesión agéntica:

1. **Veredicto AGREE/DISAGREE** por cada hipótesis planteada al inicio.
2. **Balance de costos L2** (tokens, USD, latencia) de la sesión.
3. **Análisis de Fuerzas de Porter** actualizado.
4. **Handoff estructurado** para la siguiente sesión (estado, artefactos, próximos pasos).
5. **Al menos 1 entrada WIN** nueva en `wins-ledger.md`.

---

## 8. Antipatrones PSIM

| # | Antipatrón | Qué lo previene |
| :---: | :--- | :--- |
| 74 | Reportes exclusivamente centrados en defectos | PSIM obliga a registrar victorias W1-W8. |
| 95 | Cuantificación de victorias sin evidencia | PSIM exige comando ejecutado / artefacto. |
| 66 | Optimización sobre métricas expuestas (Goodhart) | Benchmark rotativo ciego del 30%. |
| 68 | Promoción de reglas con una sola pasada | Condición de significancia estadística $\sigma < |\Delta S|$. |

---

## 9. Relación con PRE-v2.0

PSIM es la **medición**; PRE-v2.0 es el **mecanismo** de evolución. Toda
promoción de regla exitosa genera una victoria W4 (ADOPTED Promotion). Toda
regresión detectada genera una entrada en `anti-patterns.md`. El ciclo cerrado
es:

```
  propuesta PRE-v2.0  ──►  juez determinista  ──►  PROMOTE  ──►  WIN-XXX (W4)
                                       │
                                       ▼
                                    REJECT  ──►  entrada worklog (aprendizaje)
```

> Ver `docs/governance/PRE-v2.0.md` para el detalle del mecanismo.
