# 03 — Jarvis Build Stack

**Goal:** A live-stage, voice-controlled, multi-agent "AI Employee Command Center" demoed in May 2026.
A CEO orchestrator routes to Marketing / Sales / Operations specialists.
Real Claude calls. Real-time streaming. Inter-agent traffic visible to the audience.
**Build window: 7 days.** Solo dev wielding Claude Code.

---

## TL;DR — The Opinionated Pick

Build the demo as a **Next.js monorepo** with this stack:

| Layer | Pick | Why |
|---|---|---|
| Orchestration | **LangGraph (Python) + langgraph-supervisor** | Industry-standard supervisor pattern, Anthropic-native, drawable as a graph for the audience |
| Agent runtime | **Claude Sonnet 4.5 via Anthropic SDK** | 2× speed of Sonnet 4, parallel tool calls, 1.1s TTFT — the show needs latency |
| Frontend | **Next.js 15 + CopilotKit + AG-UI Protocol** | Already speaks LangGraph, ships with shared-state streaming, generative UI, human-in-the-loop |
| Visualization | **React Flow** for the org-chart node graph + **assistant-ui** for the chat panel | React Flow is the de-facto node graph; assistant-ui handles streaming chat primitives |
| Voice | **OpenAI Realtime API over WebRTC** (frontend) bridged to Claude (backend) | Lowest-latency, browser-native, used by openai-realtime-agents reference; Pipecat as backup |
| Observability | **Langfuse (self-hosted) + LangSmith (LangChain native)** | Live traces of inter-agent calls — useful for the demo and post-mortem |
| Reference templates | **CopilotKit/open-multi-agent-canvas** + **anthropics/claude-agent-sdk-demos** (research-agent) | Two working repos to clone-and-modify rather than build from scratch |

**Why this stack and not the alternatives:**

- **Not OpenAI Agents SDK** as the orchestrator: the presenter is on Claude. The handoff pattern is elegant, but tying the show to OpenAI's runtime forces double-vendor risk and breaks the "Claude-powered" narrative. Use it only for the voice front-end.
- **Not CrewAI:** great for prototypes, but inter-agent state is fuzzy and hard to *visualize* live. The audience needs to see deterministic routing.
- **Not AutoGen:** debate-style agent loops blow latency and token cost. A 4-agent debate × 5 rounds = 20+ LLM calls. On stage that's a 30-second silence.
- **Not Mastra:** beautiful TS framework, but the LangGraph + CopilotKit ecosystem has the tooling Claude Code can scaffold fastest *today*.
- **Not raw Claude Agent SDK alone:** ships with subagent support but no opinionated UI layer. Use its `research-agent` demo as the *pattern*, host it inside CopilotKit's UI.

---

## Section A — The Recommended Stack (Top 5 Repos to Build With)

### A1. CopilotKit/CopilotKit — The Frontend & Protocol Layer
- **URL:** https://github.com/CopilotKit/CopilotKit
- **Stars:** 30.5k · **License:** MIT · **Last release:** v1.56.4 (Apr 27, 2026) · **Active:** Yes
- **Why it's #1:** Ships the AG-UI Protocol — the missing standard for streaming agent state, tool calls, and intermediate steps from any backend (LangGraph, ADK, custom) into a React frontend. Already adopted by Google, Oracle, LangChain. CopilotKit handles `useCoAgent`, `useCoAgentStateRender`, human-in-the-loop, generative UI — exactly the primitives the demo needs.
- **Files/folders to study first:**
  - `examples/coagents-research-canvas/` — full-stack LangGraph + CopilotKit canvas (mirror of the demo shape)
  - `examples/showcases/multi-agent-canvas/` — multi-agent routing in one chat (Travel + Research + MCP)
  - `examples/coagents-starter/` — minimum viable wiring
  - `packages/runtime` and `packages/react-ui` for SDK internals
