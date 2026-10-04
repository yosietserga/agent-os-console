// Socket protocol contract between the topology-engine mini-service (:3003)
// and the frontend. This file is client-safe (pure types + tiny helpers).

import type { CycleStepId, PromptStageId } from "@/lib/topology/agent-workflow";

export type TransferKind = "inference" | "data" | "control" | "report";

export type StepStatus = "pending" | "running" | "done" | "fail";

export type IterationStatus = "queued" | "running" | "done";

export type EngineMode = "idle" | "single" | "continuous";

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
  /** Payload size in bytes (UTF-8 of the transferred context). */
  bytes: number;
  /** For inference transfers: prompt chars / completion chars. */
  charsIn?: number;
  charsOut?: number;
  /** Short human-readable preview of the transferred context. */
  preview: string;
  /** Real duration of the operation that produced this transfer. */
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

/** One stage of the per-iteration prompt pipeline (crudo → XML). */
export interface PromptStageDTO {
  id: PromptStageId;
  chars: number;
  preview: string;
  ok: boolean;
  /** Real L2 latency for the transformation (absent for the raw prompt). */
  latencyMs?: number;
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
  /** Prompt pipeline (crudo → refinado → refactorizado → remasterizado → xml),
   *  filled progressively as the contextualization stages complete. */
  promptStages?: PromptStageDTO[] | null;
  /** The cold-start assumption declared by the arranque stage. */
  coldStart?: string | null;
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

export const TOPOLOGY_SERVICE_PORT = 3003;

/** socket.io connection endpoint through the caddy gateway. */
export const TOPOLOGY_SOCKET_URL = `/?XTransformPort=${TOPOLOGY_SERVICE_PORT}`;

export const EMPTY_KPI: KpiDTO = {
  iterationsTotal: 0,
  iterationsRunning: 0,
  iterationsCompleted: 0,
  stepsTotal: 0,
  stepsPerStage: {
    arranque: 0,
    refinar: 0,
    refactorizar: 0,
    remasterizar: 0,
    promptxml: 0,
    detectar: 0,
    analizar: 0,
    investigar: 0,
    corregir: 0,
    verificar: 0,
    criterios: 0,
    reportar: 0,
  },
  nodesActive: 0,
  nodesTotal: 0,
  activations: 0,
  deactivations: 0,
  transfersTotal: 0,
  bytesTotal: 0,
  transfersByKind: { inference: 0, data: 0, control: 0, report: 0 },
  inferencesTotal: 0,
  inferencesCharsIn: 0,
  inferencesCharsOut: 0,
  inferencesAvgLatencyMs: 0,
  inferencesErrors: 0,
  findingsOpen: 0,
  findingsResolved: 0,
  findingsTotal: 0,
  verdictsAgree: 0,
  verdictsDisagree: 0,
  verdictsMixed: 0,
  startedAt: Date.now(),
  lastActivityAt: Date.now(),
};
