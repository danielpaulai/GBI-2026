/**
 * /jarvis — Command Center prototype.
 *
 * This is a STATIC visual prototype. Mock data is hard-coded so the developer
 * can see the layout, motion, and visual bar without any backend.
 *
 * Read these BEFORE editing this file:
 *   - VISUAL_AUDIT.md (the 14 commandments)
 *   - UX_RESTRUCTURE_GUIDELINES.md (the 3-column structure)
 *   - data/brand.json (the canonical Purely Personal palette + voice)
 *
 * What the developer must replace:
 *   - This client-side mock data → real LangGraph state via SSE/WebSocket
 *   - CSS-only orb → react-three-fiber sphere
 *   - <OctagonFrame> SVG stub → @arwes/react <Frame />
 *   - Plain CSS slide-in → Framer Motion AnimatePresence with focus trap
 *   - Placeholder card preview → /api/og/post-card/[variant]/route.tsx (Satori)
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { CategorySidebar, type Category } from "@/components/category-sidebar";
import { AgentCard, type AgentStatus } from "@/components/agent-card";
import { OutputDrawer, type OutputItem } from "@/components/output-drawer";
import { CEOOrb } from "@/components/ceo-orb";
import { OctagonFrame } from "@/components/octagon-frame";

// ─── mock data ─────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: "social", label: "Social Media", icon: "share", count: 4, recent: "LinkedIn · 2 min ago" },
  { id: "email", label: "Email Campaigns", icon: "mail", count: 2, recent: "Newsletter · 8 min ago" },
  { id: "longform", label: "Long-form", icon: "doc", count: 1 },
  { id: "images", label: "Images & Cards", icon: "image", count: 3 },
  { id: "video", label: "Video & Reels", icon: "film", count: 0 },
  { id: "pages", label: "Pages & Funnels", icon: "layout", count: 1 },
  { id: "outreach", label: "Outreach", icon: "send", count: 6 },
  { id: "forms", label: "Forms & Capture", icon: "clipboard", count: 0 },
];

const WINGS = [
  {
    id: "cmo",
    label: "CMO",
    title: "Chief Marketing Officer",
    accent: "primary" as const,
    microText: "WING · 01",
    specialists: [
      { name: "LinkedIn writer", status: "ready" as AgentStatus, judgeScore: 9.1, iteration: 2 },
      { name: "Newsletter writer", status: "judging" as AgentStatus, iteration: 1 },
      { name: "Image director (Satori)", status: "ready" as AgentStatus, judgeScore: 8.7, iteration: 1 },
      { name: "Outlier detector", status: "idle" as AgentStatus },
    ],
  },
  {
    id: "cro",
    label: "CRO",
    title: "Chief Revenue Officer",
    accent: "accent_cyan" as const,
    microText: "WING · 02",
    specialists: [
      { name: "Outreach drafter", status: "drafting" as AgentStatus, iteration: 1 },
      { name: "Pipeline analyst", status: "thinking" as AgentStatus },
      { name: "Call brief generator", status: "idle" as AgentStatus },
    ],
  },
  {
    id: "coo",
    label: "COO",
    title: "Chief Operating Officer",
    accent: "accent_gold" as const,
    microText: "WING · 03",
    specialists: [
      { name: "Task router", status: "idle" as AgentStatus },
      { name: "SOP author", status: "idle" as AgentStatus },
      { name: "Calendar guard", status: "ready" as AgentStatus, judgeScore: 8.9, iteration: 1 },
    ],
  },
  {
    id: "cfo",
    label: "CFO",
    title: "Chief Financial Officer",
    accent: "primary_alt" as const,
    microText: "WING · 04",
    specialists: [
      { name: "Cashflow watcher", status: "idle" as AgentStatus },
      { name: "Receipt parser", status: "blocked" as AgentStatus },
      { name: "Quarterly synth", status: "idle" as AgentStatus },
    ],
  },
];

const OUTPUTS: Record<string, OutputItem[]> = {
  social: [
    {
      id: "li-1",
      channel: "LinkedIn · text post",
      title: "The 3-line memo that gets exec attention",
      status: "draft",
      judgeScore: 9.1,
      iteration: 2,
      body: `Most exec memos die in paragraph two.\n\nThe fix is brutal: top line states the decision. Line two gives the one number that justifies it. Line three names the owner and the date.\n\nThat's the whole memo. The rest is appendix.`,
      meta: "judge: haiku-4.5 · drafter: opus-4.5",
    },
    {
      id: "li-2",
      channel: "LinkedIn · image card",
      title: "Tuesday deploy ritual — quote card",
      status: "draft",
      judgeScore: 8.7,
      iteration: 1,
      body: `Caption: "We don't ship features. We ship Tuesdays. Every Tuesday at 9am — one thing real customers can use by lunch."`,
      imageVariant: "QuoteCard",
      meta: "satori · 1200×627",
    },
    {
      id: "li-3",
      channel: "Instagram · stat card",
      title: "AI employee adoption — May numbers",
      status: "draft",
      judgeScore: 8.6,
      iteration: 1,
      body: `47 cohort members deployed their first AI employee this week. Median time-to-first-output: 4 hours, 12 minutes.`,
      imageVariant: "StatCard",
      meta: "satori · 1080×1350",
    },
    {
      id: "li-4",
      channel: "LinkedIn · framework",
      title: "The 4-wing AI exec stack",
      status: "draft",
      judgeScore: 9.0,
      iteration: 2,
      body: `One CEO orb. Four wings: CMO writes, CRO sells, COO runs, CFO watches the money. Each wing is one agent supervising 3-5 specialists. Build the wings before the brain.`,
      imageVariant: "FrameworkCard",
      meta: "satori · 1200×1200",
    },
  ],
  email: [
    {
      id: "em-1",
      channel: "Newsletter · weekly",
      title: "Week 19 — what shipped, what's next",
      status: "draft",
      judgeScore: 8.8,
      iteration: 1,
      body: `Subject: Tuesday shipped 4 things\n\nTwo wings hit production this week. CMO is now drafting LinkedIn + newsletter on a single brief. CRO outreach is one revision behind.\n\nNext Tuesday: COO scheduler goes live for cohort members.`,
      meta: "judge: haiku-4.5 · framework: Daniel Paul Email",
    },
    {
      id: "em-2",
      channel: "Sequence · onboarding step 3",
      title: "Day 3 — your first deployment ritual",
      status: "draft",
      judgeScore: 8.5,
      iteration: 2,
      body: `If you haven't shipped one thing this week, you don't have an AI employee — you have a chatbot. Here's the 30-minute deploy ritual.`,
      meta: "judge: haiku-4.5",
    },
  ],
  longform: [
    {
      id: "lf-1",
      channel: "Blog · long-form essay",
      title: "Why the 'AI agent' framing keeps you stuck",
      status: "draft",
      judgeScore: 8.9,
      iteration: 2,
      body: `The word 'agent' makes founders treat AI like a contractor. You brief it, wait, and judge the output. That's the wrong frame.\n\nThink AI employee instead. You hire it once. You train it on your voice. It shows up Tuesday morning whether you brief it or not. The output is the byproduct of the relationship, not the transaction.`,
      meta: "judge: haiku-4.5 · 1,400 words",
    },
  ],
  images: [
    {
      id: "img-1",
      channel: "Hero photo · website",
      title: "Daniel at the workstation — Higgsfield Soul 2.0",
      status: "approved",
      judgeScore: 9.2,
      iteration: 1,
      body: `Sony 35mm f/1.4, 1/125s, ISO 400. Camera-left tungsten softbox 30° elevated. Kodak Portra 400 grade. Slight halation.`,
      meta: "soul-2.0 · brand-locked",
    },
    {
      id: "img-2",
      channel: "Quote card · Tuesday ritual",
      title: "We ship Tuesdays — quote card",
      status: "draft",
      judgeScore: 8.7,
      iteration: 1,
      body: `Render via Satori. 1080×1350 portrait for IG, 1200×627 landscape for LinkedIn. Brand palette locked from data/brand.json.`,
      imageVariant: "QuoteCard",
      meta: "satori",
    },
    {
      id: "img-3",
      channel: "Framework card",
      title: "4-wing exec stack — diagram",
      status: "draft",
      judgeScore: 8.8,
      iteration: 1,
      body: `Single source: data/brand.json. No DALL-E. No generic gradients. Vector-perfect at any size.`,
      imageVariant: "FrameworkCard",
      meta: "satori",
    },
  ],
  pages: [
    {
      id: "pg-1",
      channel: "Landing page · cohort signup",
      title: "AI Employee Cohort — June pre-bootcamp",
      status: "scheduled",
      judgeScore: 8.6,
      iteration: 2,
      body: `Single-purpose page. One CTA. Pre-fills cohort tier from referrer. Deploys to Vercel on merge to main.`,
      meta: "framework: Daniel Paul Email · gate: 8.5",
    },
  ],
  outreach: [
    {
      id: "or-1",
      channel: "LinkedIn DM · cohort prospect",
      title: "Singapore expansion — short intro",
      status: "draft",
      judgeScore: 8.6,
      iteration: 1,
      body: `Hey {{first_name}} — saw you're hiring a head of growth in SG. Quick one: are you looking at AI-employee setups for the marketing role, or pure human hire?\n\n2 min answer either way is fine.`,
      meta: "judge: haiku-4.5 · token-budget: 60",
    },
  ],
  video: [],
  forms: [],
};

// ─── page ──────────────────────────────────────────────────────────────

export default function JarvisPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function selectCategory(id: string) {
    setActiveCategory(id);
    setDrawerOpen(true);
  }

  function openWingOutput(wingId: string) {
    // CMO → social, CRO → outreach, COO → pages, CFO → email (mock mapping)
    const map: Record<string, string> = {
      cmo: "social",
      cro: "outreach",
      coo: "pages",
      cfo: "email",
    };
    selectCategory(map[wingId] ?? "social");
  }

  const drawerItems =
    activeCategory && OUTPUTS[activeCategory] ? OUTPUTS[activeCategory] : [];
  const drawerLabel =
    CATEGORIES.find((c) => c.id === activeCategory)?.label ?? null;

  return (
    <div className="pp-mesh relative flex h-screen w-full flex-col overflow-hidden bg-[var(--pp-bg)] text-[var(--pp-text)]">
      {/* Top bar */}
      <header className="z-10 flex items-center justify-between border-b border-[var(--pp-border)] bg-[var(--pp-bg-elevated)]/60 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className="h-2 w-2 rounded-full bg-[var(--pp-primary)]"
            style={{
              boxShadow:
                "0 0 8px rgba(236,67,87,0.6), 0 0 16px rgba(236,67,87,0.4)",
            }}
            aria-hidden
          />
          <span className="font-display text-sm font-semibold tracking-tight">
            Jarvis · AI CEO Command Center
          </span>
          <span className="pp-ambient-text ml-2 hidden sm:inline">
            v0.1 · prototype
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--pp-text-muted)]">
          <span className="pp-ambient-text">PURELY PERSONAL</span>
          <Link
            href="/"
            className="rounded-sm border border-white/10 px-2.5 py-1 transition hover:text-[var(--pp-text)]"
          >
            ← GBI Singapore site
          </Link>
        </div>
      </header>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — categories */}
        <CategorySidebar
          categories={CATEGORIES}
          activeId={activeCategory}
          onSelect={selectCategory}
        />

        {/* MIDDLE — agent canvas */}
        <main
          className="pp-scroll flex-1 overflow-y-auto"
          aria-label="Agent canvas"
        >
          <div className="mx-auto max-w-6xl px-8 py-10">
            {/* CEO orb hero */}
            <section className="mb-12 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
              <div className="flex justify-center">
                <CEOOrb size={140} state="speaking" />
              </div>
              <div>
                <p className="pp-ambient-text">JARVIS · ONLINE</p>
                <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  Your AI executive team is at the bench.
                </h1>
                <p className="mt-3 max-w-xl text-[var(--pp-text-muted)]">
                  Four wings, fourteen specialists, one cross-model judge. Outputs ship at 8.5
                  or higher — or they get revised. Pick a channel on the left to see what&apos;s queued.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Pill tone="primary">Hold Space to talk</Pill>
                  <Pill tone="cyan">Cross-model judge: Haiku 4.5</Pill>
                  <Pill tone="gold">Quality floor: 8.5</Pill>
                </div>
              </div>
            </section>

            {/* Wings grid */}
            <section aria-labelledby="wings-heading">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="pp-ambient-text">EXEC WINGS</p>
                  <h2
                    id="wings-heading"
                    className="font-display text-xl font-semibold tracking-tight"
                  >
                    Working now
                  </h2>
                </div>
                <span className="pp-ambient-text">
                  {WINGS.reduce(
                    (acc, w) =>
                      acc +
                      w.specialists.filter((s) =>
                        ["thinking", "drafting", "judging"].includes(s.status),
                      ).length,
                    0,
                  )}{" "}
                  ACTIVE · {WINGS.length} WINGS
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {WINGS.map((w) => (
                  <AgentCard
                    key={w.id}
                    label={w.label}
                    title={w.title}
                    accent={w.accent}
                    specialists={w.specialists}
                    microText={w.microText}
                    onViewOutput={() => openWingOutput(w.id)}
                  />
                ))}
              </div>
            </section>

            {/* Quality loop visualisation */}
            <section className="mt-12" aria-labelledby="loop-heading">
              <div className="mb-4">
                <p className="pp-ambient-text">QUALITY LOOP · LIVE</p>
                <h2
                  id="loop-heading"
                  className="font-display text-xl font-semibold tracking-tight"
                >
                  How every output earns its 8.5
                </h2>
              </div>
              <OctagonFrame chamfer={14} cornered>
                <div className="grid grid-cols-1 divide-y divide-white/5 p-6 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
                  <LoopStep n="01" label="Drafter" detail="3 parallel · t=0.6/0.8/1.0" />
                  <LoopStep n="02" label="Critic" detail="dim-by-dim feedback" />
                  <LoopStep n="03" label="Reviser" detail="max 2 revisions" />
                  <LoopStep n="04" label="Judge" detail="haiku-4.5 · ≥8.5" />
                  <LoopStep n="05" label="De-AI pass" detail="ship or kill" />
                </div>
              </OctagonFrame>
            </section>

            {/* Footer hint */}
            <footer className="mt-12 border-t border-white/5 pt-6 text-xs text-[var(--pp-text-muted)]">
              <p>
                <span className="pp-ambient-text">PROTOTYPE NOTE · </span>
                This is a static visual reference for the developer. Outputs, scores, and
                wing states are mocked. Read{" "}
                <code className="rounded-sm border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[11px]">
                  UX_RESTRUCTURE_GUIDELINES.md
                </code>{" "}
                and{" "}
                <code className="rounded-sm border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[11px]">
                  VISUAL_AUDIT.md
                </code>{" "}
                before wiring real data.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* RIGHT — slide-out drawer */}
      <OutputDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        category={drawerLabel}
        items={drawerItems}
      />
    </div>
  );
}

// ─── small helpers ─────────────────────────────────────────────────────

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "primary" | "cyan" | "gold";
}) {
  const map = {
    primary: { c: "#ec4357", b: "rgba(236,67,87,0.4)" },
    cyan: { c: "#00d4ff", b: "rgba(0,212,255,0.4)" },
    gold: { c: "#fbbf24", b: "rgba(251,191,36,0.4)" },
  };
  const t = map[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider"
      style={{
        borderColor: t.b,
        color: t.c,
        boxShadow: `0 0 8px ${t.c}40, inset 0 0 8px ${t.c}10`,
      }}
    >
      <span
        className="h-1 w-1 rounded-full"
        style={{ background: t.c, boxShadow: `0 0 6px ${t.c}` }}
        aria-hidden
      />
      {children}
    </span>
  );
}

function LoopStep({
  n,
  label,
  detail,
}: {
  n: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="px-4 py-3 text-center sm:px-6">
      <p className="pp-ambient-text">{n}</p>
      <p className="mt-1 font-display text-base font-semibold text-[var(--pp-text)]">
        {label}
      </p>
      <p className="mt-1 text-xs text-[var(--pp-text-muted)]">{detail}</p>
    </div>
  );
}
