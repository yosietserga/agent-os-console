"use client";

// ════════════════════════════════════════════════════════════════════════
// radiografia-panel.tsx — Pipeline de Radiografía Rayos X (comando 17)
// Input URL → 5 fases: branding → DOM/3D → modelo de negocio →
// reconstrucción → verificación. Muestra hallazgos estructurados.
// AP-032 (fix): el POST ya NO espera el pipeline completo (25-40s — el
// gateway del preview lo cortaba con HTML 504). Ahora lanza en background y
// este panel hace polling GET /radiografia?id= cada 2s mostrando las fases
// en vivo. También auto-polea runs RUNNING lanzados desde la consola (rayos-x).
// ════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScanLine, Globe, Palette, Box, Briefcase, Blocks, BadgeCheck,
  Loader2, Check, X, ChevronRight, Layers, Type, Ruler, ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GlowingCtaButton } from "./glowing-cta-button";
import type { CtaState } from "./glowing-cta-button";
import { cn } from "@/lib/utils";
import { startRadiografiaClient, getRadiografiaRunClient } from "@/lib/agent-os/client";
import type { RadiografiaRunDTO } from "@/lib/agent-os/types";

interface RadiografiaPanelProps {
  runs: RadiografiaRunDTO[];
  onCompleted?: () => void;
}

const PHASE_ICONS = [Palette, Box, Briefcase, Blocks, BadgeCheck];
const POLL_INTERVAL_MS = 2000;

