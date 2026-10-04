# 02 · Topología Viva — El Workflow Agéntico Observable

> [← Arquitectura](01-arquitectura.md) · [Comandos →](03-comandos.md)

La topología viva es la materialización del repo del operador [`living-topology-visualizer`](https://github.com/yosietserga/living-topology-visualizer) portada a este sistema: un **canvas D3** donde cada nodo es un órgano real y **cada partícula es una transferencia de contexto real** (inferencia, dato, control o reporte).

## Las 5 capas y los 22 nodos

```mermaid
flowchart TB
    subgraph L0["🧊 Capa 0 · Contextualización (rose #fb7185)"]
        FR["FR · Arranque en Frío<br/>cero conocimiento mutuo"] --> REF["REF · Refinar"]
        REF --> RFA["RFA · Refactorizar"]
        RFA --> RMS["RMS · Remasterizar"]
        RMS --> XML["XML · Prompt XML<br/>prompt maestro"]
    end

    subgraph L1["🎛️ Capa 1 · Operación (violeta #a78bfa)"]
        OP["OP · Operador"] --> UI["UI · Consola"]
        UI --> API["API · Gateway"]
    end

    subgraph L2["🧠 Capa 2 · Orquestación (cian #22d3ee)"]
        DSP["DSP · Dispatcher"]
        SENT["SENT · Sentinela"]
        JZ["JZ · Juez PRE-v2.0"]
    end

    subgraph L3["🔁 Capa 3 · Ciclo Autónomo (verde #34d399) — 7 etapas"]
        DT["DT Detectar"] --> AN["AN Analizar"]
        AN --> INV["INV Investigar"]
        INV --> FIX["FIX Corregir"]
        FIX --> VER["VER Verificar"]
        VER --> CRI["CRI Criterios"]
        CRI --> REP["REP Reportar"]
    end

    subgraph L4["⚡ Capa 4 · Inferencia & Memoria (ámbar #fbbf24)"]
        L2C["L2 · Control Plane<br/>GLM-4.6 vía z-ai sdk"]
        MEM["MEM · Memoria P9"]
        BD["BD · SQLite"]
        DOC["DOC · Reportes Époch"]
    end

    API ==>|"prompt crudo"| FR
    XML ==>|"prompt maestro XML"| DSP
    DSP --> SENT --> DT
    INV & REP --> L2C
    DT & VER --> BD
    INV & CRI --> MEM
    REP --> DOC
    SENT -->|"resultado"| UI
```

**Regla de la capa 0 (el requisito del operador)**: el workflow arranca asumiendo que **el operador no sabe nada del tema y la IA tampoco**. Ese vacío se declara explícitamente (nodo FR) antes de operar — no hay conocimiento previo tácito.

## Canalización del prompt: crudo → XML

Cada transformación es una **inferencia L2 real** con chars y latencia medidos (visible como partículas violetas en el anillo rose):

```mermaid
flowchart LR
    C["📝 Prompt Crudo<br/>~110 chars<br/>'vigila el sistema a ver<br/>qué está fallando y arréglalo'"]
    R["✨ Refinado<br/>elimina ambigüedad<br/>bajo cero conocimiento mutuo"]
    RF["🧱 Refactorizado<br/>ROL · CONTEXTO · TAREA<br/>RESTRICCIONES · FORMATO"]
    RM["🏆 Remasterizado<br/>pasos numerados · cadena de<br/>razonamiento · criterios verificables<br/>· ejemplo · guardas anti-inyección"]
    X["📜 Prompt XML<br/>&lt;rol&gt; &lt;contexto&gt; &lt;tarea&gt;<br/>&lt;restricciones&gt; &lt;criterios_exito&gt; &lt;formato_salida&gt;"]
    C -->|"L2 · 0.7s"| R -->|"L2 · 0.9s"| RF -->|"L2 · 1.2s"| RM -->|"L2 · 2.3s"| X
    X ==>|"gobierna la investigación<br/>del ciclo (viaja en el user content)"| INV[INV · Investigar]
```

- **Fallback honesto**: si una inferencia falla, `deterministicXml()` ensambla el XML localmente y la etapa se marca como no-L2 (P2).
- El **prompt maestro XML gobierna de verdad** la etapa *investigar*: viaja completo en el user content de la inferencia L2 del ciclo.

## La iteración completa: 12 pasos

Una iteración del motor (botón *Iterar x1* / *x3* / *Continuo*) ejecuta **12 pasos** con datos reales:

```mermaid
sequenceDiagram
    autonumber
    participant E as TopologyEngine (:3003)
    participant FR as Capa 0
    participant L2 as L2 (z-ai)
    participant C as Ciclo (7 etapas)
    participant DB as SQLite (readonly)

    E->>FR: 1. arranque en frío (coldStart declarado)
    FR->>L2: 2-5. refinar → refactorizar → remasterizar → XML (4 inferencias)
    L2-->>FR: chars medidos + latencia por etapa
    E->>C: prompt maestro XML → dispatcher → sentinela
    C->>DB: 6. detectar (errores reales del CommandLog)
    C->>C: 7. analizar (causa raíz determinista)
    C->>L2: 8. investigar (memoria P9 + prompt XML)
    C->>C: 9. corregir (plan 3 roles §4.2)
    C->>DB: 10. verificar (gate honesty)
    C->>C: 11. criterios posteriores (gaps-finder, CAs)
    C->>L2: 12. reportar (síntesis + veredicto AGREE/DISAGREE/MIXED)
```

Métricas típicas verificadas en vivo: **39 transferencias · 9.5 KB de contexto · 6 inferencias L2 reales · ~30s** por iteración.

## Tipos de transferencia (partículas)

| Tipo | Color | Qué viaja | Ejemplo |
|:--|:--|:--|:--|
| `inference` | Violeta | Payload de inferencia L2 (chars in/out medidos) | `refinar → l2glm` (872→278 chars, 788ms) |
| `data` | Cian | Lecturas/escrituras de BD | `detectar → bd` |
| `control` | Gris | Señales de orquestación | `sentinela → detectar` |
| `report` | Verde | Reportes y memoria | `reportar → reportes` |

## Protocolo socket.io (`topo:*`)

```
Cliente → io("/?XTransformPort=3003")     (path SIEMPRE "/")
Server → topo:snapshot  { nodes, layers, links, iterations, kpis, findings, engine }
Server → topo:node      { id, status }            // activación/desactivación con pulso
Server → topo:transfer  { id, kind, charsIn?, charsOut?, latencyMs? }
Server → topo:step      { iterationId, step, status }
Server → topo:iteration { iteration }             // incluye promptStages[5] + coldStart
Server → topo:kpi       { kpi }                   // 12 contadores + veredictos
Server → topo:findings  { findings }
Server → topo:log       { level, message }
Cliente → topo:control  { action: run|x3|continuous|pause|resume|stop, paceMs? }
```

Controles de ritmo: **Lento / Normal / Rápido** (pausas entre iteraciones) · **Órbita / Embudo** (geometría del canvas) · foco de nodo con clic (ESC para salir).

## KPIs del tablero Kanban

8 tarjetas KPI con flash en cambio + kanban de iteraciones (14 columnas: En Cola + 12 etapas + Completadas) + kanban de hallazgos reales por lifecycle + sección "Canalización del Prompt — Crudo → XML" con las 5 tarjetas (chars, latencia L2, preview mono del XML, banner de arranque en frío).
