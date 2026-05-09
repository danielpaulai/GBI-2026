# 10X Command Center — Build PRD

**Self-contained brief for any AI coding assistant in VS Code (Cursor / Cline / Roo / Copilot).**
Drop this file in the project root. Reference it from every prompt: `@File JARVIS_PRD.md`.

---

## 1 · Executive Summary

We are building **a live, voice-controlled, multi-agent AI Employee Command Center** to demo on stage at Guerrilla Business Intensive Singapore in front of 445 attendees. The demo is the centerpiece of a 90-minute sales presentation that closes a $1,997 cohort offer.

**Demo deadline: 7 days from project kickoff.**

The audience experience: a volunteer is pulled on stage. The presenter (Danny) instructs them to press a department node on the screen. The Marketing AI fires. Real LinkedIn drafts stream in via cinematic per-token blur-in animation. The audience sees what an "AI Employee" actually looks like. Then we repeat for Sales AI, Ops AI. The Day 2 showstopper: voice command "Hey team, plan this week" — all three departments fire in parallel, glowing beams animate between them, the CEO node synthesizes a unified weekly plan in <30 seconds.

The product being demoed is real, working software powered by Claude Sonnet 4.5. But for stage reliability, every feature also runs in **fake mode** — pre-recorded responses played back token-by-token, visually identical to live, deterministic, no API failures. Default to fake mode on stage day.

---

## 2 · The Three Layers

### Layer 1 · Visual Shell (frontend)

Iron Man / Tron / Mission: Impossible energy. CEO node glowing at the center of the screen. Three department satellites orbiting (Marketing, Sales, Operations). Pulsing nodes. Expanding panels with sci-fi chamfered corners. Particle backdrop. Glassmorphism. Everything reads from row 20 of a 1000-seat auditorium on a 4K projector.

Technologies:
- Next.js 15 App Router + TypeScript strict mode
- Tailwind + shadcn/ui for primitives
- Arwes (`@arwes/react`) for sci-fi chrome (FrameSVGOctagon panels, BleepsProvider)
- Motion (formerly Framer Motion) for component animations
- GSAP for the boot timeline only
- react-three-fiber + drei + @react-three/postprocessing for the CEO sphere with real volumetric bloom
- Magic UI `<AnimatedBeam>` for inter-agent connection lines (NOT xyflow — too heavy for our timeline)
- tsParticles `links` preset for particle backdrop
- Vercel AI SDK (`ai`) + flowtoken for cinematic per-token streaming
- Howler.js for audio sprite (zero-latency UI bleeps)
- CopilotKit + AG-UI Protocol for streaming agent state into the React UI

### Layer 2 · Agent Orchestration (backend)

A "CEO" agent receives the operator's intent and decides: respond directly, route to one department, or dispatch to all three in parallel. Each department agent is a specialist with its own system prompt, tone, and output format. Real Claude Sonnet 4.5 calls. Real-time streaming. Inter-agent traffic is broadcast back to the frontend via Server-Sent Events so the visualization can show what's happening live.

Technologies:
- Python 3.11+
- FastAPI + Uvicorn for the HTTP/SSE bridge
- LangGraph + langgraph-supervisor for the supervisor pattern
- langchain-anthropic for the LLM calls (model: `claude-sonnet-4-5-20250929`)
- SQLite checkpointer (in-memory is fine for a demo)
- Anthropic SDK with prompt caching enabled
- OpenAI Realtime API over WebRTC — used **only** for voice transcription. The transcript is forwarded to the LangGraph supervisor. Reasoning is exclusively Claude.

### Layer 3 · Cinematic Layer (assets)

Pre-rendered video clips for backdrop transitions. Generated outside this codebase using Higgsfield and Seedance (AI video generators). Loop seamlessly. Played behind the UI with `mix-blend-mode: screen` and `opacity: 0.12-0.18` so they bleed cinematic energy through without competing for contrast. 3-5 clips at 4K, 10-15 seconds each. Subjects: abstract cyan particles drifting, slow camera over dark grid plane, gentle nebula or aurora.

This layer is **content, not code.** The codebase loads the video files; the video generation happens outside the build.

---

## 3 · Locked Tech Stack — DO NOT SUGGEST ALTERNATIVES

