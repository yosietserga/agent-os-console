// ════════════════════════════════════════════════════════════════════════
// radiografia-multimodal.ts — Radiografía Multimodal del Instanciador.
// Fase previa al Protocolo 11: el operador aporta material de primera mano
// (URLs, imágenes/fotos de apps, videos demo) y este pipeline produce un
// análisis estructurado — conceptos, apariencia, animaciones, efectos,
// modelo de negocio y reconstrucción — que luego enriquece la spec del
// bootstrap (flujo existente, sin cambios de forma).
//
// Canales de extracción (todos backend-only, P8):
//   url   → zai.functions.invoke("page_reader")   (texto + título)
//   image → zai.chat.completions.createVision (image_url, base64 data URL)
//   video → zai.chat.completions.createVision (video_url, base64 data URL)
// Síntesis → L2 infer() con evidencia consolidada (sandwich P12).
// P2: si una fuente falla, la fase lo registra y continúa con el resto;
//     si todo falla, el run queda FAILED con evidencia honesta.
// ════════════════════════════════════════════════════════════════════════
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { infer, logLedger, sanitizeInput } from "./l2";
import type {
  BrandTokens,
  BusinessModelXray,
  ConceptsXray,
  MultimodalSourceInput,
  RadiografiaPhaseState,
  RadiografiaRunDTO,
  RadiografiaSourceMeta,
  ReconstructionSpec,
  VerificationVerdict,
} from "./types";

export const MULTIMODAL_LIMITS = {
  MAX_SOURCES: 6,
  MAX_IMAGE_BYTES: 8 * 1024 * 1024, // 8 MB decodificados por imagen
  MAX_VIDEO_BYTES: 20 * 1024 * 1024, // 20 MB decodificados por video
  MAX_URLS: 3,
  MAX_TEXT_EVIDENCE: 12_000, // chars de texto por fuente
} as const;

const IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"];
const VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"];

const MULTIMODAL_PHASES: { id: number; name: string }[] = [
  { id: 1, name: "Extracción Multimodal (URL · Imagen · Video)" },
  { id: 2, name: "Conceptos, Apariencia & Motion Design" },
  { id: 3, name: "Radiografía del Modelo de Negocio" },
  { id: 4, name: "Reconstrucción Modular" },
  { id: 5, name: "Verificación & Validación" },
];

function freshPhases(): RadiografiaPhaseState[] {
  return MULTIMODAL_PHASES.map((p) => ({ ...p, status: "PENDING" as const, detail: "" }));
}

interface PhasesDoc {
  phases: RadiografiaPhaseState[];
  executive?: string;
}

/** Estima bytes decodificados de un data URL base64 (sin decodificar todo). */
function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return 0;
  const b64 = dataUrl.length - comma - 1;
  const padding = dataUrl.endsWith("==") ? 2 : dataUrl.endsWith("=") ? 1 : 0;
  return Math.floor((b64 * 3) / 4) - padding;
}

function dataUrlMime(dataUrl: string): string {
  const m = /^data:([^;,]+)[;,]/.exec(dataUrl);
  return m?.[1] ?? "";
}

/**
 * Validación de fuentes ANTES de crear el run (capa 2 P12): input inválido
 * jamás produce runs basura en el historial. Lanza Error con mensaje humano.
 */
