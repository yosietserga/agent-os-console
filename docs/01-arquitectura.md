# 01 · Arquitectura del Sistema

> [← Índice](README.md) · [Topología Viva →](02-topologia-viva.md)

## Visión general

El Agent OS Console es una aplicación **Next.js 16 (App Router)** con una única ruta visible (`/`) y un **mini-service de streaming** dedicado. La regla de oro del entorno: **un solo puerto expuesto** (:3000 vía gateway Caddy); todo lo demás se accede con el query param `XTransformPort`.

```mermaid
graph TB
    subgraph CLIENTE["🖥️ Navegador del operador"]
        UI["Ruta / · page.tsx<br/>3 vistas: Topología Viva · Kanban KPI · Consola"]
        HOOK["use-topology-live.ts<br/>socket.io-client"]
    end

    subgraph NEXT["⚡ Next.js 16 · puerto 3000 (vía gateway)"]
        API["API Routes /api/agent-os/*<br/>command · overview · memory · pre<br/>sentinel · radiografia"]
        LIB["src/lib/agent-os/<br/>commands · l2 · sentinel · github<br/>synthesize · pre-judge · radiografia<br/>gaps-finder"]
        TOPO["src/lib/topology/<br/>agent-workflow (22 nodos)<br/>types · colors"]
    end

    subgraph MINI["🔬 mini-services/topology-engine · puerto 3003"]
        ENG["TopologyEngine<br/>12 etapas · iteraciones reales"]
        INFR["inference.ts<br/>z-ai-web-dev-sdk"]
        DBR["db.ts<br/>bun:sqlite readonly"]
    end

    subgraph DATA["💾 Persistencia"]
        DB[("db/custom.db<br/>SQLite + Prisma")]
    end

    subgraph EXT["🌐 Externo"]
        ZAI["z-ai-web-dev-sdk<br/>GLM-4.6 · web_search"]
        GHA["GitHub REST API<br/>19 repos de referencia"]
    end

    UI -->|"fetch POST /api/agent-os/command"| API
    API --> LIB
    LIB --> DB
    LIB --> ZAI
    LIB --> GHA
    HOOK -.->|"io('/?XTransformPort=3003')"| ENG
    ENG --> DBR --> DB
    ENG --> INFR --> ZAI
    ENG -.->|"topo:snapshot · topo:node<br/>topo:transfer · topo:step<br/>topo:iteration · topo:kpi"| HOOK
```

## Decisiones de arquitectura

### 1. Ruta única, vistas internas

Solo `/` existe como ruta. Las tres vistas (Topología Viva, Kanban KPI, Consola Agent OS) son tabs internos — nada de routing adicional que fragmentar el estado.

### 2. Un puerto expuesto, gateway con `XTransformPort`

```mermaid
flowchart LR
    B[Navegador] -->|"GET /socket.io/?XTransformPort=3003"| C[Caddy]
    C -->|":3003"| M[topology-engine]
    B -->|"POST /api/agent-os/command"| C
    C -->|":3000"| N[Next.js]
    style C fill:#e8f4fd,stroke:#0071e3
```

- REST: rutas relativas (`/api/...`) — nunca URLs absolutas.
- WebSocket: `io("/?XTransformPort=3003")`, path **siempre** `/`.

### 3. El mini-service es de **solo lectura + inferencia**

`topology-engine` lee la BD (`bun:sqlite` readonly: CommandLog, Finding, CycleRun, MemoryEntry, CostLedgerEntry) y ejecuta inferencias L2 reales. **Nunca escribe** en la BD operativa — la observabilidad no muta el sistema observado.

### 4. LLM-agnóstico por diseño (Regla P8)

Ningún controlador de negocio importa SDKs de proveedores. Toda inferencia pasa por el [L2 Control Plane](06-gobernanza-l2.md) (`src/lib/agent-os/l2.ts`): sanitización P12 → sandwich capa 3 → ledger inmutable de costos.

## Stack técnico

| Capa | Tecnología | Rol |
|:--|:--|:--|
| Framework | Next.js 16 · React 19 · TypeScript 5 | App Router, ruta única |
| UI | Tailwind CSS 4 · shadcn/ui (New York) · Lucide | Paleta Apple Light inmutable (P5): `#ffffff` / `#f5f5f7` / `#1d1d1f` |
| Canvas | **D3 v7** (port de living-topology-visualizer) | Topología viva: partículas bezier, órbita/embudo |
| Estado | Zustand (cliente) · hooks dedicados | `use-topology-live` con dedupe idempotente |
| Animación | Framer Motion | Kanban KPI, transiciones |
| RT | **socket.io 4.8** (server :3003 + client) | Eventos `topo:*` |
| Datos | Prisma 6 + SQLite (`db/custom.db`) | 16 modelos, ledgers append-only |
| IA | **z-ai-web-dev-sdk** (backend only) | GLM-4.6 chat + web_search |
| Calidad | ESLint 9 · verificación headless (P14) | `bun run lint` exit 0 obligatorio |

## Estructura de carpetas relevante

```
src/
├── app/
│   ├── page.tsx                  # Ruta única: 3 vistas + footer sticky
│   ├── layout.tsx                # Metadata · fonts · Toaster
│   └── api/agent-os/
│       ├── command/route.ts      # POST — dispatcher de comandos
│       ├── overview/route.ts     # GET  — estado global (KPIs PSIM)
│       ├── memory/route.ts       # GET  — memoria empírica P9
│       ├── sentinel/route.ts     # GET  — hallazgos + ciclos (polling 2s)
│       ├── radiografia/route.ts  # GET  — pipeline rayos-x (polling 2s)
│       └── pre/route.ts          # GET  — proposals PRE-v2.0
├── components/
│   ├── topology-live/            # agent-canvas · live-panels · kanban-kpi-board
│   └── agent-os/                 # 10 paneles de la consola + tour + CTA
└── lib/
    ├── agent-os/                 # núcleo del sistema (ver docs 03-07)
    └── topology/                 # escenario: 22 nodos · 43 enlaces · colores

mini-services/topology-engine/    # :3003 — engine + inference + db readonly
prisma/schema.prisma              # 16 modelos
db/custom.db                      # SQLite
scripts/                          # seed · sync · audits · mejorate-scan
```

## Flujo de un comando (request → respuesta)

```mermaid
sequenceDiagram
    autonumber
    participant OP as Operador
    participant UI as Consola /
    participant API as POST /api/agent-os/command
    participant DSP as executeCommand()
    participant CMD as mejorate()/vigila()/...
    participant DB as SQLite
    participant SEN as Sentinela (background)

    OP->>UI: "lee AGENTS.md, ejecuta: mejorate"
    UI->>API: { input }
    API->>DSP: parseCommand(input)
    DSP->>DSP: strip prefijo canónico + prefijo IDE
    DSP->>CMD: switch por nombre canónico
    CMD->>DB: lecturas/escrituras reales
    CMD-->>DSP: output multilinea
    DSP->>DB: CommandLog.create (status OK|ERROR)
    DSP->>SEN: si ERROR del sistema → sentinelScan("AUTO_ON_ERROR")
    DSP-->>API: CommandResultDTO { output, status, durationMs, refresh, data }
    API-->>UI: { success, data }
    UI->>UI: render + refresh de paneles si refresh=true
```

> **Presupuesto de gateway (AP-032)**: todo comando debe responder en <25s. Los pipelines largos (radiografía, mejorate) corren en background o con concurrencia limitada; el frontend hace polling.
