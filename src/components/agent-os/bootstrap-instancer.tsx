"use client";

// ════════════════════════════════════════════════════════════════════════
// bootstrap-instancer.tsx — Instanciador Zero-Shot (Protocolo 11).
// Input tipo chatbot: "Cuéntame qué app deseas crear" → NO genera la app:
// genera AGENTS.md + todos los archivos derivados e interconectados que
// garantizan el condicionamiento conductual del LLM, descargables en ZIP.
// Bucle agéntico visible: investigar → planear → pre-report → generar →
// verificar → pro-report → empaquetar.
// ════════════════════════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp, BrainCircuit, CheckCircle2, ChevronRight, ClipboardList, Clock,
  Cpu, Download, FileJson, FileText, FolderClosed, Layers, Loader2,
  Package, Rocket, Search, ShieldCheck, Sparkles, TriangleAlert, Users,
} from "lucide-react";
import { GlowingCtaButton } from "@/components/agent-os/glowing-cta-button";
import type { CtaState } from "@/components/agent-os/glowing-cta-button";
import type { BootstrapRunDTO, BootstrapRunSummary, FileOrigin } from "@/lib/agent-os/bootstrap/types";
import { isBootstrapActive } from "@/lib/agent-os/bootstrap/types";

const EXAMPLES = [
  "crea una app para procesar múltiples archivos y combinarlos todos dentro de un pdf",
  "quiero un SaaS de gestión dental con historias clínicas, agenda y facturación",
  "una plataforma de suscripciones para gimnasios con clases, pagos y app móvil",
];

const PHASES = [
  { key: "RESEARCH", label: "Investigando", icon: Search, statuses: ["PENDING", "RESEARCHING"] },
  { key: "PLAN", label: "Planificando", icon: ClipboardList, statuses: ["PLANNING"] },
  { key: "GEN", label: "Generando", icon: Cpu, statuses: ["GENERATING"] },
  { key: "VERIFY", label: "Verificando", icon: ShieldCheck, statuses: ["VERIFYING"] },
  { key: "PACK", label: "Empaquetando", icon: Package, statuses: ["PACKAGING"] },
] as const;

function fmtBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—";
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

const ORIGIN_STYLE: Record<FileOrigin, { label: string; cls: string }> = {
  llm: { label: "L2", cls: "bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20" },
  template: { label: "tpl", cls: "bg-[#af52de]/10 text-[#8944ab] border-[#af52de]/20" },
  static: { label: "std", cls: "bg-[#86868b]/10 text-[#6e6e73] border-[#e5e5ea]" },
};

