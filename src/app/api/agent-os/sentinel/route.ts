// GET  /api/agent-os/sentinel — estado del órgano (findings + ciclos + counts)
// POST /api/agent-os/sentinel — { action: "scan" } ejecuta el scan y abre ciclos
import { NextRequest, NextResponse } from "next/server";
import { sentinelScan, getSentinelOverview } from "@/lib/agent-os/sentinel";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const overview = await getSentinelOverview();
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
        error: error instanceof Error ? error.message : "Error obteniendo estado del sentinela",
        meta: {},
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    if (body.action !== "scan") {
      return NextResponse.json(
        { success: false, data: null, error: 'Acción no soportada. Usar: { "action": "scan" }', meta: {} },
        { status: 400 }
      );
    }
    const summary = await sentinelScan("SENTINEL_SCAN");
    const overview = await getSentinelOverview();
    return NextResponse.json({
      success: true,
      data: { summary, overview },
      error: null,
      meta: { epoch: Math.floor(Date.now() / 1000) },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error ejecutando scan del sentinela",
        meta: {},
      },
      { status: 500 }
    );
  }
}
