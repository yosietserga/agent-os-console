// ════════════════════════════════════════════════════════════════════════
// synthesize.ts — Mejorate modo synthesize: el Optimizador PRE-v2.0 extrae
// patrones agénticos del último scan y propone adoptions. El Juez decide.
// ════════════════════════════════════════════════════════════════════════
import { db } from "@/lib/db";
import { infer } from "./l2";
import { judgeProposal } from "./pre-judge";
import type { AdoptionProposalDTO } from "./types";

const SYSTEM_PROMPT = `Eres el Optimizador del sistema PRE-v2.0 de un Agent OS. Recibes el resultado de un scan de repositorios de referencia de radiografía de ingeniería inversa y produces SOLO un JSON válido (sin markdown) con adoptions propuestas:
{
  "patterns": [
    {"repo": "owner/name", "category": "categoria", "pattern": "patron agentico ventajoso concreto", "evidence": "evidencia del scan"}
  ],
  "adoptions": [
    {"title": "titulo conciso", "type": "BP|AP|KILLER|SKILL|WIDGET|MCP", "origin": "owner/name", "description": "descripcion sustantiva de la adopcion para el boilerplate, mencionando contratos, fases del pipeline, casos ocultos y arquitectura"}
  ]
}
Reglas: entre 4 y 8 adoptions. Cada description debe ser densa y técnica (menciona contratos API, fases del pipeline 0-5, manejo de errores/fallbacks y arquitectura). Cero placeholders. Español.`;

interface SynthJSON {
  patterns: { repo: string; category: string; pattern: string; evidence: string }[];
  adoptions: { title: string; type: string; origin: string; description: string }[];
}

function extractJson(raw: string): SynthJSON | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as SynthJSON;
  } catch {
    return null;
  }
}

export interface SynthesizeOutcome {
  scanRunId: string | null;
  mode: "L2" | "DETERMINIST";
  patternsCreated: number;
  adoptionsCreated: number;
  proposals: AdoptionProposalDTO[];
  output: string;
}

