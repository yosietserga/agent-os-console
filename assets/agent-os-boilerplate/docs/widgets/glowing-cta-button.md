# Canonical Glowing CTA Button Widget

> Especificación canónica del widget `GlowingCtaButton` que resalta el botón
> primario de acción cuando la condición de habilitación se cumple (ej: 2+
> archivos agregados listos para combinar).
>
> **Origen:** Directriz recurrente del operador (2026-10-02): "resalta el botón
> CTA de combinar con efectos gradients glowing para instar a tocarlo".
> **Cumple:** Regla P5 (Apple Light Mode) — el glow es sutil, no chillón.

---

## Cuándo es obligatorio

Un `GlowingCtaButton` DEBE usarse cuando se cumplan **todas** estas condiciones:

1. Hay un botón primario de acción (Combinar, Procesar, Generar, Publicar, Enviar).
2. La acción está condicionada a un estado previo (ej: ≥2 archivos agregados).
3. Cuando el estado se cumple, el botón pasa de `disabled` a `enabled` y debe
   **invitar visualmente** al usuario a tocarlo.
4. La acción es el siguiente paso obvio del flujo (golden path).

---

## Contrato visual (Regla P5 — Apple Light Mode compatible)

```
┌────────────────────────────────────────────────────────────────────────┐
│              CANONICAL GLOWING CTA BUTTON WIDGET                       │
├────────────────────────────────────────────────────────────────────────┤
│  Estados:                                                              │
│                                                                        │
│  1. DISABLED (estado inicial, condición no cumplida)                   │
│     - Background: #e5e5ea (gris titanio claro)                         │
│     - Text: #86868b (gris neutro)                                      │
│     - Sin glow, sin sombra                                             │
│     - Cursor: not-allowed                                              │
│     - aria-disabled="true"                                             │
│                                                                        │
│  2. ENABLED-GLOWING (condición cumplida, aún no clicked)              │
│     - Background: gradient linear 135deg                               │
│         from #0071e3 (azul interacción Apple)                          │
│         to #005bb5 (azul más profundo)                                 │
│     - Text: #ffffff                                                    │
│     - Border: 1px solid rgba(0,113,227,0.4)                            │
│     - Sombra suave: 0 4px 16px rgba(0,113,227,0.25)                    │
│     - GLOW ANIMATION (sutil, Apple-style, no chillón):                 │
│         box-shadow pulsate 2.4s ease-in-out infinite:                  │
│           0%:   0 0 0 0 rgba(0,113,227,0.4)                            │
│           50%:  0 0 0 12px rgba(0,113,227,0)                           │
│           100%: 0 0 0 0 rgba(0,113,227,0)                              │
│     - Cursor: pointer                                                  │
│     - aria-disabled="false"                                            │
│     - Transición: 320ms cubic-bezier(0.4, 0, 0.2, 1) desde disabled    │
│                                                                        │
│  3. HOVER (enabled + cursor encima)                                    │
│     - Background: gradient linear 135deg                               │
│         from #0071e3                                                   │
│         to #00449b                                                     │
│     - Glow intensifica: box-shadow 0 8px 24px rgba(0,113,227,0.4)      │
│     - Transform: translateY(-1px)                                      │
│     - Transición: 160ms ease-out                                       │
│                                                                        │
│  4. ACTIVE (click en progreso)                                         │
│     - Transform: translateY(0) scale(0.98)                             │
│     - Glow desaparece                                                  │
│     - Spinner reemplaza texto o texto + spinner                        │
│                                                                        │
│  5. SUCCESS (acción completada)                                        │
│     - Background: gradient linear 135deg                               │
│         from #16a34a (verde success)                                   │
│         to #15803d                                                     │
│     - Icono check SVG (no emoji, P7)                                   │
│     - Glow verde sutil 1.5s                                            │
│     - Auto-revertir a disabled o a estado inicial tras 3s              │
│                                                                        │
│  6. ERROR (acción falló)                                               │
│     - Background: #dc2626 (rojo danger)                                │
│     - Shake animation 320ms                                            │
│     - Mensaje de error debajo (humano, no técnico, P5)                 │
│     - Auto-revertir a enabled-glowing para reintentar                  │
│                                                                        │
│  Prohibiciones (P5):                                                   │
│   - Cero !important. Usar CSS variables + specificity natural.         │
│   - Cero colores fuera de paleta (no mostaza, no dark mode base).      │
│   - Cero emojis (P7). Iconos SVG vectoriales.                          │
│   - Glow no excede 16px de expansión (sutil, no agresivo).             │
│   - Animación no excede 2.4s (respeta prefers-reduced-motion).         │
│                                                                        │
│  Accesibilidad (WCAG 2.1 AA):                                          │
│   - aria-disabled cambia con estado                                    │
│   - focus-visible: outline 2px solid #0071e3 + outline-offset 2px      │
│   - prefers-reduced-motion: desactiva glow + transform, mantiene color │
│   - Touch target mínimo 44px altura                                    │
│   - role="button" si no es <button> nativo                             │
│   - aria-live="polite" para anuncios de estado success/error           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Contrato de tipos (agnóstico al lenguaje, ilustrado en TS)

```typescript
// docs/widgets/glowing-cta-button.md — contrato canónico

export interface GlowingCtaButtonProps {
  label: string;                    // "Combinar", "Procesar", "Generar"
  icon?: 'combine' | 'process' | 'generate' | 'publish' | 'send' | 'custom';
  // SVG path para icono custom (P7: zero-emoji)
  customIconSvg?: string;

