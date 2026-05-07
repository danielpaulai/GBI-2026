# 08 — Master Plan: "Build a Business in 6 Minutes" (The Big Production)

This document supersedes doc 07 for the show format and visual layer. The agent backend stack from doc 03 still holds. The Seedance approach from doc 06 still holds. The relay structure from doc 07 still holds.

**What changes:** every beat now triggers a real AI capability that produces real, watchable output on a 50-foot screen. Not mocked. Not pre-rendered. The audience watches the AI work live, then watches the output materialize in their voice, with their topic, in their language.

This is the difference between "Marketing AI" as a concept and "watch a coffee-shop owner generate a week of LinkedIn content from her phone in 90 seconds." Same demo, 100× the conversion.

---

## The new format: "Build a Business in 6 Minutes"

A 6-tool tasting menu. The relay runs 3 of the 6 on stage (highest visual impact picks), with all 6 available so the volunteer's choice feels real, not scripted.

### The 6 inline tools

| # | Tool | What audience watches | Latency target | Real backend |
|---|---|---|---|---|
| 1 | **📸 Instagram Creator** | Prompt streams → Flux Pro image renders with progress bar → Claude caption streams → IG card materializes | ~30s | Anthropic + Flux Pro (fal.ai) |
| 2 | **💼 LinkedIn Post Creator** | Hook → Story → CTA stream in 3 phases. Voice-match score bar fills. Final post renders as native LinkedIn card. | ~20s | Anthropic + your `caption-writer` skill |
| 3 | **📰 Article + Inline Images** | Article streams paragraph by paragraph. Mid-paragraph `<GeneratedImage>` RSC fires — image fades in BETWEEN paragraphs. Article literally grows on screen. | ~90s | Anthropic streamUI + Imagen/Flux |
| 4 | **🔍 Audience Research** | 3 Apify actors fire in parallel (Reddit, X, web). Cards fly in. Word cloud forms. 5 insight cards land. | ~60s | Apify MCP + Anthropic synthesis |
| 5 | **🎯 Lead Scraper** | **Hyperbrowser browser session goes full-screen.** Audience watches Chromium navigate LinkedIn, type the search, click results. Lead rows drop in like Bloomberg ticker. | ~45s | Hyperbrowser + Playwright 1.59 + Apify Apollo |
| 6 | **🎬 Video Creator** | Nano Banana 2 generates input image (15s progress bar) → fal.ai Seedance 2.0 fast tier generates 5s clip (45s progress bar) → clip plays full-screen | ~75s | fal.ai (primary) + Kie.ai (failover) |

**Stage picks:** Day 1 = Instagram Creator (high visual). Day 2 = Lead Scraper (Bloomberg drama). Day 2 showstopper = Article + Images OR Video Creator (most cinematic).

---

## The relay choreography (with audience input)

The relay structure from doc 07 stays, but now the inputs come from the audience, not from the presenter's script.

| Beat | Volunteer | Phone shows | Big screen plays | Backend fires |
|---|---|---|---|---|
| **1. WAKE** | V1 (back) | One button: **POWER ON** | `boot.mp4` — particles converge into CEO orb. 6 tool tiles fade in around it. | Pre-warm fal.ai + Hyperbrowser sessions |
| **2. PICK A TOOL** | V2 (middle) | 6 tile buttons | Camera-style zoom on selected tile. Other 5 fade. | Tool's runtime warm-loaded |
| **3. PICK THE TOPIC** | V3 (front) | TOP 3 AUDIENCE SUGGESTIONS (live) | Selected topic appears massive on screen | Topic piped to tool |
| **4. WATCH IT WORK** | V4 (brave) | Hold-to-talk: **"RUN IT"** | The tool runs LIVE — full-screen takeover, real output streaming, real images rendering, real browser navigating | The actual capability |
| **5. SHIP IT** | V5 | **EMAIL ME / DOWNLOAD / POST** | Output flies into email envelope. "SENT" stamp. Or: post preview lands. | Real send / save action |

**The audience-input mechanic:** before the show starts, a QR code on screen routes audience phones to a simple form. They submit topic suggestions ("post about my SaaS launch", "leads for my real estate biz"). Top 3 by vote bubble up to V3's phone in Beat 3. This is what makes the demo feel **owned by the room**, not staged.

