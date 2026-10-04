# docs/personas/ — Perfiles de Usuario para W6 (Persona Satisfied)

> Definiciones de personas usadas por el comando canónico
> `persona check <route>` (AGENTS.md §0).

## Convención

Cada archivo `.md` en este directorio define UNA persona. El nombre del archivo
es el `Id` de la persona (sin `.md`).

### Personas por defecto (3)

| Archivo | Id | Rol |
| :--- | :--- | :--- |
| `executive.md` | executive | Decision-maker (C-level / gerente) |
| `operator.md` | operator | Usuario operativo (data entry, soporte) |
| `analyst.md` | analyst | Analista de datos / BI |

## Estructura obligatoria de un archivo de persona

```markdown
# Persona: <Nombre>

- **Id:** <kebab-case-id>
- **Rol:** <descripción corta>
- **Meta principal:** <qué quiere lograr en el sistema>
- **Permisos:** <qué puede hacer>
- **Dispositivo típico:** <desktop/mobile/tablet + resolución>
- **Rutas esperadas:** /ruta1, /ruta2, /ruta3
- **Criterios de éxito:**
  - <criterio verificable 1>
  - <criterio verificable 2>
- **Criterios de fracaso:**
  - <qué rompe la experiencia para esta persona>
```

## Extensión

Cualquier nuevo archivo `.md` en este directorio se considera automáticamente
una nueva persona. El script `scripts/persona-check.sh` itera sobre todos los
`.md` presentes.

## Relación con PSIM

Cada persona satisfecha (route cumple todos sus criterios de éxito y ninguno
de fracaso) genera una victoria **W6 (Persona Satisfied)** en
`docs/memory/wins-ledger.md`.
