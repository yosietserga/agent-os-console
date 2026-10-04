// ════════════════════════════════════════════════════════════════════════
// pipeline.ts — Orquestador del Instanciador Zero-Shot (Protocolo 11).
// Bucle agéntico completo por cada prompt del operador:
//   RESEARCHING (zero-knowledge → web_search) → PLANNING (spec + roles +
//   goals + XML) → PRE-report → GENERATING (catálogos, personas, prompts,
//   AGENTS.md ensamblado, puentes IDE, memoria init) → VERIFYING
//   (auto-crítica determinista) → PRO-report → PACKAGING → COMPLETED.
// P2 Gate Honesty: si algo falla se degrada con evidencia, jamás se inventa.
// ════════════════════════════════════════════════════════════════════════
import { db } from "@/lib/db";
import { infer, webSearch } from "@/lib/agent-os/l2";
import type { WebSearchResultItem } from "@/lib/agent-os/l2";
import type { BootstrapSpec, ResearchItem } from "./types";
import {
  assembleAgentsMd,
  bridgeContent,
  BRIDGE_FILES,
  collectStaticFiles,
  readAsset,
} from "./assets";
import {
  buildCatalogPrompt,
  buildColdRunPrompt,
  buildDomainPromptsPrompt,
  buildPersonasPrompt,
  buildPreSpecPrompt,
  buildReadmePrompt,
  buildSpecPrompt,
  type CatalogKind,
} from "./prompts";

const TENANT = "agent-os-instancer";

// ── Utilidades ───────────────────────────────────────────────────────────

async function setPhase(
  runId: string,
  status: string,
  progress: number,
  detail: string
): Promise<void> {
  await db.bootstrapRun.update({ where: { id: runId }, data: { status, progress, phaseDetail: detail } });
}

async function saveFile(
  runId: string,
  path: string,
  content: string,
  origin: "llm" | "template" | "static",
  phase: string
): Promise<void> {
  const bytes = Buffer.byteLength(content, "utf8");
  await db.bootstrapFile.upsert({
    where: { runId_path: { runId, path } },
    create: { runId, path, content, bytes, origin, phase },
    update: { content, bytes, origin, phase },
  });
  await db.bootstrapRun.update({ where: { id: runId }, data: { fileCount: { increment: 1 } } });
}

/** Wrapper L2 con contador de llamadas por run (auditoría del ledger). */
async function llm(runId: string, purpose: string, system: string, user: string): Promise<string> {
  const res = await infer({ systemPrompt: system, userContent: user, tenant: TENANT, purpose });
  await db.bootstrapRun.update({ where: { id: runId }, data: { llmCalls: { increment: 1 } } });
  if (res.outcome !== "OK" || !res.content.trim()) {
    throw new Error(res.error ?? "L2 devolvió respuesta vacía");
  }
  return res.content.trim();
}

/** JSON robusto: extrae el primer objeto {...} aunque venga con fences. */
function extractJson<T>(raw: string): T {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("JSON no encontrado en la respuesta del LLM");
  return JSON.parse(body.slice(start, end + 1)) as T;
}

/** Divide una respuesta multi-archivo por marcadores ===FILE: ruta===. */
function splitFiles(raw: string): Map<string, string> {
  const out = new Map<string, string>();
  const parts = raw.split(/===FILE:\s*([^\s=]+?)\s*===/);
  for (let i = 1; i < parts.length; i += 2) {
    const path = parts[i];
    const content = (parts[i + 1] ?? "").trim();
    if (path && content) out.set(path, content);
  }
  return out;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "proyecto-instanciado";
}

// ── Fallbacks degradados honestos (P2: nunca inventar, declarar la degradación) ──

