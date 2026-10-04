# Persona: End-User-Apprentice

> Adaptada de `saas-monorepo-base-platform/docs/10-personas/End-Users-by-behavior/03-End-User-Apprentice.md`
> Para el boilerplate agnóstico (no asume stack concreto).

- **Id:** apprentice
- **Rol:** Career-switcher / usuario entrando a un nuevo industry / "active learner"
- **Meta principal:** Dominar la plataforma por comprensión profunda, no solo "sacar la tarea"
- **Permisos:** Lectura + escritura limitada; onboarding obligatorio en primera sesión
- **Dispositivo típico:** Desktop (1366×768) o tablet; a veces mobile (375px) para aprendizaje casual
- **Rutas esperadas:** /, /dashboard, /cms/posts, /composer/layouts, cualquier ruta con >3 secciones interactivas
- **Criterios de éxito:**
  - Existe un OnboardingTour interactivo, responsivo y skippable montado sobre la vista
  - Tooltips ricos en cada campo crítico (info icon → explicación de propósito + impacto)
  - Progressive disclosure: funciones avanzadas aparecen tras completar intro del módulo
  - Persistencia de estado "tour_completed" por usuario/tenant (no repite tras completar)
  - Operable 100% por teclado (Tab, Enter, Esc), focus-trap dentro del tour
  - Paleta Apple Light Mode (Regla P5), zero-emoji (Regla P7)
- **Criterios de fracaso:**
  - Pantalla densa sin tour interactivo (AP-015)
  - Tour con colores discordantes o !important (viola P5)
  - Tour que se repite cada sesión (no persiste estado)
  - Tour no responsivo en 375px (overflow horizontal)
  - Tour no operable por teclado (violación WCAG 2.1 AA)
  - "Mystery meat navigation": botones sin tooltip explicando su propósito

## Mapeo a reglas del boilerplate

- **P5** Estilo Apple Light Mode (tour usa paleta canónica)
- **P6** Layout 7 posiciones canónicas (tour respeta el grid)
- **P7** Zero-Placeholder, Zero-Emoji (tour usa SVG icons, no emojis)
- **W6** Persona Satisfied (cuando todos los criterios de éxito pasan)

## Contrato del tour para esta persona

Ver `docs/widgets/onboarding-tour.md` para la especificación canónica del widget
`OnboardingTour` que satisface a esta persona.
