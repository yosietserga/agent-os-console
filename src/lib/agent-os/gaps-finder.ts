// ════════════════════════════════════════════════════════════════════════
// gaps-finder.ts — Comando canónico 17º (v1.8.0, BP #128, mandatorio §8.2)
// Detecta desincronizaciones entre la constitución cargada en la DB del
// console, el boilerplate upstream (yosietserga/agent-os-boilerplate) y los
// ledgers. 15 checks con severidad critical/high/medium/low.
// CRITICAL/HIGH bloquean el commit hasta corregirse.
// ════════════════════════════════════════════════════════════════════════
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";

const REF_ROOT = process.env.AGENT_OS_REF_PATH ?? "/home/z/agent-os-ref";

export interface Gap {
  check: number;
  category: string;
  severity: "OK" | "critical" | "high" | "medium" | "low";
  description: string;
}

export interface GapsFinderResult {
  gaps: Gap[];
  critical: number;
  high: number;
  medium: number;
  low: number;
  ok: number;
  commitBlocked: boolean;
  upstreamVersion: string;
  dbVersion: string;
}

async function readText(rel: string): Promise<string | null> {
  try {
    return await readFile(join(REF_ROOT, rel), "utf-8");
  } catch {
    return null;
  }
}

async function countDirs(rel: string): Promise<number | null> {
  try {
    const entries = await readdir(join(REF_ROOT, rel), { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).length;
  } catch {
    return null;
  }
}

async function countMcpServers(): Promise<number | null> {
  try {
    // Estructura upstream v1.8.0: mcp/servers/*.mcp.json
    const entries = await readdir(join(REF_ROOT, "mcp", "servers"), { withFileTypes: true });
    return entries.filter((e) => e.isFile() && e.name.endsWith(".mcp.json")).length;
  } catch {
    return null;
  }
}

async function countPersonas(): Promise<number | null> {
  // Estructura upstream: docs/personas/*.md (sin README) + docs/personas/cold-run/*.md
  try {
    const root = await readdir(join(REF_ROOT, "docs", "personas"), { withFileTypes: true });
    const rootMd = root.filter((e) => e.isFile() && e.name.endsWith(".md") && e.name !== "README.md").length;
    let coldRunMd = 0;
    try {
      const cr = await readdir(join(REF_ROOT, "docs", "personas", "cold-run"), { withFileTypes: true });
      coldRunMd = cr.filter((e) => e.isFile() && e.name.endsWith(".md")).length;
    } catch { /* sin cold-run */ }
    return rootMd + coldRunMd;
  } catch {
    return null;
  }
}

interface UpstreamState {
  version?: string;
  canonical_commands_count?: number;
  cardinal_rules_count?: number;
  anti_patterns_documented?: number;
  personas_documented?: number;
  mcp_servers_count?: number;
  mcp_skills_count?: number;
  psim_wins_count?: { total?: number };
  gaps_finder_checks_count?: number;
}

export async function runGapsFinder(): Promise<GapsFinderResult> {
  const gaps: Gap[] = [];
  let critical = 0, high = 0, medium = 0, low = 0, ok = 0;

  const push = (check: number, category: string, severity: Gap["severity"], description: string) => {
    gaps.push({ check, category, severity, description });
    if (severity === "OK") ok++;
    else if (severity === "critical") critical++;
    else if (severity === "high") high++;
    else if (severity === "medium") medium++;
    else low++;
  };

  // ── Datos locales (DB del console) ──
  const [dbCommands, dbRules, dbAps, dbWins, dbPersonasWorklog, psim] = await Promise.all([
    db.commandDef.count(),
    db.cardinalRule.count(),
    db.memoryEntry.count({ where: { type: "ANTI_PATTERN" } }),
    db.memoryEntry.count({ where: { type: "WIN" } }),
    db.memoryEntry.count({ where: { type: "WORKLOG" } }),
    db.psimState.findFirst({ orderBy: { updatedAt: "desc" } }),
  ]);
  const dbVersion = psim?.version ?? "—";

  // ── Datos upstream (repo de referencia) ──
  const agentsMd = await readText("AGENTS.md");
  const stateRaw = await readText("docs/memory/state.json");
  const readme = await readText("README.md");
  const apsMd = await readText("docs/memory/anti-patterns.md");
  const winsMd = await readText("docs/memory/wins-ledger.md");
  const prTemplate = await readText(".github/PULL_REQUEST_TEMPLATE.md");
  const bpCatalog = await readText("docs/catalogs/100-best-practices.md");

  const upstreamState: UpstreamState = stateRaw ? JSON.parse(stateRaw) as UpstreamState : {};
  const upstreamVersion = upstreamState.version ?? "—";

  // Si no hay repo de referencia accesible, todos los checks upstream degradan
  const hasUpstream = agentsMd !== null;

  // CHECK 1 — Comandos canónicos: DB vs AGENTS.md (filas + alias rayos-x) vs state.json
  {
    // La tabla de comandos vive entre "Sintaxis universal" y "Los scripts correspondientes"
    const section = hasUpstream
      ? agentsMd!.slice(agentsMd!.indexOf("Sintaxis universal"), agentsMd!.indexOf("Los scripts correspondientes"))
      : null;
    const tableRows = section ? (section.match(/^\| `[^`]+`/gm) ?? []).length : null;
    const upstreamPaths = tableRows !== null ? tableRows + 1 : null; // + alias rayos-x
    const stateCount = upstreamState.canonical_commands_count;
    if (!hasUpstream || tableRows === null) {
      push(1, "comandos-scripts", "medium", `Tabla de comandos no legible en AGENTS.md (repo ${REF_ROOT})`);
    } else if (dbCommands === upstreamPaths && (stateCount === undefined || upstreamPaths === stateCount)) {
      push(1, "comandos-scripts", "OK", `DB ${dbCommands} = tabla AGENTS.md ${tableRows} filas + alias rayos-x = state.json ${stateCount}`);
    } else {
      push(1, "comandos-scripts", "critical", `DB ${dbCommands} ≠ upstream ${upstreamPaths} (tabla ${tableRows} + rayos-x; state.json ${stateCount ?? "—"})`);
    }
  }

  // CHECK 2 — Reglas cardinales: DB vs AGENTS.md (### Regla P*) + W-CTA vs state.json
  {
    const pRules = hasUpstream ? (agentsMd!.match(/^### .*Regla P\d+:/gm) ?? []).length : null;
    const wCta = hasUpstream ? (agentsMd!.match(/^### .*Regla W-CTA:/gm) ?? []).length : null;
    const stateRules = upstreamState.cardinal_rules_count;
    const expected = pRules !== null && wCta !== null ? pRules + wCta : null;
    if (pRules === null) {
      push(2, "reglas-cardinales", "medium", "No se pudo contar reglas P en AGENTS.md");
    } else if (dbRules === expected && (stateRules === undefined || pRules === stateRules)) {
      push(2, "reglas-cardinales", "OK", `DB ${dbRules} (${pRules} P + ${wCta} W-CTA) = AGENTS.md; state.json ${stateRules}`);
    } else {
      push(2, "reglas-cardinales", "critical", `DB ${dbRules} ≠ ${expected} esperadas (P${pRules} + W-CTA ${wCta}; state.json ${stateRules ?? "—"})`);
    }
  }

  // CHECK 3 — Anti-patrones: DB vs anti-patterns.md vs state.json
  {
    const mdAps = apsMd ? (apsMd.match(/^## \[AP-\d+\]/gm) ?? []).length : null;
    const stateAps = upstreamState.anti_patterns_documented;
    if (mdAps === null) {
      push(3, "antipatrones", "medium", "anti-patterns.md no accesible en upstream");
    } else if (dbAps === mdAps && (stateAps === undefined || mdAps === stateAps)) {
      push(3, "antipatrones", "OK", `DB ${dbAps} = ledger upstream ${mdAps} = state.json ${stateAps}`);
    } else {
      push(3, "antipatrones", "high", `DB ${dbAps} ≠ upstream ${mdAps} (state.json ${stateAps ?? "—"})`);
    }
  }

  // CHECK 4 — Victorias PSIM: DB vs wins-ledger.md vs state.json
  // v2.0.0: append-friendly — la memoria P9 del console crece por diseño
  // (pre cycle promoted → WIN; bucle iteración completada → WIN). El check
  // verifica que NINGUNA victoria upstream se pierda (DB ≥ upstream); las
  // victorias locales adicionales son el bucle funcionando, no un gap.
  {
    const mdWins = winsMd ? (winsMd.match(/^## \[WIN-\d+\]/gm) ?? []).length : null;
    const stateWins = upstreamState.psim_wins_count?.total;
    if (mdWins === null) {
      push(4, "victorias-psim", "medium", "wins-ledger.md no accesible en upstream");
    } else if (dbWins === mdWins) {
      push(4, "victorias-psim", "OK", `DB ${dbWins} = ledger upstream ${mdWins} (state.json ${stateWins})`);
    } else if (dbWins > mdWins) {
      push(4, "victorias-psim", "OK", `DB ${dbWins} = upstream ${mdWins} + ${dbWins - mdWins} victoria(s) local(es) de sesión (P9 append-only: pre cycle / bucle — cero pérdidas upstream)`);
    } else {
      push(4, "victorias-psim", "high", `DB ${dbWins} < upstream ${mdWins} (state.json ${stateWins ?? "—"}) — ${mdWins - dbWins} victoria(s) upstream perdida(s)`);
    }
  }

  // CHECK 5 — Versión: DB PsimState vs state.json vs changelog AGENTS.md
  {
    const changelogVersions = hasUpstream
      ? [...agentsMd!.matchAll(/^\| \d{4}-\d{2}-\d{2} \| (\d+\.\d+\.\d+) \|/gm)].map((m) => m[1])
      : [];
    const lastChangelog = changelogVersions[changelogVersions.length - 1];
    if (!hasUpstream || !lastChangelog) {
      push(5, "versión", "medium", "Changelog de AGENTS.md no legible");
    } else if (dbVersion === upstreamVersion && upstreamVersion === lastChangelog) {
      push(5, "versión", "OK", `DB ${dbVersion} = state.json ${upstreamVersion} = changelog ${lastChangelog}`);
    } else {
      push(5, "versión", "critical", `DB ${dbVersion} ≠ state.json ${upstreamVersion} ≠ changelog ${lastChangelog} — sincronizar`);
    }
  }

  // CHECK 6 — README versión: menciona la versión vigente
  {
    if (readme === null) {
      push(6, "readme-versión", "medium", "README.md no accesible");
    } else if (readme.includes(upstreamVersion)) {
      push(6, "readme-versión", "OK", `README menciona v${upstreamVersion}`);
    } else {
      push(6, "readme-versión", "high", `README no menciona v${upstreamVersion} (state.json vigente)`);
    }
  }

  // CHECK 7 — README badge: badge de versión coincide con state.json
  {
    const badge = readme?.match(/shields\.io\/badge\/v(\d+\.\d+\.\d+)/) ?? null;
    if (readme === null) {
      push(7, "readme-badge", "medium", "README.md no accesible");
    } else if (badge && badge[1] === upstreamVersion) {
      push(7, "readme-badge", "OK", `Badge v${badge[1]} = state.json ${upstreamVersion}`);
    } else if (!badge) {
      push(7, "readme-badge", "low", "README sin badge de versión shields.io (informativo)");
    } else {
      push(7, "readme-badge", "high", `Badge v${badge[1]} ≠ state.json ${upstreamVersion}`);
    }
  }

  // CHECK 8 — README diagrama DISPATCH: rutas vs comandos reales
  {
    if (readme === null) {
      push(8, "readme-diagrama-rutas", "medium", "README.md no accesible");
    } else {
      const routeMention = readme.match(/(\d+)\s+rutas/i);
      const mentioned = routeMention ? parseInt(routeMention[1], 10) : null;
      const stateCount = upstreamState.canonical_commands_count ?? null;
      const hasAlias = /rutas\s*\+\s*alias/i.test(readme);
      // Convención upstream (WIN-017): "16 rutas + alias rayos-x" ≡ state.json 17 paths
      if (mentioned !== null && stateCount !== null && (mentioned === stateCount || (mentioned === stateCount - 1 && hasAlias))) {
        push(8, "readme-diagrama-rutas", "OK", `Diagrama DISPATCH: ${mentioned} rutas${hasAlias ? " + alias rayos-x" : ""} ≡ ${stateCount} paths en state.json`);
      } else if (mentioned === null) {
        push(8, "readme-diagrama-rutas", "low", "Diagrama DISPATCH sin conteo explícito de rutas (informativo)");
      } else {
        push(8, "readme-diagrama-rutas", "high", `Diagrama DISPATCH menciona ${mentioned} rutas ≠ ${stateCount} paths en state.json`);
      }
    }
  }

  // CHECK 9 — README estado actual: menciones numéricas desactualizadas
  {
    if (readme === null) {
      push(9, "readme-estado-actual", "medium", "README.md no accesible");
    } else {
      const stale: string[] = [];
      const cmdMentions = [...readme.matchAll(/(\d+)\s+comandos canónicos/gi)].map((m) => parseInt(m[1], 10));
      const stateCmds = upstreamState.canonical_commands_count;
      if (stateCmds !== undefined && cmdMentions.some((n) => n !== stateCmds)) {
        stale.push(`"${cmdMentions.join(", ")} comandos canónicos" ≠ ${stateCmds} en state.json`);
      }
      const ruleRange = readme.match(/P1[–-]P(\d+)/);
      const stateRules = upstreamState.cardinal_rules_count;
      if (ruleRange && stateRules !== undefined && parseInt(ruleRange[1], 10) !== stateRules) {
        stale.push(`"P1–P${ruleRange[1]}" ≠ P1–P${stateRules} vigentes (state.json)`);
      }
      const apMentions = [...readme.matchAll(/AP-\d+\.\.AP-(\d+)\s*\((\d+)\s+antipatrones\)/gi)].map((m) => parseInt(m[2], 10));
      const stateAps = upstreamState.anti_patterns_documented;
      if (stateAps !== undefined && apMentions.some((n) => n !== stateAps)) {
        stale.push(`"${apMentions.join(", ")} antipatrones" ≠ ${stateAps} vigentes`);
      }
      if (stale.length === 0) {
        push(9, "readme-estado-actual", "OK", "Menciones numéricas del README (comandos/reglas/APs) coinciden con state.json");
      } else {
        push(9, "readme-estado-actual", "high", `README cita counts desactualizados: ${stale.join(" · ")}`);
      }
    }
  }

  // CHECK 10 — MCP servers: configs mcp/*.mcp.json vs state.json
  {
    const servers = await countMcpServers();
    const stateServers = upstreamState.mcp_servers_count;
    if (servers === null) {
      push(10, "mcp-servers", "medium", "Directorio mcp/ no accesible");
    } else if (stateServers === undefined || servers === stateServers) {
      push(10, "mcp-servers", "OK", `mcp/*.mcp.json: ${servers} = state.json ${stateServers ?? "—"}`);
    } else {
      push(10, "mcp-servers", "high", `mcp/*.mcp.json ${servers} ≠ state.json ${stateServers}`);
    }
  }

  // CHECK 11 — MCP skills: dirs mcp/skills/* vs state.json
  {
    const skills = await countDirs("mcp/skills");
    const stateSkills = upstreamState.mcp_skills_count;
    if (skills === null) {
      push(11, "mcp-skills", "medium", "Directorio mcp/skills/ no accesible");
    } else if (stateSkills === undefined || skills === stateSkills) {
      push(11, "mcp-skills", "OK", `mcp/skills/: ${skills} = state.json ${stateSkills ?? "—"}`);
    } else {
      push(11, "mcp-skills", "high", `mcp/skills/ ${skills} ≠ state.json ${stateSkills}`);
    }
  }

  // CHECK 12 — Personas: docs/personas/ (+ cold-run/) vs state.json
  {
    const personas = await countPersonas();
    const statePersonas = upstreamState.personas_documented;
    if (personas === null) {
      push(12, "personas", "medium", "Directorio docs/personas/ no accesible");
    } else if (statePersonas === undefined || personas === statePersonas) {
      push(12, "personas", "OK", `docs/personas/: ${personas} = state.json ${statePersonas ?? "—"}`);
    } else {
      push(12, "personas", "high", `docs/personas/ ${personas} ≠ state.json ${statePersonas}`);
    }
  }

  // CHECK 13 — Worklog del console: entradas presentes y crecientes (append-only)
  {
    if (dbPersonasWorklog >= 3) {
      push(13, "worklog-sessions", "OK", `${dbPersonasWorklog} entradas de worklog en la memoria del console (append-only P9 activo)`);
    } else {
      push(13, "worklog-sessions", "medium", `Solo ${dbPersonasWorklog} entradas de worklog — anexar registro de sesión`);
    }
  }

  // CHECK 14 — PR template: checkboxes P vs reglas cardinales AGENTS.md
  {
    const checkboxes = prTemplate ? (prTemplate.match(/^- \[ \] \*\*P\d+/gm) ?? []).length : null;
    const pRules = hasUpstream ? (agentsMd!.match(/^### .*Regla P\d+:/gm) ?? []).length : null;
    if (checkboxes === null || pRules === null) {
      push(14, "pr-template", "medium", "PR template o AGENTS.md no accesible");
    } else if (checkboxes >= pRules) {
      push(14, "pr-template", "OK", `PR template: ${checkboxes} checkboxes P ≥ ${pRules} reglas P en AGENTS.md`);
    } else {
      push(14, "pr-template", "high", `PR template ${checkboxes} checkboxes < ${pRules} reglas P — faltan ${pRules - checkboxes}`);
    }
  }

  // CHECK 15 — Changelog: última versión de AGENTS.md = state.json + catálogo BP máximo
  {
    const bpMax = bpCatalog
      ? Math.max(0, ...[...bpCatalog.matchAll(/^(\d+)\.\s+\*\*/gm)].map((m) => parseInt(m[1], 10)))
      : null;
    const versionOk = dbVersion === upstreamVersion;
    if (bpMax === null) {
      push(15, "catálogos-changelog", "medium", "Catálogo 100-best-practices.md no accesible");
    } else if (versionOk && bpMax >= 128) {
      push(15, "catálogos-changelog", "OK", `Changelog sincronizado (v${dbVersion}) · catálogo BP hasta #${bpMax} (≥ #128 gaps-finder)`);
    } else if (!versionOk) {
      push(15, "catálogos-changelog", "critical", `Versión DB ${dbVersion} ≠ state.json ${upstreamVersion} — correr sync`);
    } else {
      push(15, "catálogos-changelog", "medium", `Catálogo BP máximo #${bpMax} < #128 esperado (v1.8.0)`);
    }
  }

  return {
    gaps, critical, high, medium, low, ok,
    commitBlocked: critical > 0 || high > 0,
    upstreamVersion, dbVersion,
  };
}
