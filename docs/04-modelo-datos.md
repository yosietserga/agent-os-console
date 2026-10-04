# 04 · Modelo de Datos

> [← Comandos](03-comandos.md) · [Ciclo de Calidad →](05-ciclo-calidad.md)

SQLite vía Prisma (`prisma/schema.prisma` → `db/custom.db`). Principio rector: **memoria empírica append-only (P9)** — los ledgers nunca se mutan, solo se anexan.

## Diagrama Entidad-Relación

```mermaid
erDiagram
    CardinalRule {
        string id PK
        string code UK "P1..P15, W-CTA"
        string title
        string description
        string severity "RED | YELLOW"
        int order
    }
    CommandDef {
        string name UK
        string aliases
        string action
        string methodology
        int order
    }
    MemoryEntry {
        string id PK
        string type "AP | WIN | WORKLOG | FEEDBACK | USER | PROJECT | REFERENCE"
        string code UK "AP-001, WIN-001"
        string title
        string content
        string winClass "W1..W8"
        string severity "CRITICA | ALTA | MEDIA"
        int epoch
    }
    ReferenceRepo {
        string repo UK "owner/name"
        string category
        string role
        int stars
        string topDirs "JSON"
        string keyFiles "JSON {path,size}"
        datetime lastScannedAt
    }
    ScanRun {
        string mode "scan | synthesize"
        int reposScanned
        int totalStars
        string status "RUNNING | COMPLETED | FAILED"
        string note
    }
    ExtractedPattern {
        string scanRunId FK
        string repo
        string pattern
        string evidence
    }
    AdoptionProposal {
        string title
        string type "BP|AP|KILLER|SKILL|WIDGET|MCP"
        string origin
        float d1 "Compilacion (0.20)"
        float d2 "Contratos (0.15)"
        float d3 "Pipeline (0.20)"
        float d4 "Casos ocultos (0.20)"
        float d5 "Tokens (0.10)"
        float d6 "Arquitectura (0.15)"
        float deltaS
        string verdict
    }
    PsimState {
        string version
        int epoch
        float k1 "P0P1 Closure >= 0.90"
        float k2 "Mock Reduction"
        float k3 "Finding Half-Life <= 2"
        float k4 "Capability >= 1/iter"
        float k5 "Gate Stability"
        int w1
        int w8
    }
    L2Model {
        string name UK
        string tier "FRONTIER|GENERAL|FAST_CHEAP|SLM"
        string role "PRIMARY|FALLBACK|ESCALATION"
        string status "CLOSED|OPEN|HALF_OPEN"
        float failRate
    }
    CostLedgerEntry {
        string model
        string tenant
        string purpose
        int promptTokens
        int completionTokens
        float costUsd
        int latencyMs
        string outcome "OK | FALLBACK | ERROR"
    }
    CommandLog {
        string command
        string args
        string output
        string status "OK | ERROR"
        int durationMs
    }
    RadiografiaRun {
        string targetUrl
        int phase "0..5"
        string brandTokens "JSON"
        string domStructure "JSON"
        string businessModel "JSON"
        string verification "JSON AGREE/DISAGREE"
    }
    Report {
        int epoch
        string verdict "AGREE | DISAGREE | MIXED"
        string content
    }
    Finding {
        string sourceRef UK "cmd:|radio:|l2:|budget:"
        string source "COMMAND_LOG|RADIOGRAFIA|L2_LEDGER|GATEWAY_BUDGET"
        string severity "CRITICAL|HIGH|MEDIUM|LOW"
        string evidence "JSON append-only P9"
        string status "DETECTED..RESOLVED"
    }
    CycleRun {
        string trigger "AUTO_ON_ERROR|SENTINEL_SCAN|MANUAL"
        string findingId FK UK
        string stages "JSON [{name,status,durationMs,evidence}]"
        int reportEpoch
    }
    WorkflowRun {
        string prompt "prompt inicial del operador (inmutable)"
        string topic "tema extraído del prompt — binding de artefactos"
        string status "RUNNING|COMPLETED|PAUSED|FAILED"
        int iteration
        int maxIterations
        string stages "JSON etapas de la iteración corriente"
        string handoff "JSON {resumen,aprendido,pendientes,siguiente}"
    }
    Goal {
        string runId FK
        string code "G1, G2..."
        string acceptance "criterio verificable"
        string status "PENDING|IN_PROGRESS|ACHIEVED|BLOCKED"
        string evidence "evidencia del logro"
    }
    TaskStep {
        string runId FK
        string goalCode "G1..."
        int iteration
        int order
        string kind "INVESTIGATE|ANALYZE|VERIFY|PROPOSE|REPORT"
        string status "PENDING|RUNNING|DONE|FAILED|OUT_OF_SCOPE"
        string output "evidencia por tarea"
    }

    ScanRun ||--o{ ExtractedPattern : "produce"
    Finding ||--o| CycleRun : "abre ciclo"
    WorkflowRun ||--o{ Goal : "deriva del prompt"
    WorkflowRun ||--o{ TaskStep : "plan por iteración"
```

## Grupos funcionales

### Constitución (`CardinalRule`, `CommandDef`)
Semilla del boilerplate upstream (`scripts/seed-agent-os.ts` + syncs v1.8.0/v1.9.0/v2.0.0). 15 reglas P1-P15 + W-CTA y los 19 comandos con metodología.

### Memoria empírica P9 (`MemoryEntry`)
Append-only: APs (anti-patrones con severidad), WINs (clases W1-W8), WORKLOG, REFERENCE (research). `@@index([type, createdAt])` para consultas por tipo.

### Mejorate (`ReferenceRepo`, `ScanRun`, `ExtractedPattern`, `AdoptionProposal`)
El catálogo de 19 repos de radiografía (1.2M★) con `lastScannedAt` — **la columna que ata la síntesis al epoch** (AP-034: solo repos con `lastScannedAt ≥ scan.startedAt` son base honesta).

### Gobernanza (`AdoptionProposal`, `PsimState`)
Las 6 dimensiones D1-D6 con pesos del [juez PRE-v2.0](06-gobernanza-l2.md) persistidas por proposal + el snapshot PSIM de KPIs.

### Observabilidad (`CommandLog`, `CostLedgerEntry`, `Finding`, `CycleRun`, `Report`, `RadiografiaRun`)
Las cuatro fuentes de evidencia del sentinela + el ledger de costos de cada inferencia L2 (tokens, USD, latencia, outcome) + reportes époch inmutables.

### Bucle Agéntico Goal-Driven (`WorkflowRun`, `Goal`, `TaskStep`) — v2.0.0
El orquestador del [comando `bucle`](08-verificacion-bucle.md): `WorkflowRun` guarda el prompt inicial inmutable + el tema (binding de artefactos) + el handoff entre iteraciones; `Goal` los objetivos derivados del prompt con criterio de aceptación y evidencia; `TaskStep` el plan de pasos y tareas por iteración con output por tarea. PAUSED = reanudable con `bucle continúa` (bucle infinito entre invocaciones).

## Convenciones

- Primitivas simples solamente (los JSON van como `String` serializado — restricción del proyecto).
- Todo timestamp: `DateTime @default(now())`; epochs Unix para reportes.
- `Finding.sourceRef` **único** → deduplicación natural de hallazgos por fuente.
