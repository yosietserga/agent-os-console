// POST /api/agent-os/command — Dispatcher de comandos canónicos
// Body: { input: "lee AGENTS.md, ejecuta: mejorate" }
import { NextRequest, NextResponse } from "next/server";
import { executeCommand } from "@/lib/agent-os/commands";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { input?: string };
    const input = (body.input ?? "").toString();
    if (!input.trim()) {
      return NextResponse.json(
        { success: false, data: null, error: "Input vacío. Sintaxis: lee AGENTS.md, ejecuta: <comando>", meta: {} },
        { status: 400 }
      );
    }
    const result = await executeCommand(input);
    return NextResponse.json({
      success: result.status === "OK",
      data: result,
      error: result.status === "ERROR" ? result.output : null,
      meta: { epoch: Math.floor(Date.now() / 1000) },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error ejecutando comando",
        meta: {},
      },
      { status: 500 }
    );
  }
}