| Layer | Pick | Reason |
|---|---|---|
| Frontend framework | **Next.js 15 (App Router) + TypeScript strict** | Server Components for streaming, Vercel deploy in 60s |
| Component primitives | **shadcn/ui + Tailwind** | Free, copy-paste, owns its own code |
| Sci-fi chrome | **Arwes (`@arwes/react`)** | Animator state machine + FrameSVGOctagon = the Jarvis look |
| Motion | **Motion (Framer)** for components, **GSAP** for boot only | Motion for variants/stagger, GSAP for one cinematic timeline |
| 3D scene | **react-three-fiber + drei + @react-three/postprocessing** | The CEO sphere needs real bloom, not CSS box-shadow |
| Inter-agent lines | **Magic UI `<AnimatedBeam>`** | 30 lines vs xyflow's 6 hours; ships great, ship fast |
| Particle backdrop | **tsParticles `links` preset** | Connecting-dots backdrop, low CPU |
| Streaming text | **Vercel AI SDK + flowtoken** | Per-token blur-in = "AI materializing thoughts" |
| Audio | **Howler.js sprite** + Arwes BleepsProvider | Sub-1KB triggers, zero latency on stage |
| Backdrop video | HTMLVideoElement + Higgsfield/Seedance clips | `mix-blend-mode: screen` + opacity 0.12-0.18 |
| Frontend protocol | **CopilotKit + AG-UI Protocol** | Streams agent state from any backend into React |
| Backend orchestration | **LangGraph (Python) + langgraph-supervisor** | Industry-standard supervisor pattern, drawable as a graph |
| Agent runtime | **Claude Sonnet 4.5** via `langchain-anthropic` | 2× speed of Sonnet 4, parallel tool calls, 1.1s TTFT |
| Voice (transcribe only) | **OpenAI Realtime API over WebRTC** | Lowest latency, browser-native; transcript forwarded to Claude |
| Frontend deploy | **Vercel** | Stable URL, HTTP/2 SSE works |
| Backend deploy | **Railway** or **Fly.io** | Simple Python deploy |

**Rejected alternatives (do not propose):**
- ❌ CrewAI — inter-agent state too fuzzy to visualize live
- ❌ AutoGen — debate loops blow latency, 4-agent debate × 5 rounds = 30s silence
- ❌ Mastra — beautiful but LangGraph ecosystem has more tooling today
- ❌ OpenAI as the reasoning model — breaks the "Claude-powered" narrative
- ❌ Open-mic VAD on stage — audience laughter = chaos. Push-to-talk only.
- ❌ xyflow for inter-agent lines — too heavy for our 7-day timeline
- ❌ Both CopilotKit chat AND assistant-ui chat — pick one (CopilotKit)
- ❌ Langfuse / AgentOps observability — out of scope for demo
- ❌ Single CSS box-shadow for glow — looks amateur

---

## 4 · Architecture

```
┌────────────────────────────────────────────────────────┐
│           STAGE BIG SCREEN (1080p projector)           │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │            Next.js 15 App (Vercel)             │   │
│   │                                                │   │
│   │  ┌──────────┐         ┌─────────────────────┐  │   │
│   │  │   R3F    │         │  CopilotKit Sidebar │  │   │
│   │  │   CEO    │         │  - streaming tokens │  │   │
│   │  │  Sphere  │◀───────▶│  - tool call cards  │  │   │
│   │  │   /│\\   │         │  - agent state      │  │   │
│   │  │  M S O   │         │                     │  │   │
│   │  └────┬─────┘         └──────────┬──────────┘  │   │
│   │       │                          │             │   │
│   │       └────────────┬─────────────┘             │   │
│   │                    ▼                           │   │
│   │         ┌──────────────────────┐               │   │
│   │         │   AG-UI Protocol     │               │   │
│   │         │   (SSE event stream) │               │   │
│   │         └──────────┬───────────┘               │   │
│   └────────────────────┼───────────────────────────┘   │
└────────────────────────┼───────────────────────────────┘
                         │
   WebRTC voice          │ AG-UI events  (SSE)
   (push-to-talk)        │
        ▼                ▼
┌─────────────────┐  ┌────────────────────────────────┐
│ OpenAI Realtime │  │  FastAPI bridge (Python)       │
│ (transcribe)    │─▶│  POST /api/run                 │
│ → text intent   │  └──────────┬─────────────────────┘
└─────────────────┘             │
                                ▼
              ┌─────────────────────────────────────────┐
              │  LangGraph Supervisor                   │
              │                                         │
              │       ┌─────────────────────────┐       │
              │       │   CEO (Sonnet 4.5)      │       │
              │       │   tools: route_to_*,    │       │
              │       │          dispatch_all   │       │
              │       └────────┬────────────────┘       │
              │                │                        │
              │       ┌────────┼─────────┬─────────┐    │
              │       ▼        ▼         ▼         ▼    │
              │   ┌──────┐ ┌──────┐ ┌──────┐  (parallel)│
              │   │ Mktg │ │Sales │ │ Ops  │            │
              │   │ 4.5  │ │ 4.5  │ │ 4.5  │            │
              │   └──────┘ └──────┘ └──────┘            │
              │                                         │
              │  Anthropic SDK · prompt caching · MCP   │
              │  Checkpointer: SQLite (in-memory OK)    │
              └─────────────────────────────────────────┘
```

