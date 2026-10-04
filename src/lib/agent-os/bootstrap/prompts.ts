// ════════════════════════════════════════════════════════════════════════
// prompts.ts — Constructores de prompts LLM del Instanciador Zero-Shot.
// Fase 1 (investigate + plan) y Fase 2 (generación de derivados) del
// Protocolo 11. Principios: cero conocimiento asumido del usuario (él solo
// sabe lo que quiere, no CÓMO), honestidad P2 (sin inventar cifras),
// P7 (cero emojis, cero placeholders) y formato fiel al boilerplate.
// ════════════════════════════════════════════════════════════════════════
import type { BootstrapSpec, ResearchItem } from "./types";

const STYLE_RULES = `Reglas inviolables de estilo:
- Escribe en español neutro profesional. Prohibido usar emojis (P7).
- Prohibido inventar cifras, nombres de productos, estadísticas o URLs que no
  estén en la evidencia provista (P2 Gate Honesty).
- Nunca dejes secciones "TODO", "placeholder" o texto de relleno (P7).`;

// ── Fase 1a: pre-spec (extraer dominio + queries de investigación) ───────

export function buildPreSpecPrompt(rawPrompt: string): { system: string; user: string } {
  return {
    system: `Eres el módulo de arranque en frío del Instanciador Agent OS (Protocolo 11, Fase 1).
Recibes el prompt crudo de un operador que NO tiene expertise técnico ni comercial
(y se asume que tampoco el modelo lo tiene del dominio). Tu único trabajo es derivar
el dominio del proyecto y las queries de investigación web que un equipo de expertos
ejecutaría ANTES de diseñar nada: mejores apps del nicho, mejores prácticas técnicas,
seguridad específica del dominio y modelos de negocio. ${STYLE_RULES}

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin texto alrededor):
{
  "domain": "<dominio técnico en kebab-case, ej. procesamiento-de-documentos>",
  "domainLabel": "<etiqueta humana del dominio, ej. Procesamiento de Documentos>",
  "searchQueries": ["<query 1>", "<query 2>", "<query 3>", "<query 4>", "<query 5>"]
}
Las 5 searchQueries deben cubrir: (1) mejores apps/líderes del nicho,
(2) mejores prácticas técnicas de desarrollo para ese tipo de app,
(3) seguridad y privacidad específica del dominio, (4) modelo de negocio/monetización,
(5) features diferenciadoras que los usuarios esperan. Máximo 70 caracteres por query.`,
    user: `Prompt crudo del operador:\n"""\n${rawPrompt}\n"""\n\nDeriva dominio y queries de investigación.`,
  };
}

// ── Fase 1b: spec completa (roles, goals, XML refactor, contexto §0) ─────

