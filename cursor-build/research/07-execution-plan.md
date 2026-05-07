# 07 — Execution Plan: The Volunteer Relay Demo

This document is the merge of all prior research (docs 01–06) into one executable plan. Where prior docs disagree, this one wins. Read this first; reach back into the others only when implementing a specific layer.

The new requirement: the demo is a **relay**. 5 volunteers from the audience walk up, each triggers ONE beat, then sits down. Each beat produces a visible result. This is better TV than one volunteer pressing one button — you get 5 evangelists at the lunch table, not 1.

---

## The 5-volunteer relay (the demo, end-to-end)

**Setup:** A large QR code is on screen the whole time. Volunteers scan it on their phone — phone instantly becomes a controller surface synced via PartyKit. No app to install, no login. They open the link and they're in the room.

| Beat | Volunteer | Phone shows | What plays on big screen | Backend fires |
|---|---|---|---|---|
| **1. Wake** | V1 from back of room | One big button: **WAKE THE AI** | `boot.mp4` Seedance clip — particles converge into glowing CEO orb. Howler `boot` chime. | Pre-warm Anthropic call (no-op, latency-prep) |
| **2. Pick department** | V2 from middle | 4 dept buttons: **Marketing / Sales / Ops / Finance** | `dept-wake.mp4` for Marketing — panels materialize around CEO orb | LangGraph supervisor primed with intent context |
| **3. Pick task** | V3 from front | 4 sub-task buttons: **Content / Ads / Email / Performance** | Marketing panel expands into 4 sub-cards with `flowtoken` blur-in | Marketing agent loaded, sub-tool selected |
| **4. Voice the request** | V4 (the brave one) | Hold-to-talk button: **"PRESS TO SPEAK"** | `meeting.mp4` — multi-agent meeting visual, AgentScope `MsgHub` events fire as floating speech bubbles over the video | Voice → Picovoice transcription → Marketing+Sales+Ops agents confer in parallel via `MsgHub` |
| **5. Approve** | V5 | Output preview + 2 buttons: **SHIP IT / TWEAK IT** | `synthesis.mp4` — particles coalesce into final glowing text. Real LinkedIn post materializes via `flowtoken`. | CEO synthesizes final output, returns it. If "Tweak," loop back to Beat 4. |

**Total stage time:** ~6 minutes. Same as the 3-volunteer Demo 3 in `LIVE_DEMOS.md`, but with 5 evangelists instead of 3 and a clearer narrative arc.

**Key choreography:** between each beat, the presenter says ONE line that anchors what just happened ("V1 just woke the AI. V2 — your turn. Pick the department.") This makes the relay feel inevitable, not chaotic. The presenter is the conductor; the volunteers are the orchestra.

---

## The technical architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     STAGE BIG SCREEN                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Slidev shell                          │  │
│  │  - QR code (always visible, top-right)                 │  │
│  │  - Onborda overlay: "Step 3 of 5"                      │  │
│  │  - Seedance backdrop (state-triggered)                 │  │
│  │  - HUD chrome (Magic UI + flowtoken)                   │  │
│  │  - LangGraph stream output                             │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬────────────────────────────────┘
                              │ subscribes as DISPLAY
                              ▼
                ┌──────────────────────────┐
                │   PartyKit room: stage   │
                │   ┌────────────────────┐ │
                │   │  XState machine v5 │ │
                │   │  (the spine)       │ │
                │   │  States:           │ │
                │   │  idle → boot →     │ │
                │   │  pick-dept →       │ │
                │   │  pick-task →       │ │
                │   │  voice → meeting → │ │
                │   │  synthesize →      │ │
                │   │  approved          │ │
                │   └────────────────────┘ │
                └──────┬───────────────────┘
                       │ subscribes as CONTROLLER
                       ▼
              ┌─────────────────────────┐
              │  Volunteer phones       │
              │  (1 per volunteer)      │
              │  - QR-scanned URL       │
              │  - Renders ONE button   │
              │    surface per beat     │
              │  - Sends NEXT events    │
              └─────────────────────────┘

                       Backstage:
                ┌──────────────────────────┐
                │  AV operator laptop      │
                │  - Stately Inspect       │
                │    (live state viewer)   │
                │  - Manual override:      │
                │    next/back/skip beats  │
                │  - Kill switch (Esc)     │
                │  - Fake-mode toggle      │
                └──────────────────────────┘
                       Backend:
                ┌──────────────────────────┐
                │  LangGraph (Python)      │
                │  - CEO + 4 dept agents   │
                │  - AgentScope MsgHub     │
                │    for Beat 4 meeting    │
                │  - Claude Sonnet 4.5     │
                │  - Prompt caching        │
                └──────────────────────────┘
