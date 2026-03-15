import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SortBar } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate random sort bars */
export function generateRandomBars(count: number): SortBar[] {
  return Array.from({ length: count }, (_, i) => ({
    value: Math.floor(Math.random() * 90) + 10,
    state: "default" as const,
    id: i,
  }));
}

/** Generate a sorted array for searching */
export function generateSortedSearchBars(count: number): import("@/types").SearchBar[] {
  const values = Array.from({ length: count }, () => Math.floor(Math.random() * 200) + 1);
  values.sort((a, b) => a - b);
  return values.map((value, index) => ({ value, state: "default" as const, index }));
}

/** Generate an unsorted array for linear search */
export function generateUnsortedSearchBars(count: number): import("@/types").SearchBar[] {
  return Array.from({ length: count }, (_, index) => ({
    value: Math.floor(Math.random() * 200) + 1,
    state: "default" as const,
    index,
  }));
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Map speed slider (0–100) to delay in ms (high=fast=low delay) */
export function speedToDelay(speed: number): number {
  // speed 1 → 600ms, speed 100 → 10ms
  return Math.round(600 - (speed / 100) * 590);
}

/** Format a number with a + sign if positive */
export function formatComplexity(c: string): string {
  return c;
}

/** Random maze generation using recursive division */
export function generateRandomWalls(
  rows: number,
  cols: number,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): Set<string> {
  const walls = new Set<string>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === startRow && c === startCol) continue;
      if (r === endRow && c === endCol) continue;
      if (Math.random() < 0.28) {
        walls.add(`${r},${c}`);
      }
    }
  }
  return walls;
}
