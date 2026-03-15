import { Cell, Grid, PathfindingStep } from "@/types";

// ── Grid Helpers ──────────────────────────────────────────────────────────────

export function createGrid(rows: number, cols: number, startRow: number, startCol: number, endRow: number, endCol: number): Grid {
  const grid: Grid = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        type: "empty",
        distance: Infinity,
        fScore: Infinity,
        gScore: Infinity,
        hScore: Infinity,
        parent: null,
        weight: 1,
      });
    }
    grid.push(row);
  }
  grid[startRow][startCol].type = "start";
  grid[endRow][endCol].type = "end";
  return grid;
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

function getNeighbors(grid: Grid, cell: Cell): Cell[] {
  const { row, col } = cell;
  const neighbors: Cell[] = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
      neighbors.push(grid[nr][nc]);
    }
  }
  return neighbors;
}

function heuristic(a: Cell, b: Cell): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function reconstructPath(grid: Grid, end: Cell): { row: number; col: number }[] {
  const path: { row: number; col: number }[] = [];
  let current: Cell | null = end;
  while (current && current.parent) {
    path.unshift({ row: current.row, col: current.col });
    current = grid[current.parent.row][current.parent.col];
  }
  return path;
}

function makeStats(visitedCount: number, pathLength: number): PathfindingStep["stats"] {
  return { visitedCount, pathLength, elapsed: 0 };
}

// ── BFS ───────────────────────────────────────────────────────────────────────
export function generateBFSSteps(initialGrid: Grid, startRow: number, startCol: number, endRow: number, endCol: number): PathfindingStep[] {
  const steps: PathfindingStep[] = [];
  const grid = cloneGrid(initialGrid);
  const queue: Cell[] = [grid[startRow][startCol]];
  const visited = new Set<string>();
  visited.add(`${startRow},${startCol}`);
  let visitedCount = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.row === endRow && current.col === endCol) {
      // Reconstruct path
      const path = reconstructPath(grid, current);
      const g = cloneGrid(grid);
      path.forEach(({ row, col }) => {
        if (g[row][col].type !== "start" && g[row][col].type !== "end")
          g[row][col].type = "path";
      });
      steps.push({ grid: g, stats: makeStats(visitedCount, path.length), description: `Found the end! Path length: ${path.length} cells` });
      return steps;
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const key = `${neighbor.row},${neighbor.col}`;
      if (!visited.has(key) && neighbor.type !== "wall") {
        visited.add(key);
        neighbor.parent = { row: current.row, col: current.col };
        queue.push(neighbor);
        if (neighbor.type !== "end") {
          neighbor.type = "frontier";
        }
      }
    }

    if (current.type !== "start" && current.type !== "end") {
      current.type = "visited";
      visitedCount++;
      steps.push({ grid: cloneGrid(grid), stats: makeStats(visitedCount, 0), description: `Visiting (${current.row}, ${current.col}) — queue size: ${queue.length}` });
    }
  }

  steps.push({ grid: cloneGrid(grid), stats: makeStats(visitedCount, 0), description: "No path found — destination is unreachable" });
  return steps;
}

// ── DFS ───────────────────────────────────────────────────────────────────────
export function generateDFSSteps(initialGrid: Grid, startRow: number, startCol: number, endRow: number, endCol: number): PathfindingStep[] {
  const steps: PathfindingStep[] = [];
  const grid = cloneGrid(initialGrid);
  const stack: Cell[] = [grid[startRow][startCol]];
  const visited = new Set<string>();
  let visitedCount = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current.row},${current.col}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (current.row === endRow && current.col === endCol) {
      const path = reconstructPath(grid, current);
      const g = cloneGrid(grid);
      path.forEach(({ row, col }) => {
        if (g[row][col].type !== "start" && g[row][col].type !== "end")
          g[row][col].type = "path";
      });
      steps.push({ grid: g, stats: makeStats(visitedCount, path.length), description: `Found the end! Path length: ${path.length} cells` });
      return steps;
    }

    if (current.type !== "start") {
      current.type = "visited";
      visitedCount++;
      steps.push({ grid: cloneGrid(grid), stats: makeStats(visitedCount, 0), description: `DFS exploring (${current.row}, ${current.col}) — stack depth: ${stack.length}` });
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const nkey = `${neighbor.row},${neighbor.col}`;
      if (!visited.has(nkey) && neighbor.type !== "wall") {
        neighbor.parent = { row: current.row, col: current.col };
        stack.push(neighbor);
        if (neighbor.type !== "end") neighbor.type = "frontier";
      }
    }
  }

  steps.push({ grid: cloneGrid(grid), stats: makeStats(visitedCount, 0), description: "No path found — destination is unreachable" });
  return steps;
}

