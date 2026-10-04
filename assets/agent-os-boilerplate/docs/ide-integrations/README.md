# docs/ide-integrations/ — Auto-Activation Layer para IDEs

> El comando canónico `ide` (AGENTS.md §0, v1.3.0) genera archivos de
> auto-activación que garantizan que **TODO prompt del operador** (incluso sin
> "lee AGENTS.md, ejecuta:") sea tratado como canónico por el IDE.

---

## Cómo funciona

```
   operador envía prompt (sin "lee AGENTS.md, ejecuta:")
                    │
                    ▼
   ┌─────────────────────────────────────────────┐
   │  IDE detecta archivo de auto-activación     │
   │  (.cursorrules / CLAUDE.md / .windsurfrules │
   │   / .clinerules / CODEX.md / etc.)          │
   └────────────────────┬────────────────────────┘
                        │
                        ▼
   ┌─────────────────────────────────────────────┐
   │  Auto-activation layer fuerza:              │
   │  1. Fase 0 (leer AGENTS.md + memoria +      │
   │     worklog + últimos 3 reportes)           │
   │  2. Aplicar P1-P11                          │
   │  3. Detectar verbo implícito                │
   │     (implementa→itera, audita→cold run,     │
   │      verifica→verify, test ui→ui test,      │
   │      persona→persona check)                 │
   │  4. Estilo Apple Light Mode                 │
   │  5. Reporte en docs/reports/ al cierre      │
   └─────────────────────────────────────────────┘
```

---

## IDEs soportados (16)

| IDE | Archivo generado | Tipo |
| :--- | :--- | :--- |
| **Cursor** (moderno) | `.cursor/rules/agent-os.mdc` | mdc (frontmatter YAML) |
| **Cursor** (legacy) | `.cursorrules` | plain |
| **Claude Code** | `CLAUDE.md` | plain |
| **Gemini CLI / Jules** | `GEMINI.md` | plain |
| **GitHub Copilot** | `.github/copilot-instructions.md` | plain |
| **Windsurf (Codeium)** | `.windsurfrules` | plain |
| **Cline** | `.clinerules` | plain |
| **Codex CLI (OpenAI)** | `CODEX.md` | plain (AGENTS.md intacto) |
| **RooCode** | `.roo/rules/agent-os.md` | plain |
| **OpenCode** | `opencode.md` | plain |
| **Trae** | `.trae/rules/agent-os.md` | plain |
| **Antigravity (Google)** | `.antigravity/rules/agent-os.md` | plain |
| **ZCode (Z.ai)** | `.zcode/rules/agent-os.md` | plain |
| **VS Code (genérico)** | `.vscode/settings.json` | json |
| **Aider** | `.aider.conf.yml` | yaml |
| **Continue** | `.continue/config.json` | json |

---

## Uso

```bash
# Detectar IDEs presentes y generar config
bash scripts/ide.sh            # o: bash scripts/ide.sh detect

# Generar para un IDE específico
bash scripts/ide.sh cursor
bash scripts/ide.sh claude-code
bash scripts/ide.sh windsurf

# Generar para TODOS los IDEs (útil al clonar el boilerplate)
bash scripts/ide.sh all

# Listar IDEs soportados
bash scripts/ide.sh list
```

---

## Salvaguarda anti-sobrescritura

El script `ide.sh` tiene una salvaguarda que **rechaza sobrescribir archivos
constitucionales** (Regla P9 + gobernanza PRE-v2.0):

```
Archivos protegidos (nunca se sobrescriben):
  AGENTS.md
  docs/governance/*
  docs/catalogs/*
  docs/memory/anti-patterns.md
  docs/memory/wins-ledger.md
  docs/memory/state.json
  docs/memory/worklog.md
```

Si un IDE intenta generar config hacia uno de estos archivos, el script emite
`RECHAZADO` y aborta. (Antipatrón AP-018 documentado.)

**Caso especial:** Codex CLI lee `AGENTS.md` nativamente, pero el comando `ide`
genera `CODEX.md` aparte como wrapper de auto-activación. AGENTS.md queda intacto.

---

## Origen de los patrones (rayos X de repos del operador)

Los patrones para el comando `ide` se extrajeron de **3 repos públicos** del
operador (`yosietserga`):

### 1. `living-topology-visualizer/skills/coding-agent/`
Mini-framework agéntico con:
- Frontmatter YAML (name, slug, version, description, metadata)
- Scope ONLY/NEVER explícito
- Archivos auxiliares (planning.md, execution.md, verification.md, state.md)
- Workflow Request → Plan → Execute → Verify → Deliver
- Progress tracking `[DONE] [WIP] [ ]`
- State tracking `[R1] [R2] [R3]`
- Fix-before-send en verification
- Security & Privacy section

### 2. `system-prompts-and-models-of-ai-tools/`
Colección de **system prompts reales** de 15+ IDEs:
- Cursor (Agent + Chat, 18KB)
- Cline (47KB, el más completo)
- Codex CLI (4.8KB, conciso)
- VSCode Agent / GitHub Copilot (21KB, XML tags)
- Windsurf (37KB)
- Bolt, RooCode, Devin, Lovable, Manus, v0, Trae, dia, Same.dev, Replit

Estos prompts revelaron la anatomía real de cada IDE: tags XML, herramientas
específicas (apply_patch, insert_edit_into_file, semantic_search), restricciones
("NEVER print codeblock with file changes").

### 3. `ai-prompts-for-developers/prompt.md`
Master Prompt con ciclo Draft→Critique→Improve y fases 0-6 (Kickoff,
Generative Prompt Cycle, Blueprint Cycle, Specifications, Scaffolding,
Version Control, AI Interaction Logging).

---

## Cómo extender (nuevo IDE)

Para añadir un IDE nuevo (ej. "FooCode"):

1. Añadir entrada en `SUPPORTED_IDES` en `scripts/ide.sh`:
   ```bash
   "foocode|FooCode|.foocode/rules/agent-os.md|plain"
   ```
2. Si el IDE usa un formato especial (json, yaml, mdc), añadir caso en
   `generate_extended_prompt()`.
3. Documentar en esta tabla.
4. Probar: `bash scripts/ide.sh foocode`.
5. Verificar que la salvaguarda anti-sobrescritura sigue activa.

---

## Mapeo a reglas y PSIM

- **P9** Memoria append-only (la salvaguarda protege archivos constitucionales)
- **W1** Capability Strengthening (nueva capacidad: auto-activación)
- **W6** Persona Satisfied (el operador ya no necesita comandos canónicos)
- **W7** Gate Velocity (reduce fricción operativa en cada prompt)
- **Killer Feature #102** Auto-Activation Layer para IDEs
- **BP #105** Auto-activación IDE en clonado del boilerplate
- **AP-018** Sobrescritura de AGENTS.md por script (previsto y bloqueado)
