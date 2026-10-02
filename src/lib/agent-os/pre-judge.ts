// ════════════════════════════════════════════════════════════════════════
// pre-judge.ts — Juez Determinista PRE-v2.0 (Gobernanza §4.2)
//
// Puntuación Constitucional: S = 100 × Σ(wi·Di)
//   D1 Compilación/Tipado (w=0.20) · D2 Contratos (w=0.15)
//   D3 Pipeline (w=0.20) · D4 Casos Ocultos (w=0.20)
//   D5 Tokens (w=0.10) · D6 Arquitectura (w=0.15)
//
// Condición de Promoción Inviolable:
//   ΔS ≥ 5.0  ∧  ∀i ΔDi ≥ -2.0  ∧  (σ_cand + σ_base) < |ΔS|
//
// El juez es SOFTWARE DETERMINISTA SIN LLM: las 6 dimensiones se computan
// con heurísticas de vocabulario técnico reproducibles (misma entrada →
// misma salida). Calibración: una proposal densa y equilibrada (contratos,
// fases, fallbacks, arquitectura) alcanza S ≥ 80.1 (base 75.1 + ε 5.0);
// las genéricas y verbosas quedan por debajo.
// ════════════════════════════════════════════════════════════════════════

export const WEIGHTS = { d1: 0.2, d2: 0.15, d3: 0.2, d4: 0.2, d5: 0.1, d6: 0.15 } as const;

export const EPSILON = 5.0; // ΔS mínimo para promover
export const DELTA_TOLERANCE = -2.0; // regresión máxima permitida por dimensión

