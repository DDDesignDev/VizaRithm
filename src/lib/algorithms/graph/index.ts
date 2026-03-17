import { GraphData, GraphEdge, GraphNode, GraphStats, GraphStep } from "@/types";

const NODE_LAYOUT: Array<{ id: string; x: number; y: number }> = [
  { id: "A", x: 72, y: 78 },
  { id: "B", x: 180, y: 48 },
  { id: "C", x: 184, y: 148 },
  { id: "D", x: 294, y: 56 },
  { id: "E", x: 304, y: 166 },
  { id: "F", x: 422, y: 58 },
  { id: "G", x: 430, y: 172 },
  { id: "H", x: 532, y: 112 },
];

const REQUIRED_CONNECTIONS: Array<[string, string]> = [
  ["A", "B"],
  ["A", "C"],
  ["B", "D"],
  ["C", "E"],
  ["D", "F"],
  ["E", "G"],
  ["F", "H"],
];

const OPTIONAL_CONNECTIONS: Array<[string, string]> = [
  ["B", "C"],
  ["B", "E"],
  ["C", "D"],
  ["C", "F"],
  ["D", "E"],
  ["D", "G"],
  ["E", "F"],
  ["E", "H"],
  ["F", "G"],
  ["G", "H"],
];

export const GRAPH_NODE_IDS = NODE_LAYOUT.map((node) => node.id);
export const DEFAULT_GRAPH_START = "A";
export const DEFAULT_GRAPH_END = "H";

type AdjacencyMap = Record<string, Array<{ nodeId: string; edgeId: string; weight: number }>>;

function makeEdgeId(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function randomWeight(): number {
  return Math.floor(Math.random() * 8) + 1;
}

function cloneNodes(nodes: Record<string, GraphNode>): Record<string, GraphNode> {
  const out: Record<string, GraphNode> = {};
  for (const id in nodes) out[id] = { ...nodes[id] };
  return out;
}

export function cloneGraph(graph: GraphData): GraphData {
  return {
    nodes: cloneNodes(graph.nodes),
    edges: graph.edges.map((edge) => ({ ...edge })),
  };
}

function snapshot(graph: GraphData, stats: GraphStats, description: string): GraphStep {
  return {
    graph: cloneGraph(graph),
    stats: { ...stats },
    description,
  };
}

function baseStats(visitedCount = 0, pathLength = 0, pathCost: number | null = null): GraphStats {
  return { visitedCount, pathLength, pathCost };
}

function buildAdjacency(graph: GraphData): AdjacencyMap {
  const adjacency: AdjacencyMap = {};

  for (const id of Object.keys(graph.nodes)) adjacency[id] = [];

  for (const edge of graph.edges) {
    adjacency[edge.from].push({ nodeId: edge.to, edgeId: edge.id, weight: edge.weight });
    adjacency[edge.to].push({ nodeId: edge.from, edgeId: edge.id, weight: edge.weight });
  }

  for (const id in adjacency) {
    adjacency[id].sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  }

  return adjacency;
}

function buildFrame(
  source: GraphData,
  startId: string,
  endId: string,
  options: {
    visited?: Iterable<string>;
    frontier?: Iterable<string>;
    current?: string | null;
    path?: Iterable<string>;
    activeEdges?: Iterable<string>;
    pathEdges?: Iterable<string>;
    distances?: Record<string, number>;
  } = {},
): GraphData {
  const graph = cloneGraph(source);
  const visited = new Set(options.visited ?? []);
  const frontier = new Set(options.frontier ?? []);
  const path = new Set(options.path ?? []);
  const activeEdges = new Set(options.activeEdges ?? []);
  const pathEdges = new Set(options.pathEdges ?? []);

  for (const id in graph.nodes) {
    const node = graph.nodes[id];
    const nextDistance = options.distances?.[id];
    node.distance = nextDistance ?? Infinity;
    node.state = "default";

    if (visited.has(id)) node.state = "visited";
    if (frontier.has(id)) node.state = "frontier";
    if (path.has(id)) node.state = "path";
    if (options.current === id) node.state = "visiting";
  }

  for (const edge of graph.edges) {
    edge.state = "default";
    if (activeEdges.has(edge.id)) edge.state = "active";
    if (pathEdges.has(edge.id)) edge.state = "path";
  }

  if (graph.nodes[startId]) graph.nodes[startId].state = "start";
  if (graph.nodes[endId]) graph.nodes[endId].state = "end";

  return graph;
}

function reconstructPath(parent: Record<string, string | undefined>, startId: string, endId: string): string[] {
  if (startId === endId) return [startId];
  if (!parent[endId]) return [];

  const path: string[] = [];
  let current: string | undefined = endId;

  while (current) {
    path.push(current);
    if (current === startId) break;
    current = parent[current];
  }

  if (path[path.length - 1] !== startId) return [];
  path.reverse();
  return path;
}

function pathEdgeIds(path: string[]): string[] {
  const edges: string[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    edges.push(makeEdgeId(path[i], path[i + 1]));
  }

  return edges;
}

function pathCost(graph: GraphData, path: string[]): number {
  if (path.length < 2) return 0;

  let cost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph.edges.find((item) => item.id === makeEdgeId(path[i], path[i + 1]));
    if (edge) cost += edge.weight;
  }
  return cost;
}

