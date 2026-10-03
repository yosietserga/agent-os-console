"use client";

// topology-live-view.tsx — the "Topología Viva" experience:
// the living canvas of the agentic workflow (adapted from
// yosietserga/living-topology-visualizer) driven in real time by the
// topology-engine mini-service over socket.io.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  GitBranch,
  Orbit,
  Pause,
  Play,
  Repeat,
  Square,
  Waypoints,
} from "lucide-react";
import { AgentCanvas, type AgentCanvasHandle } from "./agent-canvas";
import { LiveEventLog, LiveInspector, LiveMetrics, TopologyLegend } from "./live-panels";
import { AGENT_WORKFLOW_SCENARIO } from "@/lib/topology/agent-workflow";
import type { AggregateMetrics, LiveNode, TopologyEvent, ViewMode } from "@/lib/topology/types";
import { useTopologyLive } from "@/lib/topology-live/use-topology-live";
import { cn } from "@/lib/utils";

const PACE_OPTIONS = [
  { label: "Lento", value: 5000 },
  { label: "Normal", value: 2600 },
  { label: "Rápido", value: 1200 },
];

export function TopologyLiveView() {
  const live = useTopologyLive();
  const canvasRef = useRef<AgentCanvasHandle>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("orbit");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [canvasMetrics, setCanvasMetrics] = useState<AggregateMetrics | null>(null);
  const [liveNodes, setLiveNodes] = useState<LiveNode[]>([]);
  const [canvasEvents, setCanvasEvents] = useState<TopologyEvent[]>([]);
  const prevNodeStates = useRef<Map<string, boolean>>(new Map());
  const lastTransferId = useRef<string | null>(null);

  // ── Wire socket node states → canvas activation/deactivation ────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    for (const [id, state] of live.nodes) {
      const prev = prevNodeStates.current.get(id);
      if (prev === undefined) {
        // First snapshot after mount: apply the current active state so a
        // viewer connecting mid-iteration sees live organs lit immediately.
        if (state.active) canvas.setNodeActive(id, true);
      } else if (prev !== state.active) {
        canvas.setNodeActive(id, state.active);
      }
      prevNodeStates.current.set(id, state.active);
    }
  }, [live.nodes]);

  // ── Wire socket transfers → canvas particle bursts ──────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const t = live.lastTransfer;
    if (!canvas || !t || lastTransferId.current === t.id) return;
    lastTransferId.current = t.id;
    const weight = Math.min(8, 2 + t.bytes / 220);
    canvas.burstTransfer(t.from, t.to, t.kind, weight);
  }, [live.lastTransfer]);

  // ── Keyboard: ESC clears selection ──────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNodeId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onCanvasEvent = useCallback((e: Omit<TopologyEvent, "id">) => {
    setCanvasEvents((prev) => {
      const next = [{ ...e, id: Date.now() + Math.random() }, ...prev];
      return next.slice(0, 60);
    });
  }, []);

  const selectedScenarioNode = useMemo(
    () => AGENT_WORKFLOW_SCENARIO.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [selectedNodeId]
  );
  const selectedLiveNode = useMemo(
    () => liveNodes.find((n) => n.id === selectedNodeId) ?? null,
    [liveNodes, selectedNodeId]
  );

  const engine = live.engine;
  const isBusy = engine.running || engine.queuedIterations > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Control bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-cyan-500/15 bg-slate-950/60 p-3.5 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
            <Waypoints className="h-4 w-4" aria-hidden="true" />
            Ciclo autónomo
          </span>
          <ControlButton
            onClick={() => live.runIterations(1)}
            disabled={isBusy && engine.paused !== true}
            icon={<Play className="h-3.5 w-3.5" />}
            label={isBusy ? "En curso" : "Iterar x1"}
            primary
          />
          <ControlButton
            onClick={() => live.runIterations(3)}
            disabled={isBusy && engine.paused !== true}
            icon={<Play className="h-3.5 w-3.5" />}
            label="x3"
          />
          <ControlButton
            onClick={() =>
              engine.mode === "continuous" ? live.stop() : live.runContinuous()
            }
            disabled={engine.mode === "continuous" ? false : isBusy && engine.paused !== true}
            icon={<Repeat className="h-3.5 w-3.5" />}
            label={engine.mode === "continuous" ? "Detener continuo" : "Continuo"}
            active={engine.mode === "continuous"}
          />
          {engine.paused ? (
            <ControlButton
              onClick={live.resume}
              icon={<Play className="h-3.5 w-3.5" />}
              label="Reanudar"
              primary
            />
          ) : (
            <ControlButton
              onClick={live.pause}
              disabled={!isBusy}
              icon={<Pause className="h-3.5 w-3.5" />}
              label="Pausar"
            />
          )}
          <ControlButton
            onClick={live.stop}
            disabled={!isBusy && engine.mode !== "continuous"}
            icon={<Square className="h-3.5 w-3.5" />}
            label="Detener"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* pace */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            {PACE_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => live.setPace(p.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-mono text-[10px] transition-colors",
                  engine.paceMs === p.value
                    ? "bg-cyan-500/20 text-cyan-200"
                    : "text-slate-500 hover:text-slate-300"
                )}
                aria-label={`Ritmo entre iteraciones: ${p.label}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* view mode */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            <button
              onClick={() => setViewMode("orbit")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] transition-colors",
                viewMode === "orbit"
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-slate-500 hover:text-slate-300"
              )}
              aria-label="Vista órbita"
            >
              <Orbit className="h-3.5 w-3.5" /> Órbita
            </button>
            <button
              onClick={() => setViewMode("funnel")}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono text-[10px] transition-colors",
                viewMode === "funnel"
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-slate-500 hover:text-slate-300"
              )}
              aria-label="Vista embudo"
            >
              <GitBranch className="h-3.5 w-3.5" /> Embudo
            </button>
          </div>
          {/* connection */}
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[10px]",
              live.connected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            )}
            role="status"
          >
            <span className="relative flex h-1.5 w-1.5">
              {live.connected && (
                <span className="topo-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-1.5 w-1.5 rounded-full",
                  live.connected ? "bg-emerald-400" : "bg-rose-400"
                )}
              />
            </span>
            {live.connected ? "motor en vivo" : "sin conexión"}
          </span>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────── */}
      <LiveMetrics
        kpis={live.kpis}
        canvasMetrics={canvasMetrics}
        currentStep={live.currentStep}
        currentIterationSeq={live.currentIteration?.seq ?? null}
      />

      {/* ── Main 3-column layout ────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* left: legend */}
        <div className="order-2 min-w-0 lg:order-1 lg:col-span-3">
          <TopologyLegend scenario={AGENT_WORKFLOW_SCENARIO} />
        </div>

        {/* center: canvas */}
        <div className="order-1 min-w-0 lg:order-2 lg:col-span-6">
          <div className="relative h-[420px] overflow-hidden rounded-xl border border-cyan-500/20 sm:h-[500px] lg:h-[560px]">
            <AgentCanvas
              ref={canvasRef}
              scenario={AGENT_WORKFLOW_SCENARIO}
              viewMode={viewMode}
              paused={false}
              liveMode
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onMetrics={setCanvasMetrics}
              onLiveNodes={setLiveNodes}
              onEvent={onCanvasEvent}
            />
            {/* overlay: engine status */}
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
              <span className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-slate-950/70 px-2.5 py-1.5 font-mono text-[10px] text-cyan-200 backdrop-blur-md">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                {engine.mode === "continuous"
                  ? "modo continuo"
                  : engine.queuedIterations > 0
                    ? `${engine.queuedIterations} en cola`
                    : "ciclo en reposo"}
                {engine.paused && <span className="text-amber-300">· pausado</span>}
              </span>
              {live.currentIteration && (
                <span className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-slate-950/70 px-2.5 py-1.5 font-mono text-[10px] text-emerald-200 backdrop-blur-md">
                  iteración #{live.currentIteration.seq}
                  {live.currentStep && (
                    <span className="text-slate-400">
                      · etapa {live.currentStep}
                    </span>
                  )}
                </span>
              )}
            </div>
            {/* overlay: selected node hint */}
            {selectedNodeId && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg border border-cyan-500/25 bg-slate-950/80 px-3 py-1.5 font-mono text-[10px] text-slate-300 backdrop-blur-md">
                foco aislado — clic de nuevo o ESC para liberar
              </div>
            )}
          </div>
          <p className="mt-2 px-1 text-[10px] leading-relaxed text-slate-500">
            Cada nodo es un órgano real del Agent OS. Las partículas son transferencias de
            contexto reales (violeta = inferencia LLM con chars medidos, cian = datos de la BD,
            verde = reportes). Los anillos se iluminan al activarse cada etapa del ciclo.
          </p>
        </div>

        {/* right: inspector + event log */}
        <div className="order-3 flex min-w-0 flex-col gap-4 lg:col-span-3">
          <LiveInspector
            node={selectedScenarioNode}
            liveNode={selectedLiveNode}
            nodeState={selectedNodeId ? live.nodes.get(selectedNodeId) ?? null : null}
            transfers={live.transfers}
            onClose={() => setSelectedNodeId(null)}
          />
          <LiveEventLog transfers={live.transfers} logs={live.logs} />
        </div>
      </div>

      {/* keep canvas events referenced for future use (focus debugging) */}
      <span className="sr-only" aria-hidden="true">
        {canvasEvents.length} eventos internos del canvas
      </span>
    </div>
  );
}

function ControlButton({
  onClick,
  disabled,
  icon,
  label,
  primary,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-medium transition-colors",
        disabled
          ? "cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-600"
          : primary
            ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25"
            : active
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
              : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:text-slate-100"
      )}
      aria-label={label}
    >
      {icon}
      {label}
    </button>
  );
}