// ── Dijkstra ──────────────────────────────────────────────────────────────────
export function generateDijkstraSteps(initialGrid: Grid, startRow: number, startCol: number, endRow: number, endCol: number): PathfindingStep[] {
  const steps: PathfindingStep[] = [];
  const grid = cloneGrid(initialGrid);
  grid[startRow][startCol].distance = 0;

  const unvisited: Cell[] = [];
  for (const row of grid) for (const cell of row) unvisited.push(cell);

  const visited = new Set<string>();
  let visitedCount = 0;

  while (unvisited.length > 0) {
    unvisited.sort((a, b) => a.distance - b.distance);
    const current = unvisited.find((c) => !visited.has(`${c.row},${c.col}`));
    if (!current || current.distance === Infinity) break;

    visited.add(`${current.row},${current.col}`);

    if (current.row === endRow && current.col === endCol) {
      const path = reconstructPath(grid, current);
      const g = cloneGrid(grid);
      path.forEach(({ row, col }) => {
        if (g[row][col].type !== "start" && g[row][col].type !== "end")
          g[row][col].type = "path";
      });
      steps.push({ grid: g, stats: makeStats(visitedCount, path.length), description: `Shortest path found! Distance: ${current.distance}, Path: ${path.length} cells` });
      return steps;
    }

    for (const neighbor of getNeighbors(grid, current)) {
      if (neighbor.type === "wall" || visited.has(`${neighbor.row},${neighbor.col}`)) continue;
      const newDist = current.distance + neighbor.weight;
      if (newDist < neighbor.distance) {
        neighbor.distance = newDist;
        neighbor.parent = { row: current.row, col: current.col };
        if (neighbor.type !== "end") neighbor.type = "frontier";
      }
    }

    if (current.type !== "start") {
      current.type = "visited";
      visitedCount++;
      steps.push({ grid: cloneGrid(grid), stats: makeStats(visitedCount, 0), description: `Processing node (${current.row}, ${current.col}) with distance ${current.distance}` });
    }
  }

  steps.push({ grid: cloneGrid(grid), stats: makeStats(visitedCount, 0), description: "No path found — destination is unreachable" });
  return steps;
}

// ── A* ────────────────────────────────────────────────────────────────────────
export function generateAStarSteps(initialGrid: Grid, startRow: number, startCol: number, endRow: number, endCol: number): PathfindingStep[] {
  const steps: PathfindingStep[] = [];
  const grid = cloneGrid(initialGrid);
  const start = grid[startRow][startCol];
  const end = grid[endRow][endCol];

  start.gScore = 0;
  start.fScore = heuristic(start, end);

  const openSet: Cell[] = [start];
  const closedSet = new Set<string>();
  let visitedCount = 0;

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.fScore - b.fScore);
    const current = openSet.shift()!;
    const key = `${current.row},${current.col}`;

    if (current.row === endRow && current.col === endCol) {
      const path = reconstructPath(grid, current);
      const g = cloneGrid(grid);
      path.forEach(({ row, col }) => {
        if (g[row][col].type !== "start" && g[row][col].type !== "end")
          g[row][col].type = "path";
      });
      steps.push({ grid: g, stats: makeStats(visitedCount, path.length), description: `A* found optimal path! f=${current.fScore.toFixed(0)}, path length: ${path.length}` });
      return steps;
    }

    closedSet.add(key);

    for (const neighbor of getNeighbors(grid, current)) {
      if (neighbor.type === "wall" || closedSet.has(`${neighbor.row},${neighbor.col}`)) continue;
      const tentativeG = current.gScore + neighbor.weight;

      if (tentativeG < neighbor.gScore) {
        neighbor.parent = { row: current.row, col: current.col };
        neighbor.gScore = tentativeG;
        neighbor.hScore = heuristic(neighbor, end);
        neighbor.fScore = neighbor.gScore + neighbor.hScore;

        if (!openSet.find((c) => c.row === neighbor.row && c.col === neighbor.col)) {
          openSet.push(neighbor);
          if (neighbor.type !== "end") neighbor.type = "frontier";
        }
      }
    }

    if (current.type !== "start") {
      current.type = "visited";
      visitedCount++;
      steps.push({ grid: cloneGrid(grid), stats: makeStats(visitedCount, 0), description: `A* exploring (${current.row}, ${current.col}): g=${current.gScore.toFixed(0)}, h=${current.hScore.toFixed(0)}, f=${current.fScore.toFixed(0)}` });
    }
  }

  steps.push({ grid: cloneGrid(grid), stats: makeStats(visitedCount, 0), description: "No path found — destination is unreachable" });
  return steps;
}
