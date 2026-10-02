"use client";

// ════════════════════════════════════════════════════════════════════════
// command-console.tsx — Consola de invocación canónica (column_left)
// `lee AGENTS.md, ejecuta: <comando>` → dispatcher real vía /api/command
// 4 estados obligatorios (Fase 3): loading, vacío, error, éxito.
// ════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { Terminal, CornerDownLeft, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandDefDTO, CommandResultDTO } from "@/lib/agent-os/types";

interface HistoryItem {
  id: number;
  input: string;
  result: CommandResultDTO | null;
  pending?: boolean;
}

interface CommandConsoleProps {
  commands: CommandDefDTO[];
  onExecuted?: (result: CommandResultDTO) => void;
  onMejorate?: () => void;
}

const QUICK = ["mejorate", "verify", "cold run", "sil trend", "pre cycle", "report", "help"];

export function CommandConsole({ commands, onExecuted, onMejorate }: CommandConsoleProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [running, setRunning] = useState(false);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  const suggestions = input.trim().length > 0
    ? commands
        .map((c) => c.name)
        .filter((n) => n.toLowerCase().includes(input.trim().toLowerCase()))
        .slice(0, 4)
    : [];

  async function execute(raw: string) {
    const cmd = raw.trim();
    if (!cmd || running) return;
    const id = ++idRef.current;
    setHistory((h) => [...h, { id, input: cmd, result: null, pending: true }]);
    setInput("");
    setRunning(true);
    try {
      const res = await fetch("/api/agent-os/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: cmd }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data: CommandResultDTO | null;
        error: string | null;
      };
      const result: CommandResultDTO =
        json.data ?? {
          command: cmd,
          args: null,
          output: json.error ?? "Error desconocido",
          status: "ERROR",
          durationMs: 0,
          refresh: false,
        };
      setHistory((h) => h.map((it) => (it.id === id ? { ...it, result, pending: false } : it)));
      onExecuted?.(result);
      if (result.command === "mejorate" && onMejorate) onMejorate();
    } catch (error) {
      setHistory((h) =>
        h.map((it) =>
          it.id === id
            ? {
                ...it,
                pending: false,
                result: {
                  command: cmd,
                  args: null,
                  output: `Error de red: ${error instanceof Error ? error.message : "desconocido"}`,
                  status: "ERROR",
                  durationMs: 0,
                  refresh: false,
                },
              }
            : it
        )
      );
    } finally {
      setRunning(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section
      data-tour="console"
      aria-label="Consola de comandos canónicos"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e5e5ea] bg-[#1d1d1f] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]"
    >
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Terminal className="size-4 text-[#30d158]" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-white">Consola Canónica</h2>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70">
          AGENTS.md v1.8.0
        </span>
      </header>

      {/* Historial */}
      <div
        ref={scrollRef}
        className="os-scroll min-h-[280px] flex-1 space-y-4 overflow-y-auto px-4 py-4 lg:max-h-[430px]"
        aria-live="polite"
        aria-atomic="false"
      >
        {history.length === 0 && (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center">
            <Terminal className="size-8 text-white/25" aria-hidden="true" />
            <p className="max-w-[240px] text-xs leading-relaxed text-white/50">
              Sintaxis universal del operador:
              <br />
              <code className="text-[#30d158]">lee AGENTS.md, ejecuta: &lt;comando&gt;</code>
              <br />
              El prefijo es opcional: escribe el comando directo.
            </p>
          </div>
        )}
        {history.map((item) => (
          <article key={item.id} className="space-y-1.5">
            <div className="flex items-start gap-2 font-mono text-xs">
              <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-[#0a84ff]" aria-hidden="true" />
              <span className="break-all text-[#e8e8ed]">{item.input}</span>
            </div>
            {item.pending ? (
              <p className="flex items-center gap-2 pl-5 font-mono text-xs text-white/60">
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                ejecutando en el dispatcher...
              </p>
            ) : (
              item.result && (
                <pre
                  className={cn(
                    "os-scroll overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] leading-relaxed",
                    item.result.status === "ERROR" ? "text-[#ff6961]" : "text-[#a8e2a0]"
                  )}
                >
                  {item.result.output}
                  <span className="mt-1 block text-white/35">
                    exit {item.result.status === "OK" ? "0" : "1"} · {item.result.durationMs}ms
                  </span>
                </pre>
              )
            )}
          </article>
        ))}
      </div>

      {/* Sugerencias */}
      {suggestions.length > 0 && (
        <div className="border-t border-white/10 px-4 py-2" role="listbox" aria-label="Sugerencias de comandos">
          {suggestions.map((s) => (
            <button
              key={s}
              role="option"
              aria-selected="false"
              onClick={() => setInput(s)}
              className="block w-full rounded-md px-2 py-1 text-left font-mono text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        className="flex items-center gap-2 border-t border-white/10 bg-black/25 px-3 py-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          execute(input);
        }}
      >
        <label htmlFor="cmd-input" className="sr-only">
          Comando canónico
        </label>
        <span className="hidden shrink-0 font-mono text-[11px] text-white/45 sm:inline">
          lee AGENTS.md, ejecuta:
        </span>
        <input
          id="cmd-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={running}
          autoComplete="off"
          spellCheck={false}
          placeholder="mejorate"
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={running || !input.trim()}
          aria-label="Ejecutar comando"
          className="shrink-0 rounded-lg bg-[#0a84ff] p-2 text-white transition-all hover:bg-[#3395ff] disabled:opacity-30"
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CornerDownLeft className="size-4" aria-hidden="true" />
          )}
        </button>
      </form>

      {/* Chips rápidos */}
      <div className="flex flex-wrap gap-1.5 border-t border-white/10 px-3 py-2.5">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => execute(q)}
            disabled={running}
            className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] text-white/70 transition-colors hover:border-[#0a84ff]/60 hover:bg-[#0a84ff]/15 hover:text-white disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>
    </section>
  );
}
