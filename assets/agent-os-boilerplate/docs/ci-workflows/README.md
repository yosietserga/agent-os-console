# CI Workflows — Referencia

> Los 3 workflows de GitHub Actions viven aquí como archivos de referencia
> trackeados por git. GitHub requiere el scope `workflow` en el token para
> pushear archivos a `.github/workflows/`, por lo que se mantienen fuera de
> ese directorio hasta que se instalen con credenciales apropiadas.

## Archivos

| Archivo | Propósito |
| :--- | :--- |
| [`gate-honesty.yml`](./gate-honesty.yml) | Verificación determinista multi-stack en cada PR (Regla P2). |
| [`memory-audit.yml`](./memory-audit.yml) | Anti-reincidencia de antipatrones documentados (Best Practice #93). |
| [`pre-cycle.yml`](./pre-cycle.yml) | Juez determinista PRE-v2.0 sobre PRs a archivos constitucionales. |

## Instalación

Ejecuta desde la raíz del repo, con credenciales que tengan scope `workflow`:

```bash
bash scripts/install-ci-workflows.sh
git add .github/workflows/
git commit -m "ci: install gate-honesty, memory-audit, pre-cycle workflows"
git push
```

### Cómo obtener un token con scope `workflow`

1. Ve a https://github.com/settings/tokens (o Settings → Developer settings →
   Personal access tokens → Fine-grained tokens).
2. Crea un token con los scopes:
   - `repo` (acceso a repos privados)
   - `workflow` (permite modificar GitHub Actions)
3. Úsalo para el push de instalación. Puedes revocarlo después.

Alternativamente, edita los 3 archivos directamente en la UI web de GitHub
(`https://github.com/yosietserga/agent-os-boilerplate/actions/new`) — la UI
web usa el token interno de GitHub que siempre tiene scope `workflow`.

## Verificación

Tras la instalación, abre cualquier PR y verifica que los 3 workflows se
disparen automáticamente.