- **Integration cost:** ~4 hours to get baseline streaming working; ~1 day to wire department-routing visuals.
- **Risks:** Self-hosted runtime is fine; CopilotKit Cloud adds cost. Tool-call rendering is opinionated — accept it, don't fight it.

### A2. langchain-ai/langgraph (+ langgraph-supervisor-py) — Orchestration Backbone
- **URL:** https://github.com/langchain-ai/langgraph · supervisor: https://github.com/langchain-ai/langgraph-supervisor-py
- **Stars:** 30.9k (langgraph) · **License:** MIT · **Latest:** langgraph-prebuilt 1.0.13 (Apr 30, 2026)
- **Why:** The supervisor pattern maps 1:1 to "CEO agent → department agents". Built-in checkpointing, streaming events (`stream_mode="values" / "updates" / "messages"`), human-in-the-loop, time-travel debug. LangGraph Studio gives a free graph visualizer that you can secondary-screen on stage.
- **Files/folders to study first:**
  - `langgraph-supervisor-py/README.md` — supervisor primitive in 30 lines
  - `langgraph/docs/docs/tutorials/multi_agent/` — supervisor + swarm tutorials
  - `langgraph/libs/langgraph/langgraph/graph/` — StateGraph internals if you need to customize
- **Integration cost:** ~6–10 hours to define CEO + 3 specialist agents with proper state, message routing, and checkpointer. Use `ChatAnthropic(model="claude-sonnet-4-5")`.
- **Risks:** Python-only orchestrator means a polyglot repo (Py backend + TS frontend). FastAPI bridge is the fix.

### A3. anthropics/claude-agent-sdk-demos — Anthropic's Reference Patterns
- **URL:** https://github.com/anthropics/claude-agent-sdk-demos
- **Stars:** 2.3k · **License:** MIT · **Language:** TypeScript 88.7%, Python 9.1%
- **Why:** Anthropic's own multi-agent showcase. The `research-agent/` demo is a CEO-orchestrator-routes-to-subagents demo with parallel research workers, written in TS. It uses `AgentDefinition`, `SubagentTracker`, `HookMatcher` — the exact primitives needed to track and stream subagent activity. The `simple-chat-app/` shows React + Express + WebSocket streaming.
- **Files/folders to study first:**
  - `research-agent/research_agent/agent.py` — orchestrator pattern
  - `research-agent/` whole folder — the spawning/tracking model
  - `simple-chat-app/` — clean WebSocket streaming pattern to React
  - `hello-world-v2/` — V2 Session API (`send()` / `stream()` separation, multi-turn, persistence)
- **Integration cost:** ~2 hours to clone and run; ~1 day to fork the orchestrator pattern into the LangGraph supervisor.
- **License:** MIT — commercial demo OK.

### A4. assistant-ui/assistant-ui — Production-Grade Streaming Chat Primitives
- **URL:** https://github.com/assistant-ui/assistant-ui
- **Stars:** 9.8k · **License:** MIT · **Latest:** v0.1.13 (Apr 30, 2026) · ~200k monthly downloads
- **Why:** Ships streaming, auto-scroll, tool-call rendering, voice dictation, accessibility, retries — all the chat-UX details that eat 2 days when you build them yourself. Integrates natively with **Vercel AI SDK, LangGraph, AND Mastra**. Used by LangChain, Stack AI, Browser Use. Composable shadcn-style primitives, not a monolith — so the chat panel can be one column inside the bigger command-center layout.
- **Files/folders to study first:**
  - `apps/docs/content/docs/runtimes/` — runtime adapters (LangGraph, AI SDK)
  - `examples/with-langgraph/` — drop-in pattern
- **Integration cost:** ~3 hours to wire alongside CopilotKit. Use it for the *chat column*; CopilotKit for the *agent state column*.
- **Risks:** Some overlap with CopilotKit's chat. Decide early: assistant-ui chat + CopilotKit state OR CopilotKit chat + custom state. Don't run both chat shells.