export function BootstrapInstancer() {
  const [mode, setMode] = useState<"input" | "run">("input");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [run, setRun] = useState<BootstrapRunDTO | null>(null);
  const [history, setHistory] = useState<BootstrapRunSummary[]>([]);
  const [preview, setPreview] = useState<{ path: string; content: string; origin: string; bytes: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  // ── Historial ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/agent-os/bootstrap", { cache: "no-store" });
      const json = (await res.json()) as { success: boolean; data: BootstrapRunSummary[] | null };
      if (json.success && json.data) setHistory(json.data);
    } catch {
      /* historial es best-effort */
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Polling del run activo ─────────────────────────────────────────────
  const poll = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/agent-os/bootstrap/${id}`, { cache: "no-store" });
        const json = (await res.json()) as { success: boolean; data: BootstrapRunDTO | null; error: string | null };
        if (json.success && json.data) {
          setRun(json.data);
          if (isBootstrapActive(json.data.status)) {
            pollRef.current = setTimeout(() => poll(id), 1800);
          } else {
            loadHistory();
          }
          return;
        }
        throw new Error(json.error ?? "error consultando");
      } catch {
        // tolerancia a fallos transitorios: reintento con backoff
        pollRef.current = setTimeout(() => poll(id), 3500);
      }
    },
    [loadHistory]
  );

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  const startRun = useCallback(
    async (id: string) => {
      startedAtRef.current = Date.now();
      setPreview(null);
      setMode("run");
      if (pollRef.current) clearTimeout(pollRef.current);
      poll(id);
    },
    [poll]
  );

  const submit = useCallback(
    async (text?: string) => {
      const value = (text ?? prompt).trim();
      if (value.length < 10 || submitting) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/agent-os/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: value }),
        });
        const json = (await res.json()) as { success: boolean; data: { runId: string } | null; error: string | null };
        if (!json.success || !json.data) throw new Error(json.error ?? "Error creando la instanciación");
        setPrompt(value);
        setRun(null);
        await startRun(json.data.runId);
      } catch (e) {
        setRun({
          id: "error", prompt: value, projectName: null, slug: null, status: "ERROR",
          progress: 0, phaseDetail: null, fileCount: 0, llmCalls: 0, durationMs: null,
          error: e instanceof Error ? e.message : "Error desconocido", createdAt: new Date().toISOString(),
          spec: null, research: null, files: [],
        });
        setMode("run");
      } finally {
        setSubmitting(false);
      }
    },
    [prompt, submitting, startRun]
  );

  const openHistory = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/agent-os/bootstrap/${id}`, { cache: "no-store" });
        const json = (await res.json()) as { success: boolean; data: BootstrapRunDTO | null };
        if (json.success && json.data) {
          setRun(json.data);
          setPrompt(json.data.prompt);
          setPreview(null);
          if (isBootstrapActive(json.data.status)) startRun(id);
          else setMode("run");
        }
      } catch {
        /* ignore */
      }
    },
    [startRun]
  );

  const openPreview = useCallback(
    async (path: string) => {
      if (!run) return;
      setPreviewLoading(true);
      setPreview({ path, content: "", origin: "", bytes: 0 });
      try {
        const res = await fetch(`/api/agent-os/bootstrap/${run.id}?path=${encodeURIComponent(path)}`, { cache: "no-store" });
        const json = (await res.json()) as {
          success: boolean;
          data: { path: string; content: string; bytes: number; origin: string } | null;
          error: string | null;
        };
        if (json.success && json.data) setPreview(json.data);
        else setPreview({ path, content: json.error ?? "No disponible", origin: "static", bytes: 0 });
      } catch (e) {
        setPreview({ path, content: e instanceof Error ? e.message : "Error de red", origin: "static", bytes: 0 });
      } finally {
        setPreviewLoading(false);
      }
    },
    [run]
  );

  const reset = useCallback(() => {
    if (pollRef.current) clearTimeout(pollRef.current);
    setMode("input");
    setRun(null);
    setPreview(null);
    setPrompt("");
  }, []);

  // ── Derivados ──────────────────────────────────────────────────────────
  const activePhaseIdx = useMemo(() => {
    if (!run) return -1;
    const idx = PHASES.findIndex((p) => p.statuses.includes(run.status as never));
    return run.status === "COMPLETED" ? PHASES.length : idx;
  }, [run]);

  const groupedFiles = useMemo(() => {
    if (!run) return [] as Array<{ group: string; files: BootstrapRunDTO["files"] }>;
    const map = new Map<string, BootstrapRunDTO["files"]>();
    for (const f of run.files) {
      const group = f.path.includes("/") ? f.path.split("/")[0] : "· raíz";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(f);
    }
    const order = (g: string) =>
      g === "· raíz" ? 0 : g === "docs" ? 1 : g === "mcp" ? 2 : g === "scripts" ? 3 : g === "packages" ? 4 : 5;
    return [...map.entries()]
      .sort((a, b) => order(a[0]) - order(b[0]) || a[0].localeCompare(b[0]))
      .map(([group, files]) => ({ group, files: files.slice().sort((a, b) => a.path.localeCompare(b.path)) }));
  }, [run]);

  const totalKb = useMemo(
    () => (run ? run.files.reduce((a, f) => a + f.bytes, 0) / 1024 : 0),
    [run]
  );
  const fuentes = useMemo(() => run?.research?.reduce((a, r) => a + r.results.length, 0) ?? 0, [run]);
  const elapsed = run && isBootstrapActive(run.status) ? (now - startedAtRef.current) / 1000 : null;
  const ctaState: CtaState = run?.status === "COMPLETED" ? "ready" : "loading";

  // ════════════════════════════════════════════════════════════════════
  // VISTA: INPUT (chatbot-like)
  // ════════════════════════════════════════════════════════════════════
  if (mode === "input") {
    return (
      <div className="space-y-6">
        {/* Hero */}
        <section aria-label="Instanciador Agent OS" className="relative overflow-hidden rounded-2xl border border-[#e5e5ea] bg-white p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#0071e3]/6 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0071e3]">
                <Rocket className="size-3.5" aria-hidden="true" />
                Protocolo 11 · Zero-Shot Project Bootstrap
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[#1d1d1f] sm:text-4xl">
                Cuéntame qué app
                <br />
                deseas crear.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#86868b]">
                No genera la app: genera <span className="font-medium text-[#1d1d1f]">AGENTS.md</span> y todos los
                archivos derivados e interconectados —catálogos, personas, prompts de dominio, memoria empírica y
                puentes IDE— que garantizan que el LLM que uses siga el workflow agéntico diseñado, ajustado al
                tópico de tu proyecto. Todo descargable en un ZIP.
              </p>
            </div>
            <dl className="grid shrink-0 grid-cols-2 gap-3">
              {[
                { icon: BrainCircuit, label: "Condiciona al LLM", value: "115+ archivos" },
                { icon: Layers, label: "Constitución inmutable", value: "P1-P15" },
                { icon: Search, label: "Investiga de verdad", value: "web en vivo" },
                { icon: Package, label: "Entrega", value: "ZIP + MANIFEST" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-3.5 py-3">
                  <s.icon className="size-4 text-[#0071e3]" aria-hidden="true" />
                  <dd className="mt-1.5 font-mono text-sm font-semibold text-[#1d1d1f]">{s.value}</dd>
                  <dt className="text-[10px] font-medium text-[#86868b]">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Input tipo chatbot */}
        <section aria-label="Prompt del proyecto" className="rounded-2xl border border-[#e5e5ea] bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="rounded-xl focus-within:ring-2 focus-within:ring-[#0071e3]/30">
            <label htmlFor="bootstrap-prompt" className="sr-only">
              Cuéntame qué app deseas crear
            </label>
            <textarea
              id="bootstrap-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={4}
              maxLength={2000}
              placeholder="Cuéntame qué app deseas crear… ej. crea una app para procesar múltiples archivos y combinarlos todos dentro de un pdf"
              className="w-full resize-none rounded-xl bg-transparent px-4 pt-4 text-sm leading-relaxed text-[#1d1d1f] outline-none placeholder:text-[#c7c7cc]"
            />
            <div className="flex items-center justify-between gap-3 px-4 pb-3">
              <p className="font-mono text-[10px] text-[#86868b]">
                Enter para instanciar · Shift+Enter salto de línea · {prompt.length}/2000
              </p>
              <button
                type="button"
                onClick={() => submit()}
                disabled={prompt.trim().length < 10 || submitting}
                aria-label="Instanciar el scaffold Agent OS"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-white transition-all hover:scale-105 hover:bg-[#000] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowUp className="size-5" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </section>

        {/* Ejemplos */}
        <section aria-label="Ejemplos de prompt" className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-[#86868b]">Prueba con:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="rounded-full border border-[#e5e5ea] bg-white px-3.5 py-1.5 text-[11px] text-[#4b4b50] transition-colors hover:border-[#0071e3]/40 hover:text-[#0071e3]"
            >
              {ex.length > 64 ? `${ex.slice(0, 64)}…` : ex}
            </button>
          ))}
        </section>

        {/* Cómo funciona */}
        <section aria-label="Cómo funciona el instanciador" className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "1 · Investiga (zero-knowledge)",
              body: "Asume que ni tú ni el modelo saben nada del tópico: ejecuta búsqueda web real sobre las mejores apps del nicho, prácticas, seguridad y modelos de negocio antes de diseñar nada.",
            },
            {
              icon: ClipboardList,
              title: "2 · Planea y reporta",
              body: "Refactoriza tu prompt con roles de expertos y etiquetas XML, deriva los goals G1-Gn del proyecto y emite el pre-report antes de generar un solo archivo.",
            },
            {
              icon: Cpu,
              title: "3 · Genera y verifica",
              body: "Genera catálogos, personas y prompts adaptados al dominio; ensambla la constitución inmutable + tu contexto; auto-critica con checks deterministas y emite el pro-report.",
            },
          ].map((c) => (
            <article key={c.title} className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
              <c.icon className="size-5 text-[#0071e3]" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold text-[#1d1d1f]">{c.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#86868b]">{c.body}</p>
            </article>
          ))}
        </section>

        {/* Historial */}
        {history.length > 0 && (
          <section aria-label="Instanciaciones anteriores" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Instanciaciones anteriores</h3>
            <div className="os-scroll mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {history.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => openHistory(h.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-3.5 py-2.5 text-left transition-colors hover:border-[#0071e3]/30"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      h.status === "COMPLETED" ? "bg-[#248a3d]" : h.status === "ERROR" ? "bg-[#ff3b30]" : "animate-pulse bg-[#ff9f0a]"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#1d1d1f]">
                    {h.projectName ?? h.id}
                  </span>
                  <span className="hidden shrink-0 font-mono text-[10px] text-[#86868b] sm:inline">
                    {h.fileCount} archivos · {fmtDuration(h.durationMs)}
                  </span>
                  <ChevronRight className="size-3.5 shrink-0 text-[#c7c7cc]" aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // VISTA: RUN (progreso / resultado / error)
  // ════════════════════════════════════════════════════════════════════
  const isError = run?.status === "ERROR";
  const isDone = run?.status === "COMPLETED";

  return (
    <div className="space-y-5">
      {/* Cabecera del run */}
      <section
        aria-label="Estado de la instanciación"
        className={`rounded-2xl border p-5 sm:p-6 ${
          isError ? "border-[#ff3b30]/30 bg-[#ff3b30]/5" : "border-[#e5e5ea] bg-white"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
              {isDone ? (
                <>
                  <CheckCircle2 className="size-3.5 text-[#248a3d]" aria-hidden="true" />
                  Scaffold instanciado · {run?.phaseDetail}
                </>
              ) : isError ? (
                <>
                  <TriangleAlert className="size-3.5 text-[#ff3b30]" aria-hidden="true" />
                  Instanciación fallida (P2: el error queda registrado)
                </>
              ) : (
                <>
                  <Loader2 className="size-3.5 animate-spin text-[#0071e3]" aria-hidden="true" />
                  {run?.phaseDetail ?? "Arrancando en frío…"}
                </>
              )}
            </p>
            <h2 className="mt-1.5 truncate text-xl font-semibold tracking-tight text-[#1d1d1f]">
              {run?.spec?.projectName ?? run?.projectName ?? "Derivando el producto de tu prompt…"}
            </h2>
            {run?.spec?.oneLiner && <p className="mt-1 text-xs text-[#86868b]">{run.spec.oneLiner}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {elapsed != null && (
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#86868b]">
                <Clock className="size-3.5" aria-hidden="true" />
                {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, "0")}
              </span>
            )}
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-[#e5e5ea] bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#1d1d1f] transition-colors hover:border-[#d2d2d7] hover:bg-[#f5f5f7]"
            >
              Instanciar otro
            </button>
          </div>
        </div>

        {/* Stepper de fases */}
        {!isError && (
          <ol className="os-scroll mt-5 flex items-start gap-1 overflow-x-auto" aria-label="Fases del bucle agéntico">
            {PHASES.map((phase, i) => {
              const done = activePhaseIdx > i || isDone;
              const current = activePhaseIdx === i && !isDone;
              return (
                <li key={phase.key} className="flex min-w-[104px] flex-1 flex-col items-center gap-1.5 text-center">
                  <span
                    className={`flex size-9 items-center justify-center rounded-full border transition-all ${
                      done
                        ? "border-[#248a3d]/30 bg-[#248a3d]/10 text-[#248a3d]"
                        : current
                          ? "animate-pulse border-[#0071e3]/40 bg-[#0071e3]/10 text-[#0071e3]"
                          : "border-[#e5e5ea] bg-[#fafafc] text-[#c7c7cc]"
                    }`}
                  >
                    {done ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <phase.icon className="size-4" aria-hidden="true" />}
                  </span>
                  <span className={`text-[10px] font-medium ${done || current ? "text-[#1d1d1f]" : "text-[#c7c7cc]"}`}>
                    {phase.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {/* Barra de progreso */}
        {!isError && (
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#f5f5f7]" role="progressbar" aria-valuenow={run?.progress ?? 0} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0071e3] to-[#248a3d] transition-all duration-700"
                style={{ width: `${run?.progress ?? 2}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-[#86868b]">
              <span>{run?.progress ?? 0}%</span>
              <span>
                {run?.llmCalls ?? 0} llamadas L2 · {run?.files.length ?? 0} archivos
              </span>
            </div>
          </div>
        )}

        {isError && run?.error && (
          <p className="mt-3 rounded-xl bg-white px-4 py-3 font-mono text-xs text-[#d70015]">{run.error}</p>
        )}
      </section>

      {/* Feed vivo de archivos (mientras corre) */}
      {!isDone && !isError && run && run.files.length > 0 && (
        <section aria-label="Archivos generados en vivo" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
            <FileText className="size-4 text-[#0071e3]" aria-hidden="true" />
            Scaffold en construcción
          </h3>
          <div className="os-scroll mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
            {run.files
              .slice()
              .reverse()
              .map((f) => (
                <div key={f.path} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 font-mono text-[11px]">
                  <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${ORIGIN_STYLE[f.origin].cls}`}>
                    {ORIGIN_STYLE[f.origin].label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[#4b4b50]">{f.path}</span>
                  <span className="shrink-0 text-[10px] text-[#c7c7cc]">{fmtBytes(f.bytes)}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ══ RESULTADO ══════════════════════════════════════════════════ */}
      {isDone && run && (
        <>
          {/* Resumen + descarga */}
          <section aria-label="Resumen del scaffold" className="grid gap-4 lg:grid-cols-12">
            <div className="rounded-2xl border border-[#e5e5ea] bg-white p-5 lg:col-span-7">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0071e3]">
                Spec derivada de tu prompt (Fase 1)
              </p>
              {run.spec ? (
                <div className="mt-3 space-y-4">
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">Goals del proyecto</h3>
                    <ul className="mt-1.5 space-y-1">
                      {run.spec.goals.slice(0, 6).map((g, i) => (
                        <li key={i} className="flex gap-2 text-xs leading-relaxed text-[#1d1d1f]">
                          <span className="shrink-0 font-mono text-[10px] font-semibold text-[#0071e3]">G{i + 1}</span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
                        <Users className="size-3" aria-hidden="true" /> Roles de expertos
                      </h3>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {run.spec.expertRoles.map((r) => (
                          <span key={r.role} className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[10px] font-medium text-[#1d1d1f]">
                            {r.role}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">Stack recomendado</h3>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {run.spec.stack.slice(0, 5).map((s) => (
                          <span key={s} className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[10px] font-medium text-[#1d1d1f]">
                            {s.length > 40 ? `${s.slice(0, 40)}…` : s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <details className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-3.5 py-2.5">
                    <summary className="cursor-pointer list-none text-[11px] font-semibold text-[#1d1d1f]">
                      Prompt refactorizado (XML) · {fuentes} fuentes de investigación
                    </summary>
                    <pre className="os-scroll mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-white px-3 py-2 font-mono text-[10px] leading-relaxed text-[#4b4b50]">
                      {run.spec.xmlPrompt}
                    </pre>
                  </details>
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#86868b]">Spec no disponible.</p>
              )}
            </div>

            <div className="flex flex-col gap-4 lg:col-span-5">
              {/* Estadísticas */}
              <dl className="grid grid-cols-2 gap-3">
                {[
                  { label: "Archivos", value: `${run.files.length}` },
                  { label: "Peso total", value: `${totalKb.toFixed(0)} KB` },
                  { label: "Llamadas L2", value: `${run.llmCalls}` },
                  { label: "Duración", value: fmtDuration(run.durationMs) },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-[#e5e5ea] bg-white px-3.5 py-3">
                    <dd className="font-mono text-lg font-semibold text-[#1d1d1f]">{s.value}</dd>
                    <dt className="text-[10px] font-medium text-[#86868b]">{s.label}</dt>
                  </div>
                ))}
              </dl>
              {/* Descarga */}
              <div className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
                <p className="text-sm font-semibold text-[#1d1d1f]">Tu scaffold está listo</p>
                <p className="mt-1 text-xs leading-relaxed text-[#86868b]">
                  ZIP con raíz <span className="font-mono">{run.slug}</span>/ · incluye MANIFEST.json con sha256
                  por archivo y verificación de interconexiones. Descomprime, ábrelo en tu IDE y la capa de
                  auto-activación hace el resto.
                </p>
                <div className="mt-4">
                  <GlowingCtaButton
                    ctaState={ctaState}
                    onClick={() => {
                      window.location.href = `/api/agent-os/bootstrap/${run.id}/download`;
                    }}
                    icon={<Download className="size-4" aria-hidden="true" />}
                    aria-label="Descargar el scaffold completo en ZIP"
                  >
                    Descargar scaffold (.zip)
                  </GlowingCtaButton>
                </div>
              </div>
            </div>
          </section>

          {/* Árbol de archivos + preview */}
          <section aria-label="Archivos del scaffold" className="grid gap-4 lg:grid-cols-12">
            <div className="rounded-2xl border border-[#e5e5ea] bg-white p-5 lg:col-span-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                <Layers className="size-4 text-[#0071e3]" aria-hidden="true" />
                Estructura entregada
              </h3>
              <div className="os-scroll mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {groupedFiles.map((g) => (
                  <details key={g.group} open={g.group === "· raíz" || g.group === "docs"}>
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg bg-[#fafafc] px-2.5 py-1.5">
                      <FolderClosed className="size-3.5 text-[#86868b]" aria-hidden="true" />
                      <span className="font-mono text-[11px] font-semibold text-[#1d1d1f]">{g.group}</span>
                      <span className="ml-auto font-mono text-[10px] text-[#86868b]">
                        {g.files.length} · {fmtBytes(g.files.reduce((a, f) => a + f.bytes, 0))}
                      </span>
                    </summary>
                    <ul className="mt-1 space-y-0.5 border-l border-[#e5e5ea] pl-2">
                      {g.files.map((f) => (
                        <li key={f.path}>
                          <button
                            type="button"
                            onClick={() => openPreview(f.path)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left font-mono text-[10px] transition-colors hover:bg-[#f5f5f7] ${
                              preview?.path === f.path ? "bg-[#0071e3]/5 text-[#0071e3]" : "text-[#4b4b50]"
                            }`}
                          >
                            <span className={`shrink-0 rounded-full border px-1.5 text-[8px] font-semibold ${ORIGIN_STYLE[f.origin].cls}`}>
                              {ORIGIN_STYLE[f.origin].label}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{f.path}</span>
                            <span className="shrink-0 text-[9px] text-[#c7c7cc]">{fmtBytes(f.bytes)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e5e5ea] bg-white p-5 lg:col-span-7">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                <FileJson className="size-4 text-[#0071e3]" aria-hidden="true" />
                {preview ? preview.path : "Vista previa"}
              </h3>
              {previewLoading && !preview.content ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-[#86868b]">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Cargando contenido…
                </div>
              ) : preview ? (
                <pre className="os-scroll mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl bg-[#fafafc] px-4 py-3 font-mono text-[10px] leading-relaxed text-[#4b4b50]">
                  {preview.content}
                </pre>
              ) : (
                <div className="mt-3 flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#e5e5ea] text-center">
                  <Sparkles className="size-5 text-[#c7c7cc]" aria-hidden="true" />
                  <p className="max-w-xs text-xs leading-relaxed text-[#86868b]">
                    Selecciona cualquier archivo del árbol para inspeccionar su contenido: la constitución
                    contextualizada, los catálogos, las personas de tu dominio o los reportes PRE/PRO.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