export function buildSpecPrompt(rawPrompt: string, research: ResearchItem[]): { system: string; user: string } {
  const researchDigest = research
    .map((r) => {
      const top = r.results.slice(0, 4).map((x) => `- ${x.title} (${x.url}): ${x.snippet.slice(0, 180)}`).join("\n");
      return `### Query: "${r.query}"\n${top || "(sin resultados — continuar con conocimiento general, sin citar fuentes)"}`;
    })
    .join("\n\n");

  return {
    system: `Eres el Orquestador de Expertos del Instanciador Agent OS (Protocolo 11, Fase 1).
Asumes automáticamente los roles críticos (Arquitecto de Software Senior, Product
Manager B2B, Auditor de Seguridad, Diseñador de Producto) para refactorizar el
prompt crudo de un operador sin expertise en una spec profesional. Trabajas SOLO
con el prompt y la evidencia de investigación provista. ${STYLE_RULES}

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin texto alrededor) con esta
estructura exacta:
{
  "projectName": "<Nombre de producto profesional, 2-5 palabras, en español>",
  "slug": "<kebab-case-ascii del nombre>",
  "domain": "<dominio kebab-case>",
  "oneLiner": "<qué es el producto en una frase de máximo 90 caracteres>",
  "description": "<2-3 párrafos: problema, solución propuesta, contexto de uso>",
  "targetUsers": ["<usuario/rol 1>", "<usuario/rol 2>", "<usuario/rol 3>"],
  "expertRoles": [{"role": "<Arquitecto de Software Senior>", "focus": "<su foco en este proyecto>"}, ...3-5 roles],
  "goals": ["<goal verificable G1..G5 derivado del prompt, formato: criterio medible>", ...4-6 goals],
  "stack": ["<tecnología recomendada con justificación breve>", ...4-6 items],
  "risks": ["<riesgo técnico o de producto concreto>", ...3-5 items],
  "securityNotes": ["<riesgo de seguridad específico del dominio y su mitigación>", ...3-5 items],
  "xmlPrompt": "<prompt del operador refactorizado con etiquetas XML: <contexto>, <problema>, <core_features> (5-8 features), <constraints>, <goals> — multi-línea, profesional>",
  "personaMapping": {"analyst": "<rol del dominio para esta persona>", "operator": "<...>", "executive": "<...>", "apprentice": "<...>", "experience-architect": "<...>", "demo-master": "<...>"},
  "agentsContextSection": "<markdown multi-línea para AGENTS.md, ver requisitos>"
}

REQUISITOS de agentsContextSection (se insertará como sección "Contexto del
Proyecto Instanciado" de AGENTS.md — es el condicionamiento conductual):
1. Empieza con "### Misión" (la misión del producto en 2-3 líneas).
2. "### Dominio y Glosario": 5-8 términos clave del dominio con definición de una línea.
3. "### Goals del Proyecto": lista numerada con los mismos goals del campo goals.
4. "### Roles de Expertos": lista de los expertRoles con su foco.
5. "### Personas del Dominio": tabla markdown con las 6 personas mapeadas (Id del boilerplate → rol del dominio → qué espera). Debe referenciar las rutas reales: \`docs/personas/analyst.md\`, \`docs/personas/operator.md\`, \`docs/personas/executive.md\`, \`docs/personas/apprentice.md\`, \`docs/personas/experience-architect.md\`, \`docs/personas/demo-master.md\` y \`docs/personas/cold-run/\`.
6. "### Catálogos de Condicionamiento": párrafo que referencie EXACTAMENTE estas rutas: \`docs/catalogs/100-best-practices.md\`, \`docs/catalogs/100-anti-patterns.md\`, \`docs/catalogs/100-killer-features.md\`.
7. "### Prompts de Dominio": referencia EXACTAMENTE \`docs/prompts/architecture.md\`, \`docs/prompts/domain.md\`, \`docs/prompts/stack.md\`.
8. "### Restricciones y Seguridad": riesgos clave y mitigaciones (de risks/securityNotes).
9. "### Reglas de Ejecución": 4-6 bullets de cómo el agente debe operar en ESTE proyecto (bucle goal-driven: investigar antes de asumir, verificar tras cada cambio, memoria append-only P9, auto-crítica P13, iterar hasta lograr los goals).
No incluyas el heading "##" de nivel 2 (se agrega programáticamente).`,
    user: `## Prompt crudo del operador\n"""\n${rawPrompt}\n"""\n\n## Evidencia de investigación web (Fase 1)\n${researchDigest}\n\nRefactoriza el prompt y produce la spec completa JSON.`,
  };
}

// ── Fase 2: catálogos (best-practices / anti-patterns / killer-features) ──

export type CatalogKind = "best-practices" | "anti-patterns" | "killer-features";