```

---

## The complete repo stack (everything you'll touch)

### Spine + state
- **`statelyai/xstate`** v5 — the brain. Each beat is a named state. `send({type:'NEXT'})` advances. **USE.**
- **`statelyai/inspect`** — live state viewer for AV operator on second monitor. **USE.**

### Multi-screen sync
- **`cloudflare/partykit`** — single-deploy WebSocket fan-out. Presenter laptop + projector + 5 volunteer phones all in one room. **USE.**
- *(Liveblocks is the fallback if PartyKit is too DIY.)*

### Phone-as-controller
- **`linorabolini/MobileController`** — reference architecture. **STEAL THE PATTERN.**
- **`bredele/qrcontrol`** — QR pairing flow. **STEAL THE PATTERN.**
- Build your own thin React app that PartyKit-syncs with the stage screen. ~100 lines of code.

### Stage shell
- **`slidevjs/slidev`** — slides + embedded React components, presenter mode with second-screen. Each beat is a slide that hosts a live React component. **USE.**
- **`uixmat/onborda`** — Next.js step indicator overlay. Shows "Step 3 of 5: V3 picks the sub-task." **USE.**

### Visual layer (per doc 06)
- 5 Seedance clips generated via Key.ai (`idle.mp4`, `boot.mp4`, `dept-wake.mp4`, `meeting.mp4`, `synthesis.mp4`)
- `/front-end-design` plugin (Claude Code) for HUD chrome scaffolding
- Magic UI `<AnimatedBeam>` + `flowtoken` for streaming text over backdrops
- Howler.js sound sprite (8 sounds, per doc 04 §F)

### Agent backend (per doc 03)
- **`CopilotKit/canvas-with-langgraph-python`** — fork as scaffold
- **`langchain-ai/langgraph` + `langgraph-supervisor-py`** — orchestration
- **`agentscope-ai/agentscope`** — `MsgHub` for Beat 4 multi-agent meeting visual
- Claude Sonnet 4.5 via Anthropic SDK + prompt caching

### Voice
- **`Picovoice/porcupine`** — `usePorcupine` hook for "Hey Marketing" wake word (on-device, no internet hop)
- OpenAI Realtime API as backup transcription path

### Failure recovery
- **`dgageot/demoit`** — STEAL THE PATTERN. Every XState action has both `liveAction` and `fakeAction`. Fake mode plays a pre-recorded Seedance clip if the agent backend fails. Audience never knows.

### Deployment
- GitHub (private repo) → Vercel (sync deploy) per the YouTube workflow
- PartyKit deploys separately to Cloudflare Workers

---

## The 7-day plan (final)

### Day 1 (Sat) — Generate assets + scaffold the spine
**Morning (4 hrs):**
- Sign up for Key.ai. Buy ~$30 of credits.
- Write `Jarvis Loop Prompt` skill in `.claude/skills/jarvis-loop-prompt/skill.md` (template in doc 06)
- Generate 5 Nano Banana 2 input images (16:9, one per Seedance clip)
- Kick off all 5 Seedance generations in parallel (~10 min total render)

**Afternoon (4 hrs):**
- `npx create-next-app@latest gbi-jarvis --ts --tailwind --app`
- Install: `xstate @xstate/react @statelyai/inspect partysocket onborda framer-motion howler @magicui/animated-beam flowtoken`
- Install Claude Code plugins: `/front-end-design`
- Define the XState machine in `lib/machine.ts` with all 8 states (idle → boot → pick-dept → pick-task → voice → meeting → synthesize → approved)
- Stub each state with `console.log` actions

**Evening (2 hrs):**
- Drop 3 reference screenshots in repo (Iron Man HUD, Blade Runner 2049, GMUNK Tron)
- Prompt Claude Code: "Build the stage shell — 5 Seedance backdrops state-triggered by the XState machine. Use the FUI rules from `research/04-jarvis-visual-stack.md`. Layer Magic UI HUD on top."

**Deliverable:** Static visual shell, XState machine wired, no controllers yet. Press `n` to advance state in dev.

### Day 2 (Sun) — PartyKit + phone controller
**Morning (4 hrs):**
- Deploy a PartyKit room to Cloudflare Workers. Schema: `{currentBeat: string, volunteerInputs: Record<string, any>}`
- Stage screen subscribes as DISPLAY: reads `currentBeat`, renders matching XState state
- Build `/control` route — a thin React app that renders the right button surface based on current beat

**Afternoon (4 hrs):**
- QR code generator — points to `https://[your-vercel].vercel.app/control?room=stage`
- Test on real phones — Safari iOS, Chrome Android. Hold-to-talk gesture works on both?
- Wire volunteer button presses → PartyKit → XState `send({type:'NEXT'})`

**Deliverable:** Two laptops + one phone in dev mode, all synced. Press button on phone, watch state advance on big screen.

### Day 3 (Mon) — Agent backend
- Per doc 03: fork `CopilotKit/canvas-with-langgraph-python`
- Wire CEO + 4 dept agents (Marketing, Sales, Ops, Finance) via `langgraph-supervisor`
- System prompts: borrow wholesale from your existing `purely-personal:marketing-engine`, `sales-engine`, `operations-engine` skills
- Prompt caching on CEO system prompt
- FastAPI bridge between LangGraph and the Next.js stage
- **Deliverable:** Curl the endpoint with "create LinkedIn content for this week" → get real content streamed back

