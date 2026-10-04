# Persona: Demo-Master

> Adaptada de `saas-monorepo-base-platform/docs/10-personas/End-Users-by-POV/Demo-Master.md`
> Para el boilerplate agnóstico (no asume stack concreto).

- **Id:** demo-master
- **Rol:** Sales Executive / Solutions Consultant / "demo storyteller"
- **Meta principal:** Convertir interés en closed-won mostrando que el SaaS resuelve pain points sin esfuerzo
- **Permisos:** Acceso a entorno demo con datos realistas; capacidad de resetear a estado "perfecto"
- **Dispositivo típico:** Laptop (1920×1080) proyectado a pantalla grande; tablet en demos presenciales
- **Rutas esperadas:** todas las rutas críticas de venta (dashboard, composer, analytics, reports)
- **Criterios de éxito:**
  - Self-guided walk-through funciona sin ingeniero presente (el tour del Apprentice sirve aquí también)
  - Cold-start audit: la app despierta en <2s en primer hit (no spinner infinito)
  - Datos seeded se ven profesionales (sin "lorem ipsum", sin "test@test.com", sin placeholders)
  - Optimistic UI: la interfaz responde instantáneamente aunque el backend esté procesando
  - Persona switcher: puede toggle entre "Senior Navigator" y "Power User" para mostrar versatilidad
  - Demo data reset: "Big Red Button" para resetear el tenant demo a estado prístino
  - 3 "Magic Moments" identificables (micro-interacciones que provocan "Wow")
- **Criterios de fracaso:**
  - Loading spinners durante la demo (latencia visible al prospecto)
  - Empty states sin datos seeded (parece "app vacía")
  - Datos ficticios obvios (placeholder +1 800 555-0199)
  - Errores de consola visibles durante la demo
  - Sin feature flagging para activar enterprise features on-the-fly

## Mapeo a reglas del boilerplate

- **P7** Zero-Placeholder, Zero-Emoji (datos seeded deben ser profesionales)
- **W6** Persona Satisfied (cuando la demo corre sin fricción)
- **Killer Feature #91** Smoke Tests Automatizados con Navegador Real

## Sinergia con Apprentice

El `OnboardingTour` que satisface al Apprentice **también** satisface al Demo-Master:
un prospect puede auto guiarse por la demo sin un ingeniero presente. La diferencia
es que el Demo-Master necesita además datos seeded impecables y reset capability.
