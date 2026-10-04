# Protocolo de Radiografía Rayos X — Ingeniería Inversa de Web/App/Software

> Generado por directriz del operador (2026-10-02): "quiero realizar ingeniería
> inversa a una web para extraer color, branding, animaciones, estructuras,
> banners 3D threejs, modelos de negocios y en esencia hacer una completa
> radiografía rayos X para poder aplicar lo definido aquí indicando que cree
> una copia de la web/app/software + modelo de negocio".
>
> **Origen de patrones:** 10 repos de skills de ingeniería inversa escaneados:
> browser-use (117k⭐), firecrawl (188k⭐), awesome-mcp-servers (96k⭐),
> modelcontextprotocol/servers (91k⭐), screenshot-to-code (80k⭐),
> e2b-dev/fragments (6k⭐), crewAI-tools (1.5k⭐), autogen (61k⭐),
> gpt-researcher (30k⭐), AutoGPT (188k⭐).

---

## 1. Comando canónico

```
lee AGENTS.md, ejecuta: cold run reverse-engineer <url>
```

o el alias:

```
lee AGENTS.md, ejecuta: rayos-x <url>
```

El comando ejecuta el **pipeline de 5 etapas** que sigue, generando un reporte
completo en `docs/reverse-engineering/<epoch>-<domain>-radiography.md` y un
documento de expectativas en `docs/expected/<epoch>-<domain>-clone.md` (P15)
listo para que el agente ejecute la replicación.

---

## 1.0 Disclaimer legal y ético (obligatorio antes de ejecutar)

> ⚠️ **AVISO LEGAL:** La ingeniería inversa de webs de terceros puede violar
> términos de servicio (ToS), derechos de autor, o leyes de competencia
> desleal. El operador es **única y exclusivamente responsable** de verificar
> que el target permite ingeniería inversa antes de ejecutar este comando.

**Usar SOLO en:**
- (a) **Webs propias** del operador o su organización.
- (b) **Webs con ToS que permite explícitamente** ingeniería inversa, scraping,
  o análisis técnico.
- (c) **Fines educativos** con atribución y sin redistribución comercial del
  código extraído.
- (d) **Dominio público** (licencias MIT, Apache, BSD, o contenido sin
  copyright).

**NO usar en:**
- Webs cuyo ToS prohíbe expresamente scraping/ingeniería inversa (LinkedIn,
  Facebook, Instagram, Twitter/X, la mayoría de SaaS comerciales).
- Webs con contenido protegido por copyright sin license clara.
- Webs de competidores con fines de copia comercial directa (puede constituir
  competencia desleal).

**El script `reverse-engineer.sh` NO verifica ToS automáticamente.** Es
responsabilidad del operador revisar `/terms`, `/legal`, `/tos` del target
antes de ejecutar. Si el agente detecta señales de ToS restrictivo (ej:
`robots.txt` con `Disallow: /`, paywall, login required), debe WARN al
operador antes de proceder.

**Para clonación comercial:** Consultar con asesor legal. La radiografía
rayos X extrae **patrones de diseño** (paletas, layouts, animaciones) que
son generalmente no protegibles; pero el **código fuente** y los **assets**
(logo, imágenes, copy) sí están protegidos por copyright. El clon debe
usar assets propios y no copiar literalmente el código.

---

## 2. Pipeline de 5 Etapas (Radiografía Rayos X)

