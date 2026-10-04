"use client";

// agent-canvas.tsx — living topology canvas adapted from
// yosietserga/living-topology-visualizer (D3 layout + particle engine).
// Live mode extension: external node activation/deactivation and
// per-link context-transfer bursts driven by the topology-engine socket.

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as d3 from "d3";
import type {
  AggregateMetrics,
  LiveLink,
  LiveNode,
  Scenario,
  TopologyEvent,
  ViewMode,
} from "@/lib/topology/types";
import {
  LAYER_COLORS,
  LINK_COLORS,
  PARTICLE_COLORS,
  STATUS_COLORS,
  STATUS_GLOW,
  TRANSFER_COLORS,
  clamp,
} from "@/lib/topology/colors";
import type { TransferKind } from "@/lib/topology-live/protocol";

export interface AgentCanvasHandle {
  injectFailure: (nodeId?: string) => void;
  recoverAll: () => void;
  burstTraffic: () => void;
  /** Live mode: activate/deactivate an organ with a pulse. */
  setNodeActive: (nodeId: string, active: boolean) => void;
  /** Live mode: spawn a burst of context particles along a link. */
  burstTransfer: (from: string, to: string, kind: TransferKind, weight: number) => void;
  /** Live mode: force a node status (e.g. down on inference error). */
  setNodeStatus: (nodeId: string, status: "healthy" | "degraded" | "down") => void;
}

interface AgentCanvasProps {
  scenario: Scenario;
  viewMode: ViewMode;
  paused: boolean;
  /** Live agentic mode: node states driven externally, no synthetic drift. */
  liveMode?: boolean;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onMetrics: (m: AggregateMetrics) => void;
  onLiveNodes: (nodes: LiveNode[]) => void;
  onEvent: (e: Omit<TopologyEvent, "id">) => void;
}

interface Particle {
  seq: number;
  linkId: string;
  t: number;
  speed: number;
  size: number;
  color: string;
  arrived: boolean;
}

const layerLabelOf = (i: number) => `Layer ${i}`;

function nodeRadius(n: LiveNode): number {
  return 14 + Math.min(11, Math.log10(n.liveRps + 10) * 4.2);
}

