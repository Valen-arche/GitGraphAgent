"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ModuleGraph } from "./types";

const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 90;

/** Places each module at x = path depth, y = order within that depth — a simple
 * layered layout good enough for folder graphs with a few dozen nodes. No generic
 * graph-layout library needed yet; revisit if repos start producing dense graphs. */
function layout(graph: ModuleGraph): { nodes: Node[]; edges: Edge[] } {
  const depthOf = (id: string) => (id === "" ? 0 : id.split("/").length);
  const countPerDepth = new Map<number, number>();

  const nodes: Node[] = [...graph.nodes]
    .sort((a, b) => depthOf(a.id) - depthOf(b.id) || a.id.localeCompare(b.id))
    .map((n) => {
      const depth = depthOf(n.id);
      const row = countPerDepth.get(depth) ?? 0;
      countPerDepth.set(depth, row + 1);
      return {
        id: n.id || "(root)",
        position: { x: depth * COLUMN_WIDTH, y: row * ROW_HEIGHT },
        data: { label: `${n.id || "(root)"} · ${n.fileCount} archivo${n.fileCount === 1 ? "" : "s"}` },
        style: {
          background: "#171a23",
          color: "#e6e8ee",
          border: "1px solid #2a2f3d",
          borderRadius: 8,
          fontSize: 12,
          padding: 8,
        },
      };
    });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: `${e.from}=>${e.to}`,
    source: e.from || "(root)",
    target: e.to || "(root)",
    label: e.weight > 1 ? String(e.weight) : undefined,
    animated: false,
    style: { stroke: "#4c5570" },
  }));

  return { nodes, edges };
}

export function ModuleGraphView({ graph }: { graph: ModuleGraph }) {
  const { nodes, edges } = useMemo(() => layout(graph), [graph]);

  if (nodes.length === 0) {
    return <p style={{ opacity: 0.7 }}>No se detectaron módulos JS/TS para graficar en este repo.</p>;
  }

  return (
    <div style={{ height: 480, border: "1px solid #2a2f3d", borderRadius: 12 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
        <Background color="#2a2f3d" gap={24} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
