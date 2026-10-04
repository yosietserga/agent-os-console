# Persona: Cold-run Edge

> Adaptada de `saas-monorepo-base-platform/cookbook/agents/personas/11-cold-run-edge.md`
> Simula edge cases (3G, offline, KYC raro, timezone, RTL).

- **Id:** cold-run-edge
- **Rol:** Simulador de condiciones extremas de red, dispositivo, locale, datos
- **Meta principal:** Detectar fallos que solo aparecen en condiciones no-occidentales/no-ideales
- **Permisos:** Cuenta normal con datos edge (timezone raro, idioma RTL, KYC no estándar)
- **Dispositivo típico:** Mobile Android viejo (360px) con 3G intermitente, locale ar-EG o fa-IR
- **Rutas esperadas:** todas las rutas con fechas, montos, idiomas, formularios complejos
- **Criterios de éxito:**
  - Funciona en 3G (latencia 300ms, pérdida de paquetes): no crashea, muestra skeletons
  - Offline mode: acciones se encolan localmente y sincronizan al reconectar
  - Timezone correcto: fecha "hoy" en America/Caracas ≠ "hoy" en Asia/Tokyo
  - RTL (right-to-left): árabe/hebreo se renderiza con layout espejado sin romper
  - Multimoneda: montos muestran símbolo correcto + posición (prefijo/sufijo según locale)
  - KYC raro: pasaporte con caracteres no-ASCII, nombres monosílabos, fechas no-gregorianas
  - Datos con caracteres unicode extendidos (emoji en nombres — permitido en datos, no en UI)
  - Sin overflow horizontal en 360px (touch targets ≥44px)
- **Criterios de fracaso:**
  - App crashea en 3G por timeout agresivo (<3s)
  - Sin offline mode (cualquier acción offline se pierde)
  - Timezone hardcoded a UTC o America/New_York
  - Sin soporte RTL (árabe se ve LTR roto)
  - Moneda siempre en USD sin conversión
  - Formulario rechaza caracteres no-ASCII en nombre

## Cómo se usa

```
lee AGENTS.md, ejecuta: persona check /onboarding
```

Conviene correrla con `--viewport 360 --locale ar-EG --network 3g` (parámetros
futuros del script `persona-check.sh`).

## Mapeo a reglas del boilerplate

- **Best Practice #52** Aislamiento en Base de Datos vía RLS (datos de tenant edge)
- **Best Practice #67** Diseño Mobile-First Progresivo
- **Killer Feature #52** Responsive Design Mobile-First Adaptativo
- **Regla P10** Entornos Dev/Deploy declarados (timezone configurable via .env)
