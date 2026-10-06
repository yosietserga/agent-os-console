# Rules Reference — Agent OS Boilerplate v1.8.0

> All 15 Cardinal Rules + W-CTA with detailed specs.
> For interactive version, see [`html/architecture.html`](./html/architecture.html).

---

## Quick Reference Table

| # | Rule | Prevents | Severity |
| :---: | :--- | :--- | :---: |
| P1 | Read-After-Edit | Falsos éxitos por no-op en edición | 🔴 |
| P2 | Gate Honesty | Reportar PASS sin ejecutar el comando | 🔴 |
| P3 | Closes-Finding Guard | Cerrar hallazgos solo en mocks | 🔴 |
| P4 | Sync atómica código+contratos+docs | Drift entre API y OpenAPI | 🔴 |
| P5 | Estilo Modo Claro Apple | UI discordante y `!important` | 🔴 |
| P6 | Layout canónico 7 posiciones | Archivos monolíticos | 🔴 |
| P7 | Zero-Placeholder, Zero-Emoji | Datos ficticios en producción | 🔴 |
| P8 | Aislamiento LLM-Agnóstico | Vendor lock-in con SDKs directos | 🔴 |
| P9 | Memoria append-only | Pérdida de aprendizaje histórico | 🔴 |
| P10 | Entornos Dev/Deploy declarados | Bugs Windows↔Ubuntu | 🔴 |
| P11 | Onboarding Tour obligatorio | Pantallas densas sin Joyride | 🔴 |
| P12 | Anti-Prompt-Injection (7 capas) | OWASP LLM01 2026 | 🔴 |
| P13 | Auto-Crítica obligatoria | Auto-aprobación complaciente | 🔴 |
| P14 | Headless Browser Verification | curl/fetch aislado (éxito falso) | 🔴 |
| P15 | Expected-First Workflow | Generación sin expectativas | 🔴 |
| W-CTA | GlowingCtaButton | CTAs grises sin invitar a tocar | 🟡 |

---

## Detailed Specs

### P1 — Read-After-Edit Obligatorio

**NUNCA asumas que una modificación se aplicó correctamente.** Tras editar,
DEBE releer la sección modificada (`git diff` o lectura directa) para verificar
que el diff está presente y no ocurrió un no-op.

**Origin:** AP-001 (79 iteraciones con fallo oculto por no-op en regex).

---

### P2 — Gate Honesty Absoluta

**ESTÁ PROHIBIDO declarar "PASS" sin haber ejecutado el comando real.** Si no
se ejecutó, declarar `NOT RUN`. Toda afirmación de éxito debe incluir:
1. comando exacto ejecutado, 2. código de salida ($0$), 3. stdout representativo.

**Origin:** AP-004 (Typecheck PASS cableado sin invocar compilador).

---

### P3 — Closes-Finding Guard

**NUNCA declares resuelto un hallazgo si la solución solo reside en un mock.**
El archivo de producción debe contener la corrección sustantiva.

**Origin:** AP-005 (tests sobre stubs mientras producción rota).

---

### P4 — Sync Atómica

Todo cambio en código DEBE commitearse junto con: especificaciones de API
(OpenAPI/Protobuf), documentación, y memoria empírica (anti-patterns.md o
wins-ledger.md).

---

### P5 — Estilo Modo Claro Apple

**Paleta inmutable:**
| Token | Hex | Uso |
| :--- | :--- | :--- |
| bg-primary | `#ffffff` | Fondo principal |
| bg-surface | `#f5f5f7` | Superficies |
| border-fine | `#e5e5ea` | Bordes 1px |
| border-strong | `#d2d2d7` | Bordes emphasis |
| text-title | `#1d1d1f` | Titular bold |
| text-secondary | `#86868b` | Cuerpo neutro |
| accent | `#0071e3` | Azul interacción |

**Prohibido:** `#b48a44` (mostaza), `#070709` (dark base), `!important`.

---

### P6 — Layout 7 Posiciones Canónicas

```
┌─────────────────────────────────────────┐
│               header                    │
├─────────────────────────────────────────┤
│           featuredContent               │
├──────────┬────────────────────┬─────────┤
│column_left│      main         │column_r │
├──────────┴────────────────────┴─────────┤
│           featuredFooter                │
├─────────────────────────────────────────┤
│               footer                    │
└─────────────────────────────────────────┘
```

---

### P7 — Zero-Placeholder, Zero-Emoji

