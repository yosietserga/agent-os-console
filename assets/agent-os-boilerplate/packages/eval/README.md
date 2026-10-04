# packages/eval — Juez Determinista PRE-v2.0

> Software compilado **sin LLM** que evalúa propuestas de modificación a
> `AGENTS.md` y archivos constitucionales. Implementa el juez del rol 3 de
> la gobernanza PRE-v2.0.
>
> **Invariante crítica:** este paquete NUNCA debe importar un SDK de LLM
> (`openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, etc.). Es
> determinista puro: mismo input → mismo output.

---

## Estructura

```
packages/eval/
├── README.md                  # Este archivo
├── scoring-formula.md         # Desglose matemático de S y las 6 dimensiones D1-D6
├── benchmark-blind/
│   ├── README.md              # Documentación del benchmark rotativo ciego (30%)
│   ├── current/               # Casos activos (rotados cada N días)
│   └── archive/               # Casos retirados (historial)
├── src/                       # Implementación (Rust recomendado; Go/TS-strict alternativas)
│   └── lib.*                  # Entry point: `evaluate(baseDir, candidateDir) -> Verdict`
└── tests/                     # Tests del propio juez (meta-recursivo)
```

---

## Contrato del juez

### Input
- `baseDir`: directorio con el snapshot de `main` (estado base).
- `candidateDir`: directorio con el snapshot del PR `pre/propose/*` (estado candidato).
- `benchmarkDir`: directorio con el benchmark actual (incluye el 30% ciego).

### Output (`Verdict`)

```typescript
interface Verdict {
  decision: "PROMOTE" | "REJECT";
  S_base: number;           // puntuación base sobre 100
  S_candidate: number;      // puntuación candidata sobre 100
  deltaS: number;           // S_candidate - S_base
  sigma_base: number;       // desviación estándar de las corridas base
  sigma_candidate: number;
  dimensions: {
    D1_compilation_typing:    { base: number; candidate: number; delta: number; weight: 0.20 };
    D2_contract_fidelity:     { base: number; candidate: number; delta: number; weight: 0.15 };
    D3_pipeline_adherence:    { base: number; candidate: number; delta: number; weight: 0.20 };
    D4_hidden_cases:          { base: number; candidate: number; delta: number; weight: 0.20 };
    D5_token_efficiency:      { base: number; candidate: number; delta: number; weight: 0.10 };
    D6_architecture_rules:    { base: number; candidate: number; delta: number; weight: 0.15 };
  };
  conditions: {
    improvementSignificant:  boolean;  // deltaS >= 5.0
    noSevereRegression:      boolean;  // forall i, delta_Di >= -2.0
    statisticalSignificance: boolean;  // (sigma_base + sigma_candidate) < |deltaS|
  };
  reason: string;            // explicación humana del veredicto
}
```

### Regla de decisión

```
PROMOTE  si y solo si:
  improvementSignificant     === true
  AND noSevereRegression     === true
  AND statisticalSignificance === true

REJECT en cualquier otro caso.
```

---

## Cómo ejecutar

### Local (durante desarrollo del juez)

```bash
cd packages/eval
cargo run -- --base ../../git/main --candidate ../../git/pre-propose --benchmark ./benchmark-blind/current
# o
go run ./cmd/eval --base ../../git/main --candidate ../../git/pre-propose --benchmark ./benchmark-blind/current
```

### CI (workflow `.github/workflows/pre-cycle.yml`)

El workflow descarga el artifact del PR, materializa `base` y `candidate`, e
invoca el juez. Publica el `Verdict` como comentario del PR y bloquea el merge
si `decision === "REJECT"`.

---

## Cómo extender el benchmark

El benchmark-blind se rota cada `PRE_BENCHMARK_ROTATION_DAYS` (default 14).
La rotación es responsabilidad del script `scripts/pre-cycle.sh --rotate-benchmark`,
que:
1. Mueve el 10% de `current/` a `archive/`.
2. Genera nuevos casos sintéticos para `current/` (manteniendo el 30% ciego).
3. Reevalúa todas las propuestas activas contra el nuevo benchmark.
4. Si una propuesta aprobada pierde >5 puntos tras rotación → marca `OVERFIT`
   y abre PR de reversión automática.

Ver `benchmark-blind/README.md` para el formato de casos sintéticos.

---

## Meta-recursividad: ¿quién juzga al juez?

El juez mismo tiene tests (`packages/eval/tests/`) que verifican:
- Determinismo: mismo input → mismo output (sin aleatoriedad no controlada).
- Corrección matemática de las fórmulas.
- Que ninguna dimensión se calcula usando un LLM.

Estos tests son themselves deterministas y se ejecutan en `gate-honesty.yml`.
Si los tests del juez fallan, el CI bloquea todo PR (incluido los que no tocan
`AGENTS.md`) hasta que el juez se repare.

---

## Por qué Rust (recomendado)

- **Determinismo fuerte:** sin GC jitter, sin aleatoriedad de allocator.
- **Velocidad:** evaluación del benchmark en <1s para 1000 casos.
- **Tipado estricto:** `Result<T, E>` fuerza manejo de errores.
- **Sin runtime LLM:** imposible importar `openai` por accidente (no hay
  equivalente en crates.io que un humano instalaría sin revisión).

Alternativas válidas: Go (con `go test -race`), TypeScript estricto
(`tsc --noEmit` + `vitest`), Python con `mypy --strict` (menos recomendado por
el runtime dinámico subyacente).
