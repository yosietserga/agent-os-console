"use client";

// ════════════════════════════════════════════════════════════════════════
// mejorate-panel.tsx — Panel del comando `mejorate` (Auto-Improvement Loop)
// Muestra: scans ejecutados, catálogo de 10 repos (datos reales GitHub API),
// patrones extraídos y acceso al synthesize vía consola o botón.
// ════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  RefreshCw, Star, GitBranch, Folder, FileCode2, Sparkles, ScanSearch,
  Github, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowingCtaButton } from "./glowing-cta-button";
import type { CtaState } from "./glowing-cta-button";
import { cn } from "@/lib/utils";
import type {
  ReferenceRepoDTO, ScanRunDTO, ExtractedPatternDTO,
} from "@/lib/agent-os/types";

const CATEGORY_LABEL: Record<string, string> = {
  "extraccion-estructural": "Extracción Estructural",
  "inspeccion-tecnica": "Inspección Técnica",
  "replicacion-visual": "Replicación Visual",
  "agent-skills": "Agent Skills",
  "modelo-negocio": "Modelo de Negocio",
};

interface MejoratePanelProps {
  repos: ReferenceRepoDTO[];
  scans: ScanRunDTO[];
  patterns: ExtractedPatternDTO[];
  onSynthesize: (cta: CtaState) => void;
  synthesizeState: CtaState;
}

export function MejoratePanel({ repos, scans, patterns, onSynthesize, synthesizeState }: MejoratePanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const totalStars = repos.reduce((a, r) => a + r.stars, 0);
  const lastScan = scans.find((s) => s.mode === "scan");

  return (
    <div className="space-y-5">
      {/* Resumen del último scan */}
      <section data-tour="mejorate" aria-label="Estado del comando mejorate" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
              <Sparkles className="size-4 text-[#0071e3]" aria-hidden="true" />
              mejorate — Auto-Improvement Loop
            </h3>
            <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-[#86868b]">
              Escaneo read-only de repos de referencia vía GitHub API → extracción de patrones
              agénticos → adoptions propuestas vía PRE-v2.0. El sistema se auto-mejora sin
              intervención del operador.
            </p>
          </div>
          <GlowingCtaButton
            ctaState={synthesizeState}
            onClick={() => onSynthesize(synthesizeState === "ready" ? "loading" : synthesizeState)}
            icon={<RefreshCw className="size-4" aria-hidden="true" />}
            aria-label="Ejecutar mejorate completo: scan y synthesize"
          >
            {synthesizeState === "loading" ? "Escaneando..." : "Ejecutar mejorate"}
          </GlowingCtaButton>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-[#f5f5f7] px-3 py-2.5">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-[#86868b]">Repos</dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold text-[#1d1d1f]">{repos.length}</dd>
          </div>
          <div className="rounded-xl bg-[#f5f5f7] px-3 py-2.5">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-[#86868b]">Stars totales</dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold text-[#1d1d1f]">
              {totalStars.toLocaleString("es-VE")}
            </dd>
          </div>
          <div className="rounded-xl bg-[#f5f5f7] px-3 py-2.5">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-[#86868b]">Patrones</dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold text-[#1d1d1f]">{patterns.length}</dd>
          </div>
          <div className="rounded-xl bg-[#f5f5f7] px-3 py-2.5">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-[#86868b]">Último scan</dt>
            <dd className="mt-0.5 font-mono text-sm font-semibold text-[#1d1d1f]">
              {lastScan
                ? new Date(lastScan.startedAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Catálogo de repos (datos reales del scan) */}
      <section aria-label="Catálogo de repositorios de referencia" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
          <ScanSearch className="size-4 text-[#0071e3]" aria-hidden="true" />
          Repos de Referencia — Radiografía de Ingeniería Inversa
        </h3>
        <p className="mt-1 text-xs text-[#86868b]">
          Datos en vivo desde GitHub API (read-only). Toca un repo para ver su estructura agéntica.
        </p>
        <div className="os-scroll mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {repos.map((repo) => {
            const isOpen = expanded === repo.id;
            return (
              <article
                key={repo.id}
                className={cn(
                  "rounded-xl border transition-all duration-200",
                  isOpen ? "border-[#0071e3]/40 bg-[#f8fbff]" : "border-[#e5e5ea] bg-white hover:border-[#d2d2d7]"
                )}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : repo.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <Github className="size-4 shrink-0 text-[#86868b]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-mono text-xs font-semibold text-[#1d1d1f]">{repo.repo}</span>
                      <Badge variant="outline" className="h-5 border-[#d2d2d7] bg-[#f5f5f7] px-1.5 text-[9px] font-medium text-[#86868b]">
                        {CATEGORY_LABEL[repo.category] ?? repo.category}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-[#86868b]">{repo.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 font-mono text-[11px] text-[#86868b]">
                    <span className="hidden items-center gap-1 sm:flex" aria-label={`${repo.stars} estrellas`}>
                      <Star className="size-3.5 text-[#ff9f0a]" aria-hidden="true" />
                      {repo.stars.toLocaleString("es-VE")}
                    </span>
                    <ArrowUpRight
                      className={cn("size-4 transition-transform duration-200", isOpen && "rotate-90 text-[#0071e3]")}
                      aria-hidden="true"
                    />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[#e5e5ea] px-4 py-3">
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-[#4b4b50] sm:grid-cols-4">
                      <span className="flex items-center gap-1.5">
                        <GitBranch className="size-3 text-[#86868b]" aria-hidden="true" /> {repo.branch}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileCode2 className="size-3 text-[#86868b]" aria-hidden="true" /> {repo.language ?? "—"} · {Math.round(repo.sizeKb / 1024)}MB
                      </span>
                      <span className="col-span-2 flex items-center gap-1.5">
                        <Folder className="size-3 text-[#86868b]" aria-hidden="true" />
                        <span className="truncate">{repo.topDirs.slice(0, 8).join(" · ")}</span>
                      </span>
                    </div>
                    {repo.keyFiles.length > 0 && (
                      <div className="mt-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">
                          Archivos agénticos clave
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {repo.keyFiles.slice(0, 6).map((f) => (
                            <li key={f.path} className="truncate font-mono text-[10px] text-[#0071e3]">
                              {f.path}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="mt-2.5 text-[11px] leading-relaxed text-[#4b4b50]">
                      <span className="font-semibold text-[#1d1d1f]">Integración:</span> {repo.role}
                    </p>
                    <a
                      href={`https://github.com/${repo.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#0071e3] hover:underline"
                    >
                      Ver en GitHub <ArrowUpRight className="size-3" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Patrones extraídos */}
      <section aria-label="Patrones agénticos extraídos" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
          <Sparkles className="size-4 text-[#0071e3]" aria-hidden="true" />
          Patrones Extraídos ({patterns.length})
        </h3>
        <div className="os-scroll mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          {patterns.length === 0 && (
            <p className="text-xs text-[#86868b]">Sin patrones aún. Ejecuta: mejororate synthesize</p>
          )}
          {patterns.map((p) => (
            <div key={p.id} className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-semibold text-[#0071e3]">{p.repo}</span>
                <Badge variant="outline" className="h-5 border-[#d2d2d7] bg-white px-1.5 text-[9px] text-[#86868b]">
                  {p.category}
                </Badge>
              </div>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#1d1d1f]">{p.pattern}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#86868b]">{p.evidence}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
