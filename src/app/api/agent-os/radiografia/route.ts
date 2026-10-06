// POST /api/agent-os/radiografia — Lanza el Pipeline de Radiografía Rayos X.
// Body: { url } (single-URL, comando 17) O { sources: [...] } (multimodal:
// URLs + imágenes + videos del operador — fase previa del Instanciador).
// Valida ANTES de crear el run y responde INMEDIATO con status RUNNING;
// el pipeline corre en background actualizando la BD fase a fase
// (AP-032 fix: el gateway del preview corta respuestas >30s con HTML).
// El cliente hace polling GET /api/agent-os/radiografia?id=<runId>.
import { NextRequest, NextResponse } from "next/server";
import { startRadiografia, validateTargetUrl, listRuns, getRun } from "@/lib/agent-os/radiografia";
import { startMultimodalRadiografia, validateMultimodalSources } from "@/lib/agent-os/radiografia-multimodal";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      url?: string;
      sources?: unknown;
      notes?: string;
    };

    // ── Modo multimodal: fuentes (url | image | video) ──
    if (Array.isArray(body.sources)) {
      let validated;
      try {
        validated = validateMultimodalSources(body.sources);
      } catch (e) {
        return NextResponse.json(
          { success: false, data: null, error: e instanceof Error ? e.message : "fuentes inválidas", meta: {} },
          { status: 400 }
        );
      }
      const run = await startMultimodalRadiografia(validated, typeof body.notes === "string" ? body.notes.slice(0, 2000) : undefined);
      return NextResponse.json({
        success: true,
        data: run,
        error: null,
        meta: { epoch: Math.floor(Date.now() / 1000), phases: 5, background: true, mode: "multimodal" },
      });
    }

    // ── Modo single-URL (comando 17, compatible) ──
    const url = (body.url ?? "").trim();
    if (!url) {
      return NextResponse.json(
        { success: false, data: null, error: "url es obligatoria. Ej: radiografia https://objetivo.com", meta: {} },
        { status: 400 }
      );
    }
    // Validación ANTES de crear el run: URLs inválidas jamás producen runs basura
    try {
      validateTargetUrl(url);
    } catch (e) {
      return NextResponse.json(
        { success: false, data: null, error: e instanceof Error ? e.message : "URL inválida", meta: {} },
        { status: 400 }
      );
    }
    const run = await startRadiografia(url);
    return NextResponse.json({
      success: true,
      data: run,
      error: null,
      meta: { epoch: Math.floor(Date.now() / 1000), phases: 5, background: true, mode: "url" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error ejecutando radiografía",
        meta: {},
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const run = await getRun(id);
    if (!run) {
      return NextResponse.json(
        { success: false, data: null, error: `run ${id} no encontrado`, meta: {} },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: run, error: null, meta: {} });
  }
  const runs = await listRuns();
  return NextResponse.json({
    success: true,
    data: runs,
    error: null,
    meta: { count: runs.length },
  });
}