### Day 4 (Tue) — The meeting (THE WOW BEAT)
- Install `agentscope-ai/agentscope`. Wire `MsgHub` for Beat 4
- 4 named agent roles: Content, Ads, Email, Performance (Marketing's sub-team)
- Each one's "thought" streams as a Magic UI floating speech bubble over `meeting.mp4` backdrop
- Sound: Howler `comms-ping` per bubble
- The bubbles overlap and converge — by end, CEO synthesizes
- **Deliverable:** Beat 4 looks like a movie. Send the GIF to one trusted person and ask "would you screenshot this?"

### Day 5 (Wed) — Voice + boot + Onborda
- Picovoice `usePorcupine` — "Hey Marketing" wake-word (get AccessKey 7 days early)
- Boot sequence: GSAP timeline + `boot.mp4` + Howler `boot` chime
- Onborda overlay — "Step X of 5: [V's name] [action description]"
- Cmd+T fallback (presenter types instead of voice)
- **Deliverable:** Full 5-beat flow runs end-to-end with voice, on-screen step indicators

### Day 6 (Thu) — Fake-mode + polish
- Implement `demoit` pattern: every XState action has `live` and `fake` variants
- Env flag `STAGE_MODE=fake` makes every action play a pre-recorded clip + canned LLM output
- Default to fake mode for stage (deterministic, instant). Real mode only in green room for the highlight reel.
- Run the FUI rules audit (doc 04 §E): glow falloff, easing curves, neon discipline, negative space, ambient text
- Build the kill switch: `Esc` → `idle.mp4` + "SYSTEM IDLE" text. Use it the moment anything looks wrong.
- **Deliverable:** Demo runs reliably from any state. Esc always rescues.

### Day 7 (Fri) — Stage rehearsal + deploy
- Push to GitHub (private). Sync to Vercel.
- Test on actual stage WiFi at venue. Hotspot backup.
- Print and tape to laptop:
  - The 5-beat run order
  - The recovery card (doc 02 LIVE_DEMOS §"Universal demo recovery card")
  - The kill-switch instruction
- Stately Inspect on backstage laptop — Mac monitors during show
- Run the full demo 5× back-to-back
- Record one perfect run as the master backup MP4 (queued in OBS, ONE keystroke away)
- **Deliverable:** Demo is muscle memory. You can run it half-asleep.

---

## What's different from doc 03's plan

- The stage shell is now Slidev + Onborda (not raw Next.js + CopilotKit chat)
- The state spine is XState, not LangGraph state alone
- Multi-controller via PartyKit (not single-presenter)
- 5 named beats instead of "press one button"
- Fake mode is now the DEFAULT for stage (not just a fallback)

## What's different from doc 06's plan

- Each beat is now a volunteer + phone, not a presenter button
- The QR code is on screen the whole demo
- The Onborda overlay names the volunteer and the action

---

## The kill switches (memorize)

- **Esc** → `idle.mp4` + "SYSTEM IDLE" text. Use the moment anything looks wrong.
- **Cmd+T** → toggle to manual typing, bypassing voice
- **Cmd+F** → force fake mode mid-demo (if live agents start hallucinating)
- **Cmd+B** → backup video plays (the master MP4 from Day 7 rehearsal)
- **Cmd+R** → reset XState to `idle`, restart the relay from V1

These bind in the stage shell as global key handlers. AV operator has them taped to their laptop.

---

## Stage choreography (the presenter's rhythm)

Between each beat, ONE line:
- After V1: *"V1 just woke the AI. V2 — your turn."*
- After V2: *"V2 picked Marketing. V3 — what should Marketing do?"*
- After V3: *"V3 picked Content. V4 — speak it into existence."*
- After V4: *"V4 just spoke. The team is meeting. V5 — your job is the last word."*
- After V5: *"V5 just shipped a week of LinkedIn content from this room. In 90 seconds. THIS is the cohort."*

Each line is **the anchor**. Each line names the volunteer, names what they did, sets up the next. The room sees the relay as inevitable.

---

## What this enables in the close (Day 2)

> *"You saw 5 people from this room walk up and run an AI team. None of them knew this morning that they'd do that. By July 1, you ARE one of those 5. The cohort doesn't teach you — the cohort puts you in V1's seat, then V2's seat, then V3's seat, until pressing the button is muscle memory."*

That close is what the relay structure unlocks. A single-volunteer demo can't reach for that line. A 5-volunteer relay earns it.

---

## Sources (new in this doc — old sources in 03/04/05/06)

- XState v5: https://github.com/statelyai/xstate
- Stately Inspect: https://github.com/statelyai/inspect
- PartyKit: https://github.com/cloudflare/partykit
- Onborda: https://github.com/uixmat/onborda
- Slidev: https://github.com/slidevjs/slidev
- Linora MobileController: https://github.com/linorabolini/MobileController
- Bredele qrcontrol: https://github.com/bredele/qrcontrol
- Demoit: https://github.com/dgageot/demoit
