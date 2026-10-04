# Cursor Rules — Entrypoint

> **ANTES de cualquier acción, lee obligatoriamente:** [`AGENTS.md`](./AGENTS.md)

Este archivo es solo un puntero. Toda la gobernanza agéntica, las 9 reglas
cardinales (P1–P9), el pipeline de 5 fases, el Control Plane L2, la gobernanza
PRE-v2.0 y la medición PSIM están definidas en `AGENTS.md` (Documento Cero).

## Resumen de obligaciones del agente Cursor

1. **Fase 0 obligatoria:** leer `AGENTS.md` + `docs/memory/anti-patterns.md` + el
   último bloque de `docs/memory/worklog.md` antes de planificar.
2. **Regla P1 (Read-After-Edit):** tras cada edición, releer para verificar el diff.
3. **Regla P2 (Gate Honesty):** nunca declarar PASS sin comando ejecutado.
4. **Regla P8 (LLM-Agnóstico):** nunca importar SDKs de proveedor directamente.
5. **Regla P9 (Memoria append-only):** solo anexar a los ledgers de memoria.

## Fórmula canónica

```
lee AGENTS.md, ejecuta: <comando> [parámetros]
```

Comandos: `start`, `cold run`, `itera`, `verify`, `audit memory`, `sil trend`,
`pre cycle`, `report`. Ver `scripts/` para las implementaciones.

## Stack visual

Estilo Modo Claro Apple (Regla P5): fondos `#ffffff`/`#f5f5f7`, texto `#1d1d1f`,
acentos `#0071e3`. Cero `!important`. Layout canónico de 7 posiciones (Regla P6).
Cero emojis en UI (Regla P7).
