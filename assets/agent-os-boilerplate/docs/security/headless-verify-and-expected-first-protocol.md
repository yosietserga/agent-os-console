# Protocolo de Verificación por Browser Headless + Expected-First Workflow

> Generado por directriz recurrente del operador (2026-10-02):
> 1. "Los LLM verifican si un server está bien por curl/fetch (HTTP 200 = éxito)
>    pero eso no verifica que se obtuvo el resultado esperado realmente."
> 2. "Es frustrante decirle algo al LLM, tener un resultado esperado en mi mente,
>    y no obtenerlo. Quiero que el LLM primero genere las expectativas
>    visuales/documentales y luego compare si realmente se obtuvo eso o algo
>    mejor o peor."

---

## PARTE 1 — Regla P14: Headless Browser Verification

### 1.1 Problema

```
   ❌ VERIFICACIÓN FALSA (común en LLMs):
   ─────────────────────────────────────
   $ curl http://localhost:3000/cms/posts
   HTTP/2 200
   <html>...</html>

   LLM: "✅ Server funciona, HTTP 200."
   REALIDAD: la página devuelve 200 pero:
   - El HTML está vacío (<div id="root"></div> sin JS ejecutado)
   - Hay errores de consola no capturados
   - El layout está roto (CSS no cargó)
   - El botón CTA no aparece porque la condición disabled no se cumple
   - Hay un network 500 en /api/auth que el curl no vio
   - WCAG violations que solo un browser real detecta
```

`curl`/`fetch` validan **capa de transporte** (HTTP), no **capa de experiencia**
(lo que el usuario realmente ve). Un HTTP 200 con HTML roto es un éxito falso.

### 1.2 Solución: verificación por browser headless

Toda verificación de "el server funciona" DEBE usar el MCP `browser-devtools`
(headless browser real) en vez de curl/fetch aislado. La verificación incluye:

```
   ✅ VERIFICACIÓN REAL (obligatoria):
   ─────────────────────────────────────
   1. browser-devtools.navigate(url)
      - Espera networkidle (no solo onload)
      - Captura HTTP status real

   2. browser-devtools.get_console_errors()
      - Cero console.error
      - Cero console.warning críticos
      - Cero uncaught exceptions

   3. browser-devtools.get_network_failures()
      - Cero 4xx/5xx en requests assets
      - Cero 4xx/5xx en API calls
      - Cero CORS errors
      - Cero timeouts

   4. browser-devtools.screenshot({ fullPage: true })
      - Captura visual del render final
      - Compara contra expected-screenshot (ver Parte 2)

   5. browser-devtools.audit_wcag({ standard: 'wcag21aa' })
      - Cero violations críticas
      - Cero serious violations

   6. browser-devtools.check_layout_7pos(url)
      - 7 posiciones canónicas presentes (P6)

   7. browser-devtools.check_sticky_footer(url)
      - Footer no flota en páginas cortas

   8. browser-devtools.check_palette(url)
      - Paleta Apple Light Mode (P5)
      - Cero !important

   9. Si hay CTA (combinar/procesar/generar):
      - Verificar transición disabled → enabled-glowing
      - Verificar glow pulsante
      - Verificar touch target ≥44px

  10. Si hay OnboardingTour (vista compleja, P11):
      - Verificar que el tour se monta
      - Verificar focus-trap operable
```

### 1.3 Cuándo curl/fetch SÍ es suficiente

curl/fetch aislado es válido SOLO para:

- **Healthcheck endpoints** (`/health`, `/ping`) que devuelven JSON simple.
- **Smoke tests de API** sin UI (ej: POST /api/v1/login con credenciales de test).
- **Verificación de headers HTTP** (CSP, HSTS, CORS preflight).

Para **cualquier ruta que sirva HTML** (páginas web), la verificación DEBE ser
por browser headless.

### 1.4 Antipatrón relacionado

**AP-027** Verificación por curl/fetch aislado de rutas HTML (HTTP 200 ≠ página
funcional). Documentado en `docs/memory/anti-patterns.md`.

### 1.5 Implementación en el boilerplate

- `scripts/ui-test.sh` ya usa `browser-devtools` MCP cuando está disponible.
- `scripts/verify.sh` extendido para requerir browser headless en rutas HTML.
- Workflow CI `gate-honesty.yml` añade job `headless-verify` que corre Playwright
  contra la ruta principal de la app.

---

## PARTE 2 — Regla P15: Expected-First Workflow

### 2.1 Problema

```
   ❌ WORKFLOW ACTUAL (frustrante):
   ─────────────────────────────────
   Operador: "Crea una pantalla de analítica avanzada de ventas."
   LLM: [genera código + UI]
   Operador: [abre la app, ve algo distinto a lo que esperaba]
   Operador: "No, no es lo que quería. Falta X, Y está mal, Z no existe."
   LLM: [corrige]
   Operador: "Tampoco. Lo que quiero es..."
   [N iteraciones]
   Operador: "Cansado."
```

