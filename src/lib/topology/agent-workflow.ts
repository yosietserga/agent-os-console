// Living topology scenario: the Agent OS autonomous quality cycle.
// Nodes are the real organs of the agentic system (cold-start
// contextualization → prompt engineering pipeline → console → dispatcher →
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
  tagline:
    "Topología viva del workflow agéntico: arranque en frío, ingeniería de prompt, pasos, flujos, contextos e iteraciones en tiempo real",
  description:
    "Cada nodo es un órgano real del sistema agéntico. La capa de Contextualización asume cero conocimiento mutuo (ni el operador ni la IA saben nada del tema) y transforma el prompt crudo en un prompt maestro XML: refinar → refactorizar → remasterizar con las mejores prácticas de prompting. Luego el dispatcher, el sentinela, las 7 etapas del ciclo, L2, memoria, BD y reportes. Cada partícula es una transferencia de contexto real.",
  category: "custom",
  layers: [
    {
      id: 0,
      name: "Contextualización",
      description:
        "Arranque en frío (cero conocimiento mutuo) e ingeniería de prompt: refinar → refactorizar → remasterizar → XML",
      color: "#fb7185",
    },
    {
      id: 1,
      name: "Operación",
      description: "Operador, consola y gateway de API",
      color: "#a78bfa",
    },
    {
      id: 2,
      name: "Orquestación",
      description: "Dispatcher, sentinela y juez PRE-v2.0",
      color: "#22d3ee",
    },
    {
      id: 3,
      name: "Ciclo Autónomo",
      description:
        "Las 7 etapas: detectar → analizar → investigar → corregir → verificar → criterios → reportar",
      color: "#34d399",
    },
    {
      id: 4,
      name: "Inferencia & Memoria",
      description: "L2 Control Plane, memoria empírica P9, BD SQLite y reportes époch",
      color: "#fbbf24",
    },
  ],
  nodes: [
    // ── Layer 0: Contextualización ────────────────────────────────────
    n(
      "arranque",
      "Arranque en Frío",
      "FR",
      "process",
      0,
      12,
      40,
      0.1,
      ["cero", "vacío"],
      "Asume cero conocimiento mutuo: el operador no sabe nada del tema y la IA tampoco — el vacío de contexto se declara antes de operar"
    ),
    n(
      "refinar",
      "Refinar",
      "REF",
      "process",
      0,
      14,
      60,
      0.2,
      ["prompt", "claridad"],
      "Refina el prompt crudo: elimina ambigüedad y explicita la intención real (inferencia L2 real)"
    ),
    n(
      "refactorizar",
      "Refactorizar",
      "RFA",
      "process",
      0,
      13,
      65,
      0.2,
      ["prompt", "estructura"],
      "Reestructura el prompt en rol, contexto, tarea, restricciones y formato de salida (inferencia L2 real)"
    ),
    n(
      "remasterizar",
      "Remasterizar",
      "RMS",
      "process",
      0,
      12,
      75,
      0.22,
      ["prompt", "prácticas"],
      "Aplica las mejores prácticas de prompting: razonamiento paso a paso, criterios verificables, ejemplo y guardas (inferencia L2 real)"
    ),
    n(
      "promptxml",
      "Prompt XML",
      "XML",
      "process",
      0,
      11,
      70,
      0.2,
      ["xml", "maestro"],
      "Convierte el prompt remasterizado a formato XML: el prompt maestro que gobierna toda la iteración (inferencia L2 real)"
    ),
    // ── Layer 1: Operación ───────────────────────────────────────────
    n("operador", "Operador", "OP", "user", 1, 6, 40, 0.05, ["humano", "cli"], "Operador humano que invoca comandos canónicos"),
    n("consola", "Consola", "UI", "client", 1, 14, 60, 0.12, ["frontend", "tabs"], "Consola web Agent OS (ruta única /)"),
    n("api", "API Gateway", "API", "gateway", 1, 18, 45, 0.18, ["next", "rest"], "API routes /api/agent-os/*"),
    // ── Layer 2: Orquestación ────────────────────────────────────────
    n("dispatcher", "Dispatcher", "DSP", "coordinator", 2, 22, 35, 0.22, ["parse", "route"], "parseCommand: canónicos, aliases, prefijo IDE"),
    n("sentinela", "Sentinela", "SENT", "coordinator", 2, 16, 55, 0.2, ["vigila", "ciclo"], "Comando vigila: detecta fallas y abre ciclos"),
    n("juez", "Juez PRE", "JZ", "service", 2, 8, 120, 0.15, ["d1-d6", "δs≥5"], "Juez determinista PRE-v2.0 (ΔS, regresiones, σ)"),
    // ── Layer 3: Ciclo Autónomo (7 etapas) ──────────────────────────
    n("detectar", "Detectar", "DT", "process", 3, 20, 80, 0.3, ["scan", "f1"], "F1: escanea CommandLog, runs y ledger en busca de fallas"),
    n("analizar", "Analizar", "AN", "process", 3, 18, 70, 0.28, ["causa", "f2"], "F2: clasifica la causa raíz por firma determinista"),
    n("investigar", "Investigar", "INV", "process", 3, 16, 95, 0.32, ["memoria", "l2"], "F3: consulta memoria empírica e inferencia L2 con el prompt maestro XML"),
    n("corregir", "Corregir", "FIX", "process", 3, 14, 75, 0.26, ["plan", "f4"], "F4: construye el plan de corrección (3 roles §4.2)"),
    n("verificar", "Verificar", "VER", "process", 3, 15, 85, 0.3, ["gate", "f5"], "F5: re-ejecuta con exit code real (gate-honesty)"),
    n("criterios", "Criterios", "CRI", "process", 3, 10, 65, 0.22, ["gaps", "f6"], "F6: criterios posteriores (gaps-finder, CAs, integridad)"),
    n("reportar", "Reportar", "REP", "process", 3, 12, 110, 0.24, ["époch", "f7"], "F7: reporte inmutable + worklog append-only P9"),
    // ── Layer 4: Inferencia & Memoria ───────────────────────────────
    n("l2glm", "L2 Control Plane", "L2", "service", 4, 24, 1400, 0.45, ["glm", "chat"], "Inferencia real vía z-ai-web-dev-sdk (GLM)"),
    n("memoria", "Memoria P9", "MEM", "storage", 4, 20, 25, 0.15, ["ap", "win"], "Ledgers append-only: APs, WINs, worklog"),
    n("bd", "BD SQLite", "BD", "data", 4, 26, 18, 0.2, ["prisma"], "findings, ciclos, command log, ledger"),
    n("reportes", "Reportes Époch", "DOC", "sink", 4, 9, 30, 0.1, ["md", "inmutable"], "docs/reports inmutables con AGREE/DISAGREE"),
  ],
  links: [
    // Trigger chain: operator → console → api → cold start
    l("operador", "consola", 0.5, "control"),
    l("consola", "api", 0.7, "request"),
    l("api", "arranque", 0.8, "request"),
    // Prompt engineering pipeline (each stage is a REAL L2 inference)
    l("arranque", "refinar", 0.7, "stream"),
    l("refinar", "l2glm", 0.9, "request"),
    l("l2glm", "refinar", 0.9, "response"),
    l("refinar", "refactorizar", 0.7, "stream"),
    l("refactorizar", "l2glm", 0.9, "request"),
    l("l2glm", "refactorizar", 0.9, "response"),
    l("refactorizar", "remasterizar", 0.7, "stream"),
    l("remasterizar", "l2glm", 0.9, "request"),
    l("l2glm", "remasterizar", 0.9, "response"),
    l("remasterizar", "promptxml", 0.7, "stream"),
    l("promptxml", "l2glm", 0.9, "request"),
    l("l2glm", "promptxml", 0.9, "response"),
    // Master XML prompt enters orchestration
    l("promptxml", "dispatcher", 0.8, "request"),
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
    // Stage: investigar (memory + REAL LLM inference driven by the XML master prompt)
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

/**
 * The full 12-stage iteration pipeline: 5 stages of contextualization
 * (cold start + prompt engineering) followed by the 7 stages of the
 * autonomous quality cycle, in execution order.
 */
export const CYCLE_STEPS = [
  "arranque",
  "refinar",
  "refactorizar",
  "remasterizar",
  "promptxml",
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
  arranque: "Arranque en Frío",
  refinar: "Refinar",
  refactorizar: "Refactorizar",
  remasterizar: "Remasterizar",
  promptxml: "Prompt XML",
  detectar: "Detectar",
  analizar: "Analizar",
  investigar: "Investigar",
  corregir: "Corregir",
  verificar: "Verificar",
  criterios: "Criterios",
  reportar: "Reportar",
};

/** Layer display names, indexed by layer id (kept in sync with the scenario). */
export const LAYER_NAMES = AGENT_WORKFLOW_SCENARIO.layers.map((layer) => layer.name);

/** The 5 prompt-pipeline stages tracked per iteration (crudo → XML). */
export const PROMPT_STAGE_IDS = ["crudo", "refinado", "refactorizado", "remasterizado", "xml"] as const;

export type PromptStageId = (typeof PROMPT_STAGE_IDS)[number];

export const PROMPT_STAGE_LABELS: Record<PromptStageId, string> = {
  crudo: "Prompt Crudo",
  refinado: "Refinado",
  refactorizado: "Refactorizado",
  remasterizado: "Remasterizado",
  xml: "Prompt XML",
};
