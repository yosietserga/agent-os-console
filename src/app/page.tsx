"use client";

// ════════════════════════════════════════════════════════════════════════
// page.tsx — Agent OS Console (ruta única /)
// Layout canónico de 7 posiciones (P6):
//   header · featuredContent · column_left · main · column_right ·
//   featuredFooter · footer (sticky, mt-auto)
// Tema Apple Light inmutable (P5). Cero emojis (P7).
// ════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cpu, GitBranch, Layers, Database, Sparkles, Clock, TerminalSquare,
  BookOpen, Scale, Network, ScanLine, ShieldCheck, ChevronRight, Radar,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CommandConsole } from "@/components/agent-os/command-console";
import { PsimPanel } from "@/components/agent-os/psim-panel";
import { MejoratePanel } from "@/components/agent-os/mejorate-panel";
import { MemoryPanel } from "@/components/agent-os/memory-panel";
import { GovernancePanel } from "@/components/agent-os/governance-panel";
import { L2Panel } from "@/components/agent-os/l2-panel";
import { RadiografiaPanel } from "@/components/agent-os/radiografia-panel";
import { SentinelPanel } from "@/components/agent-os/sentinel-panel";
import { ConstitutionPanel } from "@/components/agent-os/constitution-panel";
import { ReposGallery } from "@/components/agent-os/repos-gallery";
import { OnboardingTour, TourRestartButton } from "@/components/agent-os/onboarding-tour";
import type { CtaState } from "@/components/agent-os/glowing-cta-button";
import { GlowingCtaButton } from "@/components/agent-os/glowing-cta-button";
import { executeCommandClient } from "@/lib/agent-os/client";
import type { OverviewDTO, CommandResultDTO } from "@/lib/agent-os/types";

// Los pasos con contadores se generan en runtime desde el overview (cero
// desincronización con la BD: el tour siempre dice la verdad del momento).
const TOUR_STEPS_STATIC = [
  {
    target: "console",
    title: "Consola Canónica",
    body: "Invoca los comandos operativos canónicos con la sintaxis universal: lee AGENTS.md, ejecuta: <comando>. El dispatcher ejecuta acciones reales contra la base de datos, GitHub API y el Control Plane L2.",
  },
  {
    target: "mejorate",
    title: "Auto-Improvement Loop",
    body: "El comando mejorate escanea los repos de referencia en vivo, extrae patrones agénticos con LLM y propone adoptions. El botón con glow ejecuta el flujo completo scan → synthesize.",
  },
  {
    target: "memoria",
    title: "Memoria Empírica",
    body: "Ledgers append-only (P9): anti-patrones, victorias W1-W8, worklog y feedback del operador. Ningún LLM olvida las restricciones del proyecto.",
  },
  {
    target: "pre",
    title: "Gobernanza PRE-v2.0",
    body: "Tres roles: Ejecutor escribe código, Optimizador propone, Juez determinista decide con la fórmula S = 100 × Σ(wi·Di). Promoción solo si ΔS ≥ 5.0 sin regresiones.",
  },
  {
    target: "radiografia",
    title: "Radiografía Rayos X",
    body: "Pipeline de ingeniería inversa de 5 fases: branding → DOM/shaders 3D → modelo de negocio → reconstrucción modular → verificación con auto-crítica.",
  },
  {
    target: "sentinela",
    title: "Ciclo Autónomo de Calidad",
    body: "El comando vigila (18º canónico) detecta fallas automáticamente y abre ciclos de 7 etapas: detectar → analizar → investigar → corregir → verificar → criterios posteriores → reportar. Ninguna falla muere en el log sin procesar.",
  },
  {
    target: "psim",
    title: "PSIM y Pipeline",
    body: "Los 5 KPIs de trayectoria (K1-K5), el balance de 8 clases de victoria (W1-W8) y el Pipeline Universal de 5 Fases que rige todo desarrollo.",
  },
];

