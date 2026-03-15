// ─── Shared ───────────────────────────────────────────────────────────────────

export type AlgorithmCategory = "sorting" | "pathfinding" | "searching";

export type PlayState = "idle" | "playing" | "paused" | "finished";

export interface AlgorithmInfo {
  id: string;
  name: string;
  category: AlgorithmCategory;
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: string;
  description: string;
  useCases: string[];
  stable?: boolean;
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

export type SortBarState =
  | "default"
  | "comparing"
  | "swapping"
  | "sorted"
  | "pivot"
  | "selected";

export interface SortBar {
  value: number;
  state: SortBarState;
  id: number; // stable key for framer-motion
}

export interface SortStep {
  bars: SortBar[];
  description: string;
}

// ─── Pathfinding ──────────────────────────────────────────────────────────────

export type CellType =
  | "empty"
  | "wall"
  | "start"
  | "end"
  | "visited"
  | "path"
  | "frontier";

export interface Cell {
  row: number;
  col: number;
  type: CellType;
  distance: number;
  fScore: number;
  gScore: number;
  hScore: number;
  parent: { row: number; col: number } | null;
  weight: number;
}

export type Grid = Cell[][];

export interface PathfindingStats {
  visitedCount: number;
  pathLength: number;
  elapsed: number;
}

export interface PathfindingStep {
  grid: Grid;
  stats: PathfindingStats;
  description: string;
}

// ─── Searching ────────────────────────────────────────────────────────────────

export type SearchBarState =
  | "default"
  | "active"
  | "found"
  | "eliminated"
  | "range";

export interface SearchBar {
  value: number;
  state: SearchBarState;
  index: number;
}

export interface SearchStep {
  bars: SearchBar[];
  low?: number;
  high?: number;
  mid?: number;
  description: string;
  found: boolean;
  foundIndex: number | null;
}
