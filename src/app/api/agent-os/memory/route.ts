// POST /api/agent-os/memory — Anexar entrada a la memoria empírica (P9 append-only)
// Body: { type, title, content, winClass?, severity? }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["ANTI_PATTERN", "WIN", "WORKLOG", "FEEDBACK", "USER", "PROJECT", "REFERENCE"] as const;
type ValidType = (typeof VALID_TYPES)[number];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      type?: string;
      title?: string;
      content?: string;
      winClass?: string;
      severity?: string;
    };
    const type = (body.type ?? "").toUpperCase() as ValidType;
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, data: null, error: `type inválido. Válidos: ${VALID_TYPES.join(", ")}`, meta: {} },
        { status: 400 }
      );
    }
    const title = (body.title ?? "").trim();
    const content = (body.content ?? "").trim();
    if (!title || !content) {
      return NextResponse.json(
        { success: false, data: null, error: "title y content son obligatorios", meta: {} },
        { status: 400 }
      );
    }

    // P9: código secuencial por tipo (append-only, sin reescritura)
    let code: string | null = null;
    if (type === "ANTI_PATTERN" || type === "WIN") {
      const count = await db.memoryEntry.count({ where: { type } });
      const prefix = type === "ANTI_PATTERN" ? "AP" : "WIN";
      code = `${prefix}-${String(count + 1).padStart(3, "0")}`;
    }

    const entry = await db.memoryEntry.create({
      data: {
        type,
        code,
        title: title.slice(0, 160),
        content: content.slice(0, 2000),
        winClass: type === "WIN" ? (body.winClass ?? "W1").slice(0, 4) : null,
        severity: type === "ANTI_PATTERN" ? (body.severity ?? "MEDIA").slice(0, 10) : null,
        epoch: Math.floor(Date.now() / 1000),
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...entry, createdAt: entry.createdAt.toISOString() },
      error: null,
      meta: { appendOnly: "P9", code },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error anexando memoria",
        meta: {},
      },
      { status: 500 }
    );
  }
}
