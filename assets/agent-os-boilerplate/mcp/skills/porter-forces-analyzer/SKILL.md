# Skill: porter-forces-analyzer

> Modela el impacto arquitectónico de un cambio propuesto frente a las 5 Fuerzas
> Competitivas de Porter (adaptadas a calidad de código). Genera un reporte
> estructurado para el workflow `pre-cycle`.

## Contrato

### Input
```json
{
  "changeDescription": "Añadir Regla P10 (Streaming-First) a AGENTS.md",
  "diff": "git diff main...pre/propose/add-p10",
  "affectedFiles": ["AGENTS.md", "docs/governance/PRE-v2.0.md"],
  "benchmark": "packages/eval/benchmark-blind/current/"
}
```

### Output
```json
{
  "scores": {
    "F1_new_entrants_regressions": { "before": "mitigated", "after": "mitigated", "delta": 0 },
    "F2_vendor_power_llm_lockin":  { "before": "neutralized", "after": "neutralized", "delta": 0 },
    "F3_buyer_power_operator_satisfaction": { "before": "maximized", "after": "maximized+", "delta": +1 },
    "F4_substitutes_obsolescence": { "before": "neutralized", "after": "neutralized+", "delta": +1 },
    "F5_internal_rivalry_tech_debt": { "before": "minimized", "after": "minimized", "delta": 0 }
  },
  "recommendation": "PROMOTE — Net positive on F3 and F4; no regressions.",
  "antiPatternsIntroduced": [],
  "antiPatternsRetired": ["#19 Escalado innecesario a modelos superiores"],
  "winsEnabled": ["W1 (Capability Strengthening): streaming-first UX"]
}
```

## Mapeo de Fuerzas (referencia)

| Fuerza | Aplicación | Estados posibles |
| :---: | :--- | :--- |
| F1 | Nuevos Entrantes (regresiones/vulnerabilidades) | `exposed` → `mitigated` → `blocked` |
| F2 | Poder de Proveedores (vendor lock-in LLM) | `locked_in` → `neutralized` |
| F3 | Poder de Compradores (satisfacción del operador) | `frustrated` → `satisfied` → `maximized` |
| F4 | Amenaza de Sustitutos (obsolescencia técnica) | `obsolete` → `neutralized` |
| F5 | Rivalidad Interna (deuda técnica/duplicación) | `high` → `minimized` |

## Reglas que aplica

- Best Practice #94 (Análisis de Fuerzas de Porter para código).
- Antipatrón #72 (Ocultamiento de DISAGREE) — exige documentar delta negativo.

## Implementación de referencia

`src/index.ts` — TypeScript puro (sin LLM). Usa ts-morph para analizar el diff
y Heurísticas deterministas para clasificar cada archivo afectado.