### A5. openai/openai-realtime-agents — Voice Front-End Reference
- **URL:** https://github.com/openai/openai-realtime-agents
- **Stars:** 6.8k · **License:** MIT · **Stack:** Next.js + WebRTC
- **Why:** The cleanest open-source pattern for browser-native voice agents with WebRTC. Includes the **Chat-Supervisor** pattern (small realtime model for fast voice + bigger model for reasoning) and **Sequential Handoffs** — the voice-input front of the demo. For Day 2's "Hey team, plan this week" moment, this is the reference. We use the **front-end voice** but route the transcribed intent to our Claude orchestrator (don't lock the show to OpenAI's runtime).
- **Files/folders to study first:**
  - `src/app/agentConfigs/chatSupervisor/` — the supervisor handoff pattern
  - `src/app/agentConfigs/simpleExample/` — minimum WebRTC voice wiring
  - PTT (push-to-talk) toggles — useful when audience noise is a risk
- **Integration cost:** ~6 hours to fork, swap the supervisor target from OpenAI to a Claude tool-call.
- **Critical:** Use **push-to-talk** on stage. Open-mic VAD + audience laughter = chaos. Volunteer holds spacebar.

---

## Section B — Supporting Repos (10–12 Building Blocks)

### B1. anthropics/claude-cookbooks (patterns/agents)
- **URL:** https://github.com/anthropics/claude-cookbooks/tree/main/patterns/agents
- **License:** MIT · **What it gives:** The canonical orchestrator-workers and evaluator-optimizer notebooks. `orchestrator_workers.ipynb` is the pattern that the whole demo riffs on. Read this **first** before writing any orchestration code.
- **Integration cost:** Reading time, 2 hours.

### B2. CopilotKit/open-multi-agent-canvas
- **URL:** https://github.com/CopilotKit/open-multi-agent-canvas
- **Stars:** 488 · **License:** MIT · **Stack:** Next.js + LangGraph + CopilotKit
- **What it gives:** A working scaffold that *already* manages multiple agents in one UI. Contains a `frontend/` (Next.js) and `agent/` (LangGraph) split — the exact monorepo shape we want. Now consolidated under `CopilotKit/CopilotKit/examples/showcases/multi-agent-canvas`.
- **Integration cost:** Clone, swap "Travel/Research" agents for "Marketing/Sales/Ops". Maybe 1 day.

### B3. CopilotKit/open-research-ANA
- **URL:** https://github.com/CopilotKit/open-research-ANA
- **License:** MIT · **What it gives:** The HITL canvas pattern — `agent/graph.py` defines a `MasterAgent` with a StateGraph, and the front-end mirrors agent state in real-time. This is the visual "CEO node thinks → routes to specialist" flow.
- **Integration cost:** ~4 hours to study; reuse the state-rendering pattern.

### B4. langchain-ai/agent-chat-ui
- **URL:** https://github.com/langchain-ai/agent-chat-ui
- **Stars:** 2.8k · **License:** MIT · **Stack:** Next.js
- **What it gives:** Minimal Next.js app to chat with any LangGraph server. Useful as a **fallback** if CopilotKit feels too heavy, and as a reference for the API-passthrough pattern (`langgraph-nextjs-api-passthrough`).
- **Integration cost:** ~1 hour to spin up; useful as a sanity-check tool throughout the build.

### B5. xyflow/react-flow (React Flow)
- **URL:** https://github.com/xyflow/xyflow (formerly reactflow)
- **License:** MIT · **What it gives:** The org-chart visualization. CEO at center, 3 department nodes, animated edges when messages flow. The `/whats-new/2026-03-19` post mentions `llms.txt` endpoints — Claude Code can scaffold custom nodes from docs alone.
- **Integration cost:** ~6 hours to build the org-chart with custom nodes for active/thinking/done states + animated edges.

