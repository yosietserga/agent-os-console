"use client";

// kanban-kpi-board.tsx — Kanban KPI board for the Living Topology
// integration of the Agent OS console. Consumes the shared `useTopologyLive`
// state so it stays perfectly in sync with the Topología Viva canvas.
//
// Three sections (dark command-center styling):
//   1. KPI cards — live counters of the autonomous quality cycle.
//   2. Kanban de Iteraciones — iterations moving through the 7-stage cycle
//      (detectar → analizar → investigar → corregir → verificar → criterios
//      → reportar) with framer-motion shared-layout transitions.
//   3. Kanban de Hallazgos — real findings from the Agent OS database,
//      grouped by lifecycle status.
//
// Silent-state safe: renders with no iterations and empty findings without
// NaN, crashes or empty holes. Spanish UI, no emojis, no extra dependencies
// (only framer-motion + lucide-react + Tailwind).

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CYCLE_STEPS,
  STEP_LABELS,
  type CycleStepId,
} from "@/lib/topology/agent-workflow";
import {
  TRANSFER_COLORS,
  TRANSFER_LABELS,
  formatBytes,
} from "@/lib/topology/colors";
import type {
  EngineMode,
  FindingCardDTO,
  IterationDTO,
  TransferKind,
} from "@/lib/topology-live/protocol";
import type { TopologyLive } from "@/lib/topology-live/use-topology-live";

// ── Static catalogs ────────────────────────────────────────────────────────

const MODE_LABELS: Record<EngineMode, string> = {
  idle: "Reposo",
  single: "Individual",
  continuous: "Continuo",
};

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "border-rose-400/50 text-rose-400",
  HIGH: "border-orange-400/50 text-orange-400",
  MEDIUM: "border-amber-400/50 text-amber-400",
  LOW: "border-slate-400/40 text-slate-400",
};

const SOURCE_LABELS: Record<string, string> = {
  COMMAND_LOG: "Comando",
  RADIOGRAFIA: "Radiografía",
  RADIOGRAFÍA: "Radiografía",
  L2_LEDGER: "Ledger L2",
  GATEWAY_BUDGET: "Presupuesto",
};

const FINDING_COLUMNS = [
  { status: "DETECTED", label: "Detectado" },
  { status: "ANALYZED", label: "Analizado" },
  { status: "CORRECTED", label: "Corregido" },
  { status: "VERIFIED", label: "Verificado" },
  { status: "RESOLVED", label: "Resuelto" },
  { status: "NO_DEFECT", label: "No Defecto" },
  { status: "ESCALATED", label: "Escalado" },
] as const;

const TRANSFER_KINDS = Object.keys(TRANSFER_COLORS) as TransferKind[];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Finite-number guard: never render NaN even if a partial DTO arrives. */
function nn(v: number | null | undefined): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

const esVeFormatter = new Intl.NumberFormat("es-VE");

function formatNumber(v: number | null | undefined): string {
  return esVeFormatter.format(nn(v));
}

