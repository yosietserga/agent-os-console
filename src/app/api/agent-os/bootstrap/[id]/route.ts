// GET /api/agent-os/bootstrap/[id] — estado + árbol de archivos del run.
//   ?path=<ruta> devuelve el contenido de un archivo (preview on-demand).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { BootstrapRunDTO, BootstrapSpec, ResearchItem } from "@/lib/agent-os/bootstrap/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const run = await db.bootstrapRun.findUnique({ where: { id } });
    if (!run) {
      return NextResponse.json(
        { success: false, data: null, error: "Instanciación no encontrada", meta: {} },
        { status: 404 }
      );
    }

    // Preview de un archivo concreto
    const path = req.nextUrl.searchParams.get("path");
    if (path) {
      const file = await db.bootstrapFile.findUnique({ where: { runId_path: { runId: id, path } } });
      if (!file) {
        return NextResponse.json(
          { success: false, data: null, error: `Archivo no encontrado: ${path}`, meta: {} },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { path: file.path, content: file.content, bytes: file.bytes, origin: file.origin },
        error: null,
        meta: {},
      });
    }

    const files = await db.bootstrapFile.findMany({
      where: { runId: id },
      orderBy: { createdAt: "asc" },
      select: { path: true, bytes: true, origin: true, phase: true },
    });

    const spec: BootstrapSpec | null = run.specJson
      ? (() => {
          try {
            return JSON.parse(run.specJson) as BootstrapSpec;
          } catch {
            return null;
          }
        })()
      : null;

    const research: ResearchItem[] | null = run.researchJson
      ? (() => {
          try {
            return JSON.parse(run.researchJson) as ResearchItem[];
          } catch {
            return null;
          }
        })()
      : null;

    const data: BootstrapRunDTO = {
      id: run.id,
      prompt: run.prompt,
      projectName: run.projectName,
      slug: run.slug,
      status: run.status,
      progress: run.progress,
      phaseDetail: run.phaseDetail,
      fileCount: run.fileCount,
      llmCalls: run.llmCalls,
      durationMs: run.durationMs,
      error: run.error,
      createdAt: run.createdAt.toISOString(),
      spec,
      research,
      files,
    };

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
        error: error instanceof Error ? error.message : "Error consultando la instanciación",
        meta: {},
      },
      { status: 500 }
    );
  }
}
