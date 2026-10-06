"use client";

// ════════════════════════════════════════════════════════════════════════
// constitution-panel.tsx — Constitución AGENTS.md: 17 reglas cardinales
// (P1-P16 + W-CTA) en detalle, y el directorio de los 19 comandos canónicos.
// ════════════════════════════════════════════════════════════════════════

import { ScrollText, TerminalSquare, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardinalRuleDTO, CommandDefDTO } from "@/lib/agent-os/types";

interface ConstitutionPanelProps {
  rules: CardinalRuleDTO[];
  commands: CommandDefDTO[];
}

export function ConstitutionPanel({ rules, commands }: ConstitutionPanelProps) {
  return (
    <div className="space-y-4">
      <section data-tour="constitucion" aria-label="Reglas cardinales" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
          <ShieldCheck className="size-4 text-[#0071e3]" aria-hidden="true" />
          Reglas Cardinales — AGENTS.md v2.1.0 (Documento Cero)
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[#86868b]">
          Ningún archivo puede crearse, modificarse o eliminarse sin haber procesado este documento
          Y la memoria empírica. Este archivo rige las operaciones de cualquier agente de IA o
          desarrollador humano en el proyecto.
        </p>
        <div className="os-scroll mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {rules.map((r) => (
            <article
              key={r.code}
              className={cn(
                "rounded-xl border px-4 py-3",
                r.severity === "RED"
                  ? "border-[#ff3b30]/20 bg-[#fffbfb]"
                  : "border-[#ff9f0a]/25 bg-[#fffdf8]"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  "rounded-md px-2 py-0.5 font-mono text-[10px] font-bold",
                  r.severity === "RED" ? "bg-[#ff3b30]/10 text-[#d70015]" : "bg-[#ff9f0a]/10 text-[#b25000]"
                )}>
                  {r.code}
                </span>
                <h4 className="text-xs font-semibold text-[#1d1d1f]">{r.title}</h4>
                <span className="ml-auto rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[9px] font-medium text-[#86868b]">
                  {r.category}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#4b4b50]">{r.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Directorio de comandos operativos" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
          <TerminalSquare className="size-4 text-[#0071e3]" aria-hidden="true" />
          Directorio de Comandos Operativos
        </h3>
        <p className="mt-1.5 font-mono text-[11px] text-[#86868b]">
          lee AGENTS.md, ejecuta: &lt;comando&gt; [parámetros]
        </p>
        <div className="os-scroll mt-4 max-h-[480px] overflow-y-auto pr-1">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e5e5ea] text-[10px] uppercase tracking-wide text-[#86868b]">
                <th scope="col" className="pb-2 pr-3 font-medium">Comando</th>
                <th scope="col" className="pb-2 pr-3 font-medium">Acción</th>
                <th scope="col" className="pb-2 font-medium">Metodología</th>
              </tr>
            </thead>
            <tbody>
              {commands.map((c) => (
                <tr key={c.id} className="border-b border-[#f0f0f2] align-top">
                  <td className="py-2.5 pr-3">
                    <span className="font-mono text-[11px] font-semibold text-[#0071e3]">{c.name}</span>
                    {c.aliases && (
                      <span className="mt-0.5 block font-mono text-[9px] text-[#86868b]">{c.aliases}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-[11px] leading-relaxed text-[#4b4b50]">{c.action}</td>
                  <td className="py-2.5 text-[10px] text-[#86868b]">
                    <span className="flex items-center gap-1">
                      <ScrollText className="size-3 shrink-0" aria-hidden="true" />
                      {c.methodology}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
