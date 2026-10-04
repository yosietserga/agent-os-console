// ════════════════════════════════════════════════════════════════════════
// assets.ts — Fuente de archivos universales del boilerplate agent-os
// (copiado en assets/agent-os-boilerplate, v1.10 con Protocolo 11).
// Regla P2: la lista es determinista (mismos archivos siempre) y P8:
// el scaffold es LLM-agnóstico — la constitución no se reescribe, se
// instancia: estructura inmutable + contenido hiper-optimizado (Protocolo 11,
// Fase 2: "todo el andamiaje mantiene la estructura inmutable de AGENTS.md").
// ════════════════════════════════════════════════════════════════════════
import { readdirSync, readFileSync } from "fs";
import path from "path";
import type { BootstrapSpec } from "./types";

export const BOILERPLATE_DIR = path.join(process.cwd(), "assets", "agent-os-boilerplate");

/** Archivos raíz copiados verbatim (contratos, licencias, configuración). */
const STATIC_ROOT_FILES = [
  ".aider.conf.yml",
  ".env.example",
  ".gitattributes",
  ".gitignore",
  "LICENSE",
] as const;

/** Subdirectorios de docs/ copiados íntegros (gobernanza universal). */
const STATIC_DOCS_DIRS = [
  "ci-workflows",
  "governance",
  "ide-integrations",
  "l2-control-plane",
  "patterns",
  "polyglot",
  "reverse-engineering",
  "security",
  "widgets",
] as const;

/**
 * Puentes IDE (Auto-Activation Layer): se copian con inyección de proyecto
 * (Protocolo 11, Fase 3: todo prompt del operador pasa automáticamente por
 * el workflow agéntico completo — el usuario ya no referencia AGENTS.md).
 */
export const BRIDGE_FILES = [
  ".antigravity/rules/agent-os.md",
  ".clinerules",
  ".cursor/rules/agent-os.mdc",
  ".cursorrules",
  ".github/copilot-instructions.md",
  ".roo/rules/agent-os.md",
  ".trae/rules/agent-os.md",
  ".windsurfrules",
  ".zcode/rules/agent-os.md",
  "CLAUDE-CODE.md",
  "CLAUDE.md",
  "CODEX.md",
  "COPILOT-INSTRUCTIONS.md",
  "CURSOR-RULES.md",
  "GEMINI.md",
  "opencode.md",
] as const;

/** Recorrido recursivo determinista del árbol de assets. */
function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/** ¿El archivo relativo pertenece al conjunto estático universal? */
function isStatic(rel: string): boolean {
  if ((STATIC_ROOT_FILES as readonly string[]).includes(rel)) return true;
  if (rel.startsWith(".github/")) return rel === ".github/PULL_REQUEST_TEMPLATE.md"; // copilot-instructions va como bridge
  const [root, second] = rel.split("/");
  if (root === "docs") {
    if (second && (STATIC_DOCS_DIRS as readonly string[]).includes(second)) return true;
    if (rel === "docs/expected/.gitkeep") return true;
    if (rel === "docs/memory/anti-patterns.md") return true; // memoria empírica universal heredada (P9)
    if (rel === "docs/reports/README.md") return true;
    if (rel === "docs/personas/README.md") return true; // convención; las 10 personas se generan (LLM)
    return false; // catalogs / personas / prompts / research / memory-init → LLM o template
  }
  if (root === "mcp" && (second === "servers" || second === "skills")) return true;
  if (root === "scripts") return true;
  if (root === "packages") return true;
  return false;
}

/** Lee un archivo del boilerplate (relativo a la raíz de assets). */
export function readAsset(rel: string): string {
  return readFileSync(path.join(BOILERPLATE_DIR, rel), "utf8");
}

/** Lista determinista de archivos estáticos universales → contenido. */
export function collectStaticFiles(): Map<string, string> {
  const out = new Map<string, string>();
  for (const abs of walk(BOILERPLATE_DIR)) {
    const rel = path.relative(BOILERPLATE_DIR, abs).split(path.sep).join("/");
    if (isStatic(rel)) out.set(rel, readFileSync(abs, "utf8"));
  }
  return out;
}

/**
 * Inyecta el bloque de proyecto instanciado en un puente IDE, justo después
 * del bloque de cita inicial (el encabezado con ">" que todos los puentes
 * comparten). Garantiza que el IDE sepa a qué proyecto pertenece la capa.
 */
export function bridgeContent(base: string, spec: BootstrapSpec): string {
  const lines = base.split("\n");
  let insertAt = 1; // por defecto: tras la primera línea (heading)
  let i = 1;
  // localizar el bloque de cita contiguo que sigue al heading
  while (i < lines.length && lines[i].trim() === "") i++;
  const quoteStart = i;
  while (i < lines.length && lines[i].startsWith(">")) i++;
  if (i > quoteStart) insertAt = i; // fin del bloque de cita
  const block = [
    "",
    `> **PROYECTO INSTANCIADO:** ${spec.projectName} — ${spec.oneLiner}`,
    "> Contexto completo del dominio, goals y roles: sección \"Contexto del",
    "> Proyecto Instanciado\" de `AGENTS.md`. Todo prompt de este proyecto pasa",
    "> automáticamente por el workflow agéntico completo (Protocolo 11, Fase 3).",
    "",
  ];
  lines.splice(insertAt, 0, ...block);
  return lines.join("\n");
}

/**
 * Ensambla el AGENTS.md instanciado: constitución inmutable + línea de
 * proyecto en el encabezado + sección "Contexto del Proyecto Instanciado"
 * (generada por LLM en la spec) insertada tras el primer separador `---`.
 */
export function assembleAgentsMd(spec: BootstrapSpec, generatedAtIso: string): string {
  const base = readAsset("AGENTS.md");
  const date = generatedAtIso.slice(0, 10);
  const projectLines = [
    `> **PROYECTO INSTANCIADO:** ${spec.projectName} — ${spec.oneLiner}`,
    `> Instanciado por el Instanciador Zero-Shot (Protocolo 11) el ${date}.`,
  ];
  let out = base.replace(/^(\*\*Versión:\*\*.*)$/m, `${projectLines.join("\n")}\n> $1`);
  if (out === base) {
    // fallback: inyectar antes del cierre del encabezado
    out = base.replace(/^---$/m, `${projectLines.join("\n")}\n\n---`);
  }
  const section = [
    "## Contexto del Proyecto Instanciado (Protocolo 11)",
    "",
    spec.agentsContextSection.trim(),
    "",
  ].join("\n");
  const firstSep = out.indexOf("\n---\n");
  if (firstSep === -1) return `${out}\n\n${section}`;
  const at = firstSep + "\n---\n".length;
  return `${out.slice(0, at)}\n${section}${out.slice(at)}`;
}
