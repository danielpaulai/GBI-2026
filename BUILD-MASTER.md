# GBI 2026 — Build Master Document

**The canonical source of truth.** Open this on Day 1 morning. Follow it through Day 7. It contains everything you need to build the demo from a fresh laptop, with no other docs required.

If anything in this document conflicts with research docs `01–12`, **this wins**. Research docs are reference material; this is the build manual.

> **⚠ See [research/12-the-100x-additions.md](research/12-the-100x-additions.md) and [research/13-1000x-repos.md](research/13-1000x-repos.md)** for upgrades that supersede parts of the original stack:
> - **No avatar** — JARVIS is voice + UI. Audio-reactive R3F orb shader, ElevenLabs Flash voice clone of Danny (English only).
> - **Model routing** — Haiku 4.5 (router) / Sonnet 4.5 with interleaved thinking (wings) / Opus 4.7 with task budgets (CEO synthesis).
> - **WebGPU + TSL** particle migration with MaximeHeckel's compute sketches.
> - **Promptfoo eval gate** mandatory ≥8.5 LLM-judge score before any sub-tool ships.
> - **3 repos that 1000× the build:** `pmndrs/uikit` (volumetric HUD inside R3F), `paper-design/shaders` (Vision Pro ambient backdrops), `audioMotion-analyzer` (waveform around the orb).
> - **3 MCP servers** for real-world tool use the audience recognizes: official `modelcontextprotocol/servers` (Gmail/Slack/GDrive), `GLips/Figma-Context-MCP`, `microsoft/playwright-mcp`.
> - **3 cohort giveaways** revealed at close: `vercel/ai-chatbot`, `anthropics/claude-agent-sdk-typescript`, `cline/cline`.
> - **KILL persona stacking** (PRISM paper) → use Expert Framework prompts.
> - The 7-day plan in doc 13 supersedes the one in this doc's Section 10.

---

## Table of contents

