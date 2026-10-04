"use client";

// useTopologyLive — single live connection to the topology-engine
// mini-service (:3003 via gateway). Consumed by both the Topología Viva
// view and the Kanban KPI board so they stay perfectly in sync.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  EMPTY_KPI,
  TOPOLOGY_SOCKET_URL,
  type ControlAction,
  type EngineStateDTO,
  type FindingCardDTO,
  type IterationDTO,
  type KpiDTO,
  type LogEntryDTO,
  type NodeStateDTO,
  type SnapshotDTO,
  type StepStateDTO,
  type TransferDTO,
} from "./protocol";
import type { CycleStepId } from "@/lib/topology/agent-workflow";

const MAX_TRANSFERS = 120;
const MAX_LOGS = 140;
const MAX_ITERATIONS = 24;

export interface TopologyLiveState {
  connected: boolean;
  engine: EngineStateDTO;
  nodes: Map<string, NodeStateDTO>;
  iterations: IterationDTO[];
  kpis: KpiDTO;
  transfers: TransferDTO[];
  logs: LogEntryDTO[];
  findings: FindingCardDTO[];
  lastTransfer: TransferDTO | null;
  nodeEvents: NodeStateDTO[];
}

export function useTopologyLive() {
  const [connected, setConnected] = useState(false);
  const [engine, setEngine] = useState<EngineStateDTO>({
    running: false,
    paused: false,
    mode: "idle",
    queuedIterations: 0,
    paceMs: 2600,
    currentIterationId: null,
  });
  const [nodes, setNodes] = useState<Map<string, NodeStateDTO>>(new Map());
  const [iterations, setIterations] = useState<IterationDTO[]>([]);
  const [kpis, setKpis] = useState<KpiDTO>(EMPTY_KPI);
  const [transfers, setTransfers] = useState<TransferDTO[]>([]);
  const [logs, setLogs] = useState<LogEntryDTO[]>([]);
  const [findings, setFindings] = useState<FindingCardDTO[]>([]);
  const [lastTransfer, setLastTransfer] = useState<TransferDTO | null>(null);
  const [nodeEvents, setNodeEvents] = useState<NodeStateDTO[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const logIdRef = useRef(0);
  const transferIdRef = useRef(0);
  // Idempotency guards: socket.io can deliver the same packet twice when the
  // transport upgrades (polling → websocket) behind the caddy gateway.
  // Dedupe by content identity so logs/transfers/KPI lists never duplicate.
  const seenLogsRef = useRef<Set<string>>(new Set());
  const seenTransfersRef = useRef<Set<string>>(new Set());

  const pruneSeen = (ref: React.MutableRefObject<Set<string>>) => {
    if (ref.current.size > 500) {
      ref.current = new Set(Array.from(ref.current).slice(-250));
    }
  };

  useEffect(() => {
    const socket = io(TOPOLOGY_SOCKET_URL, {
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("topo:control", { action: "resync" });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("topo:snapshot", (snap: SnapshotDTO) => {
      setEngine(snap.engine);
      setNodes(new Map(snap.nodes.map((n) => [n.id, n])));
      setIterations(snap.iterations.slice(0, MAX_ITERATIONS));
      setKpis(snap.kpis);
      // Remap ids to a connection-scoped counter: engine ids restart on
      // service reload and would collide with previously received entries
      // (duplicate React keys in the event log).
      setTransfers(
        snap.recentTransfers
          .slice(0, MAX_TRANSFERS)
          .map((t) => ({ ...t, id: `t-${++transferIdRef.current}` }))
      );
      setLogs(
        snap.recentLogs
          .slice(0, MAX_LOGS)
          .map((l) => ({ ...l, id: ++logIdRef.current }))
      );
      setFindings(snap.findings);
      for (const l of snap.recentLogs) seenLogsRef.current.add(`${l.ts}|${l.message}`);
      for (const t of snap.recentTransfers) seenTransfersRef.current.add(`${t.ts}|${t.from}|${t.to}|${t.preview.slice(0, 48)}`);
      if (snap.recentTransfers.length > 0) {
        transferIdRef.current += 1;
        setLastTransfer({ ...snap.recentTransfers[0], id: `t-${transferIdRef.current}` });
      }
    });

    socket.on("topo:node", (node: NodeStateDTO) => {
      setNodes((prev) => {
        const next = new Map(prev);
        next.set(node.id, node);
        return next;
      });
      setNodeEvents((prev) => [node, ...prev].slice(0, 40));
    });

    socket.on("topo:transfer", (t: TransferDTO) => {
      const dedupeKey = `${t.ts}|${t.from}|${t.to}|${t.preview.slice(0, 48)}`;
      if (seenTransfersRef.current.has(dedupeKey)) return;
      seenTransfersRef.current.add(dedupeKey);
      pruneSeen(seenTransfersRef);
      transferIdRef.current += 1;
      const remapped: TransferDTO = { ...t, id: `t-${transferIdRef.current}` };
      setTransfers((prev) => [remapped, ...prev].slice(0, MAX_TRANSFERS));
      setLastTransfer(remapped);
    });

    socket.on("topo:step", (payload: { iterationId: string; step: StepStateDTO }) => {
      setIterations((prev) =>
        prev.map((it) =>
          it.id === payload.iterationId
            ? {
                ...it,
                steps: { ...it.steps, [payload.step.id]: payload.step },
              }
            : it
        )
      );
    });

    socket.on("topo:iteration", (it: IterationDTO) => {
      setIterations((prev) => {
        const rest = prev.filter((x) => x.id !== it.id);
        return [it, ...rest].slice(0, MAX_ITERATIONS);
      });
    });

    socket.on("topo:kpi", (k: KpiDTO) => setKpis(k));

    socket.on("topo:findings", (items: FindingCardDTO[]) => setFindings(items));

    socket.on("topo:log", (entry: { ts: number; level: LogEntryDTO["level"]; message: string }) => {
      const dedupeKey = `${entry.ts}|${entry.message}`;
      if (seenLogsRef.current.has(dedupeKey)) return;
      seenLogsRef.current.add(dedupeKey);
      pruneSeen(seenLogsRef);
      logIdRef.current += 1;
      // Capture the id OUTSIDE the updater: React batches state updates, so
      // reading logIdRef.current inside the updater would give two events
      // processed in the same batch the SAME (final) counter value.
      const localLogId = logIdRef.current;
      setLogs((prev) =>
        [{ ...entry, id: localLogId }, ...prev].slice(0, MAX_LOGS)
      );
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const control = useCallback((payload: ControlAction) => {
    socketRef.current?.emit("topo:control", payload);
  }, []);

  const runIterations = useCallback(
    (count = 1) => control({ action: "run", iterations: count }),
    [control]
  );
  const runContinuous = useCallback(() => control({ action: "continuous" }), [control]);
  const pause = useCallback(() => control({ action: "pause" }), [control]);
  const resume = useCallback(() => control({ action: "resume" }), [control]);
  const stop = useCallback(() => control({ action: "stop" }), [control]);
  const setPace = useCallback(
    (paceMs: number) => control({ action: "pace", paceMs }),
    [control]
  );

  const activeNodes = useMemo(
    () => Array.from(nodes.values()).filter((n) => n.active).map((n) => n.id),
    [nodes]
  );

  const currentIteration = useMemo(
    () => iterations.find((it) => it.status === "running") ?? null,
    [iterations]
  );

  const currentStep = useMemo<(CycleStepId | null)>(() => {
    if (!currentIteration) return null;
    const entry = (Object.entries(currentIteration.steps) as [CycleStepId, StepStateDTO][]).find(
      ([, s]) => s.status === "running"
    );
    return entry ? entry[0] : null;
  }, [currentIteration]);

  return {
    connected,
    engine,
    nodes,
    iterations,
    kpis,
    transfers,
    logs,
    findings,
    lastTransfer,
    nodeEvents,
    activeNodes,
    currentIteration,
    currentStep,
    control,
    runIterations,
    runContinuous,
    pause,
    resume,
    stop,
    setPace,
  };
}

export type TopologyLive = ReturnType<typeof useTopologyLive>;