function defaultNodes(): Record<string, GraphNode> {
  return Object.fromEntries(
    NODE_LAYOUT.map((node) => [
      node.id,
      {
        id: node.id,
        label: node.id,
        x: node.x,
        y: node.y,
        state: "default" as const,
        distance: Infinity,
      },
    ]),
  );
}

function createEdges(): GraphEdge[] {
  const chosen = new Set(REQUIRED_CONNECTIONS.map(([from, to]) => makeEdgeId(from, to)));
  const edges = REQUIRED_CONNECTIONS.map(([from, to]) => ({
    id: makeEdgeId(from, to),
    from,
    to,
    weight: randomWeight(),
    state: "default" as const,
  }));

  const candidates = [...OPTIONAL_CONNECTIONS].sort(() => Math.random() - 0.5);
  const extraCount = 4;

  for (const [from, to] of candidates) {
    if (edges.length >= REQUIRED_CONNECTIONS.length + extraCount) break;
    const id = makeEdgeId(from, to);
    if (chosen.has(id)) continue;
    chosen.add(id);
    edges.push({ id, from, to, weight: randomWeight(), state: "default" });
  }

  return edges;
}

export function setGraphEndpoints(graph: GraphData, startId: string, endId: string): GraphData {
  return buildFrame(graph, startId, endId);
}

export function createRandomGraph(startId = DEFAULT_GRAPH_START, endId = DEFAULT_GRAPH_END): GraphData {
  const graph: GraphData = {
    nodes: defaultNodes(),
    edges: createEdges(),
  };

  return setGraphEndpoints(graph, startId, endId);
}

export function generateGraphBFSSteps(graph: GraphData, startId: string, endId: string): GraphStep[] {
  const source = cloneGraph(graph);
  const adjacency = buildAdjacency(source);
  const steps: GraphStep[] = [];
  const queue: string[] = [startId];
  const discovered = new Set<string>([startId]);
  const processed = new Set<string>();
  const frontier = new Set<string>([startId]);
  const parent: Record<string, string | undefined> = {};

  steps.push(
    snapshot(
      buildFrame(source, startId, endId, { frontier }),
      baseStats(0),
      `BFS starts at ${startId}. The queue expands level by level until ${endId} is found.`,
    ),
  );

  while (queue.length > 0) {
    const current = queue.shift()!;
    frontier.delete(current);
    processed.add(current);

    steps.push(
      snapshot(
        buildFrame(source, startId, endId, {
          visited: processed,
          frontier,
          current,
        }),
        baseStats(processed.size),
        `Dequeued ${current}. BFS now inspects every unvisited neighbor of ${current}.`,
      ),
    );

    if (current === endId) {
      const path = reconstructPath(parent, startId, endId);
      steps.push(
        snapshot(
          buildFrame(source, startId, endId, {
            visited: processed,
            path,
            pathEdges: pathEdgeIds(path),
          }),
          baseStats(processed.size, Math.max(path.length - 1, 0), pathCost(source, path)),
          `Reached ${endId}. The highlighted path is the shortest path in an unweighted graph.`,
        ),
      );
      return steps;
    }

    for (const neighbor of adjacency[current]) {
      if (discovered.has(neighbor.nodeId)) continue;

      discovered.add(neighbor.nodeId);
      frontier.add(neighbor.nodeId);
      parent[neighbor.nodeId] = current;
      queue.push(neighbor.nodeId);

      steps.push(
        snapshot(
          buildFrame(source, startId, endId, {
            visited: processed,
            frontier,
            current,
            activeEdges: [neighbor.edgeId],
          }),
          baseStats(processed.size),
          `Discovered ${neighbor.nodeId} from ${current}. Enqueue it to visit after the current layer.`,
        ),
      );
    }
  }

  steps.push(
    snapshot(
      buildFrame(source, startId, endId, { visited: processed }),
      baseStats(processed.size),
      `BFS exhausted the graph without reaching ${endId}. No path exists in this graph.`,
    ),
  );

  return steps;
}