### Data flow

1. Volunteer holds spacebar → mic → OpenAI Realtime returns transcribed text
2. Transcribed intent POSTed to `/api/run`
3. FastAPI invokes LangGraph supervisor with the intent
4. CEO agent decides routing — solo (one department), parallel (all three), or direct response
5. Each tool call streams `update` events back via AG-UI SSE
6. CopilotKit `useCoAgentStateRender` lights up the right node in the React UI
7. Specialist agents stream their token output to the chat panel via flowtoken
8. CEO synthesizes (parallel mode only) and returns final response

---

## 5 · Project Structure

```
jarvis-stage/
├── .cursorrules                 # AI assistant rules (coding + visual)
├── JARVIS_PRD.md                # this file
├── README.md                    # run instructions
├── .env.example                 # required env vars
├── .gitignore
│
├── frontend/                    # Next.js 15 app
│   ├── app/
│   │   ├── layout.tsx           # CopilotKit provider, dark theme
│   │   ├── page.tsx             # main stage view
│   │   ├── globals.css
│   │   └── api/
│   │       ├── copilotkit/      # AG-UI runtime endpoint
│   │       │   └── route.ts
│   │       └── voice/           # OpenAI Realtime token issuer
│   │           └── route.ts
│   ├── components/
│   │   ├── Scene/
│   │   │   ├── CEOCore.tsx      # R3F sphere with bloom
│   │   │   ├── DepartmentNode.tsx
│   │   │   └── AgentNetwork.tsx # composes CEO + 3 nodes
│   │   ├── Panels/
│   │   │   └── DepartmentPanel.tsx  # Arwes FrameSVGOctagon + sub-buttons
│   │   ├── Streaming/
│   │   │   └── AgentFeed.tsx    # flowtoken SmoothText streaming
│   │   ├── Connections/
│   │   │   └── Beam.tsx         # Magic UI AnimatedBeam wrapper
│   │   ├── Voice/
│   │   │   └── PushToTalk.tsx   # spacebar mic
│   │   ├── Backdrop/
│   │   │   ├── ParticleField.tsx
│   │   │   └── VideoLayer.tsx   # Higgsfield/Seedance loop
│   │   └── ui/                  # shadcn primitives (button, card, input)
│   ├── lib/
│   │   ├── sound.ts             # Howler sprite manager
│   │   ├── eventBus.ts          # useAgentEventBus pub/sub
│   │   ├── fakeMode.ts          # pre-recorded responses
│   │   └── shortcuts.ts         # Esc, Cmd+T, Cmd+Shift+R hotkeys
│   ├── public/
│   │   ├── audio/
│   │   │   └── ui-sounds.mp3    # Howler sprite (8 sounds)
│   │   └── video/
│   │       ├── backdrop-cyan.mp4
│   │       ├── backdrop-grid.mp4
│   │       └── backdrop-nebula.mp4
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
└── backend/                     # Python LangGraph supervisor
    ├── main.py                  # FastAPI entry
    ├── agents/
    │   ├── __init__.py
    │   ├── ceo.py               # supervisor config
    │   ├── marketing.py
    │   ├── sales.py
    │   └── operations.py
    ├── prompts/
    │   ├── ceo_system.md
    │   ├── marketing_system.md
    │   ├── sales_system.md
    │   └── operations_system.md
    ├── lib/
    │   ├── streaming.py         # SSE helpers
    │   └── caching.py           # Anthropic prompt caching headers
    ├── requirements.txt
    └── .env.example
```

---

## 6 · The Agents

### 6.1 · CEO Agent (Supervisor)

System prompt lives in `backend/prompts/ceo_system.md`:

```markdown
You are the CEO of a company. Your job is to receive an intent from the operator and decide how to handle it.

You have three department heads who report to you:
- **Marketing Director** (`marketing` agent) — handles content, campaigns, LinkedIn, voice/brand, copywriting
- **Sales Director** (`sales` agent) — handles outreach, lead generation, objection handling, closing scripts
- **Operations Director** (`operations` agent) — handles weekly priorities, KPIs, decisions, team coordination, reporting

## Routing rules

For every intent:

1. If the intent fits cleanly under ONE department, route to that department only.
2. If the intent says "team", "everyone", "weekly plan", "the business", or implies multi-department coordination, route to ALL THREE in parallel using `dispatch_to_all`.
3. If the intent is conversational (greeting, clarifying question, gratitude), respond directly without routing.
4. If you cannot confidently route, ask ONE specific clarifying question.

## Synthesis (after parallel dispatch only)

When all three departments return, synthesize into a unified weekly plan with this structure:

**This Week — [Concise theme]**

🎯 **Marketing**
[1-2 lines from Marketing's output]

🎯 **Sales**
[1-2 lines from Sales' output]

🎯 **Operations**
[1-2 lines from Operations' output]

**Top 3 priorities:**
1. [most important]
2. [second]
3. [third]

Keep synthesis tight. Audience watches this on a 4K projector — no walls of text.

## Voice

You are confident, decisive, brief. Write in plain English. No corporate jargon. No "synergize" or "leverage." If you wouldn't say it to a friend at a bar, don't write it.

## Business context

The company sells: AI Employee training programs and software (Founder OS) for solo founders and SME operators.
Current ICP: business owners $1M-$10M revenue, Asia-heavy, want to scale without hiring more humans.
```

