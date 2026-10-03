// POST /api/agent-os/pre — Gobernanza PRE-v2.0
// Body: { action: "evaluate" | "promote", proposalId }
// El Juez es determinista: mismas dimensiones → mismo veredicto.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { judgeProposal } from "@/lib/agent-os/pre-judge";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { action?: string; proposalId?: string };
    const { action, proposalId } = body;
    if (!action || !proposalId) {
      return NextResponse.json(
        { success: false, data: null, error: "action y proposalId son obligatorios", meta: {} },
        { status: 400 }
      );
    }
    const proposal = await db.adoptionProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) {
      return NextResponse.json(
        { success: false, data: null, error: "Propuesta no encontrada", meta: {} },
        { status: 404 }
      );
    }

    if (action === "evaluate") {
      const verdict = judgeProposal(proposal.title, proposal.description, proposal.type);
      const updated = await db.adoptionProposal.update({
        where: { id: proposalId },
        data: {
          status: "EVALUATED",
          d1: verdict.scores.d1, d2: verdict.scores.d2, d3: verdict.scores.d3,
          d4: verdict.scores.d4, d5: verdict.scores.d5, d6: verdict.scores.d6,
          deltaS: verdict.deltaS,
          verdict: verdict.verdict.slice(0, 400),
          evaluatedAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        data: {
          proposal: { ...updated, createdAt: updated.createdAt.toISOString(), evaluatedAt: updated.evaluatedAt?.toISOString() ?? null },
          judge: verdict,
        },
        error: null,
        meta: { deterministic: true, formula: "S = 100 × Σ(wi·Di)" },
      });
    }

    if (action === "promote") {
      // Solo el juez determinista puede promover (rol Optimizador propone, Juez decide)
      const verdict = judgeProposal(proposal.title, proposal.description, proposal.type);
      if (!verdict.promoted) {
        const rejected = await db.adoptionProposal.update({
          where: { id: proposalId },
          data: {
            status: "REJECTED",
            d1: verdict.scores.d1, d2: verdict.scores.d2, d3: verdict.scores.d3,
            d4: verdict.scores.d4, d5: verdict.scores.d5, d6: verdict.scores.d6,
            deltaS: verdict.deltaS, verdict: verdict.verdict.slice(0, 400),
            evaluatedAt: new Date(),
          },
        });
        return NextResponse.json({
          success: false,
          data: { proposal: { ...rejected, createdAt: rejected.createdAt.toISOString(), evaluatedAt: rejected.evaluatedAt?.toISOString() ?? null }, judge: verdict },
          error: `RECHAZADA por el juez: ${verdict.reasons.join("; ") || "ΔS insuficiente"}`,
          meta: { condition: "ΔS ≥ 5.0 ∧ ∀i ΔDi ≥ -2.0 ∧ σ_sum < |ΔS|" },
        });
      }
      const promoted = await db.adoptionProposal.update({
        where: { id: proposalId },
        data: {
          status: "PROMOTED",
          d1: verdict.scores.d1, d2: verdict.scores.d2, d3: verdict.scores.d3,
          d4: verdict.scores.d4, d5: verdict.scores.d5, d6: verdict.scores.d6,
          deltaS: verdict.deltaS, verdict: verdict.verdict.slice(0, 400),
          evaluatedAt: new Date(),
        },
      });
      // Anexar WIN al ledger (P4 sincronización atómica + P9 append-only)
      const winCount = await db.memoryEntry.count({ where: { type: "WIN" } });
      const win = await db.memoryEntry.create({
        data: {
          type: "WIN",
          code: `WIN-${String(winCount + 1).padStart(3, "0")}`,
          title: `Adoption promoted: ${proposal.title.slice(0, 80)}`,
          content: `El juez determinista promovió la adoption "${proposal.title}" (tipo ${proposal.type}, origen ${proposal.origin}) con ΔS ${verdict.deltaS} ≥ 5.0. S=${verdict.s}. W1 Capability Strengthening.`,
          winClass: "W1",
          epoch: Math.floor(Date.now() / 1000),
        },
      });
      return NextResponse.json({
        success: true,
        data: {
          proposal: { ...promoted, createdAt: promoted.createdAt.toISOString(), evaluatedAt: promoted.evaluatedAt?.toISOString() ?? null },
          judge: verdict,
          win: { ...win, createdAt: win.createdAt.toISOString() },
        },
        error: null,
        meta: { condition: "ΔS ≥ 5.0 ∧ ∀i ΔDi ≥ -2.0 ∧ σ_sum < |ΔS|", promoted: true },
      });
    }

    return NextResponse.json(
      { success: false, data: null, error: "action inválido. Válidos: evaluate | promote", meta: {} },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error en PRE cycle",
        meta: {},
      },
      { status: 500 }
    );
  }
}
