"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import { GraphData, GraphStats, GraphStep, PlayState } from "@/types";
import { ALGORITHM_INFO } from "@/constants/algorithms";
import {
  createRandomGraph,
  DEFAULT_GRAPH_END,
  DEFAULT_GRAPH_START,
  GRAPH_NODE_IDS,
  generateGraphBFSSteps,
  generateGraphDFSSteps,
  generateGraphDijkstraSteps,
  setGraphEndpoints,
} from "@/lib/algorithms/graph";
import { speedToDelay } from "@/lib/utils";
import ControlBar from "@/components/ui/ControlBar";
import AlgorithmInfoPanel from "@/components/layout/AlgorithmInfoPanel";
import GraphCanvas from "./GraphCanvas";

function runAlgorithm(algorithmId: string, graph: GraphData, startId: string, endId: string): GraphStep[] {
  switch (algorithmId) {
    case "graphBFS":
      return generateGraphBFSSteps(graph, startId, endId);
    case "graphDFS":
      return generateGraphDFSSteps(graph, startId, endId);
    case "graphDijkstra":
      return generateGraphDijkstraSteps(graph, startId, endId);
    default:
      return generateGraphBFSSteps(graph, startId, endId);
  }
}

const EMPTY_STATS: GraphStats = {
  visitedCount: 0,
  pathLength: 0,
  pathCost: null,
};

