"use client";

// ════════════════════════════════════════════════════════════════════════
// bootstrap-instancer.tsx — Instanciador Zero-Shot (Protocolo 11), multimodal.
// Input tipo chatbot: "Cuéntame qué app deseas crear" + material de primera
// mano opcional (URLs, imágenes/fotos de apps, videos demo). Con material,
// primero ejecuta la Radiografía Multimodal (visión + L2: conceptos,
// apariencia, animaciones, efectos, modelos de negocio) y luego genera todo
// siguiendo el flujo existente: AGENTS.md + derivados + ZIP. NO genera la
// app: genera el condicionamiento conductual del LLM que la construirá.
// ════════════════════════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp, BadgeCheck, Blocks, BrainCircuit, Briefcase, CheckCircle2, ChevronRight,
  ClipboardList, Clock, Cpu, Download, FileJson, FileText, Film, FolderClosed, Globe,
  ImagePlus, Layers, Lightbulb, Loader2, Package, Palette, Rocket, ScanLine, Search,
  ShieldCheck, Sparkles, TriangleAlert, Users, X,
} from "lucide-react";
import { GlowingCtaButton } from "@/components/agent-os/glowing-cta-button";
import type { CtaState } from "@/components/agent-os/glowing-cta-button";
import type { BootstrapRunDTO, BootstrapRunSummary, FileOrigin } from "@/lib/agent-os/bootstrap/types";
import { isBootstrapActive } from "@/lib/agent-os/bootstrap/types";
import { getRadiografiaRunClient, startMultimodalRadiografiaClient } from "@/lib/agent-os/client";
import type { MultimodalSourceInput, RadiografiaRunDTO, RadiografiaSourceKind } from "@/lib/agent-os/types";

const EXAMPLES = [
  "crea una app para procesar múltiples archivos y combinarlos todos dentro de un pdf",
  "quiero un SaaS de gestión dental con historias clínicas, agenda y facturación",
  "una plataforma de suscripciones para gimnasios con clases, pagos y app móvil",
];

// ── Límites multimodales (espejo exacto de radiografia-multimodal.ts) ─────
const MM_LIMITS = {
  MAX_SOURCES: 6,
  MAX_URLS: 3,
  MAX_IMAGE_BYTES: 8 * 1024 * 1024,
  MAX_VIDEO_BYTES: 20 * 1024 * 1024,
} as const;
const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/bmp";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska";

interface Attachment {
  id: string;
  kind: RadiografiaSourceKind;
  name: string;
  size: number;
  url?: string; // kind=url
  dataUrl?: string; // kind=image|video (para subir al backend)
  previewUrl?: string; // object URL ligero para thumbnails
}

