// Self-contained protocol types for the topology-engine mini-service.
// Mirrors src/lib/topology-live/protocol.ts in the Next.js app — keep both
// in sync when evolving the contract.

export type TransferKind = "inference" | "data" | "control" | "report";
export type StepStatus = "pending" | "running" | "done" | "fail";
export type IterationStatus = "queued" | "running" | "done";
export type EngineMode = "idle" | "single" | "continuous";

export const CYCLE_STEPS = [
  "detectar",
  "analizar",
  "investigar",
  "corregir",
  "verificar",
  "criterios",
  "reportar",
] as const;

export type CycleStepId = (typeof CYCLE_STEPS)[number];

export const ALL_NODES = [
  "operador",
  "consola",
  "api",
  "dispatcher",
  "sentinela",
  "juez",
  "detectar",
  "analizar",
  "investigar",
  "corregir",
  "verificar",
  "criterios",
  "reportar",
  "l2glm",
  "memoria",
  "bd",
  "reportes",
] as const;

export type NodeId = (typeof ALL_NODES)[number];

export interface NodeStateDTO {
  id: string;
  active: boolean;
  activations: number;
  deactivations: number;
  lastReason: string | null;
  lastActiveAt: number | null;
}

export interface TransferDTO {
  id: string;
  from: string;
  to: string;
  kind: TransferKind;
  bytes: number;
  charsIn?: number;
  charsOut?: number;
  preview: string;
  durationMs?: number;
  iterationId: string;
  stepId: CycleStepId | "trigger" | "ciclo";
  ts: number;
}

export interface StepStateDTO {
  id: CycleStepId;
  status: StepStatus;
  durationMs?: number;
  detail?: string;
}

export interface IterationDTO {
  id: string;
  seq: number;
  status: IterationStatus;
  startedAt: number | null;
  endedAt: number | null;
  steps: Record<CycleStepId, StepStateDTO>;
  transfers: number;
  bytes: number;
  inferences: number;
  verdict: "AGREE" | "DISAGREE" | "MIXED" | null;
  summary: string | null;
  taskLabel: string;
}

export interface FindingCardDTO {
  id: string;
  sourceRef: string;
  severity: string;
  title: string;
  status: string;
  source: string;
  createdAt: string;
}

export interface KpiDTO {
  iterationsTotal: number;
  iterationsRunning: number;
  iterationsCompleted: number;
  stepsTotal: number;
  stepsPerStage: Record<CycleStepId, number>;
  nodesActive: number;
  nodesTotal: number;
  activations: number;
  deactivations: number;
  transfersTotal: number;
  bytesTotal: number;
  transfersByKind: Record<TransferKind, number>;
  inferencesTotal: number;
  inferencesCharsIn: number;
  inferencesCharsOut: number;
  inferencesAvgLatencyMs: number;
  inferencesErrors: number;
  findingsOpen: number;
  findingsResolved: number;
  findingsTotal: number;
  verdictsAgree: number;
  verdictsDisagree: number;
  verdictsMixed: number;
  startedAt: number;
  lastActivityAt: number;
}

export interface EngineStateDTO {
  running: boolean;
  paused: boolean;
  mode: EngineMode;
  queuedIterations: number;
  paceMs: number;
  currentIterationId: string | null;
}

export interface LogEntryDTO {
  id: number;
  ts: number;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

export interface SnapshotDTO {
  engine: EngineStateDTO;
  nodes: NodeStateDTO[];
  iterations: IterationDTO[];
  kpis: KpiDTO;
  findings: FindingCardDTO[];
  recentTransfers: TransferDTO[];
  recentLogs: LogEntryDTO[];
}

export type ControlAction =
  | { action: "run"; iterations?: number }
  | { action: "continuous" }
  | { action: "pause" }
  | { action: "resume" }
  | { action: "stop" }
  | { action: "resync" }
  | { action: "pace"; paceMs: number };

export function emptySteps(): Record<CycleStepId, StepStateDTO> {
  const out = {} as Record<CycleStepId, StepStateDTO>;
  for (const s of CYCLE_STEPS) out[s] = { id: s, status: "pending" };
  return out;
}