El operador tiene un modelo mental del resultado esperado pero **no lo
comunica** porque asume que el LLM "sabe". El LLM genera algo distinto. Fricción
alta, fatiga alta.

### 2.2 Solución: Expected-First Workflow

Antes de generar código/UI, el LLM DEBE:

1. **Generar un documento de expectativas** (`docs/expected/<epoch>-<topic>.md`)
   con:
   - **Expectativa visual**: descripción en lenguaje natural + ASCII wireframe
     de cómo se verá la pantalla/función.
   - **Expectativa documental**: qué secciones, qué datos, qué interacciones,
     qué estados (loading/empty/error/success).
   - **Expectativa de comportamiento**: qué pasa al click X, qué validaciones,
     qué errores posibles.
   - **Expectativa de rendimiento**: SLA objetivo (latencia, tiempo carga).
   - **Expectativa de accesibilidad**: WCAG target, ARIA, keyboard nav.
   - **Criterios de aceptación**: lista verificable (pass/fail) que el comando
     `expected-check` evaluará tras la implementación.

2. **Confirmar con el operador** (si es sesión interactiva) o **proceder** (si
   es sesión autónoma con scope claro).

3. **Implementar** siguiendo el pipeline de 5 fases.

4. **Comparar resultado vs expectativa** con `scripts/expected-check.sh`:
   - Para cada criterio de aceptación: PASS / FAIL / BETTER / WORSE.
   - Captura screenshot real (browser headless, P14).
   - Genera reporte en `docs/reports/<epoch>-expected-check-<topic>.md`.
   - Si FAIL o WORSE: iterar o escalar a humano.

### 2.3 Plantilla del documento de expectativas

```markdown
# Expectativa: <topic>

> **Epoch:** <epoch>
> **Generado por:** Expected-First Workflow (Regla P15)
> **Operador:** <nombre>
> **Alcance:** <descripción breve>

## Expectativa visual (wireframe ASCII)

\`\`\`
   ┌─────────────────────────────────────────────────────────┐
   │  [HEADER] Dashboard de Analítica                        │
   ├──────────────┬──────────────────────────────────────────┤
   │  [COLUMN_LEFT]│ [MAIN]                                  │
   │   Filtros:    │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
   │   - Fecha     │  │ KPI 1   │ │ KPI 2   │ │ KPI 3   │   │
   │   - Región    │  └─────────┘ └─────────┘ └─────────┘   │
   │   - Producto  │  ┌──────────────────────────────────┐  │
   │               │  │ Gráfico de líneas (ventas/mes)   │  │
   │               │  └──────────────────────────────────┘  │
   │               │  ┌──────────────────────────────────┐  │
   │               │  │ Tabla paginada (top productos)   │  │
   │               │  └──────────────────────────────────┘  │
   ├──────────────┴──────────────────────────────────────────┤
   │  [FOOTER] Copyright                                     │
   └─────────────────────────────────────────────────────────┘
\`\`\`

## Expectativa documental

- **Secciones**: header con logo + nav, column_left con 3 filtros, main con
  3 KPI cards + 1 gráfico + 1 tabla, footer.
- **Datos**: KPIs vienen de /api/v1/analytics/kpis, gráfico de
  /api/v1/analytics/sales-by-month, tabla de /api/v1/analytics/top-products.
- **Estados**: loading (skeleton), empty (mensaje "no hay datos para filtros"),
  error (mensaje humano + retry), success (datos renderizados).
- **Paginación**: tabla paginada, 10 filas por página, cursor-based.

## Expectativa de comportamiento

- Click en filtro → aplica vía URL query params, no recarga página.
- Hover sobre punto del gráfico → tooltip con valor exacto.
- Click en fila de tabla → navega a /products/[id].
- Cambio de página → scroll a top de tabla.
- Teclado: Tab cicla filtros → KPIs → gráfico → tabla. Enter activa.

## Expectativa de rendimiento

- First Contentful Paint < 1.5s.
- Time to Interactive < 2.5s.
- API calls < 500ms P95.

## Expectativa de accesibilidad

- WCAG 2.1 AA.
- Contraste mínimo 4.5:1 texto, 3:1 gráficos.
- Focus visible en todos los interactivos.
- ARIA roles en gráfico (role="img" aria-label="Ventas por mes").

## Criterios de aceptación (verificables por expected-check.sh)

- [ ] CA1: Header presente con logo y nav (P6 7-posiciones).
- [ ] CA2: 3 KPI cards visibles sin scroll horizontal en 1366×768.
- [ ] CA3: Gráfico renderiza con datos reales (no skeleton tras 3s).
- [ ] CA4: Tabla paginada, 10 filas visibles.
- [ ] CA5: Filtros aplican sin recarga de página.
- [ ] CA6: Estados loading/empty/error/success implementados.
- [ ] CA7: WCAG 2.1 AA sin violations críticas.
- [ ] CA8: First Contentful Paint < 1.5s.
- [ ] CA9: Sticky footer (no flota en página corta).
- [ ] CA10: OnboardingTour presente (vista compleja, P11).
- [ ] CA11: CTA "Exportar" con GlowingCtaButton cuando hay datos.
- [ ] CA12: Cero console.error en runtime.
- [ ] CA13: Cero network 4xx/5xx en assets/APIs.

## Comparación post-implementación

> Completado por `scripts/expected-check.sh` tras la implementación.

| CA | Esperado | Obtenido | Veredicto |
| :---: | :--- | :--- | :---: |
| CA1 | Header con logo+nav | <describir real> | PASS/FAIL |
| CA2 | 3 KPIs sin scroll | <describir real> | PASS/FAIL/BETTER/WORSE |
| ... | ... | ... | ... |

### Screenshot real vs esperado

- Screenshot esperado (wireframe): ver arriba.
- Screenshot real: `docs/reports/<epoch>-expected-check/screenshot.png`

### Veredicto final

- [ ] MATCH — cumple expectativa
- [ ] BETTER — supera expectativa (detallar)
- [ ] WORSE — inferior a expectativa (detallar, iterar)
- [ ] FAIL — no cumple criterios críticos (iterar o escalar)
```