```
┌────────────────────────────────────────────────────────────────────────┐
│            PIPELINE DE RADIOGRAFÍA RAYOS X — 5 ETAPAS                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ETAPA 1 — EXTRACCIÓN VISUAL & BRANDING (Fase 0 Auditoría)             │
│  ─────────────────────────────────────────────────────────             │
│  Herramientas: browser-devtools MCP + screenshot-to-code pattern       │
│  Extracción:                                                          │
│   • Paleta de colores CSS (getComputedStyle) → normalizar a Apple     │
│     Light Mode tokens (#ffffff, #f5f5f7, #1d1d1f, #0071e3)            │
│   • Tipografías (font-family, weights, sizes) → design tokens         │
│   • Border-radius, espaciados, sombras → spacing scale                │
│   • Layout DOM → mapeo a 7 posiciones canónicas (P6)                  │
│   • Captura de screenshots por sección (header, hero, footer, etc.)   │
│   • Logo + favicon + imágenes de marca → /assets/branding/            │
│   • Identificación de CTA primarios → ¿usan GlowingCtaButton? (W-CTA) │
│   • Animaciones CSS keyframes + GSAP → documentar timing/easing       │
│  Salida: docs/reverse-engineering/<epoch>-<domain>/01-branding.md     │
│                                                                        │
│  ETAPA 2 — EXTRACCIÓN DE SHADERS & 3D THREE.JS (Fase 1 Core)          │
│  ─────────────────────────────────────────────────────────             │
│  Herramientas: browser-devtools (WebGL inspection) + e2b sandbox       │
│  Extracción:                                                          │
│   • Detectar canvas WebGL: canvas.getContext('webgl2')                │
│   • Volcar geometrías (.gltf/.glb URLs interceptadas en network)      │
│   • Extraer shaders GLSL (vertex + fragment) via devtools             │
│   • Texturas (PNG/JPG/KTX2 URLs) → /assets/3d/textures/               │
│   • Animaciones 3D (mixers, clips) → documentar duración + loop       │
│   • Cámara + luces + escena → mapear a componente ThreeCanvas widget  │
│   • FPS medido en runtime → performance baseline                      │
│   • Aislamiento del Canvas en widget polimórfico EAV autónomo         │
│  Salida: docs/reverse-engineering/<epoch>-<domain>/02-threejs.md      │
│                                                                        │
│  ETAPA 3 — RADIOGRAFÍA DEL MODELO DE NEGOCIO (Fase 2 Contratos)        │
│  ─────────────────────────────────────────────────────────             │
│  Herramientas: firecrawl + gpt-researcher + browser-use               │
│  Extracción:                                                          │
│   • Pricing: planes (free/freemium/tiered/enterprise), límites quota  │
│   • Add-ons y upsells identificados en /pricing, /upgrade             │
│   • Pasarelas de pago (Stripe, PayPal, etc.) via network intercept    │
│   • API contracts internos: interceptar XHR/Fetch → JSON schemas      │
│   • Sitemap completo: /pricing, /about, /terms, /privacy, /blog       │
│   • Testimonios y casos de uso → pain points del cliente              │
│   • SEO + OpenGraph metadata → posicionamiento de marca               │
│   • Modelado del esquema transaccional en PostgreSQL DDL              │
│   • 5 Fuerzas de Porter aplicadas al modelo                           │
│  Salida: docs/reverse-engineering/<epoch>-<domain>/03-business.md     │
│                                                                        │
│  ETAPA 4 — RECONSTRUCCIÓN MODULAR (Fase 3 UI + Fase 4 Tests)          │
│  ─────────────────────────────────────────────────────────             │
│  Herramientas: screenshot-to-code + crewAI-tools + autogen skills     │
│  Generación:                                                          │
│   • Componentes tipados (cero 'any', cero stubs) por sección          │
│   • Motor de widgets polimórficos EAV (ot/oi) para cada bloque        │
│   • OnboardingTour (P11) para vistas complejas detectadas             │
│   • GlowingCtaButton (W-CTA) para CTAs primarios                      │
│   • Integración del ThreeCanvas widget con shaders extraídos          │
│   • Tailwind tokens traducidos de la paleta original → Apple Light    │
│   • Tests de contrato contra los APIs interceptados en Etapa 3        │
│  Salida: docs/reverse-engineering/<epoch>-<domain>/04-reconstruction.md│
│                                                                        │
│  ETAPA 5 — VERIFICACIÓN Y VALIDACIÓN (Fase 5 Puertas)                 │
│  ─────────────────────────────────────────────────────────             │
│  Herramientas: browser-devtools (headless, P14) + e2b sandbox         │
│  Verificación (10 puntos P14):                                         │
│   • Compilación completa con exit code 0 (TS/Py/Go/Rust/PHP/C++)      │
│   • Smoke test en navegador real (cero errores consola/red)           │
│   • Screenshot diff: clon vs original (MATCH/DIFF)                    │
│   • WCAG 2.1 AA sin violations críticas                                │
│   • 7-posiciones layout (P6) presente                                  │
│   • Sticky footer (no flota en página corta)                           │
│   • Paleta Apple Light Mode (P5) aplicada                              │
│   • OnboardingTour (P11) presente si vista compleja                   │
│   • GlowingCtaButton (W-CTA) presente si CTA primario                 │
│   • expected-check (P15) con veredicto MATCH/BETTER/WORSE/FAIL        │
│  Salida: docs/reverse-engineering/<epoch>-<domain>/05-verification.md │
│                                                                        │
│  REPORTE FINAL CONSOLIDADO                                            │
│  ─────────────────────────────────                                     │
│  • docs/reverse-engineering/<epoch>-<domain>-radiography.md           │
│    (consolida las 5 etapas + auto-crítica P13 + AGREE/DISAGREE)       │
│  • docs/expected/<epoch>-<domain>-clone.md                            │
│    (P15 expected-first: expectativas del clon para validar)           │
│  • docs/reports/<epoch>-reverse-engineer-<domain>.md                  │
│    (reporte de sesión con veredicto final)                            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Los 10 repos de skills de ingeniería inversa

| # | Repo | Stars | Función en el pipeline |
| :---: | :--- | :---: | :--- |
| 1 | `browser-use/browser-use` | 117k | Navegación agéntica web (visión + DOM), mapea user journeys completos |
| 2 | `firecrawl/firecrawl` | 188k | Crawling completo → Markdown limpio + sitemaps + JSON schemas para LLMs |
| 3 | `punkpeye/awesome-mcp-servers` | 96k | Catálogo de MCP servers (Chrome DevTools, Puppeteer, network dumps) |
| 4 | `modelcontextprotocol/servers` | 91k | MCP oficiales: puppeteer + fetch para interceptar XHR/Fetch + WebGL inspect |
| 5 | `abi/screenshot-to-code` | 80k | Screenshots → código frontend (React/Tailwind/Vue), extrae proporciones |
| 6 | `e2b-dev/fragments` | 6k | Sandboxes aislados para generar/ejecutar/preview Next.js/Vite/Three.js |
| 7 | `crewAIInc/crewAI-tools` | 1.5k | Skills estándar: SeleniumScrapingTool, ScrapeWebsiteTool, DirectoryReadTool |
| 8 | `microsoft/autogen` | 61k | Biblioteca local de skills reutilizables (extractor fuentes, GLTF decoder) |
| 9 | `assafelovic/gpt-researcher` | 30k | Investigación autónoma: pricing, pain points, 5 Fuerzas de Porter |
| 10 | `Significant-Gravitas/AutoGPT` | 188k | Bloques modulares para web parsing, sitemaps, REST/GraphQL APIs en lotes |

---

## 4. Skill `reverse-engineer-skill`

> Nuevo skill MCP en `mcp/skills/reverse-engineer-skill/SKILL.md`.

Orquesta los 10 repos anteriores en las 5 etapas. Tiene 5 sub-comandos internos:

- `extract-branding <url>` → Etapa 1
- `extract-threejs <url>` → Etapa 2
- `extract-business <url>` → Etapa 3
- `reconstruct <radiography-dir>` → Etapa 4
- `verify-clone <clone-url> <original-url>` → Etapa 5

---

## 5. Reglas aplicadas

- **P2** Gate Honesty: el reporte de radiografía incluye exit codes + stdout reales.
- **P5** Estilo Apple Light Mode: la paleta extraída se normaliza a tokens Apple.
- **P6** Layout 7-posiciones: el DOM se mapea a las 7 posiciones canónicas.
- **P7** Zero-Placeholder: los assets extraídos son reales (no mocks).
- **P9** Memoria append-only: el reporte de radiografía es inmutable.
- **P11** OnboardingTour: si la web original tiene vistas complejas, el clon también.
- **P12** Anti-Prompt-Injection: el contenido extraído se escanea antes de incluirlo.
- **P13** Auto-Crítica: el reporte incluye Modo A + Modo D + AGREE/DISAGREE.
- **P14** Headless Browser Verification: la verificación del clon es por browser real.
- **P15** Expected-First: se genera `docs/expected/<epoch>-<domain>-clone.md` antes.
- **W-CTA** GlowingCtaButton: si la web original tiene CTAs primarios, el clon también.

---

## 6. Antipatrones relacionados (a añadir)

- **AP-029** Ingeniería inversa sin normalización Apple Light Mode (clonar paleta discordante tal cual).
- **AP-030** Clonación sin expected-first (no hay expectativas del clon → iteraciones infinitas).

---

## 7. Best practices (a añadir)

- **BP #123** Radiografía Rayos X completa antes de clonar (5 etapas, no saltarse ninguna).
- **BP #124** Screenshot diff automatizado entre clon y original (MATCH/DIFF con umbral).
- **BP #125** Normalización de paleta extraída a tokens Apple Light Mode (P5).
- **BP #126** Aislamiento de Canvas 3D en widget polimórfico EAV autónomo.
- **BP #127** Interceptación de API contracts internos via network (XHR/Fetch) → OpenAPI 3.1.

---

## 8. Killer Features (a añadir)

- **#108** Comando `cold run reverse-engineer <url>` (radiografía rayos X 5 etapas).
- **#109** Skill `reverse-engineer-skill` con 5 sub-comandos orquestando 10 repos.

---

## 9. Autoaplicación al boilerplate (v1.7.0)

1. **Comando `cold run reverse-engineer <url>`** en AGENTS.md §0 (extiende cold run).
2. **Alias `rayos-x <url>`** para invocación rápida.
3. **`scripts/reverse-engineer.sh`** nuevo script (orchestra 5 etapas).
4. **`mcp/skills/reverse-engineer-skill/SKILL.md`** skill nuevo con 5 sub-comandos.
5. **`docs/reverse-engineering/protocol.md`** (este documento).
6. **`docs/expected/reverse-engineer-template.md`** template P15 para expectativas del clon.
7. **AP-029, AP-030** (2 nuevos antipatrones).
8. **BP #123-127** (5 nuevas mejores prácticas).
9. **Killer #108, #109** (2 nuevas killer features).
10. **WIN-016** (W1+W6 — ingeniería inversa canónica).

---

## 10. Fuentes

- Directriz del operador Yosiet Serga (2026-10-02).
- 10 repos escaneados via `mejorate.sh scan` extendido.
- Patrones de `docs/patterns/aci.md` (Agent-Computer Interface SWE-agent).
- Patrones de `docs/patterns/orchestration.md` (5 patrones Anthropic Cookbook).
- Protocolo `docs/security/headless-verify-and-expected-first-protocol.md` (P14 + P15).

---

> Documento inmutable. Correcciones via nuevo protocolo con
> `[CORRIGE-PROTOCOL-REVERSE-$EPOCH]`.
