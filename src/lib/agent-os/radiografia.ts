// ════════════════════════════════════════════════════════════════════════
// radiografia.ts — Pipeline de Radiografía Rayos X (comando 17)
// 5 etapas: branding → DOM/shaders/3D → modelo de negocio → reconstrucción
// → verificación. Usa page_reader (extracción) + L2 (análisis estructurado).
// ════════════════════════════════════════════════════════════════════════
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { infer, sanitizeInput } from "./l2";
import type {
  BrandTokens,
  BusinessModelXray,
  ConceptsXray,
  RadiografiaPhaseState,
  RadiografiaRunDTO,
  RadiografiaSourceMeta,
  ReconstructionSpec,
  VerificationVerdict,
} from "./types";

export const PHASES: { id: number; name: string }[] = [
  { id: 1, name: "Extracción Visual & Branding" },
  { id: 2, name: "DOM, Shaders & 3D Three.js" },
  { id: 3, name: "Radiografía del Modelo de Negocio" },
  { id: 4, name: "Reconstrucción Modular" },
  { id: 5, name: "Verificación & Validación" },
];

function freshPhases(): RadiografiaPhaseState[] {
  return PHASES.map((p) => ({ ...p, status: "PENDING" as const, detail: "" }));
}

interface PhasesDoc {
  phases: RadiografiaPhaseState[];
  executive?: string;
}

function toDTO(row: {
  id: string; targetUrl: string; sourceType: string; sourcesJson: string | null;
  conceptsJson: string | null; targetTitle: string | null; status: string;
  phase: number; brandTokens: string | null; businessModel: string | null;
  reconstruction: string | null; verification: string | null; summary: string | null;
  tokensUsed: number; createdAt: Date; completedAt: Date | null;
}): RadiografiaRunDTO {
  let doc: PhasesDoc = { phases: freshPhases() };
  if (row.summary) {
    try {
      const parsed = JSON.parse(row.summary) as PhasesDoc;
      if (parsed && Array.isArray(parsed.phases)) doc = parsed;
    } catch {
      // summary corrupto → fases frescas (defensivo, sin crash)
    }
  }
  const safeParse = <T,>(v: string | null): T | null => {
    if (!v) return null;
    try { return JSON.parse(v) as T; } catch { return null; }
  };
  let sources: RadiografiaSourceMeta[] = [];
  if (row.sourcesJson) {
    try {
      const parsed = JSON.parse(row.sourcesJson) as RadiografiaSourceMeta[];
      if (Array.isArray(parsed)) sources = parsed;
    } catch {
      // sourcesJson corrupto → lista vacía (defensivo)
    }
  }
  return {
    id: row.id,
    targetUrl: row.targetUrl,
    sourceType: row.sourceType ?? "url",
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

type RunRow = Parameters<typeof toDTO>[0];

export async function listRuns(): Promise<RadiografiaRunDTO[]> {
  const rows = await db.radiografiaRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return rows.map((r) => toDTO(r as RunRow));
}

export async function getRun(id: string): Promise<RadiografiaRunDTO | null> {
  const row = await db.radiografiaRun.findUnique({ where: { id } });
  return row ? toDTO(row as RunRow) : null;
}

const SYSTEM_PROMPT = `Eres el motor de Radiografía de Ingeniería Inversa de un Agent OS. Recibes el contenido extraído de una web objetivo y produces SOLO un JSON válido (sin markdown, sin texto fuera del JSON) con esta estructura exacta:
{
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
  "executive": "sintesis ejecutiva en 2-3 frases"
}
Reglas: cero placeholders ficticios; si un dato no esta presente escribe "no detectado". Maximo 6 items por lista.`;

interface XrayJSON {
  brandTokens: BrandTokens;
  businessModel: BusinessModelXray;
  reconstruction: ReconstructionSpec;
  verification: VerificationVerdict;
  executive: string;
}

function extractJson(raw: string): XrayJSON | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as XrayJSON;
  } catch {
    return null;
  }
}

