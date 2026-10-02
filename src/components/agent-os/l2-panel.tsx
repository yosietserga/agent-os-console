"use client";

// ════════════════════════════════════════════════════════════════════════
// l2-panel.tsx — Control Plane L2 (P8: aislamiento LLM-agnóstico)
// Registry multi-proveedor, arquetipos con SLA, circuit breakers y
// ledger inmutable de costos (capa 7 P12).
// ════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { Network, Cpu, Zap, ShieldCheck, Receipt, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { L2ModelDTO, CostLedgerEntryDTO } from "@/lib/agent-os/types";

interface L2PanelProps {
  models: L2ModelDTO[];
  ledger: CostLedgerEntryDTO[];
}

const TIER_STYLE: Record<string, string> = {
  REASONING_FRONTIER: "bg-[#af52de]/10 text-[#8944ab]",
  GENERAL_PURPOSE: "bg-[#0071e3]/10 text-[#0071e3]",
  FAST_CHEAP: "bg-[#ff9f0a]/10 text-[#b25000]",
  SLM_MICRO: "bg-[#34c759]/10 text-[#248a3d]",
};

const ROLE_LABEL: Record<string, string> = {
  PRIMARY: "Primario",
  FALLBACK: "Fallback",
  ESCALATION: "Escalado",
  LOCAL_RULES: "Reglas L1",
};

export function L2Panel({ models, ledger }: L2PanelProps) {
  const byArchetype = useMemo(() => {
    const groups = new Map<string, L2ModelDTO[]>();
    for (const m of models) {
      const list = groups.get(m.archetype) ?? [];
      list.push(m);
      groups.set(m.archetype, list);
    }
    return [...groups.entries()];
  }, [models]);

  const totals = useMemo(() => {
    const cost = ledger.reduce((a, l) => a + l.costUsd, 0);
    const tokens = ledger.reduce((a, l) => a + l.promptTokens + l.completionTokens, 0);
    const avgLatency = ledger.length
      ? Math.round(ledger.reduce((a, l) => a + l.latencyMs, 0) / ledger.length)
      : 0;
    const errors = ledger.filter((l) => l.outcome === "ERROR").length;
    return { cost, tokens, avgLatency, errors };
  }, [ledger]);

  return (
    <div className="space-y-4">
      {/* Métricas del ledger */}
      <section data-tour="l2" aria-label="Métricas del Control Plane L2" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
          <Network className="size-4 text-[#0071e3]" aria-hidden="true" />
          Control Plane L2 — Aislamiento LLM-Agnóstico (P8)
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[#86868b]">
          Ningún controlador de negocio importa SDKs de proveedores. Toda inferencia pasa por el
          envelope canónico con circuit breakers, fallbacks y ledger de auditoría.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-[#f5f5f7] px-3 py-2.5">
            <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-[#86868b]">
              <Receipt className="size-3" aria-hidden="true" /> Costo total
            </dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold text-[#1d1d1f]">
              ${totals.cost.toFixed(4)}
            </dd>
          </div>
          <div className="rounded-xl bg-[#f5f5f7] px-3 py-2.5">
            <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-[#86868b]">
              <Cpu className="size-3" aria-hidden="true" /> Tokens
            </dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold text-[#1d1d1f]">
              {totals.tokens.toLocaleString("es-VE")}
            </dd>
          </div>
          <div className="rounded-xl bg-[#f5f5f7] px-3 py-2.5">
            <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-[#86868b]">
              <Activity className="size-3" aria-hidden="true" /> Latencia media
            </dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold text-[#1d1d1f]">{totals.avgLatency}ms</dd>
          </div>
          <div className="rounded-xl bg-[#f5f5f7] px-3 py-2.5">
            <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-[#86868b]">
              <ShieldCheck className="size-3" aria-hidden="true" /> Errores
            </dt>
            <dd className={cn(
              "mt-0.5 font-mono text-lg font-semibold",
              totals.errors > 0 ? "text-[#d70015]" : "text-[#248a3d]"
            )}>
              {totals.errors}
            </dd>
          </div>
        </dl>
      </section>

      {/* Matriz de arquetipos */}
      <section aria-label="Matriz de arquetipos satélite" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
          <Zap className="size-4 text-[#0071e3]" aria-hidden="true" />
          Matriz de Arquetipos Satélite (§3.4)
        </h3>
        <p className="mt-1 font-mono text-[10px] text-[#86868b]">
          Breaker: OPEN si N ≥ 10 ∧ R_fail ≥ 0.40 · Backoff: T = min(3000, rand(200, prev×3)) ms
        </p>
        <div className="mt-4 space-y-3">
          {byArchetype.map(([archetype, models]) => (
            <div key={archetype} className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[#1d1d1f]">{archetype}</h4>
                <span className="font-mono text-[10px] text-[#86868b]">
                  SLA {Math.min(...models.map((m) => m.latencySlaMs))}ms
                </span>
              </div>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {models.map((m) => (
                  <div key={m.id} className="rounded-lg border border-[#e5e5ea] bg-white px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-[#1d1d1f]">{m.name}</span>
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          m.status === "OPEN" ? "bg-[#ff3b30]" : "bg-[#34c759]"
                        )}
                        aria-label={`Breaker ${m.status}`}
                      />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={cn("rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold", TIER_STYLE[m.tier] ?? "bg-[#f5f5f7] text-[#86868b]")}>
                        {m.tier}
                      </span>
                      <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 font-mono text-[9px] text-[#4b4b50]">
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </div>
                    <p className="mt-1.5 font-mono text-[9px] text-[#86868b]">
                      fail {(m.failRate * 100).toFixed(1)}% · n={m.samples} · {m.provider}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ledger */}
      <section aria-label="Ledger inmutable de costos" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
          <Receipt className="size-4 text-[#0071e3]" aria-hidden="true" />
          l2_cost_token_ledger — Inmutable ({ledger.length})
        </h3>
        <div className="os-scroll mt-3 max-h-72 overflow-y-auto pr-1">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e5e5ea] text-[10px] uppercase tracking-wide text-[#86868b]">
                <th scope="col" className="pb-2 pr-2 font-medium">Modelo</th>
                <th scope="col" className="pb-2 pr-2 font-medium">Propósito</th>
                <th scope="col" className="pb-2 pr-2 text-right font-medium">Tokens</th>
                <th scope="col" className="pb-2 pr-2 text-right font-medium">Costo</th>
                <th scope="col" className="pb-2 text-right font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l) => (
                <tr key={l.id} className="border-b border-[#f0f0f2] font-mono text-[10px] text-[#4b4b50]">
                  <td className="py-2 pr-2">{l.model}</td>
                  <td className="py-2 pr-2">{l.purpose}</td>
                  <td className="py-2 pr-2 text-right">{(l.promptTokens + l.completionTokens).toLocaleString("es-VE")}</td>
                  <td className="py-2 pr-2 text-right">${l.costUsd.toFixed(4)}</td>
                  <td className="py-2 text-right">
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                      l.outcome === "OK" ? "bg-[#34c759]/10 text-[#248a3d]"
                        : l.outcome === "FALLBACK" ? "bg-[#ff9f0a]/10 text-[#b25000]"
                        : "bg-[#ff3b30]/10 text-[#d70015]"
                    )}>
                      {l.outcome}
                    </span>
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-[#86868b]">
                    Ledger vacío. Ejecuta mejorate o radiografía para generar inferencias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
