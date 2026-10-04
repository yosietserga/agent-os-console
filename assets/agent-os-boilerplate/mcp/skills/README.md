# MCP Skills — Catálogo de Skills Modulares

> Las skills son capacidades empaquetadas que el agente invoca para tareas
> repetibles. Cada skill tiene un contrato claro (input/output) y registra
> evidencia en la memoria empírica.

---

## Skills requeridos

| # | Skill | Propósito | Entradas | Salidas |
| :---: | :--- | :--- | :--- | :--- |
| 1 | [`schema-validator`](./schema-validator/SKILL.md) | Valida Zod/OpenAPI/Pydantic contra DDL de la base de datos. | Path al schema, DDL o conexión DB. | Reporte de discrepancias. |
| 2 | [`circuit-breaker-evaluator`](./circuit-breaker-evaluator/SKILL.md) | Calcula y simula estado de interruptores y backoff. | Histórico de fallos de un modelo. | Estado proyectado + tiempos de backoff. |
| 3 | [`memory-sync`](./memory-sync/SKILL.md) | Lee y añade registros atómicamente a la memoria empírica. | Tipo (AP/WIN/worklog), payload. | ID de la entrada anexada. |
| 4 | [`porter-forces-analyzer`](./porter-forces-analyzer/SKILL.md) | Modela impacto arquitectónico vs. 5 fuerzas de Porter. | Descripción del cambio propuesto. | Score por fuerza + recomendación. |
| 5 | [`apple-theme-linter`](./apple-theme-linter/SKILL.md) | Escanea CSS/Tailwind asegurando paleta Apple Light Mode. | Path a archivos CSS/TSX/HTML. | Lista de violaciones (P5, P7). |

---

## Estructura de un skill

Cada skill es un directorio con:

```
mcp/skills/<skill-name>/
├── SKILL.md              # Documentación del contrato (input/output/ejemplos)
├── manifest.json         # Metadatos: nombre, versión, autor, dependencias
└── src/                  # Implementación (TS/Py/Go/Rust según preferencia)
    └── index.*           # Entry point
```

---

## Invocación

El agente invoca una skill así (sintaxis agnóstica):

```
skill <skill-name> --input <json-path-or-inline>
```

Ejemplo:

```
skill memory-sync --input '{
  "type": "WIN",
  "payload": {
    "title": "Circuit Breaker L2 implementado",
    "class": "W1",
    "evidence": "cargo test test_circuit_breaker — exit 0 — 45ms",
    "impact": "Caídas de proveedor conmutan en <15ms"
  }
}'
```

La skill `memory-sync` anexa la entrada a `docs/memory/wins-ledger.md` con un ID
autogenerado (`WIN-009`) y retorna el ID. Garantiza append-only (Regla P9).

---

## Skill vs. MCP Server — cuándo usar cuál

- **MCP Server:** herramienta atómica de I/O (leer archivo, consultar DB, navegar).
  Stateless. Ej: `filesystem.read_file`.
- **Skill:** orquestación de múltiples pasos con lógica de dominio. Stateful
  dentro de la invocación. Ej: `porter-forces-analyzer` lee el diff, lo
  clasifica, consulta `anti-patterns.md`, y produce un reporte estructurado.

Las skills tipicamente invocan a varios MCP servers internamente.
