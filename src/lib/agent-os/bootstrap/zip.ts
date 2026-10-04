// ════════════════════════════════════════════════════════════════════════
// zip.ts — Empaquetado del scaffold instanciado (JSZip) con MANIFEST.json
// verificable (sha256 por archivo, auditoría de orígenes y stats reales).
// ════════════════════════════════════════════════════════════════════════
import { createHash } from "crypto";
import JSZip from "jszip";

export interface ZipFileEntry {
  path: string;
  content: string;
  bytes: number;
  origin: string;
}

export interface ZipRunMeta {
  prompt: string;
  projectName: string | null;
  slug: string | null;
  llmCalls: number;
  durationMs: number | null;
  createdAt: Date;
}

export async function buildScaffoldZip(
  run: ZipRunMeta,
  files: ZipFileEntry[]
): Promise<{ buffer: Buffer; filename: string; manifest: Record<string, unknown> }> {
  const slug = run.slug || "proyecto-instanciado";
  const zip = new JSZip();
  const root = zip.folder(slug)!;

  const manifest = {
    generator: "agent-os-instanciador (Protocolo 11 — Zero-Shot Project Bootstrap)",
    generatedAt: new Date().toISOString(),
    project: run.projectName,
    slug,
    prompt: run.prompt,
    stats: {
      files: files.length,
      totalBytes: files.reduce((a, f) => a + f.bytes, 0),
      llmGenerated: files.filter((f) => f.origin === "llm").length,
      templated: files.filter((f) => f.origin === "template").length,
      staticUniversal: files.filter((f) => f.origin === "static").length,
      llmCalls: run.llmCalls,
      durationMs: run.durationMs,
    },
    files: files
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((f) => ({
        path: f.path,
        bytes: f.bytes,
        origin: f.origin,
        sha256: createHash("sha256").update(f.content, "utf8").digest("hex").slice(0, 16),
      })),
  };

  for (const f of files) {
    root.file(f.path, f.content);
  }
  root.file("MANIFEST.json", JSON.stringify(manifest, null, 2));

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return { buffer, filename: `agent-os-${slug}.zip`, manifest };
}