export default function GraphVisualizer({ algorithmId }: { algorithmId: string }) {
  const info = ALGORITHM_INFO[algorithmId];

  const [startId, setStartId] = useState(DEFAULT_GRAPH_START);
  const [endId, setEndId] = useState(DEFAULT_GRAPH_END);
  const [graph, setGraph] = useState<GraphData>(() => createRandomGraph(DEFAULT_GRAPH_START, DEFAULT_GRAPH_END));
  const [steps, setSteps] = useState<GraphStep[]>([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [speed, setSpeed] = useState(65);
  const [stats, setStats] = useState<GraphStats>(EMPTY_STATS);
  const [currentDesc, setCurrentDesc] = useState("");

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepsRef = useRef<GraphStep[]>([]);
  const stepIndexRef = useRef(-1);
  const startRef = useRef(startId);
  const endRef = useRef(endId);

  useEffect(() => {
    startRef.current = startId;
  }, [startId]);

  useEffect(() => {
    endRef.current = endId;
  }, [endId]);

  useEffect(() => {
    handleReset();
  }, [algorithmId]); // eslint-disable-line

  function clearPlaybackState() {
    clearInterval(intervalRef.current!);
    setPlayState("idle");
    setSteps([]);
    setStepIndex(-1);
    stepsRef.current = [];
    stepIndexRef.current = -1;
    setStats(EMPTY_STATS);
    setCurrentDesc("");
  }

  function handleReset() {
    clearPlaybackState();
    setGraph((prev) => setGraphEndpoints(prev, startRef.current, endRef.current));
  }

  function handleRandomize() {
    clearPlaybackState();
    setGraph(createRandomGraph(startRef.current, endRef.current));
  }

  function handleEndpointChange(kind: "start" | "end", value: string) {
    clearPlaybackState();

    const nextStart = kind === "start" ? value : startRef.current;
    const nextEnd = kind === "end" ? value : endRef.current;

    setStartId(nextStart);
    setEndId(nextEnd);
    startRef.current = nextStart;
    endRef.current = nextEnd;
    setGraph((prev) => setGraphEndpoints(prev, nextStart, nextEnd));
  }

  function prepareSteps(): GraphStep[] {
    const nextSteps = runAlgorithm(
      algorithmId,
      setGraphEndpoints(graph, startRef.current, endRef.current),
      startRef.current,
      endRef.current,
    );
    stepsRef.current = nextSteps;
    setSteps(nextSteps);
    return nextSteps;
  }

  const advance = useCallback(() => {
    const next = stepIndexRef.current + 1;
    if (next >= stepsRef.current.length) {
      setPlayState("finished");
      clearInterval(intervalRef.current!);
      return;
    }

    stepIndexRef.current = next;
    setStepIndex(next);
    const step = stepsRef.current[next];
    setGraph(step.graph);
    setStats(step.stats);
    setCurrentDesc(step.description);
  }, []);

  function handlePlay() {
    let nextSteps = steps;
    if (!nextSteps.length) {
      nextSteps = prepareSteps();
      stepIndexRef.current = -1;
    }
    if (!nextSteps.length) return;

    setPlayState("playing");
    intervalRef.current = setInterval(advance, speedToDelay(speed));
  }

  function handlePause() {
    clearInterval(intervalRef.current!);
    setPlayState("paused");
  }

  function handleStep() {
    let nextSteps = steps;
    if (!nextSteps.length) {
      nextSteps = prepareSteps();
      stepIndexRef.current = -1;
    }

    const next = stepIndexRef.current + 1;
    if (next >= nextSteps.length) return;

    stepIndexRef.current = next;
    setStepIndex(next);
    const step = nextSteps[next];
    setGraph(step.graph);
    setStats(step.stats);
    setCurrentDesc(step.description);
    setPlayState(next === nextSteps.length - 1 ? "finished" : "paused");
  }

  useEffect(() => {
    if (playState === "playing") {
      clearInterval(intervalRef.current!);
      intervalRef.current = setInterval(advance, speedToDelay(speed));
    }
  }, [speed]); // eslint-disable-line

  useEffect(() => () => clearInterval(intervalRef.current!), []);

  const progress = steps.length > 0 ? Math.round(((stepIndex + 1) / steps.length) * 100) : 0;

  return (
    <div className="flex h-full min-h-0 overflow-hidden flex-col lg:flex-row">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div
          className="flex items-center justify-between px-6 h-12 shrink-0"
          style={{ borderBottom: "1px solid var(--surface-4)", background: "var(--bg-secondary)" }}
        >
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-text-primary text-sm tracking-tight">{info.name}</h1>
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded-md"
              style={{ background: "rgba(249,115,22,0.08)", color: "#F97316", border: "1px solid rgba(249,115,22,0.18)" }}
            >
              Graphs
            </span>
          </div>

          <div className="flex items-center gap-5 mr-2">
            <div className="text-center">
              <span className="text-xs font-display font-bold" style={{ color: "#F97316" }}>{stats.visitedCount}</span>
              <span className="text-[10px] text-text-muted ml-1.5">visited</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-display font-bold" style={{ color: "#34D399" }}>{stats.pathLength || "0"}</span>
              <span className="text-[10px] text-text-muted ml-1.5">path</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-display font-bold" style={{ color: "#22D3EE" }}>
                {stats.pathCost === null ? "--" : stats.pathCost}
              </span>
              <span className="text-[10px] text-text-muted ml-1.5">cost</span>
            </div>
            <div className="flex items-center gap-2">
              {steps.length > 0 && (
                <span className="text-[11px] font-mono text-text-muted tabular-nums">
                  {stepIndex + 1} / {steps.length}
                </span>
              )}
              <div className="w-24 h-0.5 rounded-full overflow-hidden" style={{ background: "var(--surface-5)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "#F97316" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.08 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-3 px-4 sm:px-6 min-h-11 py-2 shrink-0 flex-wrap"
          style={{ borderBottom: "1px solid var(--surface-3)", background: "var(--bg-primary)" }}
        >
          <ControlBar
            playState={playState}
            speed={speed}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            onStep={handleStep}
            onSpeedChange={setSpeed}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-text-muted">Start</span>
              <select
                value={startId}
                onChange={(e) => handleEndpointChange("start", e.target.value)}
                disabled={playState === "playing"}
                className="h-7 px-2 rounded-md text-[11px] font-mono text-text-secondary outline-none disabled:opacity-40"
                style={{ background: "var(--surface-2)", border: "1px solid var(--surface-5)" }}
              >
                {GRAPH_NODE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-text-muted">End</span>
              <select
                value={endId}
                onChange={(e) => handleEndpointChange("end", e.target.value)}
                disabled={playState === "playing"}
                className="h-7 px-2 rounded-md text-[11px] font-mono text-text-secondary outline-none disabled:opacity-40"
                style={{ background: "var(--surface-2)", border: "1px solid var(--surface-5)" }}
              >
                {GRAPH_NODE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRandomize}
              disabled={playState === "playing"}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border-default)" }}
            >
              <Shuffle className="w-3 h-3" /> Randomize
            </button>
          </ControlBar>
        </div>

        <div
          className="flex items-center gap-5 px-6 h-8 shrink-0 flex-wrap"
          style={{ borderBottom: "1px solid var(--surface-3)", background: "var(--bg-primary)" }}
        >
          {[
            { color: "#34D399", label: "Start" },
            { color: "#F87171", label: "End" },
            { color: "#22D3EE", label: "Frontier" },
            { color: "#A78BFA", label: "Visited" },
            { color: "#FBBF24", label: "Current" },
            { color: "#34D399", label: "Path" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[10px] font-mono text-text-muted">{item.label}</span>
            </div>
          ))}
          {algorithmId === "graphDijkstra" && (
            <span className="text-[10px] font-mono text-text-muted">Distance labels stay visible above each node.</span>
          )}
        </div>

        <div className="flex-1 p-6 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
          <GraphCanvas graph={graph} showDistances={algorithmId === "graphDijkstra"} />
        </div>
      </div>

      <aside
        className="w-full lg:w-80 overflow-y-auto shrink-0 p-4 max-h-[42vh] lg:max-h-none border-t lg:border-t-0 lg:border-l"
        style={{ borderColor: "var(--surface-4)", background: "var(--bg-secondary)" }}
      >
        <AlgorithmInfoPanel algorithmId={algorithmId} currentStep={currentDesc} />
      </aside>
    </div>
  );
}
