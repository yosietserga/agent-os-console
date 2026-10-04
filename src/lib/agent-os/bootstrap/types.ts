// ════════════════════════════════════════════════════════════════════════
// types.ts — DTOs del Instanciador Zero-Shot (Protocolo 11 del boilerplate
// agent-os v1.10: convierte un prompt crudo del operador en el scaffold
// completo de condicionamiento conductual: AGENTS.md + derivados + ZIP).
// ════════════════════════════════════════════════════════════════════════

/** Origen de cada archivo del scaffold instanciado. */
export type FileOrigin = "llm" | "template" | "static";

export interface BootstrapFileDTO {
  path: string;
  bytes: number;
  origin: FileOrigin;
  phase: string | null;
}

/** Spec estructurada derivada del prompt crudo (Fase 1: investigate + plan). */
export interface BootstrapSpec {
  projectName: string;
  slug: string;
  domain: string;
  oneLiner: string;
  description: string;
  targetUsers: string[];
  expertRoles: { role: string; focus: string }[];
  /** Goals derivados del prompt inicial (semilla del bucle goal-driven). */
  goals: string[];
  stack: string[];
  risks: string[];
  securityNotes: string[];
  /** Prompt crudo refactorizado con etiquetas XML (<context>, <core_features>...). */
  xmlPrompt: string;
  /** Mapeo persona del boilerplate → rol del dominio (ej. analyst → Auditor Médico). */
  personaMapping: Record<string, string>;
  /** Sección markdown "Contexto del Proyecto Instanciado" para AGENTS.md. */
  agentsContextSection: string;
}

export interface ResearchItem {
  query: string;
  results: { title: string; url: string; snippet: string }[];
}

/** DTO completo de un run (consumido por el instanciador en el cliente). */
export interface BootstrapRunDTO {
  id: string;
  prompt: string;
  projectName: string | null;
  slug: string | null;
  status: string;
  progress: number;
  phaseDetail: string | null;
  fileCount: number;
  llmCalls: number;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
  spec: BootstrapSpec | null;
  research: ResearchItem[] | null;
  files: BootstrapFileDTO[];
}

/** Resumen para la lista de historial. */
export interface BootstrapRunSummary {
  id: string;
  projectName: string | null;
  status: string;
  progress: number;
  fileCount: number;
  llmCalls: number;
  durationMs: number | null;
  createdAt: string;
}

export const BOOTSTRAP_ACTIVE_STATUSES = [
  "PENDING",
  "RESEARCHING",
  "PLANNING",
  "GENERATING",
  "VERIFYING",
  "PACKAGING",
] as const;

export function isBootstrapActive(status: string): boolean {
  return (BOOTSTRAP_ACTIVE_STATUSES as readonly string[]).includes(status);
}
