"use client";

// ════════════════════════════════════════════════════════════════════════
// bucle-panel.tsx — Bucle Agéntico Goal-Driven (comando bucle, v2.0.0)
// El orquestador del workflow infinito: goals definidos y generados desde
// el prompt inicial → investiga → plan de pasos y tareas → reporte PRE →
// ejecuta → reporte PRO → critica (P13) → aprende (P9) → evalúa → handoff
// → siguiente iteración hasta lograr los goals. Polling 2.5s en RUNNING.
// ════════════════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Infinity as InfinityIcon, CheckCircle2, XCircle, Loader2, Circle,
  ChevronRight, Target, ListChecks, FileClock, ArrowRightLeft, Play,
} from "lucide-react";
import { GlowingCtaButton, type CtaState } from "@/components/agent-os/glowing-cta-button";

interface StageRecord {
  name: string;
  status: "done" | "fail";
  durationMs: number;
  evidence: string;
}

interface HandoffData {
  resumen: string;
  aprendido: string;
  pendientes: string;
  siguiente: string;
}

interface BucleData {
  run: {
    id: string; prompt: string; topic: string; status: string;
    iteration: number; maxIterations: number; currentStage: string | null;
    stageDetail: string | null; stages: StageRecord[]; handoff: HandoffData | null;
    goalsAchieved: number; startedAt: string; updatedAt: string; finishedAt: string | null;
  } | null;
  goals: { code: string; title: string; acceptance: string; status: string; evidence: string | null; iteration: number }[];
  tasks: { id: string; iteration: number; order: number; goalCode: string | null; title: string; kind: string; status: string; output: string | null }[];
  reports: { epoch: number; title: string; verdict: string; createdAt: string }[];
  counts: { goalsAchieved: number; goalsTotal: number; tasksDone: number; tasksTotal: number };
}

const STAGES = ["metas", "investiga", "plan", "reporte-pre", "ejecuta", "reporte-pro", "critica", "aprende", "evalua", "handoff"] as const;

const RUN_STATUS_STYLE: Record<string, string> = {
  RUNNING: "border-[#0071e3]/40 bg-[#0071e3]/8 text-[#005bb5]",
  COMPLETED: "border-[#34c759]/40 bg-[#34c759]/10 text-[#1e7d32]",
  PAUSED: "border-[#ff9500]/40 bg-[#ff9500]/10 text-[#c25e00]",
  FAILED: "border-[#ff3b30]/40 bg-[#ff3b30]/8 text-[#d70015]",
};

const GOAL_STATUS_STYLE: Record<string, string> = {
  ACHIEVED: "border-[#34c759]/40 bg-[#34c759]/10 text-[#1e7d32]",
  IN_PROGRESS: "border-[#0071e3]/40 bg-[#0071e3]/8 text-[#005bb5]",
  PENDING: "border-[#e5e5ea] bg-[#f5f5f7] text-[#86868b]",
  BLOCKED: "border-[#ff3b30]/40 bg-[#ff3b30]/8 text-[#d70015]",
};

