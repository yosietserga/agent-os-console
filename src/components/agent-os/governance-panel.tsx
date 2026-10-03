"use client";

// ════════════════════════════════════════════════════════════════════════
// governance-panel.tsx — Gobernanza PRE-v2.0 (3 roles: Ejecutor /
// Optimizador / Juez determinista). Propuestas, D1-D6, ΔS, promover.
// Fórmula: S = 100 × Σ(wi·Di) · Promoción: ΔS ≥ 5.0 ∧ ∀i ΔDi ≥ -2.0
// ════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Scale, Gavel, Wrench, Lightbulb, ArrowRight, Check, X, Loader2, Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdoptionProposalDTO } from "@/lib/agent-os/types";

interface GovernancePanelProps {
  proposals: AdoptionProposalDTO[];
  onChanged?: () => void;
}

const STATUS_STYLE: Record<string, string> = {
  PROPOSED: "bg-[#86868b]/10 text-[#4b4b50]",
  EVALUATED: "bg-[#0071e3]/10 text-[#0071e3]",
  PROMOTED: "bg-[#34c759]/10 text-[#248a3d]",
  REJECTED: "bg-[#ff3b30]/10 text-[#d70015]",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  PROPOSED: Lightbulb,
  EVALUATED: Scale,
  PROMOTED: Check,
  REJECTED: X,
};

const DIMENSIONS = [
  { key: "d1", label: "D1 Compilación/Tipado", weight: "0.20" },
  { key: "d2", label: "D2 Contratos", weight: "0.15" },
  { key: "d3", label: "D3 Pipeline", weight: "0.20" },
  { key: "d4", label: "D4 Casos Ocultos", weight: "0.20" },
  { key: "d5", label: "D5 Tokens", weight: "0.10" },
  { key: "d6", label: "D6 Arquitectura", weight: "0.15" },
] as const;

