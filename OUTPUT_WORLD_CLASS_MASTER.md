# Jarvis · World-Class Output Master Plan

**Synthesis of 4 deep research streams (May 2026):**
- `research/14-output-quality-masterplan.md` — drafter→critic→reviser→judge loop
- `research/15-voice-integration-masterplan.md` — voice stack that ships <1000ms
- `research/16-image-pipeline-masterplan.md` — Satori cards, Soul 2.0 hero
- `research/17-multiagent-quality-masterplan.md` — harness era, cross-model judge

**Drop this file in your Jarvis repo. Reference from every AI coding session: `@File OUTPUT_WORLD_CLASS_MASTER.md`.**

---

## 1 · Executive Summary — The 5 Decisions

| Decision | What | Why |
|---|---|---|
| **D1** | **Switch to harness, not graph.** Claude Agent SDK (Py) or LangChain Deep Agents | The "draw a graph" era ended in 12 months. Anthropic's own data: multi-agent harness with isolated context beat single-agent by **90%**, 80% explained by tokens alone. |
| **D2** | **Quality lives in the LOOP, not the prompt.** Drafter → Critic → Reviser → Judge → Ship | Single-shot generation tops out at 6/10. The 5-stage loop is the only path to 9.5+. |
| **D3** | **Cross-model judge.** Haiku judges Opus output. Or GPT-5 judges Claude. | Self-evaluation inflates scores 5-15%. Cross-model defeats this. Cheaper too. |
| **D4** | **Stop generating post cards. Render them.** Vercel OG / Satori | LinkedIn cards are a typography problem, not a generative problem. Linear / Resend / Stripe / GitHub all use Satori. Cost: $0/card. |
| **D5** | **KIE.AI is for image/video inference, NOT voice.** ElevenLabs Flash v2.5 (or Cartesia Sonic-3) is voice. | Single biggest source of confusion in the current build. KIE = "Stripe for AI inference" — routes to Veo, Flux, Suno, Nano Banana. |

**The single biggest 2026 architectural shift:** *the orchestration era ended; the harness era began.* If Jarvis ships 6/10 today, the fix is **add the loop**, not switch frameworks.

---

## 2 · The Quality Loop Architecture

The spine. Every text-output module routes through this. No exceptions.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Voice DNA  ─►  Brief  ─►  3 parallel drafts (varied temp)      │
│                                       │                         │
│                                       ▼                         │
│                              ┌────────────────┐                 │
│                              │ Critic Agent   │ different model │
│                              │ (scores 0-10)  │ (Haiku→Opus)    │
│                              └────────┬───────┘                 │
│                                       │                         │
│                          score < 8.5  │  score ≥ 8.5            │
│                                ▼                ▼               │
│                       ┌──────────────┐    ┌─────────┐           │
│                       │   Reviser    │    │  Judge  │           │
│                       │   (max 2x)   │    │ (final) │           │
│                       └──────┬───────┘    └────┬────┘           │
│                              │                 │                │
│                              └─────────┬───────┘                │
│                                        │                        │
│                                        ▼                        │
│                               ┌────────────────┐                │
│                               │  De-AI Pass    │ regex+LLM      │
│                               │  em-dash cap   │ banned words   │
│                               └────────┬───────┘                │
│                                        │                        │
│                              score ≥ 8.5 ─► SHIP                │
│                              score < 8.5 ─► escalate or kill    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Critical rules:**
- **Cap reflection at 2 rounds.** Reflexion paper data: 3+ rounds DEGRADES quality (model overcorrects, drifts from voice).
- **Sub-agents have isolated context.** Each draft, critic, reviser, judge runs in its own context window. No shared mega-prompt.
- **Cross-model judge.** Writer = Opus 4.7. Judge = Haiku 4.5 OR GPT-5. Same-model = 5-15% score inflation.
- **Hard floor: 8.5/10 to ship.** Below = revise once, escalate, or kill. Never ship 7s.
- **Trace every loop in Langfuse.** North Star metric: **% ship-on-iter-1.** That's the quality bar moving over time.

---

## 3 · The Four Locked Stacks

### 3a · TEXT OUTPUT (LinkedIn posts, content, copy)

