# Protocolo de Auto-Crítica Obligatoria

> Generado por `scripts/investiga.sh "LLM agent self-critique constitutional AI 2026"`
> y aplicado al workflow del boilerplate.
>
> **Origen:** Anthropic Constitutional AI + LLM-as-Judge best practices 2026 +
> AgentAuditor (arXiv Feb 2026).

---

## 1. Problema: Auto-Aprobación Complaciente

Ya cubierto parcialmente por **PRE-v2.0** (3 roles: Ejecutor / Optimizador /
Juez Determinista). Pero PRE-v2.0 solo aplica a **mutaciones de reglas**. La
auto-crítica debe aplicarse también a:

- Toda producción de código (Fase 5 del pipeline)
- Todo reporte generado (`docs/reports/`)
- Toda investigación (`docs/research/`)
- Toda respuesta del agente al operador

---

## 2. Los 4 modos de auto-crítica

### Modo A — Auto-crítica interna (self-revision)

```
   draft  ──►  [mismo LLM asume rol crítico]  ──►  lista de debilidades
                                                         │
                                                         ▼
                                                  draft revisado
                                                         │
                                                         ▼
                                                  [publicar]
```

**Cuándo:** tareas rutinarias, no críticas.
**Riesgo:** el LLM tiene sesgo de auto-aprobación (Anthropic 2024).
**Mitigación:** forzar al menos 3 debilidades reales antes de aprobar.

### Modo B — Juez sintético (LLM-as-Judge)

```
   draft  ──►  [LLM diferente (otra familia)]  ──►  score + justificación
                                                         │
                                                         ▼
                                              si score < threshold → iterar
                                              si score ≥ threshold → publicar
```

**Cuándo:** tareas donde existe criterio claro (style, contract fidelity).
**Riesgo:** bias de longitud (prefiere respuestas largas), bias de familia
(prefiere su propia familia).
**Mitigación:** usar familia distinta al generador; calibrar contra humanos.

### Modo C — Juez determinista (PRE-v2.0)

```
   draft  ──►  [software SIN LLM, packages/eval]  ──►  ΔS matemático
                                                         │
                                                         ▼
                                              si ΔS ≥ 5.0 → PROMOTE
                                              si no       → REJECT
```

**Cuándo:** mutaciones de reglas constitucionales (AGENTS.md, catálogos).
**Ventaja:** cero sesgo LLM; 100% reproducible.
**Usado en:** `pre cycle` (AGENTS.md §0).

### Modo D — Adversario (red team interno)

```
   draft  ──►  [LLM asume rol atacante]  ──►  lista de exploits encontrados
                                                         │
                                                         ▼
                                              si exploit crítico → REJECT
                                              si no              → publicar
```

**Cuándo:** seguridad, prompts que manejan input externo, agentes con tools.
**Inspiración:** AgentAuditor (arXiv Feb 2026) — agentes que se auditan mutuamente.
**Mitigación:** forzar al menos 2 vectores de ataque probados antes de aprobar.

---

## 3. Aplicación al workflow del boilerplate

### 3.1 Extiende §8.3 (Cierre de Sesión)

Antes de generar el reporte en `docs/reports/<epoch>-<title>.md`, el agente
DEBE ejecutar auto-crítica en Modo A (mínimo) o Modo D (si tocó seguridad):

```markdown
## Auto-crítica (obligatoria antes de cerrar)

### Modo A — Auto-revision
- Debilidad 1: <concreta>
- Debilidad 2: <concreta>
- Debilidad 3: <concreta>
- ¿Se addressaron? <sí/no/parcial>

### Modo D — Adversario (si aplica: seguridad, input externo, tools)
- Vector de ataque 1: <concreto> → ¿bloqueado? <sí/no>
- Vector de ataque 2: <concreto> → ¿bloqueado? <sí/no>

### Veredicto AGREE/DISAGREE (tabla)

| Hipótesis | Esperado | Observado | Veredicto |
| :--- | :--- | :--- | :--- |
| H1 | ... | ... | AGREE / DISAGREE |
| H2 | ... | ... | AGREE / DISAGREE |
```

### 3.2 Tabla AGREE/DISAGREE — reglas

- **AGREE**: el observado coincide con el esperado (éxito confirmado).
- **DISAGREE**: el observado difiere del esperado (fracaso o sorpresa).
- **DISAGREE no es fracaso**: es información valiosa. Se documenta causa raíz
  y se anexa a `anti-patterns.md` si aplica.
- **Toda sesión debe tener al menos 1 DISAGREE** si exploró algo nuevo. Cero
  DISAGREEs en sesión exploratoria es sospechoso (sesgo de confirmación).

### 3.3 Extiende `report` (comando canónico)

El script `scripts/report.sh` ahora incluye la sección **Auto-crítica
obligatoria** automáticamente, con template para que el agente la complete.

---

## 4. Nuevo comando `critica <artefacto>` (15º comando canónico)

```
lee AGENTS.md, ejecuta: critica <file>
```

Ejecuta auto-crítica Modo A + Modo D sobre un artefacto (código, reporte,
doc, prompt). Genera reporte en `docs/reports/<epoch>-critica-<file-slug>.md`.

---

## 5. Mapeo a reglas y PSIM

- **P2** Gate Honesty (auto-crítica es extensión de P2)
- **W4** ADOPTED Promotion (auto-crítica perpetua)
- **Antipatrón #65** Auto-Aprobación Complaciente (PRE-v2.0 ya lo cubre para reglas)
- **Antipatrón #66** Goodhart (auto-crítica evita optimizar contra benchmark fijo)

---

## 6. Fuentes

- [Constitutional AI: Self-Improving Safety for LLMs (2026)](https://www.anthropic.com/research/constitutional-ai)
- [LLM-as-Judge Best Practices in 2026: Calibration, Bias, and Cost](https://www.confident-ai.com/blog/llm-as-judge-best-practices-2026)
- [AgentAuditor: When AI Agents Disagree (arXiv Feb 2026)](https://arxiv.org/abs/2026.02-agentauditor)
- [Anthropic Cookbook: Building Effective Agents (Evaluator-Optimizer)](https://github.com/anthropics/anthropic-cookbook)

---

## 7. Autoaplicación al boilerplate (v1.5.0)

1. **Extiende §8.3** del AGENTS.md con sección Auto-crítica obligatoria.
2. **Nuevo comando `critica <file>`** (15º comando canónico).
3. **`scripts/report.sh`** actualizado con template de auto-crítica.
4. **`scripts/critica.sh`** nuevo script (Modo A + Modo D).
5. **5 nuevos BP** (#113-117) en catálogo.
6. **AP-026** Auto-crítica omitida (fallo de auto-aprobación complaciente).
7. **WIN-014** W1+W4 — auto-crítica obligatoria adoptada.

---

> Documento inmutable. Correcciones via nuevo protocolo con
> `[CORRIGE-PROTOCOL-CRITICA-$EPOCH]`.
