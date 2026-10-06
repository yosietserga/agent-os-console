// ════════════════════════════════════════════════════════════════════════
// radiografia-context.ts — Puente Radiografía Multimodal → Instanciador.
// Carga el run de radiografía vinculado (COMPLETED) y produce:
//   (1) seedPrompt  — semilla honesta cuando el operador no escribió prompt
//                     (deriva de la síntesis ejecutiva + conceptos)
//   (2) digest      — contexto estructurado que enriquece pre-spec y spec
//                     (conceptos, apariencia, motion, negocio, componentes)
// P2: si la radiografía no existe o no está COMPLETED, devuelve null y el
//     pipeline continúa por el flujo clásico (degradación declarada).
// ════════════════════════════════════════════════════════════════════════
import { db } from "@/lib/db";
import type {
  BrandTokens,
  BusinessModelXray,
  ConceptsXray,
  RadiografiaRunDTO,
  RadiografiaSourceMeta,
  ReconstructionSpec,
} from "@/lib/agent-os/types";

interface RadiografiaRow {
  id: string;
  status: string;
  sourceType: string;
  sourcesJson: string | null;
  conceptsJson: string | null;
  brandTokens: string | null;
  businessModel: string | null;
  reconstruction: string | null;
  summary: string | null;
}

export interface RadiografiaContext {
  runId: string;
  sourceType: string;
  sources: RadiografiaSourceMeta[];
  concepts: ConceptsXray | null;
  brandTokens: BrandTokens | null;
  businessModel: BusinessModelXray | null;
  reconstruction: ReconstructionSpec | null;
  executive: string;
}

function safeParse<T>(v: string | null): T | null {
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

/** Carga la radiografía vinculada; null si no existe / no COMPLETED (P2). */
export async function loadRadiografiaContext(radiografiaId: string | null | undefined): Promise<RadiografiaContext | null> {
  if (!radiografiaId) return null;
  const row = (await db.radiografiaRun.findUnique({ where: { id: radiografiaId } })) as RadiografiaRow | null;
  if (!row || row.status !== "COMPLETED") return null;

  let executive = "";
  try {
    const doc = row.summary ? (JSON.parse(row.summary) as { executive?: string }) : null;
    executive = doc?.executive?.trim() ?? "";
  } catch {
    executive = "";
  }
  const concepts = safeParse<ConceptsXray>(row.conceptsJson);
  if (!executive && !concepts) return null; // COMPLETED sin contenido útil → no enriquecer

  return {
    runId: row.id,
    sourceType: row.sourceType,
    sources: safeParse<RadiografiaSourceMeta[]>(row.sourcesJson) ?? [],
    concepts,
    brandTokens: safeParse<BrandTokens>(row.brandTokens),
    businessModel: safeParse<BusinessModelXray>(row.businessModel),
    reconstruction: safeParse<ReconstructionSpec>(row.reconstruction),
    executive,
  };
}

/**
 * Semilla honesta cuando el operador aportó solo material (sin prompt).
 * Deriva del executive + conceptos; nunca inventa features.
 */
export function seedPromptFromRadiografia(ctx: RadiografiaContext): string {
  const concepts = ctx.concepts;
  const parts = [
    `Instancia el producto descrito por el material aportado (radiografía multimodal ${ctx.runId}).`,
    ctx.executive ? `Síntesis de la radiografía: ${ctx.executive}` : "",
    concepts?.productType ? `Tipo de producto detectado: ${concepts.productType}.` : "",
    concepts?.coreConcepts?.length ? `Conceptos centrales observados: ${concepts.coreConcepts.join(", ")}.` : "",
  ].filter(Boolean);
  return parts.join(" ");
}

/**
 * Digest estructurado para inyectar en pre-spec y spec. Markdown compacto:
 * el LLM lo trata como evidencia de PRIMERA MANO (jerarquía sobre la
 * investigación web, que sigue corriendo como flujo complementario).
 */
export function buildRadiografiaDigest(ctx: RadiografiaContext): string {
  const lines: string[] = ["### Radiografía Multimodal previa (evidencia de primera mano del operador)"];

  const fuentes = ctx.sources.length
    ? ctx.sources.map((s) => `${s.kind}:${s.name} (${s.detail || `${Math.round(s.bytes / 1024)}KB`})`).join("; ")
    : "fuentes multimodales";
  lines.push(`**Fuentes analizadas:** ${fuentes}`);

  const c = ctx.concepts;
  if (c) {
    lines.push(`**Tipo de producto:** ${c.productType}`);
    if (c.coreConcepts.length) lines.push(`**Conceptos centrales:** ${c.coreConcepts.join(", ")}`);
    if (c.screens.length) {
      lines.push("**Pantallas detectadas:**");
      for (const s of c.screens.slice(0, 8)) lines.push(`- ${s.name}: ${s.purpose}`);
    }
    const motion = c.motionDesign;
    if (motion.animations.length || motion.effects.length || motion.transitions.length) {
      lines.push("**Motion design (animaciones/efectos/transiciones):**");
      if (motion.animations.length) lines.push(`- Animaciones: ${motion.animations.join("; ")}`);
      if (motion.effects.length) lines.push(`- Efectos: ${motion.effects.join("; ")}`);
      if (motion.transitions.length) lines.push(`- Transiciones: ${motion.transitions.join("; ")}`);
    }
    if (c.uxPatterns.length) lines.push(`**Patrones UX:** ${c.uxPatterns.join(", ")}`);
  }

  const b = ctx.brandTokens;
  if (b) {
    if (b.palette.length) lines.push(`**Paleta detectada:** ${b.palette.map((p) => `${p.token} ${p.hex}`).join(", ")}`);
    if (b.typography.length) lines.push(`**Tipografía:** ${b.typography.map((t) => `${t.element} ${t.family} ${t.weight}`).join("; ")}`);
    if (b.borderRadius && b.borderRadius !== "no detectado") lines.push(`**Border radius:** ${b.borderRadius}`);
    if (b.domHighlights.length) lines.push(`**Elementos interactivos:** ${b.domHighlights.join(", ")}`);
  }

  const bm = ctx.businessModel;
  if (bm) {
    lines.push(`**Oferta:** ${bm.offer}`);
    lines.push(`**Modelo de pricing:** ${bm.pricingModel}`);
    if (bm.plans.length) lines.push(`**Planes:** ${bm.plans.map((p) => `${p.name} (${p.price})`).join("; ")}`);
    if (bm.valueProps.length) lines.push(`**Propuestas de valor:** ${bm.valueProps.join("; ")}`);
  }

  const r = ctx.reconstruction;
  if (r) {
    if (r.components.length) lines.push(`**Componentes para reconstrucción:** ${r.components.map((x) => `${x.name} (${x.type})`).join(", ")}`);
    if (r.apiContracts.length) lines.push(`**Contratos/APIs inferidos:** ${r.apiContracts.join("; ")}`);
  }

  if (ctx.executive) lines.push(`**Síntesis ejecutiva:** ${ctx.executive}`);

  return lines.join("\n");
}

/** Tipo auxiliar para exponer el DTO completo si el caller lo necesita. */
export type { RadiografiaRunDTO };
