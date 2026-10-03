"use client";

// ════════════════════════════════════════════════════════════════════════
// sentinel-panel.tsx — Ciclo Autónomo de Calidad (comando vigila, v1.9.0)
// Muestra los hallazgos del sentinela y el progreso en vivo de los ciclos
// de 7 etapas (detectar → analizar → investigar → corregir → verificar →
// criterios posteriores → reportar). Polling cada 2.5s mientras hay ciclos
// RUNNING. AP-031 erradicado: ninguna falla muere en el log.
// ════════════════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Radar, CheckCircle2, XCircle, Loader2, Circle, ChevronRight,
  ShieldAlert, ShieldCheck, FileClock, RefreshCw,
} from "lucide-react";
import { GlowingCtaButton, type CtaState } from "@/components/agent-os/glowing-cta-button";
import { executeCommandClient } from "@/lib/agent-os/client";

interface CycleStage {
  name: string;
  status: "PASS" | "FAIL" | "ESCALATED";
  durationMs: number;
  evidence: string;
}

interface SentinelData {
  findings: {
    id: string; sourceRef: string; source: string; severity: string;
    title: string; status: string; detectedAt: string;
    analysis?: { category: string; rootCause: string; correctionClass: string };
  }[];
  cycles: {
    id: string; trigger: string; status: string; reportEpoch: number | null;
    summary: string | null; startedAt: string; finishedAt: string | null;
    stages: CycleStage[]; findingTitle: string | null; findingSeverity: string | null;
  }[];
  counts: {
    open: number; resolved: number; noDefect: number; escalated: number; total: number;
    bySeverity: { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number };
    cyclesCompleted: number; cyclesRunning: number; cyclesEscalated: number; cyclesFailed: number;
    lastDetectionAt: string | null;
  };
}

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "border-[#ff3b30]/40 bg-[#ff3b30]/8 text-[#d70015]",
  HIGH: "border-[#ff9500]/40 bg-[#ff9500]/10 text-[#c25e00]",
  MEDIUM: "border-[#ffcc00]/50 bg-[#ffcc00]/12 text-[#8a6d00]",
  LOW: "border-[#e5e5ea] bg-[#f5f5f7] text-[#86868b]",
};

const STATUS_LABEL: Record<string, string> = {
  DETECTED: "Detectado", ANALYZED: "Analizado", CORRECTED: "Corregido",
  VERIFIED: "Verificado", RESOLVED: "Resuelto", NO_DEFECT: "No defecto",
  ESCALATED: "Escalado a humano",
};

