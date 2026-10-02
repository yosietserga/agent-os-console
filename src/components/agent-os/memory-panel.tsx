"use client";

// ════════════════════════════════════════════════════════════════════════
// memory-panel.tsx — Memoria Empírica Reusable (docs/memory/)
// Ledgers append-only (P9): anti-patterns, wins, worklog, feedback,
// project, reference, user. Con formulario de anexado atómico.
// ════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import {
  BookOpen, ShieldAlert, Trophy, ClipboardList, MessageSquareQuote,
  FolderKanban, Link2, UserRound, Plus, Loader2, ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MemoryEntryDTO, MemoryType } from "@/lib/agent-os/types";

interface MemoryPanelProps {
  memory: {
    antiPatterns: MemoryEntryDTO[];
    wins: MemoryEntryDTO[];
    worklog: MemoryEntryDTO[];
    feedback: MemoryEntryDTO[];
    project: MemoryEntryDTO[];
    reference: MemoryEntryDTO[];
    user: MemoryEntryDTO[];
  };
  onAppended?: () => void;
}

type TabKey = "ANTI_PATTERN" | "WIN" | "WORKLOG" | "FEEDBACK" | "PROJECT" | "REFERENCE" | "USER";

const TABS: { key: TabKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: "ANTI_PATTERN", label: "Anti-Patrones", icon: ShieldAlert, color: "text-[#ff3b30]" },
  { key: "WIN", label: "Victorias", icon: Trophy, color: "text-[#248a3d]" },
  { key: "WORKLOG", label: "Worklog", icon: ClipboardList, color: "text-[#0071e3]" },
  { key: "FEEDBACK", label: "Feedback", icon: MessageSquareQuote, color: "text-[#af52de]" },
  { key: "PROJECT", label: "Proyecto", icon: FolderKanban, color: "text-[#ff9f0a]" },
  { key: "REFERENCE", label: "Referencias", icon: Link2, color: "text-[#5e5ce6]" },
  { key: "USER", label: "Usuario", icon: UserRound, color: "text-[#86868b]" },
];

