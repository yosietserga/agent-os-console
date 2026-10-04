# CLAUDE-CODE.md — Entrypoint para Claude Code

> Claude: este archivo es tu punto de entrada. **Lee obligatoriamente
> [`AGENTS.md`](./AGENTS.md) antes de cualquier acción.** Es el Documento Cero
> y rige todas tus operaciones en este repositorio.

## Resumen ejecutivo para Claude

- **Documento Cero:** `AGENTS.md` (constitución inmutable).
- **Memoria:** `docs/memory/anti-patterns.md` (leer SIEMPRE primero),
  `docs/memory/wins-ledger.md` (victorias PSIM),
  `docs/memory/state.json` (KPIs),
  `docs/memory/worklog.md` (bitácora de sesiones).
- **Catálogos:** `docs/catalogs/100-best-practices.md`,
  `docs/catalogs/100-anti-patterns.md`, `docs/catalogs/100-killer-features.md`.
- **Control Plane L2:** `docs/l2-control-plane/` (envelope XML, DDL, resiliencia).
- **Gobernanza:** `docs/governance/PRE-v2.0.md`, `docs/governance/PSIM.md`.

## Reglas que más te aplican como Claude Code

1. **P1 Read-After-Edit:** tras cada `Edit`/`Write`, vuelve a leer la sección.
2. **P2 Gate Honesty:** si no ejecutaste `bun run lint` / `tsc` / `pytest`, di
   `NOT RUN`. Nunca inventes `PASS ✅`.
3. **P3 Closes-Finding Guard:** no declaras resuelto un hallazgo si solo tocaste
   un test.
4. **P4 Sync atómica:** código + OpenAPI/contratos + docs + memoria en el mismo
   commit.
5. **P8 LLM-Agnóstico:** no importes `@anthropic-ai/sdk` en código de negocio;
   pasa por el Control Plane L2.

## Protocolo de sesión (resumen)

```
1. Lee AGENTS.md
2. Lee docs/memory/anti-patterns.md
3. Lee el último bloque de docs/memory/worklog.md
4. Declara el plan antes de mutar
5. Ejecuta el pipeline de 5 fases (AGENTS.md §2)
6. Tras cada edición → Regla P1
7. Tras cada puerta → Regla P2
8. Cierre: verify + wins-ledger + worklog + report
```

## Fórmula canónica

```
lee AGENTS.md, ejecuta: <comando> [parámetros]
```

Comandos disponibles: `start`, `cold run`, `itera`, `verify`, `audit memory`,
`sil trend`, `pre cycle`, `report`.