- Datos comerciales DEBEN provenir de DB/config. Prohibidos placeholders.
- Cero emojis en UI. Solo iconos SVG vectoriales.

---

### P8 — Aislamiento LLM-Agnóstico

**Ningún controlador de negocio puede importar SDK de proveedor LLM.** Toda
inferencia DEBE pasar por el Control Plane L2 (envelope canónico + circuit
breaker + ledger). Cambiar de proveedor = UPDATE en `l2_model_registry`.

**Compatible con:** Claude, GPT, Gemini, DeepSeek, Qwen, Llama, Mistral,
vLLM local, Ollama, LM Studio.

---

### P9 — Memoria Append-Only

`anti-patterns.md`, `wins-ledger.md`, `worklog.md` son **append-only**.
- Solo `>>` (anexar). Prohibido borrar/reescribir.
- Correcciones via `[CORRIGE-AP-XXX]` o `[CORRIGE-WIN-XXX]`.

---

### P10 — Entornos Dev/Deploy

`.env` define `DEV_OS` (ej. `windows`) y `DEPLOY_OS` (ej. `ubuntu`).
`.gitattributes` fuerza `eol=lf`. Paths en código DEBEN usar `path.join()`.

---

### P11 — Onboarding Tour Obligatorio

Toda vista con >3 secciones interactivas, composer, o >3 métricas DEBE montar
un `OnboardingTour` canónico (ver `docs/widgets/onboarding-tour.md`).

**Widget spec:** paleta Apple (P5), zero-emoji (P7), responsivo 375px,
focus-trap WCAG 2.1 AA, persistencia `tour_<tourKey>_completed`, máximo 8 steps.

---

### P12 — Anti-Prompt-Injection (7 Capas)

```
  Capa 1: Structured prompts (<system>...<user_input>)
  Capa 2: Input sanitization (decode-then-validate, typoglycemia norm)
  Capa 3: System prompt sandwich (antes Y después del input)
  Capa 4: Output validation (schema + exfiltration detection)
  Capa 5: HITL para acciones destructivas/externas
  Capa 6: Least privilege (sandbox FS, network allowlist, DB readonly)
  Capa 7: Comprehensive monitoring + audit log inmutable
```

**Origin:** OWASP LLM Top 10 2026 LLM01 (#1 por 2ª edición consecutiva).

---

### P13 — Auto-Crítica Obligatoria

Todo artefacto DEBE pasar auto-crítica antes de publicarse:
- **Modo A** (self-revision): mínimo 3 debilidades reales.
- **Modo D** (adversario): 2 vectores de ataque si toca seguridad.
- **Tabla AGREE/DISAGREE**: al menos 1 DISAGREE si exploró algo nuevo.
- **Análisis crítico contrario**: "¿hay mejores formas? ¿newer ways 2026?"

**Origin:** Anthropic Constitutional AI + AgentAuditor (arXiv Feb 2026).

---

### P14 — Headless Browser Verification

Verificar "el server funciona" NO es HTTP 200. Toda verificación de rutas
HTML DEBE usar browser headless (MCP `browser-devtools`) con 10 puntos:
navigate + console errors + network failures + screenshot + WCAG audit +
7-pos + sticky footer + palette + OnboardingTour + CTA Glowing.

curl/fetch aislado SOLO para healthcheck (`/health`, `/ping`).

---

### P15 — Expected-First Workflow

ANTES de implementar: generar `docs/expected/<epoch>-<topic>.md` con 6 secciones:
1. Wireframe ASCII (7 posiciones P6)
2. Documental (secciones, datos, estados loading/empty/error/success)
3. Comportamiento (clicks, hover, keyboard)
4. Rendimiento (FCP, TTI, P95)
5. Accesibilidad (WCAG, ARIA, focus)
6. CAs verificables (8-15, cada uno PASS/FAIL/BETTER/WORSE)

DESPUÉS: ejecutar `expected-check <topic>` con veredicto MATCH/BETTER/WORSE/FAIL.

---

### W-CTA — GlowingCtaButton

When a primary action button becomes enabled (e.g., 2+ files added), it MUST
use the `GlowingCtaButton` widget with:
- Gradient `#0071e3 → #005bb5`
- Glow pulsante 2.4s (expansión 12-16px, opacidad 0.4)
- 6 estados: disabled → enabled-glowing → hover → active → success → error
- `prefers-reduced-motion`: desactiva glow, mantiene gradient
- WCAG 2.1 AA: focus-visible, aria-disabled, touch target ≥44px
