# 06 — The Seedance Approach: Simpler Path to the Same Cinema

This document supersedes parts of doc 04 (visual stack). After watching a workflow demo of someone using Seedance + Claude Code's `/front-end-design` plugin to ship visually-stunning sites in hours, the conclusion is clear:

**For the GBI demo's visual layer, generate the cinema with Seedance instead of hand-coding it.** Doc 04's hand-built approach (Arwes + R3F bloom + Theatre.js + custom shaders) still works, but is heavier than necessary. Doc 03 (the agent backend) stands.

---

## The shift in mental model

Doc 04 said: build the cinematic UI in code, layer LLM streaming on top.
This doc says: **let Seedance render the cinema, layer interactive HUD chrome and LLM streaming on top.**

The difference matters because:
- A Seedance 10-second clip at 720p is ~$5–10 of credits and renders in under 2 minutes.
- The same visual quality hand-coded in R3F + bloom takes 1–2 days and still doesn't look as cinematic.
- Iteration cost drops to "regenerate the clip" instead of "tune shader parameters."
- Higgsfield/Seedance produce cinematic output by default — that's literally their job.

Doc 04 still has value: the FUI rules (3-layer depth, glow falloff, neon discipline, easing curves, ambient text) all apply *to the HUD overlay* on top of the video. Use it for the chrome, not the backdrop.

---

## The 5 techniques from the video that apply directly

### 1. The "first frame = last frame" trick
Generate every backdrop clip with first-frame and last-frame set to the same input image. Result: seamless loops with no jarring jump. This is the single biggest unlock — the demo can run for 4 hours without anyone seeing a loop seam.

### 2. The Skill pattern for prompt generation
The creator wrote a `SeaDance Loop Prompt` skill in Claude Code that takes a reference image + intent and outputs a Seedance-optimized prompt under the character limit. **We need our own version: `Jarvis Loop Prompt` skill.** Lives in `.claude/skills/jarvis-loop-prompt/skill.md`. Encodes our color palette (cyan/amber), our pacing (10s, fast cuts), our HUD style.

### 3. Reference image → Seedance prompt → video pipeline
- Generate input image with Nano Banana 2 at 16:9 aspect ratio (matches video output).
- Drop image into Seedance via Key.ai (one API key for all models — cheaper than direct Higgsfield).
- Use 720p, 10 seconds, audio off. Cost: ~410 credits per clip.
- 4–5 clips for the demo = ~$10–25 total in credits.

### 4. The Dribbble/Awwwards reference dump
Take a screenshot of a design you want the site to feel like. Drag it into Claude Code. Say "make it feel like this." The `/front-end-design` plugin uses it as taste anchor. **For us:** screenshot Iron Man HUDs, Blade Runner 2049 UI, GMUNK's Tron work. Drag those in. Claude Code mimics the aesthetic.

### 5. Scroll-driven video frames
Mentioned in the video as a Day-2 unlock: extract video frames and bind them to scroll position. **We don't need this for stage** — the demo is button-driven, not scroll-driven — but the same technique works for **state-driven** videos: bind clip playback to agent state instead of scroll position. CEO node pulses idle clip; volunteer presses Marketing → swap to "Marketing waking up" clip.

### 6. The `/front-end-design` plugin (bonus — not in original doc 04)
`claude /plugins` → install `front-end-design` globally. Now Claude Code has design taste built in. Skip the manual Arwes+Aceternity+Magic UI assembly for the first pass — let the plugin scaffold, then layer the cinematic refinements on top.

---

## The 4–5 Seedance clips to generate for the demo

Each is a 10-second loop, 720p, 16:9, audio off. Generate via Key.ai → SeaDance 2.

| Clip | Input image (Nano Banana prompt) | Seedance prompt intent | When it plays |
|---|---|---|---|
| **idle.mp4** | "Dark void with cyan particles drifting, holographic grid floor in background, deep space aesthetic" | Slow cyan particle drift, gentle camera dolly. First/last frame identical. | Default state — ambient backdrop behind everything else |
| **boot.mp4** | "Cyan particles converging into a glowing orb at center of dark void, emerging hexagonal grid" | Particles converge into central CEO orb. One-shot, plays once on entrance. | Beat 1 — volunteer walks up, system "wakes" |
| **dept-wake.mp4** | "Glowing cyan orb at center, three angular octagonal panels appearing around it, data lines forming" | Three department panels materialize from particles, lines connect them to center. | Beat 2/3 — when a department is pressed |
| **meeting.mp4** | "Three glowing nodes connected by pulsing data streams, light particles flowing between them, dark void background" | Light streams flow between three nodes, particles trail along the paths. | Beat 4 — the meeting (THE SHOWPIECE) |
| **synthesis.mp4** | "Bright text materializing from particles, holographic projection effect, cyan glow, dark backdrop" | Particles coalesce into glowing text shape. | Beat 6 — payoff, content materializes |

