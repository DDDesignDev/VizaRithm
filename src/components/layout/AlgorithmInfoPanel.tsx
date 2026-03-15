"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, HardDrive, BookOpen, Tag, Code2 } from "lucide-react";
import {
  ALGORITHM_INFO,
  ALGORITHM_CODE_SNIPPETS,
  CODE_LANGUAGE_LABELS,
  CODE_LANGUAGE_ORDER,
} from "@/constants/algorithms";
import { CodeLanguage } from "@/types";

interface AlgorithmInfoPanelProps {
  algorithmId: string;
  currentStep?: string;
}

const ROW = "flex items-center justify-between py-2";
const LABEL = "text-xs text-text-muted";
const VALUE = "text-xs font-mono";

export default function AlgorithmInfoPanel({ algorithmId, currentStep }: AlgorithmInfoPanelProps) {
  const info = ALGORITHM_INFO[algorithmId];
  const snippets = ALGORITHM_CODE_SNIPPETS[algorithmId] ?? {};

  const availableLanguages = useMemo(
    () => CODE_LANGUAGE_ORDER.filter((language) => snippets[language]),
    [snippets],
  );

  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>("javascript");

  useEffect(() => {
    if (!availableLanguages.length) return;
    if (!snippets[selectedLanguage]) {
      setSelectedLanguage(availableLanguages[0]);
    }
  }, [algorithmId, availableLanguages, selectedLanguage, snippets]);

  if (!info) return null;

  const selectedCode =
    snippets[selectedLanguage] ??
    (availableLanguages.length ? snippets[availableLanguages[0]] : undefined);

  return (
    <div className="space-y-3">
      {/* ── Live step log ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {currentStep ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl p-3.5"
            style={{
              background: "rgba(34,211,238,0.05)",
              border: "1px solid rgba(34,211,238,0.14)",
            }}
          >
            <p className="text-[11px] font-mono leading-relaxed" style={{ color: "#22D3EE" }}>
              {currentStep}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-3.5"
            style={{ background: "var(--surface-1)", border: "1px solid var(--surface-4)" }}
          >
            <p className="text-[11px] font-mono text-text-muted">
              Press <span className="text-text-secondary">Run</span> or{" "}
              <span className="text-text-secondary">Step</span> to begin
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Algorithm name + category ─────────────────────────────── */}
      <Section>
        <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-1">
          {info.category}
        </p>
        <h2 className="font-display font-bold text-text-primary leading-tight" style={{ fontSize: "1rem", letterSpacing: "-0.01em" }}>
          {info.name}
        </h2>
      </Section>

      {/* ── Description ───────────────────────────────────────────── */}
      <Section icon={BookOpen} label="Overview">
        <p className="text-xs text-text-secondary leading-[1.65]">{info.description}</p>
      </Section>

      {/* ── Complexity table ──────────────────────────────────────── */}
      <Section icon={Clock} label="Complexity">
        <div style={{ borderTop: "1px solid var(--surface-4)" }}>
          {[
            { key: "Best case",    val: info.timeComplexity.best,    color: "#34D399" },
            { key: "Average",      val: info.timeComplexity.average, color: "#FBBF24" },
            { key: "Worst case",   val: info.timeComplexity.worst,   color: "#F87171" },
          ].map((row) => (
            <div
              key={row.key}
              className={ROW}
              style={{ borderBottom: "1px solid var(--surface-3)" }}
            >
              <span className={LABEL}>{row.key}</span>
              <span className={VALUE} style={{ color: row.color }}>{row.val}</span>
            </div>
          ))}
          <div className={ROW} style={{ borderBottom: "1px solid var(--surface-3)" }}>
            <span className={LABEL + " flex items-center gap-1"}>
              <HardDrive className="w-3 h-3" /> Space
            </span>
            <span className={VALUE} style={{ color: "#A78BFA" }}>{info.spaceComplexity}</span>
          </div>
          {info.stable !== undefined && (
            <div className={ROW}>
              <span className={LABEL}>Stable sort</span>
              <span
                className={VALUE}
                style={{ color: info.stable ? "#34D399" : "#F87171" }}
              >
                {info.stable ? "Yes" : "No"}
              </span>
            </div>
          )}
        </div>
      </Section>

      {/* ── Use cases ─────────────────────────────────────────────── */}
      <Section icon={Tag} label="Best used for">
        <ul className="space-y-1.5 mt-0.5">
          {info.useCases.map((uc) => (
            <li key={uc} className="flex items-start gap-2">
              <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ background: "#34D399", opacity: 0.7 }} />
              <span className="text-xs text-text-secondary leading-relaxed">{uc}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Code viewer ────────────────────────────────────────────── */}
      <Section icon={Code2} label="Implementation">
        {availableLanguages.length > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Language</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as CodeLanguage)}
                className="h-7 px-2 rounded-md text-[11px] font-mono text-text-secondary outline-none"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--surface-5)",
                }}
              >
                {availableLanguages.map((language) => (
                  <option key={language} value={language}>
                    {CODE_LANGUAGE_LABELS[language]}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="rounded-lg p-2.5 overflow-auto"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--surface-4)" }}
            >
              <pre className="text-[11px] text-text-secondary font-mono whitespace-pre min-w-max">
                {selectedCode}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted">Code example coming soon.</p>
        )}
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ElementType;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--surface-1)", border: "1px solid var(--surface-4)" }}
    >
      {label && (
        <div className="flex items-center gap-1.5 mb-3">
          {Icon && <Icon className="w-3.5 h-3.5 text-text-muted" />}
          <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
            {label}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