export function MemoryPanel({ memory, onAppended }: MemoryPanelProps) {
  const [tab, setTab] = useState<TabKey>("ANTI_PATTERN");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [winClass, setWinClass] = useState("W1");
  const [severity, setSeverity] = useState("MEDIA");
  const [appending, setAppending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entries = useMemo(() => {
    switch (tab) {
      case "ANTI_PATTERN": return memory.antiPatterns;
      case "WIN": return memory.wins;
      case "WORKLOG": return memory.worklog;
      case "FEEDBACK": return memory.feedback;
      case "PROJECT": return memory.project;
      case "REFERENCE": return memory.reference;
      case "USER": return memory.user;
    }
  }, [tab, memory]);

  async function append() {
    if (!title.trim() || !content.trim()) {
      setError("Título y contenido son obligatorios.");
      return;
    }
    setAppending(true);
    setError(null);
    try {
      const res = await fetch("/api/agent-os/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tab,
          title: title.trim(),
          content: content.trim(),
          winClass: tab === "WIN" ? winClass : undefined,
          severity: tab === "ANTI_PATTERN" ? severity : undefined,
        }),
      });
      const json = (await res.json()) as { success: boolean; error: string | null };
      if (!json.success) throw new Error(json.error ?? "Error anexando");
      setTitle("");
      setContent("");
      setShowForm(false);
      onAppended?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setAppending(false);
    }
  }

  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <div className="space-y-4">
      <section data-tour="memoria" aria-label="Memoria empírica" className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
              <BookOpen className="size-4 text-[#0071e3]" aria-hidden="true" />
              Memoria Empírica — Append-Only (P9)
            </h3>
            <p className="mt-1 text-xs text-[#86868b]">
              Ningún LLM olvida las restricciones del proyecto. Prohibido borrar o reescribir;
              correcciones via nueva entrada <code className="font-mono text-[10px]">[CORRIGE-XXX]</code>.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm((s) => !s)}
            aria-expanded={showForm}
            className="h-9 rounded-full bg-[#1d1d1f] px-4 text-white hover:bg-[#333336]"
          >
            {showForm ? "Cancelar" : (
              <>
                <Plus className="size-3.5" aria-hidden="true" /> Anexar
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="os-scroll mt-4 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Tipos de memoria">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => { setTab(t.key); setShowForm(false); }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
                tab === t.key
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f5f5f7] text-[#4b4b50] hover:bg-[#e8e8ed]"
              )}
            >
              <t.icon className={cn("size-3.5", tab === t.key ? "text-white" : t.color)} aria-hidden="true" />
              {t.label}
              <span className={cn(
                "rounded-full px-1.5 font-mono text-[9px]",
                tab === t.key ? "bg-white/20" : "bg-white text-[#86868b]"
              )}>
                {t.key === "ANTI_PATTERN" ? memory.antiPatterns.length
                  : t.key === "WIN" ? memory.wins.length
                  : t.key === "WORKLOG" ? memory.worklog.length
                  : t.key === "FEEDBACK" ? memory.feedback.length
                  : t.key === "PROJECT" ? memory.project.length
                  : t.key === "REFERENCE" ? memory.reference.length
                  : memory.user.length}
              </span>
            </button>
          ))}
        </div>

        {/* Formulario de anexado */}
        {showForm && (
          <div className="mt-4 space-y-3 rounded-xl border border-[#e5e5ea] bg-[#fafafc] p-4">
            <div>
              <label htmlFor="mem-title" className="text-[11px] font-semibold text-[#1d1d1f]">
                Título — anexar a {activeTab.label}
              </label>
              <Input
                id="mem-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entrada nueva del ledger"
                className="mt-1 h-9 border-[#d2d2d7] bg-white text-xs"
                maxLength={160}
              />
            </div>
            <div>
              <label htmlFor="mem-content" className="text-[11px] font-semibold text-[#1d1d1f]">Contenido</label>
              <Textarea
                id="mem-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Contenido sustantivo de la entrada (máx 2000 caracteres)..."
                className="mt-1 min-h-20 border-[#d2d2d7] bg-white text-xs"
                maxLength={2000}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {tab === "WIN" && (
                <div>
                  <label htmlFor="win-class" className="text-[11px] font-semibold text-[#1d1d1f]">Clase</label>
                  <Select value={winClass} onValueChange={setWinClass}>
                    <SelectTrigger id="win-class" className="mt-1 h-9 w-28 border-[#d2d2d7] bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"].map((w) => (
                        <SelectItem key={w} value={w} className="text-xs">{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {tab === "ANTI_PATTERN" && (
                <div>
                  <label htmlFor="ap-sev" className="text-[11px] font-semibold text-[#1d1d1f]">Severidad</label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger id="ap-sev" className="mt-1 h-9 w-32 border-[#d2d2d7] bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["CRITICA", "ALTA", "MEDIA"].map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                onClick={append}
                disabled={appending}
                className="ml-auto h-9 rounded-full bg-[#0071e3] px-5 text-white hover:bg-[#0077ed]"
              >
                {appending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <ScrollText className="size-3.5" aria-hidden="true" />}
                Anexar (P9)
              </Button>
            </div>
            {error && <p className="text-[11px] text-[#ff3b30]" role="alert">{error}</p>}
          </div>
        )}
      </section>

      {/* Entries del ledger activo */}
      <section aria-label={`Entradas de ${activeTab.label}`} className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <div className="os-scroll max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {entries.length === 0 && (
            <p className="py-8 text-center text-xs text-[#86868b]">Ledger vacío para este tipo.</p>
          )}
          {entries.map((e) => (
            <article
              key={e.id}
              className="rounded-xl border border-[#e5e5ea] bg-[#fafafc] px-4 py-3 transition-colors hover:border-[#d2d2d7]"
            >
              <div className="flex flex-wrap items-center gap-2">
                {e.code && (
                  <span className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold",
                    e.type === "ANTI_PATTERN"
                      ? e.severity === "CRITICA" ? "bg-[#ff3b30]/10 text-[#d70015]" : "bg-[#ff9500]/10 text-[#b25000]"
                      : "bg-[#34c759]/10 text-[#248a3d]"
                  )}>
                    {e.code}
                  </span>
                )}
                <h4 className="text-xs font-semibold text-[#1d1d1f]">{e.title}</h4>
                {e.winClass && (
                  <Badge variant="outline" className="h-5 border-[#d2d2d7] bg-white px-1.5 font-mono text-[9px] text-[#248a3d]">
                    {e.winClass}
                  </Badge>
                )}
                <span className="ml-auto font-mono text-[9px] text-[#86868b]">
                  epoch {e.epoch}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#4b4b50]">{e.content}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
