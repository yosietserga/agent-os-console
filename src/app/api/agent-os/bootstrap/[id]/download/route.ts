// GET /api/agent-os/bootstrap/[id]/download — ZIP del scaffold instanciado
// (raíz <slug>/ + MANIFEST.json con sha256 por archivo).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildScaffoldZip } from "@/lib/agent-os/bootstrap/zip";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const run = await db.bootstrapRun.findUnique({ where: { id } });
    if (!run) {
      return NextResponse.json(
        { success: false, data: null, error: "Instanciación no encontrada", meta: {} },
        { status: 404 }
      );
    }
    if (run.status !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: `La instanciación aún no está lista (estado: ${run.status}, ${run.progress}%). Descarga disponible solo al completarse.`,
          meta: {},
        },
        { status: 409 }
      );
    }

    const files = await db.bootstrapFile.findMany({
      where: { runId: id },
      select: { path: true, content: true, bytes: true, origin: true },
    });
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, data: null, error: "El run no contiene archivos", meta: {} },
        { status: 409 }
      );
    }

    const { buffer, filename } = await buildScaffoldZip(
      {
        prompt: run.prompt,
        projectName: run.projectName,
        slug: run.slug,
        llmCalls: run.llmCalls,
        durationMs: run.durationMs,
        createdAt: run.createdAt,
      },
      files
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error generando el ZIP",
        meta: {},
      },
      { status: 500 }
    );
  }
}