  // Estado (determina apariencia)
  disabled: boolean;                // true = DISABLED; false = ENABLED-GLOWING
  loading?: boolean;                 // true = ACTIVE con spinner
  successState?: boolean;            // true = SUCCESS
  errorState?: boolean;              // true = ERROR
  errorMessage?: string;             // mensaje humano (no técnico)

  // Acción
  onClick: () => void | Promise<void>;

  // Condición que habilita (para aria-live announcement)
  enableConditionDescription?: string;  // ej: "2 archivos agregados"

  // Opcionales
  size?: 'sm' | 'md' | 'lg';         // default 'md' (44px touch target)
  fullWidth?: boolean;                // default false
  glowColor?: '#0071e3' | '#16a34a' | '#dc2626';  // default azul
  testDataTour?: string;             // para persona check + ui test
}
```

---

## Reglas de implementación

### 1. Detección de "estado listo"

El widget debe reaccionar a cambios de estado del parent. Ejemplo canónico
para "combinar archivos":

```tsx
// Ejemplo ilustrativo (agnóstico al framework real)
function CombinePage({ files }: { files: File[] }) {
  const ready = files.length >= 2;
  return (
    <GlowingCtaButton
      label="Combinar archivos"
      icon="combine"
      disabled={!ready}
      enableConditionDescription={`${files.length} archivo(s) agregado(s), mínimo 2`}
      onClick={() => combineFiles(files)}
      testDataTour="combine-cta"
    />
  );
}
```

Cuando `files.length` pase de 1 a 2, el botón transiciona `disabled → enabled-glowing`
en 320ms y el glow comienza a pulsar. El operador ve inmediatamente "ahora puedo
tocar aquí".

### 2. Glow sutil, no chillón

El glow **no debe ser agresivo**. Apple-style significa:
- Expansión máxima: 12-16px desde el borde del botón.
- Opacidad máxima del glow: 0.4 (no 1.0).
- Duración del pulso: 2.4s (lento, hipnótico suave, no ansioso).
- Color del glow: mismo que el background (azul #0071e3, no blanco).
- `prefers-reduced-motion`: desactivar pulso, mantener gradient + sombra estática.

### 3. Persistencia del glow

El glow se mantiene mientras el botón esté `enabled` y no se haya hecho click.
**No se apaga tras N segundos** — el usuario puede tardar en decidir. Solo se
apaga al hacer hover (intensifica), click (active), o al cambiar a success/error.

### 4. Reset post-success

Tras `successState=true`, mantener el estado verde con check 3 segundos, luego
auto-revertir al estado inicial (disabled si la condición ya no aplica, o
enabled-glowing si aplica para otra acción).

### 5. Responsivo

- Mobile 375px: botón full-width, 48px altura touch target.
- Tablet 768px: botón auto-width centrado, 44px altura.
- Desktop 1024px+: botón auto-width alineado a la derecha del formulario.

---

## Verificación automática (`ui test` + `persona check`)

El script `scripts/ui-test.sh` actualizado verifica:

1. ¿Existe un `<button>` con `data-tour="combine-cta"` (o equivalente)?
2. ¿Cuando `disabled`, tiene fondo gris (#e5e5ea) y sin glow?
3. ¿Cuando `enabled`, tiene gradient azul + glow pulsante?
4. ¿`prefers-reduced-motion` desactiva el glow?
5. ¿Touch target ≥44px?
6. ¿`aria-disabled` cambia con el estado?

El script `scripts/persona-check.sh` verifica:
- **Apprentice**: el glow invita claramente a tocar (no hay ambigüedad).
- **Operator**: la transición disabled→enabled es inmediata al cumplir condición.
- **Demo-Master**: el glow se ve profesional en demos (no chillón).

---

## Ejemplo visual ASCII

```
   Estado DISABLED (1 archivo):
   ┌─────────────────────────────────┐
   │  Combinar archivos              │  ← gris #e5e5ea, texto #86868b
   └─────────────────────────────────┘     cursor: not-allowed

   Estado ENABLED-GLOWING (2+ archivos):
                            ✨ glow sutil ✨
   ┌─────────────────────────────────┐
   │  ⚡ Combinar archivos            │  ← gradient azul #0071e3→#005bb5
   └─────────────────────────────────┘     texto blanco, glow pulsante
       ← 12px expansión glow →            cursor: pointer

   Estado HOVER:
                            ✨✨ glow intenso ✨✨
   ┌─────────────────────────────────┐
   │  ⚡ Combinar archivos            │  ← gradient más profundo
   └─────────────────────────────────┘     translateY(-1px)
       ← 24px expansión glow →

   Estado SUCCESS:
   ┌─────────────────────────────────┐
   │  ✓ Archivos combinados          │  ← gradient verde, check SVG
   └─────────────────────────────────┘
```

(Nota: los emojis ⚡✓✨ en este ASCII son ilustrativos del contrato; en UI real
se usan SVGs limpios, nunca emojis — Regla P7.)

---

## Mapeo a reglas y PSIM

- **P5** Estilo Apple Light Mode (paleta canónica + cero !important)
- **P6** Layout 7 posiciones (CTA en `main` o `featuredFooter`)
- **P7** Zero-Placeholder, Zero-Emoji (SVG icons)
- **P11** Onboarding Tour obligatorio (si la vista es compleja, el CTA glowing
  complementa al tour: el tour explica, el CTA invita)
- **W6** Persona Satisfied (Apprentice + Operator + Demo-Master aprobaron)

---

## Origen y autoridad

Directriz recurrente del operador Yosiet Serga (2026-10-02): *"resalta el botón
CTA de combinar con efectos gradients glowing para instar a tocarlo"*.

A partir de este commit, **ningún agente necesita volver a solicitar CTAs
glowing**: el sistema lo exige automáticamente cuando aplica via `ui test` y
`persona check`.
