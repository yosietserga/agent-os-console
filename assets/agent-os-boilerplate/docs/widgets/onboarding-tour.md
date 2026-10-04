# Canonical Onboarding Tour / Joyride Widget

> Especificación canónica del widget `OnboardingTour` que satisface a las
> personas Apprentice, Demo-Master y Experience-Architect.
>
> **Origen:** Directriz recurrente del operador absorbida via PRE-v2.0 proposal
> `add-joyride-canonical-and-persona-ecosystem` (2026-10-02).
> **Filosofía:** "Nunca más volver a solicitar el Joyride — el sistema lo exige
> automáticamente en pantallas complejas via `persona check`."

---

## Cuándo es obligatorio

Una vista **DEBE** montar un `OnboardingTour` si cumple **al menos una** de:

1. Tiene >3 secciones interactivas (formulario + tabla + gráfico + sidebar).
2. Es un lienzo de composición (composer, drag-and-drop, visual editor).
3. Tiene >3 métricas analíticas en un solo viewport.
4. Es ruta crítica de onboarding (/, /dashboard, /signup-success).
5. La persona `apprentice` está en scope (ver `docs/personas/apprentice.md`).

**Antipatrón relacionado:** AP-015 "Pantalla UI Compleja Huérfana de Onboarding".

---

## Contrato visual (Regla P5 — Apple Light Mode)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CANONICAL ONBOARDING TOUR WIDGET                     │
├────────────────────────────────────────────────────────────────────────┤
│  • Paleta:                                                              │
│    - Fondo:        #ffffff (blanco puro)                                │
│    - Borde:        1px solid #e5e5ea                                    │
│    - Sombra:       0 4px 16px rgba(0,0,0,0.08) suave                    │
│    - Titular:      #1d1d1f bold                                        │
│    - Cuerpo:       #86868b neutro Apple                                 │
│    - Botón primario: #1d1d1f (negro sobrio) o #0071e3 (azul interacción)│
│    - Botón skip:    texto gris #86868b, sin borde                       │
│                                                                        │
│  • Zero-Emoji (P7): iconos SVG limpios (flecha, check, info, x-cerrar) │
│                                                                        │
│  • Responsive:                                                          │
│    - Auto-ajuste a viewport 375px sin overflow horizontal              │
│    - Placement 'auto' detecta posición óptima (top/bottom/left/right)  │
│    - Beacon (punto pulsante) en target cuando tour no ha empezado       │
│                                                                        │
│  • Focus-Trap (WCAG 2.1 AA):                                            │
│    - Tab cicla solo dentro del tour                                     │
│    - Esc cierra el tour (con confirmación si ya había empezado)         │
│    - Enter avanza al siguiente step                                     │
│    - Shift+Enter retrocede                                              │
│                                                                        │
│  • Persistencia:                                                        │
│    - Estado "tour_<tourKey>_completed" guardado por user/tenant         │
│    - Storage: localStorage O EAV attribute (según stack)                │
│    - Si completed=true, no autoStart en sesiones posteriores            │
│    - Reset disponible via "Restart tour" en user settings               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Contrato de tipos (agnóstico al lenguaje, ilustrado en TS)

```typescript
// docs/widgets/onboarding-tour.md — contrato canónico

export interface TourStep {
  target: string;          // Selector CSS o data-tour="step-id"
  title: string;           // Conciso, sin jerga técnica (Apprentice-friendly)
  content: string;         // Explicación de la capacidad y valor de negocio
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  disableBeacon?: boolean; // true = sin beacon pulsante en este step
}

export interface OnboardingTourProps {
  tourKey: string;         // Clave única (ej. "composer-canvas-tour")
                           // Usada para persistencia: tour_<tourKey>_completed
  steps: TourStep[];       // Mínimo 1, máximo 8 (más = abandono)
  autoStartIfNew?: boolean;// default true; si false, requiere click en beacon
  skippable?: boolean;     // default true; si false, obligatorio (con cuidado)
  onComplete?: () => void; // callback al terminar (ej. log analytics event)
  onSkip?: () => void;     // callback al saltar (ej. marcar para re-prompt)
}
```

