import { SearchBar, SearchStep } from "@/types";

function snapshot(bars: SearchBar[], description: string, found: boolean, foundIndex: number | null, extra?: Partial<SearchStep>): SearchStep {
  return {
    bars: bars.map((b) => ({ ...b })),
    description,
    found,
    foundIndex,
    ...extra,
  };
}

// ── Linear Search ─────────────────────────────────────────────────────────────
export function generateLinearSearchSteps(initial: SearchBar[], target: number): SearchStep[] {
  const bars = initial.map((b) => ({ ...b }));
  const steps: SearchStep[] = [];

  steps.push(snapshot(bars, `Starting linear search for target: ${target}`, false, null));

  for (let i = 0; i < bars.length; i++) {
    bars[i].state = "active";
    steps.push(snapshot(bars, `Checking index ${i}: is ${bars[i].value} === ${target}?`, false, null, { mid: i }));

    if (bars[i].value === target) {
      bars[i].state = "found";
      steps.push(snapshot(bars, `🎯 Found ${target} at index ${i}!`, true, i, { mid: i }));
      return steps;
    }

    bars[i].state = "eliminated";
    steps.push(snapshot(bars, `${bars[i].value} ≠ ${target}, moving to next element`, false, null, { mid: i }));
  }

  steps.push(snapshot(bars, `Target ${target} not found in the array`, false, null));
  return steps;
}

// ── Binary Search ─────────────────────────────────────────────────────────────
export function generateBinarySearchSteps(initial: SearchBar[], target: number): SearchStep[] {
  const bars = initial.map((b) => ({ ...b }));
  const steps: SearchStep[] = [];
  let low = 0;
  let high = bars.length - 1;

  // Mark all as in range initially
  bars.forEach((b) => (b.state = "range"));
  steps.push(snapshot(bars, `Starting binary search for target: ${target} — array must be sorted`, false, null, { low, high }));

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    // Mark range
    bars.forEach((b, i) => {
      if (i < low || i > high) b.state = "eliminated";
      else if (i === mid) b.state = "active";
      else b.state = "range";
    });

    steps.push(snapshot(bars, `Search range [${low}, ${high}] — checking midpoint index ${mid} (value: ${bars[mid].value})`, false, null, { low, high, mid }));

    if (bars[mid].value === target) {
      bars[mid].state = "found";
      steps.push(snapshot(bars, `🎯 Found ${target} at index ${mid}! Binary search complete.`, true, mid, { low, high, mid }));
      return steps;
    }

    if (bars[mid].value < target) {
      steps.push(snapshot(bars, `${bars[mid].value} < ${target}, eliminating left half — new low = ${mid + 1}`, false, null, { low, high, mid }));
      for (let i = low; i <= mid; i++) bars[i].state = "eliminated";
      low = mid + 1;
    } else {
      steps.push(snapshot(bars, `${bars[mid].value} > ${target}, eliminating right half — new high = ${mid - 1}`, false, null, { low, high, mid }));
      for (let i = mid; i <= high; i++) bars[i].state = "eliminated";
      high = mid - 1;
    }
  }

  steps.push(snapshot(bars, `Target ${target} not found in the array`, false, null));
  return steps;
}
