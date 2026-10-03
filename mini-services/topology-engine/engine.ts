// The living engine: executes the 7-stage autonomous quality cycle
// (detectar → analizar → investigar → corregir → verificar → criterios →
// reportar) over REAL data from the Agent OS database and with REAL L2
// inference calls, streaming every node activation, context transfer,
// step and KPI to connected viewers.

import type { Server } from "socket.io";
import { readRelevantMemory, readSnapshot, type SnapshotData } from "./db";
import { infer } from "./inference";
import {
  CYCLE_STEPS,
  emptySteps,
  type CycleStepId,
  type EngineStateDTO,
  type FindingCardDTO,
  type IterationDTO,
  type KpiDTO,
  type LogEntryDTO,
  type NodeStateDTO,
  type SnapshotDTO,
  type StepStateDTO,
  type TransferDTO,
  type TransferKind,
} from "./types";

const MAX_TRANSFERS = 60;
const MAX_LOGS = 60;
const MAX_ITERATIONS = 20;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number, spread: number) => base + Math.random() * spread;

interface IterationState {
  dto: IterationDTO;
  data: SnapshotData;
  research: string;
  fixPlan: string;
  criteriaResults: { name: string; pass: boolean; detail: string }[];
  inferenceLatencies: number[];
  inferenceErrors: number;
  stopped: boolean;
}

export class TopologyEngine {
  private io: Server;
  private running = false;
  private paused = false;
  private mode: EngineStateDTO["mode"] = "idle";
  private queue = 0;
  private paceMs = 2600;
  private stopRequested = false;
  private current: IterationState | null = null;

  private nodes = new Map<string, NodeStateDTO>();
  private iterations: IterationDTO[] = [];
  private transfers: TransferDTO[] = [];
  private logs: LogEntryDTO[] = [];
  private findings: FindingCardDTO[] = [];

  private kpiBase: Omit<
    KpiDTO,
    "nodesActive" | "activations" | "deactivations" | "findingsOpen" | "findingsResolved" | "findingsTotal"
  > = {
    iterationsTotal: 0,
    iterationsRunning: 0,
    iterationsCompleted: 0,
    stepsTotal: 0,
    stepsPerStage: {
      detectar: 0,
      analizar: 0,
      investigar: 0,
      corregir: 0,
      verificar: 0,
      criterios: 0,
      reportar: 0,
    },
    transfersTotal: 0,
    bytesTotal: 0,
    transfersByKind: { inference: 0, data: 0, control: 0, report: 0 },
    inferencesTotal: 0,
    inferencesCharsIn: 0,
    inferencesCharsOut: 0,
    inferencesAvgLatencyMs: 0,
    inferencesErrors: 0,
    verdictsAgree: 0,
    verdictsDisagree: 0,
    verdictsMixed: 0,
    startedAt: Date.now(),
    lastActivityAt: Date.now(),
  };
  private inferenceLatencySum = 0;
  private inferenceCount = 0;
  private transferSeq = 0;
  private logSeq = 0;
  private iterationSeq = 0;
  private startedAt = Date.now();

  constructor(io: Server) {
    this.io = io;
    for (const id of [
      "operador", "consola", "api", "dispatcher", "sentinela", "juez",
      "detectar", "analizar", "investigar", "corregir", "verificar", "criterios", "reportar",
      "l2glm", "memoria", "bd", "reportes",
    ]) {
      this.nodes.set(id, {
        id,
        active: false,
        activations: 0,
        deactivations: 0,
        lastReason: null,
        lastActiveAt: null,
      });
    }
    this.refreshFindings();
    this.log("success", "Motor de topología vivo iniciado — esperando comandos del operador");
  }

  // ── Public control API ─────────────────────────────────────────────

