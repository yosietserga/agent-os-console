# docs/reports/ — Reportes de Sesión (Append-Only)

> Convención introducida en AGENTS.md v1.1.0 (Regla P9 extendida).
> Todo reporte de cierre de sesión se guarda aquí con el formato:
> **`<epoch>-<kebab-title>.md`**

## Formato de nombrado

```
docs/reports/<epoch_seconds>-<title-in-kebab-case>.md
```

- `<epoch_seconds>`: segundos desde Unix epoch (`date +%s` en bash).
- `<title>`: kebab-case descriptivo del trabajo realizado.

### Ejemplos

```
docs/reports/1759344000-cold-run-fix-rbac-gaps.md
docs/reports/1759430400-ui-test-cms-posts-page-1.md
docs/reports/1759516800-persona-check-dashboard.md
docs/reports/1759603200-pre-cycle-add-p10-streaming-first.md
docs/reports/1759689600-correccion-1759344000-cold-run-fix-rbac-gaps.md
```

## Inmutabilidad (Regla P9 extendida)

- **NUNCA** editar o borrar un reporte existente.
- Correcciones: crear un nuevo reporte con prefijo `correccion-` y referencia
  `[CORRIGE-REPORT-<epoch-original>]` en el cuerpo.
- El workflow `memory-audit.yml` detecta y bloquea PRs que modifiquen archivos
  existentes en `docs/reports/`.

## Contenido obligatorio de un reporte

Todo reporte debe incluir:

1. **Epoch y timestamp** (ISO 8601 UTC).
2. **Comando que lo generó** (ej. `ui test /cms/posts`, `persona check /dashboard`).
3. **Veredicto** (PASS/FAIL, AGREE/DISAGREE, PERSONA_SATISFIED/PERSONA_GAPS).
4. **Cambios realizados** (lista con diffs referenciados).
5. **Resultados de puertas (Gate Honesty)** con exit code + stdout real.
6. **Análisis crítico contrario** (¿hay mejores formas? ¿newer ways?).
7. **Siguientes pasos** (accionables, no vagos).

## Reportes generados por comandos canónicos

| Comando | Script | Reporte tipo |
| :--- | :--- | :--- |
| `report` | `scripts/report.sh` | `<epoch>-session-closure-<topic>.md` |
| `ui test <route>` | `scripts/ui-test.sh` | `<epoch>-ui-test-<route-slug>.md` |
| `persona check <route>` | `scripts/persona-check.sh` | `<epoch>-persona-check-<route-slug>.md` |
| `pre cycle` | `scripts/pre-cycle.sh` | `<epoch>-pre-cycle-<proposal>.md` |
| `audit memory` | `scripts/audit-memory.sh` | `<epoch>-memory-audit.md` |

## Lectura obligatoria en Fase 0

Per AGENTS.md §8.1, la Fase 0 incluye leer los **últimos 3 reportes** de este
directorio (ordenados por epoch desc) para mantener continuidad de specs
pendientes y no perder hallazgos previos.

```bash
# Listar los últimos 3 reportes
ls -1 docs/reports/*.md 2>/dev/null | sort -r | head -3
```
