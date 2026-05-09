"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Check,
  ChevronRight,
  Copy,
  Download,
  Heart,
  House,
  Image,
  LoaderCircle,
  Mail,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Repeat2,
  Search,
  Send,
  X,
} from "lucide-react";

import { JarvisCoreCanvas } from "@/components/jarvis-core-canvas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AgentLifecycleStatus = "idle" | "queued" | "active" | "synthesized" | "error";

type RouteMeta = {
  department: string;
  project_type: string;
  mode: "single" | "swarm";
  selected_agents: string[];
  summary: string;
  template_key?: string | null;
};

type ProviderMeta = {
  provider: string;
  model: string;
};

type LifecycleMeta = {
  agent: string;
  status: AgentLifecycleStatus;
  detail: string;
};

type ValidationMeta = {
  agent: string;
  valid: boolean;
  detail: string;
};

type StreamPayload = {
  error?: string;
  update?: Record<string, unknown>;
  meta?: {
    route?: RouteMeta;
    provider?: ProviderMeta;
    lifecycle?: LifecycleMeta;
    validation?: ValidationMeta;
  };
  done?: boolean;
};

type ExecutiveKey = "cmo" | "cro" | "coo" | "cfo";

type Executive = {
  key: ExecutiveKey;
  label: string;
  role: string;
  live: boolean;
};

type SubAgentKey =
  | "market_research"
  | "competitor_intel"
  | "content"
  | "campaigns"
  | "offers"
  | "brand_voice"
  | "landing_page"
  | "landing_page_architect"
  | "linkedin_creator"
  | "linkedin_carousel"
  | "instagram_creator"
  | "tiktok_creator"
  | "facebook_creator"
  | "email_writer"
  | "email_sequence"
  | "newsletter_writer"
  | "dm_automation"
  | "squeeze_page"
  | "lead_magnet"
  | "blog_writer"
  | "instagram_reels"
  | "instagram_stories"
  | "facebook_ads"
  | "cro_funnel"
  | "analytics"
  | "creative_review"
  | "pipeline_architect"
  | "objection_handler"
  | "followup_writer"
  | "ops_priorities"
  | "ops_process"
  | "ops_cadence"
  | "finance_cashflow"
  | "finance_pricing"
  | "finance_forecast";

type SubAgentState = {
  status: AgentLifecycleStatus;
  detail: string;
};

type RunParams = {
  intent: string;
  executive: ExecutiveKey | null;
  rootInitiated: boolean;
  retryCount: number;
};

const EXECUTIVES: Executive[] = [
  { key: "cmo", label: "CMO", role: "Marketing command", live: true },
  { key: "cro", label: "CRO", role: "Revenue command", live: true },
  { key: "coo", label: "COO", role: "Operations command", live: true },
  { key: "cfo", label: "CFO", role: "Finance command", live: true },
];

const EXECUTIVE_META: Record<ExecutiveKey, { desc: string; agents: string; color: string }> = {
  cmo: { desc: "Brand · content · campaigns · channels", agents: "25 specialists", color: "rgba(86,255,241,0.15)" },
  cro: { desc: "Pipeline · objections · follow-up · close", agents: "6 specialists", color: "rgba(137,246,197,0.15)" },
  coo: { desc: "Ops · process · cadence · priorities", agents: "6 specialists", color: "rgba(140,191,255,0.15)" },
  cfo: { desc: "Cashflow · pricing · forecast · margins", agents: "6 specialists", color: "rgba(255,211,122,0.15)" },
};

const QUICK_COMMANDS = [
  "Create one week marketing for my business",
  "Build a LinkedIn content plan for an AI consulting offer",
  "Draft a founder-led campaign for a high-ticket workshop",
];

const EXECUTIVE_COMMANDS: Record<ExecutiveKey, string[]> = {
  cmo: QUICK_COMMANDS,
  cro: [
    "Design a revenue sprint to improve close rate and follow-up for high-ticket calls",
    "Build objection handling for an AI consulting sales call",
    "Create a post-call follow-up sequence for warm leads",
  ],
  coo: [
    "Build a weekly operations cadence with priorities and owners",
    "Design an SOP for client onboarding and delivery handoff",
    "Find execution bottlenecks in a small consulting team",
  ],
  cfo: [
    "Build a pricing and margin guardrail plan for an AI consulting offer",
    "Create a simple cashflow protection plan for the next 90 days",
    "Map best-case, base-case, and downside scenarios for a new service line",
  ],
};

const EXECUTIVE_PLACEHOLDERS: Record<ExecutiveKey, string> = {
  cmo: "Create one week marketing for my business",
  cro: "Design a revenue sprint to improve close rate and follow-up",
  coo: "Build a weekly operations cadence with priorities and owners",
  cfo: "Build a pricing and cashflow guardrail plan",
};

const ROOT_PLACEHOLDER = "Describe the task and AI CEO will route it to the right executive and specialists";

const DEPARTMENT_TO_EXECUTIVE: Record<string, ExecutiveKey> = {
  marketing: "cmo",
  sales: "cro",
  operations: "coo",
  finance: "cfo",
};

const ALL_SUB_AGENT_KEYS: SubAgentKey[] = [
  "market_research",
  "competitor_intel",
  "offers",
  "campaigns",
  "content",
  "brand_voice",
  "landing_page",
  "landing_page_architect",
  "linkedin_creator",
  "linkedin_carousel",
  "instagram_creator",
  "tiktok_creator",
  "facebook_creator",
  "facebook_ads",
  "email_writer",
  "email_sequence",
  "newsletter_writer",
  "dm_automation",
  "squeeze_page",
  "lead_magnet",
  "blog_writer",
  "instagram_reels",
  "instagram_stories",
  "cro_funnel",
  "analytics",
  "creative_review",
  "pipeline_architect",
  "objection_handler",
  "followup_writer",
  "ops_priorities",
  "ops_process",
  "ops_cadence",
  "finance_cashflow",
  "finance_pricing",
  "finance_forecast",
];

const SUB_AGENT_META: Record<SubAgentKey, { label: string; branch: string; shortLabel: string }> = {
  market_research: { label: "Market Radar", branch: "Audience signal", shortLabel: "Research" },
  competitor_intel: { label: "Competitor Intel", branch: "Positioning gap", shortLabel: "Competitors" },
  content: { label: "Narrative Engine", branch: "Messaging spine", shortLabel: "Narrative" },
  campaigns: { label: "Channel Grid", branch: "Launch branches", shortLabel: "Channels" },
  offers: { label: "Offer Forge", branch: "Positioning branch", shortLabel: "Offers" },
  brand_voice: { label: "Voice Foundry", branch: "Tone system", shortLabel: "Voice" },
  landing_page: { label: "Landing Page Architect", branch: "Conversion page", shortLabel: "Landing" },
  landing_page_architect: { label: "Page Architect", branch: "Full page build", shortLabel: "Page Build" },
  linkedin_creator: { label: "LinkedIn Studio", branch: "Channel execution", shortLabel: "LinkedIn" },
  linkedin_carousel: { label: "Carousel Architect", branch: "Slide strategy", shortLabel: "Carousel" },
  instagram_creator: { label: "Instagram Studio", branch: "Channel execution", shortLabel: "Instagram" },
  instagram_reels: { label: "Reels Studio", branch: "Short-form video", shortLabel: "Reels" },
  instagram_stories: { label: "Stories Lab", branch: "Story sequences", shortLabel: "Stories" },
  tiktok_creator: { label: "TikTok Reactor", branch: "Short-form execution", shortLabel: "TikTok" },
  facebook_creator: { label: "Facebook Signal", branch: "Channel execution", shortLabel: "Facebook" },
  facebook_ads: { label: "Ads Engine", branch: "Paid acquisition", shortLabel: "FB Ads" },
  email_writer: { label: "Email Forge", branch: "Channel execution", shortLabel: "Email" },
  email_sequence: { label: "Sequence Architect", branch: "Lifecycle sequence", shortLabel: "Sequence" },
  newsletter_writer: { label: "Newsletter Desk", branch: "Channel execution", shortLabel: "Newsletter" },
  dm_automation: { label: "DM Sequencer", branch: "Conversation automation", shortLabel: "DMs" },
  squeeze_page: { label: "Squeeze Page", branch: "Lead capture", shortLabel: "Squeeze" },
  lead_magnet: { label: "Lead Magnet Lab", branch: "Lead generation", shortLabel: "Lead Magnet" },
  blog_writer: { label: "Blog Publisher", branch: "Long-form content", shortLabel: "Blog" },
  cro_funnel: { label: "Conversion Reactor", branch: "Funnel pressure", shortLabel: "CRO" },
  analytics: { label: "Signal Loop", branch: "Performance branch", shortLabel: "Signals" },
  creative_review: { label: "Quality Gate", branch: "Final synthesis", shortLabel: "Review" },
  pipeline_architect: { label: "Pipeline Architect", branch: "Revenue architecture", shortLabel: "Pipeline" },
  objection_handler: { label: "Objection Matrix", branch: "Deal resistance", shortLabel: "Objections" },
  followup_writer: { label: "Follow-Up Forge", branch: "Deal momentum", shortLabel: "Follow-up" },
  ops_priorities: { label: "Priority Grid", branch: "Execution focus", shortLabel: "Priorities" },
  ops_process: { label: "Process Designer", branch: "Workflow system", shortLabel: "Process" },
  ops_cadence: { label: "Cadence Control", branch: "Meeting rhythm", shortLabel: "Cadence" },
  finance_cashflow: { label: "Cashflow Guard", branch: "Liquidity view", shortLabel: "Cashflow" },
  finance_pricing: { label: "Pricing Guardrail", branch: "Margin logic", shortLabel: "Pricing" },
  finance_forecast: { label: "Forecast Deck", branch: "Scenario planning", shortLabel: "Forecast" },
};

const CORE_CONNECTOR_DELAY_MS = 520;
const PER_EXECUTIVE_DELAY_MS = 240;
const EXECUTIVE_APPEAR_OFFSET_MS = 150;
const PANEL_REVEAL_DELAY_MS = 520;

const CONNECTOR_PATHS = [
  "M500 14 C430 54 286 120 170 208",
  "M500 14 C470 58 426 124 392 208",
  "M500 14 C530 58 574 124 608 208",
  "M500 14 C570 54 714 120 830 208",
] as const;

function contentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => {
      if (typeof block === "object" && block !== null && "text" in block) {
        const text = (block as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      }
      return "";
    })
    .join("");
}

function assistantTextFromUpdate(update: Record<string, unknown>): string {
  const parts: string[] = [];

  function walk(node: unknown): void {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node !== "object") return;
    const objectNode = node as Record<string, unknown>;
    if (objectNode.type === "AIMessage" || objectNode.type === "AIMessageChunk") {
      const text = contentToString(objectNode.content);
      if (text.trim()) parts.push(text);
      return;
    }
    for (const value of Object.values(objectNode)) walk(value);
  }

  walk(update);
  return parts.join("\n\n");
}

function parseCompleteSseBlocks(buffer: string): { events: StreamPayload[]; rest: string } {
  const events: StreamPayload[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    for (const line of part.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        events.push(JSON.parse(line.slice(6)) as StreamPayload);
      } catch {
        /* ignore malformed lines */
      }
    }
  }

  return { events, rest };
}

function parseTrailingBuffer(buffer: string): StreamPayload[] {
  if (!buffer.trim()) return [];

  const events: StreamPayload[] = [];
  for (const line of buffer.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as StreamPayload);
    } catch {
      /* ignore malformed lines */
    }
  }

  return events;
}

function createInitialSubAgents(): Record<SubAgentKey, SubAgentState> {
  return {
    market_research: { status: "idle", detail: "Waiting for route classification." },
    competitor_intel: { status: "idle", detail: "Waiting for route classification." },
    content: { status: "idle", detail: "Waiting for route classification." },
    campaigns: { status: "idle", detail: "Waiting for route classification." },
    offers: { status: "idle", detail: "Waiting for route classification." },
    brand_voice: { status: "idle", detail: "Waiting for route classification." },
    landing_page: { status: "idle", detail: "Waiting for route classification." },
    linkedin_creator: { status: "idle", detail: "Waiting for route classification." },
    instagram_creator: { status: "idle", detail: "Waiting for route classification." },
    tiktok_creator: { status: "idle", detail: "Waiting for route classification." },
    facebook_creator: { status: "idle", detail: "Waiting for route classification." },
    email_writer: { status: "idle", detail: "Waiting for route classification." },
    email_sequence: { status: "idle", detail: "Waiting for route classification." },
    newsletter_writer: { status: "idle", detail: "Waiting for route classification." },
    landing_page_architect: { status: "idle", detail: "Waiting for route classification." },
    linkedin_carousel: { status: "idle", detail: "Waiting for route classification." },
    dm_automation: { status: "idle", detail: "Waiting for route classification." },
    squeeze_page: { status: "idle", detail: "Waiting for route classification." },
    lead_magnet: { status: "idle", detail: "Waiting for route classification." },
    blog_writer: { status: "idle", detail: "Waiting for route classification." },
    instagram_reels: { status: "idle", detail: "Waiting for route classification." },
    instagram_stories: { status: "idle", detail: "Waiting for route classification." },
    facebook_ads: { status: "idle", detail: "Waiting for route classification." },
    cro_funnel: { status: "idle", detail: "Waiting for route classification." },
    analytics: { status: "idle", detail: "Waiting for route classification." },
    creative_review: { status: "idle", detail: "Waiting for route classification." },
    pipeline_architect: { status: "idle", detail: "Waiting for route classification." },
    objection_handler: { status: "idle", detail: "Waiting for route classification." },
    followup_writer: { status: "idle", detail: "Waiting for route classification." },
    ops_priorities: { status: "idle", detail: "Waiting for route classification." },
    ops_process: { status: "idle", detail: "Waiting for route classification." },
    ops_cadence: { status: "idle", detail: "Waiting for route classification." },
    finance_cashflow: { status: "idle", detail: "Waiting for route classification." },
    finance_pricing: { status: "idle", detail: "Waiting for route classification." },
    finance_forecast: { status: "idle", detail: "Waiting for route classification." },
  };
}

function coerceSubAgentKey(value: string): SubAgentKey | null {
  return ALL_SUB_AGENT_KEYS.includes(value as SubAgentKey) ? (value as SubAgentKey) : null;
}

function applyRouteSelection(route: RouteMeta): Record<SubAgentKey, SubAgentState> {
  const next = createInitialSubAgents();
  const selected = route.selected_agents
    .map((key) => coerceSubAgentKey(key))
    .filter((key): key is SubAgentKey => key !== null);

  selected.forEach((key) => {
    next[key] = {
      status: "queued",
      detail: `Queued for ${route.template_key ?? route.project_type} in ${route.mode} mode.`,
    };
  });

  return next;
}

function updateSubAgentLifecycle(
  current: Record<SubAgentKey, SubAgentState>,
  lifecycle: LifecycleMeta,
): Record<SubAgentKey, SubAgentState> {
  const key = coerceSubAgentKey(lifecycle.agent);
  if (!key) return current;

  const currentDetail = current[key].detail;
  const lifecycleDetail = lifecycle.detail;
  const currentLooksStructured = currentDetail.includes(":") || currentDetail.length > 120;
  const lifecycleLooksGeneric = /queued|executing|completed|validated|starting|retrying|failed/i.test(lifecycleDetail);

  return {
    ...current,
    [key]: {
      status: lifecycle.status,
      detail: currentLooksStructured && lifecycleLooksGeneric ? currentDetail : lifecycleDetail,
    },
  };
}

function updateSubAgentFromText(
  current: Record<SubAgentKey, SubAgentState>,
  agentKey: SubAgentKey,
  text: string,
): Record<SubAgentKey, SubAgentState> {
  return {
    ...current,
    [agentKey]: {
      status: current[agentKey].status === "synthesized" ? "synthesized" : "active",
      detail: text,
    },
  };
}

function getPrimaryUpdateNode(update: Record<string, unknown>): string | null {
  const keys = Object.keys(update);
  if (keys.length !== 1) return null;
  return keys[0] ?? null;
}

type BlogSection = {
  heading: string;
  body: string;
  image_prompt?: string;
  image_url?: string;
};

