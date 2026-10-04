// GET  /api/agent-os/bucle — estado del bucle (run + goals + tasks + stages + handoff)
// POST /api/agent-os/bucle — { action: "start", prompt, maxIterations? } | { action: "continue" }
import { NextRequest, NextResponse } from "next/server";
import { getBucleOverview, startBucle, continueBucle } from "@/lib/agent-os/workflow-loop";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const overview = await getBucleOverview();
    return NextResponse.json({
      success: true,
      data: overview,
      error: null,
      meta: { epoch: Math.floor(Date.now() / 1000) },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error obteniendo estado del bucle",
        meta: {},
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      prompt?: string;
      maxIterations?: number;
    };
    if (body.action === "start") {
      if (!body.prompt || !body.prompt.trim()) {
        return NextResponse.json(
          { success: false, data: null, error: "Prompt vacío. Uso: { action: 'start', prompt: '...' }", meta: {} },
          { status: 400 }
        );
      }
      const max = Math.min(Math.max(parseInt(String(body.maxIterations ?? 3), 10) || 3, 1), 5);
      const run = await startBucle(body.prompt, max);
      return NextResponse.json({ success: true, data: run, error: null, meta: { epoch: Math.floor(Date.now() / 1000) } });
    }
    if (body.action === "continue") {
      const run = await continueBucle();
      if (!run) {
        return NextResponse.json(
          { success: false, data: null, error: "No hay runs PAUSED para reanudar. Arranca uno: bucle <prompt>", meta: {} },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: run, error: null, meta: { epoch: Math.floor(Date.now() / 1000) } });
    }
    return NextResponse.json(
      { success: false, data: null, error: 'Acción no soportada. Usar: { action: "start", prompt } | { action: "continue" }', meta: {} },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error ejecutando el bucle",
        meta: {},
      },
      { status: 500 }
    );
  }
}
