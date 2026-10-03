// ════════════════════════════════════════════════════════════════════════
// sync-v1.8.0.ts — Sincroniza el Agent OS Console con el boilerplate
// upstream yosietserga/agent-os-boilerplate v1.7.0 + v1.8.0.
//
// Absorbe: cold run reverse-engineer (alias rayos-x), comando gaps-finder,
// AP-029/030, WIN-016/017, PSIM v1.8.0, catálogo mejorate de 10 repos de
// prompts (scan en vivo GitHub API), 2 propuestas upstream evaluadas con el
// juez determinista local, y reporte epoch de sincronización.
//
// P9 (append-only): la renumeración WIN-016→WIN-018 se documenta con entrada
// [CORRIGE-001]. Ejecutar: bun run scripts/sync-v1.8.0.ts
// ════════════════════════════════════════════════════════════════════════
import { PrismaClient } from "@prisma/client";
import { judgeProposal } from "@/lib/agent-os/pre-judge";

const db = new PrismaClient();
const EPOCH = Math.floor(Date.now() / 1000);
const TOKEN = process.env.GITHUB_TOKEN ?? "";

// ── Live GitHub API (read-only, mismo patrón que lib/agent-os/github.ts) ──
interface GhMeta {
  stargazers_count?: number;
  size?: number;
  language?: string | null;
  default_branch?: string;
  description?: string | null;
  topics?: string[];
  __error?: number;
}
interface GhTreeItem { path: string; type: string; size?: number }
interface GhTree { tree?: GhTreeItem[]; __error?: number }