### B6. pipecat-ai/pipecat (+ voice-ui-kit)
- **URL:** https://github.com/pipecat-ai/pipecat · UI kit: https://github.com/pipecat-ai/voice-ui-kit
- **Stars:** 11.6k · **License:** BSD-2-Clause · **Latest:** v1.1.0 (Apr 27, 2026)
- **What it gives:** Pluggable voice pipeline (STT → LLM → TTS) with **Silero VAD** and **Krisp** noise suppression — directly relevant to "audience noise" risk. Pipecat works **on top of LiveKit/Daily** so we get production WebRTC infra. Supports Anthropic as the LLM. The voice-ui-kit has React components: `ConnectButton`, `ControlBar`, `VoiceVisualizer`.
- **Integration cost:** ~1 day if we go this route instead of OpenAI Realtime. Recommended **as backup** — if OpenAI Realtime API has an outage on demo day, Pipecat is the fall-back path. (The presenter is using Claude regardless; voice is just the input modality.)

### B7. openai/openai-agents-python (Agents SDK)
- **URL:** https://github.com/openai/openai-agents-python
- **Stars:** 25.6k · **License:** MIT · **Active:** v latest Apr 9, 2026
- **What it gives:** The cleanest **mental model** for handoffs (`transfer_to_marketing`, `transfer_to_sales`). Even if we orchestrate in LangGraph, read the handoffs guide — it's how you should *name* and *describe* sub-agents to a parent LLM. Supports any model via 100+-LLM adapter, so you can run it with Claude.
- **Integration cost:** Read-only reference. ~2 hours.

### B8. AgentOps-AI/agentops
- **URL:** https://github.com/AgentOps-AI/agentops
- **License:** MIT · **What it gives:** Multi-agent session replay, time-travel debugging, cost tracking. Plug `@track_agent` decorators into LangGraph nodes and you get free observability. The session replay UI is genuinely useful for demo rehearsals.
- **Integration cost:** ~2 hours to instrument; pays for itself in debugging speed.

### B9. langfuse/langfuse
- **URL:** https://github.com/langfuse/langfuse
- **License:** MIT (entire product as of 2025) · **What it gives:** Self-hostable trace viewer for LangGraph/LangChain. Open it on a third screen during the demo; live traces are visually stunning and ground the "see the AI thinking" pitch.
- **Integration cost:** ~3 hours to self-host (Docker compose) + instrument LangGraph callbacks. Optional but high-impact.

### B10. Shubhamsaboo/awesome-llm-apps
- **URL:** https://github.com/Shubhamsaboo/awesome-llm-apps
- **Stars:** 70k+ · **License:** Apache-2.0 (no paywall, no telemetry — explicit)
- **What it gives:** Mining ground. Specifically:
  - `advanced_ai_agents/multi_agent_apps/ai_Self-Evolving_agent`
  - `AI Sales Intelligence Agent Team`
  - `Customer Support Voice Agent`
  - The voice agent and multi-agent team folders contain runnable Streamlit apps. Don't ship Streamlit on stage, but mine prompts and agent prompts liberally.
- **Integration cost:** Browsing time. Steal prompts and agent definitions for Marketing/Sales/Ops.

### B11. anthropics/claude-cookbooks (overall)
- **URL:** https://github.com/anthropics/claude-cookbooks
- **License:** MIT · **What it gives:** Beyond agents/ patterns, contains streaming, tool use, and prompt-caching recipes. Prompt caching is critical: cache the CEO system prompt and shave 60% latency on every routing decision. Day-of-show, this is the difference between "AI" and "AI on caffeine."
- **Integration cost:** Read while rehearsing.

### B12. CopilotKit/canvas-with-langgraph-python
- **URL:** https://github.com/CopilotKit/canvas-with-langgraph-python
- **License:** MIT · **What it gives:** AG-UI canvas starter, Python LangGraph backend. Closest thing to a turnkey monorepo for the demo. Strong candidate for `git clone` Day 1.
- **Integration cost:** Clone-and-modify. ~6 hours from clone to first custom agent visible.

---

## Section C — Architecture Diagram