export function RadiografiaPanel({ runs, onCompleted }: RadiografiaPanelProps) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<CtaState>("disabled");
  const [activeRun, setActiveRun] = useState<RadiografiaRunDTO | null>(runs[0] ?? null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<string | null>(null);
  const onCompletedRef = useRef(onCompleted);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  const canRun = url.trim().length > 3 && state !== "loading";
  const ctaState: CtaState = state === "loading" ? "loading" : canRun ? "ready" : "disabled";

  // Polling del run: consulta cada 2s hasta COMPLETED/FAILED. Todos los
  // setState ocurren dentro de callbacks de timer (nunca síncronos en el
  // cuerpo de un effect — regla react-hooks/set-state-in-effect).
  const pollRun = useCallback((runId: string) => {
    if (pollRef.current === runId) return;
    pollRef.current = runId;
    const tick = async () => {
      if (pollRef.current !== runId) return;
      const run = await getRadiografiaRunClient(runId);
      if (!run || pollRef.current !== runId) return;
      setActiveRun(run);
      if (run.status === "RUNNING") {
        setState("loading");
        setTimeout(tick, POLL_INTERVAL_MS);
      } else {
        pollRef.current = null;
        if (run.status === "COMPLETED") {
          setState("success");
          setTimeout(() => setState("disabled"), 2600);
        } else {
          setError("El pipeline falló — revisa la fase marcada en rojo");
          setState("error");
          setTimeout(() => setState("disabled"), 3600);
        }
        onCompletedRef.current?.();
      }
    };
    setTimeout(tick, 300);
  }, []);

  // Auto-polling de runs RUNNING lanzados desde la consola (rayos-x <url>):
  // el effect solo ARRANCA el polling (efecto externo); las actualizaciones
  // de estado las hace el primer tick a los 300ms.
  useEffect(() => {
    const newest = runs[0];
    if (newest && newest.status === "RUNNING") pollRun(newest.id);
  }, [runs, pollRun]);

  // Limpieza al desmontar
  useEffect(() => () => { pollRef.current = null; }, []);

  async function run() {
    if (!canRun) return;
    setState("loading");
    setError(null);
    const launched = await startRadiografiaClient(url.trim());
    if (!launched.ok) {
      setError(launched.error);
      setState("error");
      setTimeout(() => setState("disabled"), 3200);
      return;
    }
    setActiveRun(launched.run);
    pollRun(launched.run.id);
  }

  return (
    <div className="space-y-4">
      {/* Runner */}
      <section data-tour="radiografia" aria-label="Radiografía de ingeniería inversa" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
          <ScanLine className="size-4 text-[#0071e3]" aria-hidden="true" />
          Radiografía Rayos X — Ingeniería Inversa Integral
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[#86868b]">
          Colorea, branding, animaciones, DOM, shaders 3D y modelo de negocio del objetivo →
          especificación canónica lista para compilación. Equivalente a:
          <code className="ml-1 font-mono text-[10px] text-[#0071e3]">
            lee AGENTS.md, ejecuta: cold run reverse-engineer &lt;url&gt;
          </code>
        </p>
        <form
          className="mt-4 flex flex-col gap-2.5 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#86868b]" aria-hidden="true" />
            <label htmlFor="xray-url" className="sr-only">URL objetivo</label>
            <Input
              id="xray-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://url-objetivo.com"
              className="h-11 rounded-full border-[#d2d2d7] bg-white pl-10 text-sm"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <GlowingCtaButton
            ctaState={ctaState}
            disabled={!canRun}
            onClick={run}
            type="submit"
            icon={<ScanLine className="size-4" aria-hidden="true" />}
            aria-label="Ejecutar radiografía de 5 fases"
          >
            {state === "loading" ? "Radiografiando..." : state === "success" ? "Completada" : state === "error" ? "Falló — reintentar" : "Radiografiar"}
          </GlowingCtaButton>
        </form>
        {error && <p className="mt-2 text-[11px] text-[#d70015]" role="alert">{error}</p>}
      </section>

      {/* Historial de runs */}
      {runs.length > 0 && (
        <section aria-label="Runs de radiografía" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Runs ({runs.length})</h3>
          <div className="os-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
            {runs.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRun(r)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-left transition-colors",
                  activeRun?.id === r.id
                    ? "border-[#0071e3]/50 bg-[#f0f7ff]"
                    : "border-[#e5e5ea] bg-white hover:border-[#d2d2d7]"
                )}
              >
                <p className="max-w-44 truncate font-mono text-[10px] font-semibold text-[#1d1d1f]">
                  {r.targetTitle ?? r.targetUrl}
                </p>
                <p className="mt-0.5 font-mono text-[9px] text-[#86868b]">
                  {r.status} · fase {r.phase}/5
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Detalle del run activo */}
      {activeRun && (
        <div className="space-y-4">
          {/* Fases */}
          <section aria-label="Fases del pipeline" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#1d1d1f]">
                Pipeline — <span className="font-mono text-xs text-[#86868b]">{activeRun.targetUrl}</span>
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "h-6 border font-mono text-[10px]",
                  activeRun.status === "COMPLETED" ? "border-[#34c759]/40 bg-[#34c759]/10 text-[#248a3d]"
                    : activeRun.status === "FAILED" ? "border-[#ff3b30]/40 bg-[#ff3b30]/10 text-[#d70015]"
                    : "border-[#0071e3]/40 bg-[#0071e3]/10 text-[#0071e3]"
                )}
              >
                {activeRun.status}
              </Badge>
            </div>
            <ol className="mt-4 space-y-0">
              {activeRun.phases.map((p, i) => {
                const Icon = PHASE_ICONS[i] ?? Palette;
                return (
                  <li key={p.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < activeRun.phases.length - 1 && (
                      <span className="absolute left-[13px] top-8 h-[calc(100%-24px)] w-px bg-[#e5e5ea]" aria-hidden="true" />
                    )}
                    <span
                      className={cn(
                        "z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
                        p.status === "DONE" ? "bg-[#34c759] text-white"
                          : p.status === "RUNNING" ? "bg-[#0071e3] text-white"
                          : p.status === "FAILED" ? "bg-[#ff3b30] text-white"
                          : "bg-[#e5e5ea] text-[#86868b]"
                      )}
                      aria-hidden="true"
                    >
                      {p.status === "DONE" ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1d1d1f]">
                        Fase {p.id} — {p.name}
                      </p>
                      {p.detail && (
                        <p className="mt-0.5 break-words font-mono text-[10px] leading-relaxed text-[#86868b]">
                          {p.detail}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Brand tokens */}
          {activeRun.brandTokens && (
            <section aria-label="Tokens de branding extraídos" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                <Palette className="size-4 text-[#0071e3]" aria-hidden="true" />
                Fase 1 — Branding & Tokens
              </h3>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">Paleta detectada</p>
                  <ul className="mt-2 space-y-1.5">
                    {activeRun.brandTokens.palette.map((c, i) => (
                      <li key={`${c.token}-${i}`} className="flex items-center gap-2.5 rounded-lg bg-[#f5f5f7] px-2.5 py-2">
                        <span
                          className="size-7 shrink-0 rounded-lg border border-black/10"
                          style={{ backgroundColor: c.hex }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] font-bold text-[#1d1d1f]">{c.hex}</p>
                          <p className="truncate text-[10px] text-[#86868b]">{c.token} · {c.usage}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">
                      <Type className="size-3" aria-hidden="true" /> Tipografía
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {activeRun.brandTokens.typography.map((t, i) => (
                        <li key={i} className="rounded-lg bg-[#f5f5f7] px-2.5 py-1.5 font-mono text-[10px] text-[#4b4b50]">
                          {t.element}: {t.family} · w{t.weight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[#f5f5f7] px-2.5 py-2">
                      <p className="flex items-center gap-1 text-[10px] font-semibold text-[#86868b]">
                        <Ruler className="size-3" aria-hidden="true" /> Radius
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-[#1d1d1f]">{activeRun.brandTokens.borderRadius}</p>
                    </div>
                    <div className="rounded-lg bg-[#f5f5f7] px-2.5 py-2">
                      <p className="flex items-center gap-1 text-[10px] font-semibold text-[#86868b]">
                        <Layers className="size-3" aria-hidden="true" /> Espaciado
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-[#1d1d1f]">{activeRun.brandTokens.spacing}</p>
                    </div>
                  </div>
                  {activeRun.brandTokens.layoutPositions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">Posiciones canónicas</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {activeRun.brandTokens.layoutPositions.map((pos, i) => (
                          <span key={i} className="rounded-full bg-[#0071e3]/10 px-2 py-0.5 font-mono text-[9px] font-medium text-[#0071e3]">
                            {pos}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Modelo de negocio */}
          {activeRun.businessModel && (
            <section aria-label="Radiografía del modelo de negocio" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                <Briefcase className="size-4 text-[#0071e3]" aria-hidden="true" />
                Fase 3 — Modelo de Negocio
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f5f5f7] px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">Oferta</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-[#1d1d1f]">{activeRun.businessModel.offer}</p>
                </div>
                <div className="rounded-xl bg-[#f5f5f7] px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">Pricing</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-[#0071e3]">{activeRun.businessModel.pricingModel}</p>
                </div>
              </div>
              {activeRun.businessModel.plans.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {activeRun.businessModel.plans.map((p, i) => (
                    <div key={i} className="rounded-xl border border-[#e5e5ea] px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-[#1d1d1f]">{p.name}</p>
                      <p className="font-mono text-xs font-bold text-[#0071e3]">{p.price}</p>
                      <ul className="mt-1 space-y-0.5">
                        {p.features.slice(0, 4).map((f, j) => (
                          <li key={j} className="flex items-start gap-1 text-[10px] text-[#86868b]">
                            <ChevronRight className="mt-0.5 size-2.5 shrink-0 text-[#d2d2d7]" aria-hidden="true" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              {activeRun.businessModel.porterHighlights.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">5 Fuerzas de Porter</p>
                  <ul className="mt-1.5 space-y-1">
                    {activeRun.businessModel.porterHighlights.map((ph, i) => (
                      <li key={i} className="rounded-lg bg-[#fafafc] px-3 py-1.5 text-[11px] leading-relaxed text-[#4b4b50]">
                        {ph}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Reconstrucción */}
          {activeRun.reconstruction && (
            <section aria-label="Especificación de reconstrucción" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                <Blocks className="size-4 text-[#0071e3]" aria-hidden="true" />
                Fase 4 — Reconstrucción Modular
              </h3>
              <div className={cn(
                "mt-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5",
                activeRun.reconstruction.threeJs.detected ? "bg-[#af52de]/8" : "bg-[#f5f5f7]"
              )}>
                <Box className={cn("size-4", activeRun.reconstruction.threeJs.detected ? "text-[#8944ab]" : "text-[#86868b]")} aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-semibold text-[#1d1d1f]">
                    Three.js / WebGL: {activeRun.reconstruction.threeJs.detected ? "detectado" : "no detectado"}
                  </p>
                  <p className="text-[10px] text-[#86868b]">{activeRun.reconstruction.threeJs.evidence}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {activeRun.reconstruction.components.map((c, i) => (
                  <div key={i} className="rounded-xl border border-[#e5e5ea] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[11px] font-semibold text-[#1d1d1f]">{c.name}</p>
                      <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[9px] font-medium text-[#86868b]">{c.type}</span>
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-[#86868b]">{c.notes}</p>
                  </div>
                ))}
              </div>
              {activeRun.reconstruction.normalizedTokens.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">Tokens normalizados Apple Light</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {activeRun.reconstruction.normalizedTokens.map((t, i) => (
                      <span key={i} className="rounded-full bg-[#1d1d1f]/5 px-2.5 py-1 font-mono text-[9px] text-[#4b4b50]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Verificación */}
          {activeRun.verification && (
            <section aria-label="Verificación y validación" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                  <BadgeCheck className="size-4 text-[#0071e3]" aria-hidden="true" />
                  Fase 5 — Verificación
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-6 border font-mono text-[10px]",
                    activeRun.verification.verdict === "AGREE" ? "border-[#34c759]/40 bg-[#34c759]/10 text-[#248a3d]"
                      : activeRun.verification.verdict === "DISAGREE" ? "border-[#ff3b30]/40 bg-[#ff3b30]/10 text-[#d70015]"
                      : "border-[#ff9f0a]/40 bg-[#ff9f0a]/10 text-[#b25000]"
                  )}
                >
                  {activeRun.verification.verdict}
                </Badge>
              </div>
              <ul className="mt-3 space-y-1">
                {activeRun.verification.criteria.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-[#f5f5f7] px-3 py-2">
                    {c.result === "PASS" ? (
                      <Check className="size-3.5 shrink-0 text-[#248a3d]" aria-hidden="true" />
                    ) : c.result === "FAIL" ? (
                      <X className="size-3.5 shrink-0 text-[#d70015]" aria-hidden="true" />
                    ) : (
                      <Loader2 className="size-3.5 shrink-0 text-[#b25000]" aria-hidden="true" />
                    )}
                    <span className="text-[11px] text-[#4b4b50]">{c.name}</span>
                    <span className="ml-auto font-mono text-[9px] font-semibold text-[#86868b]">{c.result}</span>
                  </li>
                ))}
              </ul>
              {activeRun.verification.weaknesses.length > 0 && (
                <div className="mt-3 rounded-xl border border-[#ff9f0a]/30 bg-[#ff9f0a]/5 px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#b25000]">
                    Auto-crítica Modo A (P13)
                  </p>
                  <ul className="mt-1 space-y-1">
                    {activeRun.verification.weaknesses.map((w, i) => (
                      <li key={i} className="text-[11px] leading-relaxed text-[#7a5c2e]">
                        {i + 1}. {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activeRun.summary && (
                <p className="mt-3 border-t border-[#e5e5ea] pt-3 text-xs leading-relaxed text-[#4b4b50]">
                  {activeRun.summary}
                </p>
              )}
              {activeRun.tokensUsed > 0 && (
                <p className="mt-2 flex items-center gap-1 font-mono text-[10px] text-[#86868b]">
                  <ArrowRight className="size-3" aria-hidden="true" />
                  {activeRun.tokensUsed.toLocaleString("es-VE")} tokens auditados en l2_cost_token_ledger
                </p>
              )}
            </section>
          )}
        </div>
      )}

      {runs.length === 0 && !activeRun && (
        <section className="rounded-2xl border border-dashed border-[#d2d2d7] bg-white p-10 text-center">
          <ScanLine className="mx-auto size-10 text-[#d2d2d7]" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-[#1d1d1f]">Sin radiografías aún</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#86868b]">
            Introduce una URL objetivo y ejecuta el pipeline de 5 fases para extraer branding,
            DOM, shaders 3D y modelo de negocio.
          </p>
        </section>
      )}
    </div>
  );
}
