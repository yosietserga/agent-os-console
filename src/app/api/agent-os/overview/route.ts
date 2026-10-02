// GET /api/agent-os/overview — Estado completo del Agent OS (envoltorio
// canónico { success, data, error, meta } — Fase 2 del pipeline)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type {
  CardinalRuleDTO, CommandDefDTO, MemoryEntryDTO, ReferenceRepoDTO,
  ScanRunDTO, ExtractedPatternDTO, AdoptionProposalDTO, PsimStateDTO,
  L2ModelDTO, CostLedgerEntryDTO, CommandLogDTO, ReportDTO, OverviewDTO,
} from "@/lib/agent-os/types";
import { listRuns } from "@/lib/agent-os/radiografia";

export const dynamic = "force-dynamic";

function toMemoryDTO(row: {
  id: string; type: string; code: string | null; title: string;
  content: string; winClass: string | null; severity: string | null;
  epoch: number; createdAt: Date;
}): MemoryEntryDTO {
  return { ...row, type: row.type as MemoryEntryDTO["type"], createdAt: row.createdAt.toISOString() };
}

export async function GET() {
  try {
    const [
      rules, commands, antiPatterns, wins, worklog, feedback, project, reference, user,
      repos, scans, patterns, proposals, psim, l2Models, ledger, commandLog, reports,
    ] = await Promise.all([
      db.cardinalRule.findMany({ orderBy: { order: "asc" } }),
      db.commandDef.findMany({ orderBy: { order: "asc" } }),
      db.memoryEntry.findMany({ where: { type: "ANTI_PATTERN" }, orderBy: { code: "asc" } }),
      db.memoryEntry.findMany({ where: { type: "WIN" }, orderBy: { code: "asc" } }),
      db.memoryEntry.findMany({ where: { type: "WORKLOG" }, orderBy: { createdAt: "desc" }, take: 20 }),
      db.memoryEntry.findMany({ where: { type: "FEEDBACK" }, orderBy: { createdAt: "desc" } }),
      db.memoryEntry.findMany({ where: { type: "PROJECT" }, orderBy: { createdAt: "desc" } }),
      db.memoryEntry.findMany({ where: { type: "REFERENCE" }, orderBy: { createdAt: "desc" } }),
      db.memoryEntry.findMany({ where: { type: "USER" }, orderBy: { createdAt: "desc" } }),
      db.referenceRepo.findMany({ orderBy: { stars: "desc" } }),
      db.scanRun.findMany({ orderBy: { startedAt: "desc" }, take: 8 }),
      db.extractedPattern.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      db.adoptionProposal.findMany({ orderBy: { createdAt: "desc" } }),
      db.psimState.findFirst({ orderBy: { updatedAt: "desc" } }),
      db.l2Model.findMany({ orderBy: [{ archetype: "asc" }, { role: "asc" }] }),
      db.costLedgerEntry.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      db.commandLog.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
      db.report.findMany({ orderBy: { epoch: "desc" }, take: 5 }),
    ]);
    const radiografiaRuns = await listRuns();

    const data: OverviewDTO = {
      epoch: Math.floor(Date.now() / 1000),
      rules: rules.map((r) => ({ ...r, severity: r.severity as "RED" | "YELLOW" })) as CardinalRuleDTO[],
      commands: commands as unknown as CommandDefDTO[],
      memory: {
        antiPatterns: antiPatterns.map(toMemoryDTO),
        wins: wins.map(toMemoryDTO),
        worklog: worklog.map(toMemoryDTO),
        feedback: feedback.map(toMemoryDTO),
        project: project.map(toMemoryDTO),
        reference: reference.map(toMemoryDTO),
        user: user.map(toMemoryDTO),
      },
      repos: repos.map((r) => ({
        ...r,
        topics: JSON.parse(r.topics || "[]"),
        topDirs: JSON.parse(r.topDirs || "[]"),
        keyFiles: JSON.parse(r.keyFiles || "[]"),
        lastScannedAt: r.lastScannedAt.toISOString(),
      })) as ReferenceRepoDTO[],
      scans: scans.map((s) => ({
        ...s, startedAt: s.startedAt.toISOString(),
        finishedAt: s.finishedAt ? s.finishedAt.toISOString() : null,
      })) as ScanRunDTO[],
      patterns: patterns.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })) as ExtractedPatternDTO[],
      proposals: proposals.map((p) => ({
        ...p,
        status: p.status as AdoptionProposalDTO["status"],
        createdAt: p.createdAt.toISOString(),
        evaluatedAt: p.evaluatedAt ? p.evaluatedAt.toISOString() : null,
      })) as AdoptionProposalDTO[],
      psim: psim
        ? { ...psim, updatedAt: psim.updatedAt.toISOString() }
        : null,
      l2Models: l2Models.map((m) => ({ ...m, status: m.status as L2ModelDTO["status"] })) as L2ModelDTO[],
      ledger: ledger.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })) as CostLedgerEntryDTO[],
      commandLog: commandLog.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })) as CommandLogDTO[],
      radiografiaRuns,
      reports: reports.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) as ReportDTO[],
    };

    return NextResponse.json({
      success: true,
      data,
      error: null,
      meta: { epoch: data.epoch, version: psim?.version ?? "1.6.0" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Error obteniendo overview",
        meta: { epoch: Math.floor(Date.now() / 1000) },
      },
      { status: 500 }
    );
  }
}
