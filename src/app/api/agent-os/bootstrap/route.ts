// POST /api/agent-os/bootstrap — { prompt } crea un run del Instanciador
//   Zero-Shot (Protocolo 11) y dispara el pipeline en background.
// GET  /api/agent-os/bootstrap — historial de runs (últimos 10).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runBootstrapPipeline } from "@/lib/agent-os/bootstrap/pipeline";
import type { BootstrapRunSummary } from "@/lib/agent-os/bootstrap/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { prompt?: unknown };
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (prompt.length < 10 || prompt.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "El prompt debe tener entre 10 y 2000 caracteres. Cuéntame qué app deseas crear.",
          meta: {},
        },
        { status: 400 }
      );
    }

    const run = await db.bootstrapRun.create({ data: { prompt } });

    // Pipeline en background: el cliente hace polling del estado por id.
    void runBootstrapPipeline(run.id);

    return NextResponse.json({
      success: true,
      data: { runId: run.id },
      error: null,
      meta: { epoch: Math.floor(Date.now() / 1000) },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error creando la instanciación",
        meta: {},
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const runs = await db.bootstrapRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        projectName: true,
        status: true,
        progress: true,
        fileCount: true,
        llmCalls: true,
        durationMs: true,
        createdAt: true,
      },
    });
    const data: BootstrapRunSummary[] = runs.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json({
      success: true,
      data,
      error: null,
      meta: { epoch: Math.floor(Date.now() / 1000) },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error listando instanciaciones",
        meta: {},
      },
      { status: 500 }
    );
  }
}