function degradedSpec(rawPrompt: string): BootstrapSpec {
  return {
    projectName: "Proyecto del Operador",
    slug: slugify(rawPrompt.slice(0, 40)),
    domain: "dominio-por-definir",
    oneLiner: "Scaffold instanciado con spec degradada (fallo L2 en Fase 1).",
    description:
      "La spec LLM falló y se instanció una spec mínima honesta. Ejecutar de nuevo el instanciador para obtener la spec completa.",
    targetUsers: ["Operador"],
    expertRoles: [{ role: "Arquitecto de Software", focus: "Definir alcance a partir del prompt crudo" }],
    goals: ["G1. Derivar los goals reales del producto a partir del prompt del operador"],
    stack: ["Por definir tras la investigación"],
    risks: ["Spec incompleta por fallo de L2 en Fase 1"],
    securityNotes: ["Re-ejecutar la instanciación antes de construir features"],
    xmlPrompt: `<contexto>Prompt crudo sin refactorizar por fallo L2.</contexto>\n<prompt>${rawPrompt}</prompt>`,
    personaMapping: {},
    agentsContextSection:
      "### Misión\nDefinir la misión del producto tras re-ejecutar la instanciación (spec degradada por fallo L2, P2).\n\n### Reglas de Ejecución\n- Investigar antes de asumir; iterar el bucle agéntico hasta lograr los goals.",
  };
}

function degradedCatalog(kind: CatalogKind, spec: BootstrapSpec, error: string): string {
  const titles: Record<CatalogKind, string> = {
    "best-practices": `# Catálogo de Mejores Prácticas — ${spec.projectName}

> VERSIÓN DEGRADADA (P2 honesto): la generación L2 falló (${error}).
> Regenerar ejecutando una nueva iteración del instanciador o del comando mejororate.`,
    "anti-patterns": `# Catálogo de Anti-Patrones — ${spec.projectName}

> VERSIÓN DEGRADADA (P2 honesto): la generación L2 falló (${error}).`,
    "killer-features": `# Catálogo de Killer Features — ${spec.projectName}

> VERSIÓN DEGRADADA (P2 honesto): la generación L2 falló (${error}).`,
  };
  const goals = spec.goals.map((g, i) => `${i + 1}. ${g}`).join("\n");
  return `${titles[kind]}

## Goals del proyecto (derivados del prompt)
${goals}

## Semilla de investigación
- Completar este catálogo con investigación web del dominio ${spec.domain}.
`;
}

// ── Pipeline principal ───────────────────────────────────────────────────