const AgentCanvas = forwardRef<AgentCanvasHandle, AgentCanvasProps>(
  function AgentCanvas(props, ref) {
    const {
      scenario,
      viewMode,
      paused,
      liveMode = false,
      selectedNodeId,
      onSelectNode,
      onMetrics,
      onLiveNodes,
      onEvent,
    } = props;

    const hostRef = useRef<HTMLDivElement | null>(null);
    const stateRef = useRef<{
      width: number;
      height: number;
      view: ViewMode;
      nodes: LiveNode[];
      links: LiveLink[];
      raf: number | null;
      metricsTimer: number | null;
      particles: Particle[];
      spawnAccum: Map<string, number>;
      paused: boolean;
      selected: string | null;
      disposed: boolean;
      burstUntil: number;
      liveMode: boolean;
      particleSeq: number;
      linkBoost: Map<string, number>;
    }>({
      width: 800,
      height: 600,
      view: "orbit",
      nodes: [],
      links: [],
      raf: null,
      metricsTimer: null,
      particles: [],
      spawnAccum: new Map(),
      paused: false,
      selected: null,
      disposed: false,
      burstUntil: 0,
      liveMode: false,
      particleSeq: 0,
      linkBoost: new Map(),
    });

    // Keep latest props available to the animation loops without re-subscribing.
    const propsRef = useRef(props);
    propsRef.current = props;

    // ------------------------------------------------------------------
    // Paint guide rings/funnels + layer labels.
    // ------------------------------------------------------------------
    function paintGuides(
      width: number,
      height: number,
      view: ViewMode,
      layers: Scenario["layers"]
    ) {
      const svg = d3.select(hostRef.current).select("svg");
      const guides = svg.select("g.guides");
      const labelLayer = svg.select("g.layer-labels");
      guides.selectAll("*").remove();
      labelLayer.selectAll("*").remove();
      if (view === "orbit") {
        const cx = width / 2;
        const cy = height / 2;
        const minDim = Math.min(width, height);
        const baseR = minDim * 0.1;
        const ringGap =
          layers.length > 1 ? (minDim * 0.46 - baseR) / (layers.length - 1) : 0;
        layers.forEach((_, layer) => {
          const r = baseR + layer * ringGap;
          guides
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", r)
            .attr("fill", "none")
            .attr("stroke", LAYER_COLORS[layer])
            .attr("stroke-opacity", 0.18)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "2 6");
          labelLayer
            .append("text")
            .attr("x", cx)
            .attr("y", cy - r - 8)
            .attr("text-anchor", "middle")
            .attr("fill", LAYER_COLORS[layer])
            .attr("font-size", 10)
            .attr("font-family", "var(--font-geist-mono), monospace")
            .attr("opacity", 0.72)
            .text(layers[layer].name.toUpperCase());
        });
      } else {
        const padX = width * 0.09;
        const colWidth = (width - padX * 2) / Math.max(1, layers.length - 1);
        const bandShrink = layers.length > 4 ? 0.12 : 0.18;
        layers.forEach((_, layer) => {
          const x = padX + layer * colWidth;
          const bandH = height * 0.7 * (1 - layer * bandShrink);
          const yTop = height / 2 - bandH / 2;
          guides
            .append("rect")
            .attr("x", x - colWidth * 0.42)
            .attr("y", yTop)
            .attr("width", colWidth * 0.84)
            .attr("height", bandH)
            .attr("fill", LAYER_COLORS[layer])
            .attr("fill-opacity", 0.03)
            .attr("stroke", LAYER_COLORS[layer])
            .attr("stroke-opacity", 0.16)
            .attr("stroke-dasharray", "2 6");
          labelLayer
            .append("text")
            .attr("x", x)
            .attr("y", yTop - 8)
            .attr("text-anchor", "middle")
            .attr("fill", LAYER_COLORS[layer])
            .attr("font-size", 11)
            .attr("font-family", "var(--font-geist-mono), monospace")
            .attr("opacity", 0.78)
            .text(`${layerLabelOf(layer)} · ${layers[layer].name.toUpperCase()}`);
        });
      }
    }

    // ------------------------------------------------------------------
    // Imperative commands exposed to the parent.
    // ------------------------------------------------------------------
    useImperativeHandle(ref, () => ({
      injectFailure(nodeId?: string) {
        const s = stateRef.current;
        const pool = s.nodes.filter((n) => n.liveStatus !== "down");
        if (pool.length === 0) return;
        const target =
          (nodeId ? s.nodes.find((n) => n.id === nodeId) : null) ??
          pool[Math.floor(Math.random() * pool.length)];
        target.liveStatus = "down";
        target.liveErrorRate = 0.6;
        target.liveCpu = 0.99;
        target.liveLatencyMs = target.latencyMs * 8;
        target.pulse = 1;
        onEvent({
          ts: Date.now(),
          level: "error",
          message: `${target.label} went DOWN — error rate ${(target.liveErrorRate * 100).toFixed(0)}%`,
        });
        s.links.forEach((l) => {
          const neighbor =
            l.sourceNode === target
              ? l.targetNode
              : l.targetNode === target
                ? l.sourceNode
                : null;
          if (neighbor && neighbor.liveStatus === "healthy") {
            neighbor.liveErrorRate = clamp(neighbor.liveErrorRate + 0.03, 0, 0.5);
            neighbor.liveLatencyMs = clamp(
              neighbor.liveLatencyMs * 1.4,
              0,
              neighbor.latencyMs * 5
            );
          }
        });
      },
      recoverAll() {
        const s = stateRef.current;
        s.nodes.forEach((n) => {
          n.liveErrorRate = n.errorRate;
          n.liveLatencyMs = n.latencyMs;
          n.liveCpu = n.cpu;
          n.liveRps = n.rps;
          n.liveStatus = n.status;
          n.pulse = 0.4;
        });
        onEvent({
          ts: Date.now(),
          level: "success",
          message: "Recovery initiated — all nodes returning to baseline.",
        });
      },
      burstTraffic() {
        const s = stateRef.current;
        s.burstUntil = Date.now() + 6000;
        s.nodes.forEach((n) => {
          n.pulse = 0.8;
        });
        onEvent({
          ts: Date.now(),
          level: "warn",
          message: "Traffic burst injected — throughput x2.4 for 6s.",
        });
      },
      setNodeActive(nodeId: string, active: boolean) {
        const s = stateRef.current;
        const n = s.nodes.find((x) => x.id === nodeId);
        if (!n) return;
        if (n.active === active) return;
        n.active = active;
        if (active) {
          n.liveRps = n.rps * 1.9;
          n.liveCpu = Math.min(0.95, n.cpu * 2.4 + 0.18);
          n.pulse = 1;
          if (n.liveStatus === "down") n.liveStatus = n.status;
        } else {
          n.liveRps = n.rps * 0.14;
          n.liveCpu = n.cpu * 0.5;
          n.pulse = 0.55;
        }
      },
      setNodeStatus(nodeId: string, status: "healthy" | "degraded" | "down") {
        const s = stateRef.current;
        const n = s.nodes.find((x) => x.id === nodeId);
        if (!n) return;
        n.liveStatus = status;
        n.pulse = Math.min(1, n.pulse + 0.6);
        if (status === "down") {
          n.liveErrorRate = 0.55;
          n.liveLatencyMs = n.latencyMs * 6;
        } else if (status === "degraded") {
          n.liveErrorRate = 0.05;
          n.liveLatencyMs = n.latencyMs * 2.2;
        } else {
          n.liveErrorRate = n.errorRate;
          n.liveLatencyMs = n.latencyMs;
        }
      },
      burstTransfer(from: string, to: string, kind: TransferKind, weight: number) {
        const s = stateRef.current;
        const link = s.links.find(
          (l) => l.sourceNode.id === from && l.targetNode.id === to
        );
        if (!link) return;
        const color = TRANSFER_COLORS[kind];
        const count = clamp(Math.round(2 + weight), 2, 9);
        for (let i = 0; i < count; i++) {
          if (s.particles.length > 460) break;
          s.particleSeq += 1;
          s.particles.push({
            seq: s.particleSeq,
            linkId: link.id,
            t: -(i * 0.09) - Math.random() * 0.08, // staggered start
            speed: 0.34 + Math.min(0.4, weight * 0.05) + Math.random() * 0.12,
            size: 1.6 + Math.min(2.6, weight * 0.35),
            color,
            arrived: false,
          });
        }
        // boost ambient spawn on this link briefly + pulse both endpoints
        s.linkBoost.set(link.id, Date.now() + 3200);
        link.sourceNode.pulse = Math.min(1, link.sourceNode.pulse + 0.35);
        link.targetNode.pulse = Math.min(1, link.targetNode.pulse + 0.2);
      },
    }));

    // ------------------------------------------------------------------
    // Layout: compute target positions for each node given the view mode.
    // ------------------------------------------------------------------
    function computeLayout(
      width: number,
      height: number,
      view: ViewMode,
      nodes: LiveNode[]
    ) {
      const maxLayer = nodes.reduce((m, n) => Math.max(m, n.layer), 0);
      const byLayer: Record<number, LiveNode[]> = {};
      for (let i = 0; i <= maxLayer; i++) byLayer[i] = [];
      nodes.forEach((n) => {
        (byLayer[n.layer] ?? (byLayer[n.layer] = [])).push(n);
      });

      if (view === "orbit") {
        const cx = width / 2;
        const cy = height / 2;
        const minDim = Math.min(width, height);
        const baseR = minDim * 0.1;
        const ringGap = maxLayer > 0 ? (minDim * 0.46 - baseR) / maxLayer : 0;
        for (let layer = 0; layer <= maxLayer; layer++) {
          const arr = byLayer[layer];
          const r = baseR + layer * ringGap;
          // Half-step angular offset: keeps the top of every ring free so the
          // layer labels drawn at (cx, cy - r - 8) never overlap a node.
          const offset = arr.length > 0 ? Math.PI / arr.length : 0;
          arr.forEach((n, i) => {
            const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2 + offset;
            n.targetX = cx + r * Math.cos(angle);
            n.targetY = cy + r * Math.sin(angle);
          });
        }
      } else {
        const padX = width * 0.09;
        const colWidth = (width - padX * 2) / Math.max(1, maxLayer);
        const bandShrink = maxLayer > 3 ? 0.12 : 0.18;
        for (let layer = 0; layer <= maxLayer; layer++) {
          const arr = byLayer[layer];
          const x = padX + layer * colWidth;
          const bandH = height * 0.7 * (1 - layer * bandShrink);
          const spacing = arr.length > 1 ? bandH / (arr.length - 1) : 0;
          const startY = height / 2 - ((arr.length - 1) * spacing) / 2;
          arr.forEach((n, i) => {
            n.targetX = x;
            n.targetY = arr.length === 1 ? height / 2 : startY + i * spacing;
          });
        }
      }
    }

    // ------------------------------------------------------------------
    // Main setup effect — builds the SVG and animation loops.
    // ------------------------------------------------------------------
    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;
      const s = stateRef.current;
      s.disposed = false;
      s.liveMode = liveMode;

      const rect = host.getBoundingClientRect();
      s.width = Math.max(360, rect.width);
      s.height = Math.max(360, rect.height);

      const liveNodes: LiveNode[] = scenario.nodes.map((n) => ({
        ...n,
        x: s.width / 2,
        y: s.height / 2,
        vx: 0,
        vy: 0,
        targetX: s.width / 2,
        targetY: s.height / 2,
        liveRps: liveMode ? n.rps * 0.14 : n.rps,
        liveLatencyMs: n.latencyMs,
        liveErrorRate: n.errorRate,
        liveCpu: liveMode ? n.cpu * 0.5 : n.cpu,
        liveStatus: n.status,
        pulse: 0.3,
        active: liveMode ? false : undefined,
      }));
      const nodeById = new Map(liveNodes.map((n) => [n.id, n]));
      const liveLinks: LiveLink[] = scenario.links
        .map((l) => {
          const sn = nodeById.get(l.source);
          const tn = nodeById.get(l.target);
          if (!sn || !tn) return null;
          return { ...l, sourceNode: sn, targetNode: tn } as LiveLink;
        })
        .filter((l): l is LiveLink => l !== null);

      s.nodes = liveNodes;
      s.links = liveLinks;
      s.particles = [];
      s.spawnAccum = new Map();
      s.linkBoost = new Map();
      s.view = viewMode;
      s.paused = paused;
      s.selected = selectedNodeId;

      computeLayout(s.width, s.height, s.view, liveNodes);

      // --- SVG bootstrap --------------------------------------------------
      d3.select(host).select("svg").remove();
      const svg = d3
        .select(host)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${s.width} ${s.height}`)
        .attr("preserveAspectRatio", "xMidYMid slice")
        .style("display", "block");

      const defs = svg.append("defs");

      const glow = defs
        .append("filter")
        .attr("id", "node-glow")
        .attr("x", "-80%")
        .attr("y", "-80%")
        .attr("width", "260%")
        .attr("height", "260%");
      glow
        .append("feGaussianBlur")
        .attr("stdDeviation", 4)
        .attr("result", "blur");
      const merge = glow.append("feMerge");
      merge.append("feMergeNode").attr("in", "blur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");

      const softGlow = defs
        .append("filter")
        .attr("id", "soft-glow")
        .attr("x", "-60%")
        .attr("y", "-60%")
        .attr("width", "220%")
        .attr("height", "220%");
      softGlow
        .append("feGaussianBlur")
        .attr("stdDeviation", 2.5)
        .attr("result", "blur");
      const sm = softGlow.append("feMerge");
      sm.append("feMergeNode").attr("in", "blur");
      sm.append("feMergeNode").attr("in", "SourceGraphic");

      const cssVar = (name: string, fallback: string) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(name)
          .trim() || fallback;
      const bg1 = cssVar("--app-canvas-bg-1", "#0c1422");
      const bg2 = cssVar("--app-canvas-bg-2", "#05070c");
      const bgGrad = defs
        .append("radialGradient")
        .attr("id", "bg-vignette")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "70%");
      bgGrad.append("stop").attr("offset", "0%").attr("stop-color", bg1);
      bgGrad.append("stop").attr("offset", "100%").attr("stop-color", bg2);

      svg
        .append("rect")
        .attr("class", "bg")
        .attr("width", s.width)
        .attr("height", s.height)
        .attr("fill", "url(#bg-vignette)")
        .style("cursor", "default")
        .on("click", () => {
          if (propsRef.current.selectedNodeId != null) {
            propsRef.current.onSelectNode(null);
          }
        });

      // Faint grid.
      const grid = svg.append("g").attr("class", "grid");
      const gridSize = 40;
      grid
        .append("g")
        .selectAll("line")
        .data(d3.range(0, s.width, gridSize))
        .enter()
        .append("line")
        .attr("x1", (d) => d)
        .attr("x2", (d) => d)
        .attr("y1", 0)
        .attr("y2", s.height)
        .attr("stroke", "rgba(148,163,184,0.05)")
        .attr("stroke-width", 1);
      grid
        .append("g")
        .selectAll("line")
        .data(d3.range(0, s.height, gridSize))
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", s.width)
        .attr("y1", (d) => d)
        .attr("y2", (d) => d)
        .attr("stroke", "rgba(148,163,184,0.05)")
        .attr("stroke-width", 1);

      svg.append("g").attr("class", "guides");
      const linkLayer = svg.append("g").attr("class", "links");
      const particleLayer = svg.append("g").attr("class", "particles");
      const nodeLayer = svg.append("g").attr("class", "nodes");
      svg.append("g").attr("class", "layer-labels");

      paintGuides(s.width, s.height, s.view, scenario.layers);

      // --- Links ----------------------------------------------------------
      const linkSel = linkLayer
        .selectAll<SVGPathElement, LiveLink>("path")
        .data(liveLinks, (d) => d.id)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", (d) => LINK_COLORS[d.kind])
        .attr("stroke-width", (d) => 0.6 + d.throughput * 1.8)
        .attr("stroke-opacity", 0.7);

      // --- Nodes ----------------------------------------------------------
      const nodeSel = nodeLayer
        .selectAll<SVGGElement, LiveNode>("g.node")
        .data(liveNodes, (d) => d.id)
        .enter()
        .append("g")
        .attr("class", "node")
        .style("cursor", "pointer")
        .on("click", (_event, d) => {
          propsRef.current.onSelectNode(
            propsRef.current.selectedNodeId === d.id ? null : d.id
          );
        })
        .on("mouseenter", function (_event, d) {
          d3.select(this).select("circle.core").transition().duration(120).attr("r", nodeRadius(d) + 2);
        })
        .on("mouseleave", function (_event, d) {
          d3.select(this).select("circle.core").transition().duration(120).attr("r", nodeRadius(d));
        });

      nodeSel
        .append("circle")
        .attr("class", "focus-ring")
        .attr("fill", "none")
        .attr("stroke", "#67e8f9")
        .attr("stroke-width", 1.6)
        .attr("stroke-dasharray", "3 4")
        .attr("opacity", 0)
        .attr("pointer-events", "none");

      nodeSel
        .append("circle")
        .attr("class", "pulse")
        .attr("fill", "none")
        .attr("stroke", (d) => STATUS_COLORS[d.liveStatus])
        .attr("stroke-width", 1.5)
        .attr("opacity", 0);

      nodeSel
        .append("circle")
        .attr("class", "halo")
        .attr("r", (d) => nodeRadius(d) + 5)
        .attr("fill", (d) => STATUS_GLOW[d.liveStatus])
        .attr("filter", "url(#node-glow)")
        .attr("opacity", 0.5);

      nodeSel
        .append("circle")
        .attr("class", "core")
        .attr("r", (d) => nodeRadius(d))
        .attr("fill", cssVar("--app-node-fill", "#0b1220"))
        .attr("stroke", (d) => LAYER_COLORS[d.layer])
        .attr("stroke-width", 1.6)
        .attr("filter", "url(#soft-glow)");

      nodeSel
        .append("text")
        .attr("class", "glyph")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", 8.5)
        .attr("font-family", "var(--font-geist-mono), monospace")
        .attr("font-weight", 700)
        .attr("fill", cssVar("--app-glyph", "#e2e8f0"))
        .attr("pointer-events", "none")
        .text((d) => d.glyph);

      nodeSel
        .append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("y", (d) => nodeRadius(d) + 13)
        .attr("font-size", 9.5)
        .attr("font-family", "var(--font-geist-sans), sans-serif")
        .attr("fill", cssVar("--app-node-label", "#cbd5e1"))
        .attr("opacity", 0.78)
        .attr("pointer-events", "none")
        .text((d) => d.label);

      // --- Render ----------------------------------------------------------
      function tickRender() {
        const selId = propsRef.current.selectedNodeId;
        const focus = selId ? computeFocus(selId, liveLinks) : null;
        const live = s.liveMode;

        linkSel
          .attr("d", (d) => {
            const sx = d.sourceNode.x;
            const sy = d.sourceNode.y;
            const tx = d.targetNode.x;
            const ty = d.targetNode.y;
            const mx = (sx + tx) / 2;
            const my = (sy + ty) / 2;
            const dx = tx - sx;
            const dy = ty - sy;
            const dist = Math.hypot(dx, dy) || 1;
            const curve = Math.min(28, dist * 0.12);
            const px = mx + (-dy / dist) * curve;
            const py = my + (dx / dist) * curve;
            return `M${sx},${sy} Q${px},${py} ${tx},${ty}`;
          })
          .attr("stroke-opacity", (d) => {
            if (!focus) return 0.7;
            return focus.edgeIds.has(d.id) ? 0.95 : 0.05;
          })
          .attr("stroke-width", (d) => {
            const base = 0.6 + d.throughput * 1.8;
            const boosted = (s.linkBoost.get(d.id) ?? 0) > Date.now();
            const b = live && boosted ? base + 1.2 : base;
            if (!focus) return b;
            return focus.edgeIds.has(d.id) ? b + 1.1 : b * 0.5;
          });

        nodeSel
          .attr("transform", (d) => `translate(${d.x},${d.y})`)
          .attr("opacity", (d) => {
            if (focus) return focus.neighborIds.has(d.id) ? 1 : 0.12;
            if (live && d.active === false) return 0.34;
            return 1;
          });

        const now = performance.now();
        nodeSel
          .select("circle.focus-ring")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", (d) =>
            selId === d.id
              ? nodeRadius(d) + 9 + Math.sin(now / 380) * 2
              : nodeRadius(d) + 9
          )
          .attr("opacity", (d) => (selId === d.id ? 0.9 : 0));

        nodeSel
          .select("circle.pulse")
          .attr("cx", (d) => 0)
          .attr("cy", (d) => 0)
          .attr("r", (d) => nodeRadius(d) + 4 + d.pulse * 16)
          .attr("opacity", (d) => d.pulse * 0.5)
          .attr("stroke", (d) => STATUS_COLORS[d.liveStatus]);

        nodeSel
          .select("circle.halo")
          .attr("fill", (d) => STATUS_GLOW[d.liveStatus])
          .attr("opacity", (d) => {
            if (focus) {
              const isFocal = d.id === selId;
              const isNeighbor = focus.neighborIds.has(d.id);
              return (isFocal ? 0.85 : isNeighbor ? 0.6 : 0.05) + d.pulse * 0.4;
            }
            if (live) {
              const base = d.active ? 0.62 : 0.07;
              return base + d.pulse * 0.38;
            }
            const base = propsRef.current.selectedNodeId == null ? 0.45 : 0.18;
            return base + d.pulse * 0.4;
          });

        nodeSel
          .select("circle.core")
          .attr("stroke-width", (d) =>
            propsRef.current.selectedNodeId === d.id ? 3 : 1.6
          )
          .attr("r", (d) =>
            live && d.active ? nodeRadius(d) + 1.4 : nodeRadius(d)
          );
      }
      tickRender();

      // --- Particle animation loop ---------------------------------------
      function spawnParticles(dt: number) {
        if (s.paused) return;
        const burstActive = Date.now() < s.burstUntil;
        const burstMul = burstActive ? 2.4 : 1;
        const live = s.liveMode;
        const selId = propsRef.current.selectedNodeId;
        const focus = selId ? computeFocus(selId, liveLinks) : null;
        const focusBoost = focus ? 1.8 : 1;
        const now = Date.now();
        s.links.forEach((l) => {
          if (focus && !focus.edgeIds.has(l.id)) return;
          if (l.sourceNode.liveStatus === "down" || l.targetNode.liveStatus === "down")
            return;
          // In live mode ambient flow is quiet; bursts come from transfers.
          const boosted = (s.linkBoost.get(l.id) ?? 0) > now;
          const rate = live
            ? (boosted ? 1.6 : 0.12) + l.throughput * (boosted ? 4.5 : 0.5)
            : (1.2 + l.throughput * 6) * burstMul * focusBoost;
          let acc = s.spawnAccum.get(l.id) ?? 0;
          acc += rate * dt;
          const whole = Math.floor(acc);
          acc -= whole;
          s.spawnAccum.set(l.id, acc);
          for (let i = 0; i < whole; i++) {
            if (s.particles.length > 460) break;
            s.particleSeq += 1;
            s.particles.push({
              seq: s.particleSeq,
              linkId: l.id,
              t: 0,
              speed: 0.35 + l.throughput * 0.5 + Math.random() * 0.15,
              size: 1.4 + l.throughput * 2.2,
              color: PARTICLE_COLORS[l.kind],
              arrived: false,
            });
          }
        });
      }

      function bezierPoint(
        sx: number,
        sy: number,
        tx: number,
        ty: number,
        t: number
      ): [number, number] {
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.hypot(dx, dy) || 1;
        const curve = Math.min(28, dist * 0.12);
        const px = mx + (-dy / dist) * curve;
        const py = my + (dx / dist) * curve;
        const u = 1 - t;
        const x = u * u * sx + 2 * u * t * px + t * t * tx;
        const y = u * u * sy + 2 * u * t * py + t * t * ty;
        return [x, y];
      }

      const linkById = new Map(liveLinks.map((l) => [l.id, l]));
      let lastTs = performance.now();
      function frame(now: number) {
        if (s.disposed) return;
        const dt = Math.min(0.05, (now - lastTs) / 1000);
        lastTs = now;

        if (!s.paused) {
          for (const n of s.nodes) {
            const dx = n.targetX - n.x;
            const dy = n.targetY - n.y;
            n.x = Math.abs(dx) < 0.5 ? n.targetX : n.x + dx * 0.14;
            n.y = Math.abs(dy) < 0.5 ? n.targetY : n.y + dy * 0.14;
          }

          spawnParticles(dt);

          const survivors: Particle[] = [];
          for (const p of s.particles) {
            const link = linkById.get(p.linkId);
            if (!link) continue;
            p.t += p.speed * dt;
            if (p.t >= 1) {
              link.targetNode.pulse = Math.min(1, link.targetNode.pulse + 0.18);
              continue;
            }
            survivors.push(p);
          }
          s.particles = survivors;

          for (const n of s.nodes) n.pulse *= 0.95;
        }

        const particleSel = particleLayer
          .selectAll<SVGCircleElement, Particle>("circle.particle")
          .data(s.particles, (d) => `${d.linkId}-${d.seq}`);
        particleSel.exit().remove();
        particleSel
          .enter()
          .append("circle")
          .attr("class", "particle")
          .attr("filter", "url(#soft-glow)")
          .merge(particleSel)
          .attr("cx", (p) => {
            const l = linkById.get(p.linkId)!;
            return bezierPoint(
              l.sourceNode.x,
              l.sourceNode.y,
              l.targetNode.x,
              l.targetNode.y,
              Math.max(0, p.t)
            )[0];
          })
          .attr("cy", (p) => {
            const l = linkById.get(p.linkId)!;
            return bezierPoint(
              l.sourceNode.x,
              l.sourceNode.y,
              l.targetNode.x,
              l.targetNode.y,
              Math.max(0, p.t)
            )[1];
          })
          .attr("r", (p) => p.size)
          .attr("fill", (p) => p.color);

        tickRender();

        s.raf = requestAnimationFrame(frame);
      }
      s.raf = requestAnimationFrame(frame);

      // --- Metrics loop -----------------------------------------------
      s.metricsTimer = window.setInterval(() => {
        if (s.disposed) return;
        if (s.paused) return;
        const live = s.liveMode;

        if (live) {
          // Ease live metrics toward the activity target — no synthetic drift:
          // node states come from the real engine events.
          for (const n of s.nodes) {
            if (n.liveStatus === "down") continue;
            const targetRps = n.active ? n.rps * 1.9 : n.rps * 0.14;
            n.liveRps += (targetRps - n.liveRps) * 0.18;
            const targetCpu = n.active ? Math.min(0.95, n.cpu * 2.4 + 0.18) : n.cpu * 0.5;
            n.liveCpu += (targetCpu - n.liveCpu) * 0.2;
            n.liveLatencyMs += (n.latencyMs - n.liveLatencyMs) * 0.08;
            n.liveErrorRate += (n.errorRate - n.liveErrorRate) * 0.1;
          }
        } else {
          const burstActive = Date.now() < s.burstUntil;
          const burstMul = burstActive ? 2.2 : 1;
          for (const n of s.nodes) {
            if (n.liveStatus === "down") continue;
            n.liveRps = driftToward(n.liveRps * burstMul, n.rps, 0.18);
            n.liveLatencyMs = driftToward(n.liveLatencyMs, n.latencyMs, 0.22);
            n.liveErrorRate = clamp(driftToward(n.liveErrorRate, n.errorRate, 0.4), 0, 0.9);
            n.liveCpu = clamp(driftToward(n.liveCpu, Math.min(0.99, n.cpu), 0.18), 0.02, 1);
            n.liveStatus = deriveLiveStatus(n.liveErrorRate, n.liveCpu, n.liveLatencyMs, n.latencyMs);
          }
        }

        const totalRps = s.nodes.reduce((a, n) => a + n.liveRps, 0);
        const weightedLatency =
          s.nodes.reduce((a, n) => a + n.liveLatencyMs * n.liveRps, 0) /
          (totalRps || 1);
        const errorRate =
          s.nodes.reduce((a, n) => a + n.liveErrorRate * n.liveRps, 0) /
          (totalRps || 1);

        const layerIds = Array.from(new Set(s.nodes.map((n) => n.layer))).sort(
          (a, b) => a - b
        );
        const layers = layerIds.map((layer) => {
          const ln = s.nodes.filter((n) => n.layer === layer);
          const lrps = ln.reduce((a, n) => a + n.liveRps, 0);
          const llat =
            ln.reduce((a, n) => a + n.liveLatencyMs * n.liveRps, 0) / (lrps || 1);
          const lerr =
            ln.reduce((a, n) => a + n.liveErrorRate * n.liveRps, 0) / (lrps || 1);
          const lload = ln.length ? ln.reduce((a, n) => a + n.liveCpu, 0) / ln.length : 0;
          return { layer, rps: lrps, avgLatencyMs: llat, errorRate: lerr, load: lload };
        });

        const agg: AggregateMetrics = {
          totalRps,
          avgLatencyMs: weightedLatency,
          errorRate,
          activeNodes: s.nodes.filter((n) => n.liveStatus !== "down").length,
          degradedNodes: s.nodes.filter((n) => n.liveStatus === "degraded").length,
          downNodes: s.nodes.filter((n) => n.liveStatus === "down").length,
          packetsInFlight: s.particles.length,
          layers,
        };
        propsRef.current.onMetrics(agg);
        propsRef.current.onLiveNodes(
          s.nodes.map((n) => ({ ...n }))
        );
      }, 1400);

      // --- Resize observer -----------------------------------------------
      const ro = new ResizeObserver(() => {
        if (s.disposed) return;
        const r = host.getBoundingClientRect();
        s.width = Math.max(360, r.width);
        s.height = Math.max(360, r.height);
        svg.attr("viewBox", `0 0 ${s.width} ${s.height}`);
        svg.select("rect").attr("width", s.width).attr("height", s.height);
        grid.selectAll("line").remove();
        grid
          .append("g")
          .selectAll("line")
          .data(d3.range(0, s.width, 40))
          .enter()
          .append("line")
          .attr("x1", (d) => d)
          .attr("x2", (d) => d)
          .attr("y1", 0)
          .attr("y2", s.height)
          .attr("stroke", "rgba(148,163,184,0.05)")
          .attr("stroke-width", 1);
        grid
          .append("g")
          .selectAll("line")
          .data(d3.range(0, s.height, 40))
          .enter()
          .append("line")
          .attr("x1", 0)
          .attr("x2", s.width)
          .attr("y1", (d) => d)
          .attr("y2", (d) => d)
          .attr("stroke", "rgba(148,163,184,0.05)")
          .attr("stroke-width", 1);
        computeLayout(s.width, s.height, s.view, s.nodes);
        paintGuides(s.width, s.height, s.view, scenario.layers);
      });
      ro.observe(host);

      // --- Cleanup --------------------------------------------------------
      return () => {
        s.disposed = true;
        ro.disconnect();
        if (s.raf) cancelAnimationFrame(s.raf);
        if (s.metricsTimer) clearInterval(s.metricsTimer);
        d3.select(host).select("svg").remove();
      };
    }, [scenario.id, liveMode]);

    // ------------------------------------------------------------------
    useEffect(() => {
      const s = stateRef.current;
      if (s.disposed || s.nodes.length === 0) return;
      s.view = viewMode;
      computeLayout(s.width, s.height, viewMode, s.nodes);
      paintGuides(s.width, s.height, viewMode, scenario.layers);
    }, [viewMode, scenario]);

    useEffect(() => {
      const s = stateRef.current;
      s.paused = paused;
    }, [paused]);

    useEffect(() => {
      const s = stateRef.current;
      s.selected = selectedNodeId;
      s.particles = [];
      s.spawnAccum.clear();
    }, [selectedNodeId]);

    return (
      <div
        ref={hostRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Topología viva del workflow agéntico — nodos activos, flujos y transferencias de contexto en tiempo real"
        role="img"
      />
    );
  }
);

function driftToward(current: number, baseline: number, volatility: number): number {
  const pull = (baseline - current) * 0.05;
  const noise = (Math.random() - 0.5) * volatility * baseline;
  return Math.max(0, current + pull + noise);
}

function deriveLiveStatus(
  errorRate: number,
  cpu: number,
  latencyMs: number,
  baselineLatency: number
): "healthy" | "degraded" | "down" {
  if (errorRate > 0.08 || cpu > 0.96 || latencyMs > baselineLatency * 4) return "down";
  if (errorRate > 0.02 || cpu > 0.82 || latencyMs > baselineLatency * 2) return "degraded";
  return "healthy";
}

function computeFocus(
  selectedId: string,
  links: LiveLink[]
): { neighborIds: Set<string>; edgeIds: Set<string> } {
  const neighborIds = new Set<string>([selectedId]);
  const edgeIds = new Set<string>();
  for (const l of links) {
    if (l.sourceNode.id === selectedId) {
      neighborIds.add(l.targetNode.id);
      edgeIds.add(l.id);
    } else if (l.targetNode.id === selectedId) {
      neighborIds.add(l.sourceNode.id);
      edgeIds.add(l.id);
    }
  }
  return { neighborIds, edgeIds };
}

export { AgentCanvas };
export default AgentCanvas;
