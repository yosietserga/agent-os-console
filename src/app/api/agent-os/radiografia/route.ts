// POST /api/agent-os/radiografia — Lanza el Pipeline de Radiografía Rayos X
// Body: { url } → valida, crea el run y responde INMEDIATO con status RUNNING.
// El pipeline de 5 fases corre en background actualizando la BD fase a fase
// (AP-032 fix: antes esperaba 25-40s y el gateway del preview cortaba con HTML).
// El cliente hace polling GET /api/agent-os/radiografia?id=<runId>.
import { NextRequest, NextResponse } from "next/server";
import { startRadiografia, validateTargetUrl, listRuns, getRun } from "@/lib/agent-os/radiografia";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
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
      meta: { epoch: Math.floor(Date.now() / 1000), phases: 5, background: true },
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
