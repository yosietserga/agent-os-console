// Living topology scenario: the Agent OS autonomous quality cycle.
// Nodes are the real organs of the agentic system (console → dispatcher →
// sentinel cycle → L2 inference & memory) and links are the context flows
// between them. Link ids are `${source}->${target}` so the live engine can
// reference them deterministically when a context transfer happens.

import type { Scenario, TopologyLink, TopologyNode } from "./types";

const n = (
  id: string,
  label: string,
  glyph: string,
  kind: TopologyNode["kind"],
  layer: TopologyNode["layer"],
  rps: number,
  latencyMs: number,
  cpu: number,
  tags: string[],
  role: string
): TopologyNode => ({
  id,
  label,
  glyph,
  kind,
  layer,
  rps,
  latencyMs,
  errorRate: 0.004,
  cpu,
  tags,
  status: "healthy",
  role,
});

const l = (
  source: string,
  target: string,
  throughput: number,
  kind: TopologyLink["kind"]
): TopologyLink => ({
  id: `${source}->${target}`,
  source,
  target,
  throughput,
  kind,
});

export const AGENT_WORKFLOW_SCENARIO: Scenario = {
  id: "agent-os-ciclo-autonomo",
  name: "Agent OS — Ciclo Autónomo de Calidad",
  tagline: "Topología viva del workflow agéntico: pasos, flujos, contextos e iteraciones en tiempo real",
  description:
    "Cada nodo es un órgano real del sistema agéntico (consola, dispatcher, sentinela, las 7 etapas del ciclo, L2, memoria, BD y reportes). Cada partícula es una transferencia de contexto real: comandos de control, lecturas de datos, transferencias de inferencia LLM y escrituras de reporte. Las iteraciones del ciclo se ejecutan con datos reales de la BD.",
  category: "custom",
  layers: [
    {
      id: 0,
      name: "Operación",
      description: "Operador, consola y gateway de API",
      color: "#a78bfa",
    },
    {
      id: 1,
      name: "Orquestación",
      description: "Dispatcher, sentinela y juez PRE-v2.0",
      color: "#22d3ee",
    },
    {
      id: 2,
      name: "Ciclo Autónomo",
      description: "Las 7 etapas: detectar → analizar → investigar → corregir → verificar → criterios → reportar",
      color: "#34d399",
    },
    {
      id: 3,
      name: "Inferencia & Memoria",
      description: "L2 Control Plane, memoria empírica P9, BD SQLite y reportes époch",
      color: "#fbbf24",
    },
  ],
  nodes: [
    // ── Layer 0: Operación ───────────────────────────────────────────
    n("operador", "Operador", "OP", "user", 0, 6, 40, 0.05, ["humano", "cli"], "Operador humano que invoca comandos canónicos"),
    n("consola", "Consola", "UI", "client", 0, 14, 60, 0.12, ["frontend", "tabs"], "Consola web Agent OS (ruta única /)"),
    n("api", "API Gateway", "API", "gateway", 0, 18, 45, 0.18, ["next", "rest"], "API routes /api/agent-os/*"),
    // ── Layer 1: Orquestación ────────────────────────────────────────
    n("dispatcher", "Dispatcher", "DSP", "coordinator", 1, 22, 35, 0.22, ["parse", "route"], "parseCommand: canónicos, aliases, prefijo IDE"),
    n("sentinela", "Sentinela", "SENT", "coordinator", 1, 16, 55, 0.2, ["vigila", "ciclo"], "Comando vigila: detecta fallas y abre ciclos"),
    n("juez", "Juez PRE", "JZ", "service", 1, 8, 120, 0.15, ["d1-d6", "δs≥5"], "Juez determinista PRE-v2.0 (ΔS, regresiones, σ)"),
    // ── Layer 2: Ciclo Autónomo (7 etapas) ──────────────────────────
    n("detectar", "Detectar", "DT", "process", 2, 20, 80, 0.3, ["scan", "f1"], "F1: escanea CommandLog, runs y ledger en busca de fallas"),
    n("analizar", "Analizar", "AN", "process", 2, 18, 70, 0.28, ["causa", "f2"], "F2: clasifica la causa raíz por firma determinista"),
    n("investigar", "Investigar", "INV", "process", 2, 16, 95, 0.32, ["memoria", "l2"], "F3: consulta memoria empírica e inferencia L2"),
    n("corregir", "Corregir", "FIX", "process", 2, 14, 75, 0.26, ["plan", "f4"], "F4: construye el plan de corrección (3 roles §4.2)"),
    n("verificar", "Verificar", "VER", "process", 2, 15, 85, 0.3, ["gate", "f5"], "F5: re-ejecuta con exit code real (gate-honesty)"),
    n("criterios", "Criterios", "CRI", "process", 2, 10, 65, 0.22, ["gaps", "f6"], "F6: criterios posteriores (gaps-finder, CAs, integridad)"),
    n("reportar", "Reportar", "REP", "process", 2, 12, 110, 0.24, ["époch", "f7"], "F7: reporte inmutable + worklog append-only P9"),
    // ── Layer 3: Inferencia & Memoria ───────────────────────────────
    n("l2glm", "L2 Control Plane", "L2", "service", 3, 24, 1400, 0.45, ["glm", "chat"], "Inferencia real vía z-ai-web-dev-sdk (GLM)"),
    n("memoria", "Memoria P9", "MEM", "storage", 3, 20, 25, 0.15, ["ap", "win"], "Ledgers append-only: APs, WINs, worklog"),
    n("bd", "BD SQLite", "BD", "data", 3, 26, 18, 0.2, ["prisma"], "findings, ciclos, command log, ledger"),
    n("reportes", "Reportes Époch", "DOC", "sink", 3, 9, 30, 0.1, ["md", "inmutable"], "docs/reports inmutables con AGREE/DISAGREE"),
  ],
  links: [
    // Trigger chain
    l("operador", "consola", 0.5, "control"),
    l("consola", "api", 0.7, "request"),
    l("api", "dispatcher", 0.8, "request"),
    l("dispatcher", "sentinela", 0.6, "control"),
    l("dispatcher", "juez", 0.3, "request"),
    l("juez", "memoria", 0.3, "cache"),
    // Sentinel scan → detect
    l("sentinela", "detectar", 0.7, "control"),
    // Stage: detectar (real DB reads)
    l("detectar", "bd", 0.8, "cache"),
    l("bd", "detectar", 0.8, "response"),
    l("detectar", "analizar", 0.7, "stream"),
    // Stage: analizar
    l("analizar", "investigar", 0.7, "stream"),
    // Stage: investigar (memory + REAL LLM inference)
    l("investigar", "memoria", 0.5, "cache"),
    l("memoria", "investigar", 0.5, "response"),
    l("investigar", "l2glm", 0.9, "request"),
    l("l2glm", "investigar", 0.9, "response"),
    // Stage: corregir
    l("investigar", "corregir", 0.6, "stream"),
    l("corregir", "verificar", 0.6, "stream"),
    // Stage: verificar
    l("verificar", "bd", 0.5, "cache"),
    l("bd", "verificar", 0.5, "response"),
    l("verificar", "criterios", 0.5, "stream"),
    // Stage: criterios
    l("criterios", "memoria", 0.4, "cache"),
    l("memoria", "criterios", 0.4, "response"),
    l("criterios", "reportar", 0.5, "stream"),
    // Stage: reportar (second REAL inference + writes)
    l("reportar", "l2glm", 0.7, "request"),
    l("l2glm", "reportar", 0.7, "response"),
    l("reportar", "reportes", 0.6, "replication"),
    l("reportar", "memoria", 0.3, "cache"),
    // Cycle result back to operator
    l("sentinela", "consola", 0.4, "response"),
  ],
};

/** The 7 stages of the autonomous quality cycle, in execution order. */
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

export const STEP_LABELS: Record<CycleStepId, string> = {
  detectar: "Detectar",
  analizar: "Analizar",
  investigar: "Investigar",
  corregir: "Corregir",
  verificar: "Verificar",
  criterios: "Criterios",
  reportar: "Reportar",
};
