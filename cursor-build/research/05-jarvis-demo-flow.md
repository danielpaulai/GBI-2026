# 05 — Jarvis Demo Flow: The Build (Synthesis)

The user-described demo flow:
1. **Boot** — someone walks up, system "wakes."
2. **Press** — volunteer presses Marketing button: *"Hey Marketing, start!"*
3. **Expand** — Marketing department node opens down into sub-categories (Content / Ads / Email / Performance).
4. **Meeting** — departments visibly *confer* with each other — chat bubbles, speaking turns.
5. **Voice ask** — "Create content for this week on LinkedIn."
6. **Payoff** — real LinkedIn content streams out.

The stack is already chosen in docs 03 and 04. This file maps each beat to the right primitive and adds the genuinely-new finds the prior research missed.

---

## Beat-by-beat mapping

### Beat 1 — Boot (≤4 hrs to build)
- GSAP timeline (NOT Theatre.js — overkill for one-shot)
- 1 Seedance clip (6–10s, abstract cyan particle drift) as backdrop
- 1 Howler chime ("boot" sprite from doc 04 §F)
- Pattern to copy: `harsh-raj00/my-jarvis` README boot GIF — reverse-engineer the beats

### Beat 2 — Press (already covered)
- Arwes `<FrameSVGOctagon>` department node + Magic UI `GlowingEffect`
- `confirm` Howler bleep fires 60ms BEFORE visual change (doc 04 §E13)

### Beat 3 — Expand (already covered)
- Motion `<AnimatePresence>` + `staggerChildren: 0.08` (doc 04 §D Day 2)
- Sub-panel layout: 4 cards in 2×2 grid below department node

### Beat 4 — The Meeting (THE NEW WORK — this is the wow)
This is the one beat doc 03/04 didn't crack. Three repos solve it:
- **`agentscope-ai/agentscope`** (~7k ⭐) — `MsgHub` primitive: turn-taking, dynamic participants. Pipe its events into your xyflow nodes.
- **`OpenBMB/ChatDev`** (~26k ⭐) — CEO↔CTO bubble dialog pattern. Steal the visual, not the code.
- **`agentic-layer/observability-dashboard`** — OTel-style `{sender, receiver, payload, timestamp}` event schema. This is the wire format your floating chat bubbles render against.

**Implementation:** Magic UI `<AnimatedBeam>` between department nodes (already in stack), plus floating speech-bubble divs with the agent's current short-form thought (1–2 lines, not the full reasoning). Bubble pops in, holds 1.5s, fades. Sound: `comms-ping` per bubble.

### Beat 5 — Voice ask
- **`Picovoice/porcupine` `demo/react`** (~4k ⭐) — `usePorcupine` hook for on-device "Hey Marketing" wake word. **Beats Web Speech API for stage** (no internet hop, no Google reliability variance). Get AccessKey on stage laptop a week ahead — free tier is per-device.
- For the open-ended request ("create content for this week"), keep OpenAI Realtime as transcription-only path (already in doc 03).
- **Critical:** Cmd+T hidden type-instead toggle (doc 03 §D Day 5).

### Beat 6 — Payoff (already covered)
- Vercel AI SDK `streamText` + flowtoken `<SmoothText animation="blurIn">`
- Min font-size 24px, projectable from row 20 (doc 04 §D Day 3)

---

## New finds not in docs 03/04 — top picks only

| Repo | Use it for | Verdict |
|---|---|---|
| `agentscope-ai/agentscope` | Multi-agent `MsgHub` orchestration with turn-taking | **Use.** Solves the meeting problem. |
| `OpenBMB/ChatDev` | Dept↔dept dialog visual idiom | **Steal the staging.** Screenshot, mimic. |
| `harsh-raj00/my-jarvis` | React + R3F + WebSocket Iron Man scaffolding | **Fork day 1.** Closest to end state. |
| `e-Nicko/webgl-digital-globe` | R3F holographic globe for idle backdrop | **Park behind org chart.** Instant Jarvis. |
| `mhdk1602/cursor-hud-themes` | CSS tokens (wireframe grids, breathing glows) | **Steal tokens.** 30-min win. |
| `Picovoice/porcupine` | On-device wake-word detection | **Use.** More reliable than Web Speech API. |
| `agentic-layer` | OTel event schema for inter-agent traffic | **Use the schema, ship own UI.** |