0. [Quick start (commands to run on Day 1 morning)](#0-quick-start)
1. [Project overview](#1-project-overview)
2. [Architecture (CEO + 4 wings, 3 acts)](#2-architecture)
3. [Required accounts & API keys](#3-required-accounts--api-keys)
4. [Required hardware](#4-required-hardware)
5. [The full tech stack with versions](#5-the-full-tech-stack-with-versions)
6. [Complete file structure](#6-complete-file-structure)
7. [Asset acquisition checklist](#7-asset-acquisition-checklist)
8. [Skills package (transferable to Cursor or Claude Code)](#8-skills-package)
9. [Code patterns (copy-paste-ready)](#9-code-patterns)
10. [The 7-day build plan](#10-the-7-day-build-plan)
11. [Movie-reference design system](#11-movie-reference-design-system)
12. [The Hollywood checklist (per beat)](#12-the-hollywood-checklist)
13. [Kill switches & failure recovery](#13-kill-switches--failure-recovery)
14. [Pre-show checklist](#14-pre-show-checklist)
15. [Extraction manifest (build elsewhere)](#15-extraction-manifest)
16. [Cost summary](#16-cost-summary)

---

## 0. Quick start

```bash
# Day 1, 9am. Fresh MacBook. Run these in order.

# Step 1: Create the project
npx create-next-app@latest gbi-2026 --ts --tailwind --app --no-eslint --no-src-dir
cd gbi-2026
mkdir -p public/{backdrops,fallback,safe,audio,grain,lottie,luts,voice}
mkdir -p src/{components/{stage,orb,wings,tools/{cmo,cro,coo,cfo},chrome,act3},lib/{triggers,ai,prompts},styles}

# Step 2: Install all dependencies in one shot
npm i xstate@5 @xstate/react @statelyai/inspect motion gsap \
      @theatre/core @theatre/studio lottie-react \
      @arwes/react @arwes/animator @arwes/animated @arwes/bleeps \
      three @react-three/fiber @react-three/drei @react-three/postprocessing \
      @tsparticles/react @tsparticles/preset-links \
      ai @ai-sdk/anthropic @ai-sdk/openai flowtoken \
      howler @types/howler tone \
      @picovoice/rhino-react @picovoice/porcupine-react \
      @anthropic-ai/sdk @fal-ai/serverless-client apify-client \
      @hyperbrowser/sdk stagehand-ai \
      regl glsl-lut

# Step 3: Configure static export
echo "module.exports = { output: 'export', images: { unoptimized: true } }" > next.config.js

# Step 4: Set environment variables
cat > .env.local <<EOF
ANTHROPIC_API_KEY=sk-ant-...
FAL_KEY=...
APIFY_TOKEN=...
HYPERBROWSER_KEY=...
NEXT_PUBLIC_PICOVOICE_ACCESS_KEY=...
EOF

# Step 5: Pre-show launch script
cat > scripts/run-stage.sh <<'EOF'
#!/bin/bash
npm run build
npx serve out/ -l 3000 &
sleep 2
open -a "Google Chrome" --args --kiosk --app=http://localhost:3000
EOF
chmod +x scripts/run-stage.sh
```

By 9:30am Day 1 you should have a blank Next.js app launching in Chrome kiosk fullscreen. The next 6.5 days fill it with the demo.

---

## 1. Project overview

**Name:** GBI 2026
**Event:** GBI Singapore 2026, May 14–17
**Slot:** Day 1 demos at min 17 + min 45, Day 2 showstopper at min 33
**Format:** Stage demo, projected on a 50-foot screen for ~1000 attendees, single-laptop driven by presenter (no operator)
**Goal:** Sell $1,497 AI Employee Cohort. The demo is the Trojan horse.

**The system:**
- Jarvis-style command center, projected from presenter's MacBook via HDMI
- CEO orb at center, 4 specialist wings around it (CMO/CRO/COO/CFO)
- Each wing contains 3-4 sub-tools (14 total)
- Audience volunteers come up at 3 moments and operate the system via voice ("open marketing") or physical buttons (Logitech R400 / Streamdeck Mini)
- Every sub-tool produces real, watchable AI output: real LinkedIn posts, real lead scrapes, real Seedance videos, real cash forecasts
- Visual aesthetic: Hollywood-grade, not SaaS-app — references Iron Man, Tron Legacy, Blade Runner 2049, Mission Impossible, Apple keynote

**The 3-act dramatic arc:**
- **Act 1** (Day 1, ~min 17) — CMO wing showcase, 1 volunteer
- **Act 2** (Day 1, ~min 45) — CRO wing showcase, 2 volunteers
- **Act 3** (Day 2, ~min 33) — All 4 wings together, 3 volunteers, CEO synthesizes (the close-earner)

---

## 2. Architecture

### The visual hierarchy (3 levels)

```
LEVEL 0 — IDLE                LEVEL 1 — WING OPEN           LEVEL 2 — SUB-TOOL FULLSCREEN
                                                              
        ◉  CEO ORB           ◉                              ┌────────────────────────┐
       /│\                    \                             │                        │
      / │ \                    \──[ MARKETING ]             │  FULLSCREEN TOOL UI    │
     M  S  O F                       │ │ │ │                │  (e.g. Hyperbrowser    │
   4 wings                           📸💼📰🎬                │   iframe, article      │
   orbiting                       sub-tools                 │   canvas, IG card,     │
                                   tile out                 │   Seedance video)      │
                                                            │                        │
                                                            └────────────────────────┘
```

Transitions are Framer Motion `layoutId` morphs. Same `layoutId` on the wing-glyph at level 0 and the wing-panel root at level 1. Same trick for sub-tool icon at level 1 → fullscreen at level 2. **One easing curve everywhere:** `[0.16, 1, 0.3, 1]` (expo-out), 600ms duration.

### The 4 wings + sub-tools

| Wing | Color | Sub-tools | Backed by |
|---|---|---|---|
| 🎯 **CMO** (Marketing) | Cyan | Instagram · LinkedIn · Article+Images · Video Generator | Anthropic + fal.ai Flux + Seedance |
| 💰 **CRO** (Sales/Revenue) | Amber | Lead Scraper · Cold Email · Call Script · Follow-up Sequence | Anthropic + Hyperbrowser + Apify |
| ⚙️ **COO** (Operations) | Cyan-violet | Weekly Focus · Daily 3-Priority · Process Auditor | Anthropic + Stripe MCP + activity feeds |
| 💳 **CFO** (Finance) | Amber-gold | Cash Forecast · Pricing Optimizer · P&L Snapshot | Anthropic + Stripe MCP |

**14 sub-tools total.** CFO wing stays HIDDEN through Acts 1 & 2, illuminates for the first time in Act 3 ("wait, there's a 4th wing?" — dramatic gold).

### The single-laptop architecture (no operator)

```
            ┌───────────────────────────┐
            │   50-FOOT STAGE SCREEN    │
            └─────────────┬─────────────┘
                          │ HDMI (wired only)
                          │ Anker 555 USB-C → HDMI
                          │ 1920×1080 @ 60Hz forced
                          ▼
            ┌───────────────────────────┐
            │   PRESENTER'S MACBOOK     │
            │                           │
            │   Chrome --kiosk --app=   │
            │     http://localhost:3000 │
            │                           │
            │   Static Next.js build    │
            │   served via npx serve    │
            │                           │
            │   XState v5 machine:      │
            │     idle → wingOpen →     │
            │     toolRunning           │
            │                           │
            │   Triggers (all → same    │
            │   XState events):         │
            │   - Picovoice Rhino       │
            │   - Logitech R400 ($30)   │
            │   - Streamdeck Mini ($80) │
            │   - Keyboard (M/S/O/F)    │
            └─────────────┬─────────────┘
                          │ API calls when tool runs
                          ▼
        ┌─────────────────────────────────────┐
        │  Anthropic + fal.ai + Apify +       │
        │  Hyperbrowser + Stripe MCP          │
        └─────────────────────────────────────┘

Backup laptop (mirrored, identical build) on ATEM Mini Pro switcher.
USB stick with Chrome + static HTML as apocalypse fallback.
```

**No backstage operator. No PartyKit. No phone-as-controller. No multiple devices.**

---

## 3. Required accounts & API keys

Sign up for these in this order. Total cost: $100 in credits + ~$200/month subscriptions.

| Service | URL | Why | Setup time |
|---|---|---|---|
| **Anthropic API** | console.anthropic.com | Claude Sonnet 4.5 for every text-streaming tool | 5 min |
| **fal.ai** | fal.ai | Seedance 2.0 fast (video), Flux Pro (images), Nano Banana 2 | 5 min |
| **Apify** | apify.com | Reddit/X/web/LinkedIn scrapers (already in your stack) | 5 min |
| **Hyperbrowser** | hyperbrowser.ai | Stagehand-driven browser sessions for Lead Scraper | 10 min |
| **Picovoice** | console.picovoice.ai | Rhino (voice intent) + Porcupine (wake word) — **activate AccessKey on stage MacBook ≥7 days before show** | 30 min |
| **Musicbed** | musicbed.com | Hollywood-grade ambient audio bed (cinematic underscore) | $40-100/mo |
| **Stripe** (your existing) | dashboard.stripe.com | CFO wing financial data via Stripe MCP | already done |
| **Vercel** | vercel.com | (Optional) CI deploy from GitHub for live URL | 5 min |
| **GitHub** | github.com | Private repo for the codebase + Vercel sync | 0 min |

### The .env.local file

```bash
# Backend
ANTHROPIC_API_KEY=sk-ant-...
FAL_KEY=...
APIFY_TOKEN=...
HYPERBROWSER_KEY=...

# Frontend (NEXT_PUBLIC_ — exposed to client)
NEXT_PUBLIC_PICOVOICE_ACCESS_KEY=...

# Optional
STRIPE_SECRET_KEY=sk_test_...     # only if doing live CFO Stripe pulls
```

---

## 4. Required hardware

Order this kit by Day 1 — most items have 2-3 day shipping.

### Essential ($505 total)
| Item | Why | Cost |
|---|---|---|
| **Anker 555 USB-C → HDMI 4K@60 adapter** + 25-foot active HDMI cable + spare of each | Wired projection only, never AirPlay. Cheap dongles drop to 30Hz silently. | $90 |
| **Logitech R400 presenter remote** | Volunteer-friendly clicker. Plain USB HID, no driver, no pairing. | $30 |
| **Elgato Streamdeck Mini** | 3 labeled buttons (MARKETING / SALES / OPS / FINANCE) for Act 3 | $80 |
| **Blackmagic ATEM Mini Pro** | HDMI switcher → primary/backup laptop hot-swap. Same kit Apple keynote ops use. | $295 |
| **Lavalier mic** (backup; venue usually provides) | For Picovoice wake word reliability | $30 |

### Essential ($0 because you have it)
- **Backup MacBook** — runs identical build on Chrome kiosk
- **USB stick** ≥32GB — apocalypse fallback (Chrome + static HTML build)

### Nice to have
- **Fiber-optic HDMI cable 50ft** ($60) — if venue cable run is over 25ft and drops to 30Hz
- **HDMI repeater/booster** ($40) — backup option for long runs

---

## 5. The full tech stack with versions

### Layer 1: Stage shell (kiosk wrapper)
- **Chrome `--kiosk --app=http://localhost:3000`** — primary launcher
- **`npx serve`** for serving the static Next.js build
- **Tauri v2** — stretch goal for v2; not needed for May 14

### Layer 2: Frontend
- `next` 15.x (App Router, RSC)
- `react` 19.x
- `typescript` 5.x
- `tailwindcss` 4.x

### Layer 3: State machine
- `xstate` 5.x
- `@xstate/react` 5.x
- `@statelyai/inspect` (live state inspector for venue rehearsal)

### Layer 4: Motion (the cinematic morphs)
- `motion` (formerly Framer Motion) — `layoutId` morphs are THE primitive
- `gsap` — boot sequence timeline
- `@theatre/core` + `@theatre/studio` — visual timeline editor for boot
- `lottie-react` — animated icons

### Layer 5: Visual chrome (FUI aesthetic)
- `@arwes/react` — `<FrameSVGOctagon>`, `<Animator>`, `<BleepsProvider>`
- `@arwes/animator` `@arwes/animated` `@arwes/bleeps`
- Magic UI components copied directly (Animated Beam, Glowing Effect, Spotlight)
- `shadcn/ui` (added via `npx shadcn@latest add`)

### Layer 6: 3D + particles
- `three` `@react-three/fiber` `@react-three/drei` `@react-three/postprocessing`
- `@tsparticles/react` `@tsparticles/preset-links`

### Layer 7: Streaming text
- `ai` (Vercel AI SDK 5)
- `@ai-sdk/anthropic` `@ai-sdk/openai`
- `flowtoken` — token-level blur-in animation

### Layer 8: Audio
- `howler` `@types/howler` — SFX sprite
- `tone` — state-responsive ambient drone layer

### Layer 9: Voice
- `@picovoice/rhino-react` — speech-to-intent
- `@picovoice/porcupine-react` — wake word

### Layer 10: AI backends
- `@anthropic-ai/sdk` — Claude Sonnet 4.5 with prompt caching
- `@fal-ai/serverless-client` — Seedance + Flux + Imagen
- `apify-client` — Reddit/X/web/LinkedIn actors

### Layer 11: Browser-driving (CRO Lead Scraper)
- `@hyperbrowser/sdk` — `liveUrl` iframe sessions
- `stagehand-ai` — natural-language → Playwright actions
- `playwright` 1.59+ — `screencast.showOverlay()` for action annotations

### Layer 12: Color grading
- `regl` — WebGL wrapper
- `glsl-lut` — `mattdesl/glsl-lut` for LUT shader

---

## 6. Complete file structure

```
gbi-2026/
├── .claude/
│   └── skills/                          # Symlink or copy from /skills/ in this repo
│       ├── jarvis-loop-prompt.md
│       ├── gbi-stage-architect.md
│       ├── wing-component-builder.md
│       ├── cinematic-polish.md
│       ├── voice-grammar-builder.md
│       ├── failure-recovery-builder.md
│       └── sub-tool-implementer.md
├── public/
│   ├── backdrops/                        # 6 Seedance loop clips
│   │   ├── idle.mp4
│   │   ├── boot.mp4
│   │   ├── wing-wake.mp4
│   │   ├── meeting.mp4
│   │   ├── synthesis.mp4
│   │   └── war-room.mp4
│   ├── fallback/                         # 14 pre-rendered "perfect run" MP4s
│   │   ├── cmo-instagram.mp4   cmo-linkedin.mp4   cmo-article.mp4   cmo-video.mp4
│   │   ├── cro-leads.mp4       cro-email.mp4      cro-script.mp4    cro-sequence.mp4
│   │   ├── coo-weekly.mp4      coo-daily.mp4      coo-audit.mp4
│   │   ├── cfo-cashflow.mp4    cfo-pricing.mp4    cfo-pnl.mp4
│   │   └── master-backup.mp4              # Cmd+B catastrophic-failure clip
│   ├── safe/                              # 14 last-frame PNGs (instant fallback)
│   │   └── *.png
│   ├── audio/
│   │   ├── bed-anticipation.mp3           # Musicbed: idle bed
│   │   ├── bed-build.mp3                  # Musicbed: Act 3 opener
│   │   ├── bed-resolution.mp3             # Musicbed: synthesis close
│   │   ├── stinger-wing-transition.mp3    # Udio: 1.5s orchestral swell
│   │   ├── ui-sprite.mp3                  # Howler sprite (8 SFX)
│   │   └── ui-sprite.json                 # Sprite map
│   ├── grain/
│   │   └── 35mm-overlay.webm              # HolyGrain film grain
│   ├── luts/
│   │   └── blade-runner-2049.png          # IWLTBAP LUT (HALD format)
│   ├── lottie/                             # 14 sub-tool icon animations
│   │   └── *.lottie
│   └── voice/
│       ├── gbi-2026.rhn                   # Picovoice Rhino grammar
│       └── hey-gbi.ppn                    # Picovoice wake word
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Arwes provider, audio, color grading
│   │   ├── page.tsx                       # Stage shell
│   │   └── api/
│   │       ├── cmo/{instagram,linkedin,article,video}/route.ts
│   │       ├── cro/{leads,email,script,sequence}/route.ts
│   │       ├── coo/{weekly,daily,audit}/route.ts
│   │       └── cfo/{cashflow,pricing,pnl}/route.ts
│   ├── components/
│   │   ├── stage/
│   │   │   ├── StageRoot.tsx              # XState consumer, level switcher
│   │   │   ├── BootSequence.tsx           # GSAP timeline, 4-second open
│   │   │   └── KillSwitches.tsx           # 7 kill switches
│   │   ├── orb/
│   │   │   ├── CeoOrb.tsx                 # R3F sphere + bloom
│   │   │   ├── WingNode.tsx               # 4 wing nodes around orb
│   │   │   └── ParticleField.tsx          # tsParticles backdrop
│   │   ├── wings/
│   │   │   ├── CmoWing.tsx CroWing.tsx CooWing.tsx CfoWing.tsx
│   │   │   └── WingPanel.tsx              # Generic Arwes octagon chrome
│   │   ├── tools/
│   │   │   ├── cmo/{InstagramCreator,LinkedInPost,ArticleCanvas,VideoGenerator}.tsx
│   │   │   ├── cro/{LeadScraper,ColdEmail,CallScript,FollowupSequence}.tsx
│   │   │   ├── coo/{WeeklyFocus,DailyPriority,ProcessAuditor}.tsx
│   │   │   └── cfo/{CashForecast,PricingOptimizer,PnLSnapshot}.tsx
│   │   ├── chrome/
│   │   │   ├── ColorGradedVideo.tsx       # WebGL LUT shader
│   │   │   ├── CinematicOverlays.tsx      # Grain + vignette
│   │   │   ├── AmbientText.tsx            # Iron Man micro-numbers
│   │   │   └── DecryptedText.tsx          # Mission Impossible text reveal
│   │   └── act3/
│   │       ├── WarRoom.tsx                # 3-column parallel layout
│   │       └── Synthesis.tsx              # CEO synthesizes weekly plan
│   ├── lib/
│   │   ├── machine.ts                     # XState 3-depth machine
│   │   ├── audio.ts                       # Howler instance + sprite map
│   │   ├── triggers/{voice,r400,streamdeck,keyboard}.ts
│   │   ├── ai/{anthropic,fal,apify,hyperbrowser,stripe}.ts
│   │   └── prompts/                       # System prompts per wing
│   │       └── {cmo,cro,coo,cfo}-{tool}.ts
│   └── styles/
│       ├── tokens.css                     # CSS variables (cyan/amber/void)
│       └── film-grain.css
├── scripts/
│   ├── presenter-mode.sh                  # Pre-show: DND, caffeinate, brightness
│   ├── run-stage.sh                       # Build + serve + Chrome kiosk
│   ├── pre-render-fallbacks.sh            # Records 14 fallback MP4s
│   └── apocalypse-usb.sh                  # Builds USB stick fallback
├── package.json
├── next.config.js                         # output: 'export'
├── tailwind.config.ts
├── .env.local                             # Secrets (not committed)
└── README.md
```

---

## 7. Asset acquisition checklist

Day 1 morning. ~3 hours of asset gathering.

### Audio (Musicbed + Udio + Howler sprite)
- [ ] Subscribe to Musicbed ($40-100/mo)
- [ ] Pull track 1: Tony Anderson "anticipation" piece (idle bed)
- [ ] Pull track 2: Christoffer Moe Ditlevsen / Gavin Luke "build" piece (Act 3 opener)
- [ ] Pull track 3: Hill / Tony Anderson "resolution" piece (synthesis close)
- [ ] Generate 1 Udio stinger (1.5s wing-transition swell) — prompt: *"orchestral stinger, 1.5 seconds, brass swell into resolved chord, Hans Zimmer Inception, no vocals"*
- [ ] Build Howler sprite via [audiosprite CLI](https://github.com/tonistiigi/audiosprite) — 8 sounds: press, confirm, hover, whoosh, comms, boot, error, hum. Pull from [Zapsplat](https://www.zapsplat.com/sound-effect-category/science-fiction/) — packs: "Sci-Fi Console Beeps", "Sci-Fi UI Tones".

### Color grading (LUT + grain)
- [ ] Download Blade Runner 2049 LUT pack from [luts.iwltbap.com](https://luts.iwltbap.com)
- [ ] Convert .cube → .png (HALD format) for WebGL — use [LUT Converter](https://github.com/mattdesl/lut-converter)
- [ ] Save as `/public/luts/blade-runner-2049.png`
- [ ] Download HolyGrain free 35mm pack: [holygrain.com](https://www.holygrain.com/free-film-grain-download/)
- [ ] Transcode to WebM: `ffmpeg -i 35mm.mov -c:v libvpx-vp9 -b:v 2M /public/grain/35mm-overlay.webm`

### Backdrops (6 Seedance clips, ~$25)
- [ ] Use the `jarvis-loop-prompt` skill (in `/skills/`) to generate 6 prompts
- [ ] Generate via fal.ai Seedance 2.0 fast tier: idle, boot, wing-wake, meeting, synthesis, war-room
- [ ] Save to `/public/backdrops/`

### Fallbacks (14 pre-rendered MP4s, Day 1 — DON'T SKIP)
- [ ] Run each tool in `live` mode in green-room rehearsal
- [ ] Screen-record at 1080p with QuickTime
- [ ] Trim to perfect run, no presenter audio
- [ ] Save to `/public/fallback/[wing]-[tool].mp4`
- [ ] Extract last frame as PNG to `/public/safe/[wing]-[tool]-still.png`

### Lottie icons (14 sub-tool icons)
- [ ] Sign up at [LottieFiles](https://lottiefiles.com) and [IconScout](https://iconscout.com)
- [ ] Pull from "Cyberpunk and Sci-Fi 3" pack and "Futuristic HUD Display" pack
- [ ] Save as `/public/lottie/{wing}-{tool}.lottie`

### Voice (Picovoice Console)
- [ ] Sign up at [console.picovoice.ai](https://console.picovoice.ai)
- [ ] Activate AccessKey on stage MacBook **≥7 days before show**
- [ ] Define Rhino grammar with 21 phrases (see `voice-grammar-builder` skill)
- [ ] Train custom Porcupine wake word "Hey GBI"
- [ ] Save `.rhn` and `.ppn` files to `/public/voice/`

### Fonts
- [ ] SF Pro Display: licensed via Apple's [SF Fonts](https://developer.apple.com/fonts/) — for body and headlines
- [ ] Space Grotesk: free via Google Fonts — for ambient micro-text and tabular numbers (Mission Impossible countdown)
- [ ] JetBrains Mono: free — for code/terminal-style elements

---

## 8. Skills package

The `/skills/` folder in this repo contains 7 transferable skill files. Each one is self-contained markdown with frontmatter. Drop them into:

- **Claude Code:** `~/.claude/skills/` (global) or `<project>/.claude/skills/` (project)
- **Cursor:** `<project>/.cursor/rules/` (rename `.md` → `.mdc`)

### The 7 skills

| Skill | When to use | What it produces |
|---|---|---|
| **`jarvis-loop-prompt`** | Generating any Seedance backdrop or wing animation clip | Optimized 5-step prompt under 1000 chars |
| **`gbi-stage-architect`** | Day 1-2 — wiring XState + Framer Motion layoutId + trigger union | The state machine, layoutId pattern, and trigger union code |
| **`wing-component-builder`** | Day 3-4 — building each of the 4 wings | Complete wing component with sub-tools, chrome, transitions |
| **`cinematic-polish`** | Day 2 (highest-ROI) and Day 6 (final pass) — applying LUT + grain + vignette + audio | Visual polish stack that turns "web demo" into "cinema" |
| **`voice-grammar-builder`** | Day 2 — defining Picovoice Rhino grammar (21 phrases) | The .rhn file specification and React integration |
| **`failure-recovery-builder`** | Day 6 — implementing live/fake/safe modes + 7 kill switches + USB apocalypse fallback | Full recovery layer that survives any single (or double) failure |
| **`sub-tool-implementer`** | Day 3-4 — implementing each of the 14 sub-tools in live mode | Anthropic streaming + fal.ai + Apify + Hyperbrowser integration patterns |

### How to use a skill in Claude Code

```
> use the gbi-stage-architect skill to set up the XState machine and trigger union
```

Claude Code reads the skill, follows its template, produces the output. Each skill has explicit acceptance criteria.

### How to use a skill in Cursor

Cursor reads `.cursor/rules/*.mdc` automatically when relevant. To force-invoke:
```
@gbi-stage-architect set up the XState machine
```

---

## 9. Code patterns

(All inline patterns are in the 7 skill files. Read those when building. The skills contain copy-paste-ready code for: XState machine, Anthropic streaming, fal.ai integration, Hyperbrowser sessions, Apify parallel actors, Picovoice Rhino, color-graded video, audio sprite, kill switches, fallback modes.)

---

## 10. The 7-day build plan

| Day | Build (use these skills) | Polish |
|---|---|---|
| **1 (Sat)** | Asset gathering + project scaffold + 4-second GSAP boot sequence (`gbi-stage-architect`) | Pull Musicbed tracks + Udio stinger + Howler sprite |
| **2 (Sun)** | Trigger union: voice + R400 + Streamdeck + keyboard (`voice-grammar-builder`, `gbi-stage-architect`) | **Apply LUT + grain + vignette to all backdrops (`cinematic-polish` — highest-ROI move)** |
| **3 (Mon)** | CMO wing: 4 sub-tools (`wing-component-builder`, `sub-tool-implementer`) | Clone harsh-raj00/my-jarvis HUD chrome, plant encom-globe |
| **4 (Tue)** | CRO + COO + CFO wings: 10 more sub-tools | GSAP parallax, dolly zoom, CSS-blur DoF on wing transitions |
| **5 (Wed)** | **Act 3 showstopper** — parallel firing + CEO synthesis + CFO surprise reveal | 45s Mission Impossible countdown (decrypt + radial timer + waveform) |
| **6 (Thu)** | Failure recovery (`failure-recovery-builder`) — all 14 fallback MP4s + 7 kill switches + USB stick | Movie-reference audit + 50ft typography pass + audio mix audit |
| **7 (Fri)** | Venue rehearsal — backup MacBook on ATEM Mini Pro + USB apocalypse stick + run demo 5× | Inject deliberate failures (kill WiFi mid-demo) and verify recovery |

---

## 11. Movie-reference design system

Every UI element traces to a film. **If it has no reference, it doesn't ship.**

| Element | Film | Implementation |
|---|---|---|
| CEO orb | Iron Man Mark VII core | R3F sphere + bloom + `MeshDistortMaterial` |
| Wing nodes | Iron Man peripheral HUD | Arwes octagons, dim until selected |
| Wing → tool drilldown | Minority Report | Framer Motion `layoutId` morph, 600ms expo-out |
| Sub-tool fullscreen | Blade Runner 2049 | 80% frame on hero, single focal point |
| Inter-wing collab (Act 3) | Tron Legacy | Magic UI `<AnimatedBeam>` × 3 layered |
| Boot sequence | Iron Man Mark XLII assembly | GSAP timeline + Hans Zimmer swell |
| Loading state | Mission Impossible countdown | Decrypt text + radial timer + audio waveform |
| Output materialization | The Matrix code reveal | flowtoken `blurIn` per token |
| Act 3 layout | NASA Mission Control | 3-column war room |
| Idle state | Severance | Restraint, ambient cyan, slow drift |
| Color | Tron + Blade Runner 2049 | Cyan + amber, **graded via WebGL LUT** |
| Sound | Mission Impossible + Inception | Hans Zimmer ambient bed at -22dB |
| Typography | Apple keynote (Jobs era) | SF Pro Display, body 64pt, headlines 96-128pt |

---

## 12. The Hollywood checklist

Run through this before EVERY beat ships. If any answer is no, fix.

1. Is there a film reference for every visible element?
2. Is the ambient bed playing under everything?
3. Is there a single focal point per moment, or am I splitting attention?
4. Does typography read from the back row of the venue (body 64pt+)?
5. Are colors graded (cyan/amber/void only)?
6. Does the SFX lead the visual by 60ms?
7. Does the entrance animation use expo-out, not linear?
8. Is ≥40% of the screen empty (negative space rule)?
9. Would Perception Studio ship this for Iron Man Mark VII?

---

## 13. Kill switches & failure recovery

### The 7 kill switches (memorize, tape to lectern)

| Key | Action |
|---|---|
| `Esc` | Back one level (sub-tool → wing → idle) |
| `Cmd+H` | Force home (idle, regardless of state) |
| `Cmd+F` | Force fake mode (subsequent tools play fallback MP4) |
| `Cmd+B` | Master backup MP4 (catastrophic failure) |
| `Cmd+R` | Reset XState to idle, restart demo |
| `Cmd+T` | Toggle "type instead of speak" (bypass voice) |
| `Cmd+M` | Mute Howler audio (if venue PA gets confused) |

### Recovery lines (per `LIVE_DEMOS.md`)

| Failure | Line |
|---|---|
| WiFi / API timeout | *"That's the moment every founder knows. Welcome to my Tuesday. Watch this — [Cmd+B]. This is the same prompt run 30 minutes ago in the green room. Same outcome."* |
| Volunteer freezes | *"Right here. This button. One press."* (Press it with them.) |
| AI generates weird output | *"That's the second thing we teach in the cohort — managing what AI says before it says it. Day 6, this never happens."* |
| Whole stack down | *"We're going old-school. Everyone close your laptops. I'm going to teach you the framework — the framework matters more than the tool."* |

### The 4 fallback layers
1. **Live** — real APIs (default mode)
2. **Fake** — pre-rendered MP4s play instantly (`Cmd+F`)
3. **Safe** — last-frame PNGs displayed, no animation
4. **Apocalypse** — USB stick with Chrome + static HTML, runs 100% offline

---

## 14. Pre-show checklist

### 90 minutes before
- [ ] Run `presenter-mode.sh` (DND, `caffeinate`, screen brightness max, force native projector resolution)
- [ ] Plug in HDMI via Anker 555 adapter
- [ ] Force display resolution to projector native (System Settings → Displays → Mirror → manual selection)
- [ ] Test all 14 sub-tools in live mode end-to-end in green room
- [ ] Hyperbrowser session pre-warmed (call `keepAlive: true` 5 min before)
- [ ] fal.ai credits checked, Apify actors authenticated
- [ ] Picovoice Rhino tested with venue ambient noise (~70dB)
- [ ] Backup MacBook built and ATEM Mini Pro switching tested
- [ ] R400 paired, Streamdeck Mini connected
- [ ] Lavalier mic on, levels checked
- [ ] All 14 fallback MP4s in `/public/fallback/`, `Cmd+B` queue tested

### 30 minutes before
- [ ] Chrome kiosk launched fullscreen via `run-stage.sh`
- [ ] Seedance idle.mp4 looping with LUT + grain + vignette applied
- [ ] CEO orb pulsing in idle state
- [ ] Ambient bed playing at -22dB (audible but not dominant)
- [ ] Stately Inspect open in second tab (hidden, just for emergencies)
- [ ] Recovery card printed, taped to lectern

### On stage
- [ ] Take a breath. The demo is muscle memory by now. Trust it.

---

## 15. Extraction manifest

If you need to rebuild this elsewhere (different laptop, different repo, fresh start, hand off to a developer), copy these files **only**:

### Tier 1: Essential (won't build without these)
```
GBI-Singapore-2026/
├── BUILD-MASTER.md                   # This document — the canonical build manual
├── skills/                           # 7 transferable Claude/Cursor skills
│   ├── jarvis-loop-prompt.md
│   ├── gbi-stage-architect.md
│   ├── wing-component-builder.md
│   ├── cinematic-polish.md
│   ├── voice-grammar-builder.md
│   ├── failure-recovery-builder.md
│   └── sub-tool-implementer.md
└── LIVE_DEMOS.md                     # Stage choreography for all 3 demos + recovery lines
```

### Tier 2: Strategy & context (highly recommended)
```
├── STRATEGY.md                       # The 7 sales beats spine
├── CLOSE_SCRIPT.md                   # The closing lines that earn $1,497
├── DAY1_RUN.md  DAY2_RUN.md          # Minute-by-minute run sheets
├── BONUSES.md                        # The stack architecture
├── CREW_BRIEF.md                     # Backstage / volunteer choreography
└── README.md
```

### Tier 3: Research depth (reference only — for deep-dives)
```
└── research/
    ├── 01-frameworks.md              # Show-design first principles
    ├── 02-show-mechanics.md          # 28 reusable show beats
    ├── 03-jarvis-build-stack.md      # Agent backend (LangGraph, Claude SDK)
    ├── 04-jarvis-visual-stack.md     # The 14 FUI rules
    ├── 06-seadance-approach.md       # Why Seedance backdrops over hand-coded
    ├── 09-master-plan.md             # Single-laptop architecture decisions
    ├── 10-build-hollywood.md         # Build manual deep version
    └── 11-hollywood-polish.md        # Audio, LUT, motion graphics specifics
```

### Tier 4: Cohort assets (for reference in CFO/COO wings)
```
└── (your existing skills:)
    ├── ai-ceo-suite/                 # ai-cmo, ai-cro, ai-coo, ai-cfo, ai-ceo-brain
    ├── purely-personal/              # leadership-engine, cash-engine, operations-engine
    └── anthropic-skills/             # caption-writer, closing-playbook, content-creator
```

### To extract programmatically
```bash
# From a fresh build environment, run:
cp BUILD-MASTER.md skills/*.md LIVE_DEMOS.md STRATEGY.md ~/your-build-dir/

# Then in your-build-dir, follow Section 0 (Quick start) to scaffold.
```

The 7 skills + this master document = sufficient to build. Other tiers are optional context.

---

## 16. Cost summary

### One-time
| Item | Cost |
|---|---|
| Logitech R400 | $30 |
| Streamdeck Mini | $80 |
| Blackmagic ATEM Mini Pro | $295 |
| Anker 555 + 25ft HDMI cable + spares | $90 |
| Lavalier mic backup | $30 |
| **Total one-time** | **$525** |

### Per-show (recurring)
| Item | Cost |
|---|---|
| 6 Seedance backdrop clips (Day 1) | $25 |
| 14 pre-rendered fallback MP4s (Day 1) | $55 |
| Live demo AI calls (Anthropic + fal + Apify + Hyperbrowser) | $30 |
| **Total per show** | **$110** |

### Monthly (subscriptions)
| Item | Cost |
|---|---|
| Musicbed (Personal & Commercial tier) | ~$80/mo |
| Anthropic API (with caching) | ~$20-50/mo |
| Hyperbrowser | ~$50/mo |
| Apify | ~$50/mo |
| **Total monthly** | **~$200-230/mo** |

### Total to ship the May 14 demo
**$525 hardware + $110 first-show consumables + 1 month subscriptions ($200) = ~$835**

For a $150K+ close at $1,497 × 100 attendees, this is a rounding error.

---

## Reading order for someone joining the project

1. **README.md** (overview)
2. **STRATEGY.md** (why)
3. **LIVE_DEMOS.md** (what happens on stage)
4. **BUILD-MASTER.md** ← you are here (how to build it)
5. **`/skills/*.md`** (specific implementation tasks)
6. **`research/09-master-plan.md`** (architectural decisions in depth)
7. **`research/10-build-hollywood.md` + `11-hollywood-polish.md`** (build deep-dive)

Other research docs (01-08) are reference material — read only when implementing a specific layer.

---

**Last updated:** Day 0 — pre-build. This document is the canonical build manual. Update it as decisions change.