export function GovernancePanel({ proposals, onChanged }: GovernancePanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function act(proposalId: string, action: "evaluate" | "promote") {
    setBusy(proposalId);
    setError(null);
    try {
      const res = await fetch("/api/agent-os/pre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, proposalId }),
      });
      const json = (await res.json()) as { success: boolean; error: string | null };
      if (action === "promote" && !json.success && json.error) {
        setError(json.error);
      }
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(null);
    }
  }

  const counts = proposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Los 3 roles */}
      <section data-tour="pre" aria-label="Gobernanza PRE-v2.0" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
          <Scale className="size-4 text-[#0071e3]" aria-hidden="true" />
          PRE-v2.0 — Perpetual Rule Evolution
        </h3>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] p-3.5">
            <Wrench className="size-4 text-[#86868b]" aria-hidden="true" />
            <p className="mt-2 text-xs font-semibold text-[#1d1d1f]">1. Ejecutor</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#86868b]">
              Escribe código siguiendo AGENTS.md. Tiene prohibido modificar archivos de reglas.
            </p>
          </div>
          <div className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] p-3.5">
            <Lightbulb className="size-4 text-[#ff9f0a]" aria-hidden="true" />
            <p className="mt-2 text-xs font-semibold text-[#1d1d1f]">2. Optimizador</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#86868b]">
              Propone modificaciones en ramas aisladas <code className="font-mono text-[10px]">pre/propose/*</code> fundamentadas en causa raíz.
            </p>
          </div>
          <div className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] p-3.5">
            <Gavel className="size-4 text-[#0071e3]" aria-hidden="true" />
            <p className="mt-2 text-xs font-semibold text-[#1d1d1f]">3. Juez Determinista</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#86868b]">
              Software sin LLM. Evalúa contra benchmark con S = 100 × Σ(wi·Di). Promueve solo si ΔS ≥ 5.0.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#f5f5f7] px-4 py-3">
          <Sigma className="size-4 text-[#0071e3]" aria-hidden="true" />
          <p className="font-mono text-[11px] text-[#4b4b50]">
            Promoción: ΔS ≥ 5.0 ∧ ∀i ΔDi ≥ -2.0 ∧ (σ_cand + σ_base) &lt; |ΔS|
          </p>
          <div className="ml-auto flex gap-1.5">
            {(["PROPOSED", "EVALUATED", "PROMOTED", "REJECTED"] as const).map((s) => (
              <span key={s} className={cn("rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold", STATUS_STYLE[s])}>
                {s} {counts[s] ?? 0}
              </span>
            ))}
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-[#ff3b30]/8 px-3 py-2 text-[11px] text-[#d70015]" role="alert">
            {error}
          </p>
        )}
      </section>

      {/* Propuestas */}
      <section aria-label="Propuestas de adopción" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h3 className="text-sm font-semibold text-[#1d1d1f]">
          Propuestas de Adoption ({proposals.length})
        </h3>
        <div className="os-scroll mt-4 max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
          {proposals.length === 0 && (
            <p className="py-8 text-center text-xs text-[#86868b]">
              Sin propuestas. Genera con: <code className="font-mono text-[#0071e3]">mejorate</code>
            </p>
          )}
          {proposals.map((p) => {
            const StatusIcon = STATUS_ICON[p.status] ?? Lightbulb;
            const isOpen = expanded === p.id;
            return (
              <article
                key={p.id}
                className={cn(
                  "rounded-xl border transition-all",
                  p.status === "PROMOTED"
                    ? "border-[#34c759]/35 bg-[#f6fcf7]"
                    : p.status === "REJECTED"
                      ? "border-[#e5e5ea] bg-[#fdfbfb] opacity-80"
                      : "border-[#e5e5ea] bg-white hover:border-[#d2d2d7]"
                )}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left"
                >
                  <StatusIcon
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      p.status === "PROMOTED" ? "text-[#248a3d]"
                        : p.status === "REJECTED" ? "text-[#ff3b30]"
                        : p.status === "EVALUATED" ? "text-[#0071e3]" : "text-[#86868b]"
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-semibold text-[#1d1d1f]">{p.title}</h4>
                      <Badge variant="outline" className="h-5 border-[#d2d2d7] bg-[#f5f5f7] px-1.5 font-mono text-[9px] text-[#86868b]">
                        {p.type}
                      </Badge>
                      <span className={cn("rounded-full px-2 py-0.5 font-mono text-[9px] font-bold", STATUS_STYLE[p.status])}>
                        {p.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#86868b]">{p.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-[#86868b]">origen: {p.origin}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {p.deltaS !== null && (
                      <p className={cn(
                        "font-mono text-sm font-bold",
                        p.deltaS >= 5 ? "text-[#248a3d]" : p.deltaS >= 0 ? "text-[#b25000]" : "text-[#ff3b30]"
                      )}>
                        ΔS {p.deltaS > 0 ? "+" : ""}{p.deltaS}
                      </p>
                    )}
                    {p.deltaS === null && <p className="font-mono text-[10px] text-[#86868b]">sin evaluar</p>}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[#e5e5ea] px-4 py-3">
                    {p.d1 !== null && (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {DIMENSIONS.map((d) => {
                          const v = p[d.key] ?? 0;
                          return (
                            <div key={d.key} className="rounded-lg bg-[#f5f5f7] px-2.5 py-2">
                              <div className="flex items-baseline justify-between">
                                <span className="text-[10px] font-medium text-[#4b4b50]">{d.label}</span>
                                <span className="font-mono text-[10px] font-bold text-[#1d1d1f]">{v}</span>
                              </div>
                              <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#e5e5ea]">
                                <div
                                  className={cn("h-full rounded-full", v >= 74 ? "bg-[#34c759]" : v >= 50 ? "bg-[#ff9f0a]" : "bg-[#ff3b30]")}
                                  style={{ width: `${v}%` }}
                                />
                              </div>
                              <p className="mt-0.5 text-right font-mono text-[9px] text-[#86868b]">w={d.weight}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="mt-3 text-[11px] leading-relaxed text-[#4b4b50]">{p.description}</p>
                    {p.verdict && (
                      <p className="mt-2 rounded-lg bg-[#f5f5f7] px-3 py-2 font-mono text-[10px] leading-relaxed text-[#4b4b50]">
                        {p.verdict}
                      </p>
                    )}
                    {(p.status === "PROPOSED" || p.status === "EVALUATED") && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === p.id}
                          onClick={() => act(p.id, "evaluate")}
                          className="h-8 rounded-full border-[#d2d2d7] px-3 text-[11px] text-[#1d1d1f] hover:bg-[#f5f5f7]"
                        >
                          {busy === p.id ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <Scale className="size-3" aria-hidden="true" />}
                          Evaluar
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy === p.id}
                          onClick={() => act(p.id, "promote")}
                          className="h-8 rounded-full bg-[#0071e3] px-3 text-[11px] text-white hover:bg-[#0077ed]"
                        >
                          {busy === p.id ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-3" aria-hidden="true" />}
                          Someter al Juez
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