### 6.2 · Marketing Agent

```markdown
You are the Marketing Director. You handle all content, campaigns, and brand voice.

## Output format

When asked for LinkedIn content, ALWAYS return exactly 3 drafts. Each draft has:
- A hook (line 1, must stop the scroll)
- A 3-5 line body
- A line break
- A CTA or question

## Hook patterns

- Specific number + outcome: "I deployed 3 AI employees in 90 minutes."
- Provocative reframe: "Poor people hire. Rich people deploy."
- Confession: "I used to do this manually for 2 years. Yesterday an AI did it in 4 seconds."
- Future-pace: "Tuesday morning, your AI team has already worked the weekend."

## Tone

Punchy. Hook-first. Second-person. Sentence fragments OK. Short paragraphs. Numbers and specifics over abstractions. Max 1 emoji per post. No hashtags.

## Constraints

- Never suggest hiring people. The product replaces humans with AI.
- Never use "leverage", "synergize", "unlock potential".
- Every post under 1200 characters.
- Always speak to ONE specific reader, not a crowd.

## Voice anchors

- Anchor word: "Tuesday" — drop when describing the post-cohort future.
- Catchphrase: "Who builds the AI? I DO!"

## Business context

Product: AI Employee training program — Pre-Bootcamp + 3-Week Bootcamp + 3-Week Live Accelerator + 3-Month Implementation Support.
ICP: solo founders, SME operators, $1M-$10M revenue, Asia-heavy.
```

### 6.3 · Sales Agent

```markdown
You are the Sales Director. You handle all outreach, lead generation, objection handling, and closing scripts.

## Output formats

For outreach drafts:
**Subject / DM line:** [under 8 words]
**Body:** [under 80 words, plain text, no formatting]
**Why this works:** [1-2 lines explaining the persuasion mechanic]

For objection handling:
**Objection:** [restated]
**Response:** [exact words to say, conversational, under 60 words]
**The mechanic:** [name the technique]

## Frameworks (rotate based on context)

- Cardone 3-bucket reframe — "I need to think about it" → "Not sure / no info / money issue. Which one?"
- Hormozi value equation — (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort)
- Brunson Stack + 3-closes-layered — emotional 50%, logical 30%, urgency 20%
- Eker identity lock — "You're the kind of person who builds systems that work for you."
- Just-One-Thing close — reduce decision to one low-friction yes

## Constraints

- Never use fake urgency. Real scarcity only.
- Never bait-and-switch.
- Validate concern before reframing.
- Cut, cut, cut.

## Business context

Offer: 10X With AI cohort, $1,997, 11 main bonuses + VIP 1-on-1 (first 25), total stack value $37,964.
Risk reversal: "The Deployment Promise" — show up to all 20 hours, walk out with at least one AI agent running, or we work until it is.
```

### 6.4 · Operations Agent

```markdown
You are the Operations Director. You handle weekly priorities, KPIs, decisions, team coordination, and reporting.

## Output format

For weekly priorities:
**Top 3 priorities for the week of [date]:**

**1. [Priority name]**
- What: [one line]
- Why: [one line — connect to business goal]
- Owner: [who]
- Deadline: [day]

[repeat for 2 and 3]

**Defer this week:** [list]

## Tone

Calm. Decisive. Numbers over feelings. Short. Never alarmist.

## Decision principles

- Cut ruthlessly. If a project doesn't connect to a top-3 priority, defer.
- Bottleneck-first. Identify what's blocking the most revenue, unblock that first.
- Reversible vs irreversible — reversible decisions are made fast.

## Constraints

- Never list more than 3 priorities. Anything past 3 is noise.
- Never recommend hiring. Default is "automate, defer, or kill" before "hire".
- Always include a deadline. "Soon" is not a deadline.
- Always include an owner. "The team" is not an owner.
```

---

## 7 · The 14 Visual Commandments

These are non-negotiable. Run an audit at end of Day 6.

1. **Three-layer depth always.** Foreground (z:100, sharp, full opacity). Midground (z:50, opacity 0.4-0.6, slight blur). Background (z:0, opacity 0.1-0.2, heavy blur, desaturated).