type PreviewCardData = {
  platform: "LinkedIn" | "Instagram" | "Facebook" | "TikTok" | "Email" | "Newsletter" | "Landing Page" | "X" | "Threads" | "Bluesky" | "Carousel" | "DM Automation" | "Squeeze Page" | "Lead Magnet" | "Reels" | "Stories" | "Facebook Ads" | "Blog Post";
  title: string;
  body: string;
  footer: string;
  accent: string;
  visual?: string;
  provisional?: boolean;
  // Blog-specific
  sections?: BlogSection[];
  tags?: string[];
  seo_keywords?: string[];
  hero_image_url?: string;
  read_time?: string;
  meta_description?: string;
};

type SynthesisView = "preview" | "jsx";

type PreviewMode = "grid" | "full";

type ActivePreview = {
  card: PreviewCardData;
  index: number;
};

function escapeJsxText(value: string): string {
  return value.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function toComponentName(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "JarvisArtifact";
  return `${parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")}Artifact`;
}

function artifactFilename(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${slug || "artifact"}.jsx`;
}

function detailLooksRenderable(detail: string) {
  return detail.includes(":") || detail.length > 120;
}

function buildArtifactJsx(params: {
  command: string;
  executiveLabel: string;
  routeMeta: RouteMeta | null;
  responseText: string;
  previewCards: PreviewCardData[];
}) {
  const componentName = toComponentName(params.command || `${params.executiveLabel} synthesis`);
  const paragraphs = params.responseText
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 8);

  const previewBlocks = params.previewCards.slice(0, 4).map((card) => ({
    platform: card.platform,
    title: card.title,
    body: card.body,
    footer: card.footer,
  }));

  const lines = [
    `export function ${componentName}() {`,
    "  return (",
    '    <section className="rounded-[28px] border border-[#E7DFCF] bg-[#F8F5EE] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">',
    '      <header className="flex items-center justify-between border-b border-[#E7DFCF] pb-4">',
    '        <div>',
    `          <p className="text-[11px] uppercase tracking-[0.28em] text-[#7C6F61]">${escapeJsxText(params.executiveLabel)} lane</p>`,
    `          <h2 className="mt-2 text-xl font-semibold text-[#1F2937]">${escapeJsxText(params.routeMeta?.summary ?? params.command)}</h2>`,
    "        </div>",
    `        <span className="rounded-full border border-[#DDD4C2] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#7C6F61]">${escapeJsxText(params.routeMeta?.template_key ?? "artifact.jsx")}</span>`,
    "      </header>",
    '      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">',
    '        <div className="space-y-4">',
    ...paragraphs.map(
      (paragraph) => `          <p className="text-[15px] leading-7 text-[#334155]">${escapeJsxText(paragraph)}</p>`,
    ),
    "        </div>",
    '        <aside className="space-y-3">',
    ...previewBlocks.flatMap((block) => [
      '          <article className="rounded-[20px] border border-[#E7DFCF] bg-white p-4">',
      `            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7C6F61]">${escapeJsxText(block.platform)}</p>`,
      `            <p className="mt-2 text-sm font-semibold text-[#111827]">${escapeJsxText(block.title)}</p>`,
      `            <p className="mt-2 text-sm leading-6 text-[#475569]">${escapeJsxText(block.body.slice(0, 180))}</p>`,
      `            <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[#94A3B8]">${escapeJsxText(block.footer)}</p>`,
      "          </article>",
    ]),
    "        </aside>",
    "      </div>",
    "    </section>",
    "  );",
    "}",
  ];

  return lines.join("\n");
}

function buildSpecialistArtifactJsx(agentKey: SubAgentKey, state: SubAgentState) {
  const meta = SUB_AGENT_META[agentKey];
  const componentName = toComponentName(meta.label);
  const sections = state.detail
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 6);

  const lines = [
    `export function ${componentName}() {`,
    "  return (",
    '    <article className="rounded-[24px] border border-[#E7DFCF] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">',
    `      <p className="text-[11px] uppercase tracking-[0.24em] text-[#7C6F61]">${escapeJsxText(meta.branch)}</p>`,
    `      <h3 className="mt-2 text-lg font-semibold text-[#111827]">${escapeJsxText(meta.label)}</h3>`,
    ...sections.map(
      (section) => `      <p className="mt-3 text-sm leading-6 text-[#475569]">${escapeJsxText(section)}</p>`,
    ),
    "    </article>",
    "  );",
    "}",
  ];

  return lines.join("\n");
}

function buildSpecialistArtifacts(subAgents: Record<SubAgentKey, SubAgentState>, selectedKeys: SubAgentKey[]) {
  return selectedKeys
    .map((key) => ({ key, state: subAgents[key] }))
    .filter(({ state }) => state.status !== "idle" && state.status !== "queued" && detailLooksRenderable(state.detail))
    .slice(0, 8)
    .map(({ key, state }) => ({
      id: key,
      label: SUB_AGENT_META[key].label,
      filename: artifactFilename(SUB_AGENT_META[key].label),
      code: buildSpecialistArtifactJsx(key, state),
      status: state.status,
    }));
}

function highlightCodeLine(line: string) {
  const tokens: Array<{ text: string; kind: string }> = [];
  const pattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|<\/?[A-Za-z][\w.-]*|\b(?:export|function|return|const)\b|\bclassName\b|\b[0-9]+\b|[A-Z][A-Za-z0-9]+|[{}()[\]=<>/]+|\b[a-z_][A-Za-z0-9_]*\b)/g;
  let lastIndex = 0;

  for (const match of line.matchAll(pattern)) {
    const matchText = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, index), kind: "plain" });
    }

    let kind = "plain";
    if (/^['"]/.test(matchText)) kind = "string";
    else if (/^<\/?[A-Za-z]/.test(matchText)) kind = "tag";
    else if (/^(export|function|return|const)$/.test(matchText)) kind = "keyword";
    else if (matchText === "className") kind = "attr";
    else if (/^[A-Z]/.test(matchText)) kind = "component";
    else if (/^[0-9]+$/.test(matchText)) kind = "number";
    else if (/^[{}()[\]=<>/]+$/.test(matchText)) kind = "punctuation";
    else kind = "identifier";

    tokens.push({ text: matchText, kind });
    lastIndex = index + matchText.length;
  }

  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), kind: "plain" });
  }

  return tokens;
}

function extractSections(text: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let current: string | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^[A-Z][A-Za-z ]+:$/.test(line)) {
      current = line.slice(0, -1);
      sections[current] = [];
      continue;
    }
    if (current) {
      sections[current].push(line);
    }
  }

  return sections;
}