// Fallback determinista (AP-008 resiliente): análisis regex del HTML crudo
function deterministicXray(html: string, title: string): XrayJSON {
  const hexes = [...new Set(html.match(/#[0-9a-fA-F]{6}\b/g) ?? [])].slice(0, 6);
  const hasThree = /three\.?js|webgl|<canvas|glsl|shader/i.test(html);
  const fonts = [...new Set(html.match(/font-family:\s*([^;"]+)/gi) ?? [])]
    .map((f) => f.replace(/font-family:\s*/i, ""))
    .slice(0, 4);
  const tokenNames = ["background", "surface", "accent", "textPrimary", "textSecondary", "border"];
  return {
    brandTokens: {
      palette: hexes.length
        ? hexes.map((h, i) => ({
            token: tokenNames[i] ?? "extra",
            hex: h,
            usage: "color hex encontrado en el markup",
          }))
        : [{ token: "background", hex: "#ffffff", usage: "no detectado — default Apple Light" }],
      typography: fonts.length
        ? fonts.map((f) => ({ element: "body", family: f, weight: "400" }))
        : [{ element: "body", family: "no detectado", weight: "400" }],
      borderRadius: (html.match(/border-radius:\s*([^;"]+)/i)?.[1] ?? "no detectado").trim(),
      spacing: /gap|padding|margin/.test(html) ? "sistema de gap/padding CSS detectado" : "no detectado",
      layoutPositions: ["header", "main", "footer"],
      domHighlights: [...new Set(html.match(/<(nav|header|footer|section|article|aside|button|form)\b/gi) ?? [])]
        .map((t) => t.replace(/[<]/g, ""))
        .slice(0, 6),
    },
    businessModel: {
      offer: title || "no detectado",
      pricingModel: /\$|usd|€|precio|pricing|plan/i.test(html) ? "posible tiered — verificar" : "no detectado",
      plans: [],
      valueProps: [],
      distributionChannels: [],
      porterHighlights: ["analisis determinista limitado: requiere sintesis L2 para las 5 fuerzas"],
    },
    reconstruction: {
      components: [
        { name: "HeaderNav", type: "layout", notes: "nav detectado en markup" },
        { name: "MainContent", type: "layout", notes: "secciones detectadas" },
      ],
      normalizedTokens: ["#ffffff fondo", "#f5f5f7 superficies", "#1d1d1f texto", "#86868b secundario", "#0071e3 acento"],
      threeJs: { detected: hasThree, evidence: hasThree ? "canvas/webgl/three referenciado en el HTML" : "no detectado" },
      apiContracts: [],
    },
    verification: {
      verdict: "MIXED",
      criteria: [
        { name: "extraccion de contenido", result: "PASS" },
        { name: "sintesis L2 estructurada", result: "FAIL (fallback determinista activo)" },
      ],
      weaknesses: [
        "El analisis primario LLM fallo y se uso extraccion regex determinista",
        "Sin captura de estilos computados: la paleta puede ser incompleta",
      ],
    },
    executive: `Radiografia en modo determinista (fallback) de "${title}". Extraccion basica completada; sintesis estructurada pendiente.`,
  };
}

// Validación de URL (capa 2 P12) — lanzada ANTES de crear el run para que
// una URL inválida jamás produzca runs basura en el historial.
export function validateTargetUrl(targetUrl: string): URL {
  let url: URL;
  try {
    url = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
  } catch {
    throw new Error("URL inválida");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Solo se aceptan protocolos http/https");
  }
  return url;
}

/**
 * AP-032 (fix): el pipeline tarda 25-40s (page_reader + inferencia L2) y
 * excedía el timeout del gateway del preview (~30s) — el frontend recibía
 * HTML 504 en vez de JSON. Ahora el POST crea el run, lanza el pipeline en
 * background (que actualiza la BD fase a fase) y responde de inmediato con
 * el run en estado RUNNING. El cliente hace polling GET /radiografia?id=.
 */
export async function startRadiografia(targetUrl: string): Promise<RadiografiaRunDTO> {
  const url = validateTargetUrl(targetUrl);
  const run = await db.radiografiaRun.create({
    data: {
      targetUrl: url.toString(),
      status: "RUNNING",
      phase: 0,
      summary: JSON.stringify({ phases: freshPhases() } satisfies PhasesDoc),
    },
  });
  void executePipeline(run.id, url).catch(() => {
    // El pipeline registra su propio error en la BD (status FAILED);
    // este catch es defensivo para evitar promesas no observadas.
  });
  return toDTO(run as RunRow);
}

async function executePipeline(runId: string, url: URL): Promise<void> {
  const run = { id: runId };

  const readPhases = async (): Promise<PhasesDoc> => {
    const row = await db.radiografiaRun.findUnique({ where: { id: run.id } });
    if (!row?.summary) return { phases: freshPhases() };
    try {
      return JSON.parse(row.summary) as PhasesDoc;
    } catch {
      return { phases: freshPhases() };
    }
  };

  const setPhase = async (
    phase: number,
    status: RadiografiaPhaseState["status"],
    detail: string
  ) => {
    const doc = await readPhases();
    const phases = doc.phases.map((p) => (p.id === phase ? { ...p, status, detail } : p));
    await db.radiografiaRun.update({
      where: { id: run.id },
      data: {
        phase,
        summary: JSON.stringify({ phases, executive: doc.executive } satisfies PhasesDoc),
      },
    });
  };

  try {
    // ── Fase 1: Extracción (page_reader) ──
    await setPhase(1, "RUNNING", "Leyendo página objetivo");
    const zai = await ZAI.create();
    const page = await zai.functions.invoke("page_reader", { url: url.toString() });
    const html: string = page.data?.html ?? "";
    const text: string = html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12_000);
    const title: string = page.data?.title ?? url.hostname;
    await db.radiografiaRun.update({
      where: { id: run.id },
      data: { targetTitle: title },
    });
    await setPhase(1, "DONE", `${Math.round(html.length / 1024)}KB extraídos · ${title.slice(0, 48)}`);

    // ── Fases 2-4: Análisis estructurado vía L2 (sandwich P12) ──
    await setPhase(2, "RUNNING", "Analizando DOM, branding y shaders vía L2");
    const inference = await infer({
      systemPrompt: SYSTEM_PROMPT,
      userContent: `URL: ${url.toString()}\nTITULO: ${sanitizeInput(title)}\n\nCONTENIDO (sanitizado):\n${text}`,
      tenant: "agent-os-console",
      purpose: "radiografia",
    });

    let xray: XrayJSON | null = null;
    if (inference.outcome === "OK") xray = extractJson(inference.content);
    if (!xray) {
      xray = deterministicXray(html, title);
      await setPhase(2, "DONE", "Fallback determinista (regex) — L2 no estructuró JSON");
    } else {
      await setPhase(2, "DONE", `L2 ${inference.model} · ${inference.latencyMs}ms · ${inference.completionTokens} tokens salida`);
    }

    await setPhase(3, "DONE", `Modelo: ${xray.businessModel.pricingModel} · ${xray.businessModel.plans.length} planes · Porter: ${xray.businessModel.porterHighlights.length} insights`);
    await setPhase(4, "DONE", `${xray.reconstruction.components.length} componentes · 3D: ${xray.reconstruction.threeJs.detected ? "detectado" : "no"}`);
    await setPhase(5, "DONE", `Veredicto: ${xray.verification.verdict} · ${xray.verification.criteria.length} criterios evaluados`);

    // Preservar los detalles acumulados de cada fase (P1: verificación post-edición)
    const docFinal = await readPhases();
    const phasesDone = docFinal.phases.map((p) => ({
      ...p,
      status: "DONE" as const,
    }));
    await db.radiografiaRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        phase: 5,
        brandTokens: JSON.stringify(xray.brandTokens),
        businessModel: JSON.stringify(xray.businessModel),
        reconstruction: JSON.stringify(xray.reconstruction),
        verification: JSON.stringify(xray.verification),
        summary: JSON.stringify({ phases: phasesDone, executive: xray.executive } satisfies PhasesDoc),
        tokensUsed: inference.promptTokens + inference.completionTokens,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    const doc = await readPhases();
    const firstPending = doc.phases.find((p) => p.status !== "DONE")?.id ?? 1;
    await setPhase(firstPending, "FAILED", error instanceof Error ? error.message : "error desconocido");
    await db.radiografiaRun.update({
      where: { id: run.id },
      data: { status: "FAILED", completedAt: new Date() },
    });
  }
}
