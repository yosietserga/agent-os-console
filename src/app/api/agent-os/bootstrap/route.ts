// POST /api/agent-os/bootstrap — { prompt, radiografiaId? } crea un run del
//   Instanciador Zero-Shot (Protocolo 11) y dispara el pipeline en background.
//   Si llega radiografiaId (run de Radiografía Multimodal COMPLETED), el
//   pipeline inyecta su evidencia estructurada en la spec (fase previa).
//   Con radiografía vinculada el prompt puede ser corto (>= 4 chars) o
//   vacío: la semilla se deriva de la síntesis ejecutiva de la radiografía.
// GET  /api/agent-os/bootstrap — historial de runs (últimos 10).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runBootstrapPipeline } from "@/lib/agent-os/bootstrap/pipeline";
import type { BootstrapRunSummary } from "@/lib/agent-os/bootstrap/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { prompt?: unknown; radiografiaId?: unknown };
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const radiografiaId = typeof body.radiografiaId === "string" ? body.radiografiaId.trim() : "";

    let linkedRadiografia: { id: string; summary: string | null; status: string } | null = null;
    if (radiografiaId) {
      linkedRadiografia = await db.radiografiaRun.findUnique({
        where: { id: radiografiaId },
        select: { id: true, summary: true, status: true },
      });
      if (!linkedRadiografia || linkedRadiografia.status !== "COMPLETED") {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: "La radiografía vinculada no existe o no está COMPLETED. Completa la radiografía antes de instanciar.",
            meta: {},
          },
          { status: 400 }
        );
      }
    }

    const minLen = linkedRadiografia ? 0 : 10;
    if (prompt.length < minLen || prompt.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error:
            linkedRadiografia
              ? "El prompt no puede exceder 2000 caracteres (con radiografía puede ir vacío)."
              : "El prompt debe tener entre 10 y 2000 caracteres. Cuéntame qué app deseas crear.",
          meta: {},
        },
        { status: 400 }
      );
    }

    const run = await db.bootstrapRun.create({
      data: { prompt, radiografiaId: linkedRadiografia?.id ?? null },
    });

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
