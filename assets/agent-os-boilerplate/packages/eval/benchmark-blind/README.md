# Benchmark Ciego Rotativo — packages/eval/benchmark-blind

> Casos sintéticos reservados que el juez determinista usa para evaluar la
> dimensión $D_4$ (Casos Ocultos). Anti-Goodhart: el Optimizador no conoce
> estos casos, evitando sobreajuste.

---

## Estructura de un caso

Cada caso es un archivo `.case.json`:

```json
{
  "id": "case-001",
  "category": "memory_append_only",
  "description": "Verifica que memory-sync rechaza sobrescritura de entradas existentes.",
  "exposed": false,
  "createdAt": "2026-10-02T00:00:00Z",
  "rotationCycle": 1,
  "setup": {
    "repoState": "base",
    "seedFiles": [
      { "path": "docs/memory/anti-patterns.md", "content": "## [AP-099] Test entry..." }
    ]
  },
  "action": {
    "tool": "memory-sync",
    "input": {
      "type": "AP",
      "payload": { "title": "Sobrescribir AP-099", "rootCause": "..." }
    }
  },
  "assertions": [
    { "type": "exit_code", "expected": "NON_ZERO" },
    { "type": "stderr_contains", "expected": "append-only" },
    { "type": "file_unchanged_after_line", "path": "docs/memory/anti-patterns.md", "line": 1 }
  ],
  "expectedDimensionImpact": { "D4": 1.0 }
}
```

---

## Rotación

El script `scripts/pre-cycle.sh --rotate-benchmark` (corrido por cron o por
workflow programado) ejecuta cada `PRE_BENCHMARK_ROTATION_DAYS` (default 14):

1. **Archivo:** mueve el 10% de `current/` a `archive/` con sufijo `-rotated-YYYYMMDD`.
2. **Generación:** produce nuevos casos sintéticos para `current/` manteniendo
   el 30% del total en estado `exposed: false`.
3. **Reevaluación:** corre el juez sobre todas las propuestas `pre/propose/*`
   activas contra el nuevo benchmark. Si una propuesta aprobada pierde >5
   puntos → marca `OVERFIT` y abre PR de reversión.
4. **Auditoría:** anexa entrada al worklog con la rotación realizada.

---

## Categorías de casos

| Categoría | Qué verifica |
| :--- | :--- |
| `memory_append_only` | Regla P9 (no sobrescribir memoria). |
| `gate_honesty` | Regla P2 (no PASS sin comando ejecutado). |
| `read_after_edit` | Regla P1 (releer tras editar). |
| `closes_finding_guard` | Regla P3 (no cerrar hallazgo solo en mock). |
| `llm_agnostic` | Regla P8 (no importar SDK de proveedor en código de negocio). |
| `apple_palette` | Regla P5 (paleta Apple Light Mode, sin `!important`). |
| `layout_7pos` | Regla P6 (7 posiciones canónicas). |
| `no_emoji_no_placeholder` | Regla P7 (zero-emoji, zero-placeholder). |
| `circuit_breaker_math` | Fórmula $R_{\text{fail}}$ y apertura. |
| `backoff_decorrelated` | Fórmula $T_{\text{sleep}}$ con jitter. |
| `ledger_immutable` | Triggers BEFORE UPDATE/DELETE en `l2_cost_token_ledger`. |
| `tenant_isolation` | RLS activo y `tenant_id` en cada consulta. |
| `pipeline_order` | Fases 0→5 en orden (no saltar). |
| `atomic_sync` | Regla P4 (código + contrato + docs + memoria en mismo commit). |

Cada categoría debe tener al menos 5 casos en `current/`, con 30% `exposed: false`.

---

## Cómo añadir un caso

1. El Optimizador crea `current/case-NNN.json` con la estructura arriba.
2. El caso se marca `exposed: true` inicialmente (visible para iterar).
3. Tras 1 rotación, el script puede moverlo a `exposed: false` (ciego).
4. Casos críticos pueden nacer directamente `exposed: false` si el Optimizador
   los propone via PR `pre/propose/add-blind-case-NNN` (juzgado por PRE-v2.0).

---

## Invariante

- `current/` + `archive/` = todos los casos históricos.
- `archive/` nunca se modifica (auditoría).
- `current/` se rota pero el total de casos expuestos + ciegos se mantiene
  aprox. 70/30.