**Cost estimate:** 5 clips × ~$5 = $25. Generate them all on Day 1.

---

## Revised 7-day plan (replaces parts of doc 03 and 04)

### Day 1 — Generate the assets + scaffold
**Morning:**
- Sign up for Key.ai. Buy ~$30 of credits.
- Write the `Jarvis Loop Prompt` skill (`.claude/skills/jarvis-loop-prompt/skill.md`). Borrow structure from the SeaDance Loop Prompt skill in the YouTube creator's free school.
- Generate 5 input images via Nano Banana 2 (one for each clip above).

**Afternoon:**
- Run all 5 Seedance generations in parallel. While they render, scaffold:
- `npx create-next-app@latest gbi-jarvis --ts --tailwind --app`
- Install `/front-end-design` plugin globally
- Drop in 3 reference screenshots (Iron Man HUD, Blade Runner 2049, GMUNK Tron)

**Evening:**
- Drag all 5 generated clips into Claude Code
- Prompt: "Build me a Jarvis-style command-center site. Use idle.mp4 as the always-playing backdrop. Layer a HUD on top with the Iron Man HUD reference style. Use the 14 visual rules from research/04-jarvis-visual-stack.md (3-layer depth, glow falloff, neon palette discipline)."

**Deliverable:** Static-feeling but visually stunning shell. CEO orb in center, 4 department nodes around it, idle clip plays in background. No interactivity yet.

### Day 2 — State-triggered video swaps
- Build a `useDemoState()` hook with states: `idle | boot | press-marketing | meeting | payoff`
- Each state maps to a clip from the 5 generated
- On state change: cross-fade between videos (2-second transition, `mix-blend-mode: screen`, opacity 0.4–0.6)
- Wire button presses on department nodes → state transitions
- **Deliverable:** Press a department → backdrop swaps to dept-wake.mp4 → looks like the room is alive

### Day 3 — Agent backend (use doc 03 approach, condensed)
- Fork `CopilotKit/canvas-with-langgraph-python` per doc 03
- Wire CEO + 4 dept agents via `langgraph-supervisor`
- Test text-only: type "create LinkedIn content this week" → see real Marketing agent fire and stream text
- **Deliverable:** Real agents work end-to-end via text

### Day 4 — The meeting visual (THE WOW)
- Use AgentScope `MsgHub` event stream (per doc 05)
- Render speech bubbles using Magic UI primitives — bubble pops in over the meeting.mp4 backdrop, holds 1.5s, fades
- Each agent has a named avatar; bubble shows their 1–2 line current thought
- Sound: `comms-ping` (Howler) per bubble
- **Deliverable:** "Hey team, plan this week" → meeting.mp4 plays → 4 dept bubbles appear in sequence → CEO synthesizes

### Day 5 — Voice + boot sequence
- Picovoice `usePorcupine` hook for "Hey Marketing" wake word (per doc 05)
- Boot sequence: GSAP timeline triggers boot.mp4 + Howler `boot` sound + HUD fade-in
- Cmd+T fallback to type instead of speak
- **Deliverable:** Volunteer says "Hey Marketing" → system boots → demo proceeds

### Day 6 — Polish + LLM streaming on top of synthesis.mp4
- Wire Vercel AI SDK `streamText` + `flowtoken` blur-in
- During Beat 6: synthesis.mp4 plays as backdrop, real LinkedIn content streams *over* it with blur-in tokens
- Run the FUI rules audit (doc 04 §E): glow falloff, easing curves, neon discipline, negative space
- **Deliverable:** Full demo flow runs end-to-end, looks cinematic

