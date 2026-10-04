// ════════════════════════════════════════════════════════════════════════
// sync-v2.0.0.ts — Bucle Agéntico Goal-Driven (comando canónico 19º `bucle`)
//
// Añade: comando `bucle` (19º canónico, aliases workflow/loop/buclea),
// PSIM v2.0.0. Los modelos WorkflowRun/Goal/TaskStep ya fueron pusheados
// con `bun run db:push`. Idempotente (P9 append-only).
// Ejecutar: bun run scripts/sync-v2.0.0.ts
// ════════════════════════════════════════════════════════════════════════
import { db } from "../src/lib/db";
import { runGapsFinder } from "../src/lib/agent-os/gaps-finder";

const EPOCH = Math.floor(Date.now() / 1000);

async function main() {
  console.log("=== SYNC v2.0.0 — add-goal-driven-workflow-loop ===\n");

  // 1. Comando canónico 19º: bucle
  const bucle = await db.commandDef.findUnique({ where: { name: "bucle" } });
  if (!bucle) {
    await db.commandDef.create({
      data: {
        name: "bucle",
        aliases: "workflow,loop,buclea",
        action:
          "Bucle Agéntico Goal-Driven: deriva goals del prompt inicial (cero conocimiento), investiga, genera plan de pasos y tareas, emite reportes PRE/PRO, ejecuta, auto-critica (P13), auto-aprende (P9), evalúa goals y re-itera con handoff hasta lograrlos",
        methodology: "Bucle Agéntico Goal-Driven §8.4",
        description: "Orquestador del bucle infinito goal-driven (goals desde el prompt)",
        order: 19,
      },
    });
    console.log("[OK] Comando bucle registrado (19º canónico, aliases workflow/loop/buclea)");
  } else {
    console.log("[SKIP] bucle ya registrado");
  }

  // 2. PSIM → v2.0.0
  const state = await db.psimState.findFirst({ orderBy: { updatedAt: "desc" } });
  if (state) {
    await db.psimState.update({ where: { id: state.id }, data: { version: "2.0.0", epoch: EPOCH } });
    console.log("[OK] PSIM → v2.0.0");
  }

  // 3. Worklog de sincronización (P9)
  await db.memoryEntry.create({
    data: {
      type: "WORKLOG",
      title: `Sincronización v2.0.0 (epoch ${EPOCH})`,
      content:
        "Comando bucle (19º canónico): Bucle Agéntico Goal-Driven — cierra los gaps B3/B11/B12 de la verificación de comportamiento (docs/08): goals definidos y generados desde el prompt inicial, plan de pasos y tareas, reportes PRE/PRO por iteración, auto-crítica P13, auto-aprendizaje P9, evaluación de goals y handoff; re-itera (PAUSED reanudable con bucle continúa) hasta lograr los goals. Modelos WorkflowRun/Goal/TaskStep. gaps-finder check 4 append-friendly (P9 crece por diseño). Upstream: AGENTS.md v2.0.0 + state.json + README.",
      epoch: EPOCH,
    },
  });
  console.log("[OK] Worklog anexado");

  // 4. Verificación: gaps-finder DEBE quedar en cero critical/high
  const gaps = await runGapsFinder();
  console.log(`\n[gaps-finder] ${gaps.ok} OK · ${gaps.critical} critical · ${gaps.high} high · ${gaps.medium} medium · ${gaps.low} low`);
  console.log(`[gaps-finder] Versión DB v${gaps.dbVersion} ↔ upstream v${gaps.upstreamVersion}`);
  console.log(gaps.commitBlocked ? "[BLOQUEADO] Hay gaps critical/high — corregir antes de cerrar" : "[DESBLOQUEADO] Cero gaps critical/high");
  for (const g of gaps.gaps.filter((x) => x.severity !== "OK")) {
    console.log(`   ${g.severity.toUpperCase().padEnd(8)} check ${g.check} (${g.category}): ${g.description}`);
  }
  process.exit(gaps.commitBlocked ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
