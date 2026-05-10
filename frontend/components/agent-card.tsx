/**
 * AgentCard — middle column tile representing one specialist or wing.
 *
 * Visible state ONLY. The output it produces does not render here — it lands
 * in the OutputDrawer when the user clicks "View output".
 *
 * Per VISUAL_AUDIT.md three-state interaction commandment: hover, active,
 * and disabled all have distinct visual treatments.
 */

"use client";

import type { ReactNode } from "react";
import { OctagonFrame } from "./octagon-frame";

export type AgentStatus = "idle" | "thinking" | "drafting" | "judging" | "ready" | "blocked";

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Idle",
  thinking: "Planning",
  drafting: "Drafting",
  judging: "Judging draft",
  ready: "Output ready",
  blocked: "Needs input",
};

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle: "rgba(200, 200, 200, 0.5)",
  thinking: "#fbbf24",
  drafting: "#00d4ff",
  judging: "#ec4357",
  ready: "#34d399",
  blocked: "#ef4444",
};

type Specialist = {
  name: string;
  status: AgentStatus;
  /** Score from the cross-model judge (0-10). */
  judgeScore?: number;
  /** Iteration count. */
  iteration?: number;
};

type Props = {
  /** Wing label, e.g. "CMO". */
  label: string;
  /** Wing title, e.g. "Chief Marketing Officer". */
  title: string;
  /** Accent color (one of: primary, accent_cyan, accent_gold, primary_alt). */
  accent: "primary" | "accent_cyan" | "accent_gold" | "primary_alt";
  /** Currently-active specialist within the wing. */
  specialists: Specialist[];
  /** Click handler for "View output" — opens the drawer. */
  onViewOutput?: () => void;
  /** Optional ambient micro-text shown in the corner (Jayse Hansen rule). */
  microText?: string;
};

const ACCENT_HEX: Record<Props["accent"], string> = {
  primary: "#ec4357",
  primary_alt: "#d92e44",
  accent_cyan: "#00d4ff",
  accent_gold: "#fbbf24",
};

export function AgentCard({
  label,
  title,
  accent,
  specialists,
  onViewOutput,
  microText,
}: Props) {
  const accentHex = ACCENT_HEX[accent];
  const ready = specialists.some((s) => s.status === "ready");
  const working = specialists.some((s) =>
    ["thinking", "drafting", "judging"].includes(s.status),
  );

  return (
    <OctagonFrame
      stroke={`${accentHex}59`}
      accent={accentHex}
      className="pp-interactive group transition"
      style={{ minHeight: 220 }}
    >
      <div className="flex h-full flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p
              className="pp-ambient-text"
              style={{ color: `${accentHex}cc` }}
            >
              {label}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-[var(--pp-text)]">
              {title}
            </h3>
          </div>
          <StatusDot
            color={
              working
                ? STATUS_COLOR.drafting
                : ready
                  ? STATUS_COLOR.ready
                  : STATUS_COLOR.idle
            }
            pulsing={working}
          />
        </div>

        {/* Specialists list */}
        <ul role="list" className="mt-4 flex-1 space-y-2">
          {specialists.map((s) => (
            <li
              key={s.name}
              className="flex items-center gap-3 text-sm text-[var(--pp-text-muted)]"
            >
              <StatusDot
                color={STATUS_COLOR[s.status]}
                pulsing={["thinking", "drafting", "judging"].includes(s.status)}
                small
              />
              <span className="flex-1 truncate">{s.name}</span>
              <span className="pp-ambient-text">{STATUS_LABEL[s.status]}</span>
              {typeof s.judgeScore === "number" ? (
                <span
                  className="pp-ambient-text rounded-sm border px-1.5 py-0.5 tabular-nums"
                  style={{
                    color: s.judgeScore >= 8.5 ? "#34d399" : "#fbbf24",
                    borderColor:
                      s.judgeScore >= 8.5
                        ? "rgba(52,211,153,0.4)"
                        : "rgba(251,191,36,0.4)",
                  }}
                  title={`Cross-model judge score · iter ${s.iteration ?? 1}`}
                >
                  {s.judgeScore.toFixed(1)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
          <span className="pp-ambient-text">{microText ?? "READY"}</span>
          <button
            type="button"
            onClick={onViewOutput}
            disabled={!ready}
            className={`rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              ready
                ? "border-[var(--pp-primary)]/50 bg-[var(--pp-primary)]/10 text-[var(--pp-primary)] hover:bg-[var(--pp-primary)]/20"
                : "border-white/10 text-[var(--pp-text-muted)]/50"
            }`}
            style={{
              boxShadow: ready
                ? "0 0 8px rgba(236,67,87,0.4), 0 0 24px rgba(236,67,87,0.2)"
                : undefined,
            }}
          >
            {ready ? "View output" : working ? "Working…" : "Awaiting brief"}
          </button>
        </div>
      </div>
    </OctagonFrame>
  );
}

function StatusDot({
  color,
  pulsing,
  small,
}: {
  color: string;
  pulsing?: boolean;
  small?: boolean;
}): ReactNode {
  const size = small ? "h-1.5 w-1.5" : "h-2 w-2";
  return (
    <span
      className={`inline-block ${size} rounded-full ${pulsing ? "pp-status-active" : ""}`}
      style={{
        background: color,
        boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
      }}
      aria-hidden
    />
  );
}