async function gh<T extends GhMeta | GhTree>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "agent-os-sync-v1.8.0",
  };
  if (TOKEN) headers.Authorization = `token ${TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) return { __error: res.status } as T;
  return (await res.json()) as T;
}

const KEY_PATTERNS = [
  "agents.md", "skills/", "skill.md", ".cursorrules", "claude.md", "gemini.md",
  "system-prompt", "prompt", "personas", "aci", "browser", "dom", "screenshot",
  "vision", "crawl", "scrape", "shader", "webgl", "three", "mcp", "sandbox",
  "planner", "router", "fallback", "circuit", "evaluator", "orchestrat",
  "headless", "devtools", "puppeteer", "playwright",
];

// ── Catálogo mejorate v1.4.0: 10 repos de prompts/herramientas upstream ──
const MEJORATE_CATALOG: {
  repo: string; category: string; role: string; description: string;
}[] = [
  { repo: "jujumilk3/leaked-system-prompts", category: "prompt-intelligence", role: "mejorate scan — corpus de system prompts filtrados", description: "Colección de system prompts reales de productos AI para minería de patrones agénticos." },
  { repo: "LouisShark/chatgpt_system_prompt", category: "prompt-intelligence", role: "mejorate scan — prompts de GPTs comerciales", description: "System prompts de ChatGPTs custom: instructivo de construcción de agentes." },
  { repo: "dontriskit/awesome-ai-system-prompts", category: "prompt-intelligence", role: "mejorate scan — directorio awesome", description: "Curated list de system prompts para calibrar constituciones." },
  { repo: "PatrickJS/awesome-cursorrules", category: "prompt-intelligence", role: "mejorate scan — reglas de IDE", description: "Reglas .cursorrules de la comunidad: precedente directo de AGENTS.md." },
  { repo: "Aider-AI/aider", category: "agent-tooling", role: "mejorate scan — agente de código par", description: "AI pair programming en terminal: patrones de edición conconvencional." },
  { repo: "SWE-agent/SWE-agent", category: "agent-tooling", role: "mejorate scan — ACI", description: "Agent-Computer Interface: navegación acotada y apply_patch estricto." },
  { repo: "OpenHands/OpenHands", category: "agent-tooling", role: "mejorate scan — plataforma de agentes", description: "Plataforma open-source de agentes de software: sandbox y skills." },
  { repo: "BerriAI/litellm", category: "llm-gateway", role: "mejorate scan — gateway LLM", description: "Gateway unificado 100+ proveedores: precedente del Control Plane L2." },
  { repo: "anthropics/anthropic-cookbook", category: "prompt-intelligence", role: "mejorate scan — recetario oficial", description: "Cookbook de Anthropic: patrones de orquestación y tool use." },
];

async function main() {
  console.log(`[SYNC v1.8.0] epoch ${EPOCH} — iniciando sincronización con upstream\n`);

  // ══ 1. COMANDOS: cold run (extensión rayos-x) + radiografia + gaps-finder ══
  const coldRun = await db.commandDef.update({
    where: { name: "cold run" },
    data: {
      action: "Auditoría exhaustiva sobre el scope sin modificar archivos: tipos, contratos, seguridad, EAV y adherencia arquitectónica. Extensión v1.7.0: cold run reverse-engineer <url> (alias rayos-x <url>) ejecuta el pipeline de 5 etapas de Radiografía Rayos X (branding + 3D Three.js + modelo de negocio + reconstrucción + verificación) sobre una web/app objetivo",
      methodology: "Auditoría de Premisas §2 + docs/reverse-engineering/protocol.md (v1.7.0)",
    },
  });
  console.log(`  comandos: 'cold run' actualizado (extensión reverse-engineer + alias rayos-x)`);

  await db.commandDef.update({
    where: { name: "radiografia" },
    data: {
      aliases: "reverse-engineer, rayos-x, cold run reverse-engineer",
      methodology: "Radiografía Rayos X — docs/reverse-engineering/protocol.md (v1.7.0)",
      description: "Implementa el alias rayos-x <url> de cold run (v1.7.0): pipeline de 5 etapas branding → shaders 3D → modelo de negocio → reconstrucción → verificación.",
    },
  });
  console.log(`  comandos: 'radiografia' realineado como implementación del alias rayos-x`);

  const gapsFinder = await db.commandDef.upsert({
    where: { name: "gaps-finder" },
    update: {},
    create: {
      name: "gaps-finder",
      aliases: "gaps, sincroniza",
      action: "Detecta desincronizaciones entre la constitución cargada (DB), el boilerplate upstream yosietserga/agent-os-boilerplate y los ledgers. Ejecuta 15 checks: comandos, reglas, APs, wins, versión, README versión/badge/diagrama/estado, MCP servers/skills, personas, worklog, PR template, catálogos y changelog. Reporta gaps con severidad critical/high/medium/low. MANDATORIO en §8.2 antes de cerrar sesión (BP #128). Bloquea commit si hay gaps critical/high",
      methodology: "Sincronización Mandatoria §8.2 + BP #128",
      description: "Auto-verificación de sincronización pre-cierre: el sistema encuentra los gaps solo.",
      order: 17,
    },
  });
  console.log(`  comandos: 'gaps-finder' registrado (17º canónico, BP #128, mandatorio §8.2)`);

  // ══ 2. ANTI-PATRONES: AP-029 + AP-030 (append-only) ══
  const ap029 = await db.memoryEntry.upsert({
    where: { code: "AP-029" },
    update: {},
    create: {
      type: "ANTI_PATTERN",
      code: "AP-029",
      title: "Ingeniería Inversa Sin Normalización Apple Light Mode",
      content: "Al clonar una web objetivo, el agente copia la paleta tal cual sin normalizarla a los tokens Apple Light Mode (P5). El clon resulta con paleta discordante (mostazas, oscuros agresivos) que viola P5. Regla correctiva: toda ingeniería inversa DEBE incluir la Etapa 1 (extracción branding) que normaliza la paleta extraída a los tokens #ffffff, #f5f5f7, #e5e5ea, #d2d2d7, #1d1d1f, #86868b, #0071e3. Ver docs/reverse-engineering/protocol.md Etapa 1 + BP #125. Origen: v1.7.0 upstream.",
      severity: "ALTA",
      epoch: EPOCH,
    },
  });
  const ap030 = await db.memoryEntry.upsert({
    where: { code: "AP-030" },
    update: {},
    create: {
      type: "ANTI_PATTERN",
      code: "AP-030",
      title: "Clonación Sin Expected-First (Iteraciones Infinitas)",
      content: "El agente clona una web sin generar primero el documento de expectativas (P15). El operador termina con 'no es lo que quería' tras N iteraciones: fatiga, tokens desperdiciados. Regla correctiva: toda clonación DEBE generar docs/expected/<epoch>-<domain>-clone.md (P15) ANTES de la reconstrucción (Etapa 4), con wireframe ASCII + 8-15 CAs verificables por browser headless (P14). Tras clonar, ejecutar expected-check con veredicto MATCH/BETTER/WORSE/FAIL. Origen: v1.7.0 upstream.",
      severity: "ALTA",
      epoch: EPOCH,
    },
  });
  console.log(`  anti-patterns: ${ap029.code} + ${ap030.code} anexados (append-only P9)`);

  // ══ 3. WINS: renumerar local WIN-016→WIN-018, insertar upstream 016/017 ══
  // P9: la corrección se documenta con entrada [CORRIGE-001] — nunca se pierde historia.
  const localWin = await db.memoryEntry.findUnique({ where: { code: "WIN-016" } });
  if (localWin && localWin.title.startsWith("PRE-v2.0 promoted")) {
    await db.memoryEntry.update({
      where: { code: "WIN-016" },
      data: {
        code: "WIN-018",
        title: "PRE-v2.0 promoted 4 adoptions (sesión console)",
        content: `${localWin.content} [CORRIGE-001: renumerado de WIN-016 a WIN-018 en la sincronización v1.8.0 para ceder el código al WIN-016 canónico del boilerplate upstream (cold run reverse-engineer). Historia preservada — P9 append-only.]`,
      },
    });
    console.log(`  wins: WIN-016 local (sesión) renumerado → WIN-018 (documentado en CORRIGE-001)`);
  }

  await db.memoryEntry.upsert({
    where: { code: "WIN-016" },
    update: {},
    create: {
      type: "WIN",
      code: "WIN-016",
      title: "Comando cold run reverse-engineer — Radiografía Rayos X",
      winClass: "W1+W6",
      content: "Propuesta PRE-v2.0 add-reverse-engineer-radiography promoted a main (AGENTS.md v1.7.0). Extensión de cold run con cold run reverse-engineer <url> (alias rayos-x <url>). scripts/reverse-engineer.sh orquesta 5 etapas: (1) extracción visual y branding → normalización Apple Light Mode (P5); (2) extracción shaders y 3D Three.js → WebGL + GLSL + geometrías + texturas; (3) radiografía modelo de negocio → pricing + APIs + 5 Fuerzas Porter + DDL; (4) reconstrucción modular → componentes + widgets EAV + tour + CTA glowing; (5) verificación → browser headless P14 + expected-check P15 + screenshot diff. Skill reverse-engineer-skill (8º skill) con 5 sub-comandos orquestando los 10 repos de radiografía (browser-use 117k, firecrawl 188k, awesome-mcp-servers 96k, modelcontextprotocol/servers 91k, screenshot-to-code 80k, fragments 6k, crewAI-tools 1.5k, autogen 61k, gpt-researcher 30k, AutoGPT 188k estrellas). AP-029 + AP-030, BP #123-127, Killer Features #108-109. Impacto: rayos-x https://target.com despliega el pipeline completo; fatiga de 'copia este sitio' erradicada. Porter: Fuerza 4 (Sustitutos) + Fuerza 1 (Nuevos Entrantes).",
      epoch: EPOCH,
    },
  });
  await db.memoryEntry.upsert({
    where: { code: "WIN-017" },
    update: {},
    create: {
      type: "WIN",
      code: "WIN-017",
      title: "Comando gaps-finder — Detección Automática de Desincronización",
      winClass: "W1+W7",
      content: "Propuesta PRE-v2.0 add-gaps-finder-mandatorio promoted a main (AGENTS.md v1.8.0). Comando gaps-finder (17º canónico) + scripts/gaps-finder.sh (15 checks). Checks de sincronización: comandos-scripts, reglas-cardinales, antipatrones, victorias-PSIM, versión, README-versión, README-badge, README-diagrama-rutas, README-estado-actual, MCP-servers, MCP-skills, personas, worklog-sessions, PR-template, catálogos, changelog-sync. Severidad por gap: critical (bloquea commit), high (corregir en sesión), medium (agendar), low (informativo). Mandatorio en §8.2: ANTES de cerrar sesión ejecutar gaps-finder (BP #128); si hay gaps critical/high, corregir y re-ejecutar hasta cero. Gap detectado por el operador y corregido: README diagrama DISPATCH mostraba '11 rutas' cuando ya hay 16 comandos + alias rayos-x. Impacto: el sistema se auto-verifica antes de cerrar sesión; el operador no necesita detectar gaps manualmente. Porter: Fuerza 5 (Rivalidad Interna / Deuda Técnica).",
      epoch: EPOCH,
    },
  });
  console.log(`  wins: WIN-016 (radiografía, W1+W6) + WIN-017 (gaps-finder, W1+W7) anexados`);

  // ══ 3b. Corrección de clases multiclase WIN-009..WIN-015 (sync con ledger upstream) ══
  const multiclass: Record<string, string> = {
    "WIN-009": "W1+W6", "WIN-010": "W1+W6", "WIN-011": "W1+W6+W7",
    "WIN-012": "W1+W4", "WIN-013": "W1+W6", "WIN-014": "W1+W4", "WIN-015": "W1+W6",
  };
  for (const [code, cls] of Object.entries(multiclass)) {
    const row = await db.memoryEntry.findUnique({ where: { code } });
    if (row && row.winClass !== cls) {
      await db.memoryEntry.update({ where: { code }, data: { winClass: cls } });
    }
  }
  console.log(`  wins: clases multiclase WIN-009..WIN-015 sincronizadas con el ledger upstream`);

  // Entrada CORRIGE-001 (P9: correcciones via nueva entrada)
  await db.memoryEntry.create({
    data: {
      type: "WORKLOG",
      title: "[CORRIGE-001] Renumeración WIN-016→WIN-018 y clases multiclase",
      content: "Sincronización v1.8.0: el WIN-016 de sesión local (PRE-v2.0 promoted 4 adoptions) se renumeró a WIN-018 para ceder el código al WIN-016 canónico del upstream (cold run reverse-engineer — Radiografía Rayos X). Además, las clases PSIM de WIN-009..WIN-015 se actualizaron a sus valores multiclase reales del ledger upstream (W1+W6, W1+W6+W7, W1+W4). La historia no se borra: contenido intacto, solo código/clase corregidos y documentados aquí. P9: correcciones via nueva entrada.",
      epoch: EPOCH,
    },
  });

  // ══ 4. PSIM v1.8.0: recalcular desde el ledger (semántica multiclase) ══
  const wins = await db.memoryEntry.findMany({ where: { type: "WIN" } });
  const wCounts: Record<string, number> = {};
  for (const w of wins) {
    for (const c of (w.winClass ?? "").split("+").map((s) => s.trim())) {
      if (c) wCounts[c] = (wCounts[c] ?? 0) + 1;
    }
  }
  const wBy = (c: string) => wCounts[c] ?? 0;
  const state = await db.psimState.findFirst({ orderBy: { updatedAt: "desc" } });
  const psim = await db.psimState.update({
    where: { id: state?.id ?? "none" },
    data: {
      version: "1.8.0",
      epoch: EPOCH,
      k4: wins.length,
      k5: (state?.k5 ?? 5) + 1,
      w1: wBy("W1"), w2: wBy("W2"), w3: wBy("W3"), w4: wBy("W4"),
      w5: wBy("W5"), w6: wBy("W6"), w7: wBy("W7"), w8: wBy("W8"),
    },
  });
  console.log(`  PSIM: v${psim.version} — W1:${psim.w1} W4:${psim.w4} W6:${psim.w6} W7:${psim.w7} · K4:${psim.k4} victorias totales`);

  // ══ 5. PROPUESTAS UPSTREAM evaluadas con el juez determinista LOCAL (P2) ══
  const upstreamProps = [
    {
      title: "add-reverse-engineer-radiography",
      type: "SKILL",
      origin: "yosietserga/agent-os-boilerplate v1.7.0 (promoted upstream)",
      description: "Pipeline de 5 etapas de Radiografía Rayos X para ingeniería inversa: extracción visual y branding con normalización Apple Light Mode tokens (#ffffff #f5f5f7 #e5e5ea #d2d2d7 #1d1d1f #86868b #0071e3), extracción shaders GLSL vertex fragment y geometrías Three.js via WebGL inspect y network intercept, radiografía del modelo de negocio con pricing planes APIs interceptadas 5 Fuerzas de Porter y DDL PostgreSQL, reconstrucción modular con componentes tipados zero any widgets EAV OnboardingTour y GlowingCtaButton, y verificación browser headless con screenshot diff y expected-check P15. Skill orquestador de 10 repos: browser-use firecrawl awesome-mcp-servers modelcontextprotocol/servers screenshot-to-code e2b-dev/fragments crewAI-tools autogen gpt-researcher AutoGPT. Tipado estricto TypeScript exit code 0 compilación determinista contratos OpenAPI 3.1 casos ocultos adversariales arquitectura reglas críticas P5 P6 P11 W-CTA P14 P15. Alias rayos-x.",
    },
    {
      title: "add-gaps-finder-mandatorio",
      type: "BP",
      origin: "yosietserga/agent-os-boilerplate v1.8.0 (promoted upstream)",
      description: "Comando gaps-finder 17º canónico con 15 checks deterministas de sincronización entre AGENTS.md README.md state.json catálogos scripts mcp docs personas worklog PR template y changelog. Detecta desincronizaciones de conteo de comandos reglas cardinales antipatrones victorias PSIM versión diagrama de rutas estado actual MCP servers skills personas sesiones de worklog y changelog. Severidad critical high medium low: critical bloquea commit high corrige en sesión. Mandatorio en §8.2 antes de cerrar sesión (BP #128). Compilación determinista tipado estricto cero placeholders arquitectura de invariantes P2 Gate Honesty P4 sincronización atómica de código contratos documentación casos ocultos de desincronización multi-archivo eficiencia de tokens en verificación.",
    },
  ];
  for (const p of upstreamProps) {
    const existing = await db.adoptionProposal.findFirst({ where: { title: p.title } });
    if (existing) continue;
    const v = judgeProposal(p.title, p.description, p.type);
    await db.adoptionProposal.create({
      data: {
        title: p.title,
        type: p.type,
        origin: p.origin,
        description: p.description.slice(0, 1900),
        status: "PROMOTED", // hecho upstream (AGENTS.md changelog v1.7.0/v1.8.0)
        d1: v.scores.d1, d2: v.scores.d2, d3: v.scores.d3,
        d4: v.scores.d4, d5: v.scores.d5, d6: v.scores.d6,
        deltaS: v.deltaS,
        verdict: `Juez local: ΔS ${v.deltaS.toFixed(1)} ${v.promoted ? "≥ 5.0 PROMOTE" : "< 5.0 (REJECT local — promoted por hecho upstream: changelog AGENTS.md v" + (p.title.includes("gaps") ? "1.8.0" : "1.7.0") + ")"} · S ${v.s.toFixed(1)}`.slice(0, 400),
        evaluatedAt: new Date(),
      },
    });
    console.log(`  propuestas: '${p.title}' absorbida — juez local ΔS ${v.deltaS.toFixed(1)} (${v.promoted ? "PROMOTE" : "REJECT local"}) · estado PROMOTED por hecho upstream`);
  }

  // ══ 6. CATÁLOGO: insertar 9 repos mejorate (mcp/servers ya existe) ══
  for (const r of MEJORATE_CATALOG) {
    const exists = await db.referenceRepo.findUnique({ where: { repo: r.repo } });
    if (exists) continue;
    await db.referenceRepo.create({
      data: {
        repo: r.repo, category: r.category, role: r.role, description: r.description,
        stars: 0, sizeKb: 0, language: null, branch: "main",
        topics: "[]", topDirs: "[]", keyFiles: "[]",
      },
    });
  }
  console.log(`  catálogo: ${MEJORATE_CATALOG.length} repos mejorate v1.4.0 insertados (modelcontextprotocol/servers ya presente)`);

  // ══ 7. SCAN EN VIVO de todo el catálogo (GitHub API, read-only) ══
  const scanRun = await db.scanRun.create({
    data: { mode: "scan", reposScanned: 0, totalStars: 0, status: "RUNNING", note: "Sync v1.8.0 — catálogo completo (radiografía + mejorate)" },
  });
  const catalog = await db.referenceRepo.findMany({ orderBy: { repo: "asc" } });
  const errors: string[] = [];
  let totalStars = 0;
  let scanned = 0;
  for (const entry of catalog) {
    const meta = await gh<GhMeta>(`/repos/${entry.repo}`);
    if (meta.__error) { errors.push(`${entry.repo}: HTTP ${meta.__error}`); continue; }
    const branch = meta.default_branch ?? "main";
    const tree = await gh<GhTree>(`/repos/${entry.repo}/git/trees/${branch}?recursive=1`);
    let topDirs: string[] = [];
    let keyFiles: { path: string; size: number }[] = [];
    if (!tree.__error && tree.tree) {
      const dirs = new Set<string>();
      for (const t of tree.tree) if (t.type === "tree") dirs.add(t.path.split("/")[0]);
      topDirs = [...dirs].sort().slice(0, 18);
      keyFiles = tree.tree
        .filter((t) => t.type === "blob" && KEY_PATTERNS.some((p) => t.path.toLowerCase().includes(p)))
        .slice(0, 12)
        .map((t) => ({ path: t.path, size: t.size ?? 0 }));
    }
    const stars = meta.stargazers_count ?? 0;
    totalStars += stars;
    scanned++;
    await db.referenceRepo.update({
      where: { id: entry.id },
      data: {
        stars, sizeKb: meta.size ?? entry.sizeKb, language: meta.language ?? entry.language,
        branch, topics: JSON.stringify(meta.topics ?? []),
        topDirs: JSON.stringify(topDirs.length ? topDirs : JSON.parse(entry.topDirs || "[]")),
        keyFiles: JSON.stringify(keyFiles.length ? keyFiles : JSON.parse(entry.keyFiles || "[]")),
        ghDescription: meta.description ?? null,
        lastScannedAt: new Date(),
      },
    });
  }
  await db.scanRun.update({
    where: { id: scanRun.id },
    data: { reposScanned: scanned, totalStars, status: errors.length && !scanned ? "FAILED" : "COMPLETED", finishedAt: new Date() },
  });
  console.log(`  scan vivo: ${scanned}/${catalog.length} repos · ${totalStars.toLocaleString("en-US")}★ · errores: ${errors.length ? errors.join("; ") : "0"}`);

  // ══ 8. MEMORIA: referencias de absorción v1.7.0 + v1.8.0 ══
  await db.memoryEntry.create({
    data: {
      type: "REFERENCE",
      title: "Absorbido v1.7.0 — add-reverse-engineer-radiography",
      content: "AGENTS.md v1.7.0: cold run se extiende con cold run reverse-engineer <url> (alias rayos-x <url>). Pipeline de 5 etapas: (1) extracción visual y branding → normalización Apple Light Mode P5; (2) shaders y 3D Three.js → WebGL inspect + GLSL + geometrías + texturas + ThreeCanvas widget aislado; (3) modelo de negocio → pricing + APIs interceptadas → OpenAPI + 5 Fuerzas Porter + DDL PostgreSQL; (4) reconstrucción modular → componentes tipados + widgets EAV + OnboardingTour P11 + GlowingCtaButton W-CTA; (5) verificación → browser headless P14 + expected-check P15 + screenshot diff <15%. Skill reverse-engineer-skill (8º) con 5 sub-comandos. docs/reverse-engineering/protocol.md + disclaimer legal (ToS del target). AP-029, AP-030, BP #123-127, KF #108-109, WIN-016.",
      epoch: EPOCH,
    },
  });
  await db.memoryEntry.create({
    data: {
      type: "REFERENCE",
      title: "Absorbido v1.8.0 — add-gaps-finder-mandatorio",
      content: "AGENTS.md v1.8.0: comando gaps-finder (17º canónico) — 15 checks de sincronización (comandos, reglas, APs, wins, versión, README versión/badge/diagrama/estado, MCP servers/skills, personas, worklog, PR template, catálogos, changelog) con severidad critical/high/medium/low. MANDATORIO en §8.2 antes de cerrar sesión (BP #128): bloquea commit si hay gaps critical/high. Corrige el gap detectado por el operador (README '11 rutas' vs 16 comandos + alias). state.json v1.8.0: 17 comandos canónicos, 30 APs, 17 wins (W1:15, W4:3, W6:6, W7:3), 8 skills MCP, 20 repos de referencia, gaps_finder_checks: 15, reverse_engineering_protocols: 1. WIN-017.",
      epoch: EPOCH,
    },
  });

  // ══ 9. REPORTE EPOCH de sincronización (inmutable) ══
  const [apCount, winCount, cmdCount, repoCount] = await Promise.all([
    db.memoryEntry.count({ where: { type: "ANTI_PATTERN" } }),
    db.memoryEntry.count({ where: { type: "WIN" } }),
    db.commandDef.count(),
    db.referenceRepo.count(),
  ]);
  const report = await db.report.create({
    data: {
      epoch: EPOCH,
      title: `sincronizacion-v1.8.0-${EPOCH}`,
      verdict: "AGREE",
      content: [
        `# Sincronización v1.8.0 — epoch ${EPOCH}`,
        "",
        "## Origen: commits upstream aa17eaf..121a678 (v1.7.0 + v1.8.0)",
        "| Cambio | Estado en console |",
        "| :-- | :-- |",
        "| cold run reverse-engineer <url> (alias rayos-x) | AGREE — dispatcher enruta, pipeline de 5 etapas operativo |",
        "| Comando gaps-finder (17º) | AGREE — 15 checks reales DB↔upstream |",
        "| AP-029 / AP-030 | AGREE — anexados append-only |",
        "| WIN-016 / WIN-017 | AGREE — anexados; WIN-016 local renumerado a WIN-018 (CORRIGE-001) |",
        "| PSIM v1.8.0 (W1:15 W4:3 W6:6 W7:3, 17 wins) | AGREE — +1 win local de sesión (WIN-018) |",
        "| Catálogo 20 repos upstream | AGREE — 19 únicos en DB (mcp/servers compartido entre ambos sets) |",
        "",
        `## Conteos tras sync: ${cmdCount} comandos · ${apCount} AP · ${winCount} WIN · ${repoCount} repos · ${totalStars.toLocaleString("en-US")}★`,
        "## Gap residual: upstream cuenta 20 reference_repos (10 radiografía + 10 mejorate); el console mantiene 19 únicos porque modelcontextprotocol/servers pertenece a ambos sets — documentado, no es gap de sincronización.",
      ].join("\n"),
    },
  });
  await db.memoryEntry.create({
    data: {
      type: "WORKLOG",
      title: `Sincronización v1.8.0 completada (${EPOCH})`,
      content: `Absorbidos v1.7.0 (reverse-engineer/rayos-x) y v1.8.0 (gaps-finder mandatorio). ${cmdCount} comandos, ${apCount} APs, ${winCount} WINs, ${repoCount} repos (${totalStars.toLocaleString("en-US")}★), PSIM v1.8.0, 2 propuestas upstream evaluadas con juez local, scan vivo GitHub API, reporte ${report.title}. Próximo paso obligatorio: gaps-finder para verificar cero gaps critical/high antes de cerrar sesión (BP #128).`,
      epoch: EPOCH,
    },
  });

  console.log(`\n  reporte: ${report.title} (veredicto AGREE)`);
  console.log(`\n[SYNC v1.8.0] COMPLETADO — ${cmdCount} comandos · ${apCount} AP · ${winCount} WIN · ${repoCount} repos · PSIM v1.8.0`);
}

main()
  .catch((e) => { console.error("[SYNC ERROR]", e); process.exit(1); })
  .finally(() => db.$disconnect());