const STAGE_NAMES = ["detectar", "analizar", "investigar", "corregir", "verificar", "criterios posteriores", "reportar"];

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s}s`;
  if (s < 3600) return `hace ${Math.floor(s / 60)}min`;
  return `hace ${Math.floor(s / 3600)}h`;
}

export function SentinelPanel() {
  const [data, setData] = useState<SentinelData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scanState, setScanState] = useState<CtaState>("ready");
  const [scanOutput, setScanOutput] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agent-os/sentinel", { cache: "no-store" });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error(`Respuesta no-JSON del gateway (HTTP ${res.status})`);
      const json = (await res.json()) as { success: boolean; data: SentinelData | null; error: string | null };
      if (!json.success || !json.data) throw new Error(json.error ?? "Error obteniendo estado del sentinela");
      setData(json.data);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Error desconocido");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Polling adaptativo: 2.5s con ciclos RUNNING (progreso en vivo), 10s en reposo
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const hasRunning = (data?.counts.cyclesRunning ?? 0) > 0;
    pollingRef.current = setInterval(load, hasRunning ? 2500 : 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [data?.counts.cyclesRunning, load]);

  const runScan = useCallback(async () => {
    if (scanState === "loading") return;
    setScanState("loading");
    const result = await executeCommandClient("vigila");
    setScanOutput(result.output);
    setScanState(result.status === "OK" ? "success" : "error");
    await load();
    setTimeout(() => setScanState("ready"), 3000);
  }, [scanState, load]);

  const pendingFindings = data?.findings.filter((f) => f.status === "DETECTED").length ?? 0;
  const c = data?.counts;

  return (
    <section data-tour="sentinela" aria-label="Ciclo Autónomo de Calidad" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
            <Radar className="size-4 text-[#0071e3]" aria-hidden="true" />
            Ciclo Autónomo de Calidad
            <span className="rounded-full border border-[#e5e5ea] bg-[#f5f5f7] px-2 py-0.5 font-mono text-[9px] font-semibold text-[#86868b]">
              vigila · 18º canónico · v1.9.0
            </span>
          </h2>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[#86868b]">
            El sentinela detecta fallas sin procesar (ERROR, FAILED, ledger L2, presupuesto gateway), abre ciclos de
            7 etapas con evidencia honesta (P2) y termina en reporte epoch inmutable con auto-crítica P13.
            Disparo automático tras cada ERROR del dispatcher (AP-031 erradicado).
          </p>
        </div>
        {/* W-CTA: el botón primario se habilita con glow cuando hay hallazgos pendientes */}
        <GlowingCtaButton
          ctaState={pendingFindings > 0 && scanState === "ready" ? "enabled-glowing" : scanState}
          onClick={runScan}
          icon={pendingFindings > 0 ? <ShieldAlert className="size-4" aria-hidden="true" /> : <Radar className="size-4" aria-hidden="true" />}
          aria-label="Ejecutar el comando vigila: scan de fallas y apertura de ciclos"
        >
          {scanState === "loading" ? "Escaneando..." : scanState === "success" ? "Scan completado" : scanState === "error" ? "Error en scan" : pendingFindings > 0 ? `Ejecutar vigila (${pendingFindings} pendientes)` : "Ejecutar vigila"}
        </GlowingCtaButton>
      </div>

      {loadError && (
        <p role="alert" className="mt-3 rounded-lg border border-[#ff3b30]/30 bg-[#ff3b30]/5 px-3 py-2 font-mono text-[10px] text-[#d70015]">
          {loadError}
        </p>
      )}

      {!data && !loadError && (
        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#86868b]">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Consultando el estado del órgano...
        </div>
      )}

      {data && c && (
        <>
          {/* Contadores del órgano */}
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Hallazgos totales", value: c.total, hint: `${c.noDefect} NO_DEFECT` },
              { label: "Abiertos", value: c.open, hint: `${c.bySeverity.CRITICAL} P0 · ${c.bySeverity.HIGH} P1` },
              { label: "Resueltos", value: c.resolved, hint: `${c.escalated} escalados` },
              { label: "Ciclos", value: c.cyclesCompleted, hint: `${c.cyclesRunning} RUNNING · ${c.cyclesEscalated} ESC` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-3 py-2.5">
                <dd className="font-mono text-lg font-semibold text-[#1d1d1f]">{s.value}</dd>
                <dt className="text-[10px] font-medium text-[#86868b]">{s.label}</dt>
                <p className="mt-0.5 font-mono text-[9px] text-[#86868b]">{s.hint}</p>
              </div>
            ))}
          </dl>

          {scanOutput && (
            <pre className="os-scroll mt-4 max-h-44 overflow-auto whitespace-pre-wrap rounded-xl border border-[#e5e5ea] bg-[#1d1d1f] px-3.5 py-3 font-mono text-[10px] leading-relaxed text-[#f5f5f7]">
              {scanOutput}
            </pre>
          )}

          {/* Hallazgos */}
          <div className="mt-5">
            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
              <ShieldAlert className="size-3" aria-hidden="true" /> Hallazgos ({data.findings.length})
            </h3>
            {data.findings.length === 0 ? (
              <p className="mt-2 rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-3.5 py-3 text-[11px] text-[#86868b]">
                Sin hallazgos — el sistema está dentro de invariantes. El sentinela se dispara solo tras cada ERROR.
              </p>
            ) : (
              <ul className="os-scroll mt-2 max-h-96 space-y-1.5 overflow-y-auto pr-1" role="list">
                {data.findings.map((f) => (
                  <li key={f.id} className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-3.5 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${SEVERITY_STYLE[f.severity] ?? SEVERITY_STYLE.LOW}`}>
                        {f.severity}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#1d1d1f]">{f.title}</span>
                      <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 font-mono text-[9px] text-[#86868b]">
                        {STATUS_LABEL[f.status] ?? f.status}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[9px] text-[#86868b]">
                      {f.source} · {f.sourceRef} · {timeAgo(f.detectedAt)}
                      {f.analysis ? ` · ${f.analysis.category} → ${f.analysis.correctionClass}` : ""}
                    </p>
                    {f.analysis && (
                      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[#4b4b50]">{f.analysis.rootCause}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Ciclos */}
          <div className="mt-5">
            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
              <RefreshCw className="size-3" aria-hidden="true" /> Ciclos ({data.cycles.length})
            </h3>
            {data.cycles.length === 0 ? (
              <p className="mt-2 rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-3.5 py-3 text-[11px] text-[#86868b]">
                Sin ciclos aún. Cada defecto real abre un ciclo de 7 etapas automáticamente.
              </p>
            ) : (
              <div className="os-scroll mt-2 max-h-96 space-y-2 overflow-y-auto pr-1">
                {data.cycles.map((cycle) => {
                  const running = cycle.status === "RUNNING";
                  const doneStages = cycle.stages.length;
                  return (
                    <details key={cycle.id} className="group rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-3.5 py-2.5" open={running}>
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px]">
                        <ChevronRight className={`size-3 shrink-0 text-[#86868b] transition-transform group-open:rotate-90 ${running ? "text-[#0071e3]" : ""}`} aria-hidden="true" />
                        {cycle.status === "COMPLETED" ? (
                          <CheckCircle2 className="size-3.5 shrink-0 text-[#248a3d]" aria-hidden="true" />
                        ) : cycle.status === "RUNNING" ? (
                          <Loader2 className="size-3.5 shrink-0 animate-spin text-[#0071e3]" aria-hidden="true" />
                        ) : (
                          <XCircle className="size-3.5 shrink-0 text-[#d70015]" aria-hidden="true" />
                        )}
                        <span className="min-w-0 flex-1 truncate font-medium text-[#1d1d1f]">
                          {cycle.findingTitle ?? `Ciclo ${cycle.id.slice(-8)}`}
                        </span>
                        <span className="shrink-0 font-mono text-[9px] text-[#86868b]">
                          {running ? `${doneStages}/7 etapas` : cycle.reportEpoch ? `epoch ${cycle.reportEpoch}` : cycle.status}
                        </span>
                      </summary>

                      {/* Pipeline de 7 etapas */}
                      <ol className="mt-2.5 space-y-1" role="list" aria-label="Etapas del ciclo">
                        {STAGE_NAMES.map((name) => {
                          const stage = cycle.stages.find((s) => s.name === name);
                          const isActive = running && !stage && cycle.stages.length === STAGE_NAMES.indexOf(name);
                          return (
                            <li key={name} className="flex items-start gap-2 text-[10px]">
                              {stage?.status === "PASS" ? (
                                <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[#248a3d]" aria-hidden="true" />
                              ) : stage?.status === "FAIL" ? (
                                <XCircle className="mt-0.5 size-3 shrink-0 text-[#d70015]" aria-hidden="true" />
                              ) : isActive ? (
                                <Loader2 className="mt-0.5 size-3 shrink-0 animate-spin text-[#0071e3]" aria-hidden="true" />
                              ) : (
                                <Circle className="mt-0.5 size-3 shrink-0 text-[#d2d2d7]" aria-hidden="true" />
                              )}
                              <div className="min-w-0">
                                <span className={`font-medium ${stage ? "text-[#1d1d1f]" : "text-[#86868b]"}`}>
                                  {name}
                                  {stage ? ` — ${stage.status} · ${stage.durationMs}ms` : isActive ? " — en progreso" : ""}
                                </span>
                                {stage?.evidence && (
                                  <p className="mt-0.5 break-words font-mono text-[9px] leading-relaxed text-[#86868b]">{stage.evidence.slice(0, 220)}</p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ol>

                      {cycle.summary && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[10px] leading-relaxed text-[#4b4b50]">
                          <FileClock className="mt-0.5 size-3 shrink-0 text-[#86868b]" aria-hidden="true" />
                          {cycle.summary}
                          {cycle.reportEpoch ? ` Reporte inmutable: epoch ${cycle.reportEpoch} (ver Reportes Époch).` : ""}
                        </p>
                      )}
                    </details>
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-4 flex items-center gap-1.5 border-t border-[#e5e5ea] pt-3 text-[10px] text-[#86868b]">
            <ShieldCheck className="size-3 shrink-0 text-[#248a3d]" aria-hidden="true" />
            Cada ciclo termina en reporte epoch inmutable con tabla AGREE/DISAGREE y auto-crítica P13 (mínimo 1 DISAGREE
            honesto). Inputs inválidos del operador se clasifican NO_DEFECT sin abrir ciclo. Escala a humano tras 3 fallos
            consecutivos de etapa (§8.2).
          </p>
        </>
      )}
    </section>
  );
}
