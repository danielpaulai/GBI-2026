# 10X Command Center — Build Brief for Cursor

**Paste this into Cursor's first Composer message.** It locks the project goal, stack, structure, and success criteria so Cursor stops second-guessing decisions.

---

## What we're building

A **live-stage, voice-controlled, multi-agent AI Employee Command Center** for a presentation at GBI Singapore (Mid-July 2026). On stage, a volunteer presses a department node on screen → an AI agent for that department fires → real Claude calls produce real output → audience watches inter-agent collaboration visually.

**The 3 layers:**

1. **Visual shell** — CEO node at center, 3 satellites (Marketing/Sales/Ops). Pulsing nodes, expanding panels, particle backdrop, glassmorphism. Iron Man / Tron / Mission: Impossible energy.
2. **Agent orchestration** — A "CEO" agent routes commands to Marketing/Sales/Ops sub-agents. Each has its own brief/voice/tools. WebSocket streams updates live.
3. **Cinematic layer** — Pre-rendered Higgsfield/Seedance video clips as backdrop transitions. Not for live agent work — for the theater around it.

**Demo deadline: 7 days from project start.**

---

## Locked tech stack — DO NOT SUGGEST ALTERNATIVES

| Layer | Pick |
|---|---|
| Frontend framework | **Next.js 15 (App Router) + TypeScript strict mode** |
| Component primitives | **shadcn/ui + Tailwind** |
| Sci-fi chrome | **Arwes (`@arwes/react`)** |
| Motion | **Motion (formerly Framer Motion) + GSAP for boot sequence** |
| 3D scene | **react-three-fiber + drei + @react-three/postprocessing** |
| Inter-agent lines | **Magic UI `<AnimatedBeam>`** (NOT xyflow — too heavy for our timeline) |
| Particle backdrop | **tsParticles `links` preset** |
| Streaming text | **Vercel AI SDK + flowtoken** for per-token blur-in |
| Audio | **Howler.js sprite** |
| Backend orchestration | **LangGraph (Python) + langgraph-supervisor** |
| Agent runtime | **Claude Sonnet 4.5 via Anthropic SDK** |
| Frontend protocol | **CopilotKit + AG-UI Protocol** |
| Voice (transcribe only) | **OpenAI Realtime API over WebRTC** → forward text to Claude |
| Deploy | **Vercel** for frontend, **Railway** or **Fly.io** for Python backend |

**If a task requires a tool not on this list, ask before installing.**

---

## Project structure

```
jarvis-stage/
├── frontend/                    # Next.js 15 app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       └── voice/route.ts   # OpenAI Realtime bridge
│   ├── components/
│   │   ├── Scene/
│   │   │   ├── CEOCore.tsx      # R3F sphere with bloom
│   │   │   └── DepartmentNode.tsx
│   │   ├── Panels/
│   │   │   └── DepartmentPanel.tsx
│   │   ├── Streaming/
│   │   │   └── AgentFeed.tsx
│   │   ├── Connections/
│   │   │   └── Beam.tsx         # Magic UI AnimatedBeam wrapper
│   │   ├── Backdrop/
│   │   │   ├── ParticleField.tsx
│   │   │   └── VideoLayer.tsx   # Higgsfield/Seedance
│   │   └── ui/                  # shadcn primitives
│   ├── lib/
│   │   ├── sound.ts             # Howler sprite manager
│   │   ├── eventBus.ts          # useAgentEventBus pub/sub
│   │   └── fakeMode.ts          # pre-recorded responses for stage
│   └── public/
│       ├── audio/ui-sounds.mp3  # Howler sprite
│       └── video/backdrop-*.mp4 # Higgsfield/Seedance loops
└── backend/                     # Python LangGraph supervisor
    ├── main.py                  # FastAPI entry
    ├── agents/
    │   ├── ceo.py               # Supervisor agent
    │   ├── marketing.py
    │   ├── sales.py
    │   └── operations.py
    ├── prompts/
    │   ├── ceo_system.md
    │   ├── marketing_system.md
    │   ├── sales_system.md
    │   └── operations_system.md
    └── requirements.txt
```

---

## Reference repos (already cloned to ../reference/)

You can `@Folder` these in any prompt — Cursor will read them as context.

- **`../reference/canvas-with-langgraph-python`** — closest turnkey monorepo (CopilotKit). Clone and modify, don't build from scratch.
- **`../reference/claude-agent-sdk-demos`** — Anthropic's reference patterns. Specifically `research-agent/` for orchestrator pattern, `simple-chat-app/` for WebSocket streaming.
- **`../reference/open-multi-agent-canvas`** — multi-agent UI pattern.
- **`../reference/claude-cookbooks`** — `patterns/agents/orchestrator_workers.ipynb` is the foundational pattern. Read first.
- **`../reference/openai-realtime-agents`** — voice front-end reference (only used Day 5).

