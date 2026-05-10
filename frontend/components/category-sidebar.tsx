/**
 * CategorySidebar — left rail (240px) with the 8 output buckets.
 *
 * Per UX_RESTRUCTURE_GUIDELINES.md: outputs are NOT visible alongside the
 * agents. The user picks a category here, sees a count, and clicks to open
 * that channel's output drawer. Agents render in the middle column;
 * outputs only appear when explicitly requested.
 */

"use client";

import type { ReactNode } from "react";

type Category = {
  id: string;
  label: string;
  icon: string;
  count: number;
  recent?: string;
};

const ICONS: Record<string, ReactNode> = {
  share: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8 11l8-4M8 13l8 4" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h6" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M21 17l-5-5-9 9" />
    </svg>
  ),
  film: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M3 15h18M8 5v14M16 5v14" />
    </svg>
  ),
  layout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 11h18M9 11v8" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 11h6M9 15h6" />
    </svg>
  ),
};

type Props = {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export function CategorySidebar({ categories, activeId, onSelect }: Props) {
  return (
    <aside
      className="flex h-full w-[240px] shrink-0 flex-col border-r border-[var(--pp-border)] bg-[var(--pp-bg-elevated)]/50 backdrop-blur-md"
      aria-label="Output categories"
    >
      <div className="border-b border-[var(--pp-border)] px-4 py-4">
        <p className="pp-ambient-text">Output channels</p>
        <p className="mt-1 font-display text-[15px] font-semibold text-[var(--pp-text)]">
          Where work ships
        </p>
      </div>

      <nav className="pp-scroll flex-1 overflow-y-auto py-2" aria-label="Categories">
        <ul role="list">
          {categories.map((cat) => {
            const active = cat.id === activeId;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => onSelect(cat.id)}
                  className={`pp-interactive group relative flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? "bg-[var(--pp-primary)]/10 text-[var(--pp-text)]"
                      : "text-[var(--pp-text-muted)] hover:bg-white/[0.03] hover:text-[var(--pp-text)]"
                  }`}
                  aria-current={active ? "true" : undefined}
                >
                  {/* Active rail */}
                  <span
                    aria-hidden
                    className={`absolute left-0 h-6 w-[2px] rounded-r ${
                      active ? "bg-[var(--pp-primary)]" : "bg-transparent"
                    }`}
                    style={{
                      boxShadow: active
                        ? "0 0 8px rgba(236,67,87,0.6), 0 0 24px rgba(236,67,87,0.35)"
                        : undefined,
                    }}
                  />
                  <span
                    className={
                      active ? "text-[var(--pp-primary)]" : "text-[var(--pp-text-muted)]"
                    }
                  >
                    {ICONS[cat.icon]}
                  </span>
                  <span className="flex-1">{cat.label}</span>
                  <span
                    className={`pp-ambient-text rounded-full border px-1.5 py-0.5 text-[10px] tabular-nums ${
                      active
                        ? "border-[var(--pp-primary)]/40 text-[var(--pp-primary)]"
                        : "border-white/10 text-[var(--pp-text-muted)]"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
                {active && cat.recent ? (
                  <p className="px-4 pb-3 text-[11px] text-[var(--pp-text-muted)]/70">
                    Last: {cat.recent}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--pp-border)] px-4 py-3">
        <p className="pp-ambient-text">System</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--pp-text-muted)]">
          <span
            className="pp-status-active inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
            aria-hidden
          />
          All wings online
        </div>
      </div>
    </aside>
  );
}

export type { Category };
