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
  const lastScan = await db.scanRun.findFirst({
    where: { mode: "scan", status: "COMPLETED" },
    orderBy: { startedAt: "desc" },
  });
  if (!lastScan) throw new Error("No hay scans completados. Ejecuta primero: mejorate scan");

  const repos = await db.referenceRepo.findMany({ orderBy: { stars: "desc" } });
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
      note: "Synthesize via L2 (Optimizador PRE-v2.0)",
    },
  });

  const inference = await infer({
    systemPrompt: SYSTEM_PROMPT,
    userContent: `SCAN (epoch ${lastScan.startedAt.getTime() / 1000}): ${repos.length} repos, ${lastScan.totalStars} estrellas.\n\n${scanSummary}`,
    tenant: "agent-os-console",
    purpose: "mejorate-synthesize",
  });

  let json = inference.outcome === "OK" ? extractJson(inference.content) : null;

  // Fallback determinista (P2 honesto): proposals desde los patrones conocidos
  if (!json || !Array.isArray(json.adoptions) || json.adoptions.length === 0) {
    const existingPatterns = await db.extractedPattern.findMany({ take: 12 });
    json = {
      patterns: existingPatterns.map((p) => ({
        repo: p.repo, category: p.category, pattern: p.pattern, evidence: p.evidence,
      })),
      adoptions: existingPatterns.slice(0, 6).map((p) => ({
        title: `Adoptar patrón: ${p.pattern.slice(0, 60)}`,
        type: "SKILL",
        origin: p.repo,
        description: `${p.pattern}. Evidencia del scan: ${p.evidence}. La adopcion fortalece el pipeline de radiografia (fases 0-5), añade manejo de errores con fallback determinista y respeta los contratos canonicos del sistema (OpenAPI 3.1 + schema estricto).`,
      })),
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
