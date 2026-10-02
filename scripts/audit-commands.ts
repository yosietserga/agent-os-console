// Auditoría exhaustiva del dispatcher: 17 comandos canónicos + alias críticos.
// Criterio de fallo: status ERROR, HTTP != 200, respuesta no-JSON, o
// duración > 25s (riesgo de timeout del gateway del preview — AP-032).
const BASE = "http://localhost:3000";

const CASES: { input: string; maxMs?: number }[] = [
  { input: "help" },
  { input: "lee AGENTS.md, ejecuta: help" },
  { input: "start" },
  { input: "cold run" },
  { input: "cold-run" },
  { input: "verify" },
  { input: "audit memory" },
  { input: "sil trend" },
  { input: "persona check" },
  { input: "ui test" },
  { input: "expected-check" },
  { input: "gaps-finder" },
  { input: "gaps" },
  { input: "itera 2" },
  { input: "ide detect" },
  { input: "investiga testing" },
  { input: "critica agent-os" },
  { input: "report" },
  { input: "l2 status" },
  { input: "mejorate list" },
  { input: "mejorate scan", maxMs: 25000 },
  { input: "mejorate", maxMs: 28000 },
  { input: "mejorate synthesize", maxMs: 25000 },
  { input: "pre cycle" },
  { input: "radiografia" },
  { input: "rayos-x" },
  { input: "rayos-x url-invalida-:::" },
  { input: "comando-inexistente-xyz" },
  { input: "" },
];

async function run() {
  let pass = 0;
  let fail = 0;
  const started = Date.now();
  for (const c of CASES) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE}/api/agent-os/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: c.input }),
      });
      const ct = res.headers.get("content-type") ?? "";
      const ms = Date.now() - t0;
      if (!ct.includes("application/json")) {
        console.log(`FAIL  "${c.input}" → HTTP ${res.status} content-type="${ct}" (${ms}ms) — respuesta no-JSON`);
        fail++;
        continue;
      }
      const json = (await res.json()) as {
        success: boolean;
        data: { status: string; output: string; durationMs: number } | null;
        error: string | null;
      };
      const expectError = c.input === "comando-inexistente-xyz" || c.input === "" || c.input === "rayos-x url-invalida-:::";
      const ok = expectError ? json.data?.status === "ERROR" : json.data?.status === "OK";
      const budget = c.maxMs ?? 8000;
      const overBudget = ms > budget;
      if (ok && !overBudget) {
        console.log(`PASS  "${c.input}" → ${json.data?.status} · ${ms}ms (server ${json.data?.durationMs}ms)`);
        pass++;
      } else if (ok && overBudget) {
        console.log(`RISK  "${c.input}" → ${json.data?.status} pero ${ms}ms excede presupuesto ${budget}ms`);
        fail++;
      } else {
        console.log(`FAIL  "${c.input}" → status=${json.data?.status} (${ms}ms): ${(json.error ?? json.data?.output ?? "").slice(0, 160)}`);
        fail++;
      }
    } catch (e) {
      console.log(`FAIL  "${c.input}" → excepción: ${e instanceof Error ? e.message : e} (${Date.now() - t0}ms)`);
      fail++;
    }
  }
  console.log(`\n═══ RESULTADO: ${pass} PASS · ${fail} FAIL/RISK de ${CASES.length} casos en ${((Date.now() - started) / 1000).toFixed(1)}s ═══`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
