#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# reverse-engineer.sh — Comando canónico: `cold run reverse-engineer <url>`
#                                      o alias: `rayos-x <url>`
#
# Ejecuta el pipeline de 5 etapas de Radiografía Rayos X sobre una web/app:
# 1. Extracción visual & branding (paleta, tipografía, layout, animaciones)
# 2. Extracción shaders & 3D Three.js (WebGL, geometrías, GLSL, texturas)
# 3. Radiografía del modelo de negocio (pricing, APIs, 5 Fuerzas Porter)
# 4. Reconstrucción modular (componentes tipados, widgets EAV, tour, CTA)
# 5. Verificación y validación (browser headless P14, screenshot diff, P15)
#
# Implementa: docs/reverse-engineering/protocol.md
# Usa patrones de 10 repos: browser-use, firecrawl, awesome-mcp-servers,
# modelcontextprotocol/servers, screenshot-to-code, e2b-dev/fragments,
# crewAI-tools, autogen, gpt-researcher, AutoGPT.
# ════════════════════════════════════════════════════════════════════════
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\033[1;36m[RADIOGRAFIA]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[ERR]\033[0m %s\n' "$*" >&2; }

URL="${1:-}"
if [ -z "$URL" ]; then
  echo "Uso: bash scripts/reverse-engineer.sh <url> [--skip-stage <n>]"
  echo ""
  echo "Alias canónico: lee AGENTS.md, ejecuta: rayos-x <url>"
  echo "                lee AGENTS.md, ejecuta: cold run reverse-engineer <url>"
  echo ""
  echo "Ejecuta el pipeline de 5 etapas de Radiografía Rayos X:"
  echo "  1. Extracción visual & branding (paleta, tipografía, layout, animaciones)"
  echo "  2. Extracción shaders & 3D Three.js (WebGL, GLSL, geometrías, texturas)"
  echo "  3. Radiografía del modelo de negocio (pricing, APIs, 5 Fuerzas Porter)"
  echo "  4. Reconstrucción modular (componentes, widgets EAV, tour, CTA glowing)"
  echo "  5. Verificación (browser headless P14, screenshot diff, expected-check P15)"
  echo ""
  echo "Genera:"
  echo "  - docs/reverse-engineering/<epoch>-<domain>/ (5 reportes por etapa)"
  echo "  - docs/reverse-engineering/<epoch>-<domain>-radiography.md (consolidado)"
  echo "  - docs/expected/<epoch>-<domain>-clone.md (P15 expected-first)"
  echo "  - docs/reports/<epoch>-reverse-engineer-<domain>.md (reporte sesión)"
  exit 1
fi

# Extraer dominio para naming
DOMAIN=$(echo "$URL" | sed -E 's|https?://||; s|/.*||; s|^www\.||; s|\.[a-z]+$||' | tr '[:upper:]' '[:lower:]' | head -c 40)
[ -z "$DOMAIN" ] && DOMAIN="target"

EPOCH=$(date +%s)
OUTDIR="docs/reverse-engineering/${EPOCH}-${DOMAIN}"
EXPECTED_FILE="docs/expected/${EPOCH}-${DOMAIN}-clone.md"
RADIOGRAPHY="docs/reverse-engineering/${EPOCH}-${DOMAIN}-radiography.md"
SESSION_REPORT="docs/reports/${EPOCH}-reverse-engineer-${DOMAIN}.md"

mkdir -p "$OUTDIR" docs/expected docs/reports

log "URL objetivo: $URL"
log "Dominio: $DOMAIN"
log "Epoch: $EPOCH"
log "Directorio de salida: $OUTDIR"
echo ""

# ── ETAPA 0: Generar expected-first (P15) ANTES de empezar ──
log "═══ ETAPA 0: Expected-First (P15) ═══"
log "Generando documento de expectativas del clon ANTES de iniciar..."

cat > "$EXPECTED_FILE" << EOF
# Expectativa: Clon de $DOMAIN

> **Epoch:** $EPOCH
> **URL original:** $URL
> **Generado por:** Expected-First Workflow (P15) — reverse-engineer
> **Protocolo:** docs/reverse-engineering/protocol.md

## Expectativa visual (wireframe ASCII del clon)

> Completar tras Etapa 1 (extracción branding). Mapear a 7 posiciones (P6).

\`\`\`
[PENDIENTE: wireframe ASCII tras Etapa 1]
\`\`\`

## Expectativa documental

- **Secciones identificadas**: [completar tras Etapa 1]
- **Datos extraídos**: [completar tras Etapa 3]
- **Estados**: loading (skeleton), empty, error, success
- **Paginación**: [completar]

## Expectativa de comportamiento

- **CTAs primarios**: [completar tras Etapa 1] → deben usar GlowingCtaButton (W-CTA)
- **Tours**: si vista compleja → OnboardingTour (P11)
- **3D Canvas**: si detecta Three.js → ThreeCanvas widget aislado
- **Animaciones**: documentar timing/easing

## Expectativa de rendimiento

- First Contentful Paint < 1.5s
- Time to Interactive < 2.5s
- FPS 3D (si aplica) ≥ 60fps desktop, ≥ 30fps mobile

## Expectativa de accesibilidad

- WCAG 2.1 AA
- Paleta normalizada a Apple Light Mode (P5): #ffffff, #f5f5f7, #1d1d1f, #0071e3
- Cero !important (P5)
- Cero emojis (P7)

## Criterios de aceptación (8-15 CAs verificables por browser headless P14)

- [ ] CA1: Paleta del clon respeta Apple Light Mode (P5)
- [ ] CA2: Layout mapea a 7 posiciones canónicas (P6)
- [ ] CA3: Cero !important en CSS del clon (P5)
- [ ] CA4: Cero emojis en UI del clon (P7)
- [ ] CA5: CTAs primarios usan GlowingCtaButton (W-CTA)
- [ ] CA6: Vistas complejas tienen OnboardingTour (P11)
- [ ] CA7: Three.js Canvas aislado en widget autónomo (si aplica)
- [ ] CA8: Shaders GLSL compilan sin errores en WebGL
- [ ] CA9: APIs internas replicadas con OpenAPI 3.1 (Fase 2)
- [ ] CA10: Cero console.error en runtime (P14)
- [ ] CA11: Cero network 4xx/5xx en assets/APIs (P14)
- [ ] CA12: Screenshot diff clon vs original < 15% DIFF
- [ ] CA13: WCAG 2.1 AA sin violations críticas
- [ ] CA14: Modelo de negocio documentado (5 Fuerzas de Porter)

## Comparación post-clonación

> Completar tras Etapa 5 (verificación).

| CA | Esperado | Obtenido | Veredicto |
| :---: | :--- | :--- | :---: |
| CA1..CA14 | (ver arriba) | (completar) | PENDING |

## Veredicto final

- [ ] MATCH — el clon cumple las expectativas
- [ ] BETTER — supera las expectativas
- [ ] WORSE — inferior (iterar)
- [ ] FAIL — no cumple críticos (iterar o escalar)
EOF

log "  [OK] Expectativa generada: $EXPECTED_FILE"
echo ""

# ── ETAPA 1: Extracción visual & branding ──
log "═══ ETAPA 1: Extracción Visual & Branding ═══"
log "Herramientas: browser-devtools MCP + screenshot-to-code pattern"
log "Extrayendo: paleta CSS, tipografías, layout DOM, animaciones, logo, CTAs"

cat > "$OUTDIR/01-branding.md" << EOF
# Etapa 1 — Extracción Visual & Branding

> **URL:** $URL
> **Epoch:** $EPOCH

## Paleta de colores extraída (a normalizar a Apple Light Mode)

| Token original | Hex original | Token Apple equivalente | Acción |
| :--- | :---: | :--- | :--- |
| (completar via browser-devtools getComputedStyle) | #XXXXXX | #ffffff / #f5f5f7 / #1d1d1f / #0071e3 | mapear |

## Tipografías

- font-family principal: (completar)
- weights: (completar)
- sizes scale: (completar)
- line-height: (completar)

## Espaciados y border-radius

- spacing scale: (completar)
- border-radius: (completar)
- shadows: (completar)

## Layout DOM mapeado a 7 posiciones (P6)

- header: (presente/ausente)
- featuredContent: (presente/ausente)
- column_left: (presente/ausente)
- main: (presente/ausente)
- column_right: (presente/ausente)
- featuredFooter: (presente/ausente)
- footer: (presente/ausente)

## Screenshots por sección

- header.png: (capturar via browser-devtools)
- hero.png: (capturar)
- footer.png: (capturar)
- (otras secciones principales)

## Branding assets

- Logo: (URL extraída → /assets/branding/logo.svg)
- Favicon: (URL → /assets/branding/favicon.ico)
- Imágenes de marca: (lista de URLs)

## CTAs primarios detectados

- (lista de botones primarios con selector CSS)
- ¿Usan glow/gradient? (sí/no) → clon debe usar GlowingCtaButton (W-CTA)

## Animaciones

- CSS keyframes: (lista con timing/easing)
- GSAP: (detectado? sí/no)
- Otras librerías: (lista)

## Auto-crítica (P13)

> Completar tras extracción real.

### Modo A — 3 debilidades
1. (área/descripción/severidad/acción)
2. ...
3. ...

### Tabla AGREE/DISAGREE
| Hipótesis | Esperado | Obtenido | Veredicto |
| :--- | :--- | :--- | :--- |
| H1: Paleta extraída completa | Sí | (real) | AGREE/DISAGREE |

EOF
log "  [OK] Reporte Etapa 1: $OUTDIR/01-branding.md"
echo ""

# ── ETAPA 2: Extracción 3D Three.js ──
log "═══ ETAPA 2: Extracción Shaders & 3D Three.js ═══"
log "Herramientas: browser-devtools (WebGL inspect) + e2b sandbox"

cat > "$OUTDIR/02-threejs.md" << EOF
# Etapa 2 — Extracción Shaders & 3D Three.js

> **URL:** $URL
> **Epoch:** $EPOCH

## Detección de Canvas WebGL

- canvas.getContext('webgl2') detectado: (sí/no)
- Cantidad de canvas WebGL en la página: (N)

## Geometrías (.gltf/.glb)

| URL interceptada | Formato | Tamaño | ¿Descargable? |
| :--- | :---: | :---: | :---: |
| (completar via network intercept) | .gltf/.glb | XXkb | sí/no |

## Shaders GLSL

### Vertex shader
\`\`\`glsl
(completar via browser-devtools)
\`\`\`

### Fragment shader
\`\`\`glsl
(completar via browser-devtools)
\`\`\`

## Texturas

| URL | Formato | Resolución | Uso |
| :--- | :---: | :---: | :--- |
| (lista via network intercept) | PNG/JPG/KTX2 | WxH | (diffuse/normal/etc) |

## Animaciones 3D

- AnimationMixer detectado: (sí/no)
- Clips: (lista con duración + loop)

## Cámara + luces + escena

- Cámara: (tipo, position, fov)
- Luces: (lista: tipo, color, intensidad)
- Escena: (background, fog, etc.)

## FPS medido en runtime

- Desktop (1920×1080): (N fps)
- Mobile (375px): (N fps)

## Plan de aislamiento en widget

- Componente: ThreeCanvas (widget polimórfico EAV autónomo)
- ot (Object Type): three-canvas
- oi (Object Instance): <domain>-hero-3d

EOF
log "  [OK] Reporte Etapa 2: $OUTDIR/02-threejs.md"
echo ""

# ── ETAPA 3: Radiografía del modelo de negocio ──
log "═══ ETAPA 3: Radiografía del Modelo de Negocio ═══"
log "Herramientas: firecrawl + gpt-researcher + browser-use"

cat > "$OUTDIR/03-business.md" << EOF
# Etapa 3 — Radiografía del Modelo de Negocio

> **URL:** $URL
> **Epoch:** $EPOCH

## Pricing

| Plan | Precio | Límites | Features |
| :--- | :---: | :--- | :--- |
| (completar via /pricing) | $XX/mo | (quota) | (lista) |

## Add-ons y upsells

- (lista detectada en /upgrade o /pricing)

## Pasarelas de pago detectadas

- (via network intercept: Stripe, PayPal, etc.)

## API contracts internos (XHR/Fetch interceptados)

| Endpoint | Método | Request schema | Response schema |
| :--- | :---: | :--- | :--- |
| /api/v1/... | GET/POST | (JSON) | (JSON) |

## Sitemap completo

- /pricing
- /about
- /terms
- /privacy
- /blog
- (otras rutas detectadas via firecrawl)

## Testimonios y pain points

- (lista de testimonios → pain points del cliente)

## SEO + OpenGraph

- title: (completar)
- description: (completar)
- og:image: (URL)
- og:type: (completar)

## Esquema transaccional (PostgreSQL DDL preliminar)

\`\`\`sql
-- Generar DDL preliminar basado en APIs interceptadas
-- (completar tras analizar contratos)
\`\`\`

## 5 Fuerzas de Porter aplicadas

| Fuerza | Aplicación al modelo del target |
| :--- | :--- |
| 1. Nuevos Entrantes | (análisis) |
| 2. Poder de Proveedores | (análisis) |
| 3. Poder de Compradores | (análisis) |
| 4. Amenaza de Sustitutos | (análisis) |
| 5. Rivalidad Interna | (análisis) |

EOF
log "  [OK] Reporte Etapa 3: $OUTDIR/03-business.md"
echo ""

# ── ETAPA 4: Reconstrucción modular ──
log "═══ ETAPA 4: Reconstrucción Modular ═══"
log "Herramientas: screenshot-to-code + crewAI-tools + autogen"

cat > "$OUTDIR/04-reconstruction.md" << EOF
# Etapa 4 — Reconstrucción Modular

> **URL original:** $URL
> **Epoch:** $EPOCH

## Componentes a generar (por sección)

| Sección | Componente | Widget EAV (ot/oi) | ¿CTA glowing? | ¿OnboardingTour? |
| :--- | :--- | :--- | :---: | :---: |
| header | Header | layout/header | no | no |
| hero | HeroSection | content/hero | sí | sí |
| (etc) | (etc) | (etc) | (etc) | (etc) |

## ThreeCanvas widget (si aplica)

- Path: packages/ui/src/widgets/ThreeCanvas/
- Aislado del resto del código de negocio
- Props: sceneUrl, cameraConfig, lights[], shaders{}

## Tailwind tokens (normalizados a Apple Light Mode P5)

\`\`\`css
:root {
  --bg-primary: #ffffff;
  --bg-surface: #f5f5f7;
  --border-fine: #e5e5ea;
  --border-strong: #d2d2d7;
  --text-title: #1d1d1f;
  --text-secondary: #86868b;
  --accent: #0071e3;
  /* (mapear desde paleta extraída en Etapa 1) */
}
\`\`\`

## Tests de contrato (contra APIs interceptadas en Etapa 3)

- (lista de tests a generar)

EOF
log "  [OK] Reporte Etapa 4: $OUTDIR/04-reconstruction.md"
echo ""

# ── ETAPA 5: Verificación ──
log "═══ ETAPA 5: Verificación y Validación ═══"
log "Herramientas: browser-devtools (headless P14) + e2b sandbox + expected-check"

cat > "$OUTDIR/05-verification.md" << EOF
# Etapa 5 — Verificación y Validación

> **URL original:** $URL
> **URL del clon:** (completar cuando el clon esté corriendo)
> **Epoch:** $EPOCH

## Verificación por browser headless (P14 — 10 puntos)

| # | Verificación | Original | Clon | Veredicto |
| :---: | :--- | :--- | :--- | :---: |
| 1 | HTTP status | (N) | (N) | PASS/FAIL |
| 2 | Console errors | (N) | (N) | PASS/FAIL |
| 3 | Network failures | (N) | (N) | PASS/FAIL |
| 4 | Screenshot diff | baseline | <15% DIFF | PASS/FAIL |
| 5 | WCAG 2.1 AA | (violations) | (violations) | PASS/FAIL |
| 6 | 7-posiciones layout (P6) | (presentes) | (presentes) | PASS/FAIL |
| 7 | Sticky footer | (sí/no) | (sí/no) | PASS/FAIL |
| 8 | Paleta Apple (P5) | (n/a) | (sí/no) | PASS/FAIL |
| 9 | OnboardingTour (P11) | (n/a) | (sí/no) | PASS/FAIL |
| 10 | GlowingCtaButton (W-CTA) | (n/a) | (sí/no) | PASS/FAIL |

## Expected-Check (P15)

- Documento de expectativas: $EXPECTED_FILE
- Veredicto: MATCH / BETTER / WORSE / FAIL
- (ejecutar: bash scripts/expected-check.sh ${EPOCH}-${DOMAIN}-clone)

## Auto-crítica (P13) — Modo A

### Debilidad 1
(área/descripción/severidad/acción)

### Debilidad 2
(área/descripción/severidad/acción)

### Debilidad 3
(área/descripción/severidad/acción)

## Auto-crítica (P13) — Modo D (adversario)

### Vector 1
(vector/prueba/bloqueado/mitigación)

### Vector 2
(vector/prueba/bloqueado/mitigación)

## Tabla AGREE/DISAGREE (P13)

| Hipótesis | Esperado | Obtenido | Veredicto |
| :--- | :--- | :--- | :--- |
| H1: El clon replica el layout original | Sí | (real) | AGREE/DISAGREE |
| H2: El clon normaliza a Apple Light Mode | Sí | (real) | AGREE/DISAGREE |
| H3: Screenshot diff < 15% | Sí | (real) | AGREE/DISAGREE |

## Veredicto final

- [ ] MATCH — el clon cumple las expectativas
- [ ] BETTER — supera las expectativas
- [ ] WORSE — inferior (iterar)
- [ ] FAIL — no cumple críticos (iterar o escalar)

EOF
log "  [OK] Reporte Etapa 5: $OUTDIR/05-verification.md"
echo ""

# ── REPORTE CONSOLIDADO ──
log "═══ Generando reporte consolidado ═══"

cat > "$RADIOGRAPHY" << EOF
# Radiografía Rayos X — $DOMAIN

> **Epoch:** $EPOCH
> **URL objetivo:** $URL
> **Generado por:** \`scripts/reverse-engineer.sh\` (comando \`cold run reverse-engineer <url>\`)
> **Protocolo:** \`docs/reverse-engineering/protocol.md\`
> **Reglas aplicadas:** P2, P5, P6, P7, P9, P11, P12, P13, P14, P15, W-CTA

## Resumen ejecutivo

Radiografía completa de $URL siguiendo el pipeline de 5 etapas. Las 5 etapas
generan reportes individuales en \`$OUTDIR/\`. Este documento los consolida y
prepara el documento de expectativas (P15) para la clonación.

## Estructura de salida

\`\`\`
$OUTDIR/
├── 01-branding.md          # Etapa 1: paleta, tipografía, layout, animaciones
├── 02-threejs.md           # Etapa 2: WebGL, shaders GLSL, geometrías, texturas
├── 03-business.md          # Etapa 3: pricing, APIs, 5 Fuerzas Porter, DDL
├── 04-reconstruction.md    # Etapa 4: componentes, widgets EAV, tokens Apple
└── 05-verification.md      # Etapa 5: browser headless P14, expected-check P15

$EXPECTED_FILE              # P15 expected-first para el clon
$SESSION_REPORT             # Reporte de sesión con veredicto final
\`\`\`

## Etapa 1 — Extracción Visual & Branding
Ver: \`$OUTDIR/01-branding.md\`

## Etapa 2 — Extracción Shaders & 3D Three.js
Ver: \`$OUTDIR/02-threejs.md\`

## Etapa 3 — Radiografía del Modelo de Negocio
Ver: \`$OUTDIR/03-business.md\`

## Etapa 4 — Reconstrucción Modular
Ver: \`$OUTDIR/04-reconstruction.md\`

## Etapa 5 — Verificación y Validación
Ver: \`$OUTDIR/05-verification.md\`

## Próximos pasos

1. El agente ejecutor debe completar las 5 etapas llenando los templates.
2. Para cada etapa, usar las herramientas MCP indicadas (browser-devtools,
   firecrawl, gpt-researcher, screenshot-to-code, e2b).
3. Tras completar las 5 etapas, ejecutar \`expected-check\` (P15) para
   comparar el clon contra las expectativas.
4. Generar reporte de sesión final en \`$SESSION_REPORT\` con auto-crítica
   P13 (Modo A + Modo D + tabla AGREE/DISAGREE).

## Auto-crítica (P13) — obligatoria antes de cerrar

> El agente ejecutor DEBE completar esta sección antes de considerar la
> radiografía terminada.

### Modo A — 3 debilidades reales
1. (área/descripción/severidad/acción)
2. (área/descripción/severidad/acción)
3. (área/descripción/severidad/acción)

### Modo D — 2 vectores de ataque (si toca seguridad/input externo)
1. (vector/prueba/bloqueado/mitigación)
2. (vector/prueba/bloqueado/mitigación)

### Tabla AGREE/DISAGREE
| Hipótesis | Esperado | Obtenido | Veredicto |
| :--- | :--- | :--- | :--- |
| H1: Las 5 etapas están completas | Sí | (real) | AGREE/DISAGREE |
| H2: La paleta se normalizó a Apple Light Mode | Sí | (real) | AGREE/DISAGREE |
| H3: El expected-first se generó antes de clonar | Sí | (real) | AGREE/DISAGREE |

---

> Reporte inmutable (Regla P9 extendida a \`docs/reverse-engineering/\`).
> Correcciones via nuevo reporte con \`[CORRIGE-RADIOGRAFIA-$EPOCH]\`.
EOF

# Reporte de sesión
cat > "$SESSION_REPORT" << EOF
# Reporte de Sesión — Radiografía Rayos X de $DOMAIN

> **Epoch:** $EPOCH
> **URL objetivo:** $URL
> **Comando:** \`cold run reverse-engineer $URL\`
> **Reglas aplicadas:** P2, P5, P6, P7, P9, P11, P12, P13, P14, P15, W-CTA

## Resumen

Radiografía Rayos X iniciada. Pipeline de 5 etapas generado en:
- $OUTDIR/ (5 reportes por etapa)
- $RADIOGRAPHY (consolidado)
- $EXPECTED_FILE (P15 expected-first para el clon)

## Próximos pasos

1. El agente ejecutor completa las 5 etapas llenando los templates.
2. Ejecuta \`expected-check ${EPOCH}-${DOMAIN}-clone\` (P15) tras clonar.
3. Genera veredicto final: MATCH / BETTER / WORSE / FAIL.

## Auto-crítica P13

> Completar tras finalizar las 5 etapas.

---

> Reporte inmutable (P9).
EOF

log ""
log "═══ Radiografía Rayos X inicializada ═══"
log ""
log "Reportes generados:"
log "  $OUTDIR/01-branding.md"
log "  $OUTDIR/02-threejs.md"
log "  $OUTDIR/03-business.md"
log "  $OUTDIR/04-reconstruction.md"
log "  $OUTDIR/05-verification.md"
log "  $RADIOGRAPHY (consolidado)"
log "  $EXPECTED_FILE (P15 expected-first)"
log "  $SESSION_REPORT (reporte sesión)"
log ""
log "═══ Próximos pasos (algoritmo Ejecutor) ═══"
log "El agente (LLM o humano) debe ahora:"
log "  1. Para cada etapa 1-5: completar el template usando MCP tools"
log "     (browser-devtools, firecrawl, gpt-researcher, screenshot-to-code, e2b)"
log "  2. Tras completar, ejecutar: bash scripts/expected-check.sh ${EPOCH}-${DOMAIN}-clone"
log "  3. Completar auto-crítica P13 (Modo A + Modo D + AGREE/DISAGREE)"
log "  4. Asignar veredicto final: MATCH / BETTER / WORSE / FAIL"
log "  5. Si WORSE/FAIL: iterar y re-ejecutar"
log ""
log "Alias canónico para futuras invocaciones:"
log "  lee AGENTS.md, ejecuta: cold run reverse-engineer $URL"
log "  lee AGENTS.md, ejecuta: rayos-x $URL"
