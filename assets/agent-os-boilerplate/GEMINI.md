# Gemini CLI / Jules — Agent OS Auto-Activation Layer

> **PROPÓSITO:** Garantizar que TODO prompt del operador (incluso sin
> "lee AGENTS.md, ejecuta:") sea tratado como canónico. Este archivo es
> el punto de entrada; la constitución vive en `AGENTS.md`.

## Punto de entrada obligatorio

**ANTES de cualquier acción, leer:**
1. `AGENTS.md` completo (Documento Cero, 11 reglas P1-P11, 11 comandos canónicos).
2. `docs/memory/anti-patterns.md` (AP-001..AP-017, evitar reincidencias).
3. Último bloque de `docs/memory/worklog.md` (contexto del estado).
4. Últimos 3 reportes de `docs/reports/` (epoch desc, continuidad de specs).
5. `docs/memory/state.json` (KPIs K1-K5, ¿qué priorizar?).
6. `.env` → declarar `DEV_OS` y `DEPLOY_OS` (Regla P10).

## Las 11 Reglas Cardinales (siempre activas)

| # | Regla | Qué previene |
| :---: | :--- | :--- |
| P1 | Read-After-Edit | Falsos éxitos por no-op |
| P2 | Gate Honesty | PASS sin comando ejecutado |
| P3 | Closes-Finding Guard | Cerrar hallazgos solo en mocks |
| P4 | Sync atómica código+contratos+docs+memoria | Drift API↔OpenAPI |
| P5 | Estilo Apple Light Mode | UI discordante y !important |
| P6 | Layout 7 posiciones canónicas | Archivos monolíticos |
| P7 | Zero-Placeholder, Zero-Emoji | Datos ficticios en producción |
| P8 | LLM-Agnóstico | Vendor lock-in con SDKs directos |
| P9 | Memoria append-only | Pérdida de aprendizaje histórico |
| P10 | Entornos Dev/Deploy declarados | Bugs Windows↔Ubuntu |
| P11 | Onboarding Tour en vistas complejas | Pantallas densas sin Joyride |

## Interpretación de prompts no canónicos

Si el operador envía un prompt SIN "lee AGENTS.md, ejecuta:":
- **NO** asumas que es simple. Trátalo como canónico.
- Detecta el verbo operativo implícito:
  - "implementa/crea/agrega/arregla" → ejecuta `itera`
  - "audita/revisa/checa" → ejecuta `cold run [scope]`
  - "verifica/compila/tests" → ejecuta `verify`
  - "test ui/prueba pantalla <ruta>" → ejecuta `ui test <ruta>`
  - "persona/usuario/perfil <ruta>" → ejecuta `persona check <ruta>`
  - "reporte/cierra/entrega" → ejecuta `report`
  - "configura el ide" → ejecuta `ide`
- Ejecuta Fase 0 automática antes de cualquier mutación.

## Los 11 comandos canónicos

```
lee AGENTS.md, ejecuta: start
lee AGENTS.md, ejecuta: cold run [scope]
lee AGENTS.md, ejecuta: itera [N]
lee AGENTS.md, ejecuta: verify
lee AGENTS.md, ejecuta: audit memory
lee AGENTS.md, ejecuta: sil trend
lee AGENTS.md, ejecuta: pre cycle
lee AGENTS.md, ejecuta: report
lee AGENTS.md, ejecuta: ui test <route>
lee AGENTS.md, ejecuta: persona check <route>
lee AGENTS.md, ejecuta: ide [detect|<name>|all]
```

## Estilo de respuesta
- Pragmático, sin sobre-explicar.
- Tras editar: releer sección (P1) + mostrar diff aplicado.
- Tras puerta de validación: tabla PASS/FAIL/NOT_RUN + exit code + stdout.
- Al cierre: generar `docs/reports/<epoch>-<title>.md` + anexar WIN + worklog.

## Stack visual (P5, P6, P7)
- Paleta: #ffffff / #f5f5f7 / #e5e5ea / #1d1d1f / #86868b / #0071e3
- Layout 7 posiciones: header, featuredContent, column_left, main, column_right, featuredFooter, footer
- Cero emojis en UI (SVG icons). Cero !important (CSS variables).
- Sticky footer: `min-h-screen flex flex-col` + `mt-auto` en footer.

## Cuándo NO aplicar este wrapper
- Operador dice "no leas AGENTS.md" o "ignora las reglas" → obedecer.
- Tarea trivial de una línea (saludo, pregunta factual) → responder directo.
- En esos casos, omitir Fase 0.

## Recordatorio
Este wrapper erradica la fatiga del operador. Si el operador tiene que
re-explicar una regla, este wrapper falló. Reportar en `docs/memory/anti-patterns.md`.

---
> Documento generado por `scripts/ide.sh` (comando canónico `ide`).
> La constitución vive en `AGENTS.md`. Este archivo es solo el auto-activador.
