// ════════════════════════════════════════════════════════════════════════
// sync-v2.2.0.ts — Work Queue Agéntico (P17) + Arquitectura Event-Driven (P18)
//
// Añade: reglas cardinales P17 (Cola de Trabajo de Creación Continua) y
// P18 (Arquitectura Event-Driven para SaaS y Data Streaming) con las
// secciones §11.6-11.9 y §12 del AGENTS.md upstream v2.2.0 (commit 623ab36).
// Reordena W-CTA a la posición 19. Memoria: AP-034/035/036 + WIN-021.
// PSIM → v2.2.0. Idempotente (P9 append-only).
// Ejecutar: bun run scripts/sync-v2.2.0.ts
// ════════════════════════════════════════════════════════════════════════
import { db } from "../src/lib/db";
import { runGapsFinder } from "../src/lib/agent-os/gaps-finder";

const EPOCH = Math.floor(Date.now() / 1000);

const P17 = {
  code: "P17",
  title: "Cola de Trabajo de Creación Continua (Work Queue Agéntico)",
  severity: "RED",
  category: "UI/UX",
  description:
    "Todo flujo de creación/edición soporta crear diferentes registros uno tras otro (AGENTS.md §11.6): 'Guardar y crear otro', cola visible con estado por ítem (borrador → guardando → guardado · reintentando n/N · fallido), autosave de borradores con rehidratación, reintentos automáticos rate-limit aware (backoff exponencial + jitter + presupuesto de intentos por ventana — PROHIBIDO el bucle que provoca 429 en cascada), idempotency keys, la cola nunca se detiene. Toasts con presupuesto visual (§11.7: máx 3 visibles, agregados, deduplicados, '+N más' al centro de notificaciones) y errores terminales estacionados para acciones human-in-the-loop (Reintentar · Editar · Descartar). Verificación P14 headless + P15 expected-first con §11.6/§11.7 como CAs numerados.",
};

const P18 = {
  code: "P18",
  title: "Arquitectura Event-Driven para SaaS y Data Streaming",
  severity: "RED",
  category: "Arquitectura",
  description:
    "Toda app con manejo SaaS (multi-tenancy, suscripciones, billing, colaboración) o data streaming de cualquier tipo (tiempo real, feeds, push, chat, telemetría, live dashboards) se construye sobre arquitectura event-driven (AGENTS.md §12): event bus central con eventos tipados versionados (metadata tenant/actor/correlation/causation), pub/sub desacoplado con handlers idempotentes; caching multi-capa con invalidación por eventos y claves por tenant; hooks y filters before/after/around con veto; queuing subsystems con backpressure, prioridades y DLQ reprocesable human-in-the-loop; fast inner pipelines (parse→validate→enrich→persist→broadcast) con batching/coalescing; data transport tipado por contrato; broadcasting WebSocket/SSE con rooms por tenant y reconexión con rehidratación. PROHIBIDO emular tiempo real con polling. Verificación P14+P15 con §12.7 como CAs.",
};

const NEW_APS: Array<[string, string, string, string]> = [
  ["AP-034", "CRUD Incompleto en Paneles Administrativos", "Paneles al mínimo viable: modal box sin URL, sin papelera, sin batch, detalles en modal. Corrección: Regla P16 + §11 (pageviews, wizard/avanzado, batch, tabs, beauty scrolls).", "ALTA"],
  ["AP-035", "Cola sin Presupuesto de Reintentos y Toasts Saturando la Pantalla", "Reintentos en bucle que agravan el rate limit (429 en cascada), un toast por registro que satura la webview y errores que bloquean o mueren en consola. Corrección: Regla P17 + §11.6/§11.7 (backoff+jitter+presupuesto, toasts acotados agregados, errores a notificaciones human-in-the-loop).", "ALTA"],
  ["AP-036", "SaaS/Streaming sobre Request-Response Acoplado", "Llamadas síncronas punto a punto, caches por TTL, trabajo asíncrono en el request cycle y polling como tiempo real. Corrección: Regla P18 + §12 (event bus, caching por eventos, hooks/filters, colas con DLQ, pipelines, broadcasting con rehidratación).", "ALTA"],
];