### Day 7 — Stage rehearsal + deploy
- Push to GitHub (private repo via Claude Code)
- Sync to Vercel for stable URL (per video creator's workflow)
- Build kill-switch (Esc → idle.mp4 + "SYSTEM IDLE" text)
- Build fake-mode toggle (env flag — pre-recorded LLM responses)
- Project at venue resolution, audio through PA, full dry-run 5×
- **Deliverable:** Demo is muscle memory

---

## What this replaces from prior docs

**Replace from doc 04:**
- ❌ Hand-building Arwes `<FrameSVGOctagon>` chrome → ✅ Let `/front-end-design` plugin build it from reference screenshots
- ❌ R3F + drei + bloom for CEO sphere → ✅ Use boot.mp4 / idle.mp4 with Seedance-rendered glowing orb
- ❌ Theatre.js for boot sequence → ✅ GSAP timeline + boot.mp4 (much simpler)
- ❌ tsParticles for backdrop → ✅ Seedance idle.mp4 has particles baked in
- ❌ Custom inter-agent line shaders → ✅ meeting.mp4 has light streams baked in; layer Magic UI `<AnimatedBeam>` for additional state-triggered ones

**Keep from doc 04:**
- ✅ The 14 FUI rules (apply to HUD overlay, not backdrop)
- ✅ Magic UI `<AnimatedBeam>` for state-triggered inter-agent lines
- ✅ flowtoken for streaming text materialization
- ✅ Howler.js for sound sprite
- ✅ shadcn + Tailwind for HUD chrome
- ✅ The neon palette discipline (cyan + amber, no third color)

**Keep from doc 03 (no change):**
- ✅ Entire agent backend stack (LangGraph supervisor + Claude Sonnet 4.5 + CopilotKit + Anthropic SDK)
- ✅ Voice transcription via OpenAI Realtime (push-to-talk)
- ✅ Prompt caching for the CEO system prompt
- ✅ All risk mitigations (kill-switch, fake mode, hidden Cmd+T fallback)

---

## The trade-off (what you give up)

Pre-rendered videos are not real-time. The boot sequence is the same every show. The meeting visual plays the same way each time, regardless of which departments are actually firing.

**Why this doesn't matter on stage:**
1. The audience never sees the demo twice. Whether it's pre-rendered or computed live, it's *new to them*.
2. The actual LLM output (the LinkedIn content, the cold message, the weekly plan) IS real-time. That's where they look.
3. Pre-rendered = deterministic = no demo-day surprises in the visual layer. The variability budget gets spent on the LLM, where it matters.
4. If a clip somehow breaks, fall back to idle.mp4 and the demo still feels alive.

**Why it actually helps:**
- You can pre-record the entire visual flow as a single MP4 backup. If the agent backend dies, AV cuts to the recording. Audience never knows.
- You can iterate the visuals without redeploying code.
- You can A/B test multiple visual approaches in a day.

---

## The skill we need to write Day 1

`.claude/skills/jarvis-loop-prompt/skill.md`:

```markdown
---
name: jarvis-loop-prompt
description: Generate Seedance video prompts for Jarvis-style command-center loops. Use when generating any backdrop or transition clip for the GBI demo. Outputs prompts under 1000 chars, optimized for 10-second 720p loops, with first-frame=last-frame for seamless looping.
---

# Jarvis Loop Prompt Skill

Use when the user asks for a Seedance prompt for the GBI demo.

## Constraints (always)
- 10 seconds, 720p, 16:9, no audio
- First frame and last frame match (seamless loop)
- Color palette: cyan (#00d4ff) primary, amber (#ffa500) accent, deep void black (#050810)
- No text in video unless explicitly requested (text rendered in HUD overlay layer)
- Camera: subtle dolly or static — no aggressive moves
- Pacing: slow, contemplative — Blade Runner 2049, not Transformers

## The pattern
1. Describe the scene in 2 sentences.
2. State the camera move (or "camera static").
3. State the color and lighting.
4. State the loop mechanic ("the final frame matches the first").
5. State what NOT to include (text, fast motion, multiple subjects, etc.)

## Reference style anchors
- Iron Man HUD (Perception studio)
- Blade Runner 2049 UI (Territory studio)
- TRON: Legacy holograms (GMUNK)
- Apple Vision Pro WWDC 2023 keynote (translucency, depth via shadow)

## Output template
Return ONLY the prompt as a code block, ready to paste into Key.ai SeaDance interface. Confirm character count is under 1000.
```

---

## Bottom line

The video creator's workflow takes the 7-day plan from "ambitious but achievable" to "comfortably doable, with time for rehearsal." Doc 03's agent backend stays. Doc 04's heavy visual stack mostly gets replaced with 5 Seedance clips and the `/front-end-design` plugin. The wow factor stays the same — possibly higher, because Seedance renders look more cinematic than anything you can hand-code in a week.

The build path is now:
1. Generate 5 cinematic clips (Day 1, ~$25, ~2 hours)
2. Scaffold the shell with `/front-end-design` + reference screenshots (Day 1)
3. Wire state-triggered video swaps (Day 2)
4. Bolt on the agent backend from doc 03 (Day 3)
5. Build the meeting visual from doc 05 (Day 4)
6. Voice + boot + polish (Days 5–6)
7. Stage rehearsal + Vercel deploy (Day 7)
