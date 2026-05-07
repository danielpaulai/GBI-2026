# 7-Day Cursor Composer Prompts

Open Cursor's Composer (Cmd+I), paste one of these prompts at the start of each day's session. The `.cursorrules` file gives Cursor the rest of the context.

**Workflow:** Start each day in a fresh Composer session. Paste that day's prompt. Let Cursor work to deliverable. Verify. Commit. Stop.

---

## Day 1 — Scaffold & Hello World

```
Working on Day 1 of the 7-day plan. Goal: Next.js app + Python backend running. Type "hello" in chat → Claude streams tokens.

Tasks in order:

1. Create the project structure described in CURSOR_BRIEF.md.
2. Frontend: `cd frontend && npx create-next-app@latest . --ts --tailwind --app --import-alias "@/*"`. Yes to ESLint.
3. Initialize shadcn: `npx shadcn@latest init` and add `button card input`.
4. Backend: in `backend/`, scaffold a FastAPI app with:
   - `GET /api/health` returns `{"status": "ok"}`
   - `POST /api/chat` accepts `{"intent": string}` and streams Claude Sonnet 4.5 tokens back as SSE
   - Use `langchain-anthropic.ChatAnthropic` with `model="claude-sonnet-4-5-20250929"` and `streaming=True`
5. Backend `requirements.txt`: fastapi, uvicorn, langchain-anthropic, python-dotenv, sse-starlette
6. Frontend `app/page.tsx`: minimal chat UI with input + send button + token stream display. Plain React for now — no CopilotKit yet, that's Day 3.
7. Add root `README.md` with these run commands:
   - `cd backend && uvicorn main:app --reload --port 8000`
   - `cd frontend && npm run dev`
8. Set up `.env.example` files (don't commit secrets).

Test: from frontend, send "Say hello in pirate voice" → Claude streams a pirate response token-by-token.

When it works, commit `feat(day-1): scaffold + claude streaming` and stop. Show me the final file tree and the test output.
```

---

## Day 2 — Define the Agents

```
Day 2. Goal: LangGraph supervisor with 4 agents (CEO, Marketing, Sales, Operations). Curl `/api/run` with intent → all 4 fire, real content returned.

Tasks:

1. Install: `pip install langgraph langgraph-supervisor langchain-anthropic`. Update requirements.txt.
2. Write 4 system prompts in `backend/prompts/`:
   - `ceo_system.md` — orchestrator, knows when to delegate vs respond directly
   - `marketing_system.md` — focused on LinkedIn content, hooks, voice
   - `sales_system.md` — focused on outreach, objection handling, closes
   - `operations_system.md` — focused on weekly priorities, KPIs, decisions
   Each prompt should include:
   - Role
   - Tone (specific voice — for Marketing: "punchy, hook-first, second-person")
   - Output format (specific — e.g. "always return 3 LinkedIn drafts as a numbered list")
   - Constraints (e.g. "never suggest hiring people")
3. In `backend/agents/`, create one Python module per agent that loads its prompt and exposes a tool function the supervisor can call.
4. In `backend/main.py`, replace the Day 1 `/api/chat` with a LangGraph supervisor:
   - Use `create_supervisor([marketing, sales, operations], model=ChatAnthropic(model="claude-sonnet-4-5-20250929"))`
   - Add prompt caching to the CEO system prompt (use Anthropic's prompt caching headers)
5. Add `POST /api/run` that accepts `{"intent": string}`, invokes the supervisor, streams events back via SSE using LangGraph's `stream_mode="updates"`.
6. Add LangSmith tracing — set `LANGCHAIN_TRACING_V2=true` and `LANGCHAIN_API_KEY` in env. If LangSmith key not present, log a warning and continue.

Test:
```
curl -N -X POST http://localhost:8000/api/run \
  -H "Content-Type: application/json" \
  -d '{"intent": "Plan this week\'s LinkedIn content"}'
```

Expected: SSE stream showing CEO routing → Marketing agent fires → returns 3 real LinkedIn drafts.

Commit `feat(day-2): langgraph supervisor + 4 agents`. Show me the LangSmith trace URL.
```

---

## Day 3 — Org-Chart Visual