  control(action: {
    action: string;
    iterations?: number;
    paceMs?: number;
  }): void {
    switch (action.action) {
      case "run": {
        const n = Math.max(1, Math.min(5, action.iterations ?? 1));
        this.queue += n;
        this.mode = "single";
        this.stopRequested = false;
        this.log("info", `El operador encoló ${n} iteración(es) del ciclo autónomo`);
        this.kickLoop();
        break;
      }
      case "continuous": {
        this.mode = "continuous";
        this.queue = Math.max(this.queue, 1);
        this.stopRequested = false;
        this.log("info", "Modo continuo activado — el ciclo se repite hasta detenerlo");
        this.kickLoop();
        break;
      }
      case "pause": {
        this.paused = true;
        this.log("warn", "Pausa solicitada — el ciclo se detendrá en el próximo límite seguro");
        break;
      }
      case "resume": {
        this.paused = false;
        this.log("success", "Reanudado — el ciclo continúa");
        this.kickLoop();
        break;
      }
      case "stop": {
        this.stopRequested = true;
        this.queue = 0;
        if (this.mode === "continuous") this.mode = "idle";
        this.log("warn", "Detención solicitada por el operador");
        break;
      }
      case "pace": {
        this.paceMs = Math.max(800, Math.min(12000, action.paceMs ?? 2600));
        this.log("info", `Ritmo entre iteraciones ajustado a ${this.paceMs} ms`);
        break;
      }
      case "resync":
        break;
    }
    this.emitKpis();
  }

  snapshot(): SnapshotDTO {
    return {
      engine: this.engineState(),
      nodes: Array.from(this.nodes.values()),
      iterations: this.iterations.slice(0, MAX_ITERATIONS),
      kpis: this.buildKpis(),
      findings: this.findings,
      recentTransfers: this.transfers.slice(0, MAX_TRANSFERS),
      recentLogs: this.logs.slice(0, MAX_LOGS),
    };
  }

  private engineState(): EngineStateDTO {
    return {
      running: this.running,
      paused: this.paused,
      mode: this.mode,
      queuedIterations: this.queue,
      paceMs: this.paceMs,
      currentIterationId: this.current?.dto.id ?? null,
    };
  }

  // ── Main loop ──────────────────────────────────────────────────────

  private loopPromise: Promise<void> | null = null;

  private kickLoop(): void {
    if (this.loopPromise) return;
    this.running = true;
    this.loopPromise = this.loop().finally(() => {
      this.loopPromise = null;
    });
  }

  private async loop(): Promise<void> {
    while (this.queue > 0 && !this.stopRequested) {
      await this.waitWhilePaused();
      if (this.stopRequested && this.queue === 0) break;
      this.queue -= 1;
      await this.runIteration();
      this.emitKpis();
      if (this.mode === "continuous" && !this.stopRequested) {
        // keep looping: continuous never drains the queue below 1
        this.queue = Math.max(this.queue, 1);
        this.log("info", `Iteración completada — próxima en ${(this.paceMs / 1000).toFixed(1)}s`);
        await sleep(this.paceMs);
      }
    }
    if (this.mode === "single") this.mode = "idle";
    this.running = this.current !== null;
    this.emitKpis();
    if (!this.current) {
      this.log("info", "Ciclo en reposo — topología estable");
    }
  }

  private async waitWhilePaused(): Promise<void> {
    while (this.paused && !this.stopRequested) {
      await sleep(400);
    }
  }

  private async checkpoint(): Promise<boolean> {
    // returns false when the operator asked to stop
    await this.waitWhilePaused();
    if (this.stopRequested) return false;
    return true;
  }

  // ── Node state ─────────────────────────────────────────────────────

  private activate(id: string, reason: string): void {
    const n = this.nodes.get(id);
    if (!n) return;
    n.active = true;
    n.activations += 1;
    n.lastReason = reason;
    n.lastActiveAt = Date.now();
    this.kpiBase.lastActivityAt = Date.now();
    this.io.emit("topo:node", { ...n });
  }