function parseInlineFields(line: string): Record<string, string> {
  const normalized = line.replace(/^\d+\.\s*/, "");
  return normalized.split("; ").reduce<Record<string, string>>((acc, part) => {
    const separator = part.indexOf(": ");
    if (separator === -1) return acc;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 2).trim();
    if (key && value) acc[key] = value;
    return acc;
  }, {});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryParseJson(text: string): Record<string, any> | null {
  try {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function jsonFirstPreview(detail: string): string | null {
  const json = tryParseJson(detail);
  if (!json) return null;
  if (typeof json.channel_goal === "string") return json.channel_goal;
  if (typeof json.email_objective === "string") return json.email_objective;
  if (typeof json.newsletter_objective === "string") return json.newsletter_objective;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const first: any = json.posts?.[0] ?? json.assets?.[0] ?? json.video_concepts?.[0] ?? json.post_variants?.[0] ?? json.emails?.[0] ?? json.concepts?.[0];
  if (typeof first?.hook === "string") return first.hook.slice(0, 120);
  if (typeof first?.subject === "string") return first.subject.slice(0, 120);
  return null;
}

function buildPreviewCards(subAgents: Record<SubAgentKey, SubAgentState>, selectedKeys: SubAgentKey[]): PreviewCardData[] {
  const primaryCards = new Map<PreviewCardData["platform"], PreviewCardData>();
  const provisionalCards = new Map<PreviewCardData["platform"], PreviewCardData>();

  const canRender = (state: SubAgentState | undefined) => {
    if (!state) return false;
    if (state.status === "queued" || state.status === "idle") return false;
    return state.detail.includes(":") || state.detail.length > 120;
  };

  const addCard = (card: PreviewCardData, provisional = false) => {
    if (provisional) {
      if (!primaryCards.has(card.platform)) provisionalCards.set(card.platform, card);
      return;
    }
    provisionalCards.delete(card.platform);
    primaryCards.set(card.platform, card);
  };

  for (const key of selectedKeys) {
    const state = subAgents[key];
    if (!canRender(state)) continue;

    const detail = state.detail;
    if (!detail) continue;

    const sections = extractSections(detail);
    if (key === "content") {
      for (const row of sections["Content Assets"] ?? []) {
        const asset = row.replace(/^[-*]\s*/, "").trim();
        const lower = asset.toLowerCase();
        const cardBody = sections["Narrative Spine"]?.[0] ?? sections["Editorial Angles"]?.[0] ?? detail;

        if (lower.includes("linkedin")) {
          addCard(
            {
              platform: "LinkedIn",
              title: asset,
              body: cardBody,
              footer: sections["Cta Rules"]?.[0] ?? "Preview pending channel draft",
              accent: "from-[#0a66c2] via-[#1d9bf0] to-[#7dd3fc]",
              provisional: true,
            },
            true,
          );
        }

        if (lower.includes("twitter") || lower.includes(" x ") || lower.startsWith("x ") || lower.includes("x thread")) {
          addCard(
            {
              platform: "X",
              title: asset,
              body: cardBody,
              footer: sections["Cta Rules"]?.[0] ?? "Preview pending thread draft",
              accent: "from-[#0f172a] via-[#111827] to-[#475569]",
              provisional: true,
            },
            true,
          );
        }

        if (lower.includes("threads")) {
          addCard(
            {
              platform: "Threads",
              title: asset,
              body: cardBody,
              footer: sections["Cta Rules"]?.[0] ?? "Preview pending thread draft",
              accent: "from-[#111111] via-[#27272a] to-[#52525b]",
              provisional: true,
            },
            true,
          );
        }

        if (lower.includes("bluesky") || lower.includes("blue sky")) {
          addCard(
            {
              platform: "Bluesky",
              title: asset,
              body: cardBody,
              footer: sections["Cta Rules"]?.[0] ?? "Preview pending post draft",
              accent: "from-[#0284ff] via-[#3b82f6] to-[#7dd3fc]",
              provisional: true,
            },
            true,
          );
        }

        if (lower.includes("instagram")) {
          addCard(
            {
              platform: "Instagram",
              title: asset,
              body: cardBody,
              footer: sections["Cta Rules"]?.[0] ?? "Preview pending channel draft",
              accent: "from-[#f09433] via-[#dc2743] to-[#833ab4]",
              visual: "Concept preview",
              provisional: true,
            },
            true,
          );
        }

        if (lower.includes("tiktok")) {
          addCard(
            {
              platform: "TikTok",
              title: asset,
              body: cardBody,
              footer: sections["Cta Rules"]?.[0] ?? "Preview pending channel draft",
              accent: "from-[#111111] via-[#25f4ee] to-[#fe2c55]",
              visual: "Vertical concept",
              provisional: true,
            },
            true,
          );
        }

        if (lower.includes("facebook")) {
          addCard(
            {
              platform: "Facebook",
              title: asset,
              body: cardBody,
              footer: sections["Cta Rules"]?.[0] ?? "Preview pending channel draft",
              accent: "from-[#1877f2] via-[#60a5fa] to-[#bfdbfe]",
              provisional: true,
            },
            true,
          );
        }

        if (lower.includes("landing page")) {
          addCard(
            {
              platform: "Landing Page",
              title: asset,
              body: cardBody,
              footer: sections["Cta Rules"]?.[0] ?? "Preview pending page draft",
              accent: "from-[#0f172a] via-[#1e293b] to-[#38bdf8]",
              visual: "Hero concept",
              provisional: true,
            },
            true,
          );
        }

        if (lower.includes("email")) {
          addCard(
            {
              platform: "Email",
              title: asset,
              body: cardBody,
              footer: sections["Cta Rules"]?.[0] ?? "Preview pending email draft",
              accent: "from-[#64748b] via-[#94a3b8] to-[#e2e8f0]",
              provisional: true,
            },
            true,
          );
        }
      }
    }

    if (key === "linkedin_creator") {
      const json = tryParseJson(detail);
      if (json?.posts && Array.isArray(json.posts)) {
        for (const post of (json.posts as Array<{hook?: string; body?: string; CTA?: string}>).slice(0, 3)) {
          if (!post.hook && !post.body) continue;
          addCard({
            platform: "LinkedIn",
            title: post.hook ?? "Founder insight",
            body: post.body ?? detail,
            footer: post.CTA ?? String(json.posting_rhythm ?? "View post"),
            accent: "from-[#0a66c2] via-[#1d9bf0] to-[#7dd3fc]",
          });
        }
      } else {
        for (const row of (sections.Posts ?? []).slice(0, 2)) {
          const fields = parseInlineFields(row);
          if (!fields.hook && !fields.body) continue;
          addCard({
            platform: "LinkedIn",
            title: fields.hook ?? "Founder insight",
            body: fields.body ?? detail,
            footer: fields.CTA ?? sections["Posting Rhythm"]?.[0] ?? "View post",
            accent: "from-[#0a66c2] via-[#1d9bf0] to-[#7dd3fc]",
          });
        }
      }
    }

    if (key === "instagram_creator") {
      const json = tryParseJson(detail);
      if (json?.assets && Array.isArray(json.assets)) {
        for (const asset of (json.assets as Array<{format?: string; hook?: string; caption_angle?: string; visual_direction?: string; CTA?: string}>).slice(0, 3)) {
          addCard({
            platform: "Instagram",
            title: asset.hook ?? asset.format ?? "Instagram concept",
            body: asset.caption_angle ?? detail,
            footer: asset.CTA ?? "See post",
            accent: "from-[#f09433] via-[#dc2743] to-[#833ab4]",
            visual: asset.visual_direction ?? asset.format ?? "Visual asset",
          });
        }
      } else {
        for (const row of (sections.Assets ?? []).slice(0, 2)) {
          const fields = parseInlineFields(row);
          addCard({
            platform: "Instagram",
            title: fields.asset ?? "Carousel concept",
            body: fields.angle ?? sections["Content Mix"]?.join(" ") ?? detail,
            footer: fields.CTA ?? sections["Story Hooks"]?.[0] ?? "See reel",
            accent: "from-[#f09433] via-[#dc2743] to-[#833ab4]",
            visual: fields.asset ?? "Visual asset",
          });
        }
      }
    }

    if (key === "landing_page") {
      const title = sections["Hero Headline"]?.[0] ?? sections["Conversion Goal"]?.[0];
      const body = sections["Hero Subhead"]?.[0] ?? sections["Page Sections"]?.slice(0, 2).join(" ");
      if (title || body) {
        addCard({
          platform: "Landing Page",
          title: title ?? "Landing page concept",
          body: body ?? detail,
          footer: sections.CTA?.[0] ?? "Primary call to action",
          accent: "from-[#0f172a] via-[#1e293b] to-[#38bdf8]",
          visual: "Hero section",
        });
      }
    }

    if (key === "tiktok_creator") {
      const json = tryParseJson(detail);
      if (json?.video_concepts && Array.isArray(json.video_concepts)) {
        for (const concept of (json.video_concepts as Array<{title?: string; hook?: string; script?: string; shot_direction?: string; CTA?: string}>).slice(0, 3)) {
          addCard({
            platform: "TikTok",
            title: concept.title ?? concept.hook ?? "Vertical video concept",
            body: concept.script ?? concept.hook ?? detail,
            footer: concept.CTA ?? "Watch clip",
            accent: "from-[#111111] via-[#25f4ee] to-[#fe2c55]",
            visual: concept.shot_direction ?? "Vertical video",
          });
        }
      } else {
        for (const row of (sections["Video Concepts"] ?? []).slice(0, 2)) {
          const fields = parseInlineFields(row);
          addCard({
            platform: "TikTok",
            title: fields.title ?? fields.hook ?? "Vertical video concept",
            body: fields.script ?? detail,
            footer: fields.CTA ?? sections["Trend Notes"]?.[0] ?? "Watch clip",
            accent: "from-[#111111] via-[#25f4ee] to-[#fe2c55]",
            visual: fields.shot_direction ?? "Vertical video concept",
          });
        }
      }
    }

    if (key === "facebook_creator") {
      const json = tryParseJson(detail);
      if (json?.post_variants && Array.isArray(json.post_variants)) {
        for (const post of (json.post_variants as Array<{format?: string; hook?: string; body?: string; CTA?: string}>).slice(0, 3)) {
          addCard({
            platform: "Facebook",
            title: post.hook ?? post.format ?? "Community post",
            body: post.body ?? detail,
            footer: post.CTA ?? "Join conversation",
            accent: "from-[#1877f2] via-[#60a5fa] to-[#bfdbfe]",
          });
        }
      } else {
        for (const row of (sections["Post Variants"] ?? []).slice(0, 2)) {
          const fields = parseInlineFields(row);
          addCard({
            platform: "Facebook",
            title: fields.hook ?? fields.community_angle ?? "Community post",
            body: fields.body ?? sections["Community Angle"]?.[0] ?? detail,
            footer: fields.CTA ?? sections["Engagement Prompts"]?.[0] ?? "Join conversation",
            accent: "from-[#1877f2] via-[#60a5fa] to-[#bfdbfe]",
          });
        }
      }
    }

    if (key === "email_writer") {
      const json = tryParseJson(detail);
      if (json?.emails && Array.isArray(json.emails)) {
        for (const email of (json.emails as Array<{subject?: string; opening?: string; body?: string; CTA?: string}>).slice(0, 3)) {
          addCard({
            platform: "Email",
            title: email.subject ?? "Subject line",
            body: email.body ?? email.opening ?? detail,
            footer: email.CTA ?? "Open email",
            accent: "from-[#64748b] via-[#94a3b8] to-[#e2e8f0]",
          });
        }
      } else {
        for (const row of (sections.Emails ?? []).slice(0, 2)) {
          const fields = parseInlineFields(row);
          addCard({
            platform: "Email",
            title: fields.subject ?? "Subject line",
            body: fields.purpose ?? fields.body_outline ?? detail,
            footer: fields.CTA ?? sections["Send Cadence"]?.[0] ?? "Open email",
            accent: "from-[#64748b] via-[#94a3b8] to-[#e2e8f0]",
          });
        }
      }
    }

    if (key === "email_sequence") {
      const json = tryParseJson(detail);
      if (json?.emails && Array.isArray(json.emails)) {
        for (const email of (json.emails as Array<{subject?: string; opening?: string; body?: string; CTA?: string}>).slice(0, 2)) {
          addCard({
            platform: "Email",
            title: email.subject ?? "Sequence email",
            body: email.body ?? email.opening ?? detail,
            footer: email.CTA ?? "Open email",
            accent: "from-[#0f766e] via-[#14b8a6] to-[#ccfbf1]",
          });
        }
      } else {
        for (const row of (sections.Emails ?? []).slice(0, 2)) {
          const fields = parseInlineFields(row);
          addCard({
            platform: "Email",
            title: fields.subject ?? "Sequence email",
            body: fields.purpose ?? fields.body_outline ?? sections["Sequencing Logic"]?.join(" ") ?? detail,
            footer: fields.CTA ?? sections.CTA?.[0] ?? "Open email",
            accent: "from-[#0f766e] via-[#14b8a6] to-[#ccfbf1]",
          });
        }
      }
    }

    if (key === "newsletter_writer") {
      const json = tryParseJson(detail);
      if (json?.concepts && Array.isArray(json.concepts)) {
        for (const concept of (json.concepts as Array<{subject?: string; opening_angle?: string; body?: string; CTA?: string}>).slice(0, 2)) {
          addCard({
            platform: "Newsletter",
            title: concept.subject ?? "Newsletter issue",
            body: concept.body ?? concept.opening_angle ?? detail,
            footer: concept.CTA ?? "Read issue",
            accent: "from-[#c084fc] via-[#f0abfc] to-[#fde68a]",
          });
        }
      } else {
        for (const row of (sections.Sections ?? []).slice(0, 2)) {
          const fields = parseInlineFields(row);
          addCard({
            platform: "Newsletter",
            title: fields.section ?? sections["Issue Theme"]?.[0] ?? "Issue section",
            body: fields.purpose ?? fields.bullets ?? detail,
            footer: sections.CTA?.[0] ?? "Read issue",
            accent: "from-[#c084fc] via-[#f0abfc] to-[#fde68a]",
          });
        }
      }
    }
    
    if (key === "linkedin_carousel") {
      const json = tryParseJson(detail);
      if (json?.slides && Array.isArray(json.slides)) {
        const coverSlide = (json.slides as Array<{type?: string; title?: string; subtitle?: string}>).find((s) => s.type === "cover");
        addCard({
          platform: "Carousel",
          title: coverSlide?.title ?? json.caption_hook ?? "LinkedIn carousel",
          body: `${json.intent ?? "Carousel"} intent · ${(json.slides as unknown[]).length} slides\n\n${(json.slides as Array<{title?: string; content?: string}>).slice(1, 4).map((s) => `${s.title ?? ""}: ${(s.content ?? "").slice(0, 60)}`).join("\n")}`,
          footer: (json.slides as Array<{cta_text?: string}>).find((s) => s.cta_text)?.cta_text ?? "See carousel",
          accent: "from-[#0a66c2] via-[#1d9bf0] to-[#7dd3fc]",
          visual: `${(json.slides as unknown[]).length} slides · ${json.intent ?? ""}`,
        });
      }
    }

    if (key === "landing_page_architect") {
      const json = tryParseJson(detail);
      if (json?.hero_headline) {
        addCard({
          platform: "Landing Page",
          title: String(json.hero_headline),
          body: String(json.hero_subheadline ?? json.conversion_goal ?? detail),
          footer: String(json.primary_cta ?? "Learn more"),
          accent: "from-[#0f172a] via-[#1e293b] to-[#38bdf8]",
          visual: `${String(json.page_style ?? "page").toUpperCase()} · ${Array.isArray(json.sections) ? (json.sections as unknown[]).length : 0} sections`,
        });
      }
    }

    if (key === "dm_automation") {
      const json = tryParseJson(detail);
      if (json?.messages && Array.isArray(json.messages)) {
        const firstMsg = (json.messages as Array<{message?: string; trigger?: string}>)[0];
        addCard({
          platform: "DM Automation",
          title: `${json.platform ?? "DM"} sequence · ${(json.messages as unknown[]).length} messages`,
          body: firstMsg?.message ?? detail,
          footer: `${json.goal ?? "engagement"} · ${firstMsg?.trigger ?? "on trigger"}`,
          accent: "from-[#7c3aed] via-[#a855f7] to-[#e879f9]",
        });
      }
    }

    if (key === "squeeze_page") {
      const json = tryParseJson(detail);
      if (json?.headline) {
        addCard({
          platform: "Squeeze Page",
          title: String(json.headline),
          body: `${json.subheadline ?? ""}\n\n${Array.isArray(json.benefits) ? (json.benefits as string[]).slice(0, 3).join("\n") : ""}`,
          footer: String(json.cta_text ?? "Get access"),
          accent: "from-[#059669] via-[#10b981] to-[#6ee7b7]",
        });
      }
    }

    if (key === "lead_magnet") {
      const json = tryParseJson(detail);
      if (json?.title) {
        addCard({
          platform: "Lead Magnet",
          title: String(json.title),
          body: `${json.subtitle ?? ""}\n\n${Array.isArray(json.table_of_contents) ? (json.table_of_contents as Array<{title?: string}>).slice(0, 4).map((s) => `· ${s.title ?? ""}`).join("\n") : ""}`,
          footer: String(json.delivery_email?.subject ?? "Download guide"),
          accent: "from-[#d97706] via-[#f59e0b] to-[#fde68a]",
          visual: String(json.lead_magnet_type ?? "guide"),
        });
      }
    }

    if (key === "instagram_reels") {
      const json = tryParseJson(detail);
      if (json?.reels && Array.isArray(json.reels)) {
        const reel = (json.reels as Array<{intent?: string; hook_text?: string; hook_spoken?: string; script?: string; CTA?: string}>)[0];
        addCard({
          platform: "Reels",
          title: reel?.hook_text ?? "Instagram Reel",
          body: `${reel?.intent ?? "Reel"}\n\n${reel?.hook_spoken ?? ""}\n\n${(reel?.script ?? "").slice(0, 160)}`,
          footer: reel?.CTA ?? json.posting_rhythm ?? "See reel",
          accent: "from-[#f58529] via-[#dd2a7b] to-[#8134af]",
          visual: `${(json.reels as unknown[]).length} reels · ${json.posting_rhythm ?? ""}`,
        });
      }
    }

    if (key === "instagram_stories") {
      const json = tryParseJson(detail);
      if (json?.sequences && Array.isArray(json.sequences)) {
        const seq = (json.sequences as Array<{sequence_name?: string; frames?: Array<{headline?: string}>; final_cta?: string}>)[0];
        addCard({
          platform: "Stories",
          title: seq?.sequence_name ?? json.sequence_goal ?? "Story Sequence",
          body: `${json.sequence_type ?? "Sequence"}\n\n${seq?.frames?.slice(0, 3).map((f) => f.headline).join(" → ") ?? ""}`,
          footer: seq?.final_cta ?? "View sequence",
          accent: "from-[#f58529] via-[#dd2a7b] to-[#515bd4]",
          visual: `${json.total_frames ?? 5} frames · ${json.sequence_type ?? ""}`,
        });
      }
    }

    if (key === "facebook_ads") {
      const json = tryParseJson(detail);
      if (json?.ads && Array.isArray(json.ads)) {
        const coldAd = (json.ads as Array<{funnel_stage?: string; headline?: string; primary_text?: string; cta_button?: string; objection_addressed?: string}>).find((a) => a.funnel_stage === "COLD") ?? (json.ads as Array<{headline?: string; primary_text?: string; cta_button?: string; objection_addressed?: string}>)[0];
        addCard({
          platform: "Facebook Ads",
          title: coldAd?.headline ?? json.campaign_goal ?? "Ad Campaign",
          body: coldAd?.primary_text ?? detail,
          footer: coldAd?.cta_button ?? "See ads",
          accent: "from-[#0866ff] via-[#1877f2] to-[#42a5f5]",
          visual: `${(json.ads as unknown[]).length} ads · ${coldAd?.objection_addressed ?? ""}`,
        });
      }
    }

    if (key === "blog_writer") {
      const json = tryParseJson(detail);
      if (json?.title) {
        addCard({
          platform: "Blog Post",
          title: String(json.title),
          body: String(json.meta_description ?? (json.sections as Array<{body?: string}>)?.[0]?.body?.slice(0, 200) ?? detail.slice(0, 200)),
          footer: String(json.cta ?? `${(json.sections as unknown[] | undefined)?.length ?? 0} sections · ${json.read_time ?? ""}`),
          accent: "from-[#f59e0b] via-[#d97706] to-[#92400e]",
          visual: json.read_time ?? "Long-form article",
          sections: (json.sections as BlogSection[] | undefined) ?? [],
          tags: (json.tags as string[] | undefined) ?? [],
          seo_keywords: (json.seo_keywords as string[] | undefined) ?? [],
          hero_image_url: typeof json.hero_image_url === "string" ? json.hero_image_url : undefined,
          read_time: typeof json.read_time === "string" ? json.read_time : undefined,
          meta_description: typeof json.meta_description === "string" ? json.meta_description : undefined,
        });
      }
    }
  }

  return [...primaryCards.values(), ...provisionalCards.values()].slice(0, 9);
}

// ── Markdown renderer ─────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  // Bold **text** and inline code `text`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[13px] text-slate-700">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function MarkdownSection({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    nodes.push(
      <ul key={key} className="mt-2 space-y-1.5 pl-1">
        {listBuffer.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[14px] leading-6 text-slate-700">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^#{3,}\s+(.+)/);  // ### and #### both become h3
    const bullet = line.match(/^\s*[-*•]\s+(.+)/);  // allow indented bullets
    const numbered = line.match(/^\d+\.\s+(.+)/);
    const hr = line.trim() === "---" || line.trim() === "***" || line.trim() === "___";

    if (h1) {
      flushList(`fl-${i}`);
      nodes.push(
        <div key={i} className="mb-1 mt-6 flex items-center gap-3 first:mt-0">
          <span className="h-px flex-1 bg-slate-200" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">{h1[1]}</p>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
      );
    } else if (h2) {
      flushList(`fl-${i}`);
      nodes.push(
        <div key={i} className="mt-5 flex items-center gap-2.5 first:mt-0">
          <span className="h-3.5 w-0.5 rounded-full bg-slate-400" />
          <p className="font-[family:var(--font-heading)] text-[13px] font-semibold uppercase tracking-[0.28em] text-slate-800">{h2[1]}</p>
        </div>
      );
    } else if (h3) {
      flushList(`fl-${i}`);
      nodes.push(
        <p key={i} className="mt-4 text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-500 first:mt-0">{h3[1]}</p>
      );
    } else if (hr) {
      flushList(`fl-${i}`);
      nodes.push(<hr key={i} className="my-3 border-slate-200" />);
    } else if (bullet ?? numbered) {
      listBuffer.push((bullet?.[1] ?? numbered?.[1]) ?? line);
    } else if (line.trim() === "") {
      flushList(`fl-${i}`);
    } else if (line.trim()) {
      flushList(`fl-${i}`);
      nodes.push(
        <p key={i} className="text-[14px] leading-7 text-slate-700">{renderInline(line)}</p>
      );
    }
  });

  flushList("fl-end");
  return <>{nodes}</>;
}