```
                       ┌─────────────────────────────────────────────────────┐
                       │              STAGE BIG SCREEN (1080p)               │
                       │                                                     │
                       │   ┌────────────────────────────────────────────┐    │
                       │   │           Next.js 15 App (Vercel)          │    │
                       │   │                                            │    │
                       │   │  ┌──────────┐    ┌──────────────────────┐  │    │
                       │   │  │ React    │    │  CopilotKit Sidebar  │  │    │
                       │   │  │ Flow     │    │  (assistant-ui chat) │  │    │
                       │   │  │ org-     │    │  - streaming tokens  │  │    │
                       │   │  │ chart    │    │  - tool calls render │  │    │
                       │   │  │  CEO     │    │  - agent state cards │  │    │
                       │   │  │  /│\\     │    │                      │  │    │
                       │   │  │ M  S  O  │    │                      │  │    │
                       │   │  └────┬─────┘    └──────────┬───────────┘  │    │
                       │   │       │                     │              │    │
                       │   │       └────────┬────────────┘              │    │
                       │   │                ▼                           │    │
                       │   │     ┌──────────────────────┐                │    │
                       │   │     │  AG-UI Protocol      │                │    │
                       │   │     │  (SSE event stream)  │                │    │
                       │   │     └──────────┬───────────┘                │    │
                       │   └────────────────┼────────────────────────────┘    │
                       │                    │                                 │
                       └────────────────────┼─────────────────────────────────┘
                                            │
                  WebRTC voice               │ AG-UI events  (SSE)
                  (push-to-talk volunteer)   │
                       ▼                    ▼
            ┌─────────────────────┐   ┌──────────────────────────────────────┐
            │ OpenAI Realtime API │   │  FastAPI / Express bridge            │
            │ (transcribe only)   │──▶│  (Python or Node, your call)         │
            │ → text intent       │   └─────────────┬────────────────────────┘
            └─────────────────────┘                 │
                                                    ▼
                                  ┌──────────────────────────────────────────┐
                                  │  LangGraph Supervisor (Python)           │
                                  │                                          │
                                  │      ┌─────────────────────────┐         │
                                  │      │   CEO Agent (Sonnet 4.5)│         │
                                  │      │   system: "You are CEO" │         │
                                  │      │   tools: [route_to_*]   │         │
                                  │      └────────┬────────────────┘         │
                                  │               │                          │
                                  │      ┌────────┴───────┬──────────┐       │
                                  │      ▼                ▼          ▼       │
                                  │  ┌────────┐      ┌────────┐  ┌────────┐  │
                                  │  │ Mktg   │      │ Sales  │  │ Ops    │  │
                                  │  │ Agent  │      │ Agent  │  │ Agent  │  │
                                  │  │ Sonnet │      │ Sonnet │  │ Sonnet │  │
                                  │  │ 4.5    │      │ 4.5    │  │ 4.5    │  │
                                  │  └────────┘      └────────┘  └────────┘  │
                                  │                                          │
                                  │  Anthropic SDK · prompt caching · MCP    │
                                  │  Checkpointer: SQLite (in-memory OK)     │
                                  └──────────────┬───────────────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────────────────┐
                              │  Observability (3rd monitor)             │
                              │  - LangGraph Studio (graph view)         │
                              │  - Langfuse traces                       │
                              │  - AgentOps session replay (post-show)   │
                              └──────────────────────────────────────────┘
```

**Key data flows:**
1. Volunteer holds spacebar → mic → OpenAI Realtime returns transcribed text
2. Transcribed intent POSTed to FastAPI bridge `/api/run`
3. FastAPI invokes LangGraph supervisor with the intent
4. CEO agent decides routing, calls `route_to_marketing` (or multiple in parallel)
5. Each tool call streams `update` events back via AG-UI SSE
6. CopilotKit `useCoAgentStateRender` lights up the right node in React Flow
7. Specialist agents stream their token output to the chat panel
8. CEO synthesizes and returns final response

---

## Section D — 7-Day Build Sprint

Daily target: 6–8 hours of focused build with Claude Code. Adjust if you stall.

