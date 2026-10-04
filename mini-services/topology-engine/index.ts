// topology-engine — mini-service (:3003)
// Streams the living agentic topology over socket.io: node activations,
// context transfers (including REAL L2 inference payloads), 7-stage cycle
// iterations, KPIs and real findings from the Agent OS database.

import { createServer } from "http";
import { Server } from "socket.io";
import { TopologyEngine } from "./engine";

const PORT = 3003;

const httpServer = createServer((req, res) => {
  // health endpoint (no port in body — informational only)
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "topology-engine", port: PORT }));
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "topology-engine" }));
});

const io = new Server(httpServer, {
  // DO NOT change the path — the caddy gateway forwards on it.
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const engine = new TopologyEngine(io);

io.on("connection", (socket) => {
  // Full snapshot for late joiners
  socket.emit("topo:snapshot", engine.snapshot());

  socket.on("topo:control", (payload: { action: string; iterations?: number; paceMs?: number }) => {
    try {
      engine.control(payload);
    } catch (e) {
      socket.emit("topo:log", {
        ts: Date.now(),
        level: "error",
        message: `Control rechazado: ${e instanceof Error ? e.message : "error"}`,
      });
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[topology-engine] listening on :${PORT} (socket.io path "/")`);
});