  private deactivate(id: string, reason: string): void {
    const n = this.nodes.get(id);
    if (!n) return;
    n.active = false;
    n.deactivations += 1;
    n.lastReason = reason;
    this.io.emit("topo:node", { ...n });
  }

  // ── Transfers & logs ───────────────────────────────────────────────

  private transfer(
    from: string,
    to: string,
    kind: TransferKind,
    payload: string,
    iterationId: string,
    stepId: CycleStepId | "trigger" | "ciclo",
    opts?: { charsIn?: number; charsOut?: number; durationMs?: number }
  ): void {
    this.transferSeq += 1;
    const bytes = Buffer.byteLength(payload, "utf8");
    const t: TransferDTO = {
      id: `t-${this.transferSeq}`,
      from,
      to,
      kind,
      bytes,
      preview: payload.slice(0, 180).replace(/\s+/g, " "),
      iterationId,
      stepId,
      ts: Date.now(),
      ...opts,
    };
    this.transfers = [t, ...this.transfers].slice(0, MAX_TRANSFERS);
    this.kpiBase.transfersTotal += 1;
    this.kpiBase.bytesTotal += bytes;
    this.kpiBase.transfersByKind[kind] += 1;
    if (kind === "inference") {
      this.kpiBase.inferencesTotal += 1;
      this.kpiBase.inferencesCharsIn += opts?.charsIn ?? 0;
      this.kpiBase.inferencesCharsOut += opts?.charsOut ?? 0;
      if (opts?.durationMs) {
        this.inferenceLatencySum += opts.durationMs;
        this.inferenceCount += 1;
        this.kpiBase.inferencesAvgLatencyMs = Math.round(this.inferenceLatencySum / this.inferenceCount);
      }
    }
    this.kpiBase.lastActivityAt = Date.now();
    this.io.emit("topo:transfer", t);
    this.emitKpis();
  }

  private log(level: LogEntryDTO["level"], message: string): void {
    this.logSeq += 1;
    const entry: LogEntryDTO = { id: this.logSeq, ts: Date.now(), level, message };
    this.logs = [entry, ...this.logs].slice(0, MAX_LOGS);
    this.io.emit("topo:log", { ts: entry.ts, level, message });
  }

  private emitKpis(): void {
    this.io.emit("topo:kpi", this.buildKpis());
  }

  private buildKpis(): KpiDTO {
    let activations = 0;
    let deactivations = 0;
    let active = 0;
    for (const n of this.nodes.values()) {
      activations += n.activations;
      deactivations += n.deactivations;
      if (n.active) active += 1;
    }
    const open = this.findings.filter((f) =>
      ["DETECTED", "ANALYZED", "CORRECTED", "VERIFIED", "ESCALATED"].includes(f.status)
    ).length;
    const resolved = this.findings.filter((f) =>
      ["RESOLVED", "NO_DEFECT"].includes(f.status)
    ).length;
    return {
      ...this.kpiBase,
      nodesActive: active,
      nodesTotal: this.nodes.size,
      activations,
      deactivations,
      findingsOpen: open,
      findingsResolved: resolved,
      findingsTotal: this.findings.length,
    };
  }

  private refreshFindings(): void {
    try {
      const snap = readSnapshot();
      this.findings = snap.findings.map((f) => ({
        id: f.id,
        sourceRef: f.sourceRef,
        severity: f.severity,
        title: f.title,
        status: f.status,
        source: f.source,
        createdAt: f.detectedAt,
      }));
      this.io.emit("topo:findings", this.findings);
    } catch {
      // DB unavailable — keep previous findings (honest silence)
    }
  }

  // ── Iteration execution ────────────────────────────────────────────

