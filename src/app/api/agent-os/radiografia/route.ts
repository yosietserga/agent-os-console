// POST /api/agent-os/radiografia — Ejecuta el Pipeline de Radiografía Rayos X
// Body: { url } → 5 fases: branding → DOM/3D → negocio → reconstrucción → verificación
import { NextRequest, NextResponse } from "next/server";
import { runRadiografia, listRuns } from "@/lib/agent-os/radiografia";

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
    const run = await runRadiografia(url);
    return NextResponse.json({
      success: run.status === "COMPLETED",
      data: run,
      error: run.status === "FAILED" ? "Pipeline falló — ver fases" : null,
      meta: { epoch: Math.floor(Date.now() / 1000), phases: 5 },
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

export async function GET() {
  const runs = await listRuns();
  return NextResponse.json({
    success: true,
    data: runs,
    error: null,
    meta: { count: runs.length },
  });
}
