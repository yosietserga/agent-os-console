#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# investiga.sh — Comando canónico: `investiga <topic>`
#
# Investiga un tópico en internet (asumiendo falta de conocimientos del
# agente), sintetiza hallazgos, y propone adoptions via PRE-v2.0.
#
# RESUELVE: el comando `mejorate` solo escanea repos estáticos de GitHub.
# `investiga` busca en internet en tiempo real para descubrir amenazas
# emergentes, patrones nuevos, y state-of-the-art.
#
# Usa z-ai-web-dev-sdk (web_search + page_reader) via CLI.
# ════════════════════════════════════════════════════════════════════════
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\033[1;36m[INVESTIGA]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[ERR]\033[0m %s\n' "$*" >&2; }

TOPIC="${1:-}"
if [ -z "$TOPIC" ]; then
  echo "Uso: bash scripts/investiga.sh <topic> [num_results]"
  echo ""
  echo "Ejemplos:"
  echo "  bash scripts/investiga.sh 'prompt injection defenses 2026'"
  echo "  bash scripts/investiga.sh 'LLM agent self-critique patterns' 8"
  echo "  bash scripts/investiga.sh 'OWASP LLM top 10 2026' 5"
  echo ""
  echo "El script:"
  echo "  1. Busca en internet (web_search via z-ai CLI)"
  echo "  2. Lee las top N páginas (page_reader via z-ai CLI)"
  echo "  3. Sintetiza hallazgos en docs/research/<epoch>-<topic-slug>.md"
  echo "  4. Propone adoptions via PRE-v2.0 al final del reporte"
  exit 1
fi
NUM="${2:-8}"

TOPIC_SLUG=$(echo "$TOPIC" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g; s/--*/-/g; s/^-//; s/-$//' | head -c 60)
EPOCH=$(date +%s)
REPORT="docs/research/${EPOCH}-${TOPIC_SLUG}.md"

mkdir -p docs/research

log "Tópico: $TOPIC"
log "Resultados a buscar: $NUM"
log "Reporte: $REPORT"
echo ""

# Verificar z-ai CLI
if ! command -v z-ai >/dev/null 2>&1; then
  err "z-ai CLI no encontrado. Instala z-ai-web-dev-sdk."
  err "  npm install -g z-ai-web-dev-sdk"
  err "  o usa: npx z-ai function ..."
  exit 1
fi

# ── Paso 1: web search ──
log "Paso 1: Búsqueda en internet..."
SEARCH_JSON="/tmp/investiga-search-${EPOCH}.json"
if z-ai function -n web_search -a "{\"query\":\"$TOPIC\",\"num\":$NUM}" -o "$SEARCH_JSON" 2>&1 | tail -1; then
  log "  [OK] Resultados guardados en $SEARCH_JSON"
else
  err "Falló la búsqueda. Abortando."
  exit 1
fi

# ── Paso 2: leer top 5 páginas ──
log "Paso 2: Leyendo top 5 páginas..."
python3 << EOF
import json, subprocess, os, re

results = json.load(open("$SEARCH_JSON"))
print(f"  Total resultados: {len(results)}")

# Tomar top 5 URLs
top_urls = [(r['url'], r['name'], r['snippet']) for r in results[:5]]
pages_content = []

for i, (url, name, snippet) in enumerate(top_urls, 1):
    print(f"  [{i}/5] Leyendo: {name[:60]}...")
    page_json = f"/tmp/investiga-page-{i}-${EPOCH}.json"
    try:
        subprocess.run(
            ["z-ai", "function", "-n", "page_reader",
             "-a", json.dumps({"url": url}), "-o", page_json],
            capture_output=True, timeout=60
        )
        if os.path.exists(page_json):
            data = json.load(open(page_json))
            page_data = data.get('data', data) if isinstance(data, dict) else {}
            html = page_data.get('html','') or page_data.get('text','')
            # Strip HTML
            text = re.sub(r'<[^>]+>', ' ', html)
            text = re.sub(r'\s+', ' ', text).strip()
            pages_content.append({
                'url': url, 'name': name, 'snippet': snippet,
                'text': text[:8000],  # cap at 8KB per page
                'fetched': True
            })
        else:
            pages_content.append({'url': url, 'name': name, 'snippet': snippet, 'text': '', 'fetched': False})
    except Exception as e:
        print(f"    [WARN] {e}")
        pages_content.append({'url': url, 'name': name, 'snippet': snippet, 'text': '', 'fetched': False})

# Persistir para el paso 3
json.dump(pages_content, open(f"/tmp/investiga-pages-${EPOCH}.json", 'w'), ensure_ascii=False, indent=2)
print(f"  [OK] {sum(1 for p in pages_content if p['fetched'])}/5 páginas leídas")
EOF

# ── Paso 3: sintetizar reporte ──
log "Paso 3: Sintetizando reporte..."

python3 << EOF
import json, datetime

pages = json.load(open(f"/tmp/investiga-pages-${EPOCH}.json"))
search_results = json.load(open("$SEARCH_JSON"))

ts = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

report = f"""# Investigación: $TOPIC

> **Epoch:** $EPOCH
> **Timestamp:** {ts}
> **Generado por:** \`scripts/investiga.sh\` (comando canónico \`investiga <topic>\`)
> **Resultados buscados:** $NUM
> **Páginas leídas en profundidad:** {sum(1 for p in pages if p['fetched'])}/5

## Resumen ejecutivo

Este reporte se generó asumiendo **falta de conocimientos del agente** sobre el
tópico "$TOPIC". El agente buscó en internet, leyó las páginas más relevantes,
y sintetizó los hallazgos. Al final propone adoptions via PRE-v2.0.

## Resultados de búsqueda (top $NUM)

| # | Título | URL | Snippet |
| :---: | :--- | :--- | :--- |
"""
for i, r in enumerate(search_results[:$NUM], 1):
    name = r.get('name', '')[:60].replace('|', '\\|')
    url = r.get('url', '')
    snippet = r.get('snippet', '')[:200].replace('|', '\\|').replace('\n', ' ')
    report += f"| {i} | {name} | {url} | {snippet} |\n"

report += f"""
## Análisis profundo (top 5 páginas)

"""
for i, p in enumerate(pages, 1):
    fetched = "✓ leído" if p['fetched'] else "✗ falló"
    report += f"""### {i}. {p['name'][:80]}
- **URL:** {p['url']}
- **Estado:** {fetched}
- **Snippet:** {p['snippet'][:300]}

"""
    if p['fetched'] and p['text']:
        # Extract first 2000 chars of content
        report += f"""**Contenido extraído (primeros 2000 chars):**

```
{p['text'][:2000]}
```

"""
    report += "---\n\n"

report += f"""## Patrones detectados

El agente debe analizar el contenido arriba y extraer:

1. **Patrones técnicos canónicos** — defensas, técnicas, estructuras recurrentes
2. **Antipatrones a evitar** — vulnerabilidades conocidas, malas prácticas
3. **Adoptions propuestas para el boilerplate** — BP/AP/Killer Feature/skill/widget

## Adoptions propuestas (algoritmo Optimizador PRE-v2.0)

> **PENDIENTE:** el agente ejecutor (LLM o humano) debe leer este reporte,
> extraer los patrones, y aplicar las adoptions via rama \`pre/propose/investiga-{p[0] if False else $EPOCH}\`.

Criterios para cada adopción propuesta:
1. ¿Qué patrón concreto se detectó? (con cita a la URL fuente)
2. ¿Qué tipo de artefacto? (BP / AP / Killer Feature / skill / widget / MCP config)
3. ¿Dónde vive en el boilerplate? (ruta del archivo a crear/modificar)
4. ¿Reintroduce algún AP existente? (verificar contra anti-patterns.md)
5. ¿Duplica alguna BP existente? (verificar contra catálogo 100+7)
6. ¿Qué W de PSIM habilita? (W1-W8)

## Próximos pasos

- [ ] Agente ejecutor lee este reporte completo
- [ ] Extrae patrones concretos con citas
- [ ] Decide adoptions (mínimo 1, máximo 5 por sesión)
- [ ] Crea rama \`pre/propose/investiga-$EPOCH\`
- [ ] Aplica adoptions (BP/AP/Killer/skill/widget/MCP config)
- [ ] Commitea + pushea
- [ ] Anexa WIN-XXX al wins-ledger con clase W1 (Capability Strengthening)
- [ ] Si se detectó amenaza de seguridad nueva, anexar AP-XXX al anti-patterns

## Fuentes

"""
for p in pages:
    report += f"- [{p['name'][:80]}]({p['url']})\n"

for r in search_results[:$NUM]:
    if r not in [p for p in pages]:
        report += f"- [{r.get('name','')[:80]}]({r.get('url','')})\n"

report += f"""
---

> Reporte inmutable (Regla P9 extendida a \`docs/research/\`).
> Correcciones via nuevo reporte con \`[CORRIGE-RESEARCH-$EPOCH]\`.
> Generado por \`scripts/investiga.sh\` — comando canónico \`investiga <topic>\`.
"""

with open("$REPORT", 'w') as f:
    f.write(report)

print(f"  [OK] Reporte: $REPORT")
print(f"  [OK] {len(pages)} páginas analizadas, {len(search_results)} resultados listados")
EOF

log ""
log "Investigación completa. Reporte: $REPORT"
log ""
log "Próximos pasos (algoritmo Optimizador PRE-v2.0):"
log "  1. Lee $REPORT completo"
log "  2. Extrae patrones concretos con citas a las fuentes"
log "  3. Decide adoptions (BP/AP/Killer/skill/widget/MCP)"
log "  4. Crea rama pre/propose/investiga-$EPOCH"
log "  5. Aplica adoptions al boilerplate"
log "  6. Commitea + pushea + anexa WIN-XXX"
