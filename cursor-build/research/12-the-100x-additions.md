# 12 — The 100× Additions (Final Research Pass)

This document synthesizes 3 parallel research passes into a single brutal cut: AI capabilities, premium visual stack, and agent excellence. Every recommendation is filtered against one bar — **does it 10× the audience's gut reaction at 50ft from row 30**, or is it incremental polish?

If a finding doesn't land in Tier 1 or Tier 2, it doesn't ship for May 14. Tier 3 is post-show v2.

---

## The 3 single highest-leverage moves (one per pass)

These are the headline upgrades. If you do nothing else from this doc, do these three.

### 1. ElevenLabs Flash v2.5 (cloned voice) + audio-reactive orb shader
**JARVIS is voice + UI. No face. No avatar. Pure Iron Man / Hollywood futuristic.**

- **ElevenLabs Flash v2.5** — ~75ms latency TTS, voice-cloned from Danny's English recordings. https://elevenlabs.io/agents
- **Audio-reactive orb** — Tone.js analyzer feeds the voice waveform into R3F + TSL shader uniforms. The orb's surface ripples, distorts, and pulses brighter when JARVIS speaks. Audio-reactive `MeshDistortMaterial` with `emissiveIntensity` driven by waveform amplitude.
- **Ambient micro-text rings** around the orb (Iron Man HUD's signature "alive" tell — doc 04 §E5) — coordinates, status readouts, glyphs that update every 200ms.

**End-to-end pattern:** Claude Opus 4.7 generates text → ElevenLabs Flash streams TTS in Danny's voice → R3F orb shader pulses to the waveform → all under 1s. The orb visually "speaks" without a mouth.

**Why no avatar (HeyGen, Synthesia, D-ID all dropped):**
1. **JARVIS doesn't have a face.** Iron Man's JARVIS is voice + UI — that IS the aesthetic. Adding an avatar breaks the reference.
2. **AI avatars at 50ft = uncanny valley magnified.** Micro-glitches (mouth lag, eye twitch) become billboard-sized "this is fake" moments.
3. **AI avatars are SaaS slop.** Every wantrepreneur on LinkedIn ships HeyGen demos. Pure UI + voice is rarer and reads as real engineering.
4. **Violates 50ft rules** — single focal point + ≥40% negative space. A face fights HUD for attention.
5. **Cleaner failure mode** — one fewer system to glitch on stage.

**Like Siri's animation, like KITT, like JARVIS — pure UI made alive by voice. No face required.**

**Confirmed by user: English only, no avatar, no captions, pure Hollywood Iron Man.**

### 2. WebGPU + TSL migration of the orb + particle system
**Compute-shader particles + native TSL postprocessing in R3F r170+.**

- Three.js r170+ ships `WebGPURenderer` and TSL (Three Shading Language) — node-based shaders compiling to both WGSL (WebGPU) and GLSL (WebGL fallback)
- CPU-bound particles cap at ~50K. WebGPU compute pushes to **millions**.
- At 4K projection, your current WebGL postprocessing eats fillrate (bloom, lens distort, grain are full-screen passes). WebGPU compute downsamples bloom + reconstructs at fraction of cost.
- **The audience will physically feel the difference from row 30.**
- Reference: [Field Guide to TSL and WebGPU — Maxime Heckel](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)

### 3. Promptfoo eval gate at ≥8.5/10 LLM-judge score
**The hidden moat. Without this, agents drift to "ChatGPT mediocre."**

- Build 20 hand-graded "world-class" reference outputs per wing (80 total fixtures)
- LLM-as-judge rubric scores each agent run vs. reference
- **Agents that don't clear ≥8.5 don't ship to the stage.**
- This is the difference between "yeah that's a LinkedIn post" and "I would hire this CMO right now."
- Reference: https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/

---

## Tier 1 — Must ship (the agent excellence layer)

These are non-visual, but they're what make the demo's content undeniably superior. Without them, the prettiest UI shows mediocre output.

### Model routing
- **Haiku 4.5** → routing / classification (which wing? which sub-tool?). Sub-second.
- **Sonnet 4.5** with `interleaved-thinking-2025-05-14` beta header → the 4 wings. Interleaved thinking lets the model think *between* tool calls, not just before. Same code, dramatically better outputs.
- **Opus 4.7** (released April 16, 2026) → CEO synthesis ONLY. New `task budgets` feature lets you cap the agentic loop at e.g. 8K tokens for a 10s beat — makes timing deterministic on stage.

The Opus-as-lead + Sonnet-as-subagents config beats single-Opus by **90.2%** on Anthropic's internal eval. https://www.anthropic.com/engineering/multi-agent-research-system

### KILL persona stacking
The 2026 research is unambiguous: "you are Ann Handley + Russell Brunson + Joanna Wiebe combined" measurably **damages** accuracy. The expert-prefix activates instruction-following at the cost of factual recall. https://arxiv.org/abs/2603.18507

**Replace with: Expert Framework prompts.** Don't say "you are Ann Handley." Say:
> "Apply Ann Handley's pre-publish checklist: kill every adverb, every 'really,' every 'just,' every passive sentence. Replace abstract nouns with concrete ones. Lead with the line that would make you forward the post."

39% quality lift from XML-structured framework prompts. https://github.com/langgptai/awesome-claude-prompts

### Few-shot is mandatory
3-5 hand-curated "this is what world-class output looks like" examples in the cached prefix per wing. Single biggest free quality lift. **Don't skip.** Every wing's system prompt has the framework + 3-5 reference examples cached.

### Voice-locked agent stack (3 layers)
1. **Voice corpus in cached system prompt** — 20-30 of Danny's actual posts/scripts/transcripts. Use the existing `voice-extractor` skill to produce the artifact.
2. **Banned-phrase + required-pattern lint** — run existing `de-ai-ify` and `tweet-draft-reviewer` skills as a **post-generation gate**, not optional.
3. **Style-rubric LLM judge** — second Claude call scores draft against 8 voice rules. If <7, regenerate with the failure as feedback.

This stack is the difference between "looks like ChatGPT" and "sounds like Danny."

### Personality as behavioral constraints, NOT adjectives
"Be playful" is useless. Encode personality as enforced output contracts:

| Wing | Behavioral constraint |
|---|---|
| **CMO** | Open with a hook question. Reference a current trend by name. End with a CTA. |
| **CRO** | Lead with a number. Second sentence is the ask. No hedging words. |
| **COO** | Numbered steps only. Time estimate on every step. One named owner per step. |
| **CFO** | Lead with the number. Second line = variance vs. plan. Third line = one decision required. |

### CEO as conflict-resolver, NOT summarizer
**This is Act 3. Get it right or the demo dies in the third act.**

The CEO is **NOT** "here's a summary of what they said." That's the failure mode. The CEO is:
1. Pass 1: identify the 1-2 places wings *disagree* or where one's plan blocks another's
2. Pass 2 (extended thinking ON): produce the weekly plan with explicit trade-off resolution + ONE non-obvious cross-wing insight
3. Output template: *"CMO's launch needs CRO's pipeline ready by Wed, but CFO flags cash for the ad spend lands Friday — push launch to next Monday, use the gap for CRO's outbound burst."*

The brief: **find the conflict, resolve it, surface the non-obvious play.** Use Opus 4.7 with extended thinking for this single step.

### Speed optimizations
- Prompt caching on every wing's system prompt + voice corpus + few-shot block (note: TTL dropped from 60min to 5min in early 2026 — keep stage requests <5min apart)
- Parallel tool calls inside each wing (Sonnet 4.5 fires 3-5 tools simultaneously)
- Pre-warming — fire dummy call on each wing 30s before the act so caches are hot
- Streaming with visible "thinking" UI — even if agent takes 25s, streaming + tool-call activity log makes it feel like 8s

### Stay on LangGraph supervisor
Do **NOT** migrate to CrewAI v2, Mastra, or Magentic-One. 2026 consensus: teams who start on those migrate *to* LangGraph when they need control. You already have the right framework.

---

## Tier 2 — High-impact, do if time permits

### Visual upgrades (in priority order)
| # | Add | What it gives | Build effort |
|---|---|---|---|
| 1 | **WebGPU + TSL migration** | The biggest visual jump (already in Tier 1 above) | 1.5 days |
| 2 | **Rive (partial swap from Lottie)** for stateful HUD elements (status rings, agent-state pips) | GPU-rendered, infinitely crisp at 50ft, state-machine driven | 0.5 day |
| 3 | **R3F Ultimate Lens Flare + Chromatic Aberration** | Anamorphic streaks read as "cinematic" instantly. Subtle 0.001-0.002 chromatic offset = "this is a lens, not a screen" feel. | 0.5 day |
| 4 | **Pixi.js v8 (with WebGPU)** for the Lead Scraper Bloomberg ticker, P&L scrolling | Holds 60fps with thousands of glyphs at 4K (CSS dies at 30fps) | 0.5 day |
| 5 | **Shiki Magic Move** for the live-coding sub-tool | Token-level morphs between code states. Same tokenizer as Cursor — looks identical. | 0.5 day |
| 6 | **Tremor + Fortress/Signal templates** for CFO/COO dashboards | Bloomberg Terminal aesthetic, monospace, amber accents. Override default 14px → 24-32px for stage. | 1 day |
| 7 | **React Bits — DecryptedText, Aurora, Ballpit** | DecryptedText for "AI is decrypting the lead database" reveal. Ballpit for CFO money-flow. Aurora for backgrounds. | 0.5 day |

### Live coding sub-tool (Daytona + Shiki Magic Move)
**A new sub-tool worth adding to the COO or CFO wing.** Audience watches Claude Opus 4.7 write Python in a streamed code block while a Daytona sandbox executes line-by-line behind it. Output renders in a terminal panel onstage.

- **Daytona sandboxes** — 27-90ms cold start (E2B is 150ms). https://www.daytona.io
- Total beat: 8-12s, totally watchable
- Pattern: `Claude Opus 4.7 → streamed code (Shiki Magic Move animation) → Daytona executes → terminal output streams`

### Tool curation per wing (USE existing MCP stack)
Stage problem isn't access — it's curation. Pre-bind exactly 4 tools per wing:

- **CMO** — `apify--rag-web-browser`, `scraper-engine--google-trends-scraper`, `apidojo--tweet-scraper`, `harvestapi--linkedin-profile-search`
- **CRO** — `supreme_coder--linkedin-profile-scraper`, Gmail MCP (draft only), Apollo via Apify, `cold-outreach-sequence` skill
- **COO** — Calendar MCP, Notion MCP, Granola MCP (meeting transcripts), Slack MCP
- **CFO** — Stripe MCP (already in stack), Apify for competitor pricing, Supabase MCP for custom financial DB

### Gmail/Calendar MCP draft mode
**Live action without the risk.** CRO Wing identifies a hot lead → drafts email via Gmail MCP `create_draft` (NEVER auto-send) → schedules calendar invite live. Audience sees a real action queued; Danny manually approves with one click. Respects safety rules, still looks like magic.

### Multi-language: dropped entirely
Confirmed by user: **English only.** No SyncWords, no translation sub-tool, no multi-lang anything. The audience speaks English; adding language complexity is noise without payoff.

### Anthropic Memory Tool (April 23, 2026)
**Narrative gold for Q&A.** `/memories` filesystem persistence across sessions. The demo is a single 18-min run, but you can demo a follow-on Q&A 30 min later where Claude recalls Act 2's leads or Act 3's synthesis. *"JARVIS remembers."* https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool

---

## Tier 3 — Skip for May 14 (post-show v2 candidates)

| Tool | Why skip for May 14 |
|---|---|
| **Spline scenes for the orb** | Generic Spline materials look forkable; your custom-shaded R3F orb wins on personality |
| **Synthesia, D-ID** | All AI avatars dropped — JARVIS aesthetic is voice + UI, no face (see Tier 1) |
| **Tortoise TTS, MetaHuman, Audio2Face** | Weeks of pipeline work for marginal gain over ElevenLabs |
| **Suno API, Stable Audio** for live music | 20-40s gen time too slow for live reactive scoring (Musicbed + Udio is the right call) |
| **bolt.new, v0.dev, Lovable, Figma Make** as live spectacle | 30-90s to first paint = dead onstage |
| **Anthropic computer use** as meta-feat (Claude operating its own demo) | Flaky on unfamiliar UIs, one frozen click and you're done — Stagehand is safer |
| **CrewAI v2, Mastra, Magentic-One** | Stay on LangGraph supervisor |
| **Persona stacking prompts** | Proven to *damage* accuracy (PRISM paper) |
| **Anime.js v4, React Spring, Velocity** | Motion + GSAP is the 2026 consensus |
| **Mixamo character / Ready Player Me** | The audience reads *responsiveness* as personality, not anthropomorphism — orb is right |

---

## Updated cost summary

### One-time (no change)
$525 (R400 + Streamdeck + ATEM Mini Pro + HDMI kit)

### Per-show (recurring)
| Item | Cost |
|---|---|
| 6 Seedance backdrop clips | $25 |
| 14 fallback MP4s | $55 |
| Live AI calls (Anthropic Sonnet + Opus 4.7 with task budgets) | $40 (was $30 — Opus is ~5× Sonnet pricing for synthesis only) |
| ElevenLabs Flash v2.5 (~10min TTS) | $5 |
| Daytona sandbox executions | $5 |
| **Total per show** | **$130** |

### Monthly subscriptions (additions)
| Item | Cost |
|---|---|
| Musicbed | ~$80/mo |
| Anthropic API | ~$30-50/mo (Sonnet + Opus blend) |
| Hyperbrowser | ~$50/mo |
| Apify | ~$50/mo |
| **ElevenLabs Pro** (voice cloning + Flash) | ~$22/mo |
| **Promptfoo Cloud** (or self-hosted free) | $0–50/mo |
| **Total monthly** | **~$230-300/mo** |

**Total for May 14 demo:** $525 hardware + $130 first-show + 1 month subscriptions ($280) = **~$935**.

For a $150K+ close at $1,497 × 100 attendees, this remains a rounding error.

---

## The updated 7-day plan (Tier 1 + Tier 2)

### Day 1 (Sat) — Asset gathering + scaffold + WebGPU foundation
**Morning:**
- Sign up for new services: ElevenLabs, Daytona, Promptfoo (or self-host)
- ElevenLabs: clone Danny's voice from existing recordings (need 1-3 min of clean audio)

**Afternoon:**
- Generate 6 Seedance backdrops + 14 fallback MP4s (per BUILD-MASTER.md)
- Scaffold Next.js + XState 3-depth machine
- **Initialize Three.js r170+ with WebGPURenderer** (not r150 standard build)
- 4-second GSAP boot sequence

**Evening:**
- Pull Musicbed tracks + Udio stinger + Howler sprite
- Start LUT + grain + vignette polish stack on backdrops

**Deliverable:** Boot sequence renders at 4K with WebGPU, particle system runs at 1M particles.

### Day 2 (Sun) — Trigger union + voice + audio-reactive orb + eval scaffold
- Picovoice Rhino grammar (21 phrases)
- R400 + Streamdeck Mini wiring
- **ElevenLabs Flash voice integration + audio-reactive orb shader** (Tone.js → R3F shader uniforms)
- **Promptfoo eval suite scaffolding** — define the rubric and 5 reference outputs per wing as starter
- All triggers dispatch same XState events

**Deliverable:** Press M → Marketing wing opens → CEO orb's face starts speaking in cloned Danny voice (English).

### Day 3 (Mon) — CMO wing (4 sub-tools) with voice-locked stack
- CMO wing: Instagram, LinkedIn, Article+Images, Video Generator
- **Each sub-tool's system prompt:**
  - Cached voice corpus (20-30 Danny posts)
  - Expert framework prompt (NOT persona stacking)
  - 3-5 reference few-shots
  - Behavioral constraints (CMO = hook question, current trend reference, CTA)
- **Promptfoo eval per sub-tool: ≥8.5 LLM-judge score before declaring done**

**Deliverable:** CMO wing's 4 sub-tools all clear the eval gate.

### Day 4 (Tue) — CRO + COO + CFO wings + tool curation
- 10 more sub-tools across 3 wings
- Pre-bind exactly 4 tools per wing
- Run Promptfoo eval gate on each — none ship without ≥8.5
- **Add Rive for stateful HUD elements** (agent-state pips: idle/listening/thinking/responding)
- **Add Pixi v8 for the Lead Scraper ticker**

**Deliverable:** All 14 sub-tools cleared eval gate. Visible HUD state changes feel premium.

### Day 5 (Wed) — Act 3 showstopper + CEO synthesis + live-coding sub-tool
- Wire Opus 4.7 for CEO synthesis with extended thinking + task budgets
- **Synthesis pattern:** conflict-resolver, NOT summarizer (find conflict → resolve → surface non-obvious play)
- 3-column war room layout with all 4 wings firing in parallel (CFO surprise reveal)
- **Add live-coding sub-tool: Daytona + Shiki Magic Move** (audience watches Opus 4.7 write Python live)

**Deliverable:** Act 3 produces a synthesis that makes the room go silent. The close-earner.

### Day 6 (Thu) — Polish stack + failure recovery
- **R3F Ultimate Lens Flare + Chromatic Aberration**
- **Tremor dashboards** for CFO + COO (Fortress template + amber/green palette + JetBrains Mono)
- **React Bits**: DecryptedText (reveal moments), Aurora (backgrounds), Ballpit (CFO money-flow)
- All 14 fallback MP4s + safe stills + 7 kill switches + USB stick fallback (per `failure-recovery-builder` skill)

**Deliverable:** Demo is cinematic. Recovery layer survives any failure.

### Day 7 (Fri) — Venue rehearsal + final eval gate + Memory Tool Q&A demo
- Backup MacBook on ATEM Mini Pro + USB stick fallback
- Test at venue — projector resolution, HDMI run, audio levels through PA
- **Final Promptfoo eval pass** — every sub-tool must clear ≥8.5
- Memory Tool stretch goal: wire `/memories` so a 30-min-after Q&A demo recalls Act 2 leads
- Run demo 5× with deliberate failures injected (kill WiFi mid-Act-3)

**Deliverable:** Demo is muscle memory. Survives any failure mode. Eval gate cleared.

---

## The brutal cut (if 7 days isn't enough)

If you fall behind, drop in this order:

| Drop priority | What to drop |
|---|---|
| 1st (drop first) | Memory Tool Q&A demo (Day 7 stretch) |
| 2nd | React Bits Aurora/Ballpit (use simpler backgrounds) |
| 3rd | Live-coding sub-tool (Daytona + Shiki) — keep wing build clean |
| 4th | Pixi v8 ticker (use CSS animation, accept 30fps) |
| 5th | Rive HUD elements (keep Lottie for everything) |

**NEVER drop:**
- Promptfoo eval gate
- Voice-locked agent pattern
- Opus 4.7 for CEO synthesis
- Few-shot examples per wing
- WebGPU + TSL particle migration
- ElevenLabs Flash + audio-reactive orb shader

These are the spine. Everything else is decoration.

---

## What this changes vs. the prior 11 docs

| Prior assumption | Updated |
|---|---|
| CEO orb is R3F sphere + bloom | **CEO orb is audio-reactive R3F + WebGPU + TSL shader (pulses to voice waveform — no face)** |
| Streaming text is the output | **Text + cloned voice TTS + audio-reactive orb shader (no face, no avatar)** |
| Single Anthropic Sonnet 4.5 across all agents | **Routing: Haiku 4.5 / wings: Sonnet 4.5 / synthesis: Opus 4.7 with task budgets** |
| Persona-stacked system prompts | **KILLED — replaced with expert framework prompts** |
| Eval is "rehearse the demo" | **Promptfoo LLM-judge gate at ≥8.5 before any sub-tool ships** |
| WebGL postprocessing chokes at 4K | **WebGPU + TSL compute particles + native postprocessing** |
| CEO synthesis = "summary of wing outputs" | **CEO synthesis = conflict-resolver + non-obvious-play surfacer** |

---

## Sources (this doc)

All sources from research agents 1, 2, and 3 are listed in their original output. Primary references:

- ElevenLabs Flash: https://elevenlabs.io/agents
- Claude Opus 4.7: https://www.anthropic.com/news/claude-opus-4-7
- Anthropic multi-agent: https://www.anthropic.com/engineering/multi-agent-research-system
- WebGPU + TSL guide: https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- Promptfoo LLM rubric: https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/
- Daytona sandboxes: https://www.daytona.io
- PRISM persona-stacking research: https://arxiv.org/abs/2603.18507
- Rive React: https://github.com/rive-app/rive-react
- Shiki Magic Move: https://github.com/shikijs/shiki-magic-move
- Pixi v8: https://pixijs.com/blog/pixi-v8-launches
- Tremor + Fortress template: https://thefrontkit.com/blogs/best-shadcn-dashboard-templates-2026
- Anthropic Memory Tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