```
Day 3. Goal: React Flow with 4 nodes (CEO + 3 departments). Type intent → CEO node pulses → correct department lights up → returns.

Tasks:

1. Install: `npm i @xyflow/react @copilotkit/react-core @copilotkit/runtime @copilotkit/react-ui`
2. In `frontend/components/Scene/`, create:
   - `CEONode.tsx` — custom React Flow node with idle/thinking/done states. Centered. Cyan glow when active.
   - `DepartmentNode.tsx` — custom node with 3 variants (Marketing, Sales, Operations). Color-coded.
3. In `frontend/components/Scene/AgentNetwork.tsx`:
   - Use `@xyflow/react` ReactFlow component
   - Layout: CEO at center (0, 0), Marketing top (-200, -150), Sales right (200, -150), Operations bottom (0, 200)
   - Animated edges between CEO and each department
4. Wire CopilotKit:
   - Wrap `app/layout.tsx` in `<CopilotKit runtimeUrl="/api/copilotkit">`
   - Create `frontend/app/api/copilotkit/route.ts` — proxy to backend `/api/run`
   - In `AgentNetwork.tsx`, use `useCoAgent` hook to subscribe to LangGraph state
   - When a sub-agent fires, set its node state to `thinking`; when it returns, `done`. Reset to `idle` after 3s.
5. Add Tailwind glow effects per department:
   - Marketing: cyan
   - Sales: amber
   - Operations: green
   Use 3 stacked box-shadows for proper falloff (NOT single shadow — see .cursorrules rule 2).
6. Don't add R3F yet — flat 2D React Flow for Day 3. R3F CEO sphere is Day 4.

Test: Open the app. Type "create LinkedIn content" in CopilotKit sidebar. CEO node pulses cyan → Marketing node lights up cyan → text streams in chat → Marketing node returns to idle.

Commit `feat(day-3): agent network visualization`.
```

---

## Day 4 — Drilldown + R3F + Streaming Text

```
Day 4. Goal: Click Marketing → expands to sub-categories → real LinkedIn drafts stream in via Vercel AI SDK + flowtoken with cinematic per-token blur-in.

Tasks:

1. Install: `npm i ai flowtoken three @react-three/fiber @react-three/drei @react-three/postprocessing`
2. Replace flat CEO node with R3F sphere:
   - In `CEOCore.tsx`: R3F Canvas, MeshDistortMaterial with emissive cyan (intensity 2), Bloom postprocessing (luminanceThreshold 0.8)
   - Reference `r3f-by-example/effects/emissive-bloom`
3. Build `DepartmentPanel.tsx`:
   - Uses Arwes `<FrameSVGOctagon>` chrome (45° chamfered corners)
   - Motion variants for expand/collapse with staggerChildren 0.08
   - Three sub-buttons inside (e.g. Marketing → "Plan Week" / "Draft Post" / "Newsletter")
4. Build `AgentFeed.tsx`:
   - Uses `useChat` from `ai/react`
   - Wraps each token in flowtoken `<SmoothText animation="blurIn" animationDuration="600ms">`
   - "Thinking" shimmer state before first token using shadcn `<Skeleton>`
5. Wire it all:
   - Click Marketing node → DepartmentPanel expands with stagger
   - Click sub-button → POST to `/api/run` with intent → AgentFeed streams response inside panel
6. Add `lib/fakeMode.ts`:
   - Map intent → pre-recorded response string
   - When `process.env.NEXT_PUBLIC_FAKE_MODE === "true"`, AgentFeed plays the recorded response token-by-token at 40ms intervals via flowtoken
   - Same visual output as live mode

Test:
- Real mode: click Marketing → "Plan Week" → real LinkedIn drafts stream in with blur-in animation
- Fake mode: set NEXT_PUBLIC_FAKE_MODE=true, restart, click same path → identical visual but instant + deterministic

Commit `feat(day-4): drilldown + r3f core + streaming + fake mode`.
```

---

## Day 5 — Voice Input

```
Day 5. Goal: Push-to-talk (spacebar) voice via OpenAI Realtime → transcript forwarded to LangGraph → response.

Tasks:

1. Install: nothing new — Web Audio API is browser-native.
2. In `frontend/app/api/voice/route.ts`:
   - Endpoint that creates an OpenAI Realtime session token
   - Returns ephemeral token to client (NEVER expose OPENAI_API_KEY to browser)
3. Build `frontend/components/Voice/PushToTalk.tsx`:
   - Spacebar keydown → start recording (use OpenAI Realtime WebRTC)
   - Spacebar keyup → stop, get transcript
   - Forward transcript to `/api/run` (same path as text)
   - Visual: bottom-right corner mic icon, glows red while recording
4. Critical: Cmd+T keyboard shortcut toggles fake mode on/off live. Build this now.
5. Critical: hidden text-input fallback — if voice fails, presenter types same intent and presses Enter. Bind to Cmd+/ to toggle visibility.
6. Pre-script 5 stage commands and add them to `lib/fakeMode.ts`:
   - "Plan this week's content"
   - "Draft outreach for ICP"
   - "What should I focus on this week"
   - "Hey team, plan the week" (multi-department)
   - "Build me a LinkedIn post about AI agents"
7. Test with audience-noise simulation: play a YouTube auditorium-noise clip while testing voice. If transcription fails >20% of the time at 60dB, document it as a known risk and rely on push-to-talk discipline.

Test:
- Hold spacebar, say "Plan this week's content" → see transcript appear → Marketing fires → drafts stream.
- Press Cmd+T mid-demo → fake mode kicks in seamlessly on the next intent.

Commit `feat(day-5): voice + fake-mode toggle + text fallback`.
```

---

## Day 6 — Multi-Department Showstopper