export default function AgentOSPage() {
  const [overview, setOverview] = useState<OverviewDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [mejorateState, setMejorateState] = useState<CtaState>("ready");
  const [activeTab, setActiveTab] = useState("mejorate");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agent-os/overview", { cache: "no-store" });
      const json = (await res.json()) as { success: boolean; data: OverviewDTO | null; error: string | null };
      if (!json.success || !json.data) throw new Error(json.error ?? "Error cargando overview");
      setOverview(json.data);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Error desconocido");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const tick = () => setEpoch(Math.floor(Date.now() / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const onCommandExecuted = useCallback(
    (result: CommandResultDTO) => {
      // rayos-x / cold run reverse-engineer lanzan el pipeline en background:
      // cambiar al tab Radiografía activa el polling en vivo de las 5 fases.
      // vigila abre ciclos en background: el tab Sentinela muestra las 7 etapas.
      const action = (result.data as { action?: string } | undefined)?.action;
      if (action === "radiografia") setActiveTab("radiografia");
      if (action === "sentinel") setActiveTab("sentinela");
      if (result.refresh) load();
    },
    [load]
  );

  const runMejorate = useCallback(async () => {
    if (mejorateState === "loading") return;
    setMejorateState("loading");
    // AP-032 (fix): helper cliente con verificación de content-type y
    // timeout — antes un HTML 504 del gateway producía "Unexpected token '<'"
    const result = await executeCommandClient("mejorate");
    setMejorateState(result.status === "OK" ? "success" : "error");
    await load();
    setTimeout(() => setMejorateState("ready"), 3000);
  }, [mejorateState, load]);

  const tokensSession = overview?.ledger.reduce((a, l) => a + l.promptTokens + l.completionTokens, 0) ?? 0;
  const promotedCount = overview?.proposals.filter((p) => p.status === "PROMOTED").length ?? 0;

  // Tour con contadores derivados del overview (v1.8.0: 17 comandos, 19 repos,
  // 30 APs + 18 WINs) — se recalcula en cada carga, imposible de desincronizar.
  const tourSteps = useMemo(() => {
    const cmdCount = overview?.commands.length;
    const repoCount = overview?.repos.length;
    const apCount = overview?.memory.antiPatterns.length;
    const winCount = overview?.memory.wins.length;
    return TOUR_STEPS_STATIC.map((step) => {
      if (step.target === "console" && cmdCount) {
        return { ...step, body: `Invoca los ${cmdCount} comandos operativos con la sintaxis universal: lee AGENTS.md, ejecuta: <comando>. El dispatcher ejecuta acciones reales contra la base de datos, GitHub API y el Control Plane L2.` };
      }
      if (step.target === "mejorate" && repoCount) {
        return { ...step, body: `El comando mejorate escanea los ${repoCount} repos de referencia en vivo, extrae patrones agénticos con LLM y propone adoptions. El botón con glow ejecuta el flujo completo scan → synthesize.` };
      }
      if (step.target === "memoria" && apCount !== undefined) {
        return { ...step, body: `Ledgers append-only (P9): ${apCount} anti-patrones, ${winCount ?? 0} victorias W1-W8, worklog y feedback del operador. Ningún LLM olvida las restricciones del proyecto.` };
      }
      return step;
    });
  }, [overview]);

  const totalStars = overview?.repos.reduce((a, r) => a + r.stars, 0) ?? 0;
  const starsLabel = totalStars >= 1_000_000
    ? `${(totalStars / 1_000_000).toFixed(2)}M`
    : `${Math.round(totalStars / 1000)}k`;

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f7]">
      <OnboardingTour steps={tourSteps} storageKey="agent-os-tour" version={3} />

      {/* ══ POSICIÓN 1: header ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-[#e5e5ea]/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3e]">
            <Cpu className="size-4.5 text-white" aria-hidden="true" />
          </span>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-[#1d1d1f]">Agent OS</h1>
            <span className="hidden font-mono text-[10px] text-[#86868b] sm:inline">
              L2 Control Plane &amp; Empirical Memory
            </span>
          </div>
          <span className="rounded-full border border-[#e5e5ea] bg-[#f5f5f7] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#1d1d1f]">
            v1.9.0
          </span>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden items-center gap-1.5 font-mono text-[11px] text-[#86868b] md:flex" aria-label="Epoch Unix en vivo">
              <Clock className="size-3.5" aria-hidden="true" />
              {epoch || overview?.epoch || 0}
            </span>
            <a
              href="https://github.com/yosietserga/agent-os-boilerplate"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-[#e5e5ea] bg-white px-3 py-1.5 text-[11px] font-medium text-[#1d1d1f] transition-colors hover:border-[#d2d2d7] hover:bg-[#f5f5f7]"
            >
              <GitBranch className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">yosietserga/</span>agent-os-boilerplate
            </a>
          </div>
        </div>
      </header>

      {/* Contenido scrollable */}
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
        {/* ══ POSICIÓN 2: featuredContent ══════════════════════════════ */}
        <section
          data-tour="hero"
          aria-label="Agent OS — Sistema Universal de Control Agéntico"
          className="relative overflow-hidden rounded-2xl border border-[#e5e5ea] bg-white p-6 sm:p-8"
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#0071e3]/6 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0071e3]">
                Documento Cero · Constitución AGENTS.md
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[#1d1d1f] sm:text-3xl">
                Escribe las reglas una vez.
                <br />
                Opéralas para siempre.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#86868b]">
                Sistema Universal de Control Agéntico, L2 Control Plane y Protocolo de Memoria
                Empírica. Gobernanza PRE-v2.0 con juez determinista, medición PSIM y auto-mejora
                continua mediante <span className="font-medium text-[#1d1d1f]">mejorate</span>.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <GlowingCtaButton
                  ctaState={mejorateState}
                  onClick={runMejorate}
                  icon={<Sparkles className="size-4" aria-hidden="true" />}
                  aria-label="Ejecutar el comando mejorate: scan y synthesize"
                >
                  {mejorateState === "loading" ? "Auto-mejorando..." : mejorateState === "success" ? "Auto-mejora completada" : "Ejecutar mejorate"}
                </GlowingCtaButton>
                <TourRestartButton storageKey="agent-os-tour" version={3} />
              </div>
            </div>
            <dl className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: ShieldCheck, label: "Reglas cardinales", value: overview ? `${overview.rules.length}` : "—" },
                { icon: TerminalSquare, label: "Comandos", value: overview ? `${overview.commands.length}` : "—" },
                { icon: BookOpen, label: "Memoria", value: overview ? `${overview.memory.antiPatterns.length + overview.memory.wins.length + overview.memory.worklog.length + overview.memory.feedback.length + overview.memory.project.length + overview.memory.reference.length + overview.memory.user.length}` : "—" },
                { icon: Layers, label: "Repos (stars)", value: overview ? starsLabel : "—" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-3.5 py-3">
                  <s.icon className="size-4 text-[#0071e3]" aria-hidden="true" />
                  <dd className="mt-1.5 font-mono text-xl font-semibold text-[#1d1d1f]">{s.value}</dd>
                  <dt className="text-[10px] font-medium text-[#86868b]">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Estado de carga / error */}
        {loadError && (
          <div role="alert" className="mt-6 rounded-2xl border border-[#ff3b30]/30 bg-[#ff3b30]/5 p-5">
            <p className="text-sm font-semibold text-[#d70015]">Error cargando el Agent OS</p>
            <p className="mt-1 font-mono text-xs text-[#86868b]">{loadError}</p>
          </div>
        )}
        {!overview && !loadError && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 lg:grid-cols-12">
              <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
              <Skeleton className="h-96 rounded-2xl lg:col-span-6" />
              <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
            </div>
          </div>
        )}

        {overview && (
          <div className="mt-6 grid gap-4 lg:grid-cols-12">
            {/* ══ POSICIÓN 3: column_left ══════════════════════════════ */}
            <div className="min-w-0 lg:col-span-3">
              <CommandConsole commands={overview.commands} onExecuted={onCommandExecuted} />
              <div className="mt-4 rounded-2xl border border-[#e5e5ea] bg-white p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">
                  <Database className="size-3" aria-hidden="true" /> Auditoría de sesión
                </p>
                <ul className="mt-2.5 space-y-1.5 text-[11px] text-[#4b4b50]">
                  <li className="flex justify-between gap-2">
                    <span>Inferencias L2</span>
                    <span className="font-mono font-semibold">{overview.ledger.length}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Tokens auditados</span>
                    <span className="font-mono font-semibold">{tokensSession.toLocaleString("es-VE")}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Adoptions promoted</span>
                    <span className="font-mono font-semibold text-[#248a3d]">{promotedCount}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Comandos ejecutados</span>
                    <span className="font-mono font-semibold">{overview.commandLog.length}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Radiografías</span>
                    <span className="font-mono font-semibold">{overview.radiografiaRuns.length}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* ══ POSICIÓN 4: main ══════════════════════════════════════ */}
            <main className="min-w-0 lg:col-span-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList
                  aria-label="Módulos del Agent OS"
                  className="os-scroll h-auto w-full justify-start gap-1 overflow-x-auto rounded-full border border-[#e5e5ea] bg-white p-1"
                >
                  {[
                    { value: "mejorate", icon: Sparkles, label: "Mejorate" },
                    { value: "memoria", icon: BookOpen, label: "Memoria" },
                    { value: "gobernanza", icon: Scale, label: "Gobernanza" },
                    { value: "l2", icon: Network, label: "L2 Control Plane" },
                    { value: "radiografia", icon: ScanLine, label: "Radiografía" },
                    { value: "sentinela", icon: Radar, label: "Sentinela" },
                    { value: "constitucion", icon: ShieldCheck, label: "Constitución" },
                  ].map((t) => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="h-9 shrink-0 rounded-full px-3.5 text-xs font-medium text-[#4b4b50] data-[state=active]:bg-[#1d1d1f] data-[state=active]:text-white"
                    >
                      <t.icon className="size-3.5" aria-hidden="true" />
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="mejorate" className="mt-4">
                  <MejoratePanel
                    repos={overview.repos}
                    scans={overview.scans}
                    patterns={overview.patterns}
                    onSynthesize={runMejorate}
                    synthesizeState={mejorateState}
                  />
                </TabsContent>
                <TabsContent value="memoria" className="mt-4">
                  <MemoryPanel memory={overview.memory} onAppended={load} />
                </TabsContent>
                <TabsContent value="gobernanza" className="mt-4">
                  <GovernancePanel proposals={overview.proposals} onChanged={load} />
                </TabsContent>
                <TabsContent value="l2" className="mt-4">
                  <L2Panel models={overview.l2Models} ledger={overview.ledger} />
                </TabsContent>
                <TabsContent value="radiografia" className="mt-4">
                  <RadiografiaPanel runs={overview.radiografiaRuns} onCompleted={load} />
                </TabsContent>
                <TabsContent value="sentinela" className="mt-4">
                  <SentinelPanel />
                </TabsContent>
                <TabsContent value="constitucion" className="mt-4">
                  <ConstitutionPanel rules={overview.rules} commands={overview.commands} />
                </TabsContent>
              </Tabs>
            </main>

            {/* ══ POSICIÓN 5: column_right ═════════════════════════════ */}
            <aside className="min-w-0 lg:col-span-3">
              <PsimPanel psim={overview.psim} rules={overview.rules} totalTokens={tokensSession} />
            </aside>
          </div>
        )}

        {/* ══ POSICIÓN 6: featuredFooter ═══════════════════════════════ */}
        {overview && (
          <div className="mt-6">
            <ReposGallery repos={overview.repos} />
          </div>
        )}

        {/* Reportes recientes */}
        {overview && overview.reports.length > 0 && (
          <section aria-label="Reportes recientes" className="mt-4 rounded-2xl border border-[#e5e5ea] bg-white p-5">
            <h2 className="text-sm font-semibold text-[#1d1d1f]">Reportes Époch (inmutables)</h2>
            <div className="os-scroll mt-3 max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {overview.reports.map((r) => (
                <details key={r.id} className="group rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-3.5 py-2.5">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px]">
                    <ChevronRight className="size-3 text-[#86868b] transition-transform group-open:rotate-90" aria-hidden="true" />
                    <span className="font-mono font-semibold text-[#1d1d1f]">{r.epoch}-{r.title}</span>
                    <span className="ml-auto rounded-full bg-[#f5f5f7] px-2 py-0.5 font-mono text-[9px] text-[#86868b]">{r.verdict}</span>
                  </summary>
                  <pre className="os-scroll mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-white px-3 py-2 font-mono text-[10px] leading-relaxed text-[#4b4b50]">
                    {r.content}
                  </pre>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ══ POSICIÓN 7: footer (sticky bottom, mt-auto) ═════════════════ */}
      <footer className="mt-auto border-t border-[#e5e5ea] bg-white/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 px-4 py-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="text-[11px] text-[#86868b]">
            <span className="font-semibold text-[#1d1d1f]">Agent OS v1.9.0</span> · Operador:{" "}
            <span className="font-medium text-[#1d1d1f]">Yosiet Serga</span> · Venezuela ·
            Windows dev / Ubuntu deploy (P10)
          </p>
          <p className="font-mono text-[10px] text-[#86868b]">
            18 comandos · 15 reglas + W-CTA · memoria append-only · LLM-agnóstico · ciclo autónomo de calidad
          </p>
        </div>
      </footer>
    </div>
  );
}
