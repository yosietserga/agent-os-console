# 07 · Mejorate — Auto-Improvement Loop

> [← Gobernanza y L2](06-gobernanza-l2.md) · [← Índice](README.md)

`mejorate` es el comando de auto-mejora: escanea **19 repos de referencia** de ingeniería inversa (1.2M★ combinados) vía GitHub API, extrae patrones agénticos con L2 y propone adoptions que el [juez determinista](06-gobernanza-l2.md) evalúa.

## Pipeline completo

```mermaid
sequenceDiagram
    autonumber
    participant OP as Operador
    participant CMD as mejorate()
    participant GH as GitHub REST API
    participant DB as SQLite
    participant L2 as GLM-4.6 (z-ai)
    participant JZ as Juez PRE-v2.0

    OP->>CMD: "lee AGENTS.md, ejecuta: mejorate"
    CMD->>GH: GET /rate_limit (pre-flight, NO consume cuota)
    GH-->>CMD: cuota + modo auth (token vs anónimo)
    CMD->>GH: 19× /repos/:repo + git/trees (paralelo x6)
    GH-->>DB: stars, dirs, keyFiles, lastScannedAt=AHORA

    alt 0 repos frescos (cuota agotada / 403 masivo)
        CMD-->>OP: ⛔ ABORTADO antes de L2 (P2 Gate Honesty)<br/>causa raíz + remedio + exit 1
        Note over CMD,DB: 0 tokens L2 gastados<br/>Sentinela captura el ERROR (AP-031)
    else ≥1 repo fresco
        CMD->>L2: systemPrompt Optimizador + resumen<br/>SOLO repos frescos del epoch
        L2-->>CMD: JSON {patterns[], adoptions[]}
        loop cada adoption (≤8)
            CMD->>JZ: scoreDimensions(title, desc, type)
            JZ-->>DB: AdoptionProposal EVALUATED (d1-d6, ΔS, veredicto)
        end
        CMD-->>OP: scan N/19 · base epoch · patrones ·<br/>promovibles (ΔS ≥ 5) · ledger tokens/$
    end
```

## Sub-comandos

| Comando | Qué hace |
|:--|:--|
| `mejorate` | Flujo completo scan → synthesize (con compuerta P2) |
| `mejorate scan` | Solo el scan (mismo gate: 0 repos → ERROR exit 1) |
| `mejorate synthesize` | Solo síntesis sobre el último scan (fail-fast si no es fresco) |
| `mejorate list` | Catálogo + último scan exitoso (epoch + repos) |

## AP-034 — La compuerta de honestidad (fix de workflow)

**El defecto real que el operador reportó** (salida `0/19 repos · 403×19 · 5 patrones extraídos · exit 0`):

```mermaid
flowchart TB
    subgraph ANTES["❌ ANTES (fabricación silenciosa)"]
        A1["Scan 0/19<br/>(token ausente → 403×19)"] --> A2["synthesize() igual"]
        A2 --> A3["Lee último scan COMPLETED<br/>de CUALQUIER epoch viejo"]
        A3 --> A4["Tabla completa = datos rancios"]
        A4 --> A5["L2 'extrae' 5 patrones<br/>de datos no frescos"]
        A5 --> A6["exit 0 · 2.640 tokens gastados<br/>en fabricar evidencia"]
    end
    subgraph AHORA["✅ AHORA (P2 Gate Honesty)"]
        B1["Pre-flight /rate_limit<br/>(gratuito)"] --> B2{"¿0 repos frescos?"}
        B2 -->|Sí| B3["⛔ ABORT antes de L2<br/>causa raíz + remedio PAT<br/>exit 1 · 0 tokens"]
        B2 -->|No| B4["Síntesis SOLO con repos<br/>lastScannedAt ≥ epoch<br/>edad divulgada"]
        B3 --> B5["Sentinela AUTO_ON_ERROR<br/>ciclo 7 etapas → RESOLVED"]
        B4 --> B6["exit 0 con base declarada:<br/>'epoch X · N frescos · edad Y min'"]
    end
```

### Las 4 correcciones de raíz

1. **Token en call-time** (`github.ts`): la constante a nivel de módulo congelaba el valor al importar — ahora se lee en cada llamada (`process.env.GITHUB_TOKEN ?? GH_TOKEN`).
2. **Circuit breaker de cuota**: sin token y `remaining === 0` → omite las llamadas destinadas a 403 (antes quemaba 19 requests y ~20s para colectar el muro de errores).
3. **Binding al epoch real** (`synthesize.ts`): el epoch de referencia es el **último scan** (no el último COMPLETED); fail-fast si FAILED o 0 repos; solo repos con `lastScannedAt` dentro del epoch; **edad divulgada** en el prompt del L2, la nota del ScanRun y la salida.
4. **Fallback determinista honesto**: si el L2 no estructura JSON, las proposals derivan de los **repos frescos del epoch** (antes reciclaba patrones viejos y el juez los rechazaba como duplicados — el origen de los ΔS negativos masivos).

## Verificación con token real (esta sesión)

```
[MEJORATE] scan: 19/19 repos escaneados read-only · 1,204,735★ totales
  Autenticación GitHub: token activo (cuota 4958/5000)

[MEJORATE] synthesize vía L2 (GLM-4.6 (z-ai), 16379ms)
  Base: epoch 1791092005 · 19 repos frescos · edad 0 min
  Patrones extraídos: 8 · Adoptions propuestas: 5
  Promovibles (ΔS ≥ 5.0): 0   ← el juez rechazó 5/5 por regresiones reales D1/D2
  Ledger: 1389+1432 tokens · $0.0093
```

> Sin token: 60 req/h por IP compartida (cada run consume ~38) → 403 masivo.
> Con `GITHUB_TOKEN` en `.env`: **5.000 req/h** — el scan de 19/19 es estable.