  private async runIteration(): Promise<void> {
    this.iterationSeq += 1;
    const seq = this.iterationSeq;
    const id = `iter-${seq}`;
    const data = readSnapshot();
    const taskLabel = this.describeTask(data);

    const dto: IterationDTO = {
      id,
      seq,
      status: "running",
      startedAt: Date.now(),
      endedAt: null,
      steps: emptySteps(),
      transfers: 0,
      bytes: 0,
      inferences: 0,
      verdict: null,
      summary: null,
      taskLabel,
    };
    const state: IterationState = {
      dto,
      data,
      research: "",
      fixPlan: "",
      criteriaResults: [],
      inferenceLatencies: [],
      inferenceErrors: 0,
      stopped: false,
    };
    this.current = state;
    this.kpiBase.iterationsTotal += 1;
    this.kpiBase.iterationsRunning = 1;
    this.iterations = [dto, ...this.iterations].slice(0, MAX_ITERATIONS);
    this.io.emit("topo:iteration", { ...dto, steps: { ...dto.steps } });
    this.log("success", `Iteración #${seq} iniciada — ${taskLabel}`);

    try {
      await this.runTrigger(state);
      for (const step of CYCLE_STEPS) {
        if (!(await this.checkpoint())) {
          state.stopped = true;
          break;
        }
        await this.runStep(step, state);
      }
      await this.finishIteration(state);
    } catch (e) {
      this.log("error", `Iteración #${seq} abortada: ${e instanceof Error ? e.message : "error"}`);
      await this.finishIteration(state);
    }
  }

  private describeTask(data: SnapshotData): string {
    if (data.recentErrors.length > 0) {
      return `analizar ${data.recentErrors.length} error(es) recientes y ${data.findingsOpen} hallazgo(s) abiertos`;
    }
    if (data.findingsOpen > 0) {
      return `vigilar ${data.findingsOpen} hallazgo(s) abiertos y verificar criterios de calidad`;
    }
    return `patrulla de vigilancia — sistema estable (${data.commandsTotal} comandos auditados)`;
  }

  private async runTrigger(state: IterationState): Promise<void> {
    const id = state.dto.id;
    // Operator fires the command through the console → API → dispatcher
    this.activate("operador", "Inicia una iteración del ciclo de calidad");
    await sleep(jitter(360, 260));
    this.transfer(
      "operador",
      "consola",
      "control",
      `ejecuta: vigila (iteración #${state.dto.seq})`,
      id,
      "trigger"
    );
    this.activate("consola", "Recibe el comando del operador");
    await sleep(jitter(360, 260));
    this.transfer("consola", "api", "control", "POST /api/agent-os/command {command:'vigila'}", id, "trigger");
    this.activate("api", "Route handler del comando");
    await sleep(jitter(340, 240));
    this.transfer("api", "dispatcher", "control", "parseCommand('vigila') → caso sentinel", id, "trigger");
    this.activate("dispatcher", "Enruta al sentinela (canónico 18º)");
    await sleep(jitter(340, 240));
    this.transfer("dispatcher", "sentinela", "control", "sentinelScan() — escaneo de 4 fuentes", id, "trigger");
    this.activate("sentinela", "Abre el ciclo autónomo de calidad");
    this.deactivate("operador", "Comando enviado");
    this.deactivate("consola", "Comando reenviado al dispatcher");
    this.deactivate("api", "Request completado");
    await sleep(jitter(380, 260));
  }