export function buildCatalogPrompt(kind: CatalogKind, spec: BootstrapSpec, research: ResearchItem[]): { system: string; user: string } {
  const researchDigest = research
    .flatMap((r) => r.results.slice(0, 3))
    .map((x) => `- ${x.title}: ${x.snippet.slice(0, 150)}`)
    .join("\n");

  const conf: Record<CatalogKind, { title: string; ask: string; format: string }> = {
    "best-practices": {
      title: "Catálogo de Mejores Prácticas",
      ask: `Genera el catálogo de mejores prácticas de desarrollo PARA ESTE PROYECTO
concreto. Mezcla prácticas universales de ingeniería con prácticas específicas del
dominio ("${spec.domain}") encontradas en la investigación. Cada entrada cita la regla
cardinal relacionada (P1-P15) cuando aplica: P1 Read-After-Edit, P2 Gate Honesty,
P3 Closes-Finding Guard, P4 Sync atómica, P5 Apple Light, P6 Layout 7 posiciones,
P7 Zero-Placeholder/Zero-Emoji, P8 LLM-Agnóstico, P9 Memoria append-only,
P10 Entornos declarados, P11 Onboarding Tour, P12 Sanitización, P13 Auto-crítica,
P14 Verificación headless, P15 Expected-first.`,
      format: `Formato (fiel al boilerplate):
# Catálogo de Mejores Prácticas — ${spec.projectName}

> Catálogo numerado y verificable. Cada entrada cita la regla cardinal (P1-P15)
> cuando aplica. Adaptado al dominio ${spec.domain} por el Instanciador Zero-Shot.

## Categoría 1: <nombre> (1-N)
1. **<Nombre de la práctica>:** <descripción de 1-2 líneas con el porqué>. **[P#]**
...

Organiza en 4-6 categorías de 6-10 entradas. TOTAL entre 30 y 40 entradas numeradas
consecutivamente.`,
    },
    "anti-patterns": {
      title: "Catálogo de Anti-Patrones",
      ask: `Genera el catálogo de anti-patrones (errores que este proyecto DEBE evitar)
para "${spec.domain}". Incluye anti-patrones universales de software y trampas
específicas del dominio que arruinan este tipo de productos. Cada entrada indica
qué previene y cómo detectarlo.`,
      format: `Formato (fiel al boilerplate):
# Catálogo de Anti-Patrones — ${spec.projectName}

> Anti-patrones numerados y verificables. La reincidencia se audita con
> \`audit memory\` (AGENTS.md §0). Adaptado al dominio ${spec.domain}.

## Categoría 1: <nombre> (AP-1..AP-N)
- **AP-1 · <Nombre>:** <qué es y por qué mata al proyecto>. **Detección:** <cómo se detecta>. **Prevención:** <regla/práctica que lo evita>.
...

Organiza en 4-6 categorías. TOTAL entre 25 y 35 anti-patrones numerados AP-1..AP-N.`,
    },
    "killer-features": {
      title: "Catálogo de Killer Features",
      ask: `Genera el catálogo de killer features (features diferenciadoras que los
usuarios de "${spec.domain}" esperan y que impresionan) priorizadas por impacto.
Basadas en la investigación y en los goals del proyecto. Marca la prioridad
(P0 crítica / P1 alta / P2 deseable) y a qué goal del proyecto sirve.`,
      format: `Formato (fiel al boilerplate):
# Catálogo de Killer Features — ${spec.projectName}

> Features priorizadas por impacto y trazadas a los goals del proyecto.
> Adaptado al dominio ${spec.domain} por el Instanciador Zero-Shot.

## <Categoría> (KF-1..KF-N)
- **KF-1 · <Feature> [P0]:** <qué hace y por qué encanta>. **Goal:** <G#>. **Complejidad:** <baja|media|alta>.
...

Organiza en 3-5 categorías. TOTAL entre 20 y 30 features numeradas KF-1..KF-N.`,
    },
  };

  return {
    system: `Eres el Generador de Catálogos de Condicionamiento del Instanciador Agent OS
(Protocolo 11, Fase 2). Los catálogos condicionan la conducta del LLM que
construirá el proyecto: son su memoria de referencia numerada y verificable.
${conf[kind].ask} ${STYLE_RULES}

${conf[kind].format}`,
    user: `## Proyecto
Nombre: ${spec.projectName} — ${spec.oneLiner}
Dominio: ${spec.domain}
Descripción: ${spec.description}
Goals: ${spec.goals.map((g, i) => `G${i + 1}. ${g}`).join("\n")}
Usuarios objetivo: ${spec.targetUsers.join(", ")}
Riesgos: ${spec.risks.join("; ")}

## Evidencia de investigación
${researchDigest || "(sin resultados web — usar expertise general del dominio sin citar fuentes)"}

Genera el catálogo completo en markdown. Sin texto antes ni después del documento.`,
  };
}

// ── Fase 2: personas core (6) y cold-run (4) adaptadas al dominio ────────

