// ════════════════════════════════════════════════════════════════════════
// client.ts — Helpers de red del lado cliente (sin SDK: z-ai-web-dev-sdk es
// exclusivamente servidor). AP-032 (fix): fetch() sin verificar content-type
// provocaba "Unexpected token '<'" cuando el gateway del preview cortaba
// comandos largos (>30s) devolviendo HTML 504 en vez de JSON. Estos helpers
// detectan la respuesta no-JSON, reportan el tiempo REAL transcurrido (P2
// Gate Honesty — antes el catch mentía con durationMs: 0) y devuelven
// mensajes accionables en vez de stack traces crípticos.
// ════════════════════════════════════════════════════════════════════════
import type { CommandResultDTO, RadiografiaRunDTO } from "./types";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown>;
}

const REQUEST_TIMEOUT_MS = 120_000;
const GATEWAY_HINT =
  "Causa: el gateway del preview cortó la conexión (respuesta HTML tras exceder su timeout).";

function errorResult(input: string, output: string): CommandResultDTO {
  return {
    command: input,
    args: null,
    output,
    status: "ERROR",
    durationMs: 0,
    refresh: false,
  };
}

/**
 * POST /api/agent-os/command con manejo honesto de errores de red.
 * Devuelve siempre un CommandResultDTO — nunca lanza.
 */
export async function executeCommandClient(input: string): Promise<CommandResultDTO> {
  const t0 = performance.now();
  const elapsed = () => Math.round(performance.now() - t0);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch("/api/agent-os/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
      signal: controller.signal,
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const result = errorResult(
        input,
        [
          `[ERROR] Respuesta no-JSON del servidor (HTTP ${res.status}, "${contentType || "sin content-type"}") tras ${elapsed()}ms.`,
          `  ${GATEWAY_HINT}`,
          "  Acción: usa sub-comandos más cortos — mejorate scan · mejororate synthesize —",
          "  o radiografia <url> (corre en background con polling).",
        ].join("\n")
      );
      result.durationMs = elapsed();
      return result;
    }
    const json = (await res.json()) as ApiEnvelope<CommandResultDTO>;
    if (json.data) {
      // El dispatcher reporta su duración de servidor; conservarla
      return json.data;
    }
    const result = errorResult(input, json.error ?? "Error desconocido del dispatcher");
    result.durationMs = elapsed();
    return result;
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    const result = errorResult(
      input,
      aborted
        ? [
            `[ERROR] Timeout del cliente (${Math.round(REQUEST_TIMEOUT_MS / 1000)}s) — el comando puede seguir ejecutándose en el servidor.`,
            "  Acción: verifica el estado con: cold run · l2 status",
          ].join("\n")
        : `[ERROR] Error de red tras ${elapsed()}ms: ${e instanceof Error ? e.message : "desconocido"}`
    );
    result.durationMs = elapsed();
    return result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * POST /api/agent-os/radiografia — lanza el pipeline en background y
 * devuelve el run en estado RUNNING para hacer polling.
 */
export async function startRadiografiaClient(
  url: string
): Promise<{ ok: true; run: RadiografiaRunDTO } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch("/api/agent-os/radiografia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return {
        ok: false,
        error: `Respuesta no-JSON del gateway (HTTP ${res.status}). Reintenta en unos segundos.`,
      };
    }
    const json = (await res.json()) as ApiEnvelope<RadiografiaRunDTO>;
    if (!json.success || !json.data) {
      return { ok: false, error: json.error ?? "El pipeline no pudo lanzarse" };
    }
    return { ok: true, run: json.data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error && e.name === "AbortError"
        ? "Timeout lanzando el pipeline — reintenta"
        : `Error de red: ${e instanceof Error ? e.message : "desconocido"}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET /api/agent-os/radiografia?id=<runId> — polling del run en progreso.
 */
export async function getRadiografiaRunClient(runId: string): Promise<RadiografiaRunDTO | null> {
  try {
    const res = await fetch(`/api/agent-os/radiografia?id=${encodeURIComponent(runId)}`, {
      cache: "no-store",
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("application/json")) return null;
    const json = (await res.json()) as ApiEnvelope<RadiografiaRunDTO>;
    return json.data ?? null;
  } catch {
    return null;
  }
}