/** Stage currently executing in an iteration (first step with running status). */
function currentStageOf(it: IterationDTO): CycleStepId | null {
  const steps = it?.steps;
  if (!steps) return null;
  for (const stepId of CYCLE_STEPS) {
    const s = steps[stepId];
    if (s && s.status === "running") return stepId;
  }
  return null;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

/** Re-render every `intervalMs` (bounded tick, used only for elapsed times). */
function useTick(intervalMs: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return tick;
}

/** Brief highlight when `value` changes since the previous render cycle. */
// (implemented via a keyed overlay span with a CSS animation in globals.css:
// when flashKey changes the span remounts and the flash animation replays —
// no setState-in-effect needed)

// ── Tiny presentational atoms ──────────────────────────────────────────────

function PulseDot({
  colorClass,
  sizeClass = "h-2 w-2",
  pulse = true,
  title,
}: {
  colorClass: string;
  sizeClass?: string;
  pulse?: boolean;
  title?: string;
}) {
  return (
    <span title={title} className={`relative inline-flex shrink-0 ${sizeClass}`}>
      {pulse ? (
        <span
          aria-hidden="true"
          className={`absolute inline-flex h-full w-full rounded-full ${colorClass} topo-ping`}
        />
      ) : null}
      <span
        aria-hidden="true"
        className={`relative inline-flex h-full w-full rounded-full ${colorClass}`}
      />
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  flashKey,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  flashKey: number | string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-cyan-500/15 bg-slate-950/60 p-3.5 backdrop-blur-md`}
    >
      {/* flash overlay: remounts (key) whenever the value changes */}
      <span
        key={flashKey}
        className="topo-flash pointer-events-none absolute inset-0 rounded-xl"
        aria-hidden="true"
      />
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-400/70">
        {label}
      </div>
      <div className="mt-1 truncate font-mono text-xl font-semibold tabular-nums text-slate-100">
        {value}
      </div>
      {sub ? (
        <div className="mt-1 text-[10px] leading-snug text-slate-500">{sub}</div>
      ) : null}
    </div>
  );
}

/** 7 step pips: emerald done, cyan pulsing running, rose fail, slate pending. */
function StepPips({ steps }: { steps: IterationDTO["steps"] }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {CYCLE_STEPS.map((stepId) => {
        const st = steps?.[stepId];
        const status = st?.status;
        const title = `${STEP_LABELS[stepId]}: ${status ?? "pending"}${
          st?.detail ? ` ${st.detail}` : ""
        }`;
        if (status === "running") {
          return (
            <PulseDot
              key={stepId}
              title={title}
              sizeClass="h-1.5 w-1.5"
              colorClass="bg-cyan-400"
            />
          );
        }
        const dotClass =
          status === "done"
            ? "bg-emerald-400"
            : status === "fail"
              ? "bg-rose-400"
              : "bg-slate-700";
        return (
          <span
            key={stepId}
            title={title}
            className={`h-1.5 w-1.5 rounded-full ${dotClass}`}
          />
        );
      })}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: IterationDTO["verdict"] }) {
  if (verdict !== "AGREE" && verdict !== "MIXED" && verdict !== "DISAGREE") {
    return null;
  }
  const styles: Record<"AGREE" | "MIXED" | "DISAGREE", string> = {
    AGREE: "border-emerald-400/40 text-emerald-400",
    MIXED: "border-amber-400/40 text-amber-400",
    DISAGREE: "border-rose-400/40 text-rose-400",
  };
  return (
    <span
      className={`shrink-0 rounded border px-1 py-px font-mono text-[8px] font-semibold uppercase tracking-wider ${styles[verdict]}`}
    >
      {verdict}
    </span>
  );
}

/** Elapsed seconds for a running iteration (1s tick, hydration-safe). */
function ElapsedSeconds({ startedAt }: { startedAt: number | null }) {
  useTick(1000);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || typeof startedAt !== "number" || !Number.isFinite(startedAt)) {
    return <span className="font-mono text-[9px] text-slate-600">—</span>;
  }
  const secs = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  return (
    <span className="font-mono text-[9px] tabular-nums text-cyan-300/80">{secs}s</span>
  );
}

// ── Cards ──────────────────────────────────────────────────────────────────

function IterationCard({ iteration }: { iteration: IterationDTO }) {
  const it = iteration;
  const isRunning = it?.status === "running";
  const isDone = it?.status === "done";
  const initiating = isRunning && currentStageOf(it) === null;
  const inferences = nn(it?.inferences);
  const summaryTitle =
    isDone && typeof it?.summary === "string" ? it.summary : undefined;

  return (
    <motion.div
      layout
      layoutId={`iter-${it?.id}`}
      role="listitem"
      title={summaryTitle}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="min-w-[180px] rounded-lg border border-slate-700/60 bg-slate-900/70 p-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold tabular-nums text-slate-200">
          #{nn(it?.seq)}
        </span>
        {isDone ? (
          <VerdictBadge verdict={it?.verdict ?? null} />
        ) : isRunning ? (
          <span className="flex items-center gap-1.5">
            <ElapsedSeconds startedAt={typeof it?.startedAt === "number" ? it.startedAt : null} />
            <Loader2
              aria-hidden="true"
              className="h-3 w-3 animate-spin text-cyan-400"
            />
          </span>
        ) : null}
      </div>

      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-400">
        {it?.taskLabel ?? "Iteración del ciclo autónomo"}
      </p>
      {initiating ? (
        <p className="mt-0.5 text-[9px] leading-snug text-slate-500">iniciando...</p>
      ) : null}

      <div className="mt-1.5">
        <StepPips steps={it?.steps} />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-1 font-mono text-[9px] tabular-nums text-slate-500">
        <span>{nn(it?.transfers)} transferencias</span>
        <span aria-hidden="true">·</span>
        <span>{formatBytes(nn(it?.bytes))}</span>
        {inferences > 0 ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{inferences} inferencias</span>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}

function FindingCardItem({ finding }: { finding: FindingCardDTO }) {
  const severityKey = String(finding?.severity ?? "").toUpperCase();
  const severityClass =
    SEVERITY_STYLES[severityKey] ?? "border-slate-400/40 text-slate-400";
  const sourceKey = String(finding?.source ?? "").toUpperCase();
  const sourceLabel = SOURCE_LABELS[sourceKey] ?? (sourceKey || "Fuente");

  return (
    <motion.div
      layout
      layoutId={`finding-${finding?.id}`}
      role="listitem"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="min-w-[180px] rounded-lg border border-slate-700/60 bg-slate-900/70 p-2.5"
    >
      <div className="flex items-center justify-between gap-1.5">
        <span
          className={`shrink-0 rounded border px-1 py-px font-mono text-[8px] font-semibold uppercase tracking-wider ${severityClass}`}
        >
          {severityKey || "N/D"}
        </span>
        <span className="truncate rounded border border-slate-700/60 px-1 py-px font-mono text-[8px] text-slate-500">
          {sourceLabel}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug text-slate-300">
        {finding?.title ?? "Hallazgo sin título"}
      </p>
      <p className="mt-1 truncate font-mono text-[9px] text-slate-600">
        {finding?.sourceRef ?? "—"}
      </p>
    </motion.div>
  );
}

// ── Column shell ───────────────────────────────────────────────────────────

function BoardColumn({
  label,
  count,
  active = false,
  accent = "slate",
  footer,
  children,
}: {
  label: string;
  count: number;
  active?: boolean;
  accent?: "slate" | "emerald";
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex w-[200px] min-w-[190px] shrink-0 flex-col gap-2 rounded-xl border border-slate-800/70 bg-slate-950/40 p-2">
      <div
        className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 ${
          active
            ? "border-emerald-400/30 bg-emerald-400/10"
            : "border-slate-700/50 bg-slate-900/50"
        }`}
      >
        <span
          className={`truncate font-mono text-[9px] uppercase tracking-[0.14em] ${
            active
              ? "text-emerald-300"
              : accent === "emerald"
                ? "text-emerald-300/60"
                : "text-slate-400"
          }`}
        >
          {label}
        </span>
        <span
          className={`shrink-0 rounded-full border px-1.5 font-mono text-[9px] tabular-nums ${
            active
              ? "border-emerald-400/30 text-emerald-300"
              : "border-slate-700/60 text-slate-500"
          }`}
        >
          {count}
        </span>
      </div>

      <div
        role="list"
        aria-label={`Columna ${label}`}
        className="topo-scroll flex max-h-80 flex-col gap-2 overflow-y-auto pr-0.5"
      >
        <AnimatePresence initial={false}>{children}</AnimatePresence>
        {count === 0 ? (
          <div
            aria-hidden="true"
            className="flex min-h-8 items-center justify-center font-mono text-[10px] text-slate-700"
          >
            —
          </div>
        ) : null}
      </div>

      {footer ? <div className="mt-auto">{footer}</div> : null}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function KanbanKpiBoard({ live }: { live: TopologyLive }) {
  const k = live?.kpis;
  const engine = live?.engine;
  const iterations = live?.iterations ?? [];
  const findings = live?.findings ?? [];
  const queued = nn(engine?.queuedIterations);

  // KPI scalars, all NaN-guarded.
  const iterationsCompleted = nn(k?.iterationsCompleted);
  const iterationsTotal = nn(k?.iterationsTotal);
  const iterationsRunning = nn(k?.iterationsRunning);
  const stepsTotal = nn(k?.stepsTotal);
  const nodesActive = nn(k?.nodesActive);
  const nodesTotal = nn(k?.nodesTotal);
  const activations = nn(k?.activations);
  const deactivations = nn(k?.deactivations);
  const transfersTotal = nn(k?.transfersTotal);
  const bytesTotal = nn(k?.bytesTotal);
  const inferencesTotal = nn(k?.inferencesTotal);
  const inferencesCharsIn = nn(k?.inferencesCharsIn);
  const inferencesCharsOut = nn(k?.inferencesCharsOut);
  const inferencesAvgLatencyMs = Math.round(nn(k?.inferencesAvgLatencyMs));
  const inferencesErrors = nn(k?.inferencesErrors);
  const findingsOpen = nn(k?.findingsOpen);
  const findingsResolved = nn(k?.findingsResolved);
  const findingsTotal = nn(k?.findingsTotal);
  const verdictsAgree = nn(k?.verdictsAgree);
  const verdictsMixed = nn(k?.verdictsMixed);
  const verdictsDisagree = nn(k?.verdictsDisagree);

  // Running iterations bucketed per stage (trigger-phase cards go to the
  // first stage column with an "iniciando..." note).
  const runningByStage = useMemo(() => {
    const map = new Map<CycleStepId, IterationDTO[]>();
    for (const stepId of CYCLE_STEPS) map.set(stepId, []);
    const initiating: IterationDTO[] = [];
    for (const it of iterations) {
      if (it?.status !== "running") continue;
      const stage = currentStageOf(it);
      const bucket = stage ? map.get(stage) : undefined;
      if (bucket) bucket.push(it);
      else initiating.push(it);
    }
    const first = map.get(CYCLE_STEPS[0]);
    if (first) first.unshift(...initiating);
    return map;
  }, [iterations]);

  // Completed iterations, newest first.
  const completed = useMemo(
    () =>
      iterations
        .filter((it) => it?.status === "done")
        .slice()
        .sort((a, b) => {
          const aT = a?.endedAt ?? a?.startedAt ?? 0;
          const bT = b?.endedAt ?? b?.startedAt ?? 0;
          if (bT !== aT) return bT - aT;
          return nn(b?.seq) - nn(a?.seq);
        }),
    [iterations]
  );

  // Findings grouped by lifecycle status, newest first within each column.
  const findingsByStatus = useMemo(() => {
    const map = new Map<string, FindingCardDTO[]>();
    for (const col of FINDING_COLUMNS) map.set(col.status, []);
    for (const f of findings) {
      if (!f || typeof f.id !== "string") continue;
      const bucket = map.get(String(f.status ?? "").toUpperCase());
      if (bucket) bucket.push(f);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) =>
        String(b?.createdAt ?? "").localeCompare(String(a?.createdAt ?? ""))
      );
    }
    return map;
  }, [findings]);

  const silentBoard = iterations.length === 0 && queued === 0;

  return (
    <div className="flex flex-col gap-5" aria-label="Kanban KPI del ciclo autónomo de calidad">
      {/* ── Section 1: KPI cards ─────────────────────────────────────────── */}
      <section aria-label="KPIs del ciclo autónomo en vivo" className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <PulseDot colorClass="bg-cyan-400" sizeClass="h-1.5 w-1.5" title="Métricas en vivo" />
          <h3
            aria-label="KPIs del Ciclo — Panel de Control en Vivo"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300"
          >
            KPIs del Ciclo <span className="text-slate-600">—</span>{" "}
            <span className="text-cyan-300">Panel de Control en Vivo</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          <KpiCard
            label="Iteraciones"
            value={iterationsCompleted}
            flashKey={iterationsCompleted}
            sub={`${iterationsTotal} totales · ${iterationsRunning} en curso`}
          />

          <KpiCard
            label="Pasos ejecutados"
            value={stepsTotal}
            flashKey={stepsTotal}
            sub={
              <span className="flex items-center gap-1" aria-hidden="true">
                {CYCLE_STEPS.map((stepId) => {
                  const n = nn(k?.stepsPerStage?.[stepId]);
                  return (
                    <span
                      key={stepId}
                      title={`${STEP_LABELS[stepId]}: ${n}`}
                      className={`h-1.5 w-1.5 rounded-full ${
                        n > 0 ? "bg-emerald-400" : "bg-slate-700"
                      }`}
                    />
                  );
                })}
              </span>
            }
          />

          <KpiCard
            label="Nodos activos"
            value={`${nodesActive}/${nodesTotal}`}
            flashKey={nodesActive}
            sub={`${activations} activaciones · ${deactivations} desactivaciones`}
          />

          <KpiCard
            label="Transferencias"
            value={transfersTotal}
            flashKey={transfersTotal}
            sub={
              <span className="inline-flex items-center gap-1.5">
                <PulseDot colorClass="bg-cyan-400" sizeClass="h-1.5 w-1.5" />
                <span>en vivo</span>
              </span>
            }
          />

          <KpiCard
            label="Contexto transferido"
            value={formatBytes(bytesTotal)}
            flashKey={bytesTotal}
            sub={
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {TRANSFER_KINDS.map((kind) => (
                  <span
                    key={kind}
                    title={TRANSFER_LABELS[kind]}
                    className="inline-flex items-center gap-1"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: TRANSFER_COLORS[kind] }}
                    />
                    <span className="font-mono text-[9px] tabular-nums text-slate-500">
                      {nn(k?.transfersByKind?.[kind])}
                    </span>
                  </span>
                ))}
              </span>
            }
          />

          <KpiCard
            label="Inferencias L2"
            value={inferencesTotal}
            flashKey={inferencesTotal}
            sub={
              <span>
                {formatNumber(inferencesCharsIn)} → {formatNumber(inferencesCharsOut)} chars ·{" "}
                {inferencesAvgLatencyMs}ms prom
                {inferencesErrors > 0 ? (
                  <span className="text-rose-400"> · {inferencesErrors} errores</span>
                ) : null}
              </span>
            }
          />

          <KpiCard
            label="Hallazgos reales"
            value={
              <span>
                {findingsOpen}{" "}
                <span className="text-[10px] font-normal text-slate-400">abiertos</span>
              </span>
            }
            flashKey={findingsOpen}
            sub={`${findingsResolved} resueltos · ${findingsTotal} en BD`}
          />

          <KpiCard
            label="Veredictos"
            value={
              <span>
                {verdictsAgree}{" "}
                <span className="text-[10px] font-semibold text-emerald-400">AGREE</span>
              </span>
            }
            flashKey={verdictsAgree}
            sub={`${verdictsMixed} MIXED · ${verdictsDisagree} DISAGREE`}
          />
        </div>
      </section>

      {/* ── Section 2: Kanban de iteraciones ─────────────────────────────── */}
      <section
        aria-label="Kanban de iteraciones — ciclo autónomo en vivo"
        className="flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <PulseDot
              colorClass={live?.connected ? "bg-emerald-400" : "bg-slate-600"}
              pulse={Boolean(live?.connected)}
              title={live?.connected ? "Ciclo en vivo" : "Sin conexión"}
            />
            <h3
              aria-label="Kanban de Iteraciones — Ciclo Autónomo en Vivo"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300"
            >
              Kanban de Iteraciones <span className="text-slate-600">—</span>{" "}
              <span className="text-emerald-300">Ciclo Autónomo en Vivo</span>
            </h3>
          </div>
          <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-wider text-slate-600 sm:block">
            {live?.connected ? "socket en vivo" : "sin conexión"}
          </span>
        </div>

        {silentBoard ? (
          <p className="text-[10px] leading-snug text-slate-600">
            Sin iteraciones aún — el ciclo autónomo se dispara solo tras cada error del
            sistema o con el comando vigila.
          </p>
        ) : null}

        <div className="topo-scroll overflow-x-auto pb-1.5">
          <div className="flex min-w-max gap-2.5">
            {/* Column 1: En Cola */}
            <BoardColumn
              label="En Cola"
              count={queued}
              footer={
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded border border-slate-700/60 bg-slate-900/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-slate-400">
                    {MODE_LABELS[engine?.mode ?? "idle"] ?? "—"}
                  </span>
                  {engine?.paused ? (
                    <span className="rounded border border-amber-400/40 bg-amber-400/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber-400">
                      Pausado
                    </span>
                  ) : null}
                </div>
              }
            >
              {queued > 0 ? (
                <motion.div
                  key="queue-count-card"
                  layout
                  role="listitem"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="relative mb-3"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 bottom-0 h-full translate-y-1 rounded-lg border border-slate-800/70 bg-slate-950/30"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 bottom-0 h-full translate-y-2 rounded-lg border border-slate-800/40 bg-slate-950/20"
                  />
                  <div className="relative rounded-lg border border-slate-600/50 bg-slate-900/80 p-2.5 text-center">
                    <div className="font-mono text-lg font-semibold tabular-nums text-slate-200">
                      {queued}
                    </div>
                    <div className="text-[9px] leading-tight text-slate-500">
                      {queued === 1 ? "iteración encolada" : "iteraciones encoladas"}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </BoardColumn>

            {/* Columns 2-8: the 7 stages */}
            {CYCLE_STEPS.map((stepId) => {
              const cards = runningByStage.get(stepId) ?? [];
              return (
                <BoardColumn
                  key={stepId}
                  label={STEP_LABELS[stepId]}
                  count={cards.length}
                  active={cards.length > 0}
                  accent="emerald"
                >
                  {cards.map((it) => (
                    <IterationCard key={it.id} iteration={it} />
                  ))}
                </BoardColumn>
              );
            })}

            {/* Column 9: Completadas */}
            <BoardColumn label="Completadas" count={completed.length}>
              {completed.map((it) => (
                <IterationCard key={it.id} iteration={it} />
              ))}
            </BoardColumn>
          </div>
        </div>
      </section>

      {/* ── Section 3: Kanban de hallazgos reales ────────────────────────── */}
      <section
        aria-label="Kanban de hallazgos — base de datos real"
        className="flex flex-col gap-2.5"
      >
        <div className="flex items-center gap-2.5">
          <PulseDot colorClass="bg-emerald-400" sizeClass="h-1.5 w-1.5" title="Hallazgos de la BD real" />
          <h3
            aria-label="Kanban de Hallazgos — Base de Datos Real (Finding lifecycle)"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300"
          >
            Kanban de Hallazgos <span className="text-slate-600">—</span>{" "}
            <span className="text-emerald-300">Base de Datos Real</span>{" "}
            <span className="font-normal normal-case tracking-normal text-slate-600">
              (Finding lifecycle)
            </span>
          </h3>
        </div>

        {findings.length === 0 ? (
          <p className="text-[10px] leading-snug text-slate-600">
            Sin hallazgos en la base de datos todavía — el sentinela los crea al detectar
            fallas reales.
          </p>
        ) : null}

        <div className="topo-scroll overflow-x-auto pb-1.5">
          <div className="flex min-w-max gap-2.5">
            {FINDING_COLUMNS.map((col) => {
              const cards = findingsByStatus.get(col.status) ?? [];
              return (
                <BoardColumn key={col.status} label={col.label} count={cards.length}>
                  {cards.map((f) => (
                    <FindingCardItem key={f.id} finding={f} />
                  ))}
                </BoardColumn>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] leading-snug text-slate-600">
          Los hallazgos provienen de la BD real del Agent OS — el ciclo los verifica en
          vivo en cada iteración.
        </p>
      </section>
    </div>
  );
}

export default KanbanKpiBoard;