const TASK_STATUS_ICON: Record<string, typeof Circle> = {
  DONE: CheckCircle2, FAILED: XCircle, RUNNING: Loader2,
  PENDING: Circle, OUT_OF_SCOPE: ChevronRight, SKIPPED: ChevronRight,
};

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s}s`;
  if (s < 3600) return `hace ${Math.floor(s / 60)}min`;
  return `hace ${Math.floor(s / 3600)}h`;
}

export function BuclePanel() {
  const [data, setData] = useState<BucleData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [maxIter, setMaxIter] = useState(2);
  const [startState, setStartState] = useState<CtaState>("ready");
  const [startMsg, setStartMsg] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agent-os/bucle", { cache: "no-store" });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error(`Respuesta no-JSON del gateway (HTTP ${res.status})`);
      const json = (await res.json()) as { success: boolean; data: BucleData | null; error: string | null };
      if (!json.success || !json.data) throw new Error(json.error ?? "Error obteniendo estado del bucle");
      setData(json.data);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Error desconocido");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Polling adaptativo: 2.5s con run RUNNING (progreso en vivo), 10s en reposo
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const running = data?.run?.status === "RUNNING";
    pollingRef.current = setInterval(load, running ? 2500 : 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [data?.run?.status, load]);

  const post = useCallback(async (body: Record<string, unknown>): Promise<{ ok: boolean; message: string }> => {
    try {
      const res = await fetch("/api/agent-os/bucle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error(`Respuesta no-JSON del gateway (HTTP ${res.status})`);
      const json = (await res.json()) as { success: boolean; data: { topic?: string; resumed?: boolean; iteration?: number } | null; error: string | null };
      if (!json.success || !json.data) throw new Error(json.error ?? "Error ejecutando el bucle");
      return {
        ok: true,
        message: json.data.resumed
          ? `Run "${json.data.topic}" reanudado (bucle infinito hasta lograr los goals)`
          : `Bucle arrancado — tema: "${json.data.topic}"`,
      };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Error desconocido" };
    }
  }, []);

  const start = useCallback(async () => {
    if (startState === "loading" || prompt.trim().length < 12) return;
    setStartState("loading");
    setStartMsg(null);
    const r = await post({ action: "start", prompt: prompt.trim(), maxIterations: maxIter });
    setStartMsg(r.message);
    setStartState(r.ok ? "success" : "error");
    if (r.ok) setPrompt("");
    await load();
    setTimeout(() => setStartState("ready"), 3000);
  }, [startState, prompt, maxIter, post, load]);

  const resume = useCallback(async () => {
    if (startState === "loading") return;
    setStartState("loading");
    setStartMsg(null);
    const r = await post({ action: "continue" });
    setStartMsg(r.message);
    setStartState(r.ok ? "success" : "error");
    await load();
    setTimeout(() => setStartState("ready"), 3000);
  }, [startState, post, load]);

  const run = data?.run ?? null;
  const isPaused = run?.status === "PAUSED";
  const canStart = prompt.trim().length >= 12 && startState === "ready";
  const ctaState: CtaState = canStart ? "enabled-glowing" : startState === "ready" ? (isPaused ? "enabled-glowing" : "ready") : startState;
  const stageStatus = (name: string): "done" | "fail" | "running" | "pending" => {
    const rec = run?.stages.find((s) => s.name === name);
    if (rec) return rec.status;
    if (run?.status === "RUNNING" && run.currentStage === name) return "running";
    return "pending";
  };

  return (
    <section data-tour="bucle" aria-label="Bucle Agéntico Goal-Driven" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
            <InfinityIcon className="size-4 text-[#0071e3]" aria-hidden="true" />
            Bucle Agéntico Goal-Driven
            <span className="rounded-full border border-[#e5e5ea] bg-[#f5f5f7] px-2 py-0.5 font-mono text-[9px] font-semibold text-[#86868b]">
              bucle · 19º canónico · v2.0.0
            </span>
          </h2>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[#86868b]">
            Asume cero conocimiento (ni el operador ni el LLM/SLM saben nada), deriva los goals del prompt inicial,
            investiga, genera el plan de pasos y tareas, emite reportes PRE/PRO, ejecuta, auto-critica (P13),
            auto-aprende (P9), evalúa los goals y re-itera con handoff — infinitamente hasta lograrlos.
          </p>
        </div>
        {isPaused && (
          <GlowingCtaButton ctaState={ctaState} onClick={resume} icon={<Play className="size-4" aria-hidden="true" />} aria-label="Reanudar el bucle pausado">
            Continuar bucle
          </GlowingCtaButton>
        )}
      </div>

      {/* Formulario de arranque del bucle */}
      <div className="mt-4 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] p-3">
        <label htmlFor="bucle-prompt" className="text-[11px] font-semibold text-[#1d1d1f]">
          Prompt inicial (los goals se definen y generan desde aquí)
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="bucle-prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canStart) start();
            }}
            placeholder="p. ej.: diseña y documenta el sistema de gestión de suscripciones de la app…"
            className="h-10 min-w-0 flex-1 rounded-lg border border-[#e5e5ea] bg-white px-3 text-xs text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            maxLength={2000}
          />
          <div className="flex items-center gap-2">
            <label htmlFor="bucle-max" className="sr-only">Iteraciones máximas en esta invocación</label>
            <select
              id="bucle-max"
              value={maxIter}
              onChange={(e) => setMaxIter(parseInt(e.target.value, 10))}
              className="h-10 rounded-lg border border-[#e5e5ea] bg-white px-2 text-xs text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none"
              aria-label="Iteraciones máximas en esta invocación"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} iter.</option>
              ))}
            </select>
            {!isPaused && (
              <GlowingCtaButton
                ctaState={ctaState}
                onClick={start}
                icon={<InfinityIcon className="size-4" aria-hidden="true" />}
                aria-label="Arrancar el bucle agéntico con el prompt ingresado"
              >
                {startState === "loading" ? "Arrancando..." : startState === "success" ? "Bucle en marcha" : startState === "error" ? "Error al arrancar" : "Arrancar bucle"}
              </GlowingCtaButton>
            )}
          </div>
        </div>
        {prompt.trim().length > 0 && prompt.trim().length < 12 && (
          <p className="mt-1.5 text-[10px] text-[#c25e00]">El prompt necesita al menos 12 caracteres para derivar goals.</p>
        )}
        {startMsg && (
          <p role="status" className={`mt-1.5 font-mono text-[10px] ${startState === "error" ? "text-[#d70015]" : "text-[#1e7d32]"}`}>
            {startMsg}
          </p>
        )}
      </div>

      {loadError && (
        <p role="alert" className="mt-3 rounded-lg border border-[#ff3b30]/30 bg-[#ff3b30]/5 px-3 py-2 font-mono text-[10px] text-[#d70015]">
          {loadError}
        </p>
      )}

      {!data && !loadError && (
        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#86868b]">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Consultando el estado del bucle...
        </div>
      )}

      {data && !run && (
        <p className="mt-4 rounded-xl border border-dashed border-[#e5e5ea] px-4 py-6 text-center text-[11px] text-[#86868b]">
          Todavía no hay runs del bucle. Escribe el prompt inicial arriba y arranca — los goals, el plan,
          los reportes y el handoff se generan desde ese prompt.
        </p>
      )}

      {run && (
        <>
          {/* Cabecera del run */}
          <div className="mt-4 rounded-xl border border-[#e5e5ea] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${RUN_STATUS_STYLE[run.status] ?? RUN_STATUS_STYLE.PENDING}`}>
                {run.status}
              </span>
              <h3 className="min-w-0 truncate text-xs font-semibold text-[#1d1d1f]">{run.topic}</h3>
              <span className="font-mono text-[10px] text-[#86868b]">run {run.id.slice(-8)} · {timeAgo(run.startedAt)}</span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-[#86868b]">
                <Target className="size-3" aria-hidden="true" />
                goals {data.counts.goalsAchieved}/{data.counts.goalsTotal}
                <ListChecks className="ml-2 size-3" aria-hidden="true" />
                tareas {data.counts.tasksDone}/{data.counts.tasksTotal}
                <ArrowRightLeft className="ml-2 size-3" aria-hidden="true" />
                iteración {run.iteration}/{run.maxIterations}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-[#86868b]">
              <span className="font-semibold text-[#4b4b50]">Prompt inicial:</span> {run.prompt}
            </p>
            {run.stageDetail && (
              <p className="mt-1.5 rounded-lg bg-[#f5f5f7] px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-[#4b4b50]">
                {run.currentStage ? `[${run.currentStage}] ` : ""}{run.stageDetail}
              </p>
            )}
          </div>

          {/* Pipeline de 10 etapas de la iteración en curso */}
          <div className="mt-3">
            <h4 className="text-[11px] font-semibold text-[#1d1d1f]">
              Iteración {run.iteration} — 10 etapas
              {run.status === "RUNNING" && <Loader2 className="ml-1.5 inline size-3 animate-spin text-[#0071e3]" aria-hidden="true" />}
            </h4>
            <ol className="os-scroll mt-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Etapas de la iteración">
              {STAGES.map((s, i) => {
                const st = stageStatus(s);
                const Icon = st === "done" ? CheckCircle2 : st === "fail" ? XCircle : st === "running" ? Loader2 : Circle;
                return (
                  <li
                    key={s}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] ${
                      st === "done"
                        ? "border-[#34c759]/40 bg-[#34c759]/10 text-[#1e7d32]"
                        : st === "fail"
                          ? "border-[#ff3b30]/40 bg-[#ff3b30]/8 text-[#d70015]"
                          : st === "running"
                            ? "border-[#0071e3]/40 bg-[#0071e3]/8 text-[#005bb5]"
                            : "border-[#e5e5ea] bg-white text-[#86868b]"
                    }`}
                    title={run.stages.find((r) => r.name === s)?.evidence ?? s}
                  >
                    <Icon className={`size-3 ${st === "running" ? "animate-spin" : ""}`} aria-hidden="true" />
                    {i + 1}. {s}
                    {run.stages.find((r) => r.name === s) && (
                      <span className="text-[#86868b]">{(run.stages.find((r) => r.name === s)!.durationMs / 1000).toFixed(1)}s</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Goals */}
          {data.goals.length > 0 && (
            <div className="mt-3">
              <h4 className="text-[11px] font-semibold text-[#1d1d1f]">Goals (definidos y generados desde el prompt inicial)</h4>
              <ul className="mt-2 space-y-1.5">
                {data.goals.map((g) => (
                  <li key={g.code} className="rounded-lg border border-[#e5e5ea] p-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${GOAL_STATUS_STYLE[g.status] ?? GOAL_STATUS_STYLE.PENDING}`}>
                        {g.code} · {g.status}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs text-[#1d1d1f]">{g.title}</span>
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-[#86868b]">
                      <span className="font-semibold text-[#4b4b50]">Aceptación:</span> {g.acceptance}
                    </p>
                    {g.evidence && (
                      <p className="mt-1 text-[10px] leading-relaxed text-[#1e7d32]">
                        <span className="font-semibold">Evidencia (evaluada en iteración {g.iteration}):</span> {g.evidence}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tareas del plan */}
          {data.tasks.length > 0 && (
            <div className="mt-3">
              <h4 className="text-[11px] font-semibold text-[#1d1d1f]">Plan — pasos y tareas por iteración</h4>
              <ul className="os-scroll mt-2 max-h-96 space-y-1.5 overflow-y-auto pr-1" aria-label="Tareas del bucle">
                {data.tasks.map((t) => {
                  const Icon = TASK_STATUS_ICON[t.status] ?? Circle;
                  return (
                    <li key={t.id} className="rounded-lg border border-[#e5e5ea] p-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon className={`size-3.5 shrink-0 ${t.status === "DONE" ? "text-[#34c759]" : t.status === "FAILED" ? "text-[#ff3b30]" : t.status === "RUNNING" ? "animate-spin text-[#0071e3]" : "text-[#86868b]"}`} aria-hidden="true" />
                        <span className="font-mono text-[10px] text-[#86868b]">i{t.iteration}·{t.order}</span>
                        <span className="rounded bg-[#f5f5f7] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#4b4b50]">{t.kind}</span>
                        {t.goalCode && <span className="rounded bg-[#0071e3]/8 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#005bb5]">{t.goalCode}</span>}
                        <span className="min-w-0 flex-1 text-[11px] text-[#1d1d1f]">{t.title}</span>
                      </div>
                      {t.output && (
                        <details className="mt-1.5">
                          <summary className="cursor-pointer text-[10px] font-medium text-[#0071e3]">Evidencia</summary>
                          <p className="mt-1 whitespace-pre-wrap rounded bg-[#f5f5f7] p-2 font-mono text-[10px] leading-relaxed text-[#4b4b50]">{t.output}</p>
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Handoff */}
          {run.handoff && (
            <div className="mt-3 rounded-xl border border-[#0071e3]/30 bg-[#0071e3]/[0.03] p-3">
              <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1d1d1f]">
                <ArrowRightLeft className="size-3.5 text-[#0071e3]" aria-hidden="true" />
                Handoff {run.topic} — contexto para la siguiente iteración
              </h4>
              <dl className="mt-2 space-y-1.5 text-[10px] leading-relaxed">
                <div><dt className="font-semibold text-[#4b4b50]">Resumen</dt><dd className="text-[#1d1d1f]">{run.handoff.resumen}</dd></div>
                <div><dt className="font-semibold text-[#4b4b50]">Aprendido</dt><dd className="text-[#1d1d1f]">{run.handoff.aprendido}</dd></div>
                <div><dt className="font-semibold text-[#4b4b50]">Pendientes</dt><dd className="text-[#1d1d1f]">{run.handoff.pendientes}</dd></div>
                <div><dt className="font-semibold text-[#4b4b50]">Siguiente</dt><dd className="text-[#005bb5]">{run.handoff.siguiente}</dd></div>
              </dl>
            </div>
          )}

          {/* Reportes PRE/PRO/crítica */}
          {data.reports.length > 0 && (
            <div className="mt-3">
              <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1d1d1f]">
                <FileClock className="size-3.5 text-[#0071e3]" aria-hidden="true" />
                Reportes del bucle (epochs inmutables)
              </h4>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {data.reports.map((r) => (
                  <li key={r.epoch + r.title} className="rounded-full border border-[#e5e5ea] bg-[#f5f5f7] px-2.5 py-1 font-mono text-[10px] text-[#4b4b50]">
                    {r.title} · {r.verdict} · epoch {r.epoch}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {run.status === "PAUSED" && (
            <p className="mt-3 rounded-lg border border-[#ff9500]/30 bg-[#ff9500]/5 px-3 py-2 text-[10px] leading-relaxed text-[#c25e00]">
              Goals pendientes detectados — el bucle quedó PAUSED (infinito entre invocaciones). Reanúdalo con el
              botón «Continuar bucle» o el comando <span className="font-mono">bucle continúa</span>: la siguiente
              iteración parte del handoff con los goals restantes.
            </p>
          )}
          {run.status === "COMPLETED" && (
            <p className="mt-3 rounded-lg border border-[#34c759]/30 bg-[#34c759]/5 px-3 py-2 text-[10px] leading-relaxed text-[#1e7d32]">
              Todos los goals del prompt inicial están ACHIEVED — el bucle terminó ({data.counts.goalsAchieved}/{data.counts.goalsTotal}),
              con reportes PRE/PRO/crítica y handoff persistidos (P9/P13).
            </p>
          )}
        </>
      )}
    </section>
  );
}