---

## The 50-foot screen rules (non-negotiable)

These are stricter than doc 04 §E because the screen is bigger. Every beat must pass these tests.

1. **Single focal point per beat.** Never split attention. If two things are happening, the dominant one is 80% of the screen, the other is 20% and dim.
2. **Typography minimums:** body 64pt, secondary 48pt, headlines 96–128pt. Test from row 30 of a hotel ballroom (~120 ft).
3. **Black background only.** White backgrounds = projector hot spots = audience squints. Even the IG mockup gets a black border and dim chrome.
4. **One idea per beat.** If you can't summarize the beat in 5 words ("CLAUDE WRITES YOUR LINKEDIN POST"), the beat is too dense.
5. **Cinematic camera zooms.** When something matters, transform-scale the whole screen IN. When something resolves, scale back OUT. Slow — 800ms, expo-out.
6. **1.5× motion rule** (doc 04 §E9): every animation feels right at 1.5× speed in dev. Audience needs reaction time.
7. **Audio leads visual by 60ms.** Bleep fires *before* the visual change. Makes presses feel decisive.
8. **No more than 2 colors at once.** Cyan + amber. Anything else is a momentary state (red error flash) only.
9. **Negative space ≥40% always.** If the screen is full, cut.
10. **Helvetica Neue or SF Pro for everything.** No Inter, no system fallback. The Apple keynote rule applies.

Violating any of these from a 50ft viewing distance = the demo looks like a webinar, not a keynote.

---

## The technical architecture

```
┌────────────────────────────────────────────────────────────────┐
│                       50-FOOT STAGE SCREEN                     │
│   ┌──────────────────────────────────────────────────────┐     │
│   │   OBS Studio composite scene                         │     │
│   │   - Layer 1: Seedance backdrop video (idle/boot/...) │     │
│   │   - Layer 2: HUD chrome (arwes frames, ambient text) │     │
│   │   - Layer 3: ACTIVE TOOL viewport (full-screen takes) │    │
│   │              ├─ Article writer canvas (tldraw)       │     │
│   │              ├─ Hyperbrowser liveUrl iframe          │     │
│   │              ├─ fal.ai progress bar + final clip     │     │
│   │              ├─ Apify card grid                      │     │
│   │              └─ Anthropic streamText pane            │     │
│   │   - Layer 4: Bleep/sound triggers (Howler sprite)    │     │
│   └──────────────────────────────────────────────────────┘     │
└─────────────────────────┬──────────────────────────────────────┘
                          │ subscribes as DISPLAY
                          ▼
              ┌────────────────────────────────┐
              │   PartyKit room: stage         │
              │   ┌──────────────────────────┐ │
              │   │  XState machine v5       │ │
              │   │  States:                 │ │
              │   │  idle → boot → pick-tool │ │
              │   │  → pick-topic → run-tool │ │
              │   │  → ship → reset          │ │
              │   └──────────────────────────┘ │
              └─────┬───────────────────┬──────┘
                    │                   │
        Volunteer phones        Audience-input form
        (V1–V5)                 (everyone in room)
        - Beat-specific         - Topic suggestions
          button surface          via QR → vote
        - Hold-to-talk          - Top 3 surfaces
          on Beat 4               to V3 in Beat 3

                   Backend (FastAPI bridge):
              ┌──────────────────────────────────┐
              │  Tool runtimes (parallel-ready)  │
              │  ├─ Instagram: Anthropic + fal   │
              │  ├─ LinkedIn:  Anthropic + skill │
              │  ├─ Article:   Anthropic + Flux  │
              │  ├─ Research:  Apify MCP × 3     │
              │  ├─ Leads:     Hyperbrowser+PW   │
              │  └─ Video:     fal Seedance 2.0  │
              └──────────────────────────────────┘
                          Backstage:
              ┌────────────────────────────────────┐
              │  AV operator laptop                │
              │  - Stately Inspect (live state)    │
              │  - Manual override: next/back/skip │
              │  - Kill switch: Esc → idle.mp4     │
              │  - Fake mode: Cmd+F → backup MP4s  │
              │  - 6 pre-rendered fallback clips   │
              │    (one per tool)                  │
              └────────────────────────────────────┘
```