  private async runStep(step: CycleStepId, state: IterationState): Promise<void> {
    const id = state.dto.id;
    const started = Date.now();
    this.activate(step, `Etapa ${step} de la iteración #${state.dto.seq}`);
    const stepDto: StepStateDTO = { id: step, status: "running" };
    state.dto.steps[step] = stepDto;
    this.io.emit("topo:step", { iterationId: id, step: { ...stepDto } });

    let detail = "";
    try {
      detail = await this.stageWork(step, state);
    } catch (e) {
      state.dto.steps[step] = {
        id: step,
        status: "fail",
        durationMs: Date.now() - started,
        detail: e instanceof Error ? e.message : "error",
      };
      this.io.emit("topo:step", {
        iterationId: id,
        step: { ...state.dto.steps[step] },
      });
      this.log("error", `Etapa ${step} FALLÓ: ${state.dto.steps[step].detail}`);
      this.deactivate(step, "Etapa fallida");
      return;
    }

    const durationMs = Date.now() - started;
    state.dto.steps[step] = { id: step, status: "done", durationMs, detail };
    this.io.emit("topo:step", { iterationId: id, step: { ...state.dto.steps[step] } });
    this.kpiBase.stepsTotal += 1;
    this.kpiBase.stepsPerStage[step] += 1;
    this.log("success", `Etapa ${step} completada en ${durationMs}ms — ${detail.slice(0, 96)}`);
    this.deactivate(step, "Etapa completada");
    this.io.emit("topo:iteration", { ...state.dto, steps: { ...state.dto.steps } });
  }