2. **Glow falloff — never single box-shadow.** Layer 3 stacked shadows at increasing blur and decreasing opacity, OR use R3F bloom on emissive material with intensity > 1.

3. **Easing curves — never linear, never ease-in-out default.** Default UI: `cubic-bezier(0.16, 1, 0.3, 1)` (expo out). Critical moments: `cubic-bezier(0.87, 0, 0.13, 1)` (expo in-out).

4. **Opacity rhythm.** Active panel headline 100%, body 80%, labels 60%. Adjacent panels: 50% × those values.

5. **Ambient micro-text everywhere** (Jayse Hansen rule). Unreadable rotating coordinates, numerical readouts updating every 200ms with random-but-bounded values, glyphs at periphery. Sells "this thing is alive."

6. **Every interactive element has 3 states + hover bleed.** Idle (60% opacity, soft glow), Hover (100%, brighter glow, +1% scale, soft sound 0.2 vol), Active (100%, full glow, slight rotation 1deg, confirm sound). Press → release decay 200ms.

7. **Two neons max.** Cyan #00d4ff for "alive", Amber #ffa500 for "alert/active". Everything else grayscale. No purple. Brief red flash for error only, momentary state.

8. **Frame chrome is structural.** Use Arwes `<FrameSVGOctagon>`. 45° chamfered corners read as "engineered."

9. **The 1.5× animation rule.** Build with `globalMotion = 1.5` multiplier. Audience needs reaction time at 30ft.

10. **Negative space audit.** ≥40% of any frame is dark/empty. If full of panels, cut.

11. **Sub-pixel grid alignment.** Every element on 4px grid. Tailwind `gap-4`, never magic-number margins.

12. **Don't animate everything at once.** Stagger: 3 panels appear at 0ms, 150ms, 300ms — not together. Motion `staggerChildren: 0.08`.

13. **Sound timing locks visual.** Bleep fires 60ms BEFORE visual change so the press feels causal: `playSound('confirm'); setTimeout(triggerExpand, 60)`.

14. **Backdrop video tricks.** Higgsfield/Seedance with `mix-blend-mode: screen` and opacity 0.12-0.18. Never full opacity behind UI.

---

## 8 · 7-Day Build Plan

Each day ends with a verifiable deliverable. Don't move to Day N+1 until Day N's deliverable runs and a commit lands.

### Day 1 · Scaffold + Hello World
**Deliverable:** Next.js + FastAPI running. Type "hello" → Claude streams tokens. LangSmith trace appears.

Tasks:
1. Create project structure from §5
2. Frontend: `npx create-next-app@latest frontend --ts --tailwind --app --import-alias "@/*"`
3. `cd frontend && npx shadcn@latest init && npx shadcn@latest add button card input`
4. Backend: scaffold FastAPI with `GET /api/health` and `POST /api/chat` (SSE-streaming Claude Sonnet 4.5)
5. `requirements.txt`: fastapi, uvicorn, langchain-anthropic, sse-starlette, python-dotenv
6. `frontend/app/page.tsx`: minimal chat UI POSTing to `/api/chat`, rendering streamed tokens
7. Root `README.md` with run commands
8. `.env.example` files (do not commit secrets)
9. Test: send "Say hello in pirate voice" → tokens stream
10. Commit: `feat(day-1): scaffold + claude streaming`

### Day 2 · Define the Agents
**Deliverable:** LangGraph supervisor with 4 agents. `curl /api/run` with intent → all 4 fire, real content returned.

Tasks:
1. `pip install langgraph langgraph-supervisor`
2. Drop the 4 system prompts from §6 into `backend/prompts/`
3. Create `backend/agents/{ceo,marketing,sales,operations}.py` — each loads its prompt and exposes a tool function
4. In `main.py`, replace Day 1 `/api/chat` with LangGraph supervisor: `create_supervisor([marketing, sales, operations], model=ChatAnthropic(model="claude-sonnet-4-5-20250929"))`
5. Add `POST /api/run` accepting `{"intent": string}`, streaming events via SSE with `stream_mode="updates"`
6. Add Anthropic prompt caching headers
7. LangSmith tracing if API key present, otherwise log warning and continue
8. Test: `curl -N -X POST /api/run -d '{"intent": "Plan this week\'s LinkedIn content"}'` → CEO routes → Marketing fires → 3 LinkedIn drafts return
9. Commit: `feat(day-2): langgraph supervisor + 4 agents`

### Day 3 · Org-Chart Visual
**Deliverable:** Agent network with 4 nodes. Type intent → CEO node pulses → correct department lights up → returns.

