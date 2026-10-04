# Skill: expected-spec-generator

> Genera un documento de expectativas (`docs/expected/<epoch>-<topic>.md`) a
> partir del prompt del operador, ANTES de implementar. Implementa la Regla P15
> (Expected-First Workflow).
>
> **Origen:** Directriz recurrente del operador: "es frustrante decirle algo al
> LLM, tener un resultado esperado en mi mente, y no obtenerlo. Quiero que el
> LLM primero genere las expectativas visuales/documentales y luego compare".

## Contrato

### Input
```json
{
  "prompt": "Crea una pantalla de analítica avanzada de ventas",
  "topic": "analytics-ventas",
  "scope": "full | ui-only | api-only | both",
  "persona_targets": ["executive", "analyst"]
}
```

### Output
```json
{
  "expected_file": "docs/expected/<epoch>-<topic>.md",
  "cas_count": 13,
  "wireframe_ascii": "...",
  "acceptance_criteria": ["CA1...", "CA2...", "..."],
  "ready_for_implementation": true
}
```

## Qué genera

El skill genera un documento con 6 secciones obligatorias:

### 1. Expectativa visual (wireframe ASCII)

Dibujo en ASCII del layout esperado, marcando las 7 posiciones canónicas (P6):
`header`, `featuredContent`, `column_left`, `main`, `column_right`,
`featuredFooter`, `footer`.

### 2. Expectativa documental

- Secciones que aparecerán.
- Datos que se mostrarán (con fuente: API endpoint, DB table, etc.).
- Estados obligatorios: loading (skeleton), empty, error, success.
- Paginación / scroll behavior.

### 3. Expectativa de comportamiento

- Click en X → acción Y.
- Hover en X → tooltip Y.
- Teclado: Tab cicla A→B→C, Enter activa.
- Validaciones de formularios.

### 4. Expectativa de rendimiento

- First Contentful Paint < X ms.
- Time to Interactive < X ms.
- API P95 < X ms.

### 5. Expectativa de accesibilidad

- WCAG 2.1 AA target.
- Contraste mínimo.
- Focus visible.
- ARIA roles específicos.

### 6. Criterios de aceptación (CA) verificables

Lista de 8-15 CAs que `scripts/expected-check.sh` evaluará tras la
implementación. Cada CA debe ser:
- **Específico**: no ambiguo ("3 KPI cards" no "varios KPIs").
- **Verificable**: por browser headless (presencia de selector, screenshot,
  audit WCAG, performance metric).
- **Binario o cuádruple**: PASS / FAIL / BETTER / WORSE.

## Reglas del skill

1. **Generar ANTES de implementar**: el documento de expectativas existe
   previo a cualquier línea de código. Si el agente empieza a codear sin
   expectativas → viola P15.

2. **Confirmar con operador (si sesión interactiva)**: si el operador está
   presente, mostrar las expectativas y pedir confirmación antes de proceder.

3. **Si sesión autónoma**: si el operador no está (ej: cron, CI), proceder
   con las expectativas generadas y documentar la asunción.

4. **Mínimo 8 CAs, máximo 15**: menos de 8 es insuficiente; más de 15
   satura el reporte expected-check.

5. **CAs verificables por browser headless (P14)**: cada CA debe poder
   verificarse con MCP browser-devtools. Si un CA no es verificable
   automáticamente, reformularlo.

6. **Wireframe ASCII obligatorio**: el operador debe poder "ver" el resultado
   esperado antes de que exista.

## Mapeo a reglas

- **P14** Headless Browser Verification (los CAs se verifican con browser)
- **P15** Expected-First Workflow (este skill genera las expectativas)
- **P13** Auto-Crítica (expected-check integra auto-crítica)
- **W6** Persona Satisfied (las personas informan los CAs)

## Ejemplo de invocación

```
skill expected-spec-generator --input '{
  "prompt": "Crea una pantalla de analítica avanzada de ventas",
  "topic": "analytics-ventas",
  "scope": "full",
  "persona_targets": ["executive", "analyst"]
}'
```

Output: `docs/expected/<epoch>-analytics-ventas.md` con 6 secciones + 13 CAs.

## Implementación de referencia

`src/index.ts` — TypeScript puro (sin LLM) que genera el template. El LLM
ejecutor completa las secciones específicas basado en el prompt del operador.

El skill NO implementa la feature; solo genera el documento de expectativas.
La implementación la hace el agente ejecutor siguiendo el pipeline de 5 fases.

## Anti-patrón relacionado

**AP-028** Generación de código sin expectativas previas (el operador tiene
modelo mental no comunicado).
