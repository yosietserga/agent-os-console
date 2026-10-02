"use client";

// ════════════════════════════════════════════════════════════════════════
// psim-panel.tsx — Panel PSIM (column_right): KPIs K1-K5, balance W1-W8,
// Pipeline de 5 Fases y acceso rápido a las 16 reglas cardinales.
// ════════════════════════════════════════════════════════════════════════

import { Activity, Gauge, Layers, ShieldCheck, TrendingUp, Zap, Repeat, Timer, Rocket } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PsimStateDTO, CardinalRuleDTO } from "@/lib/agent-os/types";

const W_CLASSES = [
  { id: "W1", name: "Capability Strengthening", icon: Zap },
  { id: "W2", name: "Carry-over Closure", icon: Repeat },
  { id: "W3", name: "Mock Reduction", icon: Layers },
  { id: "W4", name: "ADOPTED Promotion", icon: Rocket },
  { id: "W5", name: "Anti-Pattern Retirement", icon: ShieldCheck },
  { id: "W6", name: "Persona Satisfied", icon: Activity },
  { id: "W7", name: "Gate Velocity", icon: Timer },
  { id: "W8", name: "Finding Half-Life", icon: TrendingUp },
];

const PIPELINE_PHASES = [
  { n: 0, name: "Auditoría de Premisas & Memory Sync", desc: "Verificar afirmaciones contra código antes de ejecutar" },
  { n: 1, name: "Núcleo de Datos y Tipado Estricto", desc: "Esquemas, lógica pura, cero any" },
  { n: 2, name: "Contratos de Interfaz y API", desc: "OpenAPI 3.1, Zod, envoltorio canónico" },
  { n: 3, name: "Superficie de Consumo y Widgets", desc: "EAV polimórfico, 4 estados, WCAG AA" },
  { n: 4, name: "Tests, Docs y Memoria", desc: "Contratos + actualización de ledgers" },
  { n: 5, name: "Validación en Caliente", desc: "Compilación limpia + smoke test real" },
];

interface PsimPanelProps {
  psim: PsimStateDTO | null;
  rules: CardinalRuleDTO[];
  totalTokens?: number;
}