---

## The complete repo + service stack (everything you'll touch)

### Visual + state spine (from prior docs, confirmed)
- `statelyai/xstate` v5 + `statelyai/inspect`
- `cloudflare/partykit` (multi-screen sync, single-deploy)
- `slidevjs/slidev` (presentation shell)
- `uixmat/onborda` (step indicator overlay)
- `arwes/arwes` + Magic UI + Vercel AI Elements (HUD chrome)
- `flowtoken` (token-level fade-in)
- Howler.js (sound sprite, 8 sounds)
- 5 Seedance clips via fal.ai (idle/boot/dept-wake/meeting/synthesis)

### NEW for the master plan
- **`microsoft/playwright` v1.59+** with `screencast.showOverlay()` — for the Lead Scraper beat. Click rings + action annotations + chapter markers.
- **Hyperbrowser `liveUrl`** — embed a Hyperbrowser session in an iframe; audience watches the AI navigate. Pre-warm 5 minutes before show.
- **`browserbase/stagehand`** — natural-language browser instructions. "Find SaaS founders in Singapore on LinkedIn." Stagehand translates → Playwright executes → audience watches.
- **`e2b-dev/surf`** — for "watch the agent work" UI patterns. Reference architecture for Lead Scraper full-screen takeover.
- **`tldraw/tldraw` + `tldraw/agent-template`** — the article-writer canvas. AI literally draws and types on an infinite canvas. This is the wow for Article + Inline Images.
- **fal.ai Seedance 2.0 fast tier** — primary video generation. 30–60s for 5s clip. Pre-warm during V3's choice.
- **Kie.ai** — failover gateway for video. Cheaper, similar latency.
- **Vercel AI SDK 5 + AI Elements** — `streamUI` + `<GeneratedImage>` RSC. The foundation for Article writer, Instagram, LinkedIn.
- **Vercel `rsc-genui` template** — copy this for the inline-image article structure.
- **Apify actors** (already in your MCP):
  - `harvestapi--linkedin-profile-search` — Lead Scraper
  - `apify--rag-web-browser` — Audience Research web crawl
  - `trudax--reddit-scraper-lite` — Audience Research Reddit
  - `apidojo--tweet-scraper` — Audience Research X
  - `lukaskrivka--google-maps-with-contact-details` — Local lead scraping
- **OBS Studio** — composite the layers. NOT for streaming, for live local compositing onto the projector feed.
- **Audience input form** — DON'T self-host Claper for 7-day timeline. Build a tiny Vercel route (`/suggest`) that PartyKit-syncs back. ~50 LOC. Top 3 by vote bubble up.
- **Anthropic SDK + prompt caching** — every text-streaming beat. Cache the system prompt for the active tool, save 60% latency.
- **`Picovoice/porcupine`** — wake word for Beat 4 voice trigger.
- **`anthropic-skills/caption-writer`, `linkedin-content-strategy`, `linkedin-triple-pack`, `script-writer`** — your existing skills become the Tools' brains. **Don't rebuild content generation; wrap your existing skills in the cinematic shell.**

### What I considered and rejected
- Self-hosting Claper (Phoenix/Elixir) — too heavy for 7 days. Build a 50-LOC Vercel form instead.
- `e2b-dev/desktop` — full Ubuntu sandbox, looks like a Linux box on stage, needs heavy theming. Use surf's UI patterns instead.
- Skyvern — workflow-oriented, not "watch it work." Use Stagehand on Hyperbrowser.
- Replicate for video — unreliable for Seedance. fal.ai is the official partner.
- Higgsfield direct API — peak-time latency 3–5 minutes is a stage killer.
- 3rd-party Instagram/LinkedIn generators — none of them speak your voice. Use Vercel AI Elements + your own skills.

---

## Tool-by-tool: what the audience SEES

### Tool 1 — Instagram Creator (Day 1 demo pick)

**Layout:**
- Top 1/3: prompt streams in massive text ("a coffee shop in Marina Bay")
- Middle, left half: square Flux Pro render with cinematic progress bar (radial, cyan → amber)
- Middle, right half: Claude streams caption with `flowtoken` blur-in
- Bottom 1/3: rendered IG card mockup (image + caption + hashtags + heart icon)
- Audio: progress beep × 3 during render, "ding" on completion

