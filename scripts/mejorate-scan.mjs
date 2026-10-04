// mejorate-scan.mjs — Comando canónico `mejorate` modo scan (read-only)
// Escanea los 10 repos de referencia de RADIOGRAFÍA del operador vía GitHub API
const TOKEN = "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";
const HEADERS = {
  "Authorization": `token ${TOKEN}`,
  "Accept": "application/vnd.github+json",
  "User-Agent": "agent-os-mejorate"
};

// Catálogo de repos de referencia del operador (radiografía de ingeniería inversa)
const REFERENCE_REPOS = [
  { repo: "browser-use/browser-use", category: "extraccion-estructural", role: "Fase 0 + Fase 3", desc: "Navegación web para agentes IA combinando visión artificial y análisis del DOM accesible. Extrae jerarquía de elementos interactivos, captura pantallas por sección, mapea user journeys completos." },
  { repo: "mendableai/firecrawl", category: "extraccion-estructural", role: "Fase 0 + Fase 3", desc: "Motor de crawling que convierte sitios completos en Markdown limpio, sitemaps y esquemas JSON estructurados para LLMs. Extrae SEO, OpenGraph, términos legales." },
  { repo: "punkpeye/awesome-mcp-servers", category: "inspeccion-tecnica", role: "Matriz MCP", desc: "Catálogo curado de servidores MCP: Chrome DevTools Protocol, Puppeteer, volcadores de tráfico. Permite inspeccionar WebGL, geometrías, shaders GLSL y getComputedStyle." },
  { repo: "modelcontextprotocol/servers", category: "inspeccion-tecnica", role: "Matriz MCP", desc: "Servidores MCP oficiales de Anthropic. Módulos puppeteer y fetch instrumentan navegador headless, interceptan APIs internas y contratos JSON no documentados." },
  { repo: "abi/screenshot-to-code", category: "replicacion-visual", role: "Fase 3", desc: "Convierte capturas de pantalla y videos en código frontend limpio (React, Tailwind, Vue). Extrae proporciones espaciales, tipografías y sombras hacia tokens Apple Light." },
  { repo: "e2b-dev/fragments", category: "replicacion-visual", role: "Fase 5", desc: "Sandboxes aislados para que agentes generen, ejecuten y previsualicen apps Next.js, Vite y Three.js en caliente. Verifica compilación de shaders WebGL y FPS." },
  { repo: "crewAIInc/crewAI-tools", category: "agent-skills", role: "Subagentes", desc: "Herramientas empaquetadas como skills: SeleniumScrapingTool, ScrapeWebsiteTool, DirectoryReadTool. Equipo de agentes: extractor de assets, analista de contratos, sintetizador." },
  { repo: "microsoft/autogen", category: "agent-skills", role: "Skills Library", desc: "Arquitectura de habilidades reutilizables y persistentes (autogen.agentchat.contrib). Registro de funciones de ingeniería inversa en biblioteca local determinista." },
  { repo: "assafelovic/gpt-researcher", category: "modelo-negocio", role: "Fase 2 + Porter", desc: "Agente autónomo de investigación comprensiva: mapea pricing, analiza propuestas de valor, extrae testimonios y pain points, audita canales y pasarelas de pago." },
  { repo: "Significant-Gravitas/AutoGPT", category: "modelo-negocio", role: "Fase 2 + Sagas", desc: "Framework de bloques modulares y pipelines: procesamiento web, análisis de sitemaps, parsing APIs REST/GraphQL, ejecución en sandboxes. Orquestación secuencial por lotes." },
];

const KEY_PATTERNS = [
  "agents.md", "skills/", "skill.md", ".cursorrules", "claude.md", "gemini.md",
  "system-prompt", "system_prompt", "prompt", "personas", "aci", "browser",
  "dom", "screenshot", "vision", "crawl", "scrape", "shader", "webgl", "three",
  "mcp", "sandbox", "planner", "router", "fallback", "circuit", "evaluator",
  "orchestrat", "headless", "devtools", "puppeteer", "playwright"
];

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers: HEADERS });
  if (!res.ok) return { __error: res.status };
  return res.json();
}

async function main() {
  const results = [];
  for (const entry of REFERENCE_REPOS) {
    process.stdout.write(`[MEJORATE] Escaneando: ${entry.repo} (${entry.category})\n`);
    const meta = await gh(`/repos/${entry.repo}`);
    if (meta.__error) {
      process.stdout.write(`  ERR ${meta.__error}\n`);
      results.push({ ...entry, error: meta.__error });
      continue;
    }
    const branch = meta.default_branch || "main";
    const tree = await gh(`/repos/${entry.repo}/git/trees/${branch}?recursive=1`);
    let topDirs = [];
    let keyFiles = [];
    let truncated = false;
    if (!tree.__error && tree.tree) {
      truncated = tree.truncated === true;
      const dirs = new Set();
      for (const t of tree.tree) {
        if (t.type === "tree") dirs.add(t.path.split("/")[0]);
      }
      topDirs = [...dirs].sort().slice(0, 18);
      keyFiles = tree.tree
        .filter(t => t.type === "blob" && KEY_PATTERNS.some(p => t.path.toLowerCase().includes(p)))
        .slice(0, 12)
        .map(t => ({ path: t.path, size: t.size }));
    }
    const stars = meta.stargazers_count;
    const sizeKb = meta.size;
    const lang = meta.language;
    const desc = meta.description;
    results.push({
      ...entry,
      stars,
      sizeKb,
      branch,
      language: lang,
      ghDescription: desc,
      topics: meta.topics || [],
      pushedAt: meta.pushed_at,
      topDirs,
      keyFiles,
      truncated,
      license: meta.license?.spdx_id || null,
    });
    process.stdout.write(`  Stars: ${stars} · ${lang} · ${sizeKb}KB · ${topDirs.length} dirs top-level\n`);
  }
  await Bun.write("mejorate-scan-results.json", JSON.stringify(results, null, 2));
  process.stdout.write(`\n[MEJORATE] Scan completado: ${results.length} repos → mejorate-scan-results.json\n`);
  const totalStars = results.reduce((a, r) => a + (r.stars || 0), 0);
  process.stdout.write(`[MEJORATE] Stars totales del catálogo: ${totalStars.toLocaleString()}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