export function buildPersonasPrompt(spec: BootstrapSpec): { system: string; user: string } {
  return {
    system: `Eres el Generador de Personas del Instanciador Agent OS (Protocolo 11, Fase 2).
Adaptas las 6 personas core del boilerplate al dominio "${spec.domain}". Cada persona
es un perfil de usuario REAL de este producto, con criterios de éxito/fracaso
concretos y verificables. ${STYLE_RULES}

Formato EXACTO por archivo (fiel a docs/personas/ del boilerplate):

# Persona: <Nombre>

- **Id:** <id>
- **Rol:** <rol en el dominio>
- **Meta principal:** <qué quiere lograr>
- **Permisos:** <qué puede hacer en la app>
- **Dispositivo típico:** <disparidad de dispositivos real>
- **Rutas esperadas:** <rutas/flows críticos>
- **Criterios de éxito:** (3-5 bullets verificables)
- **Criterios de fracaso:** (3-5 bullets verificables)

## Cómo se usa

<párrafo: cómo el agente usa esta persona en cold runs y ui test>

Genera los 6 archivos SEPARADOS por marcadores EXACTOS (una línea con el marcador,
sin espacios extra):
===FILE: docs/personas/analyst.md===
===FILE: docs/personas/operator.md===
===FILE: docs/personas/executive.md===
===FILE: docs/personas/apprentice.md===
===FILE: docs/personas/experience-architect.md===
===FILE: docs/personas/demo-master.md===

Los Ids son FIJOS (analyst, operator, executive, apprentice, experience-architect,
demo-master) pero el Rol y todo el contenido se adapta al dominio según este mapeo:
${JSON.stringify(spec.personaMapping, null, 2)}`,
    user: `Proyecto: ${spec.projectName} — ${spec.oneLiner}
Dominio: ${spec.domain}. Descripción: ${spec.description}
Usuarios objetivo: ${spec.targetUsers.join(", ")}

Genera las 6 personas adaptadas, cada una con su marcador ===FILE:...===.`,
  };
}

export function buildColdRunPrompt(spec: BootstrapSpec): { system: string; user: string } {
  return {
    system: `Eres el Generador de Personas Cold-Run del Instanciador Agent OS (Protocolo 11,
Fase 2). Las 4 personas cold-run son simuladores de ataque/prueba que se trazan
mentalmente ANTES de dar por finalizada cualquier UI/feature (AGENTS.md §10.2).
Adapta cada simulador a los fallos REALES que un usuario podría sufrir en un
producto del dominio "${spec.domain}". ${STYLE_RULES}

Formato por archivo (fiel a docs/personas/cold-run/ del boilerplate):

# Persona: Cold-run <Nombre>

> Simulador de <qué simula>. <composición con personas core si aplica>.

- **Id:** cold-run-<id>
- **Rol:** <qué ataca/prueba>
- **Meta principal:** <qué debe detectar>
- **Permisos:** <restricciones del simulador>
- **Dispositivo típico:** <dispositivo/conexión adversa>
- **Rutas esperadas:** <flows críticos a atacar>
- **Criterios de éxito:** (3-5 bullets)
- **Criterios de fracaso:** (3-5 bullets)

## Cómo se usa

<párrafo>

Los 4 archivos SEPARADOS por marcadores EXACTOS:
===FILE: docs/personas/cold-run/adversario.md===
===FILE: docs/personas/cold-run/edge.md===
===FILE: docs/personas/cold-run/novato.md===
===FILE: docs/personas/cold-run/power.md===

- adversario: intenta romper la app maliciosamente (inputs hostiles, inyecciones,
  abuso de límites) — específico del dominio.
- edge: casos límite del dominio (archivos de 2GB, 0 items, caracteres unicode,
  conexiones interrumpidas — adaptados al producto).
- novato: primer contacto sin conocimiento técnico.
- power: usuario experto que exprime la app al límite con atajos y volumen.`,
    user: `Proyecto: ${spec.projectName} — ${spec.oneLiner}
Dominio: ${spec.domain}. Riesgos conocidos: ${spec.risks.join("; ")}
Seguridad: ${spec.securityNotes.join("; ")}

Genera las 4 personas cold-run adaptadas con sus marcadores ===FILE:...===.`,
  };
}

// ── Fase 2: prompts de dominio (architecture / domain / stack) ───────────