**Failure mode:** image render >25s → fade to pre-rendered fallback IG card. Audience never knows.

**The line that lands:** *"That post took longer to read than to make."*

### Tool 2 — LinkedIn Post Creator

**Layout:**
- Top: voice rules visible ("Hook: bold. Story: ONE sentence. CTA: question.")
- Middle: 3-phase reveal — Hook fades in, Story streams below, CTA materializes last
- Right rail: voice-match score bars (Hook strength 92%, Voice match 88%, Engagement potential 76%) fill in real-time
- Bottom: rendered LinkedIn post card — black bg, white text, profile pic, "X likes • Y comments"
- Audio: phase-completion bleep × 3

**The line that lands:** *"You'll spend 20 minutes on the next one. Claude spent 18 seconds on this one."*

### Tool 3 — Article + Inline Images (Day 2 showstopper option A)

**Layout:**
- Full-screen tldraw canvas, dark mode
- Article streams paragraph by paragraph, top to bottom
- Mid-paragraph 1: `<GeneratedImage>` RSC fires → image renders with progress bar → fades into article between paragraph 1 and paragraph 2
- Same for paragraph 2 → image 2
- Final: 3-paragraph article with 2 inline images, all on one canvas
- Audio: typewriter clack on every word, "ding" when image lands

**The line that lands:** *"This is what your blog used to take 3 hours and a stock-photo subscription. 90 seconds. Free images, your voice, ready to post."*

### Tool 4 — Audience Research

**Layout:**
- 3 columns, one per source: Reddit | X | Web
- Each column has Apify actor running visibly (action log streams: "fetching r/saas...", "found 47 threads", "extracting top quotes")
- As data lands: cards fly in with quotes, sentiment bars, source links
- Bottom 1/3: Claude synthesizes 5 insight cards
- Background: word cloud forms in real-time, growing words = more mentions
- Audio: "data ping" per card landing

**The line that lands:** *"Your audience just told you what they want. You didn't ask. The AI did. In 60 seconds."*

### Tool 5 — Lead Scraper (Day 2 demo pick — Bloomberg ticker drama)

**Layout:**
- Top 1/3: search query massive: "SaaS founders in Singapore"
- Middle 2/3: **Hyperbrowser liveUrl iframe goes full-screen.** Audience watches actual Chromium navigate to LinkedIn Sales Navigator, type, click. Cursor highlighted with cyan ring overlay (Playwright `screencast.showOverlay()`).
- Right rail: lead rows drop in one by one, Bloomberg-ticker style: name, title, company, "verified email ✓"
- Counter top-right: 1 → 12 → 28 → 50 leads
- Audio: "match" bleep per lead row

**The line that lands:** *"That's 50 people you can email tomorrow. The AI found them in 45 seconds. Your sales team needed three days for that."*

### Tool 6 — Video Creator (Day 2 showstopper option B — most cinematic)

**Layout:**
- Phase 1 (15s): Nano Banana 2 generates input image — radial progress bar, image materializes
- Phase 2 (45s): fal.ai Seedance 2.0 generates 5s video — different cinematic progress (timeline-style, cyan fill)
- Phase 3: clip plays full-screen, looping, cinema black bars
- Audio: render hum during progress, dramatic "drop" on clip play

**Failure mode:** if fal.ai >75s, fade to pre-rendered fallback clip. Presenter line: *"Let me show you the one we made earlier in the green room — same prompt, same outcome."*

**The line that lands:** *"Three years ago that shot cost $150,000 and took two weeks. Tonight it cost six dollars and took a minute."*

---

## The 7-day production plan (final, supersedes all prior plans)

