// ════════════════════════════════════════════════════════════════════════
// github.ts — Mejorate: scan read-only de repos de referencia via GitHub API
// Regla P12: el contenido externo se procesa acotado (capa 2 sanitization)
// AP-032 (fix): scan paralelo con concurrencia limitada (~5s vs 22s secuencial).
// AP-034 (fix workflow): el scan corría SIN token (GITHUB_TOKEN ausente en .env)
// y cada ejecución consumía ~38 requests de la cuota anónima (60/h por IP
// compartida) → a la segunda ejecución por hora, 19×HTTP 403. Ahora:
// token leído EN CADA llamada (no en carga de módulo), pre-flight /rate_limit
// (no consume cuota), captura de x-ratelimit-* en cada respuesta, y circuit
// breaker que omite llamadas destinadas a 403 cuando la cuota está a cero.
// El diagnóstico (auth + cuota) viaja en ScanOutcome para que la salida sea
// honesta (P2) en vez de un muro de errores sin causa raíz.
// ════════════════════════════════════════════════════════════════════════
import { db } from "@/lib/db";
import type { ReferenceRepoDTO } from "./types";

const CONCURRENCY = 6;

// AP-034: lectura del token EN CADA llamada — la const a nivel de módulo
// congelaba el valor al importar y .env incorporado después nunca aplicaba.
function ghToken(): string {
  return process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
}

// Última cuota conocida: se actualiza con los headers x-ratelimit-* de
// CUALQUIER respuesta, incluida la del pre-flight /rate_limit (gratuita).
let lastRate: { remaining: number | null; limit: number | null; reset: number | null } = {
  remaining: null,
  limit: null,
  reset: null,
};

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
  const token = ghToken();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "agent-os-mejorate",
  };
  if (token) headers.Authorization = `token ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  const remaining = Number(res.headers.get("x-ratelimit-remaining"));
  const limit = Number(res.headers.get("x-ratelimit-limit"));
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  if (!Number.isNaN(remaining)) {
    lastRate = {
      remaining,
      limit: Number.isNaN(limit) ? null : limit,
      reset: Number.isNaN(reset) ? null : reset,
    };
  }
  if (!res.ok) return { __error: res.status } as T;
  return (await res.json()) as T;
}

export interface ScanOutcome {
  scanned: number;
  errors: string[];
  totalStars: number;
  scanRunId: string;
  repos: ReferenceRepoDTO[];
  /** AP-034: si el scan lleva token (cuota 5.000/h) o es anónimo (60/h por IP) */
  authUsed: boolean;
  /** AP-034: última cuota observada (pre-flight + respuestas reales) */
  rate: { remaining: number | null; limit: number | null; reset: number | null };
  /** AP-034: tamaño del catálogo — el circuit breaker agrega omisiones en una
   * sola línea de error, así que errors.length NO refleja los repos fallidos */
  catalogTotal: number;
}

export async function scanReferenceRepos(): Promise<ScanOutcome> {
  const catalog = await db.referenceRepo.findMany({ orderBy: { repo: "asc" } });
  const preToken = ghToken();
  const scanRun = await db.scanRun.create({
    data: {
      mode: "scan",
      reposScanned: 0,
      totalStars: 0,
      status: "RUNNING",
      note: `Scan live via GitHub API (mejorate, paralelo x6, ${preToken ? "token" : "anónimo"})`,
    },
  });

  // Pre-flight honesto (P2): /rate_limit NO consume cuota — diagnostica el
  // modo de autenticación y la cuota ANTES de gastar las llamadas del catálogo.
  try {
    await gh<GhMeta>("/rate_limit");
  } catch {
    // best-effort: si la red falla, los errores por-repo lo dirán
  }

  const errors: string[] = [];
  let totalStars = 0;
  let skippedNoQuota = 0;
  const updated: ReferenceRepoDTO[] = [];

  const scanOne = async (entry: (typeof catalog)[number]): Promise<void> => {
    // AP-034 circuit breaker: sin token y cuota anónima a cero → omitir.
    // Lanzar llamadas destinadas a 403 solo quemaba tiempo y ensordecía el error real.
    if (!ghToken() && lastRate.remaining === 0) {
      skippedNoQuota++;
      return;
    }
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

  if (skippedNoQuota > 0) {
    const resetIso = lastRate.reset
      ? new Date(lastRate.reset * 1000).toISOString()
      : "?";
    errors.push(
      `${skippedNoQuota} repos OMITIDOS por circuit breaker — cuota anónima agotada (0/60, reset ${resetIso}); sin GITHUB_TOKEN el scan no puede proceder`
    );
  }

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
    authUsed: preToken.length > 0,
    rate: { ...lastRate },
    catalogTotal: catalog.length,
  };
}