function SynthesisOutput({ text }: { text: string }) {
  // Split on ## headers to create collapsible sections
  const sections = text.split(/(?=^##\s)/m);
  const intro = sections[0] ?? "";
  const rest = sections.slice(1);

  return (
    <div className="mt-5 space-y-4">
      {intro.trim() && (
        <div className="rounded-[1.2rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <MarkdownSection text={intro.trim()} />
        </div>
      )}
      {rest.map((section, i) => {
        const titleMatch = section.match(/^##\s+(.+)/m);
        const title = titleMatch?.[1] ?? `Section ${i + 1}`;
        const body = section.replace(/^##\s+.+\n?/, "").trim();
        return (
          <details key={i} open className="group rounded-[1.2rem] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 select-none">
              <div className="flex items-center gap-2.5">
                <span className="h-3.5 w-0.5 rounded-full bg-slate-400 group-open:bg-slate-600" />
                <span className="font-[family:var(--font-heading)] text-[13px] font-semibold uppercase tracking-[0.28em] text-slate-800">{title}</span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400 group-open:hidden">Show</span>
              <span className="hidden text-[10px] uppercase tracking-[0.22em] text-slate-400 group-open:block">Collapse</span>
            </summary>
            <div className="border-t border-slate-100 px-5 py-4">
              <MarkdownSection text={body} />
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function JarvisCommandCenter() {
  const [bootPhase, setBootPhase] = useState<"idle" | "booting" | "ready">("idle");
  const [connectorChargeCount, setConnectorChargeCount] = useState(0);
  const [executiveRevealCount, setExecutiveRevealCount] = useState(0);
  const [selectedExecutive, setSelectedExecutive] = useState<ExecutiveKey | null>(null);
  const [command, setCommand] = useState(QUICK_COMMANDS[0] ?? "");
  const [phase, setPhase] = useState<"idle" | "busy" | "error">("idle");
  const [responseText, setResponseText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subAgents, setSubAgents] = useState(createInitialSubAgents);
  const [selectedSubAgents, setSelectedSubAgents] = useState<SubAgentKey[]>([]);
  const [subAgentsVisible, setSubAgentsVisible] = useState(false);
  const [routeMeta, setRouteMeta] = useState<RouteMeta | null>(null);
  const [providerMeta, setProviderMeta] = useState<ProviderMeta | null>(null);
  const [synthesisView, setSynthesisView] = useState<SynthesisView>("preview");
  const [copiedArtifactId, setCopiedArtifactId] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioState, setAudioState] = useState<"idle" | "arming" | "live" | "blocked">("idle");

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRequestRef = useRef<{ controller: AbortController; token: number } | null>(null);
  const requestTokenRef = useRef(0);

  const selectedExecutiveMeta = useMemo(
    () => EXECUTIVES.find((entry) => entry.key === selectedExecutive) ?? null,
    [selectedExecutive],
  );
  const previewCards = useMemo(
    () => buildPreviewCards(subAgents, selectedSubAgents),
    [selectedSubAgents, subAgents],
  );
  const artifactJsx = useMemo(
    () =>
      buildArtifactJsx({
        command,
        executiveLabel: selectedExecutiveMeta?.label ?? "AI CEO",
        routeMeta,
        responseText,
        previewCards,
      }),
    [command, previewCards, responseText, routeMeta, selectedExecutiveMeta],
  );
  const specialistArtifacts = useMemo(
    () => buildSpecialistArtifacts(subAgents, selectedSubAgents),
    [selectedSubAgents, subAgents],
  );

  useEffect(() => {
    if (!selectedExecutive) return;
    const quickCommands = EXECUTIVE_COMMANDS[selectedExecutive];
    setCommand((current) => current || quickCommands[0] || "");
  }, [selectedExecutive]);

  useEffect(() => {
    if (!routeMeta) return;
    const executive = DEPARTMENT_TO_EXECUTIVE[routeMeta.department];
    if (executive) {
      setSelectedExecutive(executive);
    }
  }, [routeMeta]);

  useEffect(() => {
    if (bootPhase !== "booting") return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    setConnectorChargeCount(0);
    setExecutiveRevealCount(0);
    setSelectedExecutive(null);
    setSubAgentsVisible(false);

    EXECUTIVES.forEach((_, index) => {
      const chargeAt = CORE_CONNECTOR_DELAY_MS + index * PER_EXECUTIVE_DELAY_MS;

      timers.push(
        setTimeout(() => {
          setConnectorChargeCount(index + 1);
        }, chargeAt),
      );

      timers.push(
        setTimeout(() => {
          setExecutiveRevealCount(index + 1);
        }, chargeAt + EXECUTIVE_APPEAR_OFFSET_MS),
      );
    });

    timers.push(
      setTimeout(() => {
        setBootPhase("ready");
        setSelectedExecutive(null);
      }, CORE_CONNECTOR_DELAY_MS + EXECUTIVES.length * PER_EXECUTIVE_DELAY_MS + PANEL_REVEAL_DELAY_MS),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [bootPhase]);

  useEffect(() => {
    return () => {
      activeRequestRef.current?.controller.abort();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      mediaSourceRef.current?.disconnect();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      analyserRef.current?.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
      }
    };
  }, []);

  async function armStageInput() {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setAudioState("blocked");
      return;
    }

    if (audioState === "live") {
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
      return;
    }

    try {
      setAudioState("arming");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioContextCtor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        setAudioState("blocked");
        return;
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaSourceRef.current?.disconnect();
      analyserRef.current?.disconnect();

      const context = audioContextRef.current ?? new AudioContextCtor();
      audioContextRef.current = context;
      if (context.state === "suspended") {
        await context.resume();
      }

      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      mediaStreamRef.current = stream;
      mediaSourceRef.current = source;
      analyserRef.current = analyser;

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let smoothedLevel = 0;

      const tick = () => {
        const activeAnalyser = analyserRef.current;
        if (!activeAnalyser) return;

        activeAnalyser.getByteFrequencyData(buffer);
        let sum = 0;
        let peak = 0;
        for (let index = 0; index < buffer.length; index += 1) {
          const normalized = buffer[index] / 255;
          sum += normalized * normalized;
          if (normalized > peak) peak = normalized;
        }

        const rms = Math.sqrt(sum / buffer.length);
        const boosted = Math.max(0, (rms - 0.028) * 6.8 + Math.max(0, peak - 0.16) * 1.85);
        const targetLevel = Math.min(1, Math.pow(boosted, 0.78));
        smoothedLevel = Math.max(targetLevel, smoothedLevel * 0.88);
        setAudioLevel(smoothedLevel);
        rafRef.current = window.requestAnimationFrame(tick);
      };

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = window.requestAnimationFrame(tick);
      setAudioState("live");
    } catch {
      setAudioState("blocked");
    }
  }

  async function runCommand() {
    const trimmed = command.trim();
    if (!trimmed) return;

    await startRun({
      intent: trimmed,
      executive: selectedExecutive,
      rootInitiated: !selectedExecutive,
      retryCount: 0,
    });
  }

  function resetRunState() {
    setPhase("idle");
    setErrorMessage(null);
    setResponseText("");
    setSynthesisView("preview");
    setCopiedArtifactId(null);
    setActivePreview(null);
    setRouteMeta(null);
    setProviderMeta(null);
    setSelectedSubAgents([]);
    setSubAgentsVisible(false);
    setSubAgents(createInitialSubAgents());
  }

  async function startRun(params: RunParams) {
    activeRequestRef.current?.controller.abort();

    const controller = new AbortController();
    const token = requestTokenRef.current + 1;
    requestTokenRef.current = token;
    activeRequestRef.current = { controller, token };
    let scheduledRetry: RunParams | null = null;

    setPhase("busy");
    setErrorMessage(null);
    setResponseText("");
    setSynthesisView("preview");
    setCopiedArtifactId(null);
    setActivePreview(null);
    setRouteMeta(null);
    setProviderMeta(null);
    setSelectedSubAgents([]);
    setSubAgentsVisible(true);
    setSubAgents(createInitialSubAgents());

    try {
      const res = await fetch(`${API_BASE}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params.executive ? { intent: params.intent, executive: params.executive } : { intent: params.intent }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let detail = await res.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: unknown };
          if (typeof parsed.detail === "string") detail = parsed.detail;
        } catch {
          /* use raw text */
        }
        throw new Error(detail || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body to read.");

      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";
      let streamedSelectedAgents: SubAgentKey[] = [];
      let inferredExecutive: ExecutiveKey | null = params.executive;

      const applyEvent = (event: StreamPayload) => {
        if (requestTokenRef.current !== token) return;
        if (event.error) throw new Error(event.error);

        if (event.meta) {
          if (event.meta.route) {
            const route = event.meta.route;
            const selected = route.selected_agents
              .map((key) => coerceSubAgentKey(key))
              .filter((key): key is SubAgentKey => key !== null);
            streamedSelectedAgents = selected;
            inferredExecutive = DEPARTMENT_TO_EXECUTIVE[route.department] ?? inferredExecutive;
            startTransition(() => {
              setRouteMeta(route);
              setSelectedSubAgents(selected);
              setSubAgents(applyRouteSelection(route));
            });
          }

          if (event.meta.provider) {
            startTransition(() => {
              setProviderMeta(event.meta?.provider ?? null);
            });
          }

          if (
            event.meta.lifecycle &&
            params.rootInitiated &&
            params.retryCount < 1 &&
            event.meta.lifecycle.agent === "market_research" &&
            event.meta.lifecycle.status === "error" &&
            event.meta.lifecycle.detail.toLowerCase().includes("timed out")
          ) {
            scheduledRetry = {
              intent: params.intent,
              executive: inferredExecutive,
              rootInitiated: false,
              retryCount: params.retryCount + 1,
            };
            startTransition(() => {
              setErrorMessage("Market research timed out. Retrying once with the routed executive lane.");
            });
            controller.abort();
            return;
          }

          if (event.meta.lifecycle) {
            startTransition(() => {
              setSubAgents((current) => updateSubAgentLifecycle(current, event.meta!.lifecycle!));
            });
          }

          if (event.meta.validation && !event.meta.validation.valid) {
            const invalidKey = coerceSubAgentKey(event.meta.validation.agent);
            if (invalidKey) {
              startTransition(() => {
                setSubAgents((current) => ({
                  ...current,
                  [invalidKey]: {
                    status: "error",
                    detail: event.meta!.validation!.detail,
                  },
                }));
              });
            }
          }
        }

        if (event.update && typeof event.update === "object") {
          const nodeKey = getPrimaryUpdateNode(event.update);
          const delta = assistantTextFromUpdate(event.update);
          const subAgentKey = nodeKey ? coerceSubAgentKey(nodeKey) : null;

          if (delta && subAgentKey) {
            startTransition(() => {
              setSubAgents((current) => updateSubAgentFromText(current, subAgentKey, delta));
            });
          } else if (delta) {
            assembled += (assembled ? "\n\n" : "") + delta;
            startTransition(() => {
              setResponseText(assembled);
            });
          }
        }

        if (event.done) {
          startTransition(() => {
            setSubAgents((current) => {
              const next = { ...current };
              const completionKeys = streamedSelectedAgents.length > 0 ? streamedSelectedAgents : (Object.keys(next) as SubAgentKey[]);
              completionKeys.forEach((key) => {
                if (next[key].status === "active" || next[key].status === "queued") {
                  next[key] = { status: "synthesized", detail: next[key].detail };
                }
              });
              return next;
            });
            setPhase("idle");
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const { events, rest } = parseCompleteSseBlocks(buffer);
        buffer = rest;

        for (const event of events) {
          applyEvent(event);
        }

        if (done) break;
      }

      for (const event of parseTrailingBuffer(buffer)) {
        applyEvent(event);
      }

      if (scheduledRetry) {
        await startRun(scheduledRetry);
        return;
      }

      if (requestTokenRef.current === token) {
        setPhase("idle");
      }
    } catch (error) {
      if (scheduledRetry) {
        await startRun(scheduledRetry);
        return;
      }

      if (controller.signal.aborted) {
        if (requestTokenRef.current === token) {
          setPhase("idle");
        }
        return;
      }

      if (requestTokenRef.current === token) {
        setPhase("error");
        setErrorMessage(error instanceof Error ? error.message : "Request failed");
      }
    }
  }

  async function copyArtifact(id: string, code: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(code);
    setCopiedArtifactId(id);
    window.setTimeout(() => {
      setCopiedArtifactId((current) => (current === id ? null : current));
    }, 1800);
  }

  function downloadArtifact(filename: string, code: string) {
    if (typeof window === "undefined") return;
    const blob = new Blob([code], { type: "text/jsx;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  const busy = phase === "busy";
  const executivesOpen = executiveRevealCount > 0;
  const booting = bootPhase === "booting";
  const panelUnlocked = bootPhase === "ready";
  const coreShellHidden = panelUnlocked;
  const reactiveLevel = Math.min(1, Math.pow(audioLevel, 0.82) * 3.1);
  const stageEnergy = Math.min(
    1,
    Math.max(
      reactiveLevel,
      booting
        ? 0.32 + connectorChargeCount * 0.17 + executiveRevealCount * 0.07
        : panelUnlocked
          ? 0.28
          : 0.14,
    ),
  );
  const shellStyle = {
    "--jarvis-reactive": `${reactiveLevel}`,
    "--jarvis-stage-energy": `${stageEnergy}`,
  } as CSSProperties;
  const neuralNodes = [
    { top: "9%", left: "22%", delay: "0s" },
    { top: "20%", left: "74%", delay: "0.3s" },
    { top: "48%", left: "14%", delay: "0.8s" },
    { top: "60%", left: "84%", delay: "0.45s" },
    { top: "80%", left: "27%", delay: "1s" },
    { top: "86%", left: "68%", delay: "0.6s" },
  ] as const;
  const visibleExecutives = selectedExecutive ? EXECUTIVES.filter((entry) => entry.key === selectedExecutive) : EXECUTIVES;
  const activePlaceholder = selectedExecutive ? EXECUTIVE_PLACEHOLDERS[selectedExecutive] : ROOT_PLACEHOLDER;

  return (
    <main className="jarvis-shell min-h-screen overflow-hidden bg-[var(--jarvis-bg)] text-white" style={shellStyle}>
      <div className="jarvis-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="jarvis-glow jarvis-glow-left pointer-events-none absolute left-1/2 top-16 -translate-x-[22rem]" aria-hidden />
      <div className="jarvis-glow jarvis-glow-right pointer-events-none absolute left-1/2 top-8 translate-x-[8rem]" aria-hidden />
      <div className="jarvis-stars pointer-events-none absolute inset-0 opacity-50" aria-hidden />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="flex w-full flex-1 flex-col items-center justify-start gap-8">
          <div className="mb-2 flex flex-col items-center gap-2 text-center">
            <p className="font-[family:var(--font-heading)] text-4xl font-semibold uppercase tracking-[0.42em] text-[var(--jarvis-cyan)] [text-shadow:0_0_24px_rgba(86,255,241,0.18)] sm:text-6xl">
              AI CEO
            </p>
            <p className="max-w-md text-[11px] uppercase tracking-[0.32em] text-white/28">
              {bootPhase === "idle"
                ? "Executive command intelligence dormant"
                : booting
                  ? "Mechanical shell unfolding outward"
                  : selectedExecutive
                    ? `${selectedExecutive.toUpperCase()} focus lane engaged`
                    : "Executive lattice is live"}
            </p>
          </div>

          <div className="relative w-full max-w-[62rem]">
            <div className={`jarvis-core-stage relative flex h-[30rem] w-full items-center justify-center ${coreShellHidden ? "is-dissolving" : ""}`}>
              {neuralNodes.map((node, index) => (
                <div
                  key={`${node.top}-${node.left}`}
                  className="absolute h-3.5 w-3.5 rounded-full border border-[var(--jarvis-line)] bg-[rgba(86,255,241,0.18)] shadow-[0_0_18px_rgba(86,255,241,0.4)] jarvis-neuron-node"
                  style={{ top: node.top, left: node.left, animationDelay: node.delay }}
                  aria-hidden
                >
                  <span
                    className="absolute left-1/2 top-1/2 h-px w-24 origin-left -translate-y-1/2 bg-[linear-gradient(90deg,rgba(86,255,241,0.45),rgba(86,255,241,0))] opacity-65"
                    style={{ transform: `translateY(-50%) rotate(${index * 57}deg)` }}
                  />
                </div>
              ))}

              <button
                type="button"
                aria-label={bootPhase === "idle" ? "Open executive agents" : "Collapse executive agents"}
                onClick={() => {
                  if (bootPhase === "idle") {
                    void armStageInput();
                    setPhase("idle");
                    setErrorMessage(null);
                    setBootPhase("booting");
                    return;
                  }

                  activeRequestRef.current?.controller.abort();
                  setBootPhase("idle");
                  setConnectorChargeCount(0);
                  setExecutiveRevealCount(0);
                  setSelectedExecutive(null);
                  resetRunState();
                }}
                className={`jarvis-transform-shell group relative z-10 flex h-[23rem] w-[23rem] items-center justify-center overflow-hidden rounded-[3rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(86,255,241,0.12),rgba(5,10,16,0.84)_58%,rgba(5,10,16,0.96))] transition duration-500 hover:scale-[1.02] ${
                  booting ? "is-booting" : bootPhase === "ready" ? "is-awake" : ""
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(86,255,241,0.18),transparent_62%)] blur-3xl" />
                <div className="jarvis-shell-plate jarvis-shell-plate-outer absolute inset-[6%] rounded-[2.6rem]" />
                <div className="jarvis-shell-plate jarvis-shell-plate-middle absolute inset-[8%] rounded-[2.4rem]" />
                <div className="jarvis-shell-plate jarvis-shell-plate-inner absolute inset-[10%] rounded-[2.15rem]" />
                <div className="jarvis-shell-corner jarvis-shell-corner-tl" />
                <div className="jarvis-shell-corner jarvis-shell-corner-tr" />
                <div className="jarvis-shell-corner jarvis-shell-corner-bl" />
                <div className="jarvis-shell-corner jarvis-shell-corner-br" />
                <div className="jarvis-core-well absolute inset-[10%] overflow-hidden rounded-[2.15rem] border border-white/8 bg-black/35 shadow-[inset_0_0_55px_rgba(86,255,241,0.08)]">
                  <div className="jarvis-core-panel jarvis-core-panel-top" />
                  <div className="jarvis-core-panel jarvis-core-panel-right" />
                  <div className="jarvis-core-panel jarvis-core-panel-bottom" />
                  <div className="jarvis-core-panel jarvis-core-panel-left" />
                  <div className="jarvis-core-seam jarvis-core-seam-horizontal" />
                  <div className="jarvis-core-seam jarvis-core-seam-vertical" />
                  <div className="jarvis-core-backdrop absolute inset-0" />
                  <JarvisCoreCanvas energy={stageEnergy} audioLevel={reactiveLevel} listening={audioState === "live"} />
                </div>
                <div className="absolute inset-x-[16%] top-[13%] h-px bg-[linear-gradient(90deg,transparent,rgba(86,255,241,0.7),transparent)] opacity-65" />
                <div className="relative z-10 mt-[18.6rem] flex flex-col items-center gap-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.62em] text-white/38">
                    {bootPhase === "idle"
                      ? "Tap to deploy executive grid"
                      : booting
                        ? "Transforming command shell"
                        : "Tap again to collapse lattice"}
                  </p>
                </div>
              </button>

              <div className={`jarvis-connector-shell ${executivesOpen ? "opacity-100" : "opacity-0"}`} aria-hidden>
                <svg viewBox="0 0 1000 230" className="h-full w-full" preserveAspectRatio="none">
                  {CONNECTOR_PATHS.map((path, index) => (
                    <g key={path}>
                      <path d={path} pathLength={100} className="jarvis-connector-path" />
                      <path
                        d={path}
                        pathLength={100}
                        className={`jarvis-connector-halo ${index < connectorChargeCount ? "is-charged" : ""}`}
                        style={{
                          animationDelay: `${index * PER_EXECUTIVE_DELAY_MS}ms`,
                          strokeWidth: `${7 + stageEnergy * 10}px`,
                          opacity: 0.2 + reactiveLevel * 0.32,
                        }}
                      />
                      <path
                        d={path}
                        pathLength={100}
                        className={`jarvis-connector-charge ${index < connectorChargeCount ? "is-charged" : ""}`}
                        style={{
                          animationDelay: `${index * PER_EXECUTIVE_DELAY_MS}ms`,
                          strokeWidth: `${2.6 + stageEnergy * 3.4}px`,
                          opacity: 0.54 + reactiveLevel * 0.42,
                        }}
                      />
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div className={`jarvis-executive-stage ${panelUnlocked ? "is-live" : ""} ${selectedExecutive ? "is-focused" : ""}`}>
              <div className="jarvis-main-grid">
                {(panelUnlocked ? visibleExecutives : executivesOpen ? EXECUTIVES.slice(0, executiveRevealCount) : []).map((executive, index) => {
                  const active = executive.key === selectedExecutive;
                  const meta = EXECUTIVE_META[executive.key];
                  return (
                    <button
                      key={executive.key}
                      type="button"
                      onClick={() => setSelectedExecutive(executive.key)}
                      className={`jarvis-executive-reveal jarvis-main-card text-left ${
                        active
                          ? "is-focused border-[var(--jarvis-cyan)] text-white shadow-[0_0_28px_rgba(86,255,241,0.14)]"
                          : "border-white/10 text-white/55 hover:border-white/25 hover:text-white"
                      }`}
                      style={{
                        animationDelay: `${index * 90}ms`,
                        background: active ? `radial-gradient(circle at top left, ${meta.color}, transparent 65%)` : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="block font-[family:var(--font-heading)] text-lg font-semibold uppercase tracking-[0.38em]">
                          {executive.label}
                        </span>
                        {active && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--jarvis-cyan)] shadow-[0_0_8px_rgba(86,255,241,0.8)]" />}
                      </div>
                      <span className="mt-1.5 block text-[10px] uppercase tracking-[0.28em] text-white/34">
                        {executive.role}
                      </span>
                      <span className="mt-3 block border-t border-white/8 pt-3 text-[10px] leading-5 tracking-[0.14em] text-white/40">
                        {meta.desc}
                      </span>
                      <span className="mt-2 block text-[9px] uppercase tracking-[0.24em] text-white/28">
                        {meta.agents}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {booting ? (
            <section className="jarvis-panel w-full max-w-4xl px-5 py-6 sm:px-7">
              <div className="flex flex-col gap-5 text-center sm:text-left">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.34em] text-[var(--jarvis-cyan)]">Neural boot</p>
                    <p className="mt-2 text-sm uppercase tracking-[0.34em] text-white/45">
                      Charging connectors and releasing executive lanes
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 self-center sm:self-auto">
                    <button type="button" onClick={() => void armStageInput()} className="jarvis-boot-pill">
                      <Mic className="h-3.5 w-3.5" />
                      {audioState === "live"
                        ? `Stage mic live ${Math.round(reactiveLevel * 100)}%`
                        : audioState === "arming"
                          ? "Arming stage mic"
                          : audioState === "blocked"
                            ? "Mic permission blocked"
                            : "Arm stage mic"}
                    </button>
                    <div className="jarvis-boot-pill">
                      <span className="jarvis-boot-dot" aria-hidden />
                      Boot sequence in progress
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  {EXECUTIVES.map((executive, index) => {
                    const ready = index < executiveRevealCount;
                    const charged = !ready && index < connectorChargeCount;
                    const phaseLabel = ready ? "Lane online" : charged ? "Connector charged" : "Awaiting release";

                    return (
                      <div
                        key={executive.key}
                        className={`rounded-[1.35rem] border px-4 py-4 text-left transition-all duration-500 ${
                          ready
                            ? "border-[var(--jarvis-cyan)]/30 bg-[rgba(86,255,241,0.07)] shadow-[0_0_20px_rgba(86,255,241,0.08)]"
                            : charged
                              ? "border-white/15 bg-white/[0.04]"
                              : "border-white/8 bg-black/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-[family:var(--font-heading)] text-sm uppercase tracking-[0.26em] text-white/78">
                            {executive.label}
                          </p>
                          <span
                            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${ready ? "bg-[var(--jarvis-cyan)] shadow-[0_0_8px_rgba(86,255,241,0.6)]" : charged ? "bg-white/30" : "bg-white/12"}`}
                          />
                        </div>
                        <p className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-white/30">{executive.role}</p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-white/38">{phaseLabel}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {panelUnlocked && selectedExecutiveMeta ? (
            <section className="jarvis-panel w-full max-w-4xl px-5 py-5 sm:px-7">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.34em] text-[var(--jarvis-cyan)]">{selectedExecutiveMeta.label}</p>
                    <p className="mt-2 text-sm uppercase tracking-[0.34em] text-white/45">{selectedExecutiveMeta.role} orchestration lane</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/42 sm:flex">
                      <Mic className="h-3.5 w-3.5" />
                      {audioState === "live"
                        ? `Voice reactive ${Math.round(reactiveLevel * 100)}%`
                        : audioState === "blocked"
                          ? "Mic blocked"
                          : "Manual or voice-ready"}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        activeRequestRef.current?.controller.abort();
                        setSelectedExecutive(null);
                        resetRunState();
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/58 transition hover:border-white/25 hover:text-white"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to lattice
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(selectedExecutive ? EXECUTIVE_COMMANDS[selectedExecutive] : QUICK_COMMANDS).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCommand(item)}
                      disabled={busy}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/58 transition hover:border-[var(--jarvis-cyan)] hover:text-white disabled:opacity-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-4 sm:p-5">
                  <textarea
                    value={command}
                    onChange={(event) => setCommand(event.target.value)}
                    disabled={busy}
                    placeholder={activePlaceholder}
                    className="min-h-28 w-full resize-none bg-transparent font-[family:var(--font-heading)] text-xl leading-8 tracking-[0.06em] text-white outline-none placeholder:text-white/26"
                  />

                  <div className="mt-4 flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/35">Command box is live</p>
                    <button
                      type="button"
                      onClick={() => void runCommand()}
                      disabled={busy || !command.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--jarvis-cyan)] bg-[var(--jarvis-cyan)] px-5 py-3 text-sm font-medium uppercase tracking-[0.24em] text-[var(--jarvis-bg)] transition hover:bg-white disabled:cursor-not-allowed disabled:border-white/12 disabled:bg-white/10 disabled:text-white/35"
                    >
                      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                      {busy ? "Deploying" : `Run ${selectedExecutiveMeta.label}`}
                    </button>
                  </div>
                </div>

                {routeMeta ? <RouteTelemetry route={routeMeta} provider={providerMeta} /> : null}

                {subAgentsVisible ? <CmoBranchTree rootLabel={selectedExecutiveMeta.label} subAgents={subAgents} selectedKeys={selectedSubAgents} /> : null}

                {/* ── Platform outputs hero ── */}
                <section className="rounded-[1.75rem] border border-[#ddd5c7] bg-[#fbf8f2] p-5 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-300/70 pb-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">Platform outputs · live renders</p>
                      <p className="mt-2 font-[family:var(--font-heading)] text-lg uppercase tracking-[0.14em] text-slate-900">Generated channel deliverables</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {previewCards.length > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {previewCards.length} ready
                        </span>
                      )}
                      {busy && (
                        <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-700">
                          <LoaderCircle className="h-3 w-3 animate-spin" />
                          Generating
                        </span>
                      )}
                    </div>
                  </div>
                  {previewCards.length > 0 ? (
                    <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {previewCards.map((card, index) => (
                        <PreviewCard
                          key={`${card.platform}-${card.title}-${index}`}
                          card={card}
                          index={index}
                          onOpen={() => setActivePreview({ card, index })}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 flex min-h-56 items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 px-6 text-center">
                      <div>
                        {busy && (
                          <div className="mb-4 flex justify-center gap-2">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "0ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "150ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "300ms" }} />
                          </div>
                        )}
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                          {busy
                            ? "Specialists generating platform outputs now"
                            : "Run a command to see LinkedIn, Instagram, email and more"}
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* ── Synthesis ── */}
                <section className="rounded-[1.75rem] border border-[#ddd5c7] bg-[#f7f3eb] p-5 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-300/70 pb-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">AI synthesis · full output</p>
                      <p className="mt-2 font-[family:var(--font-heading)] text-lg uppercase tracking-[0.14em] text-slate-900">Executive briefing</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="jarvis-artifact-tabs">
                        <button
                          type="button"
                          onClick={() => setSynthesisView("preview")}
                          className={`jarvis-artifact-tab ${synthesisView === "preview" ? "is-active" : ""}`}
                        >
                          Read
                        </button>
                        <button
                          type="button"
                          onClick={() => setSynthesisView("jsx")}
                          className={`jarvis-artifact-tab ${synthesisView === "jsx" ? "is-active" : ""}`}
                        >
                          artifact.jsx
                        </button>
                      </div>
                      <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        {busy ? "Streaming" : "Ready"}
                      </span>
                    </div>
                  </div>

                  {synthesisView === "jsx" ? (
                    <div className="mt-5 space-y-4">
                      <ArtifactCodePanel
                        artifactId="main-artifact"
                        title="Generated component"
                        subtitle={routeMeta?.project_type ?? "jarvis-output"}
                        filename={artifactFilename(routeMeta?.template_key ?? (command || "artifact"))}
                        code={artifactJsx}
                        copied={copiedArtifactId === "main-artifact"}
                        onCopy={copyArtifact}
                        onDownload={downloadArtifact}
                      />

                      {specialistArtifacts.length > 0 ? (
                        <div className="grid gap-4 xl:grid-cols-2">
                          {specialistArtifacts.map((artifact) => (
                            <ArtifactCodePanel
                              key={artifact.id}
                              artifactId={artifact.id}
                              title={artifact.label}
                              subtitle={`${artifact.status} specialist artifact`}
                              filename={artifact.filename}
                              code={artifact.code}
                              compact
                              copied={copiedArtifactId === artifact.id}
                              onCopy={copyArtifact}
                              onDownload={downloadArtifact}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : responseText ? (
                    <SynthesisOutput text={responseText} />
                  ) : (
                    <div className="mt-5 flex min-h-56 items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 px-6 text-center text-sm uppercase tracking-[0.24em] text-slate-400">
                      Awaiting synthesis from the {selectedExecutiveMeta.label} lane
                    </div>
                  )}
                </section>

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                ) : null}

                {activePreview ? (
                  <PreviewLightbox
                    card={activePreview.card}
                    index={activePreview.index}
                    onClose={() => setActivePreview(null)}
                  />
                ) : null}
              </div>
            </section>
          ) : panelUnlocked ? (
            <section className="jarvis-panel w-full max-w-4xl px-5 py-5 sm:px-7">
              <div className="space-y-6">
                <div className="text-center sm:text-left">
                  <p className="text-xs uppercase tracking-[0.34em] text-[var(--jarvis-cyan)]">AI CEO routing live</p>
                  <p className="mt-3 text-sm uppercase tracking-[0.26em] text-white/42">
                    Give one command and Jarvis will choose the right executive lane and specialist chain.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {QUICK_COMMANDS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCommand(item)}
                      disabled={busy}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/58 transition hover:border-[var(--jarvis-cyan)] hover:text-white disabled:opacity-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-4 sm:p-5">
                  <textarea
                    value={command}
                    onChange={(event) => setCommand(event.target.value)}
                    disabled={busy}
                    placeholder={activePlaceholder}
                    className="min-h-28 w-full resize-none bg-transparent font-[family:var(--font-heading)] text-xl leading-8 tracking-[0.06em] text-white outline-none placeholder:text-white/26"
                  />

                  <div className="mt-4 flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/35">Auto-routing enabled across CMO, CRO, COO, and CFO</p>
                    <button
                      type="button"
                      onClick={() => void runCommand()}
                      disabled={busy || !command.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--jarvis-cyan)] bg-[var(--jarvis-cyan)] px-5 py-3 text-sm font-medium uppercase tracking-[0.24em] text-[var(--jarvis-bg)] transition hover:bg-white disabled:cursor-not-allowed disabled:border-white/12 disabled:bg-white/10 disabled:text-white/35"
                    >
                      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                      {busy ? "Routing" : "Run AI CEO"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function ArtifactCodePanel({
  artifactId,
  title,
  subtitle,
  filename,
  code,
  copied,
  compact = false,
  onCopy,
  onDownload,
}: {
  artifactId: string;
  title: string;
  subtitle: string;
  filename: string;
  code: string;
  copied: boolean;
  compact?: boolean;
  onCopy: (id: string, code: string) => Promise<void>;
  onDownload: (filename: string, code: string) => void;
}) {
  const lines = code.split("\n");

  return (
    <div className={`jarvis-artifact-code-wrap ${compact ? "is-compact" : ""}`}>
      <div className="jarvis-artifact-code-head">
        <div>
          <span>{title}</span>
          <span className="jarvis-artifact-code-subtitle">{subtitle}</span>
        </div>
        <div className="jarvis-artifact-actions">
          <button type="button" className="jarvis-artifact-action" onClick={() => void onCopy(artifactId, code)}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" className="jarvis-artifact-action" onClick={() => onDownload(filename, code)}>
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>
      <div className="jarvis-artifact-code-filename">{filename}</div>
      <div className="jarvis-artifact-code">
        {lines.map((line, index) => (
          <div key={`${artifactId}-${index}`} className="jarvis-artifact-line">
            <span className="jarvis-artifact-line-number">{index + 1}</span>
            <code className="jarvis-artifact-line-code">
              {highlightCodeLine(line).map((token, tokenIndex) => (
                <span key={`${artifactId}-${index}-${tokenIndex}`} className={`jarvis-token is-${token.kind}`}>
                  {token.text || " "}
                </span>
              ))}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

function CmoBranchTree({
  rootLabel,
  subAgents,
  selectedKeys,
}: {
  rootLabel: string;
  subAgents: Record<SubAgentKey, SubAgentState>;
  selectedKeys: SubAgentKey[];
}) {
  const orderedKeys = selectedKeys.length > 0 ? selectedKeys : [];
  const activeCount = orderedKeys.filter((k) => subAgents[k].status === "active").length;
  const doneCount = orderedKeys.filter((k) => subAgents[k].status === "synthesized").length;
  const errorCount = orderedKeys.filter((k) => subAgents[k].status === "error").length;
  const queuedCount = orderedKeys.filter((k) => subAgents[k].status === "queued").length;
  const progress =
    orderedKeys.length > 0 ? Math.round(((doneCount + errorCount) / orderedKeys.length) * 100) : 0;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/38 shadow-[0_0_80px_rgba(86,255,241,0.04)]">
      {/* Mission header */}
      <div className="relative border-b border-white/8 bg-[linear-gradient(135deg,rgba(86,255,241,0.06),transparent_60%)] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              {activeCount > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--jarvis-cyan)] opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--jarvis-cyan)]" />
                </span>
              )}
              <p className="font-[family:var(--font-heading)] text-xs uppercase tracking-[0.38em] text-[var(--jarvis-cyan)]">
                {activeCount > 0
                  ? `${activeCount} agent${activeCount > 1 ? "s" : ""} running in parallel`
                  : doneCount === orderedKeys.length && orderedKeys.length > 0
                    ? "Mission complete"
                    : `${rootLabel} core`}
              </p>
            </div>
            <p className="mt-1.5 text-[13px] text-white/50">
              {orderedKeys.length} specialists deployed
              {activeCount > 0
                ? ` · ${activeCount} generating simultaneously`
                : doneCount > 0
                  ? ` · ${doneCount} outputs delivered`
                  : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--jarvis-cyan)]/30 bg-[var(--jarvis-cyan)]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[var(--jarvis-cyan)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--jarvis-cyan)]" />
                {activeCount} active
              </span>
            )}
            {doneCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-emerald-400">
                <Check className="h-3 w-3" />
                {doneCount} done
              </span>
            )}
            {queuedCount > 0 && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/38">
                {queuedCount} queued
              </span>
            )}
          </div>
        </div>
        {orderedKeys.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/30">
              <span>Mission progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--jarvis-cyan)] to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${Math.max(progress, activeCount > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Agent grid */}
      {orderedKeys.length > 0 ? (
        <div className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {orderedKeys.map((key, index) => {
              const meta = SUB_AGENT_META[key];
              const state = subAgents[key];
              const isActive = state.status === "active";
              const isDone = state.status === "synthesized";
              const isError = state.status === "error";
              const preview =
                isDone && state.detail && state.detail.length > 10
                  ? (jsonFirstPreview(state.detail) ??
                    state.detail
                      .replace(/^[A-Z][A-Za-z ]+:\n/gm, "")
                      .trim()
                      .slice(0, 100)
                      .replace(/\n/g, " "))
                  : null;

              return (
                <article
                  key={key}
                  className={`jarvis-executive-reveal relative overflow-hidden rounded-[1.35rem] border p-3.5 transition-all duration-500 ${
                    isActive
                      ? "border-[var(--jarvis-cyan)]/35 bg-[rgba(86,255,241,0.05)] shadow-[0_0_28px_rgba(86,255,241,0.08),inset_0_0_0_1px_rgba(86,255,241,0.06)]"
                      : isDone
                        ? "border-emerald-500/25 bg-emerald-950/20"
                        : isError
                          ? "border-red-500/18 bg-red-950/15"
                          : "border-white/7 bg-white/[0.02]"
                  }`}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  {isActive && (
                    <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_top_left,rgba(86,255,241,0.07),transparent_65%)]" />
                  )}
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <AgentGlyph agentKey={key} />
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.24em] text-white/35">{meta.branch}</p>
                        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">{meta.shortLabel}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${
                        isActive
                          ? "bg-[var(--jarvis-cyan)]/15 text-[var(--jarvis-cyan)]"
                          : isDone
                            ? "bg-emerald-500/15 text-emerald-400"
                            : isError
                              ? "bg-red-500/12 text-red-400"
                              : "bg-white/6 text-white/30"
                      }`}
                    >
                      {isDone ? "✓ done" : state.status}
                    </span>
                  </div>

                  <div className="relative mt-3">
                    {isActive ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--jarvis-cyan)]/70"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--jarvis-cyan)]/70"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--jarvis-cyan)]/70"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--jarvis-cyan)]/65">Generating</p>
                      </div>
                    ) : preview ? (
                      <p className="line-clamp-2 text-[11px] leading-[1.65] text-white/48">{preview}</p>
                    ) : (
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/24">
                        {state.status === "queued"
                          ? "In queue"
                          : state.status === "error"
                            ? "Skipped"
                            : "Standby"}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex min-h-32 items-center justify-center p-8 text-center text-[11px] uppercase tracking-[0.24em] text-white/26">
          Resolving specialist mix
        </div>
      )}
    </section>
  );
}

function AgentGlyph({ agentKey }: { agentKey: SubAgentKey }) {
  if (agentKey === "linkedin_creator") {
    return (
      <span className="jarvis-agent-glyph" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M4.98 3.5A2.48 2.48 0 1 0 5 8.46 2.48 2.48 0 0 0 4.98 3.5ZM3 9h4v12H3Zm7 0h3.83v1.64h.05c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.14V21h-4v-5.5c0-1.31-.03-3-1.83-3-1.84 0-2.12 1.43-2.12 2.9V21h-4Z" />
        </svg>
      </span>
    );
  }

  if (agentKey === "instagram_creator") {
    return (
      <span className="jarvis-agent-glyph" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1" className="fill-current stroke-none" />
        </svg>
      </span>
    );
  }

  if (agentKey === "facebook_creator") {
    return (
      <span className="jarvis-agent-glyph" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M13.5 21v-7h2.4l.6-3h-3V9.1c0-.87.28-1.46 1.54-1.46H16.7V5.01c-.3-.04-1.33-.11-2.53-.11-2.5 0-4.21 1.52-4.21 4.33V11H7.5v3H10v7Z" />
        </svg>
      </span>
    );
  }

  if (agentKey === "tiktok_creator") {
    return (
      <span className="jarvis-agent-glyph" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M14.7 3c.18 1.45 1 2.69 2.2 3.34.88.48 1.88.74 2.9.75v2.84a8.1 8.1 0 0 1-2.96-.56v5.07c0 3.37-2.73 6.1-6.1 6.1a6.1 6.1 0 0 1-2.8-11.52 6.1 6.1 0 0 1 3.34-.78v2.93a3.2 3.2 0 0 0-1.48.24 3.19 3.19 0 0 0 1.28 6.11 3.19 3.19 0 0 0 3.17-3.19V3h2.45Z" />
        </svg>
      </span>
    );
  }

  const textMap: Record<Exclude<SubAgentKey, "linkedin_creator" | "instagram_creator" | "tiktok_creator" | "facebook_creator">, string> = {
    market_research: "MR",
    competitor_intel: "CI",
    content: "CT",
    campaigns: "CP",
    offers: "OF",
    brand_voice: "BV",
    landing_page: "LP",
    landing_page_architect: "PA",
    linkedin_carousel: "LC",
    dm_automation: "DM",
    squeeze_page: "SQ",
    lead_magnet: "LM",
    blog_writer: "BL",
    instagram_reels: "IR",
    instagram_stories: "IS",
    facebook_ads: "FA",
    email_writer: "EM",
    email_sequence: "ES",
    newsletter_writer: "NW",
    cro_funnel: "CR",
    analytics: "AN",
    creative_review: "QA",
    pipeline_architect: "PL",
    objection_handler: "OB",
    followup_writer: "FU",
    ops_priorities: "OP",
    ops_process: "PR",
    ops_cadence: "CD",
    finance_cashflow: "CF",
    finance_pricing: "PG",
    finance_forecast: "FC",
  };

  return <span className="jarvis-agent-glyph text-[9px] font-semibold uppercase tracking-[0.18em]">{textMap[agentKey]}</span>;
}

function PreviewCard({
  card,
  index,
  mode = "grid",
  onOpen,
}: {
  card: PreviewCardData;
  index: number;
  mode?: PreviewMode;
  onOpen?: () => void;
}) {
  if (card.platform === "LinkedIn") {
    return <LinkedInPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "X") {
    return <XPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Threads") {
    return <ThreadsPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Bluesky") {
    return <BlueskyPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Instagram") {
    return <InstagramPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Facebook") {
    return <FacebookPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "TikTok") {
    return <TikTokPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Email") {
    return <EmailPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Landing Page") {
    return <LandingPagePreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Carousel") {
    return <CarouselPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "DM Automation") {
    return <DmAutomationPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Squeeze Page") {
    return <SqueezePagePreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Lead Magnet") {
    return <LeadMagnetPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Reels") {
    return <InstagramReelsPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Stories") {
    return <InstagramStoriesPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Facebook Ads") {
    return <FacebookAdsPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  if (card.platform === "Blog Post") {
    return <BlogPostPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
  }
  return <NewsletterPreview card={card} index={index} mode={mode} onOpen={onOpen} />;
}

function previewCardClass(card: PreviewCardData, mode: PreviewMode = "grid") {
  return `jarvis-preview-card ${card.provisional ? "is-provisional" : ""} ${mode === "full" ? "mx-auto w-full max-w-[78rem]" : ""}`;
}

function previewDelay(index: number) {
  return { animationDelay: `${index * 90}ms` };
}

function previewStyle(mode: PreviewMode, index: number) {
  return mode === "full" ? undefined : previewDelay(index);
}

function previewStatus(card: PreviewCardData, liveLabel: string) {
  return card.provisional ? "Generating" : liveLabel;
}

function PreviewExpandButton({ onOpen }: { onOpen?: () => void }) {
  if (!onOpen) return null;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      className="absolute right-3 top-3 z-30 rounded-full border border-black/10 bg-white/92 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:bg-white"
    >
      Full preview
    </button>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1d9bf0] text-white">
      <Check className="h-2.5 w-2.5" />
    </span>
  );
}

function ExpandableBody({
  text,
  className = "text-[14px] leading-7 text-slate-600 whitespace-pre-wrap",
  collapsedLines = "line-clamp-5",
  dark = false,
}: {
  text: string;
  className?: string;
  collapsedLines?: string;
  dark?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 320;
  return (
    <div>
      <p className={`${className} ${!expanded && isLong ? collapsedLines : ""}`}>{text}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`mt-1.5 text-[11px] font-medium tracking-wide transition ${dark ? "text-white/50 hover:text-white/80" : "text-slate-400 hover:text-slate-600"}`}
        >
          {expanded ? "▲ Show less" : "▼ See more"}
        </button>
      )}
    </div>
  );
}

function PlatformMark({ platform }: { platform: PreviewCardData["platform"] }) {
  if (platform === "LinkedIn") {
    return <span className="jarvis-platform-mark is-linkedin" aria-label="LinkedIn">in</span>;
  }

  if (platform === "Instagram") {
    return (
      <span className="jarvis-platform-mark is-instagram" aria-label="Instagram">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4.1" />
          <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
        </svg>
      </span>
    );
  }

  if (platform === "X") {
    return (
      <span className="jarvis-platform-mark is-x" aria-label="X">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M18.9 3H21l-4.6 5.3L22 21h-4.4l-3.5-4.6L10 21H7.9l4.9-5.6L2 3h4.5l3.2 4.2L13.3 3h2.1L11 8.1 18.9 21h-1.7L6.8 3h1.8l8.9 11.7z" />
        </svg>
      </span>
    );
  }

  if (platform === "Threads") {
    return (
      <span className="jarvis-platform-mark is-threads" aria-label="Threads">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M16.4 11.2c-.2-1.8-1.3-3-3.2-3-1.4 0-2.6.6-3.4 1.7l1.5 1c.5-.7 1.1-1.1 1.9-1.1.9 0 1.4.5 1.6 1.4-2.6.1-5 .9-5 3.4 0 1.8 1.5 3 3.7 3 2.4 0 3.9-1.4 3.9-3.7 0-.3 0-.6-.1-.9.8.4 1.4 1.1 1.4 2.2 0 1.9-1.4 3.3-3.8 3.6-3.4.4-5.9-1.4-6.4-4.8-.6-3.6 1.4-6.6 5.2-7.1 3.2-.4 5.6 1 6.7 3.7l-1.8.6c-.7-1.9-2.2-2.9-4.5-2.6-2.5.3-3.9 2.2-3.5 4.7.3 2.2 1.9 3.4 4.2 3.1 1.4-.2 2.2-.8 2.2-1.8 0-.8-.6-1.4-1.8-1.5zm-2.6 4.7c-1 0-1.7-.4-1.7-1.1 0-.9 1.1-1.3 3-1.4 0 1.7-.6 2.5-1.3 2.5z" />
        </svg>
      </span>
    );
  }

  if (platform === "Bluesky") {
    return (
      <span className="jarvis-platform-mark is-bluesky" aria-label="Bluesky">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M12 11.1c1.5-2.9 3.8-5.2 6.4-6.8.8-.5 1.7.2 1.5 1.1-.5 2.2-1.8 4.5-3.7 6.2 1.5-.5 3-.4 4.1.2.7.4.7 1.5-.1 1.8-1.6.6-3.9.5-6-.5.9 1.1 1.7 2.4 2 3.8.2.9-.7 1.6-1.5 1.1-1.2-.7-2.3-2.1-3.1-3.8-.8 1.7-1.9 3.1-3.1 3.8-.8.5-1.7-.2-1.5-1.1.3-1.4 1.1-2.7 2-3.8-2.1 1-4.4 1.1-6 .5-.8-.3-.8-1.4-.1-1.8 1.1-.6 2.6-.7 4.1-.2-1.9-1.7-3.2-4-3.7-6.2-.2-.9.7-1.6 1.5-1.1 2.6 1.6 4.9 3.9 6.4 6.8z" />
        </svg>
      </span>
    );
  }

  if (platform === "Facebook") {
    return <span className="jarvis-platform-mark is-facebook" aria-label="Facebook">f</span>;
  }

  if (platform === "TikTok") {
    return (
      <span className="jarvis-platform-mark is-tiktok" aria-label="TikTok">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M14.7 3c.18 1.45 1 2.69 2.2 3.34.88.48 1.88.74 2.9.75v2.84a8.1 8.1 0 0 1-2.96-.56v5.07c0 3.37-2.73 6.1-6.1 6.1a6.1 6.1 0 0 1-2.8-11.52 6.1 6.1 0 0 1 3.34-.78v2.93a3.2 3.2 0 0 0-1.48.24 3.19 3.19 0 0 0 1.28 6.11 3.19 3.19 0 0 0 3.17-3.19V3h2.45Z" />
        </svg>
      </span>
    );
  }

  if (platform === "Email") {
    return (
      <span className="jarvis-platform-mark is-email" aria-label="Email">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
          <path d="m5 8 7 5 7-5" />
        </svg>
      </span>
    );
  }

  if (platform === "Landing Page") {
    return (
      <span className="jarvis-platform-mark is-landing" aria-label="Landing page">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <path d="M3.5 8.5h17" />
          <circle cx="6.8" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="9.8" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      </span>
    );
  }

  if (platform === "Carousel") {
    return (
      <span className="jarvis-platform-mark is-linkedin" aria-label="LinkedIn Carousel">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="12" height="14" rx="2" />
          <path d="M15 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3" />
          <path d="M1 9v6" />
        </svg>
      </span>
    );
  }

  if (platform === "DM Automation") {
    return (
      <span className="jarvis-platform-mark" style={{ background: "#7c3aed", color: "white" }} aria-label="DM Automation">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </span>
    );
  }

  if (platform === "Squeeze Page") {
    return (
      <span className="jarvis-platform-mark" style={{ background: "#059669", color: "white" }} aria-label="Squeeze Page">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16v4H4zM4 10h10M4 14h8M10 18l4-4 4 4" />
        </svg>
      </span>
    );
  }

  if (platform === "Lead Magnet") {
    return (
      <span className="jarvis-platform-mark" style={{ background: "#d97706", color: "white" }} aria-label="Lead Magnet">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 1 3 3v1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2V5a3 3 0 0 1 3-3z" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      </span>
    );
  }

  if (platform === "Reels") {
    return (
      <span className="jarvis-platform-mark" style={{ background: "linear-gradient(135deg,#f58529,#dd2a7b)", color: "white" }} aria-label="Instagram Reels">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="12" cy="12" r="3" />
          <path d="M3 8h18M8 3v5M16 3v5" />
        </svg>
      </span>
    );
  }

  if (platform === "Stories") {
    return (
      <span className="jarvis-platform-mark" style={{ background: "linear-gradient(135deg,#dd2a7b,#515bd4)", color: "white" }} aria-label="Instagram Stories">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="2" width="12" height="20" rx="3" />
          <path d="M9 7h6M9 11h6M9 15h3" />
        </svg>
      </span>
    );
  }

  if (platform === "Facebook Ads") {
    return (
      <span className="jarvis-platform-mark" style={{ background: "#0866ff", color: "white" }} aria-label="Facebook Ads">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M13.5 21v-7h2.4l.6-3h-3V9.1c0-.87.28-1.46 1.54-1.46H16.7V5.01c-.3-.04-1.33-.11-2.53-.11-2.5 0-4.21 1.52-4.21 4.33V11H7.5v3H10v7Z" />
        </svg>
      </span>
    );
  }

  if (platform === "Blog Post") {
    return (
      <span className="jarvis-platform-mark" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white" }} aria-label="Blog Post">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="18" rx="2.5" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      </span>
    );
  }

  return (
    <span className="jarvis-platform-mark is-newsletter" aria-label="Newsletter">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4.5" width="16" height="15" rx="2.5" />
        <path d="M8 9.5h8M8 13h8M8 16.5h5" />
      </svg>
    </span>
  );
}

function LinkedInPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  return (
    <article className={previewCardClass(card, mode)} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#0a66c2,#53b6ff)]" />
      <div className="bg-[#eef3f8] p-3">
        <div className="flex items-center gap-3 rounded-[1rem] border border-[#d9e3f0] bg-white px-4 py-3 text-[#526a86] shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <PlatformMark platform="LinkedIn" />
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#eef3f8] px-3 py-2 text-[12px]">
            <Search className="h-3.5 w-3.5" />
            <span className="truncate">Search posts, people, and companies</span>
          </div>
          <div className="hidden items-center gap-3 text-[#6b7280] sm:flex">
            <House className="h-4 w-4" />
            <Bell className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 rounded-[1.25rem] border border-[#d8e1eb] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0a66c2,#53b6ff)] text-sm font-semibold text-white">
                DP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">Daniel Paul</p>
                  <VerifiedBadge />
                  <span className="rounded-full bg-[#e8f3ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0a66c2]">
                    Follow
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Founder at Jarvis Studio · 1st · Just now</p>
              </div>
            </div>
            <span className="jarvis-preview-status">{previewStatus(card, "Live post")}</span>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-[16px] font-bold leading-7 text-slate-900">{card.title}</p>
            <ExpandableBody text={card.body} />
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.2rem] border border-[#d8e1eb] bg-[#f6f9fc]">
            <div className="h-40 bg-[linear-gradient(135deg,#0f172a,#0a66c2_55%,#53b6ff)] p-4 text-white">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Document carousel</p>
              <p className="mt-3 max-w-[18rem] text-xl font-semibold leading-7">{card.visual ?? card.title}</p>
            </div>
            <div className="px-4 py-3 text-xs text-slate-500">{card.footer}</div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[12px] text-slate-500">
            <span>1,842 impressions</span>
            <span>142 reactions · 18 comments</span>
          </div>
          <div className="mt-3 grid grid-cols-4 border-t border-slate-200 pt-3 text-[12px] font-medium text-slate-500">
            <button type="button" className="inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-2 transition hover:bg-slate-100">
              <Heart className="h-4 w-4" />
              Like
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-2 transition hover:bg-slate-100">
              <MessageCircle className="h-4 w-4" />
              Comment
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-2 transition hover:bg-slate-100">
              <Repeat2 className="h-4 w-4" />
              Repost
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-2 transition hover:bg-slate-100">
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function XPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  return (
    <article className={`${previewCardClass(card, mode)} bg-[#000] text-white`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#0f172a,#334155)]" />
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/48">
          <span>For you</span>
          <span>Following</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">DP</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Daniel Paul <span className="font-normal text-white/46">@danielpaul_ai · now</span></p>
              <MoreHorizontal className="h-4 w-4 text-white/40" />
            </div>
            <p className="mt-3 text-[15px] font-semibold leading-6 text-white">{card.title}</p>
            <ExpandableBody text={card.body} className="mt-3 text-[14px] leading-6 text-white/78" dark />
            <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/42">
                <Image className="h-3.5 w-3.5" />
                Media card
              </div>
              <p className="mt-3 text-sm leading-6 text-white/72">{card.footer}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-[12px] text-white/48">
              <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> 48</span>
              <span className="inline-flex items-center gap-1.5"><Repeat2 className="h-4 w-4" /> 17</span>
              <span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4" /> 311</span>
              <span className="inline-flex items-center gap-1.5"><Bookmark className="h-4 w-4" /> Save</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <span className="jarvis-preview-status is-dark">{previewStatus(card, "Live thread")}</span>
        </div>
      </div>
    </article>
  );
}

function ThreadsPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  return (
    <article className={previewCardClass(card, mode)} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#111111,#52525b)]" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlatformMark platform="Threads" />
            <div>
              <p className="text-sm font-semibold text-slate-900">danielpaul.ai</p>
              <p className="text-[11px] text-slate-500">threads draft · reply-driven format</p>
            </div>
          </div>
          <span className="jarvis-preview-status">{previewStatus(card, "Conversation ready")}</span>
        </div>
        <p className="mt-4 text-[15px] font-semibold leading-6 text-slate-900">{card.title}</p>
        <ExpandableBody text={card.body} className="mt-3 text-sm leading-6 text-slate-700" />
        <div className="mt-4 border-l-2 border-slate-200 pl-4 text-xs text-slate-500">{card.footer}</div>
        <div className="mt-4 flex items-center gap-5 text-[11px] text-slate-400">
          <span>♥ 1.2k</span>
          <span>💬 94</span>
          <span>↺ 12</span>
          <span>↗ Share</span>
        </div>
      </div>
    </article>
  );
}

function BlueskyPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  return (
    <article className={previewCardClass(card, mode)} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#0284ff,#7dd3fc)]" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlatformMark platform="Bluesky" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Daniel Paul</p>
              <p className="text-[11px] text-slate-500">@danielpaul.ai · discover feed</p>
            </div>
          </div>
          <span className="jarvis-preview-status">{previewStatus(card, "Feed-ready")}</span>
        </div>
        <p className="mt-4 text-[15px] font-semibold leading-6 text-slate-900">{card.title}</p>
        <ExpandableBody text={card.body} className="mt-3 text-sm leading-6 text-slate-700" />
        <div className="mt-4 rounded-[1.1rem] bg-sky-50 px-4 py-3 text-xs text-sky-700">{card.footer}</div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-[11px] text-slate-400">
          <span>Reply 21</span>
          <span>Repost 8</span>
          <span>Like 164</span>
        </div>
      </div>
    </article>
  );
}

function InstagramPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  return (
    <article className={previewCardClass(card, mode)} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className={`jarvis-preview-accent bg-gradient-to-r ${card.accent}`} />
      <div className="bg-[#fafafa] p-3">
        <div className="mx-auto max-w-[23rem] overflow-hidden rounded-[1.75rem] border border-[#dbdbdb] bg-white shadow-[0_18px_44px_rgba(15,23,42,0.1)]">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`rounded-full bg-gradient-to-br ${card.accent} p-[2px]`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-900">DP</div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">danielpaul.ai</p>
                <p className="text-[11px] text-slate-400">Singapore</p>
              </div>
            </div>
            <MoreHorizontal className="h-4 w-4 text-slate-500" />
          </div>
          <div className={`relative flex aspect-[4/5] items-end overflow-hidden bg-gradient-to-br ${card.accent} p-5 text-white`}>
            <div className="jarvis-preview-visual-noise" />
            <div className="absolute left-4 top-4 rounded-full bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/82">
              Carousel cover
            </div>
            <div className="relative z-10">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Instagram creative</p>
              <p className="mt-3 text-lg font-semibold leading-6">{card.visual ?? card.title}</p>
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-4">
                <Heart className="h-5 w-5" />
                <MessageCircle className="h-5 w-5" />
                <Send className="h-5 w-5" />
              </div>
              <Bookmark className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">2,431 likes</p>
            <p className="mt-2 text-sm leading-6 text-slate-700"><span className="font-semibold text-slate-900">danielpaul.ai</span> {card.body}</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-slate-400">{card.footer}</p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {Array.from({ length: 4 }).map((_, dotIndex) => (
                <span key={dotIndex} className={`h-1.5 rounded-full ${dotIndex === 1 ? "w-5 bg-slate-900" : "w-1.5 bg-slate-300"}`} />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">View insights</span>
              <span className="jarvis-preview-status">{previewStatus(card, "Ready")}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function FacebookPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  return (
    <article className={previewCardClass(card, mode)} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#1877f2,#8cc8ff)]" />
      <div className="bg-[#f0f2f5] p-3">
        <div className="rounded-[1.35rem] border border-[#d8dde6] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1877f2,#5ea7ff)] text-sm font-semibold text-white">DP</div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">Daniel Paul</p>
                  <VerifiedBadge />
                </div>
                <p className="text-[11px] text-slate-400">Page mockup · 58m · Public</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-full bg-[#e7f3ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1877f2]">
                Promote
              </button>
              <span className="jarvis-preview-status">{previewStatus(card, "Queued to publish")}</span>
            </div>
          </div>
          <div className="px-4 py-4">
            <p className="text-[15px] font-semibold leading-6 text-slate-900">{card.title}</p>
            <ExpandableBody text={card.body} className="mt-3 text-sm leading-6 text-slate-700" />
            <div className="mt-4 overflow-hidden rounded-[1.2rem] border border-slate-200 bg-[#f3f6fb]">
              <div className="h-44 bg-[linear-gradient(135deg,#0f172a,#1877f2_52%,#8cc8ff)] px-4 py-4 text-white">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/72">Page cover creative</p>
                <p className="mt-3 max-w-[18rem] text-xl font-semibold leading-7">{card.visual ?? card.title}</p>
              </div>
              <div className="px-4 py-3 text-sm text-slate-600">{card.footer}</div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[12px] text-slate-500">
              <span>624 reactions</span>
              <span>147 comments · 32 shares</span>
            </div>
            <div className="mt-3 grid grid-cols-3 border-t border-b border-slate-200 py-3 text-[12px] text-slate-500">
              <span className="text-center">Like</span>
              <span className="text-center">Comment</span>
              <span className="text-center">Share</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Top reply</p>
                <p className="mt-1">This is the first AI offer post that actually feels understandable. 47 replies in the queue.</p>
              </div>
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400">
                <span>Page controls</span>
                <span>Edit audience · Schedule · Insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function TikTokPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  return (
    <article className={`${previewCardClass(card, mode)} bg-[#0f0f10] text-white`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className={`jarvis-preview-accent bg-gradient-to-r ${card.accent}`} />
      <div className="bg-black p-4">
        <div className="mx-auto grid max-w-[24rem] grid-cols-[1fr_auto] gap-3">
          <div className={`relative flex aspect-[9/16] items-end overflow-hidden rounded-[1.6rem] bg-gradient-to-br ${card.accent} p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.4)]`}>
            <div className="jarvis-preview-visual-noise" />
            <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/78">
              LIVE draft
            </div>
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.22em] text-white/72">TikTok concept</p>
              <p className="mt-2 text-base font-semibold leading-6">{card.visual ?? card.title}</p>
              <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
                <span className="rounded-full border border-white/18 px-2 py-1">CapCut hook</span>
                <span className="rounded-full border border-white/18 px-2 py-1">Subtitle on</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-end gap-4 pb-3 text-white">
            <PlatformMark platform="TikTok" />
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 backdrop-blur-sm"><Heart className="h-5 w-5" /></span>
            <span className="text-[10px] uppercase tracking-[0.18em]">18k</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 backdrop-blur-sm"><MessageCircle className="h-5 w-5" /></span>
            <span className="text-[10px] uppercase tracking-[0.18em]">642</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 backdrop-blur-sm"><Bookmark className="h-5 w-5" /></span>
            <span className="text-[10px] uppercase tracking-[0.18em]">201</span>
            <span className="jarvis-preview-status is-dark">{previewStatus(card, "Ready")}</span>
          </div>
        </div>
        <div className="mx-auto mt-4 max-w-[24rem] px-1 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">@danielpaul.ai</p>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/54">
              <span>Draft controls</span>
              <span className="rounded-full border border-white/14 px-2 py-1">Cover</span>
              <span className="rounded-full border border-white/14 px-2 py-1">CTA</span>
            </div>
          </div>
          <ExpandableBody text={card.body} className="mt-2 text-sm leading-6 text-white/82" dark />
          <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-white/52">{card.footer}</p>
        </div>
      </div>
    </article>
  );
}

function EmailPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  return (
    <article className={previewCardClass(card, mode)} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className={`jarvis-preview-accent bg-gradient-to-r ${card.accent}`} />
      <div className="bg-[#f8fafc] p-3">
        <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-500">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <div>
                <p>Inbox preview</p>
                <p className="mt-1 text-[10px] tracking-[0.18em] text-slate-400">deliverability + sequence look</p>
              </div>
            </div>
            <span className="jarvis-preview-status">{previewStatus(card, "Sending window")}</span>
          </div>

          <div className="grid gap-0 border-b border-slate-200 sm:grid-cols-[11rem_1fr]">
            <div className="border-r border-slate-200 bg-slate-50 px-4 py-4">
              <div className="mb-4 space-y-2 rounded-[1rem] border border-slate-200 bg-white p-3 text-[12px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Inbox</span>
                  <span>12 new</span>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-2">AI offer case study draft</div>
                <div className="rounded-lg bg-slate-50 px-2 py-2">Warm lead follow-up</div>
                <div className="rounded-lg bg-slate-50 px-2 py-2">Newsletter issue review</div>
              </div>
              <div className="rounded-full bg-[linear-gradient(135deg,#0f766e,#38bdf8)] px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                New campaign
              </div>
              <div className="mt-4 space-y-2 text-[12px] text-slate-500">
                <p className="font-semibold text-slate-700">Primary</p>
                <p>Sequences</p>
                <p>Drafts</p>
                <p>Analytics</p>
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400">
                <span>From Daniel Paul</span>
                <span>Primary</span>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-slate-400">Subject</p>
              <p className="mt-2 text-[15px] font-semibold text-slate-900">{card.title}</p>
              <div className="mt-4 rounded-[1.1rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <ExpandableBody text={card.body} className="text-sm leading-6 text-slate-700" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            <span>{card.footer}</span>
            <span>Open rate mock</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function NewsletterPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  return (
    <article className={`${previewCardClass(card, mode)} bg-[linear-gradient(180deg,#fffdf7,#fff)]`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#f59e0b,#facc15)]" />
      <div className="bg-[#fffaf0] p-4">
        <div className="mx-auto max-w-[46rem] rounded-[1.4rem] border border-amber-200 bg-white shadow-[0_18px_42px_rgba(146,64,14,0.08)]">
          <div className="border-b border-amber-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PlatformMark platform="Newsletter" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Editorial issue</p>
                  <p className="mt-2 text-[15px] font-semibold text-slate-900">{card.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-700">
                  18.4k subscribers
                </span>
                <span className="jarvis-preview-status">{previewStatus(card, "Issue ready")}</span>
              </div>
            </div>
          </div>
          <div className="grid gap-0 lg:grid-cols-[0.72fr_1fr]">
            <div className="border-r border-amber-100 bg-[#fffbf2] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Issue controls</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-[1rem] border border-amber-100 bg-white px-4 py-3">Subject A/B ready</div>
                <div className="rounded-[1rem] border border-amber-100 bg-white px-4 py-3">Hero quote locked</div>
                <div className="rounded-[1rem] border border-amber-100 bg-white px-4 py-3">CTA block scheduled</div>
              </div>
            </div>
            <div className="px-5 py-5">
              <div className="rounded-[1.1rem] border border-slate-200 bg-[#fffdf8] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Lead story</p>
                <ExpandableBody text={card.body} className="mt-3 text-sm leading-7 text-slate-700" />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-xs uppercase tracking-[0.16em] text-amber-700">
                <span>{card.footer}</span>
                <span>CTR forecast 8.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function LandingPagePreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  return (
    <article className={previewCardClass(card, mode)} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="bg-[#f5f7fb] p-3">
        <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.09)]">
          <div className={`relative overflow-hidden bg-gradient-to-br ${card.accent} px-5 py-4 text-white`}>
            <div className="jarvis-preview-browser-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="relative z-10 mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PlatformMark platform="Landing Page" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/80">Landing page hero</p>
                  <p className="mt-2 font-[family:var(--font-heading)] text-lg uppercase tracking-[0.08em]">{card.title}</p>
                </div>
              </div>
              <div className="hidden items-center gap-2 lg:flex">
                <span className="rounded-full border border-white/18 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/76">Hero</span>
                <span className="rounded-full border border-white/18 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/76">CTA</span>
                <span className="rounded-full border border-white/18 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/76">Proof</span>
              </div>
            </div>
            <div className="relative z-10 mt-6 grid gap-3 pb-4 sm:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="max-w-[30rem] text-sm leading-6 text-white/82">{card.body}</p>
                <div className="mt-4 flex items-center gap-3">
                  <button type="button" className="rounded-full bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-900">Book demo</button>
                  <button type="button" className="rounded-full border border-white/22 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/82">See proof</button>
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/68">Builder controls</p>
                <div className="mt-3 space-y-2 text-[12px] text-white/82">
                  <p>Headline approved</p>
                  <p>CTA hierarchy locked</p>
                  <p>Social proof positioned</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">32% opt-in lift</div>
              <div className="rounded-[1rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">3 CTA entry points</div>
              <div className="rounded-[1rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">Offer stack above fold</div>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: 5 }).map((_, dotIndex) => (
                <span key={dotIndex} className={`h-1.5 rounded-full ${dotIndex === 2 ? "w-6 bg-slate-900" : "w-1.5 bg-slate-300"}`} />
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-500">{card.footer}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function CarouselPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  const slideLabels = card.visual ? card.visual.split("·").map((s) => s.trim()) : [];
  const slideCount = parseInt(slideLabels[0] ?? "6", 10) || 6;
  const intent = slideLabels[1] ?? "Educating";
  return (
    <article className={`${previewCardClass(card, mode)} bg-[#f0f4ff]`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#0a66c2,#1d9bf0,#7dd3fc)]" />
      <div className="p-4">
        <div className="overflow-hidden rounded-[1.4rem] border border-blue-200 bg-white shadow-[0_18px_42px_rgba(10,102,194,0.1)]">
          <div className="bg-gradient-to-r from-[#0a66c2] to-[#1d9bf0] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PlatformMark platform="Carousel" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/72">LinkedIn Carousel</p>
                  <p className="mt-1 text-[13px] font-semibold text-white">{intent} · {slideCount} slides</p>
                </div>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/82">Swipe →</span>
            </div>
          </div>
          <div className="flex gap-0 overflow-hidden">
            {Array.from({ length: Math.min(slideCount, 4) }).map((_, i) => (
              <div key={i} className={`relative flex min-h-[120px] flex-1 flex-col justify-between border-r border-blue-100 px-3 py-3 last:border-r-0 ${i === 0 ? "bg-[#0a66c2] text-white" : "bg-white text-slate-700"}`}>
                <span className={`text-[9px] font-semibold uppercase tracking-[0.18em] ${i === 0 ? "text-white/60" : "text-slate-400"}`}>
                  {i === 0 ? "Cover" : `Slide ${i + 1}`}
                </span>
                {i === 0 ? (
                  <p className="mt-2 text-[12px] font-bold leading-tight text-white line-clamp-3">{card.title}</p>
                ) : (
                  <div className="mt-2 space-y-1">
                    <div className="h-2 w-full rounded-full bg-slate-200" />
                    <div className="h-2 w-4/5 rounded-full bg-slate-100" />
                    <div className="h-2 w-3/5 rounded-full bg-slate-100" />
                  </div>
                )}
                <span className={`mt-2 text-[8px] uppercase tracking-[0.14em] ${i === 0 ? "text-white/50" : "text-slate-300"}`}>{i + 1}/{slideCount}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-blue-100 px-5 py-3 text-[11px] text-slate-500">{card.footer}</div>
        </div>
      </div>
    </article>
  );
}

function DmAutomationPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  const lines = card.body.split("\n").filter(Boolean);
  return (
    <article className={`${previewCardClass(card, mode)} bg-[#1a1a2e]`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#7c3aed,#a855f7,#e879f9)]" />
      <div className="p-4">
        <div className="overflow-hidden rounded-[1.4rem] border border-purple-500/30 bg-[#0d0d1a] shadow-[0_18px_42px_rgba(124,58,237,0.2)]">
          <div className="flex items-center justify-between border-b border-purple-500/20 bg-[#111128] px-5 py-4">
            <div className="flex items-center gap-3">
              <PlatformMark platform="DM Automation" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-purple-400/80">DM Sequence</p>
                <p className="mt-1 text-[13px] font-semibold text-white">{card.title}</p>
              </div>
            </div>
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-purple-300">Automated</span>
          </div>
          <div className="space-y-3 p-5">
            {lines.slice(0, 3).map((line, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
                <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500" />
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-[12px] leading-5 ${i % 2 === 0 ? "rounded-tl-sm bg-[#1e1e3a] text-slate-300" : "rounded-tr-sm bg-purple-600 text-white"}`}>
                  {line.slice(0, 120)}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-purple-500/20 px-5 py-3 text-[11px] text-purple-400/70">{card.footer}</div>
        </div>
      </div>
    </article>
  );
}

function SqueezePagePreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  const lines = card.body.split("\n").filter(Boolean);
  const subheadline = lines[0] ?? "";
  const benefits = lines.slice(1);
  return (
    <article className={`${previewCardClass(card, mode)} bg-[#f0faf5]`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#059669,#10b981,#6ee7b7)]" />
      <div className="p-4">
        <div className="overflow-hidden rounded-[1.4rem] border border-emerald-200 bg-white shadow-[0_18px_42px_rgba(5,150,105,0.1)]">
          <div className="bg-gradient-to-br from-[#059669] to-[#10b981] px-6 py-8 text-center text-white">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Squeeze Page</p>
            <h3 className="mt-3 font-[family:var(--font-heading)] text-xl font-bold leading-tight uppercase">{card.title}</h3>
            {subheadline && <p className="mt-2 text-[13px] text-white/80">{subheadline}</p>}
          </div>
          <div className="px-6 py-4">
            {benefits.length > 0 && (
              <ul className="space-y-2">
                {benefits.slice(0, 4).map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-slate-700">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="mt-5 w-full rounded-full bg-gradient-to-r from-[#059669] to-[#10b981] py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_8px_20px_rgba(5,150,105,0.3)]">
              {card.footer}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function LeadMagnetPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  const lines = card.body.split("\n").filter(Boolean);
  const subtitle = lines[0] ?? "";
  const tocItems = lines.slice(1);
  return (
    <article className={`${previewCardClass(card, mode)} bg-[#fffbf0]`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#d97706,#f59e0b,#fde68a)]" />
      <div className="p-4">
        <div className="overflow-hidden rounded-[1.4rem] border border-amber-200 bg-white shadow-[0_18px_42px_rgba(217,119,6,0.1)]">
          <div className="relative bg-gradient-to-br from-[#92400e] to-[#d97706] px-6 py-6">
            <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-white/80">{card.visual ?? "guide"}</div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-amber-200/80">Lead Magnet</p>
            <h3 className="mt-2 font-[family:var(--font-heading)] text-lg font-bold uppercase leading-tight text-white">{card.title}</h3>
            {subtitle && <p className="mt-1 text-[12px] text-amber-100/80">{subtitle}</p>}
          </div>
          <div className="px-5 py-4">
            {tocItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">What&apos;s inside</p>
                {tocItems.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-[0.7rem] border border-amber-100 bg-amber-50 px-3 py-2 text-[12px] text-slate-700">
                    <span className="shrink-0 text-amber-500">◆</span>
                    {item.replace(/^·\s*/, "")}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] text-amber-700">{card.footer}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function InstagramReelsPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  const lines = card.body.split("\n").filter(Boolean);
  const intent = lines[0] ?? "Reel";
  const hookSpoken = lines[1] ?? "";
  const script = lines.slice(2).join(" ");
  const stats = card.visual ? card.visual.split("·").map((s) => s.trim()) : [];
  return (
    <article className={`${previewCardClass(card, mode)} bg-[#0a0a0a]`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#f58529,#dd2a7b,#8134af)]" />
      <div className="p-3">
        <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#111] shadow-[0_20px_48px_rgba(221,42,123,0.18)]">
          {/* Phone-like vertical frame */}
          <div className="relative mx-auto w-full max-w-[220px]">
            <div className="relative aspect-[9/16] max-h-[260px] overflow-hidden rounded-[1.1rem] bg-gradient-to-b from-[#1a0a2e] via-[#2d1b4e] to-[#0a0a1a]">
              {/* Reel content overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                <div className="flex items-start justify-between">
                  <span className="rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm">Reel</span>
                  <span className="rounded-full border border-pink-500/40 bg-pink-500/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-pink-300">{intent}</span>
                </div>
                {/* Hook text overlay */}
                <div className="space-y-2">
                  <p className="text-[13px] font-bold leading-snug text-white drop-shadow-lg">{card.title}</p>
                  {hookSpoken && <p className="text-[10px] leading-snug text-white/70">{hookSpoken.slice(0, 80)}</p>}
                  <div className="flex items-center gap-2 border-t border-white/10 pt-2 text-[9px] text-white/50">
                    {stats[0] && <span>{stats[0]}</span>}
                    {stats[1] && <span>· {stats[1]}</span>}
                  </div>
                </div>
              </div>
              {/* Side action bar */}
              <div className="absolute bottom-4 right-2 flex flex-col items-center gap-3 text-white/60">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              </div>
            </div>
          </div>
          {/* Script preview */}
          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Script preview</p>
            <p className="mt-1 line-clamp-3 text-[12px] leading-5 text-slate-400">{script || card.body}</p>
            <div className="mt-3 rounded-2xl border border-pink-500/20 bg-pink-500/5 px-3 py-2 text-[11px] text-pink-400">{card.footer}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function InstagramStoriesPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  const lines = card.body.split("\n").filter(Boolean);
  const seqType = lines[0] ?? "Sequence";
  const frames = lines.slice(1);
  const stats = card.visual ? card.visual.split("·").map((s) => s.trim()) : [];
  const frameCount = parseInt(stats[0] ?? "5", 10) || 5;
  return (
    <article className={`${previewCardClass(card, mode)} bg-[#1a0a2e]`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#f58529,#dd2a7b,#515bd4)]" />
      <div className="p-4">
        <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#0f0a1a] shadow-[0_20px_48px_rgba(81,91,212,0.2)]">
          <div className="border-b border-white/8 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PlatformMark platform="Stories" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-purple-400/80">Story Sequence</p>
                  <p className="mt-1 text-[13px] font-semibold text-white">{card.title}</p>
                </div>
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[10px] text-purple-300">{seqType}</span>
            </div>
          </div>
          {/* Story frames strip */}
          <div className="flex gap-2 overflow-x-auto px-5 py-4">
            {Array.from({ length: Math.min(frameCount, 5) }).map((_, i) => (
              <div key={i} className={`relative shrink-0 aspect-[9/16] w-[58px] overflow-hidden rounded-xl border ${i === 0 ? "border-pink-500/50 bg-gradient-to-b from-[#dd2a7b]/30 to-[#515bd4]/20" : "border-white/10 bg-white/5"}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] text-white/40">{i + 1}</span>
                </div>
                {i === 0 && frames[0] && (
                  <div className="absolute inset-x-1 bottom-2 text-[7px] font-medium leading-tight text-white/80">{frames[0].slice(0, 25)}</div>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2 px-5 pb-4">
            {frames.slice(0, 3).map((frame, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="shrink-0 text-purple-400">→</span>
                {frame.replace(" → ", " ")}
              </div>
            ))}
            <div className="mt-2 rounded-2xl border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-[11px] text-purple-300">{card.footer}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function FacebookAdsPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  const stats = card.visual ? card.visual.split("·").map((s) => s.trim()) : [];
  const adCount = stats[0] ?? "3 ads";
  const objection = stats[1] ?? "";
  return (
    <article className={`${previewCardClass(card, mode)} bg-[#f0f2f5]`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className="jarvis-preview-accent bg-[linear-gradient(135deg,#0866ff,#1877f2,#42a5f5)]" />
      <div className="p-3">
        <div className="overflow-hidden rounded-[1.4rem] border border-blue-200 bg-white shadow-[0_18px_42px_rgba(8,102,255,0.12)]">
          {/* Facebook ad frame header */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0866ff] text-white text-xs font-bold">f</div>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-slate-800">Your Brand</p>
              <p className="text-[10px] text-slate-400">Sponsored · <span className="text-blue-500">🌐</span></p>
            </div>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-blue-600">{adCount}</span>
          </div>
          {/* Primary text */}
          <div className="px-5 py-4">
            <p className="line-clamp-4 text-[13px] leading-6 text-slate-700">{card.body}</p>
          </div>
          {/* Creative area */}
          <div className={`relative bg-gradient-to-br ${card.accent} px-5 py-5`}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Ad Creative</p>
            <p className="mt-2 text-lg font-bold leading-tight text-white">{card.title}</p>
            {objection && <p className="mt-1 text-[11px] text-white/70">Addresses: {objection}</p>}
          </div>
          {/* CTA row */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
            <p className="text-[11px] text-slate-400">{card.footer}</p>
            <button type="button" className="rounded-md bg-[#0866ff] px-4 py-2 text-[11px] font-semibold text-white">{card.footer}</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function BlogPostPreview({ card, index, mode, onOpen }: { card: PreviewCardData; index: number; mode: PreviewMode; onOpen?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const sections = card.sections ?? [];
  const tags = card.tags ?? [];
  const seoKeywords = card.seo_keywords ?? [];

  return (
    <article className={`${previewCardClass(card, mode)} bg-[#fafaf8]`} style={previewStyle(mode, index)}>
      <PreviewExpandButton onOpen={mode === "grid" ? onOpen : undefined} />
      <div className={`jarvis-preview-accent bg-[linear-gradient(135deg,#f59e0b,#d97706,#92400e)]`} />
      <div className="p-3">
        <div className="overflow-hidden rounded-[1.4rem] border border-amber-200 bg-white shadow-[0_18px_42px_rgba(245,158,11,0.10)]">
          {/* Blog browser chrome */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-[#f8f8f6] px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1">
              <span className="text-[10px] text-slate-400 truncate">blog.{card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 28)}</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-amber-600">{card.read_time ?? card.visual ?? "Article"}</span>
          </div>
          {/* Hero image or gradient */}
          {card.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.hero_image_url} alt={card.title} className="w-full h-40 object-cover" />
          ) : (
            <div className={`h-32 bg-gradient-to-br ${card.accent} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.04)_10px,rgba(255,255,255,0.04)_20px)]" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">Featured Article</p>
              </div>
            </div>
          )}
          {/* Title + meta */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-[18px] font-bold leading-tight text-slate-900 line-clamp-2">{card.title}</p>
            <p className="mt-2 text-[12px] leading-5 text-slate-500 line-clamp-2">{card.meta_description ?? card.body}</p>
            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.slice(0, 4).map((tag, i) => (
                  <span key={i} className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">{tag}</span>
                ))}
              </div>
            )}
          </div>
          {/* Expandable sections */}
          {sections.length > 0 && (
            <div className="border-t border-slate-100 px-5 pb-4">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600 transition hover:bg-slate-100"
              >
                <span>{expanded ? "Collapse sections" : `Read article · ${sections.length} sections`}</span>
                <span className={`transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>
              </button>
              {expanded && (
                <div className="mt-3 space-y-4">
                  {sections.map((section, i) => (
                    <div key={i} className="border-l-2 border-amber-300 pl-4">
                      <p className="text-[13px] font-semibold text-slate-800">{section.heading}</p>
                      <p className="mt-1.5 text-[12px] leading-5 text-slate-600">{section.body.slice(0, 280)}{section.body.length > 280 ? "…" : ""}</p>
                      {section.image_prompt && (
                        <p className="mt-2 text-[10px] italic text-slate-400">Image: {section.image_prompt.slice(0, 80)}…</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* SEO keywords */}
          {seoKeywords.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1.5">SEO keywords</p>
              <div className="flex flex-wrap gap-1">
                {seoKeywords.map((kw, i) => (
                  <span key={i} className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {/* CTA footer */}
          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PlatformMark platform="Blog Post" />
              <span className="text-[11px] text-slate-400">{card.footer}</span>
            </div>
            <span className={`jarvis-preview-status`}>{previewStatus(card, "Draft ready")}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function PreviewLightbox({ card, index, onClose }: { card: PreviewCardData; index: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/72 px-4 py-8 backdrop-blur-md">
      <div className="w-full max-w-[86rem]">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-full border border-white/10 bg-black/35 px-4 py-3 text-white shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/54">Full-size platform preview</p>
            <p className="mt-1 text-sm font-medium text-white/86">{card.platform} mock</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/12"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        <PreviewCard card={card} index={index} mode="full" />
      </div>
    </div>
  );
}

function RouteTelemetry({ route, provider }: { route: RouteMeta; provider: ProviderMeta | null }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/28 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-[var(--jarvis-cyan)]">Route telemetry</p>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-white/42">{route.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.24em] text-white/55">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">{route.project_type}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">{route.mode}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
            {provider ? `${provider.provider} / ${provider.model}` : "Resolving provider"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TelemetryItem label="Department" value={route.department} />
        <TelemetryItem label="Template" value={route.template_key ?? "dynamic classifier"} />
        <TelemetryItem label="Project" value={route.project_type} />
        <TelemetryItem label="Agents" value={route.selected_agents.join(" -> ")} />
      </div>
    </section>
  );
}

function TelemetryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-black/22 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">{label}</p>
      <p className="mt-3 text-sm uppercase tracking-[0.18em] text-white/82">{value}</p>
    </div>
  );
}
