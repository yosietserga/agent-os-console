"use client";

// ════════════════════════════════════════════════════════════════════════
// repos-gallery.tsx — featuredFooter: galería del catálogo completo de
// repos de referencia de radiografía (datos reales del scan en vivo).
// ════════════════════════════════════════════════════════════════════════

import { Star, Github, Boxes } from "lucide-react";
import type { ReferenceRepoDTO } from "@/lib/agent-os/types";

interface ReposGalleryProps {
  repos: ReferenceRepoDTO[];
}

const CATEGORY_COLOR: Record<string, string> = {
  "extraccion-estructural": "#0071e3",
  "inspeccion-tecnica": "#af52de",
  "replicacion-visual": "#ff9f0a",
  "agent-skills": "#34c759",
  "modelo-negocio": "#ff375f",
  "agent-tooling": "#00c7be",
  "llm-gateway": "#ffcc00",
  "prompt-intelligence": "#ac8e68",
};

export function ReposGallery({ repos }: ReposGalleryProps) {
  const total = repos.reduce((a, r) => a + r.stars, 0);
  return (
    <section data-tour="repos" aria-label="Catálogo de repositorios de referencia" className="rounded-2xl border border-[#e5e5ea] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-[#1d1d1f]">
            <Boxes className="size-4 text-[#0071e3]" aria-hidden="true" />
            Arsenal de Radiografía — {repos.length} Repos Referentes
          </h2>
          <p className="mt-1 text-xs text-[#86868b]">
            Skills, herramientas de extracción profunda y sandboxes agénticos ·{" "}
            <span className="font-mono font-semibold text-[#1d1d1f]">
              {total.toLocaleString("es-VE")}
            </span>{" "}
            estrellas combinadas (scan en vivo vía GitHub API)
          </p>
        </div>
      </div>
      <div className="os-scroll mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {repos.map((repo) => (
          <a
            key={repo.id}
            href={`https://github.com/${repo.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl border border-[#e5e5ea] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d2d2d7] hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ backgroundColor: CATEGORY_COLOR[repo.category] ?? "#86868b" }}
              aria-hidden="true"
            />
            <div className="flex items-center justify-between gap-2">
              <Github className="size-4 text-[#86868b] transition-colors group-hover:text-[#1d1d1f]" aria-hidden="true" />
              <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-[#86868b]">
                <Star className="size-3 text-[#ff9f0a]" aria-hidden="true" />
                {(repo.stars / 1000).toFixed(1)}k
              </span>
            </div>
            <p className="mt-2.5 break-words font-mono text-[11px] font-semibold leading-snug text-[#1d1d1f]">
              {repo.repo.split("/")[1]}
            </p>
            <p className="mt-0.5 font-mono text-[9px] text-[#86868b]">{repo.repo.split("/")[0]} · {repo.language ?? "—"}</p>
            <p className="mt-2 line-clamp-3 text-[10px] leading-relaxed text-[#86868b]">{repo.description}</p>
            <p className="mt-2.5 font-mono text-[9px] font-medium" style={{ color: CATEGORY_COLOR[repo.category] ?? "#86868b" }}>
              {repo.role}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
