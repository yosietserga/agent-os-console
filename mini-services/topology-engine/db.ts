// Read-only access to the real Agent OS SQLite database.
// The visualizer NEVER writes: it observes the live system state.

import { Database } from "bun:sqlite";

const DB_PATH = process.env.AGENT_OS_DB_PATH || "/home/z/my-project/db/custom.db";

let db: Database | null = null;

function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    db.exec("PRAGMA query_only = true;");
  }
  return db;
}

export interface CommandErrorRow {
  id: string;
  command: string;
  args: string | null;
  output: string;
  status: string;
  durationMs: number;
  createdAt: string;
}

export interface FindingRow {
  id: string;
  sourceRef: string;
  source: string;
  severity: string;
  title: string;
  status: string;
  detectedAt: string;
}

export interface MemoryRow {
  code: string | null;
  type: string;
  title: string;
  content: string;
}

export interface SnapshotData {
  recentErrors: CommandErrorRow[];
  budgetViolations: CommandErrorRow[];
  findings: FindingRow[];
  findingsOpen: number;
  findingsResolved: number;
  findingsTotal: number;
  cyclesCompleted: number;
  cyclesRunning: number;
  memoryAp: number;
  memoryWin: number;
  memoryTotal: number;
  ledgerEntries: number;
  ledgerErrors: number;
  reports: number;
  commandsTotal: number;
  dbBytes: number;
}

export function readSnapshot(): SnapshotData {
  const d = getDb();
  const q = <T>(sql: string, ...params: unknown[]): T[] =>
    d.query(sql).all(...params) as T[];

  const recentErrors = q<CommandErrorRow>(
    `SELECT id, command, args, substr(output, 1, 300) AS output, status, durationMs, createdAt FROM CommandLog
     WHERE status = 'ERROR' ORDER BY createdAt DESC LIMIT 6`
  );
  const budgetViolations = q<CommandErrorRow>(
    `SELECT id, command, args, substr(output, 1, 300) AS output, status, durationMs, createdAt FROM CommandLog
     WHERE durationMs > 25000 ORDER BY createdAt DESC LIMIT 4`
  );
  const findings = q<FindingRow>(
    `SELECT id, sourceRef, source, severity, title, status, detectedAt FROM Finding
     ORDER BY detectedAt DESC LIMIT 14`
  );
  const findingsOpen = (
    q<{ n: number }>(
      `SELECT COUNT(*) as n FROM Finding WHERE status IN ('DETECTED','ANALYZED','CORRECTED','VERIFIED')`
    )[0] ?? { n: 0 }
  ).n;
  const findingsResolved = (
    q<{ n: number }>(
      `SELECT COUNT(*) as n FROM Finding WHERE status IN ('RESOLVED','NO_DEFECT')`
    )[0] ?? { n: 0 }
  ).n;
  const findingsTotal = (q<{ n: number }>(`SELECT COUNT(*) as n FROM Finding`)[0] ?? { n: 0 }).n;
  const cyclesCompleted = (
    q<{ n: number }>(`SELECT COUNT(*) as n FROM CycleRun WHERE status = 'COMPLETED'`)[0] ?? { n: 0 }
  ).n;
  const cyclesRunning = (
    q<{ n: number }>(`SELECT COUNT(*) as n FROM CycleRun WHERE status = 'RUNNING'`)[0] ?? { n: 0 }
  ).n;
  const memoryAp = (
    q<{ n: number }>(`SELECT COUNT(*) as n FROM MemoryEntry WHERE type = 'ANTI_PATTERN'`)[0] ?? { n: 0 }
  ).n;
  const memoryWin = (
    q<{ n: number }>(`SELECT COUNT(*) as n FROM MemoryEntry WHERE type = 'WIN'`)[0] ?? { n: 0 }
  ).n;
  const memoryTotal = (q<{ n: number }>(`SELECT COUNT(*) as n FROM MemoryEntry`)[0] ?? { n: 0 }).n;
  const ledgerEntries = (
    q<{ n: number }>(`SELECT COUNT(*) as n FROM CostLedgerEntry`)[0] ?? { n: 0 }
  ).n;
  const ledgerErrors = (
    q<{ n: number }>(`SELECT COUNT(*) as n FROM CostLedgerEntry WHERE outcome = 'ERROR'`)[0] ?? { n: 0 }
  ).n;
  const reports = (q<{ n: number }>(`SELECT COUNT(*) as n FROM Report`)[0] ?? { n: 0 }).n;
  const commandsTotal = (q<{ n: number }>(`SELECT COUNT(*) as n FROM CommandLog`)[0] ?? { n: 0 }).n;
  const dbBytes = (q<{ n: number }>(`SELECT page_count * page_size AS n FROM pragma_page_count(), pragma_page_size()`)[0] ?? { n: 0 }).n;

  return {
    recentErrors,
    budgetViolations,
    findings,
    findingsOpen,
    findingsResolved,
    findingsTotal,
    cyclesCompleted,
    cyclesRunning,
    memoryAp,
    memoryWin,
    memoryTotal,
    ledgerEntries,
    ledgerErrors,
    reports,
    commandsTotal,
    dbBytes,
  };
}

export function readRelevantMemory(keywords: string[], limit = 4): MemoryRow[] {
  const d = getDb();
  const rows = d
    .query(
      `SELECT code, type, title, content FROM MemoryEntry
       WHERE type IN ('ANTI_PATTERN','WIN') ORDER BY epoch DESC LIMIT 120`
    )
    .all() as MemoryRow[];
  const scored = rows
    .map((r) => {
      const hay = `${r.title} ${r.content}`.toLowerCase();
      const score = keywords.reduce((a, k) => a + (hay.includes(k) ? 1 : 0), 0);
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((x) => x.r);
}