export function validateMultimodalSources(sources: unknown): MultimodalSourceInput[] {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error("Aporta al menos una fuente: URL, imagen o video.");
  }
  if (sources.length > MULTIMODAL_LIMITS.MAX_SOURCES) {
    throw new Error(`Máximo ${MULTIMODAL_LIMITS.MAX_SOURCES} fuentes por radiografía.`);
  }
  const cleaned: MultimodalSourceInput[] = [];
  let urls = 0;
  for (const raw of sources) {
    const s = raw as Partial<MultimodalSourceInput>;
    if (s.kind === "url") {
      if (typeof s.url !== "string" || !s.url.trim()) throw new Error("Fuente url sin url.");
      const url = new URL(s.url.trim().startsWith("http") ? s.url.trim() : `https://${s.url.trim()}`);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Solo se aceptan URLs http/https.");
      urls += 1;
      if (urls > MULTIMODAL_LIMITS.MAX_URLS) throw new Error(`Máximo ${MULTIMODAL_LIMITS.MAX_URLS} URLs por radiografía.`);
      cleaned.push({ kind: "url", url: url.toString() });
      continue;
    }
    if (s.kind === "image" || s.kind === "video") {
      if (typeof s.dataUrl !== "string" || !s.dataUrl.startsWith("data:")) {
        throw new Error(`Fuente ${s.kind} sin dataUrl base64.`);
      }
      const mime = dataUrlMime(s.dataUrl);
      const bytes = dataUrlBytes(s.dataUrl);
      const limit = s.kind === "image" ? MULTIMODAL_LIMITS.MAX_IMAGE_BYTES : MULTIMODAL_LIMITS.MAX_VIDEO_BYTES;
      const mimes = s.kind === "image" ? IMAGE_MIMES : VIDEO_MIMES;
      if (!mimes.includes(mime)) {
        throw new Error(`MIME ${mime || "desconocido"} no soportado para ${s.kind} (aceptados: ${mimes.join(", ")}).`);
      }
      if (bytes <= 0 || bytes > limit) {
        throw new Error(
          `${s.kind === "image" ? "Imagen" : "Video"} fuera de rango: ${Math.round(bytes / 1024)}KB (límite ${Math.round(limit / 1024 / 1024)}MB).`
        );
      }
      cleaned.push({ kind: s.kind, name: (s.name ?? `${s.kind}-${cleaned.length + 1}`).slice(0, 120), dataUrl: s.dataUrl });
      continue;
    }
    throw new Error("Cada fuente debe ser kind url | image | video.");
  }
  return cleaned;
}

// ── Prompts de extracción por canal ────────────────────────────────────────

const IMAGE_EVIDENCE_PROMPT = `Eres el modulo de extraccion visual de la Radiografia de Ingenieria Inversa de un Agent OS. Analiza esta imagen (captura o foto de una app/sitio/diseno) y produce evidencia cruda en espanol para ingenieria inversa, cubriendo:
(1) Tipo de producto y concepto central que representa.
(2) Layout y jerarquia visual (header, nav lateral, main, tarjetas, tablas, footer).
(3) Paleta de colores con hex aproximados de los 4-6 colores dominantes.
(4) Tipografia (serif/sans/mono, pesos, tamanos relativos).
(5) Componentes UI visibles (botones, tabs, tablas, graficos, forms, badges, modals).
(6) Senales de modelo de negocio (precios, planes, CTAs de compra/suscripcion, logros, marketplaces).
(7) Estilo y mood (minimalista, corporativo, jugueton, oscuro/claro).
Maximo 350 palabras. Si algo no es visible escribe "no detectado". Prohibido inventar funciones o textos que no se ven.`;

const VIDEO_EVIDENCE_PROMPT = `Eres el modulo de extraccion de motion de la Radiografia de Ingenieria Inversa de un Agent OS. Analiza este video (demo de app, motion design o screencast) y produce evidencia cruda en espanol, cubriendo:
(1) Tipo de producto y concepto central que se demuestra.
(2) Pantallas y flujos mostrados, en orden cronologico.
(3) Animaciones observadas (fade, slide, scale, parallax, reveal, morph).
(4) Transiciones entre pantallas o secciones.
(5) Efectos visuales (glassmorphism, sombras, gradientes, blur, glow, particulas, 3D).
(6) Micro-interacciones (feedback de tap/hover, loaders, skeletons, progress).
(7) Senales de modelo de negocio si son visibles.
Maximo 350 palabras. Si algo no es observable escribe "no detectado". Prohibido inventar.`;

