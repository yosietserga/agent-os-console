// ════════════════════════════════════════════════════════════════════════
// types.ts — Contratos de datos del Agent OS (cero 'any', Fase 1 P-strict)
// ════════════════════════════════════════════════════════════════════════

export interface CardinalRuleDTO {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: "RED" | "YELLOW";
  category: string;
  order: number;
}

export interface CommandDefDTO {
  id: string;
  name: string;
  aliases: string;
  action: string;
  methodology: string;
  description: string;
  order: number;
}

export type MemoryType =
  | "ANTI_PATTERN"
  | "WIN"
  | "WORKLOG"
  | "FEEDBACK"
  | "USER"
  | "PROJECT"
  | "REFERENCE";

export interface MemoryEntryDTO {
  id: string;
  type: MemoryType;
  code: string | null;
  title: string;
  content: string;
  winClass: string | null;
  severity: string | null;
  epoch: number;
  createdAt: string;
}

export interface ReferenceRepoDTO {
  id: string;
  repo: string;
  category: string;
  role: string;
  description: string;
  stars: number;
  sizeKb: number;
  language: string | null;
  branch: string;
  topics: string[];
  topDirs: string[];
  keyFiles: { path: string; size: number }[];
  ghDescription: string | null;
  lastScannedAt: string;
}

export interface ScanRunDTO {
  id: string;
  mode: string;
  startedAt: string;
  finishedAt: string | null;
  reposScanned: number;
  totalStars: number;
  status: string;
  note: string | null;
}

export interface ExtractedPatternDTO {
  id: string;
  repo: string;
  category: string;
  pattern: string;
  evidence: string;
  createdAt: string;
}

export interface AdoptionProposalDTO {
  id: string;
  title: string;
  type: string;
  origin: string;
  description: string;
  status: "PROPOSED" | "EVALUATED" | "PROMOTED" | "REJECTED";
  d1: number | null;
  d2: number | null;
  d3: number | null;
  d4: number | null;
  d5: number | null;
  d6: number | null;
  deltaS: number | null;
  verdict: string | null;
  createdAt: string;
  evaluatedAt: string | null;
}

export interface PsimStateDTO {
  version: string;
  epoch: number;
  k1: number;
  k2: number;
  k3: number;
  k4: number;
  k5: number;
  w1: number;
  w2: number;
  w3: number;
  w4: number;
  w5: number;
  w6: number;
  w7: number;
  w8: number;
  updatedAt: string;
}

export interface L2ModelDTO {
  id: string;
  name: string;
  provider: string;
  tier: string;
  latencySlaMs: number;
  role: string;
  archetype: string;
  status: "CLOSED" | "OPEN" | "HALF_OPEN";
  failRate: number;
  samples: number;
}

export interface CostLedgerEntryDTO {
  id: string;
  model: string;
  tenant: string;
  purpose: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
  outcome: string;
  createdAt: string;
}

export interface CommandLogDTO {
  id: string;
  command: string;
  args: string | null;
  output: string;
  status: string;
  durationMs: number;
  createdAt: string;
}

export interface RadiografiaPhaseState {
  id: number;
  name: string;
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  detail: string;
}

export interface RadiografiaRunDTO {
  id: string;
  targetUrl: string;
  targetTitle: string | null;
  status: string;
  phase: number;
  phases: RadiografiaPhaseState[];
  brandTokens: BrandTokens | null;
  businessModel: BusinessModelXray | null;
  reconstruction: ReconstructionSpec | null;
  verification: VerificationVerdict | null;
  summary: string | null;
  tokensUsed: number;
  createdAt: string;
  completedAt: string | null;
}

export interface BrandTokens {
  palette: { token: string; hex: string; usage: string }[];
  typography: { element: string; family: string; weight: string }[];
  borderRadius: string;
  spacing: string;
  layoutPositions: string[];
  domHighlights: string[];
}

export interface BusinessModelXray {
  offer: string;
  pricingModel: string;
  plans: { name: string; price: string; features: string[] }[];
  valueProps: string[];
  distributionChannels: string[];
  porterHighlights: string[];
}

export interface ReconstructionSpec {
  components: { name: string; type: string; notes: string }[];
  normalizedTokens: string[];
  threeJs: { detected: boolean; evidence: string };
  apiContracts: string[];
}

export interface VerificationVerdict {
  verdict: "AGREE" | "DISAGREE" | "MIXED";
  criteria: { name: string; result: string }[];
  weaknesses: string[];
}

export interface ReportDTO {
  id: string;
  epoch: number;
  title: string;
  verdict: string;
  content: string;
  createdAt: string;
}

export interface OverviewDTO {
  epoch: number;
  rules: CardinalRuleDTO[];
  commands: CommandDefDTO[];
  memory: {
    antiPatterns: MemoryEntryDTO[];
    wins: MemoryEntryDTO[];
    worklog: MemoryEntryDTO[];
    feedback: MemoryEntryDTO[];
    project: MemoryEntryDTO[];
    reference: MemoryEntryDTO[];
    user: MemoryEntryDTO[];
  };
  repos: ReferenceRepoDTO[];
  scans: ScanRunDTO[];
  patterns: ExtractedPatternDTO[];
  proposals: AdoptionProposalDTO[];
  psim: PsimStateDTO | null;
  l2Models: L2ModelDTO[];
  ledger: CostLedgerEntryDTO[];
  commandLog: CommandLogDTO[];
  radiografiaRuns: RadiografiaRunDTO[];
  reports: ReportDTO[];
}

export interface CommandResultDTO {
  command: string;
  args: string | null;
  output: string;
  status: "OK" | "ERROR";
  durationMs: number;
  refresh: boolean;
  data?: Record<string, unknown>;
}
