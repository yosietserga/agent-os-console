# Persona: Experience-Architect

> Adaptada de `saas-monorepo-base-platform/docs/10-personas/End-Users-by-POV/Experience-Architect.md`
> Para el boilerplate agnóstico (no asume stack concreto).

- **Id:** experience-architect
- **Rol:** "Empathy Filter" / PX Strategist / puente entre capacidad técnica y realización de valor
- **Meta principal:** Asegurar que el monorepo no solo "funcione" desde DevOps, sino que "tenga éxito" entregando valor innegable a cada usuario
- **Permisos:** Lectura de telemetría comportamental + acceso a sandbox A/B
- **Dispositivo típico:** Desktop ultrawide (2560×1080) + tablet para pruebas cross-device
- **Rutas esperadas:** todas; foco en rutas con alto "Time-to-Value" (TTV)
- **Criterios de éxito:**
  - Empathy heatmap: visualización de dónde los usuarios experimentan fricción
  - Value chain tracker: monitorea cuánto tarda un nuevo tenant en su primera transacción exitosa
  - Iterative lab: sandbox para A/B testing de componentes antes de promover a core
  - Information architecture clarity: nuevo usuario ejecuta golden path en <3 clics con guided prompts
  - Engagement Probability Score calculado: $P(E|U) = \frac{\sum w_i \cdot x_i}{T_{total}}$
  - Privacy guardrail: research UX nunca expone PII
- **Criterios de fracaso:**
  - Sin telemetría comportamental (imposible medir fricción)
  - TTV > 5 minutos para nuevo tenant
  - Sin A/B testing capability
  - Golden path requiere >3 clics sin guided prompts
  - PII expuesta en logs de UX research

## Mapeo a reglas del boilerplate

- **P4** Sync atómica (telemetría UX debe estar sync con código)
- **W6** Persona Satisfied (cuando el TTV cumple objetivo)
- **Best Practice #94** Análisis de Fuerzas de Porter

## Fórmula de Engagement (referencia)

$$P(E|U) = \frac{\sum_{i=1}^{n} w_i \cdot x_i}{T_{total}}$$

Donde:
- $w_i$ = peso de la acción $i$
- $x_i$ = ocurrencias de la acción $i$
- $T_{total}$ = tiempo total de sesión

## Sinergia con Apprentice y Demo-Master

El Experience-Architect **diseña** los tours que el Apprentice **consume** y que
el Demo-Master **vende**. Los tres forman un trío que cierra el loop de onboarding:
- Experience-Architect decide qué pantallas necesitan tour y cómo medir éxito.
- El tour se implementa (widget canónico `OnboardingTour`).
- Apprentice lo usa y su éxito se mide como W6.
- Demo-Master lo muestra en demos sin fricción.