export function PsimPanel({ psim, rules, totalTokens = 0 }: PsimPanelProps) {
  const kpis = psim
    ? [
        { id: "K1", name: "P0/P1 Closure", value: `${Math.round(psim.k1 * 100)}%`, target: "≥ 90%", progress: psim.k1 * 100, ok: psim.k1 >= 0.9 },
        { id: "K2", name: "Mock Reduction", value: `${psim.k2}`, target: "pendiente neta negativa", progress: Math.min(Math.abs(psim.k2) * 20, 100), ok: psim.k2 < 0 },
        { id: "K3", name: "Finding Half-Life", value: `${psim.k3} it`, target: "≤ 2 iter", progress: Math.min((psim.k3 / 2) * 100, 100), ok: psim.k3 <= 2 },
        { id: "K4", name: "Capability Count", value: `${psim.k4}`, target: "≥ 1 win/iter (W1+W6 incl.)", progress: Math.min((psim.k4 / 18) * 100, 100), ok: psim.k4 >= 1 },
        { id: "K5", name: "Gate Streak", value: `${psim.k5}`, target: "racha monótona creciente", progress: Math.min((psim.k5 / 10) * 100, 100), ok: psim.k5 >= 5 },
      ]
    : [];

  const winsTotal = psim ? psim.w1 + psim.w2 + psim.w3 + psim.w4 + psim.w5 + psim.w6 + psim.w7 + psim.w8 : 0;
  const maxWin = psim ? Math.max(psim.w1, psim.w2, psim.w3, psim.w4, psim.w5, psim.w6, psim.w7, psim.w8, 1) : 1;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <section data-tour="psim" aria-label="KPIs PSIM" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <div className="flex items-center gap-2">
          <Gauge className="size-4 text-[#0071e3]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[#1d1d1f]">PSIM — Trayectoria</h2>
          {psim && (
            <span className="ml-auto font-mono text-[10px] text-[#86868b]">v{psim.version}</span>
          )}
        </div>
        <div className="mt-4 space-y-3.5">
          {kpis.length === 0 && (
            <p className="text-xs text-[#86868b]">Sin estado PSIM. Ejecuta: sil trend</p>
          )}
          {kpis.map((k) => (
            <div key={k.id}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-[#1d1d1f]">
                  <span className="font-mono text-[#0071e3]">{k.id}</span> {k.name}
                </p>
                <p className={cn("font-mono text-xs font-semibold", k.ok ? "text-[#248a3d]" : "text-[#b25000]")}>
                  {k.value}
                </p>
              </div>
              <Progress
                value={k.progress}
                className="mt-1.5 h-1.5 bg-[#f5f5f7]"
                aria-label={`${k.id} ${k.name}: ${k.value} (objetivo ${k.target})`}
              />
              <p className="mt-1 text-[10px] text-[#86868b]">{k.target}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Balance de victorias W1-W8 */}
      <section aria-label="Balance de victorias W1-W8" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
            <TrendingUp className="size-4 text-[#0071e3]" aria-hidden="true" />
            Victorias
          </h2>
          <span className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#1d1d1f]">
            {psim?.k4 ?? 0} victorias · {winsTotal} clases
          </span>
        </div>
        <ul className="mt-4 space-y-2">
          {W_CLASSES.map((w) => {
            const count = psim ? (psim[`w${w.id.slice(1)}` as keyof PsimStateDTO] as number) ?? 0 : 0;
            return (
              <li key={w.id} className="flex items-center gap-2.5">
                <w.icon className="size-3.5 shrink-0 text-[#86868b]" aria-hidden="true" />
                <span className="w-8 shrink-0 font-mono text-[11px] font-semibold text-[#1d1d1f]">{w.id}</span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#f5f5f7]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      count > 0 ? "bg-gradient-to-r from-[#0071e3] to-[#4098e0]" : "bg-transparent"
                    )}
                    style={{ width: `${(count / maxWin) * 100}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right font-mono text-[11px] text-[#86868b]">{count}</span>
                <span className="hidden w-36 shrink-0 truncate text-[10px] text-[#86868b] xl:inline">{w.name}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Pipeline 5 Fases */}
      <section data-tour="pipeline" aria-label="Pipeline universal de 5 fases" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
          <Layers className="size-4 text-[#0071e3]" aria-hidden="true" />
          Pipeline Universal
        </h2>
        <ol className="mt-4 space-y-0">
          {PIPELINE_PHASES.map((p, i) => (
            <li key={p.n} className="relative flex gap-3 pb-4 last:pb-0">
              {i < PIPELINE_PHASES.length - 1 && (
                <span className="absolute left-[11px] top-7 h-[calc(100%-20px)] w-px bg-[#e5e5ea]" aria-hidden="true" />
              )}
              <span
                className={cn(
                  "z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  "bg-[#0071e3] text-white"
                )}
              >
                {p.n}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1d1d1f]">{p.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#86868b]">{p.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Reglas cardinales (resumen) */}
      <section aria-label="Reglas cardinales" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
            <ShieldCheck className="size-4 text-[#0071e3]" aria-hidden="true" />
            Reglas Cardinales
          </h2>
          <span className="font-mono text-[11px] text-[#86868b]">{rules.length}/16 activas</span>
        </div>
        <div className="os-scroll mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {rules.map((r) => (
            <div
              key={r.code}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#f5f5f7]"
              title={r.description}
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  r.severity === "RED" ? "bg-[#ff3b30]" : "bg-[#ff9500]"
                )}
                aria-label={r.severity === "RED" ? "Regla roja" : "Regla amarilla"}
              />
              <span className="w-12 shrink-0 font-mono text-[10px] font-bold text-[#1d1d1f]">{r.code}</span>
              <span className="truncate text-[11px] text-[#4b4b50]">{r.title}</span>
            </div>
          ))}
        </div>
        {totalTokens > 0 && (
          <p className="mt-3 border-t border-[#e5e5ea] pt-3 text-[10px] text-[#86868b]">
            Ledger L2: {totalTokens.toLocaleString("es-VE")} tokens auditados esta sesión
          </p>
        )}
      </section>
    </div>
  );
}
