# Skill: reverse-engineer-skill

> Orquesta el pipeline de Radiografía Rayos X (5 etapas) sobre una web/app para
> extraer branding, 3D Three.js, modelo de negocio, y generar la especificación
> del clon. Implementa `docs/reverse-engineering/protocol.md`.
>
> **Origen:** Directriz del operador (2026-10-02) + 10 repos de skills de
> ingeniería inversa escaneados.

## Contrato

### Input
```json
{
  "url": "https://target-domain.com",
  "skip_stages": [],
  "output_dir": "docs/reverse-engineering/<epoch>-<domain>/"
}
```

### Output
```json
{
  "radiography_dir": "docs/reverse-engineering/<epoch>-<domain>/",
  "consolidated_report": "docs/reverse-engineering/<epoch>-<domain>-radiography.md",
  "expected_file": "docs/expected/<epoch>-<domain>-clone.md",
  "session_report": "docs/reports/<epoch>-reverse-engineer-<domain>.md",
  "stages_completed": [1, 2, 3, 4, 5],
  "verdict": "MATCH | BETTER | WORSE | FAIL"
}
```

## Sub-comandos (5)

### 1. `extract-branding <url>` → Etapa 1
Usa:
- **browser-use** (navegación agéntica + visión)
- **browser-devtools MCP** (getComputedStyle, screenshots, DOM inspect)
- **screenshot-to-code pattern** (screenshots → código)

Extrae:
- Paleta CSS → normalizar a tokens Apple Light Mode (P5)
- Tipografías, border-radius, espaciados, sombras
- Layout DOM → 7 posiciones canónicas (P6)
- Screenshots por sección (header, hero, footer)
- Logo + favicon + imágenes de marca
- CTAs primarios → detecta si usan glow (W-CTA)
- Animaciones CSS keyframes + GSAP

### 2. `extract-threejs <url>` → Etapa 2
Usa:
- **browser-devtools MCP** (WebGL inspect: `canvas.getContext('webgl2')`)
- **modelcontextprotocol/servers** (puppeteer + fetch para network intercept)
- **e2b-dev/fragments** (sandbox para probar shaders)

Extrae:
- Geometrías (.gltf/.glb URLs interceptadas en network)
- Shaders GLSL (vertex + fragment) via devtools console
- Texturas (PNG/JPG/KTX2 URLs)
- Animaciones 3D (mixers, clips, duración, loop)
- Cámara + luces + escena → mapear a ThreeCanvas widget
- FPS medido en runtime (desktop + mobile)

### 3. `extract-business <url>` → Etapa 3
Usa:
- **firecrawl** (crawling completo → Markdown + sitemaps + JSON)
- **gpt-researcher** (investigación autónoma de mercado)
- **browser-use** (navegación de flujos: login, pricing, checkout)
- **AutoGPT blocks** (parsing REST/GraphQL APIs en lotes)

Extrae:
- Pricing: planes, límites, add-ons, pasarelas de pago
- API contracts internos (XHR/Fetch interceptados → JSON schemas → OpenAPI 3.1)
- Sitemap completo (/pricing, /about, /terms, /privacy, /blog)
- Testimonios → pain points del cliente
- SEO + OpenGraph metadata
- Esquema transaccional preliminar (PostgreSQL DDL)
- 5 Fuerzas de Porter aplicadas al modelo

### 4. `reconstruct <radiography-dir>` → Etapa 4
Usa:
- **screenshot-to-code** (screenshots → React/Tailwind/Vue)
- **crewAI-tools** (SeleniumScrapingTool, ScrapeWebsiteTool)
- **autogen skills** (biblioteca local reutilizable)

Genera:
- Componentes tipados por sección (cero 'any', cero stubs)
- Widgets polimórficos EAV (ot/oi) para cada bloque
- OnboardingTour (P11) para vistas complejas detectadas
- GlowingCtaButton (W-CTA) para CTAs primarios
- ThreeCanvas widget aislado con shaders extraídos
- Tailwind tokens normalizados a Apple Light Mode (P5)
- Tests de contrato contra APIs interceptadas en Etapa 3

### 5. `verify-clone <clone-url> <original-url>` → Etapa 5
Usa:
- **browser-devtools MCP** (headless, P14 — 10 puntos)
- **e2b-dev/fragments** (sandbox para compilación)
- **expected-check** (P15 — compara contra `docs/expected/`)

Verifica (10 puntos P14):
1. HTTP status real (no curl aislado)
2. Console errors (cero)
3. Network failures (cero 4xx/5xx)
4. Screenshot diff clon vs original (< 15% DIFF)
5. WCAG 2.1 AA (cero violations críticas)
6. 7-posiciones layout (P6)
7. Sticky footer
8. Paleta Apple Light Mode (P5)
9. OnboardingTour (P11) si vista compleja
10. GlowingCtaButton (W-CTA) si CTA primario

Genera veredicto: MATCH / BETTER / WORSE / FAIL (P15).

## Reglas aplicadas

- **P2** Gate Honesty: reportes con exit code + stdout real
- **P5** Estilo Apple Light Mode: paleta extraída se normaliza
- **P6** Layout 7-posiciones: DOM se mapea
- **P7** Zero-Placeholder: assets reales (no mocks)
- **P9** Memoria append-only: reportes inmutables
- **P11** OnboardingTour: si vista compleja, el clon también
- **P12** Anti-Prompt-Injection: contenido extraído se escanea
- **P13** Auto-Crítica: Modo A + Modo D + AGREE/DISAGREE
- **P14** Headless Browser Verification: verificación browser real
- **P15** Expected-First: `docs/expected/<epoch>-<domain>-clone.md` antes
- **W-CTA** GlowingCtaButton: CTAs primarios del clon

## Anti-patrones relacionados

- **AP-029** Ingeniería inversa sin normalización Apple Light Mode
- **AP-030** Clonación sin expected-first (iteraciones infinitas)

## Implementación de referencia

`src/index.ts` — TypeScript puro (sin LLM) que orquesta los 5 sub-comandos.
Cada sub-comando invoca los MCP servers correspondientes y completa los
templates en `docs/reverse-engineering/<epoch>-<domain>/`.

El skill NO clona automáticamente; genera la radiografía + expectativas.
La clonación la hace el agente ejecutor siguiendo el pipeline de 5 fases.

## Ejemplo de invocación

```
skill reverse-engineer-skill --input '{
  "url": "https://target-domain.com",
  "skip_stages": [],
  "output_dir": "docs/reverse-engineering/"
}'
```

Output: 5 reportes por etapa + consolidado + expected-first + reporte sesión.

## Los 10 repos de skills integrados

| # | Repo | Sub-comando que lo usa |
| :---: | :--- | :--- |
| 1 | browser-use/browser-use | extract-branding, extract-business |
| 2 | firecrawl/firecrawl | extract-business |
| 3 | punkpeye/awesome-mcp-servers | (catálogo de MCP servers) |
| 4 | modelcontextprotocol/servers | extract-threejs (puppeteer + fetch) |
| 5 | abi/screenshot-to-code | extract-branding, reconstruct |
| 6 | e2b-dev/fragments | extract-threejs, verify-clone (sandbox) |
| 7 | crewAIInc/crewAI-tools | reconstruct |
| 8 | microsoft/autogen | reconstruct (skills library) |
| 9 | assafelovic/gpt-researcher | extract-business (5 Fuerzas Porter) |
| 10 | Significant-Gravitas/AutoGPT | extract-business (APIs en lotes) |