const KIND_ICON: Record<RadiografiaSourceKind, typeof Globe> = {
  url: Globe,
  image: ImagePlus,
  video: Film,
};

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
  const [mode, setMode] = useState<"input" | "radiografia" | "run">("input");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [run, setRun] = useState<BootstrapRunDTO | null>(null);
  const [history, setHistory] = useState<BootstrapRunSummary[]>([]);
  const [preview, setPreview] = useState<{ path: string; content: string; origin: string; bytes: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  // ── Multimodal: attachments + radiografía ──────────────────────────────
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [urlDraft, setUrlDraft] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [xray, setXray] = useState<RadiografiaRunDTO | null>(null);
  const [xrayCountdown, setXrayCountdown] = useState<number | null>(null);
  const [xrayElapsed, setXrayElapsed] = useState(0);
  const xrayPollRef = useRef<string | null>(null);
  const xrayStartedRef = useRef<number>(Date.now());
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsRef = useRef<Attachment[]>([]);
  const promptRef = useRef("");

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  useEffect(() => {
    promptRef.current = prompt;
  }, [prompt]);

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

  // ── Radiografía multimodal: polling + continuación automática ─────────
  const continueToBootstrap = useCallback(
    async (radiografiaId: string, withXray: boolean) => {
      setXrayCountdown(null);
      setSubmitting(true);
      setLaunchError(null);
      try {
        const res = await fetch("/api/agent-os/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(withXray ? { prompt: promptRef.current, radiografiaId } : { prompt: promptRef.current }),
        });
        const json = (await res.json()) as { success: boolean; data: { runId: string } | null; error: string | null };
        if (!json.success || !json.data) throw new Error(json.error ?? "Error creando la instanciación");
        setRun(null);
        await startRun(json.data.runId);
      } catch (e) {
        setRun({
          id: "error", prompt: promptRef.current, projectName: null, slug: null, status: "ERROR",
          progress: 0, phaseDetail: null, fileCount: 0, llmCalls: 0, durationMs: null,
          error: e instanceof Error ? e.message : "Error desconocido", createdAt: new Date().toISOString(),
          spec: null, research: null, files: [],
        });
        setMode("run");
      } finally {
        setSubmitting(false);
      }
    },
    [startRun]
  );

  const pollXray = useCallback(
    (id: string) => {
      if (xrayPollRef.current === id) return;
      xrayPollRef.current = id;
      const tick = async () => {
        if (xrayPollRef.current !== id) return;
        const run = await getRadiografiaRunClient(id);
        if (!run || xrayPollRef.current !== id) return;
        setXray(run);
        setXrayElapsed(Math.round((Date.now() - xrayStartedRef.current) / 1000));
        if (run.status === "RUNNING" || run.status === "PENDING") {
          setTimeout(tick, 2000);
        } else {
          xrayPollRef.current = null;
          if (run.status === "COMPLETED") {
            // Continuación auto-mágica: cuenta regresiva cancelable hacia el
            // flujo existente del Instanciador (radiografía → bootstrap).
            setXrayCountdown(6);
          }
        }
      };
      setTimeout(tick, 400);
    },
    []
  );

  // Cuenta regresiva: al llegar a 0 continúa sola al bootstrap con la radiografía.
  useEffect(() => {
    if (xrayCountdown == null || xrayCountdown <= 0) return;
    const t = setTimeout(() => {
      if (xrayCountdown === 1) {
        const id = xray?.id;
        if (id) void continueToBootstrap(id, true);
      } else {
        setXrayCountdown((c) => (c == null ? null : c - 1));
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [xrayCountdown, xray, continueToBootstrap]);

  // Reloj de la radiografía mientras corre.
  useEffect(() => {
    if (mode !== "radiografia" || xray?.status !== "RUNNING") return;
    const t = setInterval(() => setXrayElapsed(Math.round((Date.now() - xrayStartedRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [mode, xray?.status]);

  // ── Attachments: alta/baja con validación espejo del backend ───────────
  const addUrlAttachment = useCallback(() => {
    const raw = urlDraft.trim();
    if (!raw) return;
    let parsed: URL;
    try {
      parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    } catch {
      setLaunchError("URL inválida — revísala e intenta de nuevo.");
      return;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      setLaunchError("Solo se aceptan URLs http/https.");
      return;
    }
    setAttachments((prev) => {
      if (prev.length >= MM_LIMITS.MAX_SOURCES) {
        setLaunchError(`Máximo ${MM_LIMITS.MAX_SOURCES} fuentes por radiografía.`);
        return prev;
      }
      if (prev.filter((a) => a.kind === "url").length >= MM_LIMITS.MAX_URLS) {
        setLaunchError(`Máximo ${MM_LIMITS.MAX_URLS} URLs por radiografía.`);
        return prev;
      }
      if (prev.some((a) => a.url === parsed.toString())) return prev;
      return [...prev, { id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind: "url", name: parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname.slice(0, 24) : ""), size: 0, url: parsed.toString() }];
    });
    setUrlDraft("");
    setShowUrlInput(false);
    setLaunchError(null);
  }, [urlDraft]);

  const addFileAttachments = useCallback((files: FileList | null, kind: "image" | "video") => {
    if (!files || files.length === 0) return;
    const limit = kind === "image" ? MM_LIMITS.MAX_IMAGE_BYTES : MM_LIMITS.MAX_VIDEO_BYTES;
    const incoming: Attachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > limit) {
        setLaunchError(`"${f.name}" pesa ${fmtBytes(f.size)} — el límite por ${kind === "image" ? "imagen" : "video"} es ${fmtBytes(limit)}.`);
        continue;
      }
      incoming.push({
        id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind,
        name: f.name,
        size: f.size,
        dataUrl: undefined,
        previewUrl: kind === "image" ? URL.createObjectURL(f) : undefined,
      });
    }
    if (incoming.length === 0) return;
    setAttachments((prev) => {
      const space = MM_LIMITS.MAX_SOURCES - prev.length;
      if (space <= 0) {
        setLaunchError(`Máximo ${MM_LIMITS.MAX_SOURCES} fuentes por radiografía.`);
        return prev;
      }
      if (incoming.length > space) {
        setLaunchError(`Máximo ${MM_LIMITS.MAX_SOURCES} fuentes: se añadieron ${space} de ${incoming.length}.`);
      }
      const accepted = incoming.slice(0, space);
      // Leer dataUrls DESPUÉS de conocer los aceptados (evita lecturas huérfanas).
      const filesArr = Array.from(files ?? []);
      accepted.forEach((a, i) => {
        const file = filesArr.find((f) => f.name === a.name && f.size === a.size) ?? filesArr[i];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((cur) => cur.map((x) => (x.id === a.id ? { ...x, dataUrl: String(reader.result) } : x)));
        };
        reader.readAsDataURL(file);
      });
      return [...prev, ...accepted];
    });
    setLaunchError(null);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  // Limpieza de object URLs al desmontar.
  useEffect(
    () => () => {
      for (const a of attachmentsRef.current) {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      }
      if (xrayPollRef.current) xrayPollRef.current = null;
    },
    []
  );

  const hasAttachments = attachments.length > 0;
  const canSubmit = prompt.trim().length >= 10 || hasAttachments;

  const submit = useCallback(
    async (text?: string) => {
      const value = (text ?? prompt).trim();
      const hasAttachments = attachmentsRef.current.length > 0;
      if ((value.length < 10 && !hasAttachments) || submitting) return;
      setSubmitting(true);
      setLaunchError(null);
      try {
        if (hasAttachments) {
          // ── Flujo multimodal: Radiografía primero → luego el flujo existente ──
          const sources: MultimodalSourceInput[] = attachmentsRef.current.map((a) =>
            a.kind === "url"
              ? { kind: "url", url: a.url }
              : { kind: a.kind, name: a.name, dataUrl: a.dataUrl }
          );
          const launched = await startMultimodalRadiografiaClient(sources, value || undefined);
          if (!launched.ok) {
            setLaunchError(launched.error);
            return;
          }
          setPrompt(value);
          setXray(launched.run);
          setXrayCountdown(null);
          setXrayElapsed(0);
          xrayStartedRef.current = Date.now();
          setMode("radiografia");
          pollXray(launched.run.id);
          return;
        }
        // ── Flujo clásico: bootstrap directo ──
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
    [prompt, submitting, startRun, pollXray]
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
    xrayPollRef.current = null;
    setMode("input");
    setRun(null);
    setPreview(null);
    setPrompt("");
    setXray(null);
    setXrayCountdown(null);
    setLaunchError(null);
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
                Texto, o <span className="font-medium text-[#1d1d1f]">URLs, capturas, fotos y videos</span> de la app de
                referencia: primero le hace una <span className="font-medium text-[#1d1d1f]">radiografía</span> (conceptos,
                apariencia, animaciones, efectos y modelo de negocio) y luego genera{" "}
                <span className="font-medium text-[#1d1d1f]">AGENTS.md</span> y todos los archivos derivados e interconectados —catálogos,
                personas, prompts de dominio, memoria empírica y puentes IDE— que garantizan que el LLM que uses siga el
                workflow agéntico diseñado. Todo descargable en un ZIP.
              </p>
            </div>
            <dl className="grid shrink-0 grid-cols-2 gap-3">
              {[
                { icon: ScanLine, label: "Radiografía multimodal", value: "URL · imagen · video" },
                { icon: BrainCircuit, label: "Condiciona al LLM", value: "115+ archivos" },
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

        {/* Input tipo chatbot + multimodal */}
        <section aria-label="Prompt del proyecto" className="rounded-2xl border border-[#e5e5ea] bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="rounded-xl focus-within:ring-2 focus-within:ring-[#0071e3]/30">
            <label htmlFor="bootstrap-prompt" className="sr-only">
              Cuéntame qué app deseas crear (texto opcional si adjuntas material)
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
              placeholder={hasAttachments ? "Notas opcionales para la radiografía (contexto extra, prioridades, restricciones)…" : "Cuéntame qué app deseas crear — o adjunta URLs, capturas, fotos o videos de la app de referencia con los botones de abajo"}
              className="w-full resize-none rounded-xl bg-transparent px-4 pt-4 text-sm leading-relaxed text-[#1d1d1f] outline-none placeholder:text-[#c7c7cc]"
            />

            {/* Chips de fuentes adjuntas */}
            {hasAttachments && (
              <ul className="flex flex-wrap gap-2 px-4 pt-1" aria-label="Material adjunto para la radiografía">
                {attachments.map((a) => {
                  const Icon = KIND_ICON[a.kind];
                  const reading = (a.kind === "image" || a.kind === "video") && !a.dataUrl;
                  return (
                    <li
                      key={a.id}
                      className="group flex max-w-[260px] items-center gap-2 rounded-full border border-[#e5e5ea] bg-[#fafafc] py-1 pl-1 pr-2"
                    >
                      {a.previewUrl ? (
                        <img src={a.previewUrl} alt={`Captura adjunta: ${a.name}`} className="size-7 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
                          <Icon className="size-3.5" aria-hidden="true" />
                        </span>
                      )}
                      <span className="min-w-0 truncate text-[11px] font-medium text-[#1d1d1f]">
                        {a.name}
                        {a.size > 0 && <span className="ml-1 font-mono text-[9px] text-[#86868b]">{fmtBytes(a.size)}</span>}
                      </span>
                      {reading && <Loader2 className="size-3 shrink-0 animate-spin text-[#86868b]" aria-hidden="true" />}
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        aria-label={`Quitar ${a.name}`}
                        className="flex size-5 shrink-0 items-center justify-center rounded-full text-[#c7c7cc] transition-colors hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
                      >
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Barra multimodal */}
            <div className="mt-2 flex items-center gap-1.5 px-4">
              {showUrlInput ? (
                <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-[#0071e3]/30 bg-[#fafafc] px-3 py-1.5">
                  <Globe className="size-3.5 shrink-0 text-[#0071e3]" aria-hidden="true" />
                  <input
                    autoFocus
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addUrlAttachment();
                      }
                      if (e.key === "Escape") setShowUrlInput(false);
                    }}
                    placeholder="https://app-de-referencia.com"
                    aria-label="URL de la app de referencia"
                    className="min-w-0 flex-1 bg-transparent text-xs text-[#1d1d1f] outline-none placeholder:text-[#c7c7cc]"
                  />
                  <button type="button" onClick={addUrlAttachment} className="shrink-0 rounded-full bg-[#0071e3] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    Añadir
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    disabled={attachments.length >= MM_LIMITS.MAX_SOURCES}
                    className="flex items-center gap-1.5 rounded-full border border-[#e5e5ea] bg-white px-3 py-1.5 text-[11px] font-medium text-[#4b4b50] transition-colors hover:border-[#0071e3]/40 hover:text-[#0071e3] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Globe className="size-3.5" aria-hidden="true" /> URL
                  </button>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={attachments.length >= MM_LIMITS.MAX_SOURCES}
                    className="flex items-center gap-1.5 rounded-full border border-[#e5e5ea] bg-white px-3 py-1.5 text-[11px] font-medium text-[#4b4b50] transition-colors hover:border-[#0071e3]/40 hover:text-[#0071e3] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ImagePlus className="size-3.5" aria-hidden="true" /> Captura / Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={attachments.length >= MM_LIMITS.MAX_SOURCES}
                    className="flex items-center gap-1.5 rounded-full border border-[#e5e5ea] bg-white px-3 py-1.5 text-[11px] font-medium text-[#4b4b50] transition-colors hover:border-[#0071e3]/40 hover:text-[#0071e3] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Film className="size-3.5" aria-hidden="true" /> Video
                  </button>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-[#c7c7cc]">
                    {attachments.length}/{MM_LIMITS.MAX_SOURCES} fuentes
                  </span>
                </>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  addFileAttachments(e.target.files, "image");
                  e.target.value = "";
                }}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept={VIDEO_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  addFileAttachments(e.target.files, "video");
                  e.target.value = "";
                }}
              />
            </div>

            {launchError && (
              <p role="alert" className="mx-4 mt-2 rounded-lg bg-[#ff3b30]/5 px-3 py-2 text-[11px] leading-relaxed text-[#d70015]">
                {launchError}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-2">
              <p className="font-mono text-[10px] text-[#86868b]">
                {hasAttachments
                  ? `Radiografía primero · luego el flujo completo · ${prompt.length}/2000`
                  : `Enter para instanciar · Shift+Enter salto de línea · ${prompt.length}/2000`}
              </p>
              <button
                type="button"
                onClick={() => submit()}
                disabled={!canSubmit || submitting || (hasAttachments && attachments.some((a) => (a.kind === "image" || a.kind === "video") && !a.dataUrl))}
                aria-label={hasAttachments ? "Radiografiar el material e instanciar el scaffold" : "Instanciar el scaffold Agent OS"}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-white transition-all hover:scale-105 hover:bg-[#000] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : hasAttachments ? <ScanLine className="size-5" aria-hidden="true" /> : <ArrowUp className="size-5" aria-hidden="true" />}
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
        <section aria-label="Cómo funciona el instanciador" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: ScanLine,
              title: "0 · Radiografía (con material)",
              body: "Si adjuntas URLs, capturas, fotos o videos, visión + L2 extraen conceptos, apariencia, animaciones, efectos y modelo de negocio ANTES de generar nada. Sin material, se salta directo a investigar.",
            },
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
  // VISTA: RADIOGRAFÍA (fase previa multimodal del flujo)
  // ════════════════════════════════════════════════════════════════════
  if (mode === "radiografia") {
    const XRAY_PHASE_ICONS = [ScanLine, Lightbulb, Briefcase, Blocks, BadgeCheck];
    const xrayRunning = !xray || xray.status === "RUNNING" || xray.status === "PENDING";
    const xrayDone = xray?.status === "COMPLETED";
    const xrayFailed = xray?.status === "FAILED";
    const doneCount = xray?.phases.filter((p) => p.status === "DONE").length ?? 0;
    const xrayCta: CtaState = xrayDone ? "ready" : xrayFailed ? "error" : "loading";
    const canContinueWithout = prompt.trim().length >= 10;

    return (
      <div className="space-y-5">
        {/* Cabecera */}
        <section
          aria-label="Radiografía multimodal del material"
          className={`rounded-2xl border p-5 sm:p-6 ${
            xrayFailed ? "border-[#ff3b30]/30 bg-[#ff3b30]/5" : "border-[#e5e5ea] bg-white"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                {xrayDone ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-[#248a3d]" aria-hidden="true" />
                    Radiografía completa · {xray?.tokensUsed ?? 0} tokens
                  </>
                ) : xrayFailed ? (
                  <>
                    <TriangleAlert className="size-3.5 text-[#ff3b30]" aria-hidden="true" />
                    Radiografía fallida (P2: el error queda registrado)
                  </>
                ) : (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-[#0071e3]" aria-hidden="true" />
                    Radiografiando tu material…
                  </>
                )}
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#1d1d1f]">
                {xray?.targetUrl ?? "Analizando fuentes…"}
              </h2>
              <p className="mt-1 text-xs text-[#86868b]">
                Visión + L2 sobre tu material de primera mano: conceptos, apariencia, animaciones, efectos y modelo de
                negocio. Luego continúa el flujo del Instanciador.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {xrayRunning && (
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#86868b]">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {Math.floor(xrayElapsed / 60)}:{String(xrayElapsed % 60).padStart(2, "0")}
                </span>
              )}
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-[#e5e5ea] bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#1d1d1f] transition-colors hover:border-[#d2d2d7] hover:bg-[#f5f5f7]"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Fases */}
          <ol className="os-scroll mt-5 flex items-start gap-1 overflow-x-auto" aria-label="Fases de la radiografía">
            {(xray?.phases ?? []).map((phase, i) => {
              const Icon = XRAY_PHASE_ICONS[i] ?? ScanLine;
              return (
                <li key={phase.id} className="flex min-w-[120px] flex-1 flex-col items-center gap-1.5 text-center">
                  <span
                    className={`flex size-9 items-center justify-center rounded-full border transition-all ${
                      phase.status === "DONE"
                        ? "border-[#248a3d]/30 bg-[#248a3d]/10 text-[#248a3d]"
                        : phase.status === "RUNNING"
                          ? "animate-pulse border-[#0071e3]/40 bg-[#0071e3]/10 text-[#0071e3]"
                          : phase.status === "FAILED"
                            ? "border-[#ff3b30]/30 bg-[#ff3b30]/10 text-[#ff3b30]"
                            : "border-[#e5e5ea] bg-[#fafafc] text-[#c7c7cc]"
                    }`}
                  >
                    {phase.status === "DONE" ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <Icon className="size-4" aria-hidden="true" />}
                  </span>
                  <span className={`text-[10px] font-medium ${phase.status !== "PENDING" ? "text-[#1d1d1f]" : "text-[#c7c7cc]"}`}>
                    {phase.name.split(" (")[0]}
                  </span>
                  {phase.detail && (
                    <span className="max-w-[150px] truncate font-mono text-[9px] text-[#86868b]" title={phase.detail}>
                      {phase.detail}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Fuentes */}
          {xray && xray.sources.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Fuentes analizadas">
              {xray.sources.map((s, i) => {
                const Icon = KIND_ICON[s.kind];
                return (
                  <li key={`${s.name}-${i}`} className="flex items-center gap-1.5 rounded-full bg-[#fafafc] px-2.5 py-1 text-[10px] text-[#4b4b50]">
                    <Icon className="size-3 text-[#0071e3]" aria-hidden="true" />
                    <span className="max-w-[180px] truncate font-medium">{s.name}</span>
                    {s.detail && <span className="max-w-[140px] truncate font-mono text-[9px] text-[#86868b]">{s.detail}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Resultado estructurado */}
        {xrayDone && xray && (
          <section aria-label="Hallazgos de la radiografía" className="grid gap-4 lg:grid-cols-2">
            {/* Síntesis ejecutiva */}
            <div className="min-w-0 rounded-2xl border border-[#0071e3]/25 bg-[#0071e3]/[0.03] p-5 lg:col-span-2">
              <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0071e3]">
                <Sparkles className="size-3.5" aria-hidden="true" /> Síntesis ejecutiva
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#1d1d1f]">{xray.summary ?? "No disponible."}</p>
            </div>

            {/* Conceptos */}
            {xray.concepts && (
              <article className="min-w-0 rounded-2xl border border-[#e5e5ea] bg-white p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                  <Lightbulb className="size-4 text-[#0071e3]" aria-hidden="true" /> Conceptos
                </h3>
                <p className="mt-2 text-xs text-[#86868b]">{xray.concepts.productType}</p>
                {xray.concepts.coreConcepts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {xray.concepts.coreConcepts.map((c) => (
                      <span key={c} className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[10px] font-medium text-[#1d1d1f]">{c}</span>
                    ))}
                  </div>
                )}
                {xray.concepts.screens.length > 0 && (
                  <ul className="os-scroll mt-3 max-h-40 space-y-1 overflow-y-auto pr-1">
                    {xray.concepts.screens.map((s) => (
                      <li key={s.name} className="text-[11px] leading-relaxed text-[#4b4b50]">
                        <span className="font-semibold text-[#1d1d1f]">{s.name}</span> — {s.purpose}
                      </li>
                    ))}
                  </ul>
                )}
                {xray.concepts.uxPatterns.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {xray.concepts.uxPatterns.map((p) => (
                      <span key={p} className="rounded-full border border-[#e5e5ea] px-2 py-0.5 font-mono text-[9px] text-[#86868b]">{p}</span>
                    ))}
                  </div>
                )}
              </article>
            )}

            {/* Apariencia */}
            {xray.brandTokens && (
              <article className="min-w-0 rounded-2xl border border-[#e5e5ea] bg-white p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                  <Palette className="size-4 text-[#0071e3]" aria-hidden="true" /> Apariencia
                </h3>
                {xray.brandTokens.palette.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {xray.brandTokens.palette.map((p) => (
                      <div key={`${p.token}-${p.hex}`} className="flex items-center gap-1.5 rounded-full border border-[#e5e5ea] py-1 pl-1 pr-2.5" title={`${p.token}: ${p.usage}`}>
                        <span className="size-5 rounded-full border border-black/5" style={{ backgroundColor: p.hex }} aria-hidden="true" />
                        <span className="font-mono text-[9px] text-[#4b4b50]">{p.hex}</span>
                      </div>
                    ))}
                  </div>
                )}
                <dl className="mt-3 space-y-1 text-[11px] text-[#4b4b50]">
                  {xray.brandTokens.typography.slice(0, 3).map((t) => (
                    <div key={`${t.element}-${t.family}`} className="flex gap-2">
                      <dt className="w-16 shrink-0 font-mono text-[9px] uppercase text-[#86868b]">{t.element}</dt>
                      <dd className="min-w-0 truncate">{t.family} · {t.weight}</dd>
                    </div>
                  ))}
                  {xray.brandTokens.borderRadius && (
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 font-mono text-[9px] uppercase text-[#86868b]">radius</dt>
                      <dd>{xray.brandTokens.borderRadius}</dd>
                    </div>
                  )}
                </dl>
              </article>
            )}

            {/* Motion design */}
            {xray.concepts && (xray.concepts.motionDesign.animations.length > 0 || xray.concepts.motionDesign.effects.length > 0) && (
              <article className="min-w-0 rounded-2xl border border-[#e5e5ea] bg-white p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                  <Film className="size-4 text-[#0071e3]" aria-hidden="true" /> Animaciones y efectos
                </h3>
                {([
                  ["Animaciones", xray.concepts.motionDesign.animations],
                  ["Efectos", xray.concepts.motionDesign.effects],
                  ["Transiciones", xray.concepts.motionDesign.transitions],
                ] as Array<[string, string[]]>).map(
                  ([label, items]) =>
                    items.length > 0 && (
                      <div key={label} className="mt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">{label}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {items.map((m) => (
                            <span key={m} className="rounded-full bg-[#af52de]/8 px-2.5 py-1 text-[10px] font-medium text-[#8944ab]">{m}</span>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </article>
            )}

            {/* Modelo de negocio */}
            {xray.businessModel && (
              <article className="min-w-0 rounded-2xl border border-[#e5e5ea] bg-white p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                  <Briefcase className="size-4 text-[#0071e3]" aria-hidden="true" /> Modelo de negocio
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#4b4b50]">{xray.businessModel.offer}</p>
                <p className="mt-1 font-mono text-[10px] text-[#0071e3]">{xray.businessModel.pricingModel}</p>
                {xray.businessModel.plans.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {xray.businessModel.plans.map((p) => (
                      <li key={p.name} className="text-[11px] text-[#4b4b50]">
                        <span className="font-semibold text-[#1d1d1f]">{p.name}</span> · {p.price}
                      </li>
                    ))}
                  </ul>
                )}
                {xray.businessModel.valueProps.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {xray.businessModel.valueProps.map((v) => (
                      <span key={v} className="rounded-full bg-[#248a3d]/8 px-2.5 py-1 text-[10px] font-medium text-[#1d7a34]">{v}</span>
                    ))}
                  </div>
                )}
              </article>
            )}

            {/* Reconstrucción */}
            {xray.reconstruction && xray.reconstruction.components.length > 0 && (
              <article className="min-w-0 rounded-2xl border border-[#e5e5ea] bg-white p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                  <Blocks className="size-4 text-[#0071e3]" aria-hidden="true" /> Componentes para reconstrucción
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {xray.reconstruction.components.map((c) => (
                    <span key={c.name} className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[10px] font-medium text-[#1d1d1f]" title={c.notes}>
                      {c.name} <span className="font-mono text-[9px] text-[#86868b]">({c.type})</span>
                    </span>
                  ))}
                </div>
                {xray.reconstruction.apiContracts.length > 0 && (
                  <ul className="os-scroll mt-3 max-h-28 space-y-1 overflow-y-auto pr-1">
                    {xray.reconstruction.apiContracts.map((a) => (
                      <li key={a} className="font-mono text-[10px] leading-relaxed text-[#4b4b50]">{a}</li>
                    ))}
                  </ul>
                )}
              </article>
            )}

            {/* Verificación (auto-crítica P2) */}
            {xray.verification && (
              <article className="min-w-0 rounded-2xl border border-[#e5e5ea] bg-white p-5 lg:col-span-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                  <BadgeCheck className="size-4 text-[#0071e3]" aria-hidden="true" /> Verificación · {xray.verification.verdict}
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <ul className="space-y-1">
                    {xray.verification.criteria.map((c) => (
                      <li key={c.name} className="flex items-center gap-2 text-[11px] text-[#4b4b50]">
                        <span
                          className={`size-1.5 rounded-full ${
                            c.result === "PASS" ? "bg-[#248a3d]" : c.result === "FAIL" ? "bg-[#ff3b30]" : "bg-[#ff9f0a]"
                          }`}
                          aria-hidden="true"
                        />
                        {c.name} <span className="font-mono text-[9px] text-[#86868b]">{c.result}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1">
                    {xray.verification.weaknesses.map((w) => (
                      <li key={w} className="text-[11px] leading-relaxed text-[#86868b]">— {w}</li>
                    ))}
                  </ul>
                </div>
              </article>
            )}
          </section>
        )}

        {/* Falla con degradación honesta */}
        {xrayFailed && xray && (
          <section aria-label="Fallo de la radiografía" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
            <p className="font-mono text-xs text-[#d70015]">
              {xray.phases.find((p) => p.status === "FAILED")?.detail ?? "Error desconocido"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#86868b]">
              La radiografía no se completó. Puedes reintentar o —si escribiste un prompt de al menos 10 caracteres—
              continuar por el flujo clásico sin radiografía (degradación declarada P2).
            </p>
          </section>
        )}

        {/* Continuación */}
        {!xrayRunning && (
          <section aria-label="Continuar al Instanciador" className="flex flex-col items-start gap-3 rounded-2xl border border-[#e5e5ea] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1d1d1f]">
                {xrayDone ? "Todo listo para instanciar" : "Continuar sin radiografía"}
              </p>
              <p className="mt-0.5 text-xs text-[#86868b]">
                {xrayDone
                  ? `El flujo existente se enriquecerá con la radiografía (${doneCount}/5 fases, ${xray?.sources.length ?? 0} fuentes).`
                  : "El Instanciador trabajará solo con tu prompt y la investigación web."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {xrayCountdown != null && xrayDone && (
                <button
                  type="button"
                  onClick={() => setXrayCountdown(null)}
                  className="rounded-full border border-[#e5e5ea] px-3.5 py-1.5 text-[11px] font-medium text-[#86868b] transition-colors hover:border-[#d2d2d7]"
                >
                  Quedarme aquí (cancela auto)
                </button>
              )}
              {canContinueWithout && (
                <button
                  type="button"
                  onClick={() => {
                    setXrayCountdown(null);
                    void continueToBootstrap("none", false);
                  }}
                  disabled={submitting}
                  className="rounded-full border border-[#e5e5ea] px-3.5 py-1.5 text-[11px] font-medium text-[#1d1d1f] transition-colors hover:border-[#d2d2d7] disabled:opacity-40"
                >
                  Instanciar sin radiografía
                </button>
              )}
              {xrayFailed && (
                <button
                  type="button"
                  onClick={() => {
                    setXrayCountdown(null);
                    void submit();
                  }}
                  disabled={submitting}
                  className="rounded-full border border-[#0071e3]/40 px-3.5 py-1.5 text-[11px] font-medium text-[#0071e3] transition-colors hover:bg-[#0071e3]/5 disabled:opacity-40"
                >
                  Reintentar radiografía
                </button>
              )}
              {xrayDone && xray && (
                <div className="shrink-0">
                  <GlowingCtaButton
                    ctaState={submitting ? "loading" : xrayCta}
                    onClick={() => void continueToBootstrap(xray.id, true)}
                    icon={<Rocket className="size-4" aria-hidden="true" />}
                    aria-label="Instanciar el scaffold enriquecido con la radiografía"
                  >
                    {xrayCountdown != null && xrayCountdown > 0
                      ? `Instanciar con radiografía (${xrayCountdown}s)`
                      : "Instanciar con radiografía"}
                  </GlowingCtaButton>
                </div>
              )}
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
            <div className="min-w-0 rounded-2xl border border-[#e5e5ea] bg-white p-5 lg:col-span-7">
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

            <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
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
            <div className="min-w-0 rounded-2xl border border-[#e5e5ea] bg-white p-5 lg:col-span-5">
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

            <div className="min-w-0 rounded-2xl border border-[#e5e5ea] bg-white p-5 lg:col-span-7">
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