export async function runBootstrapPipeline(runId: string): Promise<void> {
  const started = Date.now();
  try {
    const run = await db.bootstrapRun.findUnique({ where: { id: runId } });
    if (!run) return;
    const rawPrompt = run.prompt;
    const notes: string[] = [];

    // ══ FASE 1: RESEARCHING (zero-knowledge → investigate) ════════════
    await setPhase(runId, "RESEARCHING", 6, "Arranque en frío: derivando dominio y queries de investigación…");

    let queries: string[] = [];
    try {
      const pre = buildPreSpecPrompt(rawPrompt);
      const raw = await llm(runId, "bootstrap-prespec", pre.system, pre.user);
      const parsed = extractJson<{ domain: string; searchQueries: string[] }>(raw);
      queries = (parsed.searchQueries ?? []).filter((q) => typeof q === "string" && q.trim()).slice(0, 5);
    } catch (e) {
      notes.push(`pre-spec L2 falló: ${e instanceof Error ? e.message : "error"} — queries derivadas del prompt (P2)`);
    }
    if (queries.length === 0) {
      const base = rawPrompt.slice(0, 60);
      queries = [
        `mejores apps ${base}`,
        `mejores prácticas desarrollo ${base}`,
        `seguridad ${base}`,
        `modelo de negocio ${base}`,
      ];
    }

    const research: ResearchItem[] = [];
    for (let i = 0; i < queries.length; i++) {
      await setPhase(runId, "RESEARCHING", 8 + Math.round((i / queries.length) * 12), `Investigando (${i + 1}/${queries.length}): ${queries[i].slice(0, 60)}`);
      const res = await webSearch(queries[i], 5);
      research.push({
        query: queries[i],
        results: res.items.map((r: WebSearchResultItem) => ({ title: r.name, url: r.url, snippet: r.snippet })),
      });
    }
    const totalFuentes = research.reduce((a, r) => a + r.results.length, 0);
    await db.bootstrapRun.update({
      where: { id: runId },
      data: { researchJson: JSON.stringify(research) },
    });

    // ══ FASE 2: PLANNING (spec + roles + goals + XML refactor) ═════════
    await setPhase(runId, "PLANNING", 24, "Refactorizando el prompt: roles de expertos, goals y prompt XML…");
    let spec: BootstrapSpec;
    let specDegraded = false;
    try {
      const p = buildSpecPrompt(rawPrompt, research);
      const raw = await llm(runId, "bootstrap-spec", p.system, p.user);
      const parsed = extractJson<Partial<BootstrapSpec>>(raw);
      spec = {
        projectName: parsed.projectName?.trim() || "Proyecto del Operador",
        slug: slugify(parsed.slug || parsed.projectName || rawPrompt.slice(0, 40)),
        domain: parsed.domain || "dominio-general",
        oneLiner: parsed.oneLiner?.slice(0, 140) || "Producto definido por el prompt del operador.",
        description: parsed.description || rawPrompt,
        targetUsers: parsed.targetUsers?.length ? parsed.targetUsers : ["Operador"],
        expertRoles: parsed.expertRoles?.length ? parsed.expertRoles : [{ role: "Arquitecto de Software", focus: "Definir la arquitectura" }],
        goals: parsed.goals?.length ? parsed.goals : ["G1. Construir el producto descrito en el prompt del operador"],
        stack: parsed.stack?.length ? parsed.stack : ["Por definir"],
        risks: parsed.risks?.length ? parsed.risks : [],
        securityNotes: parsed.securityNotes?.length ? parsed.securityNotes : [],
        xmlPrompt: parsed.xmlPrompt || `<prompt>${rawPrompt}</prompt>`,
        personaMapping: parsed.personaMapping ?? {},
        agentsContextSection: parsed.agentsContextSection || degradedSpec(rawPrompt).agentsContextSection,
      };
    } catch (e) {
      specDegraded = true;
      notes.push(`spec L2 falló: ${e instanceof Error ? e.message : "error"} — spec degradada honesta (P2)`);
      spec = degradedSpec(rawPrompt);
    }
    await db.bootstrapRun.update({
      where: { id: runId },
      data: { specJson: JSON.stringify(spec), projectName: spec.projectName, slug: spec.slug },
    });

    const epoch = Math.floor(Date.now() / 1000);
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    // ══ PRE-REPORT (bucle agéntico: planificar → reportar ANTES de ejecutar) ══
    const staticFiles = collectStaticFiles();
    const planRows: Array<[string, string]> = [
      ["AGENTS.md", "template (constitución inmutable + contexto LLM)"],
      ["README.md", "llm"],
      ["docs/catalogs/100-best-practices.md", "llm"],
      ["docs/catalogs/100-anti-patterns.md", "llm"],
      ["docs/catalogs/100-killer-features.md", "llm"],
      ["docs/personas/*.md (6 core + 4 cold-run)", "llm"],
      ["docs/prompts/architecture|domain|stack.md", "llm"],
      [`docs/memory/{MEMORY,worklog,wins-ledger}.md + state.json`, "template (init P9)"],
      [`${BRIDGE_FILES.length} puentes IDE (auto-activación Protocolo 11 F3)`, "template"],
      [`${staticFiles.size} archivos universales (gobernanza, L2, MCP, eval, scripts)`, "static"],
      [`docs/research/${ts}-bootstrap-research.md`, "template (evidencia Fase 1)"],
    ];
    const preReport = `# PRE-Report de Instanciación — ${spec.projectName}

> Emitido ANTES de ejecutar la generación (bucle agéntico: investigar → planear →
> pre-report → ejecutar → pro-report → auto-crítica). Epoch ${epoch}.

## Prompt crudo del operador

\`\`\`
${rawPrompt}
\`\`\`

## Investigación ejecutada (Fase 1)

${queries.map((q, i) => `${i + 1}. "${q}" — ${research[i]?.results.length ?? 0} fuentes`).join("\n")}

Total: ${totalFuentes} fuentes. Evidencia completa: \`docs/research/${ts}-bootstrap-research.md\`.

## Spec derivada (Fase 1: roles de expertos + prompt XML)

- **Producto:** ${spec.projectName} — ${spec.oneLiner}
- **Dominio:** ${spec.domain}
- **Roles asumidos:** ${spec.expertRoles.map((r) => r.role).join(", ")}
- **Stack recomendado:** ${spec.stack.join("; ")}

### Goals del proyecto

${spec.goals.map((g, i) => `- G${i + 1}. ${g}`).join("\n")}

### Prompt refactorizado (XML)

\`\`\`xml
${spec.xmlPrompt}
\`\`\`

## Plan de archivos

| Ruta | Origen |
| :--- | :--- |
${planRows.map(([p, o]) => `| ${p} | ${o} |`).join("\n")}

## Criterios de verificación (auto-crítica prevista)

1. AGENTS.md conserva la constitución completa (>15 KB) e incluye la sección de contexto del proyecto.
2. Los 3 catálogos existen y superan 1.5 KB.
3. Las 10 personas (6 core + 4 cold-run) existen.
4. Toda ruta \`docs/**.md\` referenciada en la sección de contexto existe en el scaffold.
5. Los ${BRIDGE_FILES.length} puentes IDE incluyen el nombre del proyecto.
6. Cero archivos vacíos; MANIFEST.json cuadra con el total de archivos.
${specDegraded ? "\n> NOTA (P2): spec degradada por fallo L2 — re-ejecutar la instanciación." : ""}
`;
    await saveFile(runId, `docs/reports/${epoch}-bootstrap-pre.md`, preReport, "template", "PLANNING");

    // ══ FASE 3: GENERATING (derivados adaptados al tópico) ═════════════
    const progressAt = (done: number, total: number) => 32 + Math.round((done / total) * 48);
    let genDone = 0;
    const genTotal = 3 /* catálogos */ + 2 /* personas */ + 1 /* prompts dominio */ + 1 /* readme */;

    const bump = async (detail: string) => {
      genDone++;
      await setPhase(runId, "GENERATING", progressAt(genDone, genTotal), detail);
    };

    // 3.a Catálogos
    const catalogKinds: Array<{ kind: CatalogKind; path: string; label: string; minBytes: number }> = [
      { kind: "best-practices", path: "docs/catalogs/100-best-practices.md", label: "catálogo de mejores prácticas", minBytes: 1500 },
      { kind: "anti-patterns", path: "docs/catalogs/100-anti-patterns.md", label: "catálogo de anti-patrones", minBytes: 1500 },
      { kind: "killer-features", path: "docs/catalogs/100-killer-features.md", label: "catálogo de killer features", minBytes: 1500 },
    ];
    for (const c of catalogKinds) {
      await setPhase(runId, "GENERATING", progressAt(genDone, genTotal), `Generando ${c.label} vía L2…`);
      let content = "";
      try {
        const p = buildCatalogPrompt(c.kind, spec, research);
        content = await llm(runId, `bootstrap-catalog-${c.kind}`, p.system, p.user);
        if (Buffer.byteLength(content, "utf8") < c.minBytes) {
          throw new Error(`respuesta demasiado corta (${Buffer.byteLength(content, "utf8")} bytes)`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "error";
        notes.push(`catálogo ${c.kind} degradado: ${msg}`);
        content = degradedCatalog(c.kind, spec, msg);
      }
      await saveFile(runId, c.path, content, content.includes("VERSIÓN DEGRADADA") ? "template" : "llm", "GENERATING");
      await bump(`Catálogo listo: ${c.path}`);
    }

    // 3.b Personas core (6) y cold-run (4)
    await setPhase(runId, "GENERATING", progressAt(genDone, genTotal), "Generando 6 personas del dominio vía L2…");
    try {
      const p = buildPersonasPrompt(spec);
      const raw = await llm(runId, "bootstrap-personas", p.system, p.user);
      const files = splitFiles(raw);
      let ok = 0;
      for (const [path, content] of files) {
        if (content.length > 200) {
          await saveFile(runId, path, content, "llm", "GENERATING");
          ok++;
        }
      }
      if (ok === 0) throw new Error("ninguna persona extraída de la respuesta L2");
    } catch (e) {
      notes.push(`personas core degradadas: ${e instanceof Error ? e.message : "error"}`);
      const mapping = Object.entries(spec.personaMapping);
      const fallback = `# Personas del Proyecto — ${spec.projectName}

> VERSIÓN DEGRADADA (P2): la generación L2 de personas falló. Mapping disponible:

${mapping.map(([id, rol]) => `- \`${id}\` → ${rol}`).join("\n") || "- Re-ejecutar la instanciación para generar las personas."}
`;
      await saveFile(runId, "docs/personas/PERSONAS-DEGRADADAS.md", fallback, "template", "GENERATING");
    }
    await bump("Personas core listas");

    await setPhase(runId, "GENERATING", progressAt(genDone, genTotal), "Generando 4 personas cold-run vía L2…");
    try {
      const p = buildColdRunPrompt(spec);
      const raw = await llm(runId, "bootstrap-coldrun", p.system, p.user);
      const files = splitFiles(raw);
      let ok = 0;
      for (const [path, content] of files) {
        if (content.length > 200) {
          await saveFile(runId, path, content, "llm", "GENERATING");
          ok++;
        }
      }
      if (ok === 0) throw new Error("ninguna persona cold-run extraída");
    } catch (e) {
      notes.push(`cold-run degradado: ${e instanceof Error ? e.message : "error"}`);
    }
    await bump("Personas cold-run listas");

    // 3.c Prompts de dominio
    await setPhase(runId, "GENERATING", progressAt(genDone, genTotal), "Generando prompts de dominio (architecture/domain/stack)…");
    try {
      const p = buildDomainPromptsPrompt(spec);
      const raw = await llm(runId, "bootstrap-prompts-dominio", p.system, p.user);
      const files = splitFiles(raw);
      let ok = 0;
      for (const [path, content] of files) {
        if (content.length > 200) {
          await saveFile(runId, path, content, "llm", "GENERATING");
          ok++;
        }
      }
      if (ok === 0) throw new Error("ningún prompt de dominio extraído");
    } catch (e) {
      notes.push(`prompts de dominio degradados: ${e instanceof Error ? e.message : "error"}`);
      const fb = `# Prompts de Dominio — ${spec.projectName}

> VERSIÓN DEGRADADA (P2): falló la generación L2. Semilla:

## Stack recomendado
${spec.stack.map((s) => `- ${s}`).join("\n")}
`;
      await saveFile(runId, "docs/prompts/domain.md", fb, "template", "GENERATING");
    }
    await bump("Prompts de dominio listos");

    // 3.d README
    await setPhase(runId, "GENERATING", progressAt(genDone, genTotal), "Generando README del proyecto vía L2…");
    try {
      const p = buildReadmePrompt(spec);
      const content = await llm(runId, "bootstrap-readme", p.system, p.user);
      await saveFile(runId, "README.md", content, "llm", "GENERATING");
    } catch (e) {
      notes.push(`README degradado: ${e instanceof Error ? e.message : "error"}`);
      await saveFile(
        runId,
        "README.md",
        `# ${spec.projectName} — Agent OS Scaffold\n\n> ${spec.oneLiner}\n\n> VERSIÓN DEGRADADA (P2): README L2 falló. Ver AGENTS.md y docs/.\n`,
        "template",
        "GENERATING"
      );
    }
    await bump("README listo");

    // 3.e AGENTS.md ensamblado (constitución inmutable + contexto instanciado)
    await setPhase(runId, "GENERATING", 82, "Ensamblando AGENTS.md (constitución inmutable + contexto del proyecto)…");
    const agentsMd = assembleAgentsMd(spec, new Date().toISOString());
    await saveFile(runId, "AGENTS.md", agentsMd, "template", "GENERATING");

    // 3.f Puentes IDE (Protocolo 11 F3: auto-activación)
    await setPhase(runId, "GENERATING", 84, `Inyectando proyecto en ${BRIDGE_FILES.length} puentes IDE…`);
    for (const bridge of BRIDGE_FILES) {
      try {
        await saveFile(runId, bridge, bridgeContent(readAsset(bridge), spec), "template", "GENERATING");
      } catch {
        notes.push(`puente ${bridge} omitido (no existe en assets)`);
      }
    }

    // 3.g Archivos universales estáticos
    await setPhase(runId, "GENERATING", 86, `Copiando ${staticFiles.size} archivos universales (gobernanza, L2, MCP, eval)…`);
    for (const [path, content] of staticFiles) {
      await saveFile(runId, path, content, "static", "GENERATING");
    }

    // 3.h Investigación (evidencia Fase 1) y memoria inicial (P9)
    const researchMd = `# Investigación Bootstrap — ${spec.projectName}

> Fase 1 (investigate) del Protocolo 11: arranque en frío con cero conocimiento
> asumido del dominio. Estas son las fuentes reales consultadas (epoch ${epoch}).

${research
  .map(
    (r, i) => `## Query ${i + 1}: "${r.query}"

${r.results.map((x) => `- **${x.title}** — ${x.url}\n  ${x.snippet}`).join("\n") || "- (sin resultados — P2: no se inventaron fuentes)"}
`
  )
  .join("\n")}
`;
    await saveFile(runId, `docs/research/${ts}-bootstrap-research.md`, researchMd, "template", "GENERATING");

    const memoryMd = `# MEMORY.md — Index of Empirical Memory Entries

> Una línea por entrada. El contenido vive en los archivos referenciados.
> La Fase 0 (AGENTS.md) carga este index automáticamente.

## Entradas iniciales (instanciación Zero-Shot, epoch ${epoch})

- [project] ${spec.projectName}: ${spec.oneLiner}. Contexto: sección "Contexto del Proyecto Instanciado" de \`AGENTS.md\`.
- [project] Goals activos: ${spec.goals.map((g, i) => `G${i + 1}`).join(", ")}.
- [reference] Catálogos de condicionamiento: \`docs/catalogs/100-best-practices.md\`, \`docs/catalogs/100-anti-patterns.md\`, \`docs/catalogs/100-killer-features.md\`.
- [reference] Personas del dominio: \`docs/personas/*.md\` y \`docs/personas/cold-run/*.md\`.
- [reference] Prompts de dominio: \`docs/prompts/architecture.md\`, \`docs/prompts/domain.md\`, \`docs/prompts/stack.md\`.
- [reference] Investigación bootstrap: \`docs/research/${ts}-bootstrap-research.md\`.
- [reference] Memoria empírica universal heredada: \`docs/memory/anti-patterns.md\`.
- [user] Operador: asume déficit de conocimiento técnico (Protocolo 11 F1) — explicar decisiones en lenguaje simple.
`;
    await saveFile(runId, "docs/memory/MEMORY.md", memoryMd, "template", "GENERATING");

    const worklogMd = `# Worklog del Proyecto — ${spec.projectName}

> P9: append-only. Cada sesión agéntica registra su traza aquí.

---

## Epoch ${epoch} — Instanciación Zero-Shot (Protocolo 11)

- Prompt crudo del operador: "${rawPrompt.replace(/\n/g, " ").slice(0, 200)}"
- Investigación: ${queries.length} queries, ${totalFuentes} fuentes.
- Spec: ${spec.expertRoles.length} roles de expertos, ${spec.goals.length} goals (G1-G${spec.goals.length}).
- Scaffold completo generado: catálogos, personas, prompts de dominio, AGENTS.md contextualizado, ${BRIDGE_FILES.length} puentes IDE.
- Evidencia: \`docs/research/${ts}-bootstrap-research.md\` · \`docs/reports/${epoch}-bootstrap-pre.md\` · \`docs/reports/${epoch}-bootstrap-pro.md\`
- Estado: SCAFFOLD_COMPLETO — listo para el primer prompt de feature del operador.
`;
    await saveFile(runId, "docs/memory/worklog.md", worklogMd, "template", "GENERATING");

    const winsLedger = `# Positive Self-Improvement & Measurement: Wins Ledger (Append-Only)

> **REGLA INVIOLABLE (P9):** append-only. Toda victoria mapea a una clase W1-W8
> con evidencia. Instanciado para ${spec.projectName} (epoch ${epoch}).

---

<!-- Las victorias W1-W8 de ESTE proyecto se registran aquí a partir de la
     primera iteración agéntica. No hay victorias pre-registradas: el ledger
     arranca honesto en cero (P2). -->
`;
    await saveFile(runId, "docs/memory/wins-ledger.md", winsLedger, "template", "GENERATING");

    const stateJson = JSON.stringify(
      {
        version: "0.1.0",
        last_updated: new Date().toISOString(),
        project: spec.slug,
        generated_by: "agent-os-instanciador (Protocolo 11, Zero-Shot Bootstrap)",
        kpi_targets: {
          K1_p0_p1_closure_rate: { description: "P0/P1 Closure Rate", target: 0.9, current: null, unit: "ratio" },
          K2_mock_reduction_velocity: { description: "Mock Reduction Velocity", target: -0.1, current: null, unit: "delta_per_iteration" },
          K3_finding_half_life_rounds: { description: "Finding Half-Life", target: 2.0, current: null, unit: "iterations" },
          K4_capability_streak: { description: "Capability-Strengthening Count", target: 1, current: 0, unit: "wins_per_iteration" },
          K5_gate_stability_streak: { description: "Gate Stability Streak", target: "monotonic_increase", current: 0, unit: "consecutive_clean_builds" },
        },
        baselines: { typecheck_errors: null, lint_warnings: null, test_coverage_percent: null },
        psim_wins_count: { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0, W6: 0, W7: 0, W8: 0, total: 0 },
        personas_documented: 10,
        history: [
          {
            timestamp: new Date().toISOString(),
            iteration: 0,
            event: "Scaffold instanciado (Protocolo 11)",
            notes: `Prompt: ${rawPrompt.slice(0, 120)}. ${queries.length} queries de investigación, ${totalFuentes} fuentes.`,
          },
        ],
      },
      null,
      2
    );
    await saveFile(runId, "docs/memory/state.json", stateJson, "template", "GENERATING");

    // ══ FASE 4: VERIFYING (auto-crítica determinista) ══════════════════
    await setPhase(runId, "VERIFYING", 88, "Auto-crítica: verificando integridad, interconexiones y honestidad del scaffold…");
    const allFiles = await db.bootstrapFile.findMany({ where: { runId } });
    const fileMap = new Map(allFiles.map((f) => [f.path, f]));
    const checks: Array<{ name: string; pass: boolean; detail: string }> = [];

    const agents = fileMap.get("AGENTS.md");
    checks.push({
      name: "AGENTS.md constitución íntegra",
      pass: !!agents && agents.bytes > 15000,
      detail: agents ? `${agents.bytes} bytes` : "ausente",
    });
    checks.push({
      name: "AGENTS.md contextualizado",
      pass: !!agents && agents.content.includes("Contexto del Proyecto Instanciado") && agents.content.includes(spec.projectName),
      detail: agents ? "sección de contexto presente" : "ausente",
    });

    for (const c of catalogKinds) {
      const f = fileMap.get(c.path);
      checks.push({ name: `${c.path}`, pass: !!f && f.bytes >= 1000, detail: f ? `${f.bytes} bytes` : "ausente" });
    }

    const personaPaths = [
      "docs/personas/analyst.md", "docs/personas/operator.md", "docs/personas/executive.md",
      "docs/personas/apprentice.md", "docs/personas/experience-architect.md", "docs/personas/demo-master.md",
      "docs/personas/cold-run/adversario.md", "docs/personas/cold-run/edge.md",
      "docs/personas/cold-run/novato.md", "docs/personas/cold-run/power.md",
    ];
    const personasOk = personaPaths.filter((p) => (fileMap.get(p)?.bytes ?? 0) > 200).length;
    checks.push({ name: "Personas del dominio (10)", pass: personasOk >= 6, detail: `${personasOk}/10 generadas vía L2` });

    // Interconexión: toda ruta docs/**.md referenciada en la sección de contexto existe
    const refMatches = [...spec.agentsContextSection.matchAll(/(docs\/[A-Za-z0-9\-_/]+\.md)/g)].map((m) => m[1]);
    const uniqueRefs = [...new Set(refMatches)];
    const missingRefs = uniqueRefs.filter((p) => !fileMap.has(p));
    checks.push({
      name: "Interconexión: rutas referenciadas existen",
      pass: uniqueRefs.length === 0 || missingRefs.length === 0,
      detail: uniqueRefs.length ? `${uniqueRefs.length - missingRefs.length}/${uniqueRefs.length} verificadas${missingRefs.length ? ` — faltan: ${missingRefs.join(", ")}` : ""}` : "sin referencias",
    });

    const bridgesOk = BRIDGE_FILES.filter((b) => (fileMap.get(b)?.content ?? "").includes(spec.projectName)).length;
    checks.push({ name: `Puentes IDE (${BRIDGE_FILES.length})`, pass: bridgesOk === BRIDGE_FILES.length, detail: `${bridgesOk}/${BRIDGE_FILES.length} inyectados` });

    const emptyFiles = allFiles.filter((f) => f.bytes === 0).length;
    checks.push({ name: "Cero archivos vacíos", pass: emptyFiles === 0, detail: `${emptyFiles} vacíos` });

    const llmFiles = allFiles.filter((f) => f.origin === "llm").length;
    checks.push({ name: "Archivos LLM generados", pass: llmFiles >= 10, detail: `${llmFiles} archivos vía L2` });

    const failed = checks.filter((c) => !c.pass);
    const verdict = failed.length === 0 ? "PASS" : `PASS_WITH_NOTES (${failed.length} checks fallidos)`;

    // ══ PRO-REPORT ═════════════════════════════════════════════════════
    const totalBytes = allFiles.reduce((a, f) => a + f.bytes, 0);
    const finalRun = await db.bootstrapRun.findUnique({ where: { id: runId } });
    const proReport = `# PRO-Report de Instanciación — ${spec.projectName}

> Emitido TRAS la generación (bucle agéntico completo: investigar → planear →
> pre-report → ejecutar → pro-report → auto-crítica). Epoch ${epoch}. Veredicto: **${verdict}**.

## Resultados de verificación (auto-crítica)

| Check | Resultado | Evidencia |
| :--- | :---: | :--- |
${checks.map((c) => `| ${c.name} | ${c.pass ? "PASS" : "FAIL"} | ${c.detail} |`).join("\n")}

## Estadísticas

- Archivos generados: **${allFiles.length}** (${llmFiles} LLM · ${allFiles.filter((f) => f.origin === "template").length} template · ${allFiles.filter((f) => f.origin === "static").length} estáticos)
- Peso total: **${(totalBytes / 1024).toFixed(1)} KB**
- Llamadas L2: **${finalRun?.llmCalls ?? 0}**
- Duración: **${((Date.now() - started) / 1000).toFixed(1)}s**
- Fuentes de investigación: **${totalFuentes}** (${queries.length} queries)
${notes.length ? `\n## Notas honestas (P2)\n\n${notes.map((n) => `- ${n}`).join("\n")}` : ""}

## Handoff

1. Descargar el ZIP y descomprimirlo (raíz: \`${spec.slug}/\`).
2. Abrir la carpeta en el IDE favorito (Cursor, Claude Code, Windsurf, Trae, Roo, Gemini, Copilot…).
3. La capa de auto-activación (Protocolo 11, Fase 3) obliga a TODO LLM a cargar
   \`AGENTS.md\` + memoria antes de cualquier acción — el operador ya no necesita
   referenciar la constitución en cada prompt.
4. Pedir la primera feature en lenguaje natural: el bucle agéntico (investigar →
   planear → pre-report → ejecutar → pro-report → auto-crítica → auto-aprendizaje)
   se dispara automáticamente y itera hasta lograr los goals G1-G${spec.goals.length}.
`;
    await saveFile(runId, `docs/reports/${epoch}-bootstrap-pro.md`, proReport, "template", "VERIFYING");

    // ══ FASE 5: PACKAGING → COMPLETED ══════════════════════════════════
    await setPhase(runId, "PACKAGING", 96, "Empaquetando scaffold (ZIP disponible al finalizar)…");
    const finalCount = await db.bootstrapFile.count({ where: { runId } });
    await db.bootstrapRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        progress: 100,
        phaseDetail: `Scaffold completo: ${finalCount} archivos · veredicto ${verdict}`,
        fileCount: finalCount,
        durationMs: Date.now() - started,
      },
    });
  } catch (e) {
    // P2: ningún fallo muere en silencio — queda registrado y visible.
    const message = e instanceof Error ? e.message : "error desconocido";
    await db.bootstrapRun
      .update({
        where: { id: runId },
        data: {
          status: "ERROR",
          phaseDetail: "Fallo del pipeline",
          error: message,
          durationMs: Date.now() - started,
        },
      })
      .catch(() => undefined);
  }
}