const SYNTHESIS_SYSTEM_PROMPT = `Eres el motor de Radiografia Multimodal de un Agent OS. Recibes evidencia de primera mano extraida de multiples fuentes aportadas por el operador (paginas web leidas, imagenes/fotos de apps analizadas por vision, videos demo analizados por vision) y produces SOLO un JSON valido (sin markdown, sin texto fuera del JSON) con esta estructura exacta:
{
  "concepts": {
    "productType": "tipo de producto en una frase, ej. app de gestion dental multi-tenant",
    "coreConcepts": ["5-8 conceptos clave que definen el producto, ej. historia clinica, agenda"],
    "screens": [{"name": "Nombre de pantalla detectada", "purpose": "para que sirve"}],
    "motionDesign": {"animations": ["animaciones observadas"], "effects": ["efectos visuales"], "transitions": ["transiciones entre pantallas"]},
    "uxPatterns": ["patrones de interaccion detectados, ej. wizard, drag-n-drop, onboarding"]
  },
  "brandTokens": {
    "palette": [{"token": "background|surface|border|textPrimary|textSecondary|accent", "hex": "#rrggbb", "usage": "descripcion"}],
    "typography": [{"element": "h1|body|caption", "family": "familia detectada", "weight": "600"}],
    "borderRadius": "valor dominante",
    "spacing": "sistema de espaciado dominante",
    "layoutPositions": ["posiciones canonicas detectadas entre: header, featuredContent, column_left, main, column_right, featuredFooter, footer"],
    "domHighlights": ["elementos interactivos clave detectados"]
  },
  "businessModel": {
    "offer": "oferta central en una frase",
    "pricingModel": "freemium|tiered|suscripcion|pago unico|consumo|desconocido",
    "plans": [{"name": "", "price": "", "features": [""]}],
    "valueProps": [""],
    "distributionChannels": [""],
    "porterHighlights": ["un insight por cada una de las 5 fuerzas de Porter"]
  },
  "reconstruction": {
    "components": [{"name": "ComponentName", "type": "widget|layout|feature", "notes": "notas de implementacion tipada"}],
    "normalizedTokens": ["tokens normalizados a Apple Light: #ffffff, #f5f5f7, #1d1d1f, #86868b, #0071e3"],
    "threeJs": {"detected": false, "evidence": "evidencia de WebGL/Three.js/canvas/shaders o 'no detectado'"},
    "apiContracts": ["contratos o patrones de API inferidos del contenido"]
  },
  "verification": {
    "verdict": "AGREE|DISAGREE|MIXED",
    "criteria": [{"name": "criterio", "result": "PASS|FAIL|PARTIAL"}],
    "weaknesses": ["minimo 2 debilidades reales del analisis (auto-critica Modo A)"]
  },
  "executive": "sintesis ejecutiva en 2-3 frases: que producto es, que apariencia/motion tiene y como monetiza"
}
Reglas: cero placeholders ficticios; si un dato no esta presente en la evidencia escribe "no detectado". SE CONCISO: maximo 4 items por lista, frases cortas de maximo 14 palabras (la salida debe ser un JSON compacto que NO exceda ~1500 tokens). Prioriza SIEMPRE la evidencia visual (imagenes/videos) sobre la inferencia textual. En verification.weaknesses incluye una debilidad por cada fuente que no aporto evidencia utilizable.`;

interface MultimodalXrayJSON {
  concepts: ConceptsXray;
  brandTokens: BrandTokens;
  businessModel: BusinessModelXray;
  reconstruction: ReconstructionSpec;
  verification: VerificationVerdict;
  executive: string;
}

function extractJson(raw: string): MultimodalXrayJSON | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1) return null;
  // Candidato 1: slice entre la primera { y la última } (texto alrededor).
  if (end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1)) as MultimodalXrayJSON;
    } catch {
      // continúa con salvage
    }
  }
  // Candidato 2 (salvage de truncado): cerrar la estructura abierta sobre
  // el string COMPLETO desde la primera { — el L2 puede cortarse a mitad
  // de JSON por límite de tokens. Los campos ausentes quedan "no detectado"
  // vía normalizeXray (P2 sin invención).
  const repaired = repairTruncatedJson(raw.slice(start));
  if (!repaired) return null;
  try {
    return JSON.parse(repaired) as MultimodalXrayJSON;
  } catch {
    return null;
  }
}

/**
 * Repara JSON truncado: cierra strings/brackets/braces abiertos y elimina
 * colas inválidas (coma final, clave sin valor). Devuelve null si el slice
 * está tan roto que no hay nada que salvar.
 */