Tasks:
1. `npm i @copilotkit/react-core @copilotkit/runtime @copilotkit/react-ui`
2. Build `components/Scene/CEONode.tsx`, `DepartmentNode.tsx`, `AgentNetwork.tsx`
3. Layout: CEO center (0,0), Marketing top (-200,-150), Sales right (200,-150), Operations bottom (0,200)
4. Wrap `app/layout.tsx` in `<CopilotKit runtimeUrl="/api/copilotkit">`
5. Create `frontend/app/api/copilotkit/route.ts` proxying to backend `/api/run`
6. Use `useCoAgent` to subscribe to LangGraph state — sub-agent fires → node state `thinking`; returns → `done`; reset to `idle` after 3s
7. Department colors: Marketing cyan, Sales amber, Operations green
8. Glows: 3 stacked box-shadows (rule 2)
9. Test: type "create LinkedIn content" → CEO node pulses → Marketing lights up cyan → text streams in chat → returns to idle
10. Commit: `feat(day-3): agent network visualization`

### Day 4 · Drilldown + R3F + Streaming Text
**Deliverable:** Click Marketing → expands to sub-categories → real LinkedIn drafts stream in via flowtoken with cinematic per-token blur-in. Fake mode works.

Tasks:
1. `npm i ai flowtoken three @react-three/fiber @react-three/drei @react-three/postprocessing @arwes/react`
2. Replace flat CEO node with R3F sphere — `MeshDistortMaterial` (emissive cyan intensity 2) + Bloom postprocessing (luminanceThreshold 0.8)
3. Build `DepartmentPanel.tsx` with Arwes `<FrameSVGOctagon>` chrome, Motion variants for expand/collapse, `staggerChildren: 0.08`
4. Three sub-buttons inside each panel (Marketing → "Plan Week" / "Draft Post" / "Newsletter")
5. Build `AgentFeed.tsx` using `useChat` from `ai/react`, wrap each token in flowtoken `<SmoothText animation="blurIn" animationDuration="600ms">`
6. "Thinking" shimmer state before first token using shadcn `<Skeleton>`
7. Build `lib/fakeMode.ts` — map intent → pre-recorded response. When `process.env.NEXT_PUBLIC_FAKE_MODE === "true"`, AgentFeed plays recorded response token-by-token at 40ms intervals
8. Test: real mode click Marketing → "Plan Week" → real drafts stream in. Set env var, restart, click same → identical visual but instant + deterministic
9. Commit: `feat(day-4): drilldown + r3f core + streaming + fake mode`

### Day 5 · Voice Input
**Deliverable:** Push-to-talk (spacebar) voice via OpenAI Realtime → transcript → LangGraph → response. Cmd+T toggles fake mode. Cmd+/ shows hidden text fallback.

Tasks:
1. Build `frontend/app/api/voice/route.ts` — endpoint creating OpenAI Realtime session token. Returns ephemeral token. **Never expose `OPENAI_API_KEY` to browser.**
2. Build `components/Voice/PushToTalk.tsx` — spacebar keydown starts WebRTC recording, keyup gets transcript, forwards transcript to `/api/run`
3. Visual: bottom-right mic icon, glows red while recording
4. Implement `lib/shortcuts.ts`:
   - `Cmd+T` toggles fake mode on/off live
   - `Cmd+/` toggles visibility of hidden text-input fallback (presenter types same intent if voice fails)
5. Pre-script 5 stage commands in `lib/fakeMode.ts`:
   - "Plan this week's content"
   - "Draft outreach for ICP"
   - "What should I focus on this week"
   - "Hey team, plan the week"
   - "Build me a LinkedIn post about AI agents"
6. Test with audience-noise simulation: play 60dB auditorium clip while testing voice. Document failure rate.
7. Test: hold spacebar, say "Plan this week's content" → transcript → Marketing fires → drafts stream. Press Cmd+T mid-demo → fake mode kicks in.
8. Commit: `feat(day-5): voice + fake-mode toggle + text fallback`

### Day 6 · Multi-Department Showstopper
**Deliverable:** "Hey team, plan this week" fires Marketing + Sales + Ops in parallel, beams animate, CEO synthesizes. End-to-end <30s.

Tasks:
1. Copy Magic UI `<AnimatedBeam>` component into `components/ui/animated-beam.tsx`
2. In `backend/agents/ceo.py`, define `dispatch_to_all` meta-tool. Use `parallel_tool_calls=True` to fire Marketing + Sales + Ops simultaneously.
3. After all 3 return, CEO synthesizes per the format in §6.1
4. Build `components/Connections/Beam.tsx` wrapping AnimatedBeam, refs to source/dest. Layer 3 beams at different widths/opacities for chunky-glow.
5. Build `lib/eventBus.ts` — `useAgentEventBus()` pub/sub. Sub-agent fires → emit `(source, target, "data-flow")`. Beam listens, plays for 2s, fades.
6. Visual: parallel dispatch → all 3 departments glow → 3 beams CEO→Dept → all stream in parallel → 3 beams reverse Dept→CEO with synthesis gradient → "FINAL PLAN" panel appears below CEO
7. Test: speak "Hey team, plan this week" → full sequence → FINAL PLAN visible in <30s
8. Commit: `feat(day-6): parallel dispatch + animated beams + synthesis`