> **Nota polyglot:** el contrato es agnóstico. En Python/FastAPI+Jinja sería
> un dataclass serializado a JSON; en Go sería un struct; en Rust un struct
> con derive `Serialize`. Lo importante es la semántica, no el lenguaje.

---

## Reglas de implementación

### 1. Detección de "vista compleja"

El agente debe detectar si la vista cumple los criterios de obligatoriedad
(sección "Cuándo es obligatorio" arriba). Si cumple y **no** monta un tour,
el `persona check` falla para Apprentice.

### 2. Steps máximos: 8

Más de 8 steps causa abandono. Si la vista necesita más, dividir en múltiples
tours con `tourKey` distintos (ej. `composer-basic-tour` + `composer-advanced-tour`).

### 3. Contenido Apprentice-friendly

- **Title:** máximo 6 palabras, sin jerga. Mal: "Configura el EAV polimórfico".
  Bien: "Personaliza tus productos".
- **Content:** máximo 2 frases, explica **qué** hace + **por qué** importa al
  negocio. Mal: "Este widget usa Object Type (ot) e Instance (oi)". Bien:
  "Aquí decides qué atributos tienen tus productos. Cámbialos cuando quieras
  sin tocar código."

### 4. Persistencia obligatoria

Sin persistencia, el tour se repite cada sesión → atosiga → abandono.
La clave debe ser `tour_<tourKey>_completed` y guardar `true`/`false`/`epoch`.

### 5. Reset disponible

El usuario debe poder re-ver el tour desde "Settings → Restart onboarding tours".
Esto permite a Demo-Master resetear antes de una demo.

---

## Verificación automática (`persona check`)

El script `scripts/persona-check.sh` actualizado verifica:

```
1. ¿La ruta cumple criterios de "vista compleja"? (heurística: >3 secciones,
   formularios múltiples, presencia de composer/canvas/analytics)
2. Si sí: ¿existe un componente <OnboardingTour ... /> o equivalente en la
   página?
3. ¿El tourKey está presente y es único?
4. ¿Los steps son ≤8?
5. ¿Hay lógica de persistencia (localStorage/EAV) referenciada?

Si 1=sí y 2-5=no → FAIL para Apprentice + Demo-Master.
```

---

## Ejemplo de uso (ilustrativo, no código de producción)

```tsx
// Vista: /composer/layouts  (lienzo de composición de páginas)
import { OnboardingTour } from '@saas/ui/feedback';

export function ComposerLayoutsPage() {
  return (
    <>
      <ComposerCanvas />  {/* la vista compleja real */}
      <OnboardingTour
        tourKey="composer-canvas-tour"
        autoStartIfNew
        steps={[
          {
            target: '[data-tour="canvas-dropzone"]',
            title: 'Tu lienzo',
            content: 'Arrastra widgets aquí para componer tu página.',
            placement: 'right',
          },
          {
            target: '[data-tour="widget-palette"]',
            title: 'Paleta de widgets',
            content: 'Elige widgets polimórficos. Se adaptan a tu tipo de página.',
            placement: 'left',
          },
          {
            target: '[data-tour="publish-button"]',
            title: 'Publicar',
            content: 'Cuando termines, publica. Los cambios se versionan para rollback.',
            placement: 'bottom',
          },
        ]}
      />
    </>
  );
}
```

---

## Mapeo a reglas y PSIM

- **P5** Estilo Apple Light Mode (paleta canónica del widget)
- **P6** Layout 7 posiciones (tour respeta el grid)
- **P7** Zero-Placeholder, Zero-Emoji (SVG icons, no emojis)
- **W6** Persona Satisfied (cuando Apprentice + Demo-Master pasan)
- **Killer Feature #41** Motor de Widgets Polimórficos EAV (este tour es un widget más)
- **Killer Feature #51** Accesibilidad Integral con Soporte ARIA (focus-trap WCAG 2.1 AA)

---

## Origen y autoridad

Esta especificación fue absorbida de la directriz recurrente del operador
Yosiet Serga (2026-10-02) via PRE-v2.0 proposal. A partir de este commit,
**ningún agente necesita volver a solicitar instrucciones sobre Joyrides**:
el sistema lo exige automáticamente cuando corresponde.