### Day 1 — Scaffold & Hello World (Sat)
**Goal:** A running Next.js app with one Claude call streaming to a React chat.
- **Morning:**
  1. `git clone` `CopilotKit/canvas-with-langgraph-python` → rename, push to your repo
  2. `git clone` `anthropics/claude-agent-sdk-demos` → study `research-agent/` and `simple-chat-app/`
  3. Install: `pnpm install` frontend, `uv pip install` Python backend
- **Afternoon:**
  4. Replace the canvas LLM with `ChatAnthropic(model="claude-sonnet-4-5-20250929")`
  5. Verify streaming works: type "hello" in chat, see tokens stream
  6. Set up Anthropic API key + LangSmith tracing
- **Evening:**
  7. Read `anthropics/claude-cookbooks/patterns/agents/orchestrator_workers.ipynb` cover-to-cover
- **Deliverable:** End-to-end chat with Claude, streaming visible, LangSmith trace appears.

### Day 2 — Define the Agents (Sun)
**Goal:** CEO + 3 department agents wired in LangGraph supervisor pattern.
- Install `langgraph-supervisor` package
- Write 4 system prompts (CEO, Marketing, Sales, Operations) — borrow wholesale from `purely-personal:marketing-engine`, `sales-engine`, `operations-engine` skills you already have in this directory (massive shortcut)
- Define `create_supervisor([marketing, sales, ops], model=ChatAnthropic(...))`
- Test text-only: "Plan this week's content" should route to Marketing, return real LinkedIn drafts
- Add prompt caching to the CEO system prompt (saves ~60% latency on every call)
- **Deliverable:** Curl the FastAPI endpoint with a text intent, see all 4 agents fire in trace, real content returned.

### Day 3 — The Org-Chart Visual (Mon)
**Goal:** React Flow with CEO + 3 department nodes that light up when active.
- Install `@xyflow/react` (formerly `reactflow`)
- Build 4 custom node types: `<CeoNode />`, `<DeptNode />` with `idle | thinking | done` states
- Animated edges (`animated: true`) when messages flow
- Wire `useCoAgent` hook from CopilotKit to subscribe to LangGraph state updates
- When a sub-agent fires, set its node state to `thinking`; when it returns, `done`
- Polish: custom Tailwind colors per department, glow effect on active nodes
- **Deliverable:** Type "create LinkedIn content" → CEO node pulses → Marketing node lights up → returns. Audience can see the routing.

### Day 4 — Sub-Category Drilldown + Generative UI (Tue)
**Goal:** Click Marketing → expands to sub-categories (Content / Ads / Email). Click sub → real work happens.
- Use CopilotKit `useCoAgentStateRender` to render generative UI cards in chat as agents work
- For each department, define 3 sub-tools (e.g. Marketing → `draft_linkedin`, `draft_newsletter`, `draft_x_thread`)
- Build expand/collapse animation in React Flow when CEO node is "clicked" (or programmatically triggered by voice intent)
- Integrate the `purely-personal:marketing-engine` skill content directly — re-use its prompts as the Marketing agent's tool implementations
- **Deliverable:** Day 1 demo flow works end-to-end via text. "Click Marketing → Content → 'Plan this week'" produces 3 real LinkedIn posts streaming live.

### Day 5 — Voice Input (Wed)
**Goal:** Push-to-talk volunteer can speak and the system reacts.
- `git clone` `openai/openai-realtime-agents` for reference
- Add a simple WebRTC voice component to the Next.js app (use `pipecat-ai/voice-ui-kit` or roll your own with the Web Audio API + OpenAI Realtime endpoint)
- Bind spacebar to push-to-talk; use OpenAI Realtime *only* for transcription, then forward the transcript text to the existing LangGraph pipeline
- **Critical:** Add a **manual override** — if voice fails on stage, presenter can type the same intent in <2 seconds. Build a hidden "type instead" toggle (Cmd+T).
- Pre-script 5 stage commands and **rehearse** with volunteer noise simulation (play a YouTube clip of a noisy auditorium during testing)
- **Deliverable:** Speak "create this week's LinkedIn content" → see content stream in.

