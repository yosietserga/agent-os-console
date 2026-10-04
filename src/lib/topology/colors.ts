// Palette + metric helpers for the living topology canvas.
// Ported from yosietserga/living-topology-visualizer, extended with
// context-transfer particle colors for the agentic workflow.

import type { LinkKind, NodeStatus } from "./types";

/** Layer accent colors keyed by layer id. */
export const LAYER_COLORS = ["#fb7185", "#a78bfa", "#22d3ee", "#34d399", "#fbbf24"] as const;

export const STATUS_COLORS: Record<NodeStatus, string> = {
  healthy: "#34d399",
  degraded: "#fbbf16",
  down: "#ef4444",
};

export const STATUS_GLOW: Record<NodeStatus, string> = {
  healthy: "rgba(52,211,153,0.55)",
  degraded: "rgba(249,115,22,0.6)",
  down: "rgba(239,68,68,0.7)",
};

export const LINK_COLORS: Record<LinkKind, string> = {
  request: "rgba(34,211,238,0.35)",
  response: "rgba(167,139,250,0.35)",
  replication: "rgba(251,191,36,0.35)",
  cache: "rgba(52,211,153,0.35)",
  stream: "rgba(56,189,248,0.4)",
  control: "rgba(148,163,184,0.25)",
};

export const PARTICLE_COLORS: Record<LinkKind, string> = {
  request: "#67e8f9",
  response: "#c4b5fd",
  replication: "#fcd34d",
  cache: "#6ee7b7",
  stream: "#7dd3fc",
  control: "#cbd5e1",
};

/** Agentic extension: particle colors per context-transfer kind. */
export const TRANSFER_COLORS = {
  inference: "#c4b5fd", // violet — LLM inference transfers
  data: "#67e8f9", // cyan — DB / data reads
  control: "#cbd5e1", // slate — orchestration commands
  report: "#6ee7b7", // green — report / memory writes
} as const;

export const TRANSFER_LABELS = {
  inference: "Inferencia",
  data: "Datos",
  control: "Control",
  report: "Reporte",
} as const;

/** Derive a node's live status from its live metrics. */
export function deriveStatus(
  errorRate: number,
  cpu: number,
  latencyMs: number,
  baselineLatency: number
): NodeStatus {
  if (errorRate > 0.08 || cpu > 0.96 || latencyMs > baselineLatency * 4) return "down";
  if (errorRate > 0.02 || cpu > 0.82 || latencyMs > baselineLatency * 2) return "degraded";
  return "healthy";
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Random walk helper that nudges a value toward a target with bounded noise. */
export function drift(
  current: number,
  baseline: number,
  volatility: number,
  stress: number
): number {
  const pull = (baseline - current) * 0.05;
  const noise = (Math.random() - 0.5) * volatility * baseline * (1 + stress);
  return Math.max(0, current + pull + noise);
}

export function formatRps(rps: number): string {
  if (rps >= 1000) return `${(rps / 1000).toFixed(1)}k`;
  return `${Math.round(rps)}`;
}

export function formatPct(v: number): string {
  return `${(v * 100).toFixed(v < 0.1 ? 2 : 1)}%`;
}

export function formatBytes(v: number): string {
  if (v >= 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`;
  if (v >= 1024) return `${(v / 1024).toFixed(1)} KB`;
  return `${Math.round(v)} B`;
}