### Day 1 (Sat) — Assets + scaffold
**Morning:**
- Sign up for fal.ai, Apify, Anthropic, Hyperbrowser, Picovoice. Top up credits ($100 total budget).
- Generate 5 Seedance clips (idle/boot/dept-wake/meeting/synthesis) via fal.ai
- Pre-render 6 backup MP4s (one per tool's "perfect run") — these are insurance
- Write `Jarvis Loop Prompt` skill in `.claude/skills/`

**Afternoon:**
- Scaffold Next.js + XState machine + Vercel AI Elements
- Install: `partysocket`, `@xstate/react`, `@statelyai/inspect`, `framer-motion`, `flowtoken`, `howler`, `@magicui/animated-beam`, `@arwes/react`
- Drop reference screenshots in repo (Iron Man HUD, Blade Runner 2049, Apple keynote)
- Prompt Claude Code: "Build the stage shell with FUI rules from `research/04-jarvis-visual-stack.md` and the 50ft rules from `research/08-master-plan.md`"

**Evening:**
- Define XState machine: `idle → boot → pick-tool → pick-topic → run-tool → ship → reset`
- Wire 5 Seedance clips to state transitions with cross-fade

**Deliverable:** Static visual shell, state machine wired, no tools yet. Press `n` to advance.

### Day 2 (Sun) — Multi-controller + audience input
- Deploy PartyKit room (single Cloudflare Worker)
- Build `/control` route — phone-as-controller with beat-specific button surfaces
- Build `/suggest` route — 50-LOC audience input form, top 3 by vote
- QR code on stage screen → both routes (auto-switches based on current beat)
- Test on real phones (iOS Safari, Android Chrome, hold-to-talk works on both)
- **Deliverable:** 2 laptops + 3 phones synced via PartyKit. State advances correctly.

### Day 3 (Mon) — 6 tool runtimes
Build all 6 tools as React components with real backends. Use Vercel AI Elements as the foundation:
- **Tool 1 Instagram:** Anthropic streamText + fal.ai Flux Pro
- **Tool 2 LinkedIn:** Anthropic streamText + your `caption-writer` skill
- **Tool 3 Article:** Vercel `streamUI` + Imagen via fal.ai
- **Tool 4 Research:** 3 Apify actors in parallel + Anthropic synthesis
- **Tool 5 Leads:** Hyperbrowser session + Stagehand natural language → Playwright
- **Tool 6 Video:** Nano Banana 2 + fal.ai Seedance 2.0 fast tier

Stub each with mock data first, then wire real APIs one at a time. Each tool gets:
- A `live` mode (real API calls)
- A `fake` mode (loads pre-rendered MP4 from Day 1 + canned text)
- A `safe` mode (instant fake — for absolute emergencies)

**Deliverable:** All 6 tools work end-to-end in dev. Each runs in <2 minutes worst case.

### Day 4 (Tue) — Cinematic shell + 50ft typography
- Apply 50ft rules from §"50-foot screen rules" to every tool's layout
- Camera-style zooms on focal points (CSS `transform: scale` + 800ms expo-out)
- Single-focal-point pass: walk every screen, dim anything that isn't the hero
- Set base font 64pt, headlines 128pt, mono only
- Test at 4K on a 65" TV from 25 feet — does it read?
- **Deliverable:** Demo looks cinematic at distance, not webinar-clean.

### Day 5 (Wed) — OBS composite + audio mix
- OBS Studio scene with 4 layers: Seedance backdrop / HUD chrome / active tool / sound triggers
- Howler.js sound sprite — 8 sounds per doc 04 §F4
- Voice trigger: Picovoice `usePorcupine` for "Hey Jarvis" or "Run it"
- Cmd+T fallback (presenter types instead of voice)
- Test on actual venue audio (use the same model PA if possible)
- **Deliverable:** Demo is a movie, not a website. Audio carries the moments.

### Day 6 (Thu) — Failure recovery + kill switches
- Pre-rendered fallback for each tool ✓ (Day 1)
- Implement `demoit` pattern: every XState action has `live` and `fake` variants
- Kill switches:
  - `Esc` → idle.mp4 + "SYSTEM IDLE"
  - `Cmd+T` → manual typing
  - `Cmd+F` → force fake mode
  - `Cmd+B` → master backup MP4 plays
  - `Cmd+R` → reset relay to V1
- Print recovery card, tape to lectern (per doc 02 §"Universal demo recovery card")
- **Deliverable:** Any single point of failure recovers gracefully.

### Day 7 (Fri) — Venue rehearsal + deploy
- Push GitHub → Vercel sync deploy
- PartyKit deploy to Cloudflare
- Hotspot backup configured
- Run full demo 5× back-to-back at venue
- Project at venue resolution, audio through PA
- Mac on Stately Inspect at backstage laptop
- Record one perfect run as the master backup MP4 (queued in OBS, ONE keystroke away — `Cmd+B`)
- **Deliverable:** Demo is muscle memory. You can run it half-asleep.

---

## What makes this 100× the original

| What changed | From | To |
|---|---|---|
| Output | Mock LinkedIn post | Real LinkedIn post in your voice |
| Visual | Flat React components | OBS-composited cinema with Seedance backdrops |
| Topic | Pre-scripted | Audience-voted live |
| AI work | Hidden behind a "thinking" spinner | Visible — browser drives, image renders, scraper runs |
| Volunteers | Pressed one button | 5 different volunteers, 5 different beats |
| Failure | Demo dies | 5 layers of fallback, audience never knows |
| Typography | Webinar-readable | Apple-keynote-readable from 100ft |
| Sound | Background music | Spatial sound design, audio leads visual |
| Number of "wow" moments | 1 | 6 (one per tool, audience picks 3) |

---

## Production checklist (the "big production" feel)

**On stage:**
- [ ] 50ft projection screen tested at venue resolution
- [ ] Stage lighting plot: house dark during demos, follow-spot on volunteer
- [ ] 3-camera setup: stage wide, volunteer close-up (volunteer-cam), big-screen feed
- [ ] Audio: house PA + lavalier on presenter + handheld on volunteer
- [ ] Backstage AV operator with Stately Inspect monitor + kill switch keyboard

**Backstage:**
- [ ] Mac on Stately Inspect, sees current XState state in real-time
- [ ] Two laptops running PartyKit (primary + redundant)
- [ ] Hotspot for internet failover (in case venue WiFi dies)
- [ ] OBS Studio configured with 4 scenes (idle, demo, fallback, blackout)
- [ ] All 6 fallback MP4s queued in OBS, one keystroke away each

**Pre-show:**
- [ ] Hyperbrowser session pre-warmed 5 minutes before
- [ ] fal.ai job pre-queued during V3's topic choice
- [ ] All Apify actors authenticated, credit topped up
- [ ] Picovoice AccessKey activated on stage laptop

**Pre-show (audience side):**
- [ ] QR code visible on stage screen 10 minutes before show
- [ ] Audience input form receiving suggestions
- [ ] Top 3 surfaces to V3's phone the moment Beat 3 starts

---

## Cost estimate (one show)

| Item | Cost |
|---|---|
| 5 Seedance backdrop clips (Day 1) | $25 |
| 6 pre-rendered fallback clips (Day 1) | $30 |
| Live demo AI calls (Anthropic + fal + Apify + Hyperbrowser) | $20 |
| **Total per show** | **$75** |

For an offer that closes ~$150K+ at $1,497 × 100 attendees, this is the cheapest line item on the budget.

---

## The single non-negotiable

**Pre-render 6 fallback MP4s on Day 1.** One per tool's "perfect run." If anything goes wrong live, you cut to the recording with the line *"Let me show you the one we made in the green room — same prompt, same outcome."*

This single move converts every tech failure on stage from a disaster into a "the future is just slightly delayed" laugh-line. June's principle from the offer feedback memory: *plan for tech failures*. This is how.

---

## Sources (new in this doc)

- Playwright v1.59 screencast: https://github.com/microsoft/playwright/releases/tag/v1.59.0
- Hyperbrowser Stagehand integration: https://www.hyperbrowser.ai/docs/integrations/stagehand
- browserbase/stagehand: https://github.com/browserbase/stagehand
- e2b-dev/surf: https://github.com/e2b-dev/surf
- tldraw agent template: https://github.com/tldraw/agent-template
- Vercel AI Elements: https://vercel.com/academy/ai-sdk/ai-elements
- Vercel rsc-genui template: https://vercel.com/templates/next.js/rsc-genui
- fal.ai Seedance 2.0: https://fal.ai/seedance-2.0
- ClaperCo/Claper (rejected for timeline, but documented): https://github.com/ClaperCo/Claper
- AJaySi/ALwrity (article writer reference): https://github.com/AJaySi/ALwrity
- Anil-matcha/Open-Generative-AI: https://github.com/Anil-matcha/Open-Generative-AI