### 2.4 Comando `expected-check <topic>`

```
lee AGENTS.md, ejecuta: expected-check <topic>
```

Script `scripts/expected-check.sh` que:
1. Lee `docs/expected/<epoch>-<topic>.md` (documento de expectativas).
2. Para cada CA (criterio de aceptación), ejecuta verificación vía browser
   headless (P14):
   - Navega a la ruta indicada.
   - Captura screenshot.
   - Ejecuta audit WCAG.
   - Verifica presencia de elementos (selectores CSS).
   - Mide performance (FCP, TTI).
   - Captura console errors y network failures.
3. Genera reporte `docs/reports/<epoch>-expected-check-<topic>.md` con tabla
   comparativa.
4. Veredicto final: MATCH / BETTER / WORSE / FAIL.

### 2.5 Antipatrón relacionado

**AP-028** Generación de código sin expectativas previas (el operador tiene
modelo mental no comunicado).

### 2.6 Auto-crítica (P13) integrada

El reporte `expected-check` incluye sección de auto-crítica obligatoria:
- ¿Las expectativas eran realistas? (¿too high? ¿too low?)
- ¿El operador confirmó las expectativas antes de implementar?
- ¿Qué se aprendió para la próxima generación de expectativas?

---

## Mapeo a reglas

- **P14** Headless Browser Verification (no curl/fetch aislado para HTML)
- **P15** Expected-First Workflow (generar expectativas antes, comparar después)
- **P2** Gate Honesty (expected-check reporta PASS/FAIL honesto)
- **P13** Auto-Crítica (integrada en expected-check)
- **P5/P6/P7** validados por browser headless automáticamente

---

## Autoaplicación al boilerplate (v1.6.0)

1. **Regla P14** (Headless Browser Verification) en AGENTS.md §1.
2. **Regla P15** (Expected-First Workflow) en AGENTS.md §1.
3. **`docs/expected/`** nuevo directorio para documentos de expectativas.
4. **`scripts/expected-check.sh`** nuevo script (16º comando canónico).
5. **Skill `expected-spec-generator`** en `mcp/skills/` (genera template de
   expectativas a partir del prompt del operador).
6. **AP-027** (verificación curl/fetch aislado de HTML), **AP-028** (generación
   sin expectativas previas).
7. **BP #118-122** (5 nuevas: verificación browser, expected-first, comparación
   visual, criterios verificables, screenshot diff).
8. **Killer Feature #106** (expected-first workflow) + **#107** (headless
   verify).
9. **WIN-015** (W1+W6 — verificación real + expected-first).
10. **Extiende §8.2**: antes de implementar, generar expectativas.

---

## Fuentes

- Directriz recurrente del operador Yosiet Serga (2026-10-02).
- `mcp/servers/browser-devtools.mcp.json` (ya existente en el boilerplate).
- Playwright MCP (referencia de la industria).
- TDD (Test-Driven Development) aplicado a expectativas visuales.

---

> Documento inmutable. Correcciones via nuevo protocolo con
> `[CORRIGE-PROTOCOL-EXPECTED-$EPOCH]`.