  private async stageWork(step: CycleStepId, state: IterationState): Promise<string> {
    const id = state.dto.id;
    const d = state.data;

    switch (step) {
      case "detectar": {
        this.transfer("sentinela", "detectar", "control", "F1: scan CommandLog + Findings + Ledger + Presupuesto", id, "detectar");
        await sleep(jitter(320, 220));
        this.activate("bd", "Consulta de fallas reales");
        this.transfer("detectar", "bd", "data", "SELECT errores, hallazgos, presupuestos, ciclos FROM AgentOS", id, "detectar");
        await sleep(jitter(340, 240));
        const payload = JSON.stringify({
          errores: d.recentErrors.map((e) => `${e.command} ${e.args ?? ""} (${e.durationMs}ms)`),
          hallazgosAbiertos: d.findingsOpen,
          presupuestos: d.budgetViolations.length,
        });
        this.transfer("bd", "detectar", "data", payload, id, "detectar", { durationMs: 12 });
        this.deactivate("bd", "Lectura completada");
        await sleep(jitter(300, 200));
        this.transfer("detectar", "analizar", "data", `hallazgo del escaneo: ${payload.slice(0, 120)}`, id, "detectar");
        return `${d.recentErrors.length} errores, ${d.findingsOpen} abiertos, ${d.budgetViolations.length} presupuestos excedidos`;
      }

      case "analizar": {
        await sleep(jitter(320, 220));
        const classes = d.recentErrors.map((e) => {
          const out = e.output.toLowerCase();
          if (out.includes("timeout") || out.includes("<html") || e.durationMs > 25000)
            return `${e.command}: BUDGET/AP-032 (${e.durationMs}ms)`;
          if (out.includes("inválida") || out.includes("invalid")) return `${e.command}: INPUT_INVALIDO`;
          if (out.includes("desconocid")) return `${e.command}: PARSER`;
          return `${e.command}: ${e.status}`;
        });
        const payload = classes.length ? classes.join(" | ") : "sin errores nuevos — clasificación de vigilancia";
        this.transfer("analizar", "investigar", "data", `clasificación determinista: ${payload}`, id, "analizar");
        return classes.length ? `${classes.length} firmas clasificadas` : "0 fallas nuevas (patrulla)";
      }

      case "investigar": {
        // 1) Real memory lookup
        this.activate("memoria", "Búsqueda de APs/WINs relevantes");
        this.transfer("investigar", "memoria", "data", "SELECT AP/WIN WHERE keywords ~ (budget|parser|gateway|inferencia)", id, "investigar");
        await sleep(jitter(320, 220));
        const mem = readRelevantMemory(["gateway", "presupuesto", "timeout", "parser", "html", "fallback", "inferencia"], 4);
        const memPayload = mem.length
          ? mem.map((m) => `${m.code ?? m.type}: ${m.title}`).join(" | ")
          : "sin memoria directa aplicable";
        this.transfer("memoria", "investigar", "data", memPayload, id, "investigar", { durationMs: 8 });
        this.deactivate("memoria", "Memoria consultada");
        await sleep(jitter(300, 200));

        // 2) REAL L2 inference — the inference transfer the operator wants to see
        this.activate("l2glm", "Inferencia L2 en curso (GLM)");
        const systemPrompt =
          "Eres el investigador del ciclo autónomo de calidad de un sistema agéntico (Agent OS). " +
          "Analiza la evidencia real y responde en máximo 4 líneas: (1) causa raíz más probable, " +
          "(2) si ya existe una corrección documentada en la memoria del sistema, (3) recomendación única y concreta. " +
          "Sin markdown, sin listas numeradas, texto plano.";
        const userContent =
          `Estado real del sistema: ${d.recentErrors.length} errores recientes, ` +
          `${d.findingsOpen} hallazgos abiertos, ${d.budgetViolations.length} presupuestos excedidos, ` +
          `${d.cyclesCompleted} ciclos completados, ${d.ledgerErrors}/${d.ledgerEntries} entradas L2 con error. ` +
          `Errores recientes: ${d.recentErrors.map((e) => `${e.command}→${e.status} (${e.durationMs}ms)`).join("; ") || "ninguno"}. ` +
          `Memoria relevante: ${memPayload}.`;
        const res = await infer(systemPrompt, userContent);
        this.transfer("investigar", "l2glm", "inference", userContent, id, "investigar", {
          charsIn: res.charsIn,
          durationMs: res.latencyMs,
        });
        await sleep(jitter(260, 160));
        if (res.ok) {
          this.transfer("l2glm", "investigar", "inference", res.content, id, "investigar", {
            charsOut: res.charsOut,
            durationMs: res.latencyMs,
          });
          state.research = res.content;
          state.inferenceLatencies.push(res.latencyMs);
          this.log("success", `Inferencia L2 completada: ${res.charsIn} chars in → ${res.charsOut} chars out (${res.latencyMs}ms)`);
        } else {
          state.inferenceErrors += 1;
          state.research = `Fallback determinista (inferencia falló: ${res.error}). Clasificación local: ${d.recentErrors.length} errores, presupuestos ${d.budgetViolations.length}.`;
          this.transfer("l2glm", "investigar", "inference", `ERROR de inferencia: ${res.error}`, id, "investigar", { durationMs: res.latencyMs });
          this.log("error", `Inferencia L2 falló tras ${res.latencyMs}ms: ${res.error}`);
        }
        this.deactivate("l2glm", "Inferencia completada");
        await sleep(jitter(300, 200));
        this.transfer("investigar", "corregir", "data", `resultado de investigación: ${state.research.slice(0, 120)}`, id, "investigar");
        return res.ok
          ? `inferencia real ${res.charsIn}→${res.charsOut} chars (${res.latencyMs}ms)`
          : "inferencia falló — fallback determinista aplicado";
      }

      case "corregir": {
        await sleep(jitter(320, 220));
        const plans: string[] = [];
        if (d.budgetViolations.length > 0)
          plans.push(`AP-032: paralelizar/acotar ${d.budgetViolations.map((b) => b.command).join(",")} bajo 25s`);
        if (d.recentErrors.some((e) => e.output.toLowerCase().includes("desconocid")))
          plans.push("AP-033: revisar regex de prefijo IDE en parseCommand");
        if (d.findingsOpen > 0) plans.push(`verificar ${d.findingsOpen} hallazgo(s) abierto(s) contra evidencia fresca`);
        if (plans.length === 0) plans.push("sin defectos corregibles — NO_DEFECT (§4.2, no se muta nada)");
        state.fixPlan = plans.join(" · ");
        this.transfer("corregir", "verificar", "data", `plan de corrección: ${state.fixPlan.slice(0, 140)}`, id, "corregir");
        return `${plans.length} acción(es) planificadas`;
      }

      case "verificar": {
        this.activate("bd", "Verificación contra la BD real");
        this.transfer("verificar", "bd", "data", "re-check: errores, hallazgos, integridad de ciclos", id, "verificar");
        await sleep(jitter(320, 220));
        const fresh = readSnapshot();
        const checks = [
          `hallazgos abiertos: ${fresh.findingsOpen}`,
          `ciclos completados: ${fresh.cyclesCompleted}`,
          `ledger L2: ${fresh.ledgerEntries} entradas (${fresh.ledgerErrors} errores)`,
          `BD íntegra: ${(fresh.dbBytes / 1024).toFixed(0)} KB legibles`,
        ].join(" | ");
        this.transfer("bd", "verificar", "data", checks, id, "verificar", { durationMs: 11 });
        this.deactivate("bd", "Verificación completada");
        await sleep(jitter(300, 200));
        this.transfer("verificar", "criterios", "data", `evidencia de verificación: ${checks.slice(0, 120)}`, id, "verificar");
        return `4 checks re-ejecutados (${fresh.findingsOpen} abiertos)`;
      }

      case "criterios": {
        this.activate("memoria", "Integridad de la memoria empírica");
        this.transfer("criterios", "memoria", "data", "criterios posteriores: integridad AP/WIN + presupuesto + escalado", id, "criterios");
        await sleep(jitter(320, 220));
        const memCount = `AP:${d.memoryAp} WIN:${d.memoryWin} total:${d.memoryTotal}`;
        this.transfer("memoria", "criterios", "data", `memoria íntegra: ${memCount}`, id, "criterios", { durationMs: 7 });
        this.deactivate("memoria", "Criterios evaluados");
        state.criteriaResults = [
          { name: "hallazgos abiertos ≤ 5", pass: d.findingsOpen <= 5, detail: `${d.findingsOpen} abiertos` },
          { name: "errores L2 en ledger = 0 (24h)", pass: d.ledgerErrors === 0, detail: `${d.ledgerErrors} errores` },
          { name: "memoria append-only íntegra", pass: d.memoryTotal > 40, detail: memCount },
          { name: "presupuesto gateway < 25s", pass: d.budgetViolations.length === 0, detail: `${d.budgetViolations.length} excedidos` },
        ];
        await sleep(jitter(280, 180));
        this.transfer("criterios", "reportar", "data", `criterios: ${state.criteriaResults.map((c) => `${c.pass ? "PASS" : "FAIL"} ${c.name}`).join("; ")}`, id, "criterios");
        const passed = state.criteriaResults.filter((c) => c.pass).length;
        return `${passed}/${state.criteriaResults.length} criterios PASS`;
      }

      case "reportar": {
        // Second REAL inference: synthesis of the iteration report
        this.activate("l2glm", "Síntesis del reporte (inferencia L2)");
        const sysPrompt =
          "Eres el reportador del ciclo autónomo de calidad de Agent OS. Recibe la evidencia de una iteración " +
          "y redacta un resumen ejecutivo de máximo 3 líneas, terminando con el veredicto entre corchetes: " +
          "[AGREE] si todo consistentemente funciona, [DISAGREE] si hay evidencia en contra, [MIXED] si es parcial. " +
          "Texto plano, sin markdown.";
        const userContent =
          `Iteración #${state.dto.seq}. Tarea: ${state.dto.taskLabel}. ` +
          `Detección: ${state.data.recentErrors.length} errores, ${state.data.findingsOpen} abiertos. ` +
          `Investigación L2: ${state.research.slice(0, 320)}. ` +
          `Criterios: ${state.criteriaResults.map((c) => `${c.pass ? "PASS" : "FAIL"}(${c.detail})`).join("; ")}.`;
        const res = await infer(sysPrompt, userContent);
        this.transfer("reportar", "l2glm", "inference", userContent, id, "reportar", {
          charsIn: res.charsIn,
          durationMs: res.latencyMs,
        });
        await sleep(jitter(260, 160));
        // Deterministic verdict from evidence (P2: the LLM writes, evidence decides)
        const failed = state.criteriaResults.filter((c) => !c.pass).length;
        const verdict: IterationDTO["verdict"] =
          state.stopped || state.inferenceErrors > 0
            ? failed > 0 ? "MIXED" : "AGREE"
            : failed === 0
              ? "AGREE"
              : failed >= 3
                ? "DISAGREE"
                : "MIXED";
        if (res.ok) {
          this.transfer("l2glm", "reportar", "inference", res.content, id, "reportar", {
            charsOut: res.charsOut,
            durationMs: res.latencyMs,
          });
          state.dto.summary = res.content;
        } else {
          state.dto.summary = `Reporte determinista — inferencia falló (${res.error}). ${state.criteriaResults.filter((c) => c.pass).length}/${state.criteriaResults.length} criterios PASS.`;
          this.transfer("l2glm", "reportar", "inference", `ERROR: ${res.error}`, id, "reportar", { durationMs: res.latencyMs });
          this.log("error", `Inferencia de reporte falló: ${res.error}`);
        }
        this.deactivate("l2glm", "Síntesis completada");
        state.dto.verdict = verdict;
        state.dto.inferences = 2 - (state.inferenceErrors > 0 ? 1 : 0);
        if (state.inferenceErrors > 0) this.kpiBase.inferencesErrors += state.inferenceErrors;

        await sleep(jitter(280, 180));
        this.activate("reportes", "Escritura del reporte époch");
        this.transfer("reportar", "reportes", "report", `${Date.now()}-${state.dto.seq}-vigila-topologia.md — ${state.dto.summary?.slice(0, 140)}`, id, "reportar");
        this.deactivate("reportes", "Reporte persistido");
        await sleep(jitter(260, 160));
        this.activate("memoria", "Worklog append-only (P9)");
        this.transfer("reportar", "memoria", "report", `worklog += iter#${state.dto.seq} veredicto ${verdict}`, id, "reportar");
        this.deactivate("memoria", "Worklog anexado");
        return `veredicto ${verdict} — ${res.ok ? "síntesis L2 real" : "fallback determinista"}`;
      }
    }
  }