export interface DimensionScores {
  d1: number; // 0-100 Compilación/Tipado
  d2: number; // 0-100 Fidelidad de Contratos
  d3: number; // 0-100 Adherencia al Pipeline
  d4: number; // 0-100 Casos Ocultos
  d5: number; // 0-100 Eficiencia de Tokens
  d6: number; // 0-100 Arquitectura/Reglas Críticas
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function countHits(haystack: string, needles: string[]): number {
  return needles.filter((n) => haystack.includes(n)).length;
}

// ── Vocabulario técnico por dimensión (calibrado contra el corpus del
//    catálogo de radiografía y las adoptions del boilerplate) ────────────
const VOCAB_D1 = [ // Compilación/Tipado: concreción ejecutable
  "schema", "ddl", "typescript", "tipado", "zod", "openapi", "json", "compila",
  "sqlite", "prisma", "contrato", "script", "determinista", "browser",
  "headless", "api", "sql", "valida", "mcp", "comando", "pipeline",
  "componente", "widget", "token", "esquema", "especifica", "dom", "html",
  "css", "código",
];
const VOCAB_D2 = [ // Fidelidad de Contratos: especificaciones e interfaces
  "contrato", "openapi", "3.1", "protobuf", "json", "schema", "xhr", "fetch",
  "intercep", "endpoint", "rest", "graphql", "payload", "hydrat", "respuesta",
  "http", "url", "api", "markdown", "sitemap", "esquema", "canónico",
  "canonica", "normaliza",
];
const VOCAB_D3 = [ // Adherencia al Pipeline: fases, orden, método
  "fase", "pipeline", "etapa", "ciclo", "audit", "reconstrucc", "verificac",
  "extrac", "extraer", "normaliza", "clonar", "radiograf", "branding",
  "especifica", "catalog", "sección", "journey", "iteracion", "iteración",
];
const VOCAB_D4 = [ // Casos Ocultos: errores, edge cases, resiliencia
  "error", "fallback", "circuito", "circuit", "edge", "casos ocultos",
  "falla", "retry", "backoff", "jitter", "resilien", "aislamiento",
  "sandbox", "reduced-motion", "wcag", "accesibilidad", "contraste",
  "anti-injection", "injection", "sanitiza", "inmutable", "append-only",
];
const VOCAB_D6 = [ // Arquitectura/Reglas Críticas
  "p1", "p2", "p5", "p6", "p7", "p8", "p9", "p11", "p12", "p13", "p14", "p15",
  "arquetipo", "arquitectura", "apple", "#ffffff", "#f5f5f7", "#1d1d1f",
  "#0071e3", "token", "l2", "control plane", "multi-tenant", "psim",
  "pre-v2.0", "mcp", "eav", "widget", "constitución", "constitucion",
  "canónico", "canonica", "ledgers", "ledger", "memoria", "subagente",
  "orquesta", "squad", "personas",
];

// Heurísticas deterministas por dimensión (0-100). Rangos comprimidos para
// que una proposal completa en las 6 dimensiones quede equilibrada (σ bajo):
// solo las densas y comprehensivas alcanzan S ≥ 80.1 (promoción ΔS ≥ 5).
export function scoreDimensions(title: string, description: string, type: string): DimensionScores {
  const text = `${title} ${description}`.toLowerCase();

  // D1 — Compilación/Tipado: concreción técnica y verbos de ejecución
  const d1 = clamp(Math.round(52 + countHits(text, VOCAB_D1) * 5.5), 34, 96);

  // D2 — Fidelidad de Contratos: menciones explícitas de contratos y specs
  const d2 = clamp(Math.round(50 + countHits(text, VOCAB_D2) * 6.5), 32, 96);

  // D3 — Adherencia al Pipeline: fases, pipeline, orden
  const d3 = clamp(Math.round(51 + countHits(text, VOCAB_D3) * 6), 34, 96);

  // D4 — Casos Ocultos: manejo de errores, edge cases, fallbacks
  const d4 = clamp(Math.round(52 + countHits(text, VOCAB_D4) * 7), 32, 95);

  // D5 — Eficiencia de Tokens: concisión (densidad léxica, sin relleno)
  const words = text.split(/\s+/).filter(Boolean);
  const unique = new Set(words).size;
  const density = words.length > 0 ? unique / words.length : 0;
  const lengthPenalty = words.length > 170 ? 8 : 0;
  const d5 = clamp(Math.round(40 + density * 57) - lengthPenalty, 55, 96);

  // D6 — Arquitectura/Reglas Críticas: referencias a reglas y arquetipos
  const typeBonus = ["BP", "KILLER", "SKILL"].includes(type.toUpperCase()) ? 3 : 0;
  const d6 = clamp(Math.round(50 + countHits(text, VOCAB_D6) * 5.5) + typeBonus, 32, 96);

  return { d1, d2, d3, d4, d5, d6 };
}

export function constitutionScore(d: DimensionScores): number {
  const s =
    WEIGHTS.d1 * d.d1 +
    WEIGHTS.d2 * d.d2 +
    WEIGHTS.d3 * d.d3 +
    WEIGHTS.d4 * d.d4 +
    WEIGHTS.d5 * d.d5 +
    WEIGHTS.d6 * d.d6;
  return Math.round(s * 10) / 10;
}

export function sigma(d: DimensionScores): number {
  const vals = [d.d1, d.d2, d.d3, d.d4, d.d5, d.d6];
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

// Baseline del sistema v1.6.0: 16 reglas, 28 APs, pipeline 5 fases, juez,
// memoria append-only, L2 con breakers, WCAG — probado en producción.
// S_base = 71.3: una adoption debe superar S ≥ 76.3 (ΔS ≥ 5) para promover.
export function baselineDimensions(): DimensionScores {
  return { d1: 72, d2: 70, d3: 72, d4: 68, d5: 76, d6: 72 };
}

export interface JudgeVerdict {
  scores: DimensionScores;
  s: number;
  deltaS: number;
  sigmaCandidate: number;
  sigmaBaseline: number;
  promoted: boolean;
  reasons: string[];
  verdict: string;
}

export function judgeProposal(
  title: string,
  description: string,
  type: string
): JudgeVerdict {
  const scores = scoreDimensions(title, description, type);
  const s = constitutionScore(scores);
  const base = baselineDimensions();
  const sBase = constitutionScore(base);
  const deltaS = Math.round((s - sBase) * 10) / 10;
  const sigmaCandidate = sigma(scores);
  const sigmaBaseline = sigma(base);

  const reasons: string[] = [];
  let dimRegression = false;
  const dimNames: (keyof DimensionScores)[] = ["d1", "d2", "d3", "d4", "d5", "d6"];
  for (const k of dimNames) {
    if (scores[k] - base[k] < DELTA_TOLERANCE) {
      dimRegression = true;
      reasons.push(
        `Regresión en ${k.toUpperCase()}: ${scores[k]} vs base ${base[k]} (< ${DELTA_TOLERANCE})`
      );
    }
  }
  const sigmaSum = Math.round((sigmaCandidate + sigmaBaseline) * 10) / 10;
  const sigmaOk = sigmaSum < Math.abs(deltaS);

  if (deltaS < EPSILON) reasons.push(`ΔS ${deltaS} < ε ${EPSILON}`);
  if (!sigmaOk) reasons.push(`(σ_cand ${sigmaCandidate} + σ_base ${sigmaBaseline}) = ${sigmaSum} ≥ |ΔS| ${Math.abs(deltaS)}`);

  const promoted = deltaS >= EPSILON && !dimRegression && sigmaOk;
  const verdict = promoted
    ? `PROMOTE — ΔS ${deltaS} ≥ ε ${EPSILON}, sin regresiones por dimensión, sigma ${sigmaSum} < |ΔS|`
    : `REJECT — ${reasons.length ? reasons.join("; ") : "condición no satisfecha"}`;

  return { scores, s, deltaS, sigmaCandidate, sigmaBaseline, promoted, reasons, verdict };
}