### Day 6 — Day 2 Showstopper: Multi-Department Orchestration (Thu)
**Goal:** "Hey team, plan this week" fires Marketing + Sales + Ops in parallel, with inter-agent visible "talking."
- In LangGraph, define a meta-tool that the CEO uses to dispatch to multiple departments simultaneously
- Use Claude Sonnet 4.5's parallel tool calls (it fires multiple in one turn)
- Visualize parallel execution in React Flow: 3 nodes glow simultaneously, edges animate
- Add a "synthesis" step where CEO node aggregates the three outputs and produces a unified weekly plan
- Polish: department-color tokens stream into the chat in distinct columns or with avatars
- **Deliverable:** Day 2 showstopper works. Voice → 3 departments fire in parallel → CEO synthesizes → audience sees a real, coherent weekly business plan in <30 seconds.

### Day 7 — Hardening + Rehearsal (Fri)
**Goal:** Demo-day reliable. No hot fixes.
- **Morning — Reliability:**
  - Cache prompts (`anthropic-beta: prompt-caching-2024-07-31` or current header)
  - Add retry logic on every Anthropic call (one retry, 1.5s backoff)
  - Pre-warm: on app load, fire a tiny Claude call so the first stage call is hot
  - Local fallback: hard-code a "Plan B" canned response that triggers if any agent times out >15s. Audience never knows.
- **Afternoon — Rehearse:**
  - Run the full Day 1 + Day 2 demo 5 times back-to-back
  - Time it: each segment should land in <60s of agent thinking
  - Have a friend make audience noise during voice tests
  - Record the dry run, watch it back at 2× to spot dead air
- **Evening:**
  - Deploy to Vercel with stable URL
  - Pin Anthropic SDK and CopilotKit versions in `package.json` and `requirements.txt`
  - Plug in laptop to projector, test colors and font sizes from row 20 of a fake auditorium
  - Print one-page run-of-show and tape it to the laptop
- **Deliverable:** Demo is muscle memory. You can run it half-asleep.

---

## Section E — Risks & Unknowns

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Voice fails in noisy room** | High | Show-stopper | Push-to-talk only. Pre-test with 80dB noise loop. Hidden Cmd+T fallback to type the same intent. Don't use open-mic VAD on stage. |
| **Anthropic API rate limit / outage on demo day** | Medium | Show-stopper | Pre-cache prompts. Have a recorded video fallback for each segment as last resort. Keep tier high (Tier 4 or above). |
| **Inter-agent latency too high (>20s for 3-agent fan-out)** | Medium | Pacing kill | Use Claude Sonnet 4.5 (2× faster than 4.0). Use Haiku 4.5 for routing if Sonnet too slow. Parallelize via `parallel_tool_calls`. Pre-warm by sending a no-op call on stage entry. |
| **WebSocket / SSE drops mid-demo** | Low | Visible glitch | Use Vercel deployment with HTTP/2 SSE. Test on hotel WiFi. Have a hotspot backup. |
| **CopilotKit + assistant-ui state collision** | Medium | Build delay | Pick one chat shell on Day 1. Don't run both. CopilotKit primary; assistant-ui only if you need its specific primitives. |
| **LangGraph supervisor loops or hallucinates routing** | Low–Medium | Wrong department fires | Add a `routing_confidence` field. If <0.7, default to "general" and ask for clarification. Pre-script the 3 demo intents and bake the routing in via few-shot. |
| **Agent produces bad/embarrassing content live** | Low–Medium | Brand risk | Never claim "100% real-time live AI" if you can't trust it. Have a content validator step (Haiku checks for length + no profanity). Pre-script each demo prompt to a known-good output range. |
| **Over-engineering visualization** | High | Time sink | Day 3 boxed at 1 day. If React Flow is fighting you by lunch, fall back to CSS Grid + `motion-react` and ship. The audience cares about the *story*, not the prettiness. |
| **Vendor lock-in to OpenAI for voice** | Low | Narrative ding | Voice is just transcription, not reasoning. The pitch is "Claude reasoning, OpenAI ears." If pressed, swap voice to Pipecat + Deepgram in 1 day post-show. |
| **Polyglot repo (Py backend + TS frontend) deployment friction** | Medium | Day 7 hassle | Vercel for frontend, Railway/Fly for Python backend. Or use AI SDK's TS-native ToolLoopAgent for orchestration if you want a single-language repo (loses LangGraph Studio though — make the call by Day 2). |

