<!-- ════════════════════════════════════════════════════════════════════════
  PR Template — Agent OS Boilerplate
  Todo PR debe declarar遵守 de las reglas P1-P9 y mapear a PSIM.
  ════════════════════════════════════════════════════════════════════════ -->

## Resumen del cambio

<!-- 1-3 frases: qué cambia y por qué. -->

## Tipo de cambio

- [ ] feat: nueva característica (W1)
- [ ] fix: corrección de bug (W5/W8)
- [ ] refactor: mejora interna sin cambio funcional (W2/W7)
- [ ] docs: solo documentación
- [ ] chore: tareas de mantenimiento
- [ ] pre: propuesta de mutación de regla (requiere veredicto PROMOTE del juez PRE-v2.0)

## Reglas cardinales verificadas

<!-- Marca las que aplican a este PR. Todas las marcadas deben cumplirse. -->

- [ ] **P1** Read-After-Edit: tras editar, releí la sección modificada.
- [ ] **P2** Gate Honesty: no declaré PASS sin ejecutar el comando; adjunto exit code + stdout.
- [ ] **P3** Closes-Finding Guard: si cierro un hallazgo, el código de producción también cambió.
- [ ] **P4** Sync atómica: código + contrato + docs + memoria en este mismo PR.
- [ ] **P5** Estilo Apple Light Mode: paleta canónica, cero `!important`.
- [ ] **P6** Layout 7 posiciones canónicas.
- [ ] **P7** Zero-Placeholder, Zero-Emoji.
- [ ] **P8** LLM-Agnóstico: no importé SDK de proveedor en código de negocio.
- [ ] **P9** Memoria append-only: solo anexé entradas, no sobrescribí.
- [ ] **P10** Entornos Dev/Deploy declarados (DEV_OS/DEPLOY_OS en .env); paths via `path.join()`.
- [ ] **P11** Si la vista es compleja (>3 secciones, composer, >3 métricas, ruta crítica): monta `OnboardingTour` canónico.
- [ ] **P12** Si toca input externo: aplica las 7 capas anti-prompt-injection (skill `prompt-injection-scanner`).
- [ ] **P13** Auto-crítica: ejecuté `critica <file>` con Modo A (3 debilidades) + Modo D (2 vectores) si aplica.
- [ ] **P14** Verifiqué por browser headless (no curl/fetch aislado) si toca rutas HTML.
- [ ] **P15** Generé `docs/expected/<topic>.md` antes de implementar y ejecuté `expected-check` después.
- [ ] **P16** Si toca paneles admin/account/users con sidebar: anatomía §11 completa (dashboard, papelera, pageviews wizard/avanzado, batch, detalles con tabs, beauty scrolls).
- [ ] **P17** Si hay flujos de creación: cola de trabajo §11.6 ("Guardar y crear otro", autosave, reintentos con presupuesto rate-limit aware) + notificaciones §11.7 (toasts acotados, errores a human-in-the-loop).
- [ ] **P18** Si el producto es SaaS o con data streaming: arquitectura event-driven §12 (event bus, caching por eventos, hooks/filters, colas con DLQ, pipelines, broadcasting).
- [ ] **W-CTA** Si hay CTA primario que se habilita por condición: usé `GlowingCtaButton` con gradient + glow.
- [ ] **gaps-finder** Ejecuté `bash scripts/gaps-finder.sh` y hay cero gaps critical/high (BP #128 mandatorio).

## Pipeline de 5 fases (marca las completadas)

- [ ] Fase 0: Auditoría de premisas + memory sync
- [ ] Fase 1: Núcleo de datos, dominio, tipado estricto
- [ ] Fase 2: Contratos de interfaz (OpenAPI/Zod/Protobuf)
- [ ] Fase 3: UI, widgets, 4 estados (loading/empty/error/success)
- [ ] Fase 4: Tests, documentación, actualización de memoria
- [ ] Fase 5: Validación en caliente, gate-honesty verde

## Gate Honesty (Regla P2)

<!-- Lista los comandos ejecutados con exit code y stdout real. -->

| Comando | Exit code | Stdout (resumen) |
| :--- | :---: | :--- |
| `pnpm exec tsc --noEmit` | _ | _ |
| `pnpm run lint` | _ | _ |
| `pnpm run test` | _ | _ |
| `pnpm run build` | _ | _ |

> Si un comando no se ejecutó, marca `NOT_RUN`. **Nunca** escribas `PASS` sin evidencia.

## Memoria empírica actualizada

- [ ] Anexé entrada a `docs/memory/wins-ledger.md` (al menos 1 victoria PSIM).
- [ ] Anexé entrada a `docs/memory/anti-patterns.md` (si descubrí un nuevo antipatrón).
- [ ] Anexé bloque a `docs/memory/worklog.md` con handoff.
- [ ] Actualicé `docs/memory/state.json` (si los KPIs cambiaron).

## PSIM ( Positive Self-Improvement & Measurement)

<!-- Si este PR habilita una victoria, indica la clase W1-W8. -->

- Clase PSIM: _ (W1-W8 o N/A)
- Fuerza de Porter impactada: _ (F1-F5)
- Evidencia verificable: _

## Checklist final

- [ ] Self-review completado.
- [ ] Comenté partes complejas del código.
- [ ] No dejé `console.log` / `print` / `echo` de debug.
- [ ] No dejé TODOs sin ticket asociado.
- [ ] Los tests nuevos y los existentes pasan localmente.
- [ ] Cualquier cambio dependiente está mergueado antes que este PR.

---

> **Si este PR toca `AGENTS.md`, `docs/governance/`, `docs/catalogs/` o
> `docs/polyglot/`:** el workflow `pre-cycle.yml` ejecutará el juez
> determinista PRE-v2.0. Solo se permite merge si el veredicto es `PROMOTE`
> ($\Delta S \ge 5.0$, sin regresiones, significancia estadística).