When I ask for a feature, **first check these references for an existing pattern** before writing from scratch.

---

## Day-by-day deliverables

We are building this in 7 days. **Each day must end with a verifiable deliverable.** Don't move to Day N+1 until Day N's deliverable runs.

| Day | Deliverable |
|---|---|
| **1** | Next.js app + Python backend running. Type "hello" in chat → see Claude streaming tokens. LangSmith trace appears. |
| **2** | LangGraph supervisor with CEO + Marketing + Sales + Operations agents. Curl `/api/run` with intent → all 4 fire, real content returned. |
| **3** | React Flow / agent-network view with 4 nodes. Type intent → CEO node pulses → correct department lights up → returns. |
| **4** | Click Marketing → expands to sub-categories → real LinkedIn drafts stream in via Vercel AI SDK + flowtoken. |
| **5** | Push-to-talk (spacebar) voice via OpenAI Realtime → transcript → LangGraph → response. Hidden Cmd+T fallback. |
| **6** | "Hey team, plan this week" fires Marketing + Sales + Ops in parallel. Inter-agent beams animate. CEO synthesizes. <30s end to end. |
| **7** | Polish + rehearsal. Kill-switch (Esc), fake-mode toggle, deploy to Vercel + Railway, pin SDK versions, run demo 5× back-to-back. |

---

## Coding constraints

- **TypeScript strict mode** on frontend. No `any` unless explicitly justified in a comment.
- **Tailwind only** for styles. No CSS modules, no styled-components, no inline styles beyond layout.
- **Server Components by default** in Next.js. Client component only when needed for interactivity. Mark with `"use client"`.
- **No new top-level dependencies** without asking. Use what's in the locked stack.
- **No refactoring outside the current task.** If you see code that's wrong, flag it but don't change it.
- **Commit after every deliverable.** Conventional Commits format: `feat(day-N): <what>`, `fix(...)`.
- **Keep `lib/fakeMode.ts` updated** — every new agent response should have a fake-mode equivalent for stage rehearsal.
- **Comments only when necessary** — explain WHY, not WHAT. Don't comment obvious code.

---

## Definition of done (per task)

A task is done when:

1. The deliverable from the day-by-day table above is verifiable
2. `npm run build` passes (no type errors, no warnings)
3. Python backend `uvicorn main:app` starts without errors
4. The feature works in **both real mode and fake mode** (toggle via env var `NEXT_PUBLIC_FAKE_MODE=true`)
5. A 30-second screen recording of the feature exists (you don't need to do this — I will)

---

## Day 1 starting task

**Now (your first job):**

1. Create the project structure shown above.
2. In `frontend/`: `npx create-next-app@latest . --ts --tailwind --app --src-dir false --import-alias "@/*"` — say yes to ESLint, no to React Server Action defaults if it asks.
3. In `backend/`: scaffold a FastAPI app with one endpoint `/api/health` that returns `{"status": "ok"}` and one endpoint `/api/chat` that accepts a JSON `{intent: string}` and streams Claude Sonnet 4.5 tokens back as SSE.
4. In `frontend/app/page.tsx`: build a minimal chat UI using `assistant-ui` or just a plain React form that POSTs to backend `/api/chat` and renders streamed tokens.
5. Use the Anthropic API key from `process.env.ANTHROPIC_API_KEY` — I have it set in `.env.local` for frontend and `.env` for backend.
6. Add a `README.md` at root with run instructions.

**Test command at the end of Day 1:** From the chat UI, send "Say hello in pirate voice" and watch tokens stream in token-by-token.

When that works, commit with `feat(day-1): scaffold + claude streaming` and stop. Report back what you built and ask for Day 2.

---

## Things I will NOT accept

- "Let me suggest an alternative architecture" → No. Stack is locked.
- "Let's add Redis for state management" → No. SQLite checkpointer is fine.
- "I'll refactor the existing code while I'm here" → No. Stay in scope.
- "I need clarification on..." for anything already spec'd above → Re-read this brief.
- Code without types. Code without error handling on network calls. Code that mocks data when real Claude calls are spec'd.

---

## Your role

You are an experienced full-stack engineer who has shipped multi-agent orchestration before. You know LangGraph, you know Next.js App Router, you know R3F. You make confident decisions within the locked stack and push back **only** if a task is technically impossible or unsafe. You don't pretend to think — you build.

**Acknowledge this brief by saying "Got it — building Day 1 now," then start.**
