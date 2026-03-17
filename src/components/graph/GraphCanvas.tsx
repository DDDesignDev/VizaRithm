"use client";

import { GraphData, GraphEdge, GraphNode } from "@/types";

interface GraphCanvasProps {
  graph: GraphData;
  showDistances?: boolean;
}

const NODE_RADIUS = 24;
const VIEWBOX_WIDTH = 604;
const VIEWBOX_HEIGHT = 244;

function nodeColors(state: GraphNode["state"]) {
  switch (state) {
    case "frontier":
      return { fill: "rgba(34,211,238,0.18)", stroke: "#22D3EE", text: "#22D3EE" };
    case "visiting":
      return { fill: "rgba(251,191,36,0.22)", stroke: "#FBBF24", text: "#FBBF24" };
    case "visited":
      return { fill: "rgba(167,139,250,0.18)", stroke: "#A78BFA", text: "#C4B5FD" };
    case "path":
      return { fill: "rgba(52,211,153,0.18)", stroke: "#34D399", text: "#34D399" };
    case "start":
      return { fill: "rgba(52,211,153,0.18)", stroke: "#34D399", text: "#34D399" };
    case "end":
      return { fill: "rgba(248,113,113,0.16)", stroke: "#F87171", text: "#F87171" };
    default:
      return { fill: "var(--surface-3)", stroke: "var(--border-bright)", text: "var(--text-secondary)" };
  }
}

function edgeColors(state: GraphEdge["state"]) {
  switch (state) {
    case "active":
      return { stroke: "#22D3EE", width: 2.25, labelFill: "rgba(34,211,238,0.12)", labelStroke: "rgba(34,211,238,0.24)", text: "#22D3EE" };
    case "path":
      return { stroke: "#34D399", width: 2.5, labelFill: "rgba(52,211,153,0.12)", labelStroke: "rgba(52,211,153,0.24)", text: "#34D399" };
    default:
      return { stroke: "var(--surface-5)", width: 1.6, labelFill: "var(--surface-2)", labelStroke: "var(--surface-4)", text: "var(--text-muted)" };
  }
}

function midPoint(a: GraphNode, b: GraphNode) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export default function GraphCanvas({ graph, showDistances = false }: GraphCanvasProps) {
  const nodes = Object.values(graph.nodes);

  if (!nodes.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-text-muted font-mono">No graph data</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="min-w-[640px] h-full flex items-center justify-center">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="w-full max-w-4xl h-full"
          style={{ overflow: "visible" }}
        >
          {graph.edges.map((edge) => {
            const from = graph.nodes[edge.from];
            const to = graph.nodes[edge.to];
            const colors = edgeColors(edge.state);
            const mid = midPoint(from, to);

            return (
              <g key={edge.id}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={colors.stroke}
                  strokeWidth={colors.width}
                  strokeLinecap="round"
                  style={{ transition: "stroke 0.2s ease, stroke-width 0.2s ease" }}
                />
                <rect
                  x={mid.x - 12}
                  y={mid.y - 9}
                  width={24}
                  height={18}
                  rx={6}
                  fill={colors.labelFill}
                  stroke={colors.labelStroke}
                />
                <text
                  x={mid.x}
                  y={mid.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={colors.text}
                  fontSize={10}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={700}
                >
                  {edge.weight}
                </text>
              </g>
            );
          })}

          {nodes.map((node) => {
            const colors = nodeColors(node.state);
            return (
              <g key={node.id}>
                {showDistances && (
                  <>
                    <rect
                      x={node.x - 18}
                      y={node.y - NODE_RADIUS - 18}
                      width={36}
                      height={16}
                      rx={6}
                      fill="var(--surface-2)"
                      stroke="var(--surface-4)"
                    />
                    <text
                      x={node.x}
                      y={node.y - NODE_RADIUS - 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="var(--text-muted)"
                      fontSize={9}
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight={700}
                    >
                      {Number.isFinite(node.distance) ? node.distance : "inf"}
                    </text>
                  </>
                )}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={1.75}
                  style={{ transition: "fill 0.2s ease, stroke 0.2s ease" }}
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={colors.text}
                  fontSize={14}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={700}
                  style={{ userSelect: "none" }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