**Skip:** `MassGen` (terminal-only), `chrisfrank/fui` (stale), `Web_WakeWordDetection` (Picovoice better), `mission-control` (Kanban vibe wrong for stage — but mention as cohort upsell), `future-agi` (too clinical).

---

## Higgsfield + Seedance — practical specs

The prior docs reference these tools for "backdrop video" but didn't pin the specs. Here:

- **Clip length:** 6–10s loops. Render the ending close to the start to hide the loop seam.
- **Format:** export H.264 MP4 from Seedance, transcode to WebM/VP9 with FFmpeg. Serve WebM first, MP4 fallback. ~30% smaller.
- **Resolution:** 1280px wide max — even on 4K stage screen, audience won't see the difference and venue WiFi won't choke.
- **Hosting:** **Vercel Blob, not the public folder.** Auto-CDN, no edge cache surprises on stage. Public folder forces redeploy to swap clips.
- **Blend mode:** `mix-blend-mode: screen` over black underlay (cinematic glow). `multiply` if you want darker. Set `<video>` opacity 0.4–0.6 so the HUD reads.
- **Attributes:** `autoPlay muted loop playsInline preload="auto"`. Use `auto` not `metadata` — you want it ready on stage, not lazy-loaded.

**No clean integration repo found.** Don't search further — for 7 days, a `<video>` tag in a `fixed inset-0` div is 10 lines.

**Generate 3–5 clips:**
1. Slow cyan particle drift (idle backdrop)
2. Camera fly-through over a dark grid plane (Beat 1 boot)
3. Network of lights pulsing (Beat 4 meeting)
4. Aurora ribbons (Beat 6 payoff)
5. Insurance: any abstract clean tech-y motion

Cross-fade between clips on big section transitions. Never run at full opacity.

---

## The 7-day plan, condensed

Doc 03 has the agent-side day breakdown. Doc 04 has the visual-side. Run them in parallel. The merge points:

- **Day 2:** Visual scaffold meets agent backend at the WebSocket / SSE boundary. Pick one chat shell (CopilotKit OR assistant-ui — not both).
- **Day 4:** Inter-agent meeting visual. THIS is the day with the most new work — budget the full day.
- **Day 5:** Voice + boot sequence. Picovoice hook + GSAP timeline.
- **Day 7:** Stage rehearsal — kill-switch (Esc), fake-mode toggle, project at venue resolution, audio through PA.

---

## The single highest-leverage "wow" mechanic

If you only nail one thing visually, nail **Beat 4 — the meeting**. Everyone has seen a chat UI. Nobody has seen 4 named AI agents passing speech bubbles to each other across an org chart while a 5th synthesizes the result into a real LinkedIn post that *materializes* on screen with `flowtoken` blur-in animation.

That's the screenshot that gets passed around at lunch. That's what makes the $1,497 feel cheap.

---

## Sources

Doc 03 sources cover the agent stack. Doc 04 covers the visual stack. New finds:
- AgentScope: https://github.com/agentscope-ai/agentscope
- ChatDev: https://github.com/OpenBMB/ChatDev
- harsh-raj00/my-jarvis: https://github.com/harsh-raj00/my-jarvis
- e-Nicko/webgl-digital-globe: https://github.com/e-Nicko/webgl-digital-globe
- mhdk1602/cursor-hud-themes: https://github.com/mhdk1602/cursor-hud-themes
- Porcupine react demo: https://github.com/Picovoice/porcupine/tree/master/demo/react
- agentic-layer: https://github.com/agentic-layer
- Vercel video hosting: https://vercel.com/kb/guide/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif
- Seedance 2.0: https://higgsfield.ai/seedance/2.0