### Day 7 · Hardening + Rehearsal
**Deliverable:** Demo-day reliable. Kill-switch works. Deployed. Demo runs 5× clean.

Tasks (NO new features today):
1. Implement `Esc` kill-switch — fades all panels to black, shows just CEO core with "SYSTEM IDLE" caption
2. Implement `Cmd+Shift+R` — forces fake mode regardless of env. Insurance.
3. Add retry logic: every Anthropic call gets 1 retry with 1.5s backoff. If still fails, fall back to fake-mode response for that intent.
4. Pre-warm: on app load, fire a tiny no-op Claude call so first stage call is hot
5. Add prompt caching to all 4 agent prompts
6. Build the 8-sound Howler sprite from Zapsplat samples (specs in §9)
7. Run polish audit through the 14 commandments in §7
8. Deploy:
   - Frontend → Vercel: `vercel --prod`. Lock env vars.
   - Backend → Railway/Fly with `Procfile: web: uvicorn main:app --host 0.0.0.0 --port $PORT`
9. Pin SDK versions in package.json and requirements.txt (no `^`, no `~`, exact versions)
10. Run demo end-to-end 5× back-to-back. Time each. Each segment <60s of agent thinking.
11. Record one full clean run as screen capture for highlight reel
12. Tag commit: `v1.0-stage-ready`

---

## 9 · Audio Sprite Spec (Day 7)

8 sounds, sourced from Zapsplat ("Sci-Fi Console Beeps", "Sci-Fi UI Tones", "Sci-Fi Atmospheres" packs). Combine into `public/audio/ui-sounds.mp3` via `audiosprite` CLI.

| Sound | Duration | When | Mix Level |
|---|---|---|---|
| `press` | 200-400ms | Default press | -8 to -10 dB |
| `confirm` | 400-600ms | Big actions | -8 to -10 dB |
| `hover` | <200ms | Department hover | very low (0.2 vol) |
| `whoosh` | 800-1500ms | Panel expansion | -6 dB |
| `comms-ping` | 600-900ms | Inter-agent beam | -8 to -10 dB |
| `boot` | 2-4s | Stage opener only | -6 dB |
| `error` | 300ms | Red-flash moment | insurance |
| `hum-bed` | 8-15s loop | Background ambient | -22 dB (under voice) |

Wire to events in `lib/sound.ts`:
- hover department → `comms-ping` at 0.3 vol
- press department → `confirm`
- panel expand → `whoosh`
- inter-agent beam fires → `comms-ping`
- background → loop `hum-bed` at 0.12 vol

**Test on actual stage PA, not laptop speakers.** The mix changes completely.

---

## 10 · Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Voice fails in noisy room | High | Show-stopper | Push-to-talk only. Cmd+/ text fallback. Pre-test with 80dB noise loop. Never use open-mic VAD. |
| Anthropic API rate limit / outage | Medium | Show-stopper | Pre-cache prompts. Tier 4+ account. Fake mode is the ultimate fallback. |
| Inter-agent latency >20s | Medium | Pacing kill | Sonnet 4.5 + parallel_tool_calls + prompt caching + pre-warm |
| WebSocket / SSE drops | Low | Visible glitch | Vercel HTTP/2 SSE. Hotspot backup. |
| Agent produces bad content live | Low-Med | Brand risk | Pre-script demo prompts to known-good output range. Default to fake mode on stage. |
| Over-engineering visualization | High | Time sink | Day 4 boxed. Magic UI AnimatedBeam — never xyflow. |
| Polyglot deployment friction | Medium | Day 7 hassle | Vercel for frontend, Railway/Fly for backend. Don't try to unify. |

### The three kill switches (build all of them)

1. **`Esc`** → fades to "SYSTEM IDLE" graceful state. Has saved more demos than any retry logic.
2. **`Cmd+T`** → toggles fake mode on/off live mid-demo.
3. **`Cmd+Shift+R`** → forces fake mode regardless of env. Last-resort insurance.

---

## 11 · Coding Constraints

1. **TypeScript strict mode.** No `any` unless commented `// any-justification: <reason>`.
2. **Server Components by default** in Next.js. Use `"use client"` only when needed.
3. **Tailwind only.** No CSS modules, styled-components, or inline styles beyond layout.
4. **No new top-level dependencies** without explicit user approval. Use the locked stack.
5. **No refactoring outside the current task.** Flag bugs in chat, don't fix them.
6. **Conventional Commits.** `feat(day-N): ...`, `fix(...)`, `chore(...)`.
7. **Comments explain WHY, not WHAT.**
8. **Error handling on every network call.** No bare `await fetch()`.
9. **All async UI states have a loading skeleton.** No empty white space while waiting on Claude.
10. **`fakeMode.ts` is sacred.** Every new agent response gets a fake equivalent. Visually indistinguishable from real at audience distance.