export function generateGraphDFSSteps(graph: GraphData, startId: string, endId: string): GraphStep[] {
  const source = cloneGraph(graph);
  const adjacency = buildAdjacency(source);
  const steps: GraphStep[] = [];
  const stack: string[] = [startId];
  const discovered = new Set<string>([startId]);
  const processed = new Set<string>();
  const frontier = new Set<string>([startId]);
  const parent: Record<string, string | undefined> = {};

  steps.push(
    snapshot(
      buildFrame(source, startId, endId, { frontier }),
      baseStats(0),
      `DFS starts at ${startId}. The stack dives down one branch before backtracking.`,
    ),
  );

  while (stack.length > 0) {
    const current = stack.pop()!;
    frontier.delete(current);

    if (processed.has(current)) continue;
    processed.add(current);

    steps.push(
      snapshot(
        buildFrame(source, startId, endId, {
          visited: processed,
          frontier,
          current,
        }),
        baseStats(processed.size),
        `Popped ${current}. DFS explores as deep as possible from this branch.`,
      ),
    );

    if (current === endId) {
      const path = reconstructPath(parent, startId, endId);
      steps.push(
        snapshot(
          buildFrame(source, startId, endId, {
            visited: processed,
            path,
            pathEdges: pathEdgeIds(path),
          }),
          baseStats(processed.size, Math.max(path.length - 1, 0), pathCost(source, path)),
          `Reached ${endId}. DFS found a valid path, but it is not guaranteed to be shortest.`,
        ),
      );
      return steps;
    }

    const neighbors = [...adjacency[current]].reverse();
    for (const neighbor of neighbors) {
      if (discovered.has(neighbor.nodeId)) continue;

      discovered.add(neighbor.nodeId);
      frontier.add(neighbor.nodeId);
      parent[neighbor.nodeId] = current;
      stack.push(neighbor.nodeId);

      steps.push(
        snapshot(
          buildFrame(source, startId, endId, {
            visited: processed,
            frontier,
            current,
            activeEdges: [neighbor.edgeId],
          }),
          baseStats(processed.size),
          `Push ${neighbor.nodeId} onto the stack from ${current}. It will be explored next if nothing deeper blocks it.`,
        ),
      );
    }
  }

  steps.push(
    snapshot(
      buildFrame(source, startId, endId, { visited: processed }),
      baseStats(processed.size),
      `DFS explored every reachable node from ${startId} without finding ${endId}.`,
    ),
  );

  return steps;
}

export function generateGraphDijkstraSteps(graph: GraphData, startId: string, endId: string): GraphStep[] {
  const source = cloneGraph(graph);
  const adjacency = buildAdjacency(source);
  const steps: GraphStep[] = [];
  const distances: Record<string, number> = Object.fromEntries(
    Object.keys(source.nodes).map((id) => [id, Infinity]),
  );
  const queue: string[] = [startId];
  const frontier = new Set<string>([startId]);
  const processed = new Set<string>();
  const parent: Record<string, string | undefined> = {};

  distances[startId] = 0;

  steps.push(
    snapshot(
      buildFrame(source, startId, endId, { frontier, distances }),
      baseStats(0),
      `Dijkstra starts at ${startId} with distance 0. Frontier nodes always use the smallest known tentative distance.`,
    ),
  );

  while (queue.length > 0) {
    queue.sort((a, b) => distances[a] - distances[b] || a.localeCompare(b));
    const current = queue.shift()!;
    frontier.delete(current);

    if (processed.has(current)) continue;
    processed.add(current);

    steps.push(
      snapshot(
        buildFrame(source, startId, endId, {
          visited: processed,
          frontier,
          current,
          distances,
        }),
        baseStats(processed.size),
        `Extracted ${current} with the smallest tentative distance of ${distances[current]}.`,
      ),
    );

    if (current === endId) {
      const path = reconstructPath(parent, startId, endId);
      steps.push(
        snapshot(
          buildFrame(source, startId, endId, {
            visited: processed,
            path,
            pathEdges: pathEdgeIds(path),
            distances,
          }),
          baseStats(processed.size, Math.max(path.length - 1, 0), distances[endId]),
          `Reached ${endId}. Because Dijkstra settles shortest distances first, this path is optimal.`,
        ),
      );
      return steps;
    }

    for (const neighbor of adjacency[current]) {
      if (processed.has(neighbor.nodeId)) continue;

      const candidate = distances[current] + neighbor.weight;
      if (candidate >= distances[neighbor.nodeId]) continue;

      distances[neighbor.nodeId] = candidate;
      parent[neighbor.nodeId] = current;
      if (!queue.includes(neighbor.nodeId)) queue.push(neighbor.nodeId);
      frontier.add(neighbor.nodeId);

      steps.push(
        snapshot(
          buildFrame(source, startId, endId, {
            visited: processed,
            frontier,
            current,
            activeEdges: [neighbor.edgeId],
            distances,
          }),
          baseStats(processed.size),
          `Relaxed edge ${current}-${neighbor.nodeId}. New best distance to ${neighbor.nodeId} is ${candidate}.`,
        ),
      );
    }
  }

  steps.push(
    snapshot(
      buildFrame(source, startId, endId, { visited: processed, distances }),
      baseStats(processed.size),
      `Dijkstra could not reach ${endId}. The graph is disconnected from the selected start node.`,
    ),
  );

  return steps;
}
