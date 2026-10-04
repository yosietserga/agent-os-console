# MCP Servers — Matriz de Servidores Obligatorios

> Los 5 servidores Model Context Protocol (MCP) listados aquí son la capa
> operativa nativa del agente. Reemplazan scripts de texto frágiles por
> herramientas tipadas con verificación de diferencias y diagnóstico LSP.

---

## Servidores obligatorios

| # | Servidor | Config | Propósito |
| :---: | :--- | :--- | :--- |
| 1 | Filesystem | [`filesystem.mcp.json`](./filesystem.mcp.json) | Lectura/inspección granular; ejecuta Regla P1 (Read-After-Edit). |
| 2 | Git Worktree | [`git-worktree.mcp.json`](./git-worktree.mcp.json) | Worktrees aislados para squads de agentes concurrentes. |
| 3 | Polyglot LSP | [`lsp-bridge.mcp.json`](./lsp-bridge.mcp.json) | Diagnóstico de tipos, go-to-def, referencias (TS/Py/Go/Rust/PHP/C++). |
| 4 | PostgreSQL Inspector | [`postgres-inspector.mcp.json`](./postgres-inspector.mcp.json) | Inspección de catálogo, migraciones, integridad referencial. |
| 5 | Headless Browser | [`browser-devtools.mcp.json`](./browser-devtools.mcp.json) | Pruebas en navegador real; valida 7 posiciones de layout y WCAG. |

---

## Cómo cargar los servidores

### Claude Desktop / Claude Code

Copia el contenido de cada `.mcp.json` al archivo de configuración MCP de tu
cliente (`~/Library/Application Support/Claude/claude_desktop_config.json` en
macOS, o equivalente en Linux/Windows).

### Cursor

Settings → MCP → "Add new MCP server" → pega el JSON.

### Cline / Continue / Genkit

Cada cliente soporta MCP; consulta su documentación. El formato JSON de los
`.mcp.json` es compatible con la especificación MCP 2024-11-05+.

---

## Invariante P1 en Filesystem MCP

El servidor Filesystem está configurado para **rechazar ediciones sin
verificación**: cada `write_file` debe ir seguido de un `read_file` del mismo
archivo en la misma conversación. Si el agente intenta declarar éxito sin
releer, el servidor reporta `P1_VIOLATION` y bloquea la operación.

Esto materializa la Regla P1 (Read-After-Edit) a nivel de protocolo MCP, no de
prompt (que sería evitable).

---

## Invariante de aislamiento en Git Worktree MCP

El servidor Git Worktree garantiza que múltiples agentes operando en paralelo
no colisionen (Antipatrón #80):

```
main worktree:       /repo                        (protegido: solo lectura para agentes)
agent-A worktree:    /repo/.worktrees/agent-A      (rama: agent-A/task-123)
agent-B worktree:    /repo/.worktrees/agent-B      (rama: agent-B/task-456)
```

Cada agente opera en su worktree; los merges a `main` se ordenan por blast
radius (Antipatrón #18 invertido → Mejor Práctica #18).
