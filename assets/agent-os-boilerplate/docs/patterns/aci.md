# Agent-Computer Interface (ACI) — Navegación Acotada para LLMs

> Adaptado de `SWE-agent/SWE-agent` (Princeton) y `Aider-AI/aider` (Repo Map).
> Diseño de herramientas de inspección de código optimizadas para el modelo
> mental de un LLM.

---

## Problema

Un LLM que lee archivos completos gigantes:
- Satura la ventana de contexto (pérdida de información por truncado).
- Consume tokens innecesarios (caro).
- Pierde precisión al navegar (alucinaciones de "recuerdo").
- No puede razonar sobre estructura (solo contenido lineal).

## Solución ACI

Diseñar herramientas que **obligan al agente a navegar por rangos** en vez
de leer archivos completos, complementadas con un **Repo Map** comprimido.

---

## Herramientas ACI canónicas (6)

### 1. `search_dir <pattern> <path>`
Busca patrón en todos los archivos bajo `path`. Retorna lista de archivos
coincidentes con números de línea.

### 2. `search_file <pattern> <file>`
Busca patrón en un archivo específico. Retorna rangos de líneas coincidentes.

### 3. `view_lines_window <file> <start> <end>`
Muestra líneas `[start, end]` de un archivo. **Máximo 100 líneas por llamada.**
Si el agente pide más, se trunca con hint de paginación.

### 4. `view_repo_map`
Genera un mapa comprimido del repo: lista de archivos + símbolos top-level
(clases, funciones, exports). Usa tree-sitter para parsing rápido. Tamaño
típico: <5KB para un repo de 1000 archivos.

### 5. `apply_patch <search_replace_block>`
Aplica un bloque Search/Replace estricto:

```
<<<< SEARCH
def old_function():
    pass
====
def new_function():
    return 42
>>>> REPLACE
```

El bloque debe coincidir **exactamente** con el contenido actual. Si no
coincide, se rechaza con diff. Esto erradica alucinaciones de edición.

### 6. `find_file <name>`
Busca archivos por nombre (no contenido). Útil para localizar sin saturar
contexto.

---

## Reglas ACI

1. **Nunca leer más de 100 líneas por `view_lines_window`.** Si se necesitan
   más, paginar con múltiples llamadas.
2. **Siempre `view_repo_map` antes de `search_dir`.** El mapa orienta la
   búsqueda; sin él, el agente busca a ciegas.
3. **`apply_patch` es la única forma de editar.** Prohibido "reescribir el
   archivo completo" — eso satura tokens y rompe P1 (Read-After-Edit).
4. **Después de `apply_patch`, releer con `view_lines_window`.** Verifica
   el diff (Regla P1 obligatoria).
5. **Si `apply_patch` falla 3 veces seguidas**, escalar a humano (BP #96).
   Probablemente el bloque SEARCH no coincide porque el archivo cambió.

---

## Mapeo al boilerplate

| Herramienta ACI | Equivalente en el boilerplate |
| :--- | :--- |
| `search_dir` | MCP `filesystem.search_files` |
| `search_file` | MCP `filesystem.read_file` + grep |
| `view_lines_window` | MCP `filesystem.read_file` con offset/limit |
| `view_repo_map` | **NUEVO**: skill `repo-mapper` (pendiente implementar) |
| `apply_patch` | Edit tool con bloques SEARCH/REPLACE (BP #106) |
| `find_file` | MCP `filesystem.search_files` |

---

## Antipatrón relacionado

**AP-020 Lectura de Archivo Gigante de Golpe** (nuevo, a añadir):
- **Causa raíz**: Agente lee archivo de 5000+ líneas en una sola llamada,
  saturando contexto y perdiendo precisión.
- **Impacto**: Tokens desperdiciados, alucinaciones, timeout del proveedor.
- **Regla correctiva**: ACI `view_lines_window` con máximo 100 líneas por
  llamada. Usar `view_repo_map` para orientarse primero.

---

## Referencias

- `SWE-agent/SWE-agent` — config/default.yaml (tools bundles)
- `Aider-AI/aider` — Repo Map con tree-sitter
- `OpenHands/OpenHands` — `.agents/skills/` para carga lazy de guías
