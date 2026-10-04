# COPILOT-INSTRUCTIONS.md — Entrypoint para GitHub Copilot

> Copilot: este archivo es tu punto de entrada. **Lee obligatoriamente
> [`AGENTS.md`](./AGENTS.md) antes de sugerir o escribir código.** Es el
> Documento Cero y rige todas las operaciones en este repositorio.

## Resumen ejecutivo para Copilot

- **Documento Cero:** `AGENTS.md` (constitución inmutable).
- **Memoria:** `docs/memory/anti-patterns.md` (leer SIEMPRE),
  `docs/memory/wins-ledger.md`, `docs/memory/state.json`, `docs/memory/worklog.md`.
- **Catálogos:** `docs/catalogs/` (100 best-practices, 100 anti-patterns,
  100 killer-features).
- **Control Plane L2:** `docs/l2-control-plane/`.
- **Gobernanza:** `docs/governance/`.

## Reglas que más te aplican como Copilot

1. **P1 Read-After-Edit:** tras sugerir un cambio, espera que el operador verifique
   con `git diff` antes de declarar éxito.
2. **P2 Gate Honesty:** cuando el operador te pida verificar, declara `NOT RUN` si
   no tienes evidencia de ejecución real del comando.
3. **P4 Sync atómica:** cuando sugieras cambios en un controlador, sugiere
   también la actualización del contrato OpenAPI y de la memoria.
4. **P8 LLM-Agnóstico:** nunca sugieras importar SDKs de proveedor (`openai`,
   `@anthropic-ai/sdk`, `@google/generative-ai`) directamente en controladores.
5. **P5/P6/P7 Estilo:** sugiere siempre clases Tailwind coherentes con la paleta
   Apple Light Mode y el layout de 7 posiciones. Cero emojis.

## Stack visual canónico

```css
/* Paleta inmutable — Regla P5 */
--bg-primary:    #ffffff;
--bg-surface:    #f5f5f7;
--border-fine:   #e5e5ea;
--border-strong: #d2d2d7;
--text-title:    #1d1d1f;
--text-secondary:#86868b;
--accent:        #0071e3;
```

## Fórmula canónica

```
lee AGENTS.md, ejecuta: <comando> [parámetros]
```