const WIN_021 = {
  code: "WIN-021",
  title: "Work Queue Agéntico + Event-Driven Canonizados",
  content:
    "Reglas P17 (cola de trabajo: 'Guardar y crear otro', autosave, reintentos rate-limit aware con presupuesto, toasts sin saturar, errores a human-in-the-loop) + P18 (event bus, caching por eventos, hooks/filters, queuing con DLQ, inner pipelines, data transport, broadcasting) heredadas por todo scaffold instanciado: la constitución viaja en AGENTS.md v2.2.0 y los derivados (catálogos, personas, prompts de dominio) las citan. Sección §12 completa + §11.6-11.9 (cola, notificaciones, menú contextual clic derecho, killer features por perfil).",
  severity: "W1",
};

async function main() {
  console.log("=== SYNC v2.2.0 — work-queue + event-driven (P17/P18) ===\n");

  // 1. Reglas P17 y P18 (idempotente por código)
  for (const [rule, order] of [
    [P17, 17],
    [P18, 18],
  ] as const) {
    const existing = await db.cardinalRule.findUnique({ where: { code: rule.code } });
    if (!existing) {
      await db.cardinalRule.create({ data: { ...rule, order } });
      console.log(`[OK] Regla ${rule.code} registrada (order ${order})`);
    } else {
      console.log(`[SKIP] ${rule.code} ya registrada`);
    }
  }

  // W-CTA pasa a order 19 (después de P18)
  const wcta = await db.cardinalRule.findUnique({ where: { code: "W-CTA" } });
  if (wcta && wcta.order !== 19) {
    await db.cardinalRule.update({ where: { code: "W-CTA" }, data: { order: 19 } });
    console.log("[OK] W-CTA reordenada a posición 19");
  }

  // 2. Memoria: AP-034/035/036 + WIN-021 (append-only P9, idempotente por código)
  for (const [code, title, content, severity] of NEW_APS) {
    const existing = await db.memoryEntry.findFirst({ where: { type: "ANTI_PATTERN", code } });
    if (!existing) {
      await db.memoryEntry.create({
        data: { type: "ANTI_PATTERN", code, title, content, severity, epoch: EPOCH },
      });
      console.log(`[OK] ${code} anexado a la memoria`);
    } else {
      console.log(`[SKIP] ${code} ya en memoria`);
    }
  }
  const winExists = await db.memoryEntry.findFirst({ where: { type: "WIN", code: WIN_021.code } });
  if (!winExists) {
    await db.memoryEntry.create({
      data: { type: "WIN", code: WIN_021.code, title: WIN_021.title, content: WIN_021.content, severity: WIN_021.severity, epoch: EPOCH },
    });
    console.log("[OK] WIN-021 anexada a la memoria");
  } else {
    console.log("[SKIP] WIN-021 ya en memoria");
  }

  // 3. PSIM → v2.2.0
  const state = await db.psimState.findFirst({ orderBy: { updatedAt: "desc" } });
  if (state) {
    await db.psimState.update({ where: { id: state.id }, data: { version: "2.2.0", epoch: EPOCH } });
    console.log("[OK] PSIM → v2.2.0");
  }

  // 4. Worklog de sincronización (P9)
  const wlExists = await db.memoryEntry.findFirst({
    where: { type: "WORKLOG", title: { contains: `v2.2.0 (epoch ${EPOCH})` } },
  });
  if (!wlExists) {
    await db.memoryEntry.create({
      data: {
        type: "WORKLOG",
        title: `Sincronización v2.2.0 (epoch ${EPOCH})`,
        content:
          "Reglas P17 (Cola de Trabajo de Creación Continua — §11.6: guardar y crear otro, autosave, reintentos rate-limit aware, toasts sin saturar §11.7, errores human-in-the-loop) y P18 (Arquitectura Event-Driven SaaS/streaming — §12: event bus, caching por eventos, hooks/filters, queuing con DLQ, inner pipelines, data transport, broadcasting). §11.8 menú contextual clic derecho + §11.9 killer features por perfil. Upstream: AGENTS.md v2.2.0 (commit 623ab36) + bucle.sh + BP #131-132 + KF #112-115 + AP-035/036 + WIN-021. Instanciador condicionado: spec con secciones de cola/event-driven y personas con criterios verificables.",
        epoch: EPOCH,
      },
    });
    console.log("[OK] Worklog anexado");
  }

  // 5. Verificación: gaps-finder DEBE quedar en cero critical/high
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