| Layer | Pick | Why |
|---|---|---|
| Voice capture | **OpenClaw `voice-matched-content` schema** + 50 real Danny posts cached @ 1-hour TTL | Voice = data (n-grams, transition phrases, sentence-length distribution), not adjectives |
| Drafter | Claude Opus 4.7, 3 parallel drafts at varied temperatures (0.6 / 0.8 / 1.0) | Parallel beats serial; varied temp gives the critic real choice |
| Critic | Claude Haiku 4.5 with the **Judge Rubric** (Section 5) | Different model from writer; cheap; 6 dimensions scored |
| Reviser | Claude Opus 4.7, max 2 rounds | Cap is non-negotiable |
| De-AI pass | **`jalaalrd/anti-ai-slop-writing`** (50+ banned words, 35+ banned phrases, 16 banned openers) + regex em-dash cap | Em dash = #1 AI fingerprint. Hard cap: 1 per 200 words |
| Judge gate | Haiku judges Opus output. Hard floor: **8.5/10** | Below = revise/escalate/kill |
| Compile | **DSPy + GEPA** (ICLR 2026 Oral) once you have 50+ judge-scored posts | Auto-discovers optimal prompts. Beats RL by 6-20% with 35× fewer rollouts |

**Sleeper repo to fork (4-8 hours):** **`enablement-ch/clio-ghostwriter`** (MIT, ~6 stars). The entire pipeline already built — QA scoring 0-10, hard 8.1 threshold, max-3 rewrite loop, factual-integrity veto.

### 3b · VOICE (stage demo + agent voice)