```
Day 6. Goal: "Hey team, plan this week" fires Marketing + Sales + Ops in PARALLEL, with inter-agent beams visible. CEO synthesizes. End-to-end <30s.

Tasks:

1. Install: `npm i magic-ui` (or copy Magic UI's `<AnimatedBeam>` directly from magicui.design).
2. In `backend/agents/ceo.py`:
   - Define a meta-tool `dispatch_to_all` that the CEO uses to call all 3 departments simultaneously
   - Use Claude Sonnet 4.5's parallel tool calling — `parallel_tool_calls=True` in the Anthropic SDK call
   - After all 3 return, CEO synthesizes into a unified weekly plan
3. In `frontend/components/Connections/Beam.tsx`:
   - Wrap Magic UI `<AnimatedBeam>`. Pass refs to CEO node and target department node.
   - Set `gradientStartColor` per source/dest, `pathColor` matching department.
   - Layer 3 beams at different widths/opacities for chunky-glow feel (single beam looks anemic).
4. In `frontend/lib/eventBus.ts`:
   - Pub/sub keyed off agent IDs
   - `useAgentEventBus()` hook
   - When sub-agent fires, emit `(source, target, "data-flow")` event
   - Beam.tsx listens, plays for 2s, fades
5. Visualize parallel execution:
   - All 3 departments glow simultaneously when CEO dispatches
   - Beams from CEO → all 3 in parallel
   - When all return, beams reverse direction (department → CEO) with a "synthesis" gradient
6. Add a "FINAL PLAN" panel that appears below CEO when synthesis completes. Animated entry via Motion.

Test:
- Speak "Hey team, plan this week" (or trigger via fake mode)
- Watch: CEO node pulses → 3 beams shoot out → all 3 departments glow + stream content in parallel → 3 beams reverse → FINAL PLAN panel appears with synthesized weekly plan
- Total time: <30s from voice end to FINAL PLAN visible

Commit `feat(day-6): parallel dispatch + animated beams + synthesis`.
```

---

## Day 7 — Hardening + Rehearsal

```
Day 7. Goal: Demo-day reliable. NO new features today. Polish, harden, deploy.

Tasks:

1. Build kill-switch: `Esc` key fades everything to black with "SYSTEM IDLE" caption. Hard-code in `app/layout.tsx`.
2. Build Cmd+Shift+R: forces fake mode regardless of env. Insurance.
3. Add retry logic: every Anthropic call gets 1 retry with 1.5s backoff. If still fails, fall back to fake-mode response for that intent.
4. Pre-warm: on app load, fire a tiny no-op Claude call so the first stage call is hot.
5. Add prompt caching headers to all 4 agent system prompts.
6. Sound: build the 8-sound Howler sprite from Zapsplat samples. Wire to events:
   - hover department → comms ping (low vol)
   - press → confirm
   - panel expand → whoosh
   - beam fires → comms ping again
   - background → loop hum at 0.12 vol
7. Polish audit (run through .cursorrules visual rules 1-14):
   - Three-layer depth on every screen
   - All easing curves replaced with cubic-bezier(0.16, 1, 0.3, 1)
   - All glows are 3-stacked shadows or R3F bloom
   - Two neons max on any screen
   - Negative space ≥40% on every screen
   - All animations stagger
8. Deploy:
   - Frontend → Vercel: `vercel --prod`. Lock env vars.
   - Backend → Railway or Fly: deploy with `Procfile: web: uvicorn main:app --host 0.0.0.0 --port $PORT`
9. Pin SDK versions in package.json and requirements.txt (no `^`, no `~`, exact versions).
10. Run the demo end-to-end 5× back-to-back. Time each run. Each segment <60s of agent thinking.
11. Record one full clean run as a screen capture for highlight reel.

Test: Run demo 5× without touching code. Every run completes successfully in real mode. Press Esc mid-demo → graceful fade. Press Cmd+T → fake mode kicks in on next intent.

Commit `chore(day-7): hardening + deploy + sprite + polish`. Tag `v1.0-stage-ready`.

DO NOT add new features today. If something is broken, fix it. If something is missing, accept it for v2.
```

---

## How to use these prompts

1. **Day-of:** Open Cursor → Cmd+I (Composer) → paste that day's prompt → press Enter
2. **Trust the brief.** Don't add context that's already in `.cursorrules` or `CURSOR_BRIEF.md` — Cursor reads them automatically.
3. **Verify before moving on.** Each prompt has a "Test" section. If the test doesn't pass, iterate before starting the next day.
4. **One day = one Composer session.** Fresh context each day keeps Cursor focused.
5. **Commit at the end of each day.** Easier to roll back if Day N+1 breaks something.
6. **If Cursor goes off-rails:** stop, reset Composer (new conversation), re-paste the day's prompt.

If a day's task is too big and Cursor times out, split it: do steps 1-3 in one Composer message, then 4-6 in the next. The .cursorrules persists between sessions.
