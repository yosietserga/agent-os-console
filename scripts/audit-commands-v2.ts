// Auditoría exhaustiva del dispatcher v2: comandos canónicos + alias + flujo
// background de radiografía. Criterio de fallo: status ERROR inesperado,
// HTTP != 200, respuesta no-JSON, o duración > presupuesto (AP-032/033).
const BASE = "http://localhost:3000";

const CASES: { input: string; maxMs?: number; expect?: "OK" | "ERROR" | "EMPTY400" }[] = [
  { input: "ide detect" },
  { input: "ide all" },
  { input: "en este ide, cold run" },
  { input: "mejorate list" },
  { input: "verify" },
  { input: "gaps-finder" },
  { input: "", expect: "EMPTY400" },
  { input: "comando-inexistente-xyz", expect: "ERROR" },
];

async function postCommand(input: string) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/agent-os/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const ct = res.headers.get("content-type") ?? "";
  const ms = Date.now() - t0;
  if (!ct.includes("application/json")) {
    return { kind: "nonjson" as const, status: res.status, ct, ms };
  }
  const json = (await res.json()) as {
    success: boolean;
    data: { status: string; output: string; durationMs: number; data?: Record<string, unknown> } | null;
    error: string | null;
  };
  return { kind: "json" as const, http: res.status, json, ms };
}

async function run() {
  let pass = 0;
  let fail = 0;

  for (const c of CASES) {
    try {
      const r = await postCommand(c.input);
      if (r.kind === "nonjson") {
        console.log(`FAIL  "${c.input}" → HTTP ${r.status} content-type="${r.ct}" (${r.ms}ms) — respuesta no-JSON`);
        fail++;
        continue;
      }
      const expect = c.expect ?? "OK";
      if (expect === "EMPTY400") {
        const ok = r.http === 400 && r.json.data === null && (r.json.error ?? "").includes("Input vacío");
        console.log(`${ok ? "PASS" : "FAIL"}  "" → HTTP ${r.http} · "${r.json.error?.slice(0, 60)}"`);
        if (ok) pass++; else fail++;
        continue;
      }
      const wantStatus = expect === "ERROR" ? "ERROR" : "OK";
      const ok = r.json.data?.status === wantStatus;
      console.log(`${ok ? "PASS" : "FAIL"}  "${c.input}" → ${r.json.data?.status} · ${r.ms}ms${ok ? "" : ` — salida: ${(r.json.data?.output ?? r.json.error ?? "").slice(0, 120)}`}`);
      if (ok) pass++; else fail++;
    } catch (e) {
      console.log(`FAIL  "${c.input}" → excepción: ${e instanceof Error ? e.message : e}`);
      fail++;
    }
  }

  // ── Flujo background de radiografía (AP-032 fix) ──
  console.log("\n── Radiografía background (rayos-x + cold run reverse-engineer) ──");
  for (const input of ["rayos-x https://example.com", "cold run reverse-engineer https://example.org"]) {
    const r = await postCommand(input);
    if (r.kind === "nonjson" || !r.json.data) {
      console.log(`FAIL  "${input}" → ${r.kind === "nonjson" ? `no-JSON HTTP ${r.status}` : r.json.error}`);
      fail++;
      continue;
    }
    const launched = r.json.data.status === "OK" && r.ms < 3000;
    const runId = (r.json.data.data as { runId?: string } | undefined)?.runId;
    console.log(`${launched ? "PASS" : "FAIL"}  "${input}" → ${r.json.data.status} en ${r.ms}ms (launch inmediato) · runId ${runId?.slice(-8)}`);
    if (launched && runId) pass++; else fail++;
  }

  // Polling del último run hasta terminar (máx 75s)
  const list = await fetch(`${BASE}/api/agent-os/radiografia`).then((r) =>
    r.json() as Promise<{ data: { id: string; status: string; targetUrl: string }[] }>
  );
  const target = list.data[0];
  if (target) {
    const t0 = Date.now();
    let finalStatus = target.status;
    for (let i = 0; i < 37; i++) {
      await new Promise((res) => setTimeout(res, 2000));
      const poll = await fetch(`${BASE}/api/agent-os/radiografia?id=${target.id}`).then((r) =>
        r.json() as Promise<{ data: { status: string; phase: number } | null }>
      );
      finalStatus = poll.data?.status ?? finalStatus;
      if (finalStatus !== "RUNNING") break;
    }
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const ok = finalStatus === "COMPLETED";
    console.log(`${ok ? "PASS" : "FAIL"}  pipeline ${target.targetUrl} (${target.id.slice(-8)}) → ${finalStatus} tras ${secs}s de polling`);
    if (ok) pass++; else fail++;
  }

  console.log(`\n═══ RESULTADO v2: ${pass} PASS · ${fail} FAIL ═══`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