export async function synthesize(): Promise<SynthesizeOutcome> {
  // AP-034 (fix workflow): el epoch de referencia es el ÚLTIMO scan, no el
  // último COMPLETED — si el scan de hoy falló 0/19, sintetizar sobre uno
  // viejo sin declararlo era fabricación silenciosa. Ahora: fail-fast.
  const lastScan = await db.scanRun.findFirst({
    where: { mode: "scan" },
    orderBy: { startedAt: "desc" },
  });
  if (!lastScan) throw new Error("No hay scans registrados. Ejecuta primero: mejorate scan");
  if (lastScan.status !== "COMPLETED" || lastScan.reposScanned === 0) {
    throw new Error(
      `El último scan (epoch ${Math.floor(lastScan.startedAt.getTime() / 1000)}) terminó ${lastScan.status} con ${lastScan.reposScanned} repos. Sin datos frescos no hay síntesis honesta — repara el scan (GITHUB_TOKEN en .env) y re-ejecuta: mejorate`
    );
  }

  const scanStartMs = lastScan.startedAt.getTime();
  const allRepos = await db.referenceRepo.findMany({ orderBy: { stars: "desc" } });
  // Solo repos realmente refrescados por ese scan (lastScannedAt dentro del epoch)
  const repos = allRepos.filter(
    (r) => r.lastScannedAt !== null && r.lastScannedAt.getTime() >= scanStartMs
  );
  if (repos.length === 0) {
    throw new Error(
      `El scan ${lastScan.id.slice(-8)} (epoch ${Math.floor(scanStartMs / 1000)}) no dejó repos frescos — no hay base honesta para sintetizar`
    );
  }
  const ageMin = Math.max(0, Math.round((Date.now() - scanStartMs) / 60000));
  const scanSummary = repos
    .map(
      (r) =>
        `- ${r.repo} [${r.category}] ${r.stars}★ ${r.language ?? "?"} · dirs: ${JSON.parse(r.topDirs || "[]").slice(0, 8).join(", ")} · archivos clave: ${JSON.parse(r.keyFiles || "[]").slice(0, 4).map((f: { path: string }) => f.path).join(", ")}`
    )
    .join("\n");

  const run = await db.scanRun.create({
    data: {
      mode: "synthesize",
      reposScanned: repos.length,
      totalStars: lastScan.totalStars,
      status: "RUNNING",
      note: `Synthesize via L2 (Optimizador PRE-v2.0) · base epoch ${Math.floor(scanStartMs / 1000)} · ${repos.length} frescos · edad ${ageMin} min`,
    },
  });

  const inference = await infer({
    systemPrompt: SYSTEM_PROMPT,
    userContent: `SCAN (epoch ${Math.floor(scanStartMs / 1000)}, edad ${ageMin} min): ${repos.length} repos frescos de ${allRepos.length} en catálogo, ${lastScan.totalStars} estrellas.\n\n${scanSummary}`,
    tenant: "agent-os-console",
    purpose: "mejorate-synthesize",
  });

  let json = inference.outcome === "OK" ? extractJson(inference.content) : null;

  // Fallback determinista (P2 honesto) — AP-034: proposals derivadas de los
  // repos FRESCOS de este epoch. Antes reciclaba patrones de cualquier epoch
  // anterior y el juez los masacraba como duplicados (los ΔS negativos del
  // run del operador). Ahora toda evidencia es del scan vigente.
  if (!json || !Array.isArray(json.adoptions) || json.adoptions.length === 0) {
    json = {
      patterns: repos.slice(0, 8).map((r) => {
        const dirs = JSON.parse(r.topDirs || "[]") as string[];
        const files = JSON.parse(r.keyFiles || "[]") as { path: string }[];
        return {
          repo: r.repo,
          category: r.category,
          pattern: `Arquitectura observable de ${r.repo} (${r.language ?? "?"}): ${dirs.slice(0, 5).join(" / ") || "estructura no disponible"}`,
          evidence: `Scan fresco epoch ${Math.floor(scanStartMs / 1000)} · ${r.stars}★ · archivos clave: ${files.slice(0, 3).map((f) => f.path).join(", ") || "—"}`,
        };
      }),
      adoptions: repos.slice(0, 6).map((r) => {
        const dirs = JSON.parse(r.topDirs || "[]") as string[];
        const files = JSON.parse(r.keyFiles || "[]") as { path: string }[];
        return {
          title: `Adoptar patrón: ${r.repo} — ${r.category}`,
          type: "SKILL",
          origin: r.repo,
          description: `Patrón del scan fresco de este epoch sobre ${r.repo} (${r.stars}★, ${r.language ?? "?"}). Estructura top-level: ${dirs.slice(0, 6).join(", ") || "no disponible"} · archivos clave: ${files.slice(0, 4).map((f) => f.path).join(", ") || "no disponibles"}. La adopcion fortalece el pipeline de radiografia (fases 0-5), añade manejo de errores con fallback determinista y respeta los contratos canonicos del sistema (OpenAPI 3.1 + schema estricto).`,
        };
      }),
    };
  }

  // Persistir patrones del synthesize
  if (json.patterns?.length) {
    await db.extractedPattern.createMany({
      data: json.patterns.slice(0, 10).map((p) => ({
        repo: p.repo, category: p.category, pattern: p.pattern,
        evidence: p.evidence, scanRunId: run.id,
      })),
    });
  }

  // Persistir adoptions + evaluación inmediata por el Juez determinista
  const created: AdoptionProposalDTO[] = [];
  for (const a of json.adoptions.slice(0, 8)) {
    const verdict = judgeProposal(a.title, a.description, a.type);
    const row = await db.adoptionProposal.create({
      data: {
        title: a.title.slice(0, 160),
        type: (a.type ?? "SKILL").toUpperCase().slice(0, 10),
        origin: a.origin.slice(0, 120),
        description: a.description.slice(0, 900),
        status: "EVALUATED",
        d1: verdict.scores.d1,
        d2: verdict.scores.d2,
        d3: verdict.scores.d3,
        d4: verdict.scores.d4,
        d5: verdict.scores.d5,
        d6: verdict.scores.d6,
        deltaS: verdict.deltaS,
        verdict: verdict.verdict.slice(0, 400),
        evaluatedAt: new Date(),
      },
    });
    created.push({ ...row, createdAt: row.createdAt.toISOString(), evaluatedAt: row.evaluatedAt ? row.evaluatedAt.toISOString() : null } as AdoptionProposalDTO);
  }

  await db.scanRun.update({
    where: { id: run.id },
    data: { status: "COMPLETED", finishedAt: new Date() },
  });

  const mode = inference.outcome === "OK" && json.adoptions.length ? "L2" : "DETERMINIST";
  const output = [
    `[MEJORATE] synthesize ${mode === "L2" ? `vía L2 (${inference.model}, ${inference.latencyMs}ms)` : "fallback determinista (L2 no estructuró JSON)"}`,
    `  Base: epoch ${Math.floor(scanStartMs / 1000)} · ${repos.length} repos frescos · edad ${ageMin} min`,
    `  Patrones extraídos: ${json.patterns?.length ?? 0}`,
    `  Adoptions propuestas: ${created.length}`,
    `  Evaluadas por Juez determinista: ${created.length}`,
    `  Promovibles (ΔS ≥ 5.0): ${created.filter((c) => (c.deltaS ?? 0) >= 5).length}`,
    ...created.slice(0, 5).map((c) => `  · ${c.title} — ΔS ${c.deltaS}`),
    `  Ledger: ${inference.promptTokens}+${inference.completionTokens} tokens · $${inference.costUsd.toFixed(4)}`,
  ].join("\n");

  return {
    scanRunId: run.id,
    mode,
    patternsCreated: Math.min(json.patterns?.length ?? 0, 10),
    adoptionsCreated: created.length,
    proposals: created,
    output,
  };
}
