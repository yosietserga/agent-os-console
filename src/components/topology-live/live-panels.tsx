"use client";

// Live panels for the Topología Viva view: legend, metrics strip,
// context-transfer log and node inspector. Adapted from the
// living-topology-visualizer panel language (dark command center).

import { useMemo } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Boxes,
  BrainCircuit,
  CircleDot,
  Database,
  Layers as LayersIcon,
  Network,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import type { AggregateMetrics, LiveNode, Scenario } from "@/lib/topology/types";
import {
  LAYER_COLORS,
  STATUS_COLORS,
  TRANSFER_COLORS,
  TRANSFER_LABELS,
  formatBytes,
} from "@/lib/topology/colors";
import { CYCLE_STEPS, STEP_LABELS } from "@/lib/topology/agent-workflow";
import type { KpiDTO, LogEntryDTO, NodeStateDTO, TransferDTO } from "@/lib/topology-live/protocol";
import { cn } from "@/lib/utils";

function PanelCard({
  title,
  children,
  className,
  right,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-cyan-500/15 bg-slate-950/60 p-3.5 backdrop-blur-md",
        className
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
          {title}
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
}

// ── Legend ────────────────────────────────────────────────────────────

export function TopologyLegend({ scenario }: { scenario: Scenario }) {
  const layerCounts = [0, 0, 0, 0];
  scenario.nodes.forEach((n) => layerCounts[n.layer]++);

  return (
    <div className="flex flex-col gap-3">
      <PanelCard title="Capas del sistema">
        <div className="flex flex-col gap-2">
          {scenario.layers.map((layer) => (
            <div key={layer.id} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 h-3 w-3 shrink-0 rounded-sm"
                style={{
                  backgroundColor: LAYER_COLORS[layer.id],
                  boxShadow: `0 0 8px ${LAYER_COLORS[layer.id]}99`,
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs font-medium text-slate-200">
                    {layer.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {layerCounts[layer.id]} nodos
                  </span>
                </div>
                <p className="truncate text-[10px] text-slate-500">{layer.description}</p>
              </div>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard title="Estado de nodos">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee]" />
            <span className="font-mono text-[11px] text-slate-300">Activo — órgano ejecutando</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            <span className="font-mono text-[11px] text-slate-300">Inactivo — en reposo</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.down, boxShadow: `0 0 8px ${STATUS_COLORS.down}` }}
            />
            <span className="font-mono text-[11px] text-slate-300">Caído — falla detectada</span>
          </div>
        </div>
      </PanelCard>

      <PanelCard title="Tipos de transferencia">
        <div className="flex flex-col gap-1.5">
          {(Object.keys(TRANSFER_COLORS) as (keyof typeof TRANSFER_COLORS)[]).map((k) => (
            <div key={k} className="flex items-center gap-2.5">
              <span className="flex h-3 w-6 items-center">
                <span
                  className="h-1 w-full rounded-full"
                  style={{ backgroundColor: TRANSFER_COLORS[k], opacity: 0.85 }}
                />
              </span>
              <span className="font-mono text-[11px] text-slate-300">
                {TRANSFER_LABELS[k]} ({k})
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Las partículas viajan por los enlaces con cada transferencia de contexto real:
          comandos de control, lecturas de datos, inferencias LLM y escrituras de reporte.
        </p>
      </PanelCard>

      <PanelCard title="Órganos">
        <div className="grid grid-cols-2 gap-2">
          <LegendStat icon={<Boxes className="h-3.5 w-3.5" />} label="Nodos" value={scenario.nodes.length} />
          <LegendStat icon={<Network className="h-3.5 w-3.5" />} label="Enlaces" value={scenario.links.length} />
          <LegendStat icon={<Sparkles className="h-3.5 w-3.5" />} label="Etapas ciclo" value={CYCLE_STEPS.length} />
          <LegendStat icon={<BrainCircuit className="h-3.5 w-3.5" />} label="L2 real" value="GLM" />
        </div>
      </PanelCard>
    </div>
  );
}

function LegendStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/40 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-0.5 font-mono text-base font-semibold text-cyan-300">{value}</div>
    </div>
  );
}

// ── Metrics strip ─────────────────────────────────────────────────────

export function LiveMetrics({
  kpis,
  canvasMetrics,
  currentStep,
  currentIterationSeq,
}: {
  kpis: KpiDTO;
  canvasMetrics: AggregateMetrics | null;
  currentStep: string | null;
  currentIterationSeq: number | null;
}) {
  const items = [
    {
      icon: <Activity className="h-3.5 w-3.5" />,
      label: "Iteración",
      value: currentIterationSeq ? `#${currentIterationSeq} · ${currentStep ? STEP_LABELS[currentStep as keyof typeof STEP_LABELS] : "iniciando"}` : "reposo",
      color: currentIterationSeq ? "text-emerald-300" : "text-slate-400",
    },
    {
      icon: <Zap className="h-3.5 w-3.5" />,
      label: "Nodos activos",
      value: `${kpis.nodesActive}/${kpis.nodesTotal}`,
      color: "text-cyan-300",
    },
    {
      icon: <Network className="h-3.5 w-3.5" />,
      label: "Transferencias",
      value: `${kpis.transfersTotal}`,
      color: "text-sky-300",
    },
    {
      icon: <Database className="h-3.5 w-3.5" />,
      label: "Contexto",
      value: formatBytes(kpis.bytesTotal),
      color: "text-violet-300",
    },
    {
      icon: <BrainCircuit className="h-3.5 w-3.5" />,
      label: "Inferencias L2",
      value: `${kpis.inferencesTotal} · ${kpis.inferencesAvgLatencyMs}ms`,
      color: "text-fuchsia-300",
    },
    {
      icon: <CircleDot className="h-3.5 w-3.5" />,
      label: "Partículas en vuelo",
      value: `${canvasMetrics?.packetsInFlight ?? 0}`,
      color: "text-teal-300",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-cyan-500/15 bg-slate-950/60 px-3 py-2.5 backdrop-blur-md"
        >
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
            {it.icon}
            {it.label}
          </div>
          <div className={cn("mt-1 truncate font-mono text-sm font-semibold", it.color)}>
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Transfer / event log ──────────────────────────────────────────────

const LEVEL_META: Record<string, { color: string; label: string }> = {
  info: { color: "text-sky-300", label: "INFO" },
  success: { color: "text-emerald-300", label: "OK" },
  warn: { color: "text-amber-300", label: "WARN" },
  error: { color: "text-rose-300", label: "ERR" },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-VE", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function LiveEventLog({
  transfers,
  logs,
}: {
  transfers: TransferDTO[];
  logs: LogEntryDTO[];
}) {
  // Merge the two streams into one timeline (latest first).
  const rows = useMemo(() => {
    const tRows = transfers.map((t) => ({
      key: `t-${t.id}`,
      ts: t.ts,
      kind: "transfer" as const,
      transfer: t,
    }));
    const lRows = logs.map((l) => ({
      key: `l-${l.id}`,
      ts: l.ts,
      kind: "log" as const,
      log: l,
    }));
    return [...tRows, ...lRows].sort((a, b) => b.ts - a.ts).slice(0, 90);
  }, [transfers, logs]);

  return (
    <section
      aria-label="Flujo de transferencias de contexto y eventos"
      className="flex h-full min-h-[320px] flex-col rounded-xl border border-cyan-500/15 bg-slate-950/60 backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2.5">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
          Transferencias de contexto
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="topo-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
            en vivo
          </span>
        </div>
      </div>
      <div className="topo-scroll max-h-96 flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {rows.length === 0 ? (
            <div className="flex items-center gap-2 px-3.5 py-4 font-mono text-[11px] text-slate-600">
              <Timer className="h-3 w-3" />
              Esperando actividad — ejecuta una iteración del ciclo
            </div>
          ) : (
            rows.map((row) => {
              if (row.kind === "log") {
                const meta = LEVEL_META[row.log.level] ?? LEVEL_META.info;
                return (
                  <div
                    key={row.key}
                    className="flex items-start gap-2 border-b border-slate-900/70 px-3.5 py-1.5 last:border-0"
                  >
                    <span className="shrink-0 font-mono text-[10px] text-slate-600">
                      {formatTime(row.ts)}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[9px] font-bold uppercase tracking-wider",
                        meta.color
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="font-mono text-[11px] leading-snug text-slate-300">
                      {row.log.message}
                    </span>
                  </div>
                );
              }
              const t = row.transfer;
              const stepLabel =
                t.stepId === "trigger"
                  ? "disparo"
                  : t.stepId === "ciclo"
                    ? "cierre"
                    : STEP_LABELS[t.stepId as keyof typeof STEP_LABELS] ?? t.stepId;
              return (
                <div
                  key={row.key}
                  className="flex items-start gap-2 border-b border-slate-900/70 px-3.5 py-1.5 last:border-0"
                  title={t.preview}
                >
                  <span className="shrink-0 font-mono text-[10px] text-slate-600">
                    {formatTime(t.ts)}
                  </span>
                  <span
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: TRANSFER_COLORS[t.kind] }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 font-mono text-[11px] leading-snug text-slate-300">
                    <span className="font-semibold text-slate-100">
                      {labelForNode(t.from)}
                    </span>
                    <ArrowRight className="mx-1 inline h-3 w-3 text-slate-600" aria-hidden="true" />
                    <span className="font-semibold text-slate-100">{labelForNode(t.to)}</span>
                    <span className="ml-1.5 text-slate-500">
                      · {TRANSFER_LABELS[t.kind]} · {formatBytes(t.bytes)}
                      {t.charsIn !== undefined && t.charsOut !== undefined
                        ? ` · ${t.charsIn}→${t.charsOut} chars`
                        : t.durationMs !== undefined
                          ? ` · ${t.durationMs}ms`
                          : ""}
                      {" · "}
                      <span className="text-cyan-500/80">{stepLabel}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-600">
                      {t.preview}
                    </span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

function labelForNode(id: string): string {
  const map: Record<string, string> = {
    operador: "Operador",
    consola: "Consola",
    api: "API",
    dispatcher: "Dispatcher",
    sentinela: "Sentinela",
    juez: "Juez",
    detectar: "Detectar",
    analizar: "Analizar",
    investigar: "Investigar",
    corregir: "Corregir",
    verificar: "Verificar",
    criterios: "Criterios",
    reportar: "Reportar",
    l2glm: "L2 GLM",
    memoria: "Memoria",
    bd: "BD",
    reportes: "Reportes",
  };
  return map[id] ?? id;
}

// ── Node inspector ────────────────────────────────────────────────────

export function LiveInspector({
  node,
  liveNode,
  nodeState,
  transfers,
  onClose,
}: {
  node: { id: string; label: string; glyph: string; layer: number; role?: string; tags: string[] } | null;
  liveNode: LiveNode | null;
  nodeState: NodeStateDTO | null;
  transfers: TransferDTO[];
  onClose: () => void;
}) {
  if (!node) {
    return (
      <section className="rounded-xl border border-cyan-500/15 bg-slate-950/60 p-4 backdrop-blur-md">
        <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
          Inspector de nodo
        </h3>
        <p className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
          <Bot className="h-3.5 w-3.5" />
          Clic en un nodo para aislar su vecindad y ver sus transferencias
        </p>
      </section>
    );
  }

  const related = transfers.filter((t) => t.from === node.id || t.to === node.id).slice(0, 12);
  const layerName = ["Operación", "Orquestación", "Ciclo Autónomo", "Inferencia & Memoria"][node.layer] ?? "";

  return (
    <section className="rounded-xl border border-cyan-500/15 bg-slate-950/60 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
            Inspector de nodo
          </h3>
          <p className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold text-slate-100">
            <span
              className="flex size-6 items-center justify-center rounded-full border text-[9px] font-bold"
              style={{ borderColor: LAYER_COLORS[node.layer as 0 | 1 | 2 | 3], color: LAYER_COLORS[node.layer as 0 | 1 | 2 | 3] }}
            >
              {node.glyph}
            </span>
            {node.label}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md border border-slate-700 px-2 py-1 font-mono text-[10px] text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
          aria-label="Cerrar inspector"
        >
          ESC
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
        <div className="rounded-md border border-slate-800 bg-slate-900/40 px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">Estado</div>
          <div className={cn("mt-0.5 font-semibold", nodeState?.active ? "text-cyan-300" : "text-slate-400")}>
            {nodeState?.active ? "ACTIVO — ejecutando" : "inactivo"}
          </div>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900/40 px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">Activaciones</div>
          <div className="mt-0.5 font-semibold text-slate-200">
            {nodeState?.activations ?? 0} <span className="text-slate-600">/</span>{" "}
            <span className="text-slate-500">{nodeState?.deactivations ?? 0} desact.</span>
          </div>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900/40 px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">Capa</div>
          <div className="mt-0.5 font-semibold text-slate-200">{layerName}</div>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900/40 px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">Transferencias</div>
          <div className="mt-0.5 font-semibold text-slate-200">{related.length} recientes</div>
        </div>
      </div>

      {node.role && (
        <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">{node.role}</p>
      )}
      {node.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {node.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 font-mono text-[9px] text-slate-400"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {liveNode && (
        <div className="mt-2.5 font-mono text-[10px] text-slate-500">
          rps vivo {liveNode.liveRps.toFixed(1)} · latencia {Math.round(liveNode.liveLatencyMs)}ms ·
          carga {Math.round(liveNode.liveCpu * 100)}% · pulso {(liveNode.pulse * 100).toFixed(0)}%
        </div>
      )}
      {nodeState?.lastReason && (
        <p className="mt-2 border-l-2 border-cyan-500/40 pl-2 font-mono text-[10px] leading-relaxed text-slate-500">
          {nodeState.lastReason}
        </p>
      )}

      {related.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
            <LayersIcon className="h-3 w-3" /> Contexto reciente del nodo
          </div>
          <div className="topo-scroll max-h-44 space-y-1 overflow-y-auto pr-1">
            {related.map((t) => (
              <div
                key={t.id}
                title={t.preview}
                className="flex items-center gap-1.5 rounded-md border border-slate-800/70 bg-slate-900/40 px-2 py-1.5 font-mono text-[10px]"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TRANSFER_COLORS[t.kind] }}
                />
                <span className={t.to === node.id ? "text-cyan-400" : "text-slate-500"}>
                  {t.to === node.id ? "recibe" : "envía"}
                </span>
                <span className="truncate text-slate-400">{t.preview.slice(0, 64)}</span>
                <span className="ml-auto shrink-0 text-slate-600">{formatBytes(t.bytes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
