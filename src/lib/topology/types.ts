// Core type definitions for the living topology visualizer.
// Ported from yosietserga/living-topology-visualizer and extended with
// live agentic-workflow fields (active nodes, activations, iterations).

export type LayerId = 0 | 1 | 2 | 3;

export type NodeStatus = "healthy" | "degraded" | "down";

export type LinkKind =
  | "request"
  | "response"
  | "replication"
  | "cache"
  | "stream"
  | "control";

export interface TopologyNode {
  id: string;
  label: string;
  /** Short 1-3 char glyph rendered inside the node circle. */
  glyph: string;
  /** Semantic kind, drives icon/coloring hints. */
  kind:
    | "client"
    | "gateway"
    | "service"
    | "data"
    | "user"
    | "edge"
    | "origin"
    | "coordinator"
    | "shard"
    | "storage"
    | "source"
    | "ingest"
    | "process"
    | "sink";
  layer: LayerId;
  /** Baseline requests-per-second flowing through this node. */
  rps: number;
  /** Baseline latency in milliseconds. */
  latencyMs: number;
  /** Baseline error rate, 0..1. */
  errorRate: number;
  /** Baseline CPU utilization, 0..1. */
  cpu: number;
  /** Capability tags shown in the inspector. */
  tags: string[];
  status: NodeStatus;
  /** Agentic extension: operational role of this organ (inspector copy). */
  role?: string;
}

export interface TopologyLink {
  id: string;
  source: string;
  target: string;
  /** Relative throughput weight (0..1) controlling particle spawn rate. */
  throughput: number;
  kind: LinkKind;
}

export interface ScenarioLayer {
  id: LayerId;
  name: string;
  description: string;
  /** Hex color used for the layer accent. */
  color: string;
}

export interface Scenario {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Coarse grouping used for filtering / preset galleries. */
  category:
    | "business"
    | "marketing"
    | "infrastructure"
    | "data"
    | "cdn"
    | "database"
    | "custom";
  layers: ScenarioLayer[];
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export type ViewMode = "orbit" | "funnel";

export interface LiveNode extends TopologyNode {
  /** Current animated x / y (eased toward targetX/targetY each frame). */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Layout target the node eases toward (orbit ring / funnel column). */
  targetX: number;
  targetY: number;
  /** Live (mutated) metrics, decoupled from the baseline. */
  liveRps: number;
  liveLatencyMs: number;
  liveErrorRate: number;
  liveCpu: number;
  liveStatus: NodeStatus;
  /** Pulse intensity 0..1, decays over time, spikes on activity. */
  pulse: number;
  /** Agentic extension: organ currently executing (live mode). */
  active?: boolean;
}

export interface LiveLink extends TopologyLink {
  sourceNode: LiveNode;
  targetNode: LiveNode;
}

export interface TopologyEvent {
  id: number;
  ts: number;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

export interface LayerMetric {
  layer: LayerId;
  rps: number;
  avgLatencyMs: number;
  errorRate: number;
  load: number; // 0..1 average cpu
}

export interface AggregateMetrics {
  totalRps: number;
  avgLatencyMs: number;
  errorRate: number;
  activeNodes: number;
  degradedNodes: number;
  downNodes: number;
  packetsInFlight: number;
  layers: LayerMetric[];
}