function repairTruncatedJson(s: string): string | null {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { if (inString) escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  let out = s;
  if (inString) out += '"';
  // Eliminar colas inválidas: coma suelta, o clave "...": sin valor
  out = out.replace(/,\s*$/, "");
  out = out.replace(/,?\s*"[^"\\]*(?:\\.[^"\\]*)*"\s*:\s*$/, "");
  out = out.replace(/,\s*$/, "");
  while (stack.length) out += stack.pop();
  return out === s && !inString ? null : out;
}

/**
 * Normaliza el JSON del L2: si el objeto parseó pero trae secciones ausentes
 * o malformadas, las rellena con formas mínimas honestas ("no detectado").
 * Devuelve null si el objeto es irrecuperable (no es un objeto útil).
 */
function normalizeXray(candidate: MultimodalXrayJSON | null): MultimodalXrayJSON | null {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const str = (v: unknown, fallback: string): string => (typeof v === "string" && v.trim() ? v.trim() : fallback);
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).slice(0, 6) : []);
  const c = (candidate.concepts ?? {}) as Partial<ConceptsXray>;
  const motion = (c.motionDesign ?? {}) as Partial<ConceptsXray["motionDesign"]>;
  const b = (candidate.brandTokens ?? {}) as Partial<BrandTokens>;
  const bm = (candidate.businessModel ?? {}) as Partial<BusinessModelXray>;
  const r = (candidate.reconstruction ?? {}) as Partial<ReconstructionSpec>;
  const v = (candidate.verification ?? {}) as Partial<VerificationVerdict>;
  return {
    concepts: {
      productType: str(c.productType, "no detectado"),
      coreConcepts: arr(c.coreConcepts),
      screens: Array.isArray(c.screens)
        ? c.screens
            .filter((s) => s && typeof s === "object")
            .map((s) => ({ name: str((s as { name?: string }).name, "Pantalla"), purpose: str((s as { purpose?: string }).purpose, "no detectado") }))
            .slice(0, 8)
        : [],
      motionDesign: {
        animations: arr(motion.animations),
        effects: arr(motion.effects),
        transitions: arr(motion.transitions),
      },
      uxPatterns: arr(c.uxPatterns),
    },
    brandTokens: {
      palette: Array.isArray(b.palette)
        ? b.palette
            .filter((p) => p && typeof p === "object")
            .map((p) => ({ token: str((p as { token?: string }).token, "extra"), hex: str((p as { hex?: string }).hex, "#000000"), usage: str((p as { usage?: string }).usage, "no detectado") }))
            .slice(0, 6)
        : [],
      typography: Array.isArray(b.typography)
        ? b.typography
            .filter((t) => t && typeof t === "object")
            .map((t) => ({ element: str((t as { element?: string }).element, "body"), family: str((t as { family?: string }).family, "no detectado"), weight: str((t as { weight?: string }).weight, "400") }))
            .slice(0, 6)
        : [],
      borderRadius: str(b.borderRadius, "no detectado"),
      spacing: str(b.spacing, "no detectado"),
      layoutPositions: arr(b.layoutPositions),
      domHighlights: arr(b.domHighlights),
    },
    businessModel: {
      offer: str(bm.offer, "no detectado"),
      pricingModel: str(bm.pricingModel, "desconocido"),
      plans: Array.isArray(bm.plans)
        ? bm.plans
            .filter((p) => p && typeof p === "object")
            .map((p) => ({
              name: str((p as { name?: string }).name, "Plan"),
              price: str((p as { price?: string }).price, "no detectado"),
              features: arr((p as { features?: string[] }).features),
            }))
            .slice(0, 6)
        : [],
      valueProps: arr(bm.valueProps),
      distributionChannels: arr(bm.distributionChannels),
      porterHighlights: arr(bm.porterHighlights),
    },
    reconstruction: {
      components: Array.isArray(r.components)
        ? r.components
            .filter((x) => x && typeof x === "object")
            .map((x) => ({ name: str((x as { name?: string }).name, "Component"), type: str((x as { type?: string }).type, "feature"), notes: str((x as { notes?: string }).notes, "no detectado") }))
            .slice(0, 6)
        : [],
      normalizedTokens: arr(r.normalizedTokens),
      threeJs: {
        detected: Boolean((r.threeJs as { detected?: boolean })?.detected),
        evidence: str((r.threeJs as { evidence?: string })?.evidence, "no detectado"),
      },
      apiContracts: arr(r.apiContracts),
    },
    verification: {
      verdict: (["AGREE", "DISAGREE", "MIXED"] as const).includes(v.verdict as "AGREE" | "DISAGREE" | "MIXED") ? (v.verdict as "AGREE" | "DISAGREE" | "MIXED") : "MIXED",
      criteria: Array.isArray(v.criteria)
        ? v.criteria
            .filter((x) => x && typeof x === "object")
            .map((x) => ({ name: str((x as { name?: string }).name, "criterio"), result: str((x as { result?: string }).result, "PARTIAL") }))
            .slice(0, 6)
        : [{ name: "sintesis estructurada", result: "PARTIAL" }],
      weaknesses: arr(v.weaknesses).length ? arr(v.weaknesses) : ["El L2 no reporto debilidades explicitas — auto-critica incompleta"],
    },
    executive: str(candidate.executive, "Radiografia multimodal completada sin sintesis ejecutiva."),
  };
}