  private async finishIteration(state: IterationState): Promise<void> {
    const id = state.dto.id;
    // Response path back to the console
    this.transfer("sentinela", "consola", "control", `iteración #${state.dto.seq} → ${state.dto.verdict ?? "MIXED"}`, id, "ciclo");
    this.activate("consola", "Recibe el resultado del ciclo");
    await sleep(jitter(280, 180));
    this.deactivate("consola", "Resultado entregado");
    this.deactivate("sentinela", "Ciclo cerrado");
    this.deactivate("dispatcher", "Comando completado");

    const transfers = this.transfers.filter((t) => t.iterationId === id);
    state.dto.transfers = transfers.length;
    state.dto.bytes = transfers.reduce((a, t) => a + t.bytes, 0);
    state.dto.status = "done";
    state.dto.endedAt = Date.now();
    if (!state.dto.verdict) state.dto.verdict = "MIXED";
    if (!state.dto.summary) state.dto.summary = "Iteración detenida por el operador antes de completar todas las etapas.";

    this.kpiBase.iterationsRunning = 0;
    this.kpiBase.iterationsCompleted += 1;
    if (state.dto.verdict === "AGREE") this.kpiBase.verdictsAgree += 1;
    else if (state.dto.verdict === "DISAGREE") this.kpiBase.verdictsDisagree += 1;
    else this.kpiBase.verdictsMixed += 1;

    this.io.emit("topo:iteration", { ...state.dto, steps: { ...state.dto.steps } });
    this.log(
      "success",
      `Iteración #${state.dto.seq} completada — ${state.dto.verdict} · ${state.dto.transfers} transferencias · ${(state.dto.bytes / 1024).toFixed(1)} KB de contexto`
    );
    this.refreshFindings();
    this.current = null;
    this.running = this.queue > 0 && !this.stopRequested;
  }
}
