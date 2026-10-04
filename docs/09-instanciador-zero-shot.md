# 09 · Instanciador Zero-Shot (Protocolo 11)

> **Versión documentada**: v2.1.0 · Ruta: `/` → tab **Instanciador** · API: `/api/agent-os/bootstrap*`
> **Motor**: Protocolo 11 *Zero-Shot Project Bootstrap* del [agent-os-boilerplate](https://github.com/yosietserga/agent-os-boilerplate) (v1.10)

El Instanciador convierte la consola Agent OS en un **generador de scaffolds de condicionamiento conductual**. El operador describe la app que desea en un input tipo chatbot ("cuéntame qué app deseas crear") y el sistema **no genera la app**: genera `AGENTS.md` y todos los archivos derivados e interconectados que garantizan que cualquier LLM/SLM (Claude, GPT, Gemini, Cursor, Copilot…) que consuma el scaffold siga el workflow agéntico diseñado — ajustado al tópico del proyecto ingresado. La entrega es un **ZIP** con MANIFEST verificable.

## 1 · Qué hace (y qué no hace)

| Hace | No hace |
|:--|:--|
| Investiga el dominio del prompt (web search real, zero-knowledge) | No construye la app del proyecto |
| Refactoriza el prompt crudo a XML con roles de expertos | No inventa fuentes ni cifras (P2) |
| Genera catálogos, personas y prompts adaptados al dominio | No reescribe la constitución AGENTS.md (la instancia) |
| Ensambia constitución inmutable + contexto del proyecto | No deja archivos huérfanos (verificación de interconexiones) |
| Empaqueta 114+ archivos en ZIP con sha256 por archivo | No requiere que el operador sepa nada técnico |

## 2 · El bucle agéntico completo del pipeline

Cada instanciación recorre el mismo bucle agéntico que rige todo el sistema: **investigar → planear → pre-report → ejecutar → pro-report → auto-crítica**, con degradación honesta (P2) en cada fase.

```mermaid
flowchart TD
    OP[Operador: prompt crudo<br/>'crea una app para...'] --> POST[POST /api/agent-os/bootstrap]
    POST --> RUN[(BootstrapRun<br/>status=PENDING)]
    POST -.->|background| PIPE[runBootstrapPipeline]

    subgraph F1 [FASE 1 · RESEARCHING — zero-knowledge]
        PRE[pre-spec L2:<br/>dominio + 5 queries] --> WS[web_search × 5<br/>hasta 25 fuentes reales]
    end

    subgraph F2 [FASE 2 · PLANNING — roles + goals + XML]
        SPEC[spec L2: nombre, one-liner,<br/>roles de expertos, goals G1-Gn,<br/>stack, riesgos, prompt XML,<br/>mapeo de personas] --> PREREP[docs/reports/&lt;epoch&gt;-bootstrap-pre.md]
    end

    subgraph F3 [FASE 3 · GENERATING — derivados interconectados]
        CAT[3 catálogos L2:<br/>best-practices · anti-patterns · killer-features]
        PER[10 personas L2:<br/>6 core + 4 cold-run]
        DOM[3 prompts de dominio L2:<br/>architecture · domain · stack]
        README[README.md L2]
        AGENTS[AGENTS.md ensamblado:<br/>constitución inmutable +<br/>sección de contexto del proyecto]
        BRIDGE[16 puentes IDE con<br/>PROYECTO INSTANCIADO inyectado]
        STATIC[65+ archivos universales:<br/>gobernanza, L2, MCP, eval, scripts]
        MEM[memoria P9 init:<br/>MEMORY · worklog · wins · state.json]
    end

    subgraph F4 [FASE 4 · VERIFYING — auto-crítica determinista]
        CHECKS[8 checks: constitución íntegra,<br/>contexto presente, catálogos >1KB,<br/>10 personas, interconexión de rutas,<br/>16 puentes, cero vacíos, archivos L2]
        PROREP[docs/reports/&lt;epoch&gt;-bootstrap-pro.md<br/>veredicto PASS / PASS_WITH_NOTES]
    end

    F5[FASE 5 · PACKAGING] --> DONE[(status=COMPLETED<br/>progress=100)]
    DONE --> ZIP[GET /download<br/>ZIP + MANIFEST.json sha256]

    PIPE --> F1 --> F2 --> F3 --> F4 --> F5
    F1 -.->|fallo L2| DEG1[queries del prompt<br/>declarado en notas]
    F3 -.->|fallo L2| DEG2[catalogo/persona degradado<br/>encabezado honesto]
    F4 -.->|checks fallidos| NOTES[veredicto PASS_WITH_NOTES<br/>con evidencia]
    PIPE -.->|excepción| ERR[(status=ERROR<br/>error registrado)]
```

**Degradación honesta (P2)**: si L2 o web_search fallan en cualquier fase, el pipeline no aborta la instanciación — inserta un *fallback declarado* (ej. catálogo con encabezado "VERSIÓN DEGRADADA") y lo lista en las notas del pro-report. Jamás inventa contenido.

## 3 · Secuencia end-to-end (operador → ZIP)

```mermaid
sequenceDiagram
    actor OP as Operador
    participant UI as Instanciador (tab)
    participant API as POST /api/agent-os/bootstrap
    participant DB as SQLite (BootstrapRun/File)
    participant L2 as L2 Control Plane (GLM-4.6)
    participant WEB as web_search (z-ai)
    participant ZIP as JSZip

    OP->>UI: "crea una app para procesar múltiples archivos y combinarlos todos dentro de un pdf"
    UI->>API: { prompt }
    API->>DB: BootstrapRun.create(status=PENDING)
    API-->>UI: { runId } (pipeline en background)
    API->>L2: pre-spec → dominio + 5 queries
    L2-->>API: { domain, searchQueries }
    loop 5 queries
        API->>WEB: web_search(query, 5)
        WEB-->>API: hasta 25 fuentes reales
    end
    API->>L2: spec completa (roles, goals, XML, personas, contexto §AGENTS)
    L2-->>API: BootstrapSpec JSON
    API->>DB: specJson + docs/reports/<epoch>-bootstrap-pre.md
    loop 7 llamadas L2 (catálogos ×3, personas ×2, prompts dominio, README)
        API->>L2: generador de derivados
        L2-->>API: markdown con marcadores ===FILE:...===
        API->>DB: BootstrapFile.create(origin=llm)
    end
    API->>DB: AGENTS.md (ensamblado) + 16 bridges + estáticos + memoria init
    API->>API: 8 checks deterministas → pro-report (veredicto)
    API->>DB: status=COMPLETED, progress=100
    loop polling cada 1.8s
        UI->>API: GET /bootstrap/<id>
        API-->>UI: fase, progreso, archivos en vivo
    end
    OP->>UI: clic "Descargar scaffold (.zip)"
    UI->>ZIP: GET /bootstrap/<id>/download
    ZIP-->>OP: agent-os-<slug>.zip (raíz <slug>/ + MANIFEST.json)
```

## 4 · Modelo de datos (2 tablas nuevas)

```mermaid
erDiagram
    BootstrapRun ||--o{ BootstrapFile : "contiene"
    BootstrapRun {
        string id PK "cuid"
        string prompt "prompt crudo del operador"
        string projectName "derivado por L2"
        string slug "kebab-case (raiz del ZIP)"
        string status "PENDING|RESEARCHING|PLANNING|GENERATING|VERIFYING|PACKAGING|COMPLETED|ERROR"
        int progress "0-100"
        string phaseDetail "detalle humano de la fase"
        string researchJson "fuentes web (Fase 1)"
        string specJson "BootstrapSpec (Fase 2)"
        int fileCount
        int llmCalls "auditoria del ledger L2"
        int durationMs
        string error "P2: registrado, nunca silencioso"
    }
    BootstrapFile {
        string id PK "cuid"
        string runId FK
        string path "ruta relativa en el scaffold"
        text content
        int bytes
        string origin "llm|template|static"
        string phase "fase que lo produjo"
    }
```

El ledger de costos (`CostLedgerEntry`) audita cada llamada L2 del pipeline con propósito `bootstrap-*` (tenant `agent-os-instancer`).

## 5 · Origen de cada archivo del scaffold (ejemplo real: Fusionador de Documentos)

Ejecución verificada del prompt de ejemplo — 114 archivos, 65.8 KB de constitución, 17 archivos L2, 23 fuentes:

```mermaid
pie showData title Origen de los 114 archivos del scaffold
    "Estáticos universales (gobernanza/L2/MCP/eval/scripts)" : 65
    "Puentes IDE (template + proyecto inyectado)" : 16
    "Memoria/reports/templates (pre, pro, research, P9 init)" : 13
    "Generados por L2 (catálogos, personas, prompts, README)" : 17
    "Otros (.gitkeep, README.md)" : 3
```

```text
fusionador-documentos/
├── AGENTS.md                    ← constitución inmutable + "Contexto del Proyecto Instanciado"
├── README.md                    ← L2: puerta de entrada del scaffold
├── MANIFEST.json                ← sha256 por archivo + stats (generado en el ZIP)
├── CLAUDE.md · CLAUDE-CODE.md · CODEX.md · COPILOT-INSTRUCTIONS.md · CURSOR-RULES.md
│   GEMINI.md · opencode.md · .cursorrules · .clinerules · .windsurfrules
│   .cursor/ .github/ .roo/ .trae/ .antigravity/ .zcode/
│                                ← 16 puentes IDE con "PROYECTO INSTANCIADO" inyectado (Fase 3)
├── docs/
│   ├── catalogs/100-best-practices.md      ← L2: prácticas del dominio citando P1-P15
│   ├── catalogs/100-anti-patterns.md       ← L2: trampas del dominio con detección/prevención
│   ├── catalogs/100-killer-features.md     ← L2: features priorizadas trazadas a goals
│   ├── personas/{analyst,operator,executive,apprentice,experience-architect,demo-master}.md
│   │                            ← L2: 6 personas mapeadas a roles del dominio
│   ├── personas/cold-run/{adversario,edge,novato,power}.md
│   │                            ← L2: 4 simuladores de ataque adaptados
│   ├── prompts/{architecture,domain,stack}.md   ← L2: instrucciones del negocio
│   ├── research/<ts>-bootstrap-research.md ← evidencia Fase 1 (23 fuentes reales)
│   ├── reports/<epoch>-bootstrap-pre.md    ← plan ANTES de ejecutar
│   ├── reports/<epoch>-bootstrap-pro.md    ← veredicto + auto-crítica TRAS ejecutar
│   ├── memory/{MEMORY,worklog,wins-ledger}.md + state.json  ← P9 init en cero honesto
│   └── governance/ · l2-control-plane/ · security/ · patterns/ · polyglot/ …
│                                ← estáticos universales heredados
├── mcp/servers/ + mcp/skills/   ← 7 servidores MCP + 8 skills empaquetadas
├── packages/eval/               ← juez determinista PRE-v2.0 (S = 100×Σ(wi·Di))
└── scripts/                     ← 18 scripts operativos (investiga, critica, vigila…)
```

## 6 · Inyección en AGENTS.md (constitución + contexto)

`assembleAgentsMd()` **jamás reescribe** la constitución (estructura inmutable, Protocolo 11 Fase 2). Inserta dos cosas:

1. Línea de proyecto en el encabezado (tras la cita de apertura).
2. Sección `## Contexto del Proyecto Instanciado (Protocolo 11)` justo después del primer separador — es el condicionamiento conductual: misión, glosario, goals G1-Gn, roles de expertos, tabla de personas mapeadas, catálogos, prompts de dominio, restricciones de seguridad y reglas de ejecución del bucle.

```diff
 > **Versión:** 1.0.0 — Actualizada 2026-10-02
+> **PROYECTO INSTANCIADO:** Fusionador de Documentos — Herramienta profesional para combinar múltiples archivos en un único PDF
+> Instanciado por el Instanciador Zero-Shot (Protocolo 11) el 2026-10-04.

 ---

+## Contexto del Proyecto Instanciado (Protocolo 11)
+
+### Misión
+Proporcionar una herramienta profesional y segura que permita a los usuarios
+combinar múltiples archivos de diferentes formatos en un único documento PDF…
+
+### Goals del Proyecto
+1. Procesar al menos 10 formatos de archivo diferentes
+2. Combinar documentos en menos de 30 segundos para archivos de hasta 100MB
+…
+
+## 0. Directorio de Comandos Operativos   ← la constitución sigue intacta
```

Los 16 puentes IDE reciben el mismo bloque vía `bridgeContent()` — Protocolo 11 Fase 3 (*Zero-Prompt Workflow*): a partir de ese momento **todo prompt del operador pasa automáticamente por el workflow agéntico completo**, sin referenciar AGENTS.md en cada mensaje.

## 7 · Auto-crítica: los 8 checks del pro-report

| # | Check (determinista) | Umbral | Ejemplo real verificado |
|:--|:--|:--|:--|
| 1 | AGENTS.md constitución íntegra | > 15,000 bytes | PASS — 65,775 bytes |
| 2 | AGENTS.md contextualizado | sección + nombre de proyecto | PASS |
| 3-5 | Catálogos ×3 | ≥ 1,000 bytes c/u | PASS — 7,081 / 9,578 / 5,573 bytes |
| 6 | Personas del dominio | ≥ 6 de 10 vía L2 | PASS — 10/10 |
| 7 | Interconexión de rutas | toda `docs/**.md` referenciada existe | PASS — 6/6 |
| 8 | Puentes IDE | 16/16 con proyecto inyectado | PASS — 16/16 |
| + | Cero archivos vacíos | excluye `.gitkeep` | PASS (tras fix) |
| + | Archivos LLM | ≥ 10 | PASS — 17 |

Veredictos: `PASS` (0 fallos) · `PASS_WITH_NOTES (N)` — nunca se emite PASS sin evidencia (P2).

## 8 · API

| Endpoint | Método | Descripción |
|:--|:--|:--|
| `/api/agent-os/bootstrap` | `POST` | `{ prompt }` (10-2000 chars) → `{ runId }`; dispara el pipeline en background |
| `/api/agent-os/bootstrap` | `GET` | Historial (últimos 10 runs) |
| `/api/agent-os/bootstrap/[id]` | `GET` | Estado completo + spec + research + árbol de archivos; `?path=` devuelve el contenido de un archivo (preview) |
| `/api/agent-os/bootstrap/[id]/download` | `GET` | ZIP (solo si COMPLETED; 409 en otro caso) — raíz `<slug>/` + `MANIFEST.json` |

## 9 · Comportamiento ante fallos (P2 verificado en vivo)

| Fallo | Comportamiento |
|:--|:--|
| L2 caído en pre-spec | Queries derivadas del prompt crudo; nota honesta en el pro-report |
| web_search sin resultados | Sintetiza con conocimiento general **sin citar fuentes**; "(sin resultados — P2)" en research.md |
| L2 caído en un catálogo/persona | Archivo degradado con encabezado "VERSIÓN DEGRADADA (P2)"; el resto del scaffold sigue |
| Excepción del pipeline | `status=ERROR` con mensaje; el UI muestra el error (nada muere en el log) |
| Descarga antes de COMPLETED | HTTP 409 con estado y progreso actuales |

## 10 · Trazabilidad con la constitución

| Regla | Aplicación en el instanciador |
|:--|:--|
| P1 Read-After-Edit | El pro-report re-lee los archivos de la BD para los checks (no confía en memoria) |
| P2 Gate Honesty | Veredictos con evidencia; degradaciones declaradas; sin fuentes inventadas |
| P4 Sync atómica | Toda ruta referenciada en AGENTS.md existe en el ZIP (check 7) |
| P7 Zero-Placeholder | Cero archivos vacíos (excluye `.gitkeep`); prompts LLM prohíben TODO/placeholder |
| P8 LLM-Agnóstico | Todo vía Control Plane L2 (`infer()`/`webSearch()`); scaffold compatible con 10+ LLMs |
| P9 Memoria append-only | MEMORY/worklog/wins-ledger/state.json inicializados en cero honesto |
| P13 Auto-crítica | 8 checks deterministas post-generación |
| P15 Expected-first | El pre-report declara los criterios de verificación ANTES de generar |

---

*Documento generado en la iteración del Instanciador Zero-Shot (v2.1.0). Ejecución de referencia: run "Fusionador de Documentos" (114 archivos, 23 fuentes, 17 archivos L2, veredicto PASS_WITH_NOTES 1 check → .gitkeep corregido).*