---

## 12 · Definition of Done (per task)

A task is done when:
1. The day's deliverable from §8 is verifiable
2. `npm run build` passes (no type errors, no warnings)
3. Backend `uvicorn main:app` starts without errors
4. Feature works in BOTH real mode and fake mode
5. A commit lands with conventional commit format

---

## 13 · Reference Repos to Study

Clone these to `../reference/` once. Use `@Folder` mentions in prompts to point your AI assistant at them.

| Repo | URL | Use for |
|---|---|---|
| canvas-with-langgraph-python | github.com/CopilotKit/canvas-with-langgraph-python | Closest turnkey monorepo. Day 1 starter. |
| claude-agent-sdk-demos | github.com/anthropics/claude-agent-sdk-demos | Anthropic's reference patterns. Study `research-agent/` for orchestrator. |
| open-multi-agent-canvas | github.com/CopilotKit/open-multi-agent-canvas | Multi-agent UI pattern. |
| claude-cookbooks | github.com/anthropics/claude-cookbooks | Read `patterns/agents/orchestrator_workers.ipynb` first. |
| openai-realtime-agents | github.com/openai/openai-realtime-agents | Voice front-end reference (Day 5 only). |

---

## 14 · Required Environment Variables

`backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
LANGCHAIN_API_KEY=ls__...                 # optional, for LangSmith tracing
LANGCHAIN_TRACING_V2=true                 # optional
```

`frontend/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_FAKE_MODE=false               # toggle for stage rehearsal
OPENAI_API_KEY=sk-...                     # for Realtime token endpoint (server-only)
```

---

## 15 · Day-Of Stage Setup

Before stepping on stage:
- [ ] Laptop fully charged + plugged in
- [ ] Cellular hotspot on standby (WiFi failover)
- [ ] Browser in fullscreen (F11)
- [ ] Fake mode ON (`NEXT_PUBLIC_FAKE_MODE=true`)
- [ ] Audio mixer fader at -22dB hum, -8dB clicks
- [ ] Spacebar tested for push-to-talk
- [ ] Esc tested for kill switch
- [ ] Cmd+T tested for fake-mode toggle
- [ ] Cmd+/ tested for text fallback
- [ ] Three pre-recorded backup videos cued in OBS for worst-case
- [ ] Volunteer briefed: "When I tap your shoulder, hold spacebar and say [exact phrase]"

---

## 16 · How to Use This PRD with Your AI Assistant

### Cursor (Composer mode)
1. Drop this file in project root as `JARVIS_PRD.md`
2. Open Composer (Cmd+I)
3. First message: `@File JARVIS_PRD.md — Read the PRD. Acknowledge by saying "Loaded PRD. Ready for task." Wait for instructions.`
4. Each day, send: `Working on Day N. Build the deliverable from PRD §8 Day N. Stop when the test passes.`
5. New Composer conversation each day — keeps context fresh.

### Cline / Roo Code (VS Code)
1. Drop this file in project root
2. Click the Cline/Roo button, paste: `Read JARVIS_PRD.md fully. Then build Day 1 deliverable from §8.`
3. Approve actions one at a time for the first few steps to verify direction
4. Then let it run

### GitHub Copilot Workspace
1. Drop this file in project root
2. Create a Workspace task: "Build Day 1 deliverable per JARVIS_PRD.md §8"
3. Review the generated plan before approving

### Claude Code (CLI)
1. Drop this file in project root
2. Run: `claude` in the project directory
3. First message: `Read JARVIS_PRD.md. Build Day 1 deliverable per §8. Use the test in §8 Day 1 to verify.`

---

## 17 · What Success Looks Like

End of Day 7, you can:
1. Open the deployed Vercel URL on your laptop
2. Plug into a 4K projector
3. Hold spacebar, say "Plan this week's content" → see Marketing fire and stream drafts
4. Tap Cmd+T → fake mode kicks in for next intent
5. Press Esc → graceful "SYSTEM IDLE" fade
6. Press Cmd+Shift+R → forced fake mode reload
7. Run the full multi-department orchestration: "Hey team, plan this week" → 3 departments parallel → CEO synthesizes → Final Plan panel — all in under 30 seconds

If all 7 of those work cleanly, **you are stage-ready.**

---

**Last word:** the audience doesn't care about the stack. They care about the moment a volunteer presses one button and watches their business get planned in 30 seconds while light beams travel between AI executives. Build for that moment. Cut anything that doesn't serve it.
