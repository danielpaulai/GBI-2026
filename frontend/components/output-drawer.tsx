/**
 * OutputDrawer — right-side slide-out (480px) showing the actual output
 * for the selected category or agent.
 *
 * Per UX_RESTRUCTURE_GUIDELINES.md: outputs ONLY appear in this drawer.
 * The agent canvas (middle column) never shows the output text — it shows
 * the agent working, the judge score, and a "View output" CTA.
 *
 * In the production stack this becomes a Framer Motion drawer with
 * focus-trap + ESC-to-close. For the prototype, plain CSS animation.
 */

"use client";

import { useEffect } from "react";
import { OctagonFrame } from "./octagon-frame";

export type OutputItem = {
  id: string;
  channel: string;
  title: string;
  status: "draft" | "approved" | "scheduled" | "published";
  judgeScore: number;
  iteration: number;
  body: string;
  meta?: string;
  imageVariant?: "AnnouncementCard" | "QuoteCard" | "StatCard" | "FrameworkCard";
};

type Props = {
  open: boolean;
  onClose: () => void;
  category: string | null;
  items: OutputItem[];
};

export function OutputDrawer({ open, onClose, category, items }: Props) {
  // Close on ESC.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        className="pp-drawer-enter pp-scroll fixed right-0 top-0 z-[210] flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-[var(--pp-border)] bg-[var(--pp-bg-elevated)]/95 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-label={`${category ?? "Outputs"} drawer`}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--pp-border)] bg-[var(--pp-bg-elevated)]/90 px-5 py-4 backdrop-blur-md">
          <div>
            <p className="pp-ambient-text">{category ?? "Outputs"}</p>
            <h2 className="font-display text-lg font-semibold text-[var(--pp-text)]">
              {items.length} item{items.length === 1 ? "" : "s"} ready for review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pp-interactive rounded-sm border border-white/10 p-1.5 text-[var(--pp-text-muted)] hover:text-[var(--pp-text)]"
            aria-label="Close drawer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
            >
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </header>

        {/* Items */}
        <div className="pp-token-stream flex flex-col gap-4 p-5">
          {items.map((item) => (
            <OctagonFrame
              key={item.id}
              chamfer={10}
              stroke="rgba(236, 67, 87, 0.25)"
              fill="rgba(40, 12, 16, 0.65)"
              cornered
            >
              <article className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="pp-ambient-text">{item.channel}</p>
                    <h3 className="mt-1 font-display text-base font-semibold leading-tight text-[var(--pp-text)]">
                      {item.title}
                    </h3>
                  </div>
                  <ScoreBadge score={item.judgeScore} iteration={item.iteration} />
                </div>

                {/* Image preview placeholder for cards */}
                {item.imageVariant ? (
                  <CardPreview variant={item.imageVariant} title={item.title} />
                ) : null}

                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--pp-text-muted)]">
                  {item.body}
                </p>

                <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                  <span className="pp-ambient-text">
                    {item.status.toUpperCase()} · iter {item.iteration} · {item.meta ?? "judge:haiku-4.5"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="pp-interactive rounded-sm border border-white/10 px-2.5 py-1 text-[var(--pp-text-muted)] hover:text-[var(--pp-text)]"
                    >
                      Revise
                    </button>
                    <button
                      type="button"
                      className="pp-interactive rounded-sm border border-[var(--pp-primary)]/50 bg-[var(--pp-primary)]/10 px-2.5 py-1 font-semibold text-[var(--pp-primary)] hover:bg-[var(--pp-primary)]/20"
                      style={{
                        boxShadow:
                          "0 0 8px rgba(236,67,87,0.4), 0 0 24px rgba(236,67,87,0.2)",
                      }}
                    >
                      Approve & ship
                    </button>
                  </div>
                </div>
              </article>
            </OctagonFrame>
          ))}
        </div>
      </aside>
    </>
  );
}

function ScoreBadge({ score, iteration }: { score: number; iteration: number }) {
  const pass = score >= 8.5;
  return (
    <div
      className="flex shrink-0 flex-col items-end rounded-sm border px-2 py-1 text-right tabular-nums"
      style={{
        borderColor: pass ? "rgba(52,211,153,0.45)" : "rgba(251,191,36,0.45)",
        background: pass ? "rgba(52,211,153,0.08)" : "rgba(251,191,36,0.08)",
      }}
      title="Cross-model judge score (Haiku 4.5)"
    >
      <span
        className="font-display text-base font-bold"
        style={{ color: pass ? "#34d399" : "#fbbf24" }}
      >
        {score.toFixed(1)}
      </span>
      <span className="pp-ambient-text">iter {iteration}</span>
    </div>
  );
}

/**
 * CardPreview — tiny inline preview matching the Satori card variants in
 * cursor-package/jarvis-code/post-card-route.tsx.
 *
 * Once the developer wires Satori, replace this with a real <img> pointing
 * at /api/og/post-card/[variant].
 */
function CardPreview({
  variant,
  title,
}: {
  variant: NonNullable<OutputItem["imageVariant"]>;
  title: string;
}) {
  const styles: Record<typeof variant, { bg: string; accent: string }> = {
    AnnouncementCard: {
      bg: "linear-gradient(135deg, #150608 0%, #2a0a10 100%)",
      accent: "#ec4357",
    },
    QuoteCard: {
      bg: "linear-gradient(135deg, #0a0204 0%, #150608 100%)",
      accent: "#fbbf24",
    },
    StatCard: {
      bg: "linear-gradient(135deg, #0a0204 0%, #1a0a14 100%)",
      accent: "#00d4ff",
    },
    FrameworkCard: {
      bg: "linear-gradient(135deg, #150608 0%, #0a0204 100%)",
      accent: "#ec4357",
    },
  };
  const style = styles[variant];

  return (
    <div
      className="relative aspect-[1200/627] w-full overflow-hidden rounded-sm border border-white/10"
      style={{ background: style.bg }}
    >
      <span
        aria-hidden
        className="absolute left-3 top-3 h-[2px] w-12"
        style={{
          background: style.accent,
          boxShadow: `0 0 8px ${style.accent}, 0 0 16px ${style.accent}80`,
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <p className="pp-ambient-text" style={{ color: `${style.accent}cc` }}>
          {variant.replace("Card", " · Satori")}
        </p>
        <p className="mt-1 font-display text-sm font-semibold leading-tight text-white">
          {title}
        </p>
      </div>
    </div>
  );
}
