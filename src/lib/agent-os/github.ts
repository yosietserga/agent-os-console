// ════════════════════════════════════════════════════════════════════════
// github.ts — Mejorate: scan read-only de repos de referencia via GitHub API
// Regla P12: el contenido externo se procesa acotado (capa 2 sanitization)
// AP-032 (fix): el scan era secuencial (19 repos × 2 llamadas ≈ 22s) y
// mejorate bare totalizaba ~37s — excedía el timeout del gateway del preview
// y el frontend recibía HTML 504 en vez de JSON. Ahora escanea en paralelo
// con concurrencia limitada (~5s).
// ════════════════════════════════════════════════════════════════════════
import { db } from "@/lib/db";
import type { ReferenceRepoDTO } from "./types";

const TOKEN = process.env.GITHUB_TOKEN ?? "";
const CONCURRENCY = 6;

interface GhMeta {
  full_name?: string;
  stargazers_count?: number;
  size?: number;
  language?: string | null;
  default_branch?: string;
  topics?: string[];
  pushed_at?: string;
  description?: string | null;
  license?: { spdx_id?: string | null } | null;
  __error?: number;
}

interface GhTreeItem {
  path: string;
  type: string;
  size?: number;
}

interface GhTree {
  tree?: GhTreeItem[];
  truncated?: boolean;
  __error?: number;
}

const KEY_PATTERNS = [
  "agents.md", "skills/", "skill.md", ".cursorrules", "claude.md", "gemini.md",
  "system-prompt", "prompt", "personas", "aci", "browser", "dom", "screenshot",
  "vision", "crawl", "scrape", "shader", "webgl", "three", "mcp", "sandbox",
  "planner", "router", "fallback", "circuit", "evaluator", "orchestrat",
  "headless", "devtools", "puppeteer", "playwright",
];

async function gh<T extends GhMeta | GhTree>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "agent-os-mejorate",
  };
  if (TOKEN) headers.Authorization = `token ${TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) return { __error: res.status } as T;
  return (await res.json()) as T;
}

export interface ScanOutcome {
  scanned: number;
  errors: string[];
  totalStars: number;
  scanRunId: string;
  repos: ReferenceRepoDTO[];
}

export async function scanReferenceRepos(): Promise<ScanOutcome> {
  const catalog = await db.referenceRepo.findMany({ orderBy: { repo: "asc" } });
  const scanRun = await db.scanRun.create({
    data: {
      mode: "scan",
      reposScanned: 0,
      totalStars: 0,
      status: "RUNNING",
      note: "Scan live via GitHub API (mejorate, paralelo x6)",
    },
  });

  const errors: string[] = [];
  let totalStars = 0;
  const updated: ReferenceRepoDTO[] = [];

  const scanOne = async (entry: (typeof catalog)[number]): Promise<void> => {
    const meta = await gh<GhMeta>(`/repos/${entry.repo}`);
    if (meta.__error) {
      errors.push(`${entry.repo}: HTTP ${meta.__error}`);
      return;
    }
    const branch = meta.default_branch ?? "main";
    const tree = await gh<GhTree>(
      `/repos/${entry.repo}/git/trees/${branch}?recursive=1`
    );
    let topDirs: string[] = [];
    let keyFiles: { path: string; size: number }[] = [];
    if (!tree.__error && tree.tree) {
      const dirs = new Set<string>();
      for (const t of tree.tree) {
        if (t.type === "tree") dirs.add(t.path.split("/")[0]);
      }
      topDirs = [...dirs].sort().slice(0, 18);
      keyFiles = tree.tree
        .filter(
          (t) =>
            t.type === "blob" &&
            KEY_PATTERNS.some((p) => t.path.toLowerCase().includes(p))
        )
        .slice(0, 12)
        .map((t) => ({ path: t.path, size: t.size ?? 0 }));
    }
    const stars = meta.stargazers_count ?? 0;
    totalStars += stars;

    const row = await db.referenceRepo.update({
      where: { id: entry.id },
      data: {
        stars,
        sizeKb: meta.size ?? entry.sizeKb,
        language: meta.language ?? entry.language,
        branch,
        topics: JSON.stringify(meta.topics ?? []),
        topDirs: JSON.stringify(topDirs.length ? topDirs : JSON.parse(entry.topDirs || "[]")),
        keyFiles: JSON.stringify(keyFiles.length ? keyFiles : JSON.parse(entry.keyFiles || "[]")),
        ghDescription: meta.description ?? null,
        lastScannedAt: new Date(),
      },
    });
    updated.push({
      ...row,
      topics: JSON.parse(row.topics || "[]"),
      topDirs: JSON.parse(row.topDirs || "[]"),
      keyFiles: JSON.parse(row.keyFiles || "[]"),
      lastScannedAt: row.lastScannedAt.toISOString(),
    } as ReferenceRepoDTO);
  };

  // Cola con concurrencia limitada: 19 repos en oleadas de 6 (~5s vs 22s secuencial)
  const queue = [...catalog];
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, Math.max(queue.length, 1)) },
    async () => {
      for (;;) {
        const entry = queue.shift();
        if (!entry) return;
        await scanOne(entry);
      }
    }
  );
  await Promise.all(workers);

  await db.scanRun.update({
    where: { id: scanRun.id },
    data: {
      reposScanned: updated.length,
      totalStars,
      status: errors.length && !updated.length ? "FAILED" : "COMPLETED",
      finishedAt: new Date(),
    },
  });

  return {
    scanned: updated.length,
    errors,
    totalStars,
    scanRunId: scanRun.id,
    repos: updated,
  };
}