| Layer | Pick | Latency | Why |
|---|---|---:|---|
| Input | **Spacebar push-to-talk** | — | Eliminates VAD bug class. Audience noise = chaos for open-mic. |
| Mic | SM58 dynamic + Krisp pre-STT denoise | — | Cuts audience PA bleed. |
| STT | **Deepgram Nova-3** | ~250ms | Best accents, fastest. Endpointing: 500ms. |
| LLM | **Claude Haiku 4.5** + prompt caching @ **1-hour TTL** (paid tier) | ~100ms TTFT | Note: Anthropic dropped default TTL to 5min on March 6 2026. Request 1-hour explicitly. |
| TTS | **ElevenLabs Flash v2.5** over WebSocket, `auto_mode: true` | ~75ms TTFA | NOT v3 (that's for content, higher latency). IVC voice clone, not PVC. |
| Streaming | LLM tokens → TTS as they arrive (don't await full response) | — | Saves 4s on average response |
| **End-to-end target** | | **700-1000ms** | Anything above 1.5s feels broken |

**Worth A/B testing:** **Cartesia Sonic-3 has 40ms TTFA** (half of ElevenLabs Flash). Won 61.4% in blind preference vs Flash v2. Real alternative.

**Closest existing reference to fork:** **`Open-LLM-VTuber/Open-LLM-VTuber`** — open-source Neuro-Sama clone. Live2D avatars, voice interruption, Claude support, ElevenLabs integration. Reskin the avatar to Iron Man HUD, save weeks.

### 3c · IMAGE / SOCIAL CARDS

The split that fixes the AI-slop problem:

```
LinkedIn post cards (text-heavy)  ─►  RENDER (Vercel OG / Satori)
Hero photography (visual punch)   ─►  GENERATE (Higgsfield Soul 2.0)
Hard creative prompts             ─►  GENERATE (Flux 2 [pro])
Inference cost                     ─►  Route through KIE.AI gateway
LoRA training                      ─►  Direct fal.ai
```

| Use case | Tool | Cost/card | Why |
|---|---|---:|---|
| **Post cards** (announcement / quote / stat / framework) | **Vercel OG / Satori** (JSX → SVG → PNG) | **$0** | Linear, Resend, Stripe, Vercel, GitHub PR cards — all use this. Brand-locked, deterministic, pixel-perfect. |
| **Hero photography** | **Higgsfield Soul 2.0** | ~$0.05-0.08 | Purpose-trained for "shot, not generated" look. Better than Flux 2 default. |
| **Hard creative prompts** | **Flux 2 [pro]** | ~$0.05 | Bonus: understands HEX codes natively (*"the wall is #0A0A0B"* — it follows) |
| **Text-in-image** (quotes, frameworks) | **Ideogram 3.0** | ~$0.03 | Best text rendering inside generated images |
| Quality gate | `improved-aesthetic-predictor` (CLIP+MLP) reject <6.5, re-roll 3× | — | Single biggest agency-vs-amateur split |
| Upscale | Real-ESRGAN x4 | — | Standard final pass |

**The "no AI slop" prompt rule** — use physical photography vocabulary:
> *"Sony 35mm f/1.4, 1/125s, ISO 800, camera-left tungsten softbox 30° elevated, 1:8 key-to-fill, Kodak Portra 400, slight halation"*

**Banned words that flip models into slop mode:**
> ❌ stunning · breathtaking · masterpiece · hyper-realistic · 8K · professional · ultra-detailed · award-winning

### 3d · ORCHESTRATION (the harness)

| Layer | Pick | Why |
|---|---|---|
| **Harness** | **Claude Agent SDK (Python)** OR **LangChain Deep Agents** | Bare LangGraph is the runtime, not the architecture. Harness = LangGraph + planning + sub-agents + filesystem. |
| Sub-agent pattern | **Isolated context windows** per agent | Anthropic data: 90% lift, 80% explained by tokens-per-agent |
| Tool protocol | **MCP (Model Context Protocol)** | Linux Foundation standard since Dec 2025. OpenAI + Google adopted. Tool RAG solves 50-tools-in-context. |
| Compile prompts | **DSPy + GEPA** (ICLR 2026 Oral) | Beats RL/GRPO by 6-20%, 35× fewer rollouts |
| Observability | **Langfuse** (self-hosted) | North Star: "% ship-on-iter-1". Without it you can't tell *why* output is bad — only *that* it's bad. |

**Frameworks now obsolete (May 2026):**
- ❌ **AutoGen** — maintenance mode, folded into Microsoft Agent Framework
- ❌ **OpenAI Swarm** — replaced by Agents SDK + Harness
- ⚠️ **Bare LangGraph** — still good as runtime, but use Deep Agents on top

**CopilotKit raised $27M Series A May 2026** — still the best AG-UI for streaming agent state into React.

---

## 4 · The brand.json Schema

This is the file that locks brand consistency across ALL outputs (text, image, voice). Build this first.

```json
{
  "brand": "Purely Personal",
  "owner": "Daniel Paul",
  "palette": {
    "primary": "#ec4357",
    "primary_alt": "#d92e44",
    "background": "#0a0204",
    "accent_gold": "#fbbf24",
    "text_primary": "#ffffff",
    "text_muted": "#c8c8c8"
  },
  "typography": {
    "display": "Space Grotesk",
    "body": "Inter",
    "mono": "JetBrains Mono"
  },
  "voice": {
    "anchor_words": ["Tuesday", "deploy", "build", "ship"],
    "catchphrase": "Who builds the AI? I DO!",
    "banned_phrases": [
      "leverage", "synergize", "unlock potential",
      "in today's world", "in the digital age",
      "delve", "tapestry", "navigate the landscape",
      "embark on a journey", "game-changer"
    ],
    "banned_openers": [
      "In today's", "Are you struggling", "Here's the thing",
      "Let's dive in", "Picture this", "Imagine"
    ],
    "em_dash_cap_per_200_words": 1,
    "average_sentence_length_words": 12,
    "tone": "punchy, hook-first, second-person, sentence fragments OK",
    "voice_samples_path": "data/voice-corpus/"
  },
  "photo_style": {
    "lens": "Sony 35mm f/1.4",
    "shutter": "1/125s",
    "iso_range": "400-800",
    "lighting": "camera-left tungsten softbox 30° elevated, 1:8 key-to-fill",
    "color_grade": "Kodak Portra 400, slight halation",
    "mood": "premium, professional, slight cinematic warmth"
  },
  "card_grid": {
    "aspect_ratios": {
      "linkedin_square": "1200x1200",
      "linkedin_landscape": "1200x627",
      "linkedin_carousel": "1080x1350"
    },
    "padding": 80,
    "title_font_size": 56,
    "body_font_size": 24,
    "logo_position": "bottom-left",
    "logo_size": 48
  },
  "judge_rubric": {
    "hook_strength": { "weight": 0.20, "floor": 8 },
    "voice_match": { "weight": 0.25, "floor": 8 },
    "specificity": { "weight": 0.15, "floor": 7 },
    "structure": { "weight": 0.15, "floor": 7 },
    "de_ai_score": { "weight": 0.15, "floor": 9 },
    "factual_integrity": { "weight": 0.10, "floor": 10, "veto": true }
  }
}
```

**Use:** every agent reads this. Drafter inserts voice samples. Image renderer reads palette + typography. Judge scores against `judge_rubric`. Single source of truth.

---

## 5 · The Judge Rubric (the artifact that matters most)

Print this. Tape it next to your monitor. Score every output before shipping.

| Dimension | Weight | What 10/10 looks like | What 6/10 looks like |
|---|---:|---|---|
| **Hook strength** | 20% | Stops scroll in 3 seconds. Specific number, provocative reframe, or confession. | Generic opener, "Are you struggling..." |
| **Voice match** | 25% | Uses anchor words. Sentence fragments OK. Sounds like Danny said it at a bar. | Reads like a LinkedIn ghostwriter. "Leverage", "synergize". |
| **Specificity** | 15% | Real numbers, real names, real moments. *"Last Tuesday I deployed 3 AI employees in 90 minutes."* | "I helped someone improve productivity recently." |
| **Structure** | 15% | Hook → 3-5 line body → CTA. Plain text, no formatting. Under 1200 chars. | Wall of text, no breaks, multiple emojis. |
| **De-AI score** | 15% | Zero banned words. ≤1 em dash per 200 words. No tells. | Em dashes everywhere, "in today's world", "delve". |
| **Factual integrity** | 10% (VETO) | Every claim verifiable from source data. | Invented stats. Made-up case studies. |

**Hard floor: 8.5 weighted average to ship. AND every dimension floor met. AND factual integrity veto = automatic kill.**

---

## 6 · Migration Plan — From Current State to World Class

You currently have: workshop docs + a static GBI landing page + cursor-package PRDs. **No actual Jarvis code in the repo.** So this is greenfield, not refactor.

### Sprint 0 · Foundation (Day 1, 4 hours)
- [ ] Build `brand.json` (Section 4 above) — this unlocks everything
- [ ] Set up Anthropic API key with **paid tier** (required for 1-hour prompt cache TTL)
- [ ] Set up Langfuse self-hosted (Docker compose, 30 min)
- [ ] Clone `enablement-ch/clio-ghostwriter` into `/reference/`
- [ ] Clone `anthropics/claude-agent-sdk-demos` — study `research-agent/`
- [ ] Clone `Open-LLM-VTuber/Open-LLM-VTuber` if you want the avatar shortcut

### Sprint 1 · Image cards (Day 2, 3 hours) ← FASTEST WIN
- [ ] **Hour 1:** finish `brand.json`
- [ ] **Hour 2:** build `/api/og/post-card.tsx` with 4 variants (announcement / quote / stat / framework) — use Satori + JSX
- [ ] **Hour 3:** wire Jarvis text output → renders to OG endpoint URL → returns brand-locked PNG
- [ ] **Cards now look agency-grade. $0/card.**

### Sprint 2 · Text output quality loop (Days 3-5)
- [ ] Fork `clio-ghostwriter` pipeline — adapt to Danny's voice
- [ ] Implement Drafter (3 parallel @ varied temp) + Critic (Haiku) + Reviser (Opus, max 2) + Judge gate
- [ ] Install `jalaalrd/anti-ai-slop-writing` SKILL.md as de-AI pass
- [ ] Add em-dash regex cap
- [ ] First 50 outputs: hand-rate them. Feed scores into Langfuse. This is your eval set.

### Sprint 3 · Voice stack (Days 6-8)
- [ ] Spacebar PTT in Next.js (Web Audio API)
- [ ] Deepgram Nova-3 STT (endpointing 500ms)
- [ ] Claude Haiku 4.5 with prompt caching at 1-hour TTL
- [ ] ElevenLabs Flash v2.5 WebSocket with `auto_mode: true`
- [ ] **A/B test against Cartesia Sonic-3** — log latency in Langfuse, ship the faster one
- [ ] Stream LLM tokens INTO TTS (don't await full response) — saves ~4s

### Sprint 4 · Multi-agent harness (Days 9-12)
- [ ] Migrate orchestration to Claude Agent SDK or LangChain Deep Agents
- [ ] Each sub-agent gets ISOLATED context window
- [ ] Move all tool calls behind MCP servers (cleaner, future-proof)
- [ ] Set up cross-model judge (Haiku judges Opus)

### Sprint 5 · Compile (Day 13+, ongoing)
- [ ] Once you have 50+ judge-scored outputs, set up DSPy + GEPA
- [ ] Auto-compile optimal prompts from your eval set
- [ ] North Star: **% ship-on-iter-1** — track weekly

### Sprint 6 · Hero photo path (when needed)
- [ ] Higgsfield Soul 2.0 via API (or KIE.AI gateway for cheaper)
- [ ] `improved-aesthetic-predictor` quality gate, reject <6.5, re-roll 3×
- [ ] Real-ESRGAN x4 final upscale

**Total time to world-class:** ~13 working days. Sprint 1 alone (3 hours) gets you 70% of the visible quality lift.

---

## 7 · Cursor / VS Code Instruction Set

Drop this into `.cursorrules` (or copy into Cursor's first Composer message). Replaces your existing rules.

```
You are working on Jarvis — a multi-agent AI Employee Command Center demoed on stage at GBI Singapore. The output bar is 9.5/10. Below is the locked architecture.

## LOCKED STACK — DO NOT SUGGEST ALTERNATIVES

- Frontend: Next.js 16 App Router, TypeScript strict, Tailwind 4, shadcn/ui
- Image cards: Vercel OG + Satori (JSX → SVG → PNG). NEVER diffusion for cards.
- Hero photos: Higgsfield Soul 2.0 default. Flux 2 [pro] for hard prompts. Route through KIE.AI gateway.
- Quality gate on images: improved-aesthetic-predictor, reject <6.5, re-roll 3× max.
- Text quality loop: Drafter → Critic → Reviser → Judge → De-AI → Ship. Cap reflection at 2 rounds.
- Writer: Claude Opus 4.7. Judge: Claude Haiku 4.5 (cross-model — never self-judge).
- Voice: Spacebar PTT → Deepgram Nova-3 STT → Claude Haiku 4.5 (prompt cache 1-hr TTL) → ElevenLabs Flash v2.5 (auto_mode true). NOT v3.
- Orchestration: Claude Agent SDK (Python) OR LangChain Deep Agents. Sub-agents isolated context.
- Tool protocol: MCP (Linux Foundation standard).
- Observability: Langfuse self-hosted. North Star: % ship-on-iter-1.
- Compile prompts with DSPy + GEPA once 50+ judge-scored examples exist.

## OUTPUT QUALITY RULES (every text output)

1. Read brand.json before generating anything. Voice samples are in data/voice-corpus/. Cache them at 1-hour TTL.
2. Generate 3 parallel drafts at temperatures 0.6 / 0.8 / 1.0 — never single-shot.
3. Critic agent scores against the 6-dimension Judge Rubric. Hard floor 8.5/10.
4. Reviser agent gets MAX 2 rounds. After that escalate or kill — never ship 7s.
5. De-AI pass is mandatory. Em dash cap: 1 per 200 words. Banned word list in brand.json.
6. Factual integrity veto: any unverifiable claim = automatic kill regardless of other scores.
7. Trace every loop in Langfuse with: inputs, draft scores, revisions, final score, ship/kill.

## IMAGE RULES

1. Default to Satori for any text-heavy card. Diffusion is the exception, not the rule.
2. brand.json controls palette, fonts, photo style, card grid. Renderers read it. Prompts inject from it.
3. For diffusion prompts, use physical photography vocabulary: lens, shutter, ISO, light position, color grade.
4. NEVER use: stunning, breathtaking, masterpiece, hyper-realistic, 8K, professional, ultra-detailed, award-winning. These flip models into slop mode.
5. Flux 2 understands HEX codes natively. Inject brand palette as HEX in prompts.
6. Quality gate every diffusion output. Reject <6.5 aesthetic score. Re-roll up to 3 times. Then upscale Real-ESRGAN x4.

## VOICE RULES

1. Spacebar push-to-talk. Never open-mic VAD on stage. Audience noise = chaos.
2. Stream LLM tokens INTO TTS as they arrive. NEVER await full LLM response before starting TTS.
3. End-to-end latency target: <1000ms. Anything >1500ms feels broken.
4. ElevenLabs voice = Flash v2.5 (NOT v3). Use IVC clone, not PVC.
5. Test on actual stage PA, not laptop speakers. The mix changes everything.
6. Build Esc kill-switch and Cmd+T fake-mode toggle on Day 1 of voice work.

## ANTI-PATTERNS — REJECT IF YOU SEE THESE

- ❌ AutoGen (maintenance mode), OpenAI Swarm (deprecated), CrewAI (mediocre quality gates)
- ❌ KIE.AI for voice (it's image/video gateway only)
- ❌ ElevenLabs v3 for live agents (too high latency)
- ❌ Self-judging (writer = judge with same model = 5-15% inflation)
- ❌ Diffusion for LinkedIn post cards (use Satori)
- ❌ "Stunning" / "breathtaking" / "8K" / "professional" in prompts
- ❌ Awaiting full LLM response before starting TTS
- ❌ Open-mic VAD on stage
- ❌ Single-shot generation without quality loop
- ❌ Reflection beyond 2 rounds (degrades quality)
- ❌ Em dash spam (cap: 1 per 200 words)

## WHEN UNCERTAIN

1. Read OUTPUT_WORLD_CLASS_MASTER.md
2. Check the 4 research files in research/14-, 15-, 16-, 17-
3. brand.json is the single source of truth for ANY brand decision
4. If still unclear, ask ONE specific question. Never "what do you want?"
```

---

## 8 · The 5 Reasons Your Current Output Is Mediocre — and the One-Line Fix Each

| # | Reason | Fix |
|---|---|---|
| 1 | **Single-shot generation** — drafter ships first try | Add the 5-stage loop. Cap at 2 reflection rounds. |
| 2 | **Self-judging** — writer scores its own output | Use Haiku to judge Opus output. Cross-model. |
| 3 | **Diffusion for post cards** — generic AI slop | Switch to Satori (JSX → PNG). 3 hours. |
| 4 | **No brand.json** — voice / palette / fonts drift every run | Build brand.json. Every agent reads it. |
| 5 | **No observability** — you can't tell WHY output is bad, only that it is | Langfuse self-hosted. Track % ship-on-iter-1. |

---

## 9 · Debug Checklist — The 7 Most Common Bugs

| Bug | Symptom | One-line fix |
|---|---|---|
| **Voice agent silently slow** | Used to be 700ms, now feels 1.5s | Anthropic dropped prompt cache TTL to 5min on March 6. Request 1-hour explicitly (paid tier). |
| **Robotic voice** | TTS sounds choppy / unnatural | ElevenLabs `auto_mode: true` + use Flash v2.5 NOT v3 |
| **4-second gap before voice replies** | LLM finishes, then TTS starts | Stream LLM tokens INTO TTS as they arrive. Don't await. |
| **STT cuts off mid-sentence** | Transcript truncates | Deepgram endpointing parameter: 500ms, not default |
| **AI image looks fake** | Reads as obvious AI | Add lens/shutter/ISO/lighting to prompt. Remove "stunning"/"masterpiece"/"8K". |
| **Post card looks generic** | Doesn't feel like brand | Stop using diffusion for cards. Use Satori with brand.json. |
| **Voice agent self-interrupts** | TTS triggers more STT, infinite loop | Closed-mic + push-to-talk only on stage |

---

## 10 · The Single Sentence

> **Quality is no longer a property of the prompt. Or the model. Or the framework. It's a property of the LOOP.**

If Jarvis ships 6/10 today, the fix is **add the loop**: drafter → critic → reviser → cross-model judge → de-AI → ship-or-kill at 8.5. Everything else in this document is in service of that one mechanic.

Build `brand.json` first. Build Satori cards second (3 hours, 70% of the visible quality lift). Build the text quality loop third. Build voice fourth. Compile with DSPy fifth. The world-class output emerges from the loop.

---

## Appendix — Files referenced

| File | What's in it |
|---|---|
| `research/14-output-quality-masterplan.md` | Full text-quality research — 32 repos, judge rubric, eval-driven generation |
| `research/15-voice-integration-masterplan.md` | Voice stack research, KIE.AI clarification, Cartesia vs ElevenLabs |
| `research/16-image-pipeline-masterplan.md` | Satori vs diffusion, Soul 2.0, brand-lock pipeline |
| `research/17-multiagent-quality-masterplan.md` | Harness era, DSPy GEPA, MCP, Langfuse |
| This file | Synthesis of all four — locked decisions + Cursor instructions |