export function buildDomainPromptsPrompt(spec: BootstrapSpec): { system: string; user: string } {
  return {
    system: `Eres el Generador de Documentación de Dominio del Instanciador Agent OS
(Protocolo 11, Fase 2: "Rellenar la carpeta docs/prompts/*.md con las
instrucciones específicas para el nuevo stack y negocio"). ${STYLE_RULES}

Genera 3 archivos SEPARADOS por marcadores EXACTOS:
===FILE: docs/prompts/architecture.md===
Instrucciones para el Arquitecto: decisiones arquitectónicas del proyecto
(nombre, estructura de capas L1/L2/L3, contratos, modelo de datos conceptual,
integraciones externas necesarias, decisiones de escalado). Formato: secciones
"## Decisiones tomadas", "## Estructura de capas", "## Integraciones", "## Riesgos
arquitectónicos" (usa los risks de la spec).

===FILE: docs/prompts/domain.md===
Reglas de negocio del dominio "${spec.domain}": glosario, entidades principales,
flujos de negocio críticos, restricciones regulatorias/seguridad (usa
securityNotes), y qué NO debe hacer la app jamás. Formato: "## Glosario",
"## Entidades", "## Flujos críticos", "## Reglas inviolables".

===FILE: docs/prompts/stack.md===
Instrucciones del stack para "${spec.projectName}": la pila recomendada con
justificación (usa la spec), herramientas de verificación (lint/types/tests),
comandos de calidad, y el bucle de desarrollo agéntico (investigar → planear →
ejecutar → verificar → auto-criticar → iterar). Formato: "## Stack recomendado",
"## Justificación", "## Comandos de calidad", "## Bucle agéntico".

Cada archivo empieza con su heading "# ..." y referencia la sección "Contexto del
Proyecto Instanciado" de AGENTS.md.`,
    user: `Spec del proyecto:
Nombre: ${spec.projectName} — ${spec.oneLiner}
Dominio: ${spec.domain}
Descripción: ${spec.description}
Stack: ${spec.stack.join("; ")}
Goals: ${spec.goals.map((g, i) => `G${i + 1}. ${g}`).join("\n")}
Roles expertos: ${spec.expertRoles.map((r) => `${r.role} (${r.focus})`).join("; ")}

Genera los 3 archivos con sus marcadores ===FILE:...===.`,
  };
}

// ── Fase 2: README del proyecto instanciado ──────────────────────────────

export function buildReadmePrompt(spec: BootstrapSpec): { system: string; user: string } {
  return {
    system: `Eres el Generador de README del Instanciador Agent OS (Protocolo 11, Fase 2).
El README es la puerta de entrada del scaffold instanciado: explica QUÉ es el
producto, QUÉ es este scaffold (sistema de condicionamiento agéntico, NO la app
terminada) y CÓMO usarlo (clonar, abrir en el IDE, la capa de auto-activación
obliga a todo LLM a seguir AGENTS.md automáticamente). ${STYLE_RULES}

Estructura obligatoria:
# <projectName> — Agent OS Scaffold
> <oneLiner> · Instanciado con el Protocolo 11 (Zero-Shot Bootstrap).
## ¿Qué es esto? (2-3 párrafos: el producto deseado + que este repo NO es la app,
es el sistema nervioso agéntico que la construirá con conducta garantizada)
## ¿Qué contiene? (tabla de secciones clave con rutas reales: AGENTS.md,
docs/catalogs/, docs/personas/, docs/prompts/, docs/memory/, mcp/, packages/eval/)
## Cómo usarlo (3-4 pasos numerados: clonar → abrir en IDE favorito → la capa
bridge (.cursorrules / CLAUDE.md / etc.) auto-activa el workflow → pedir features
en lenguaje natural)
## El bucle agéntico (párrafo: investigar → planear → pre-report → ejecutar →
pro-report → auto-crítica → auto-aprendizaje → iterar hasta los goals)
## Goals del proyecto (lista G1..Gn)
## Reglas cardinales (tabla resumida P1-P15 con una línea cada una)`,
    user: `Spec: ${JSON.stringify({ projectName: spec.projectName, oneLiner: spec.oneLiner, description: spec.description, goals: spec.goals, domain: spec.domain, stack: spec.stack }, null, 2)}

Genera el README.md completo.`,
  };
}
