# 05 · Ciclo Autónomo de Calidad — El Sentinela

> [← Modelo de Datos](04-modelo-datos.md) · [Gobernanza y L2 →](06-gobernanza-l2.md)

**AP-031 (erradicado en v1.9.0)**: antes, cuando un comando fallaba o un pipeline entraba en FAILED, la falla quedaba en el log y **nadie la procesaba** — el operador humano era el detector de fallas del sistema. Ahora el sentinela (comando canónico 18º `vigila`) garantiza: *ninguna falla muere en el log*.

## Fuentes de evidencia y disparadores

```mermaid
flowchart TB
    subgraph SRC["🔍 Fuentes de evidencia (scan)"]
        CL["CommandLog<br/>status=ERROR"]
        RG["RadiografiaRun<br/>status=FAILED"]
        L2L["CostLedgerEntry<br/>outcome=ERROR"]
        GB["Presupuesto gateway<br/>>25s (AP-032)"]
    end

    subgraph TRG["⚡ Disparadores"]
        M["MANUAL — comando vigila"]
        S["SENTINEL_SCAN — programático"]
        A["AUTO_ON_ERROR — al fallar cualquier<br/>comando del sistema (excl. vigila<br/>para evitar recursión)"]
    end

    SRC --> CLA{Clasificador<br/>determinista}
    TRG --> SCAN["sentinelScan()"]
    SCAN --> CLA
    CLA -->|"input inválido del operador"| ND["NO_DEFECT (LOW)<br/>respuesta correcta del sistema<br/>— sin ciclo"]
    CLA -->|"firma AP-033 (subarg conocido)"| D["Defecto MEDIUM"]
    CLA -->|"error de sistema / 504 / >25s"| H["Defecto HIGH/MEDIUM"]
    D & H --> F["Finding (sourceRef único = dedupe)"]
    F --> CICLO["CycleRun 7 etapas"]
```

## Las 7 etapas del ciclo

```mermaid
flowchart LR
    F1["1 · DETECTAR<br/>scan de las 4 fuentes"]
    F2["2 · ANALIZAR<br/>causa raíz por firma<br/>determinista"]
    F3["3 · INVESTIGAR<br/>memoria P9 + L2<br/>(gobernado por el<br/>prompt maestro XML)"]
    F4["4 · CORREGIR<br/>plan 3 roles §4.2<br/>(propuesta, jamás<br/>mutación directa)"]
    F5["5 · VERIFICAR<br/>re-ejecución con<br/>exit code real"]
    F6["6 · CRITERIOS<br/>gaps-finder +<br/>audit memory +<br/>expected-check"]
    F7["7 · REPORTAR<br/>époch inmutable<br/>P13 + worklog P9"]
    F1 --> F2 --> F3 --> F4 --> F5 --> F6 --> F7
```

Cada etapa registra `{name, status: PASS|FAIL|ESCALATED, durationMs, evidence}` en `CycleRun.stages` (JSON) — evidencia honesta por etapa (P2).

## Ciclo de vida de un hallazgo

```mermaid
stateDiagram-v2
    [*] --> DETECTED: scan detecta falla
    DETECTED --> ANALYZED: causa raíz clasificada
    ANALYZED --> CORRECTED: plan aplicado
    CORRECTED --> VERIFIED: re-ejecución PASS
    VERIFIED --> RESOLVED: criterios posteriores OK
    DETECTED --> NO_DEFECT: input del operador bien rechazado
    ANALYZED --> ESCALATED: clase INTERNAL/ESCALATE<br/>(solo propone — separación de roles)
    RESOLVED --> [*]
```

**Clases de corrección** (clasificador determinista):
- `NO_DEFECT` — el sistema respondió correctamente (input inválido).
- `HANDLED` — corrección ejecutable por el propio sistema.
- `PROPOSAL` — va al flujo PRE-v2.0 como `AdoptionProposal` (el sentinela nunca muta la constitución).
- `ESCALATE` — requiere al operador.

## AUTO_ON_ERROR en vivo (verificado E2E)

```mermaid
sequenceDiagram
    autonumber
    participant OP as Operador
    participant DSP as Dispatcher
    participant LOG as CommandLog
    participant SEN as Sentinela (background)
    participant BD as SQLite

    OP->>DSP: mejorate (sin cuota GitHub)
    DSP->>DSP: compuerta P2 → throw Error (0 repos)
    DSP->>LOG: status=ERROR, output con causa raíz
    DSP->>SEN: sentinelScan("AUTO_ON_ERROR") — fire & forget
    SEN->>BD: Finding MEDIUM (sourceRef cmd:<logId>)
    SEN->>BD: CycleRun 7 etapas (COMPLETED)
    SEN->>BD: Finding → RESOLVED
    Note over SEN,BD: Todo esto ocurre DESPUÉS de responder<br/>al operador (exit 1 · 151ms)
```

## Verificación de cierre de ciclos (queries reales)

Los ciclos cerrados son consultables por SQL directo — ejemplo real de esta sesión:

```
AUTO_ON_ERROR · COMPLETED · "Comando mejorate terminó en ERROR: [MEJORATE] scan: 0/19..."
MANUAL        · COMPLETED · "Radiografía FAILED: dominio inexistente — 7/7 etapas, AGREE"
MANUAL        · COMPLETED · "Presupuesto de gateway excedido: mejorate 39.6s (>25s, AP-032)"
```