**Two strategic open questions for the presenter to decide on Day 0:**
1. **TS-only or polyglot?** Polyglot gives you LangGraph Studio + the cleanest supervisor pattern. TS-only (Vercel AI SDK + assistant-ui) gives you simpler deployment and one mental model. **Recommendation: polyglot.** The visualization tooling alone justifies it.
2. **Self-host CopilotKit runtime or use Cloud?** Cloud is faster to set up but adds external dependency on demo day. **Recommendation: self-host on Vercel.** One fewer thing that can go down.

---

## What to Clone First (Stack Rank, Day 1)

```
1. CopilotKit/canvas-with-langgraph-python   # the monorepo skeleton
2. anthropics/claude-agent-sdk-demos          # the orchestrator pattern (study research-agent/)
3. CopilotKit/open-multi-agent-canvas         # the multi-agent UI pattern
4. anthropics/claude-cookbooks                # READ patterns/agents/ before writing code
5. openai/openai-realtime-agents              # voice front-end reference (Day 5)
```

**Repos to bookmark, not clone:** assistant-ui, langgraph (read docs), agent-chat-ui (fallback), pipecat (backup voice path), langfuse (observability if time).

**Repos to ignore for this build:** AutoGen, Letta, AgentScope (all good but heavy for 7 days), Mastra (great if you were TS-only and had 3 weeks).

---

## Sources

- CopilotKit: https://github.com/CopilotKit/CopilotKit
- AG-UI Protocol: https://github.com/ag-ui-protocol/ag-ui · https://docs.ag-ui.com/
- LangGraph: https://github.com/langchain-ai/langgraph
- LangGraph Supervisor: https://github.com/langchain-ai/langgraph-supervisor-py
- Anthropic Claude Agent SDK Demos: https://github.com/anthropics/claude-agent-sdk-demos
- Anthropic Cookbooks: https://github.com/anthropics/claude-cookbooks
- assistant-ui: https://github.com/assistant-ui/assistant-ui
- OpenAI Realtime Agents: https://github.com/openai/openai-realtime-agents
- OpenAI Agents SDK: https://github.com/openai/openai-agents-python
- Vercel AI SDK: https://github.com/vercel/ai
- Pipecat: https://github.com/pipecat-ai/pipecat · UI Kit: https://github.com/pipecat-ai/voice-ui-kit
- Open Multi-Agent Canvas: https://github.com/CopilotKit/open-multi-agent-canvas
- Open Research ANA: https://github.com/CopilotKit/open-research-ANA
- Canvas with LangGraph Python: https://github.com/CopilotKit/canvas-with-langgraph-python
- Agent Chat UI: https://github.com/langchain-ai/agent-chat-ui
- React Flow (xyflow): https://github.com/xyflow/xyflow
- AgentOps: https://github.com/AgentOps-AI/agentops
- Langfuse: https://github.com/langfuse/langfuse
- Awesome LLM Apps (Saboo): https://github.com/Shubhamsaboo/awesome-llm-apps
- AgentScope: https://github.com/agentscope-ai/agentscope (Apache-2.0; reference only — too heavy for 7 days)
- Letta (MemGPT): https://github.com/letta-ai/letta (reference only — memory layer if needed post-show)
- Claude Sonnet 4.5: https://www.anthropic.com/news/claude-sonnet-4-5
- Building agents with the Claude Agent SDK: https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
