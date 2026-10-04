# scripts/ — Comandos Operativos del Sistema Agéntico

> Implementaciones de los comandos canónicos de `AGENTS.md` §0.
> Sintaxis: `bash scripts/<cmd>.sh [parámetros]`
>
> Todos los scripts respetan Gate Honesty (Regla P2): reportan exit code + stdout real.

---

## Comandos

| Script | Comando canónico | Descripción |
| :--- | :--- | :--- |
| `start.sh` | `start` / `inicia` | Bootstrap: verifica DB/Redis/MQ, migra, seed, arranca. |
| `cold-run.sh` | `cold run [scope]` | Auditoría sin mutar archivos. |
| `verify.sh` | `verify` | Batería de puertas deterministas + reporte Gate Honesty. |
| `audit-memory.sh` | `audit memory` | Compara código vs. anti-patterns.md; bloquea reincidencias. |
| `sil-trend.sh` | `sil trend` | Regenera state.json y metrics-trend.md (K1-K5, W1-W8). |
| `pre-cycle.sh` | `pre cycle` | Juez PRE-v2.0 sobre propuesta de regla. |
| `report.sh` | `report` | Informe de cierre AGREE/DISAGREE + Porter + handoff en `docs/reports/`. |
| `ui-test.sh` | `ui test <route>` | Valida 7 posiciones, paleta Apple, WCAG, sticky footer, console/network. |
| `persona-check.sh` | `persona check <route>` | Valida la ruta contra perfiles en `docs/personas/` (W6). |
| `install-ci-workflows.sh` | (utilidad) | Copia los 3 workflows de `docs/ci-workflows/` a `.github/workflows/`. |

---

## Detección automática de stack

`verify.sh` y `cold-run.sh` detectan el stack presente (`package.json`,
`pyproject.toml`, `go.mod`, `Cargo.toml`, `composer.json`, `CMakeLists.txt`)
y ejecutan las puertas correspondientes. Si ningún stack es detectado
(boilerplate puro), reportan `NOT_RUN` honestamente.

---

## Ejemplo de invocación

```bash
# Bootstrap completo del proyecto
bash scripts/start.sh

# Auditoría fría sin mutar nada
bash scripts/cold-run.sh src/

# Verificar puertas (Gate Honesty)
bash scripts/verify.sh

# Audit anti-reincidencia
bash scripts/audit-memory.sh

# Regenerar métricas PSIM
bash scripts/sil-trend.sh

# Evaluar propuesta de regla (PRE-v2.0)
bash scripts/pre-cycle.sh pre/propose/add-p10

# Generar reporte de cierre de sesión
bash scripts/report.sh
```

---

## Invariante

Todos los scripts:
1. Declaran `set -euo pipefail` para fallo rápido.
2. Imprimen `[CMD]` y `[EXIT]` con el comando y código de salida reales (Regla P2).
3. NUNCA imprimen `PASS ✅` sin haber ejecutado el comando real.
4. Si un comando no aplica (stack no detectado), imprimen `NOT_RUN`.
