// ════════════════════════════════════════════════════════════════════════
// sync-v1.9.0.ts — Sincroniza el console con el boilerplate upstream v1.9.0
// (PRE-v2.0 add-sentinel-autonomous-quality-loop promoted, merge 3f30e74).
//
// Añade: comando canónico 18º `vigila`, AP-031/032/033, WIN-019 (W1+W8),
// PSIM v1.9.0. Idempotente: salta lo que ya exista (P9 append-only).
// Ejecutar: bun run scripts/sync-v1.9.0.ts
// ════════════════════════════════════════════════════════════════════════
import { db } from "../src/lib/db";
import { runGapsFinder } from "../src/lib/agent-os/gaps-finder";

const EPOCH = Math.floor(Date.now() / 1000);

async function main() {
  console.log("=== SYNC v1.9.0 — add-sentinel-autonomous-quality-loop ===\n");

  // 1. Comando canónico 18º: vigila
  const vigila = await db.commandDef.findUnique({ where: { name: "vigila" } });
  if (!vigila) {
    await db.commandDef.create({
      data: {
        name: "vigila",
        aliases: "sentinel,ciclo,cicla",
        action: "Ciclo Autónomo de Calidad: escanea fallas sin procesar (ERROR, FAILED, L2, presupuesto gateway) y abre por cada una un ciclo de 7 etapas: detectar → analizar → investigar → corregir → verificar → criterios posteriores → reportar",
        methodology: "Ciclo Autónomo de Calidad §8.2",
        description: "Sentinela: detecta fallas automáticamente y cierra el ciclo con reporte (AP-031)",
        order: 18,
      },
    });
    console.log("[OK] Comando vigila registrado (18º canónico, aliases sentinel/ciclo/cicla)");
  } else {
    console.log("[SKIP] vigila ya registrado");
  }

  // 2. Anti-patrones AP-031..033 (textos del ledger upstream, merge 3f30e74)
  const aps: { code: string; title: string; severity: string; content: string }[] = [
    {
      code: "AP-031",
      title: "Ciclo de Calidad Pasivo (Detección de Fallas No Automática)",
      severity: "CRITICA",
      content:
        "Cuando un comando falla o un pipeline entra en FAILED, el fallo queda registrado en el log pero NADIE lo procesa: sin análisis de causa raíz, ni investigación, ni verificación, ni reporte. El operador humano se convierte en el detector de fallas del sistema — lo contrario del propósito agéntico. Síntomas: fallas descubiertas por el operador con screenshots; reportes solo manuales; criterios posteriores a discreción. Corrección (v1.9.0): comando canónico vigila — Ciclo Autónomo de Calidad que se dispara tras cada ERROR del dispatcher, clasifica (NO_DEFECT para inputs inválidos), abre ciclos de 7 etapas y genera reportes epoch inmutables. Escala a humano tras >3 intentos fallidos.",
    },
    {
      code: "AP-032",
      title: "Presupuesto de Gateway Excedido (HTML 504 Parseado como JSON)",
      severity: "ALTA",
      content:
        "Comandos que tardan >30s (scans secuenciales, LLM síncrono) son cortados por el gateway con HTML 504; el frontend hace res.json() del HTML y explota con \"Unexpected token '<'\" — error engañoso que oculta el timeout. El catch del frontend además reportaba durationMs: 0 (mentira P2). Corrección: paralelizar scans (cola + 6 workers), pipelines largos en background con polling (POST <50ms), verificar content-type ANTES de parsear, medir duración real con AbortController, y verify flaggea comandos >25s observados.",
    },
    {
      code: "AP-033",
      title: "Regex de Prefijo IDE que Consume Comandos Canónicos",
      severity: "MEDIA",
      content:
        "El strippeo del prefijo de entorno ('en este ide, cold run') con regex sin requerir la coma convertía el comando canónico 'ide detect' en 'detect' → desconocido. El comando ide quedó roto desde su introducción sin detección (síntoma complementario de AP-031). Corrección: el strip solo aplica con coma; el parser preserva comandos multi-palabra conocidos; el dispatcher smoke de verify ejercita ide detect/ide all en vivo.",
    },
  ];
  for (const ap of aps) {
    const exists = await db.memoryEntry.findUnique({ where: { code: ap.code } });
    if (exists) {
      console.log(`[SKIP] ${ap.code} ya en ledger`);
      continue;
    }
    await db.memoryEntry.create({
      data: { type: "ANTI_PATTERN", code: ap.code, title: ap.title, content: ap.content, severity: ap.severity, epoch: EPOCH },
    });
    console.log(`[OK] ${ap.code} anexado al ledger (${ap.severity})`);
  }

  // 3. WIN-019 (W1+W8) — NO anexar WIN-018 (ya existe local como CORRIGE-001)
  const win19 = await db.memoryEntry.findUnique({ where: { code: "WIN-019" } });
  if (!win19) {
    await db.memoryEntry.create({
      data: {
        type: "WIN",
        code: "WIN-019",
        title: "Ciclo Autónomo de Calidad Operativo End-to-End",
        content:
          "Propuesta PRE-v2.0 add-sentinel-autonomous-quality-loop promoted (AGENTS.md v1.9.0, merge 3f30e74, juez ΔS +16.1). Comando vigila (18º canónico) + sentinela del console: detección sin intervención del operador, ciclos de 7 etapas con evidencia P2, reportes epoch inmutables con auto-crítica P13. Los hallazgos críticos dejan de depender de la vigilancia humana: vida media <1 iteración.",
        winClass: "W1+W8",
        epoch: EPOCH,
      },
    });
    console.log("[OK] WIN-019 anexada (W1+W8)");
  } else {
    console.log("[SKIP] WIN-019 ya en ledger");
  }

  // 4. PSIM → v1.9.0 (W1+1, W8+1 por WIN-019 multiclase; K4 = victorias totales)
  const wins = await db.memoryEntry.findMany({ where: { type: "WIN" } });
  const wCounts: Record<string, number> = {};
  for (const w of wins) for (const c of (w.winClass ?? "").split("+").map((s) => s.trim())) if (c) wCounts[c] = (wCounts[c] ?? 0) + 1;
  const state = await db.psimState.findFirst({ orderBy: { updatedAt: "desc" } });
  if (state) {
    await db.psimState.update({
      where: { id: state.id },
      data: {
        version: "1.9.0",
        epoch: EPOCH,
        k4: wins.length,
        w1: wCounts["W1"] ?? 0,
        w8: wCounts["W8"] ?? 0,
      },
    });
    console.log(`[OK] PSIM → v1.9.0 · K4=${wins.length} victorias · W1=${wCounts["W1"]} · W8=${wCounts["W8"]}`);
  }

  // 5. Worklog de sincronización (P9)
  await db.memoryEntry.create({
    data: {
      type: "WORKLOG",
      title: `Sincronización v1.9.0 (epoch ${EPOCH})`,
      content:
        "Sync con upstream 3f30e74 (PRE-v2.0 add-sentinel-autonomous-quality-loop promoted, ΔS +16.1): comando vigila 18º canónico, AP-031/032/033 anexados, WIN-019 (W1+W8), PSIM v1.9.0. El sentinela queda operativo: disparo AUTO_ON_ERROR tras cada ERROR del dispatcher + scan manual vía vigila.",
      epoch: EPOCH,
    },
  });

  // 6. Verificación: gaps-finder DEBE quedar en cero critical/high
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