// ── Persistencia de fases (mismo patrón que radiografia.ts) ───────────────

async function readPhases(runId: string): Promise<PhasesDoc> {
  const row = await db.radiografiaRun.findUnique({ where: { id: runId } });
  if (!row?.summary) return { phases: freshPhases() };
  try {
    return JSON.parse(row.summary) as PhasesDoc;
  } catch {
    return { phases: freshPhases() };
  }
}

async function setPhase(runId: string, phase: number, status: RadiografiaPhaseState["status"], detail: string): Promise<void> {
  const doc = await readPhases(runId);
  const phases = doc.phases.map((p) => (p.id === phase ? { ...p, status, detail } : p));
  await db.radiografiaRun.update({
    where: { id: runId },
    data: { phase, summary: JSON.stringify({ phases, executive: doc.executive } satisfies PhasesDoc) },
  });
}

function toDTO(row: {
  id: string; targetUrl: string; sourceType: string; sourcesJson: string | null;
  conceptsJson: string | null; targetTitle: string | null; status: string;
  phase: number; brandTokens: string | null; businessModel: string | null;
  reconstruction: string | null; verification: string | null; summary: string | null;
  tokensUsed: number; createdAt: Date; completedAt: Date | null;
}): RadiografiaRunDTO {
  const doc = (() => {
    try {
      const parsed = row.summary ? (JSON.parse(row.summary) as PhasesDoc) : null;
      return parsed && Array.isArray(parsed.phases) ? parsed : { phases: freshPhases() };
    } catch {
      return { phases: freshPhases() };
    }
  })();
  const safeParse = <T,>(v: string | null): T | null => {
    if (!v) return null;
    try { return JSON.parse(v) as T; } catch { return null; }
  };
  let sources: RadiografiaSourceMeta[] = [];
  if (row.sourcesJson) {
    try {
      const parsed = JSON.parse(row.sourcesJson) as RadiografiaSourceMeta[];
      if (Array.isArray(parsed)) sources = parsed;
    } catch { /* defensivo */ }
  }
  return {
    id: row.id,
    targetUrl: row.targetUrl,
    sourceType: row.sourceType,
    sources,
    concepts: safeParse<ConceptsXray>(row.conceptsJson),
    targetTitle: row.targetTitle,
    status: row.status,
    phase: row.phase,
    phases: doc.phases,
    brandTokens: safeParse<BrandTokens>(row.brandTokens),
    businessModel: safeParse<BusinessModelXray>(row.businessModel),
    reconstruction: safeParse<ReconstructionSpec>(row.reconstruction),
    verification: safeParse<VerificationVerdict>(row.verification),
    summary: doc.executive ?? null,
    tokensUsed: row.tokensUsed,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

function sourcesLabel(sources: MultimodalSourceInput[]): string {
  const counts = { url: 0, image: 0, video: 0 };
  for (const s of sources) counts[s.kind] += 1;
  const parts: string[] = [];
  if (counts.url) parts.push(`${counts.url} URL${counts.url > 1 ? "s" : ""}`);
  if (counts.image) parts.push(`${counts.image} imagen${counts.image > 1 ? "es" : ""}`);
  if (counts.video) parts.push(`${counts.video} video${counts.video > 1 ? "s" : ""}`);
  return parts.join(" + ");
}

// ── Pipeline público ──────────────────────────────────────────────────────

export async function startMultimodalRadiografia(
  sources: MultimodalSourceInput[],
  notes?: string
): Promise<RadiografiaRunDTO> {
  const validated = validateMultimodalSources(sources); // lanza si hay input basura
  const run = await db.radiografiaRun.create({
    data: {
      targetUrl: sourcesLabel(validated),
      sourceType: "multimodal",
      status: "RUNNING",
      phase: 0,
      sourcesJson: JSON.stringify(
        validated.map((s) => ({ kind: s.kind, name: s.name ?? s.url ?? s.kind, bytes: s.dataUrl ? dataUrlBytes(s.dataUrl) : 0, detail: "en cola" }))
      ),
      summary: JSON.stringify({ phases: freshPhases() } satisfies PhasesDoc),
    },
  });
  void executeMultimodalPipeline(run.id, validated, notes?.trim() || "").catch(() => {
    // El pipeline registra su propio error en la BD (FAILED);
    // este catch es defensivo para evitar promesas no observadas.
  });
  return toDTO(run as Parameters<typeof toDTO>[0]);
}

async function executeMultimodalPipeline(
  runId: string,
  sources: MultimodalSourceInput[],
  notes: string
): Promise<void> {
  const metas: RadiografiaSourceMeta[] = [];
  const evidences: string[] = [];
  let tokensUsed = 0;

  try {
    // ── Fase 1: Extracción por fuente ──
    await setPhase(runId, 1, "RUNNING", `Extrayendo ${sources.length} fuente(s): ${sourcesLabel(sources)}`);
    const zai = await ZAI.create();

    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      const name = s.name ?? s.url ?? s.kind;
      await setPhase(runId, 1, "RUNNING", `Extrayendo fuente ${i + 1}/${sources.length}: ${name.slice(0, 48)}`);
      let evidence = "";
      let detail = "";

      if (s.kind === "url") {
        const page = await zai.functions.invoke("page_reader", { url: s.url! });
        const html: string = page.data?.html ?? "";
        evidence = `FUENTE URL "${s.url}" (titulo: ${page.data?.title ?? "no detectado"}):\n${html
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, MULTIMODAL_LIMITS.MAX_TEXT_EVIDENCE)}`;
        detail = `${Math.round(html.length / 1024)}KB leidos · ${page.data?.title?.slice(0, 40) ?? "sin titulo"}`;
        await logLedger({
          model: "page_reader (z-ai)",
          tenant: "agent-os-console",
          purpose: "radiografia-multimodal-url",
          promptTokens: 0,
          completionTokens: Math.ceil(evidence.length / 4),
          latencyMs: 0,
          outcome: "OK",
        });
      } else {
        const started = Date.now();
        const isImage = s.kind === "image";
        const content: Array<{ type: "text"; text: string } | { type: "image_url" | "video_url"; image_url?: { url: string }; video_url?: { url: string } }> = [
          { type: "text", text: isImage ? IMAGE_EVIDENCE_PROMPT : VIDEO_EVIDENCE_PROMPT },
          isImage
            ? { type: "image_url", image_url: { url: s.dataUrl! } }
            : { type: "video_url", video_url: { url: s.dataUrl! } },
        ];
        const completion = await zai.chat.completions.createVision({
          messages: [{ role: "user", content }],
          thinking: { type: "disabled" },
        });
        const out = completion.choices[0]?.message?.content ?? "";
        if (!out.trim()) throw new Error(`Vision devolvio vacio para ${name}`);
        evidence = `FUENTE ${isImage ? "IMAGEN" : "VIDEO"} "${name}" (evidencia visual):\n${out.trim()}`;
        const promptTokens = Math.ceil((isImage ? IMAGE_EVIDENCE_PROMPT.length : VIDEO_EVIDENCE_PROMPT.length) / 4) + Math.ceil(dataUrlBytes(s.dataUrl!) / 1500);
        const completionTokens = Math.ceil(out.length / 4);
        tokensUsed += promptTokens + completionTokens;
        await logLedger({
          model: "GLM-4.6V (z-ai-vision)",
          tenant: "agent-os-console",
          purpose: `radiografia-multimodal-${s.kind}`,
          promptTokens,
          completionTokens,
          latencyMs: Date.now() - started,
          outcome: "OK",
        });
        detail = `Vision OK · ${out.trim().split(/\s+/).length} palabras de evidencia`;
      }

      evidences.push(evidence);
      metas.push({ kind: s.kind, name, bytes: s.dataUrl ? dataUrlBytes(s.dataUrl) : 0, detail });
      await db.radiografiaRun.update({
        where: { id: runId },
        data: { sourcesJson: JSON.stringify(metas) },
      });
    }

    if (evidences.length === 0) {
      throw new Error("Ninguna fuente produjo evidencia utilizable");
    }
    await setPhase(runId, 1, "DONE", `${metas.length} fuente(s) extraida(s) · ${evidences.reduce((a, e) => a + e.length, 0)} chars de evidencia`);

    // ── Fase 2: Síntesis estructurada vía L2 (sandwich P12) ──
    await setPhase(runId, 2, "RUNNING", "Sintetizando conceptos, apariencia y motion design via L2");
    const notesBlock = notes ? `\n\nNOTAS DEL OPERADOR: ${sanitizeInput(notes)}` : "";
    const userContent = `EVIDENCIA CONSOLIDADA DE ${metas.length} FUENTE(S) MULTIMODAL(ES):\n\n${evidences.join("\n\n---\n\n")}${notesBlock}\n\nProduce la radiografia estructurada completa.`;

    // Reintentos automáticos (2 intentos): el segundo exige JSON estricto.
    // P2: si ambos fallan, el error conserva evidencia del fallo.
    let xray: MultimodalXrayJSON | null = null;
    let lastInference = null as null | Awaited<ReturnType<typeof infer>>;
    let lastRawSnippet = "";
    for (let attempt = 1; attempt <= 2 && !xray; attempt++) {
      const attemptContent =
        attempt === 1
          ? userContent
          : `${userContent}\n\nINTENTO ${attempt}: tu respuesta anterior fue TRUNCADA o no-JSON (fragmento: ${lastRawSnippet}). Responde SOLO el objeto JSON pedido, empezando en { y terminando en }, con maximo 3 items por lista y frases de maximo 10 palabras para asegurar que cabe completa.`;
      const inference = await infer({
        systemPrompt: SYNTHESIS_SYSTEM_PROMPT,
        userContent: attemptContent,
        tenant: "agent-os-console",
        purpose: "radiografia-multimodal-sintesis",
      });
      lastInference = inference;
      if (inference.outcome === "OK") {
        xray = normalizeXray(extractJson(inference.content));
        if (!xray) lastRawSnippet = inference.content.slice(0, 160).replace(/\s+/g, " ");
      } else {
        lastRawSnippet = (inference.error ?? "error L2").slice(0, 160);
        break; // error de transporte/429: no reintentar en bucle (P17 rate-limit aware)
      }
    }

    if (!xray) {
      const reason =
        lastInference?.outcome === "ERROR"
          ? `Sintesis L2 fallo tras reintentos: ${lastInference.error ?? "error desconocido"} (P2: sin fallback ficticio)`
          : `Sintesis L2 no estructuro JSON valido tras 2 intentos. Ultimo fragmento: "${lastRawSnippet}" (P2)`;
      throw new Error(reason);
    }
    const inference = lastInference!;
    tokensUsed += inference.promptTokens + inference.completionTokens;
    await setPhase(runId, 2, "DONE", `L2 ${inference.model} · ${inference.completionTokens} tokens salida · conceptos: ${xray.concepts.coreConcepts.length}`);
    await setPhase(runId, 3, "DONE", `Modelo: ${xray.businessModel.pricingModel} · ${xray.businessModel.plans.length} planes · Porter: ${xray.businessModel.porterHighlights.length} insights`);
    await setPhase(runId, 4, "DONE", `${xray.reconstruction.components.length} componentes · motion: ${xray.concepts.motionDesign.animations.length} animaciones + ${xray.concepts.motionDesign.effects.length} efectos`);
    await setPhase(runId, 5, "DONE", `Veredicto: ${xray.verification.verdict} · ${xray.verification.criteria.length} criterios evaluados`);

    const docFinal = await readPhases(runId);
    const phasesDone = docFinal.phases.map((p) => ({ ...p, status: "DONE" as const }));
    await db.radiografiaRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        phase: 5,
        conceptsJson: JSON.stringify(xray.concepts),
        brandTokens: JSON.stringify(xray.brandTokens),
        businessModel: JSON.stringify(xray.businessModel),
        reconstruction: JSON.stringify(xray.reconstruction),
        verification: JSON.stringify(xray.verification),
        summary: JSON.stringify({ phases: phasesDone, executive: xray.executive } satisfies PhasesDoc),
        tokensUsed,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "error desconocido";
    const doc = await readPhases(runId);
    const firstPending = doc.phases.find((p) => p.status !== "DONE")?.id ?? 1;
    await setPhase(runId, firstPending, "FAILED", message.slice(0, 200));
    // Las fuentes ya extraídas conservan su detalle (evidencia parcial honesta)
    await db.radiografiaRun.update({
      where: { id: runId },
      data: {
        status: "FAILED",
        sourcesJson: JSON.stringify(metas.length ? metas : [{ kind: "url", name: "sin fuentes", bytes: 0, detail: message.slice(0, 120) }]),
        completedAt: new Date(),
      },
    });
  }
}
