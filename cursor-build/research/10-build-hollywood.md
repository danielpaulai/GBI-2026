# 10 — The Build: GBI 2026 Hollywood Edition

This is the build manual. Open it Day 1 morning, follow the file structure, install the dependencies, run the commands. By Day 7 it's a Hollywood production. Where this conflicts with prior docs, this wins for the build itself; docs 03 (agent backend logic), 04 (FUI rules), and 09 (architecture canon) still hold for the architectural decisions.

---

## The expanded wing set (4 wings + CEO at center)

The original 3 wings (Marketing/Sales/Operations) become 4. **CFO/Finance is the addition** — every founder in the cohort cares about cash, and you already have the AI CFO skill in your stack. CHRO/People considered but skipped — most cohort attendees are solo or 2-person teams; HR wing won't resonate.

The 4 wings map 1:1 to your existing `ai-ceo-suite` skills:

```
                          ◉  CEO BRAIN ORB (center)
                              ai-ceo-brain skill
                              The synthesizer
                                 │
                          ┌──────┼──────┐
                          │      │      │
                    ┌─────┘      │      └─────┐
                    │            │            │
                    ▼            ▼            ▼
                  CMO         CRO          COO          CFO
              (Marketing)  (Revenue)    (Operations)  (Finance)
              ai-cmo       ai-cro       ai-coo        ai-cfo
                │            │            │             │
              📸💼📰🎬     🎯✉️📞🔄     📊📈🔍       💰📉🧾💳
              4 sub-tools  4 sub-tools  3 sub-tools   3 sub-tools
```

**14 sub-tools total** distributed across 4 wings. CEO at center as the synthesizer in Act 3.

| Wing | Sub-tools | Backed by |
|---|---|---|
| 🎯 **CMO** (Marketing) | 📸 Instagram · 💼 LinkedIn · 📰 Article+Images · 🎬 Video Generator | `ai-cmo` skill + Anthropic + fal.ai |
| 💰 **CRO** (Sales/Revenue) | 🎯 Lead Scraper · ✉️ Cold Email · 📞 Call Script · 🔄 Follow-up Sequence | `ai-cro` skill + Hyperbrowser + Apify |
| ⚙️ **COO** (Operations) | 📊 Weekly Focus · 📈 Daily 3-Priority · 🔍 Process Auditor | `ai-coo` skill + activity feeds |
| 💳 **CFO** (Finance) | 💰 Cash Forecast · 📉 Pricing Optimizer · 🧾 P&L Snapshot | `ai-cfo` skill + Stripe MCP |

The CFO wing is the **Day 2 surprise reveal**. Don't expose it during Acts 1 or 2 — it stays dim. When Act 3 opens, the CFO wing illuminates for the first time, audience sees a wing they didn't know existed, and all 4 fire in parallel. That moment of "wait, there's a 4th one?" is dramatic gold.

---

## The movie-reference design system (every visual element mapped to a film)

This is what separates Hollywood from SaaS. Every element traces back to a film. When in doubt, ask: *"Would Perception Studio ship this for Iron Man Mark VII?"*

| UI element | Film reference | Specific implementation |
|---|---|---|
| **CEO orb (center)** | Iron Man Mark VII core | R3F sphere + `MeshDistortMaterial` emissive cyan, postprocessing `<Bloom luminanceThreshold={0.8}>`, slow rotation, ambient micro-numbers ringing the edge |
| **Wing nodes** | Iron Man HUD peripheral data | Octagonal Arwes `<FrameSVGOctagon>` chrome, floating at 4 cardinal positions, dim until selected |
| **Wing → sub-tool drilldown** | Minority Report panel slide | Framer Motion `layoutId` morph, 600ms expo-out, accompanied by "comms-ping" Howler bleep |
| **Sub-tool fullscreen state** | Blade Runner 2049 single-hero composition | 80% of frame is the active output. Background fades to deep void with subtle Seedance backdrop. ONE focal element. |
| **Inter-wing collaboration lines** (Act 3) | Tron Legacy data tendrils | Magic UI `<AnimatedBeam>` × 3 layered at different opacities (chunky-glow), pulsing along path |
| **Boot sequence** | Iron Man Mark XLII assembly | GSAP timeline staggers wing entrances at 250ms, accompanied by Howler "boot" sprite + Hans Zimmer-style ambient swell |
| **Sub-tool loading state** | Mission Impossible countdown | Red-glow timer with flicker, `tabular-nums` font, sub-second pulse on the colon. NO generic spinner. |
| **Output materialization** | The Matrix code reveal | flowtoken `blurIn` per token, monospace until the last token lands, then settles into final font |
| **War room layout (Act 3)** | NASA Mission Control | 3-column grid showing all wings firing at once, each column a different agent's perspective, CEO orb pulsing in synthesis |
| **Idle ambient state** | Severance's Macrodata Refinement room | Restraint, single ambient cyan, slow data drift, no extraneous motion |
| **Backdrop video** | Higgsfield/Seedance Tron-like environments | `mix-blend-mode: screen`, opacity 0.12–0.18, behind everything |
| **Typography** | Apple keynote (Jobs era) | SF Pro Display only. Black background, off-white text (#E8EDF7). Body 64pt, headlines 96–128pt. |
| **Color palette** | Tron Legacy + Blade Runner 2049 | Cyan #00d4ff (primary "alive"), Amber #ffa500 (active processing), deep void #050810 (bg). Two neons MAX. |
| **Sound design** | Mission Impossible + Inception | Hans Zimmer-style ambient bed at -22dB always playing. Mission Impossible swell on demo opens. UI bleeps at -8 to -10dB. Mics on lavalier, never house. |

**The non-negotiable rule:** if a UI element doesn't have a film reference, it doesn't ship.

---

## The complete tech stack (organized by layer, with exact versions)

### Layer 1: Stage shell (the kiosk wrapper)
```
chrome --kiosk --app=http://localhost:3000     # primary launcher
npx serve out/                                  # serves static Next.js build
```
- **Why Chrome kiosk and not Tauri:** zero-install, zero Rust toolchain, ships in 7 days. Tauri is the production-grade path for v2.
- **Static export only:** `output: 'export'` in `next.config.js`. NEVER run `next dev` on stage.

### Layer 2: Frontend framework
```bash
npx create-next-app@latest gbi-2026 --ts --tailwind --app
```
- **Next.js 15** (App Router, RSC for the streaming patterns)
- **React 19**
- **TypeScript** (catches Day-6 bugs that would kill Day-7)
- **Tailwind v4** + custom CSS variables for the cyan/amber tokens

### Layer 3: State machine
```bash
npm i xstate@5 @xstate/react @statelyai/inspect
```
- **XState v5** — actor-first, 3-depth state machine: `idle → wingOpen → toolRunning`
- **@statelyai/inspect** — open in second browser tab during venue rehearsal

### Layer 4: Motion (the cinematic morphs)
```bash
npm i motion gsap @theatre/core @theatre/studio
npm i lottie-react @lottiefiles/dotlottie-react
```
- **Motion** (formerly Framer Motion) — `layoutId` morphs are THE primitive for orb→wing→sub-tool
- **GSAP** — timeline orchestration for the boot sequence (4 seconds of cinema)
- **Theatre.js** — visual timeline editor for the boot. Sketch the choreography like After Effects.
- **Lottie** — animated icons for each sub-tool. Pack: search "sci-fi HUD" on LottieFiles.

### Layer 5: Visual chrome (the FUI aesthetic)
```bash
npm i @arwes/react @arwes/animator @arwes/animated @arwes/bleeps @arwes/text
npm i @magicui/animated-beam @magicui/glowing-effect @magicui/spotlight
npx shadcn@latest add button card dialog
```
- **Arwes** — `<FrameSVGOctagon>` for wing chrome, `<Animator>` system, `<BleepsProvider>`
- **Magic UI** — animated beams (Act 3 inter-wing lines), glowing effect (hover), spotlight (CEO orb entry)
- **shadcn/ui** — minimal button/dialog primitives

### Layer 6: 3D + particles (the depth)
```bash
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing
npm i @tsparticles/react @tsparticles/preset-links
```
- **R3F + drei** — CEO orb sphere with `<MeshDistortMaterial>`
- **@react-three/postprocessing** — `<Bloom luminanceThreshold={0.8}>` for the real glow (NOT CSS box-shadow)
- **tsParticles** — ambient particle backdrop (links preset, opacity 0.3)

### Layer 7: Streaming text (the materialization)
```bash
npm i ai @ai-sdk/anthropic @ai-sdk/openai
npm i flowtoken
```
- **Vercel AI SDK 5** — `streamText`, `streamUI`, `<GeneratedImage>` RSC patterns
- **flowtoken** — `<SmoothText animation="blurIn" animationDuration="600ms">` per token
- **AI Elements** (Vercel) — copy-paste streaming components

### Layer 8: Audio (the cinema soundtrack)
```bash
npm i howler @types/howler
npm i tone   # if procedural ambient bed
```
- **Howler.js** — sound sprite of 8 SFX (per doc 04 §F)
- **One licensed cinematic underscore** track playing at -22dB throughout the demo (source from Artlist or MusicBed — see doc 11 once research returns)
- **Tone.js** — optional, for state-responsive ambient swells

### Layer 9: Voice triggers
```bash
npm i @picovoice/rhino-react @picovoice/porcupine-react
```
- **Picovoice Porcupine** — wake word "Hey GBI" (gates Rhino against ambient speech)
- **Picovoice Rhino** — speech-to-intent grammar, ~20 phrases, on-device, <100ms

### Layer 10: AI backends
```bash
npm i @anthropic-ai/sdk
npm i fal      # @fal-ai/serverless-client
```
- **Anthropic SDK** — Claude Sonnet 4.5, prompt caching on every wing's system prompt
- **fal.ai** — Seedance 2.0 fast tier (video), Flux Pro (Marketing/Article images), Imagen
- **Apify** — already in your MCP, actors authenticated
- **Hyperbrowser + Stagehand** — Lead Scraper and Cold Email Writer
- **Stripe MCP** (already in your stack) — CFO wing data feed

### Layer 11: Browser-driving (CRO wing — Lead Scraper)
```bash
npm i playwright @playwright/test stagehand-ai
```
- **Playwright v1.59+** with `screencast.showOverlay()` — click rings, action labels
- **Stagehand** — natural-language → Playwright actions
- **Hyperbrowser** — `liveUrl` iframe for the audience to watch

### Layer 12: Hardware drivers
- **Logitech R400** — plain USB HID, no driver needed
- **Elgato Streamdeck Mini** — Stream Deck software (configure 3 buttons → keystrokes M / S / O / F for the 4 wings)
- **`tauri-plugin-global-shortcut`** — only if Tauri (skip for Chrome kiosk; native `keydown` listener works)

---

## The exact file structure (Day 1 mkdir commands)

```
gbi-2026/
├── .claude/
│   └── skills/
│       ├── jarvis-loop-prompt/         # Seedance prompt skill
│       └── settings.local.json
├── public/
│   ├── backdrops/
│   │   ├── idle.mp4                    # Seedance: cyan particle drift
│   │   ├── boot.mp4                    # Seedance: orb materialize
│   │   ├── wing-wake.mp4               # Seedance: panels appear
│   │   ├── meeting.mp4                 # Seedance: data streams between nodes
│   │   ├── synthesis.mp4               # Seedance: text materializes
│   │   └── war-room.mp4                # Seedance: Act 3 multi-stream
│   ├── fallback/                        # 14 pre-rendered sub-tool MP4s
│   │   ├── cmo-instagram.mp4
│   │   ├── cmo-linkedin.mp4
│   │   ├── cmo-article.mp4
│   │   ├── cmo-video.mp4
│   │   ├── cro-leads.mp4
│   │   ├── cro-email.mp4
│   │   ├── cro-script.mp4
│   │   ├── cro-sequence.mp4
│   │   ├── coo-weekly.mp4
│   │   ├── coo-daily.mp4
│   │   ├── coo-audit.mp4
│   │   ├── cfo-cashflow.mp4
│   │   ├── cfo-pricing.mp4
│   │   └── cfo-pnl.mp4
│   ├── audio/
│   │   ├── ambient-bed.mp3              # Hans Zimmer-style underscore
│   │   ├── ui-sprite.mp3                # Howler sprite (8 SFX)
│   │   └── ui-sprite.json               # Sprite map
│   └── lottie/
│       ├── instagram-icon.lottie
│       ├── linkedin-icon.lottie
│       └── ...                          # 14 sub-tool icons
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Arwes providers, audio provider, full-bleed bg
│   │   ├── page.tsx                     # The stage shell (level 0/1/2 driven by XState)
│   │   ├── api/
│   │   │   ├── cmo/                     # Marketing wing endpoints
│   │   │   │   ├── instagram/route.ts
│   │   │   │   ├── linkedin/route.ts
│   │   │   │   ├── article/route.ts
│   │   │   │   └── video/route.ts
│   │   │   ├── cro/                     # Sales wing
│   │   │   ├── coo/                     # Operations wing
│   │   │   └── cfo/                     # Finance wing
│   │   └── control/                     # (optional) backup phone-control route
│   ├── components/
│   │   ├── stage/
│   │   │   ├── StageRoot.tsx            # XState consumer, level switcher
│   │   │   ├── BootSequence.tsx         # GSAP timeline, plays once on app start
│   │   │   └── KillSwitches.tsx         # Cmd+H / Cmd+F / Cmd+B / Esc handlers
│   │   ├── orb/
│   │   │   ├── CeoOrb.tsx               # R3F sphere + bloom + ambient micro-text
│   │   │   ├── WingNode.tsx             # 4 instances around CEO
│   │   │   └── ParticleField.tsx        # tsParticles backdrop
│   │   ├── wings/
│   │   │   ├── WingPanel.tsx            # Generic wing chrome (Arwes octagon)
│   │   │   ├── CmoWing.tsx
│   │   │   ├── CroWing.tsx
│   │   │   ├── CooWing.tsx
│   │   │   └── CfoWing.tsx
│   │   ├── tools/                       # 14 sub-tool components
│   │   │   ├── cmo/
│   │   │   │   ├── InstagramCreator.tsx
│   │   │   │   ├── LinkedInPost.tsx
│   │   │   │   ├── ArticleCanvas.tsx
│   │   │   │   └── VideoGenerator.tsx
│   │   │   ├── cro/...
│   │   │   ├── coo/...
│   │   │   └── cfo/...
│   │   ├── chrome/
│   │   │   ├── AmbientText.tsx          # Iron Man micro-numbers
│   │   │   ├── CountdownTimer.tsx       # Mission Impossible style
│   │   │   ├── BackdropVideo.tsx        # Seedance video manager (state-triggered)
│   │   │   └── ColorGrading.tsx         # WebGL LUT shader on backdrops
│   │   └── act3/
│   │       ├── WarRoom.tsx              # 3-column parallel firing layout
│   │       └── Synthesis.tsx            # CEO synthesizes weekly plan
│   ├── lib/
│   │   ├── machine.ts                   # XState 3-depth machine
│   │   ├── triggers/
│   │   │   ├── voice.ts                 # Picovoice Rhino integration
│   │   │   ├── r400.ts                  # Logitech R400 keymap
│   │   │   ├── streamdeck.ts            # Streamdeck Mini keymap
│   │   │   └── keyboard.ts              # Always-available fallback
│   │   ├── audio.ts                     # Howler instance + sprite map
│   │   ├── ai/
│   │   │   ├── anthropic.ts             # Claude calls with prompt caching
│   │   │   ├── fal.ts                   # Seedance + Flux + Imagen
│   │   │   ├── apify.ts                 # Reddit/X/web/LinkedIn actors
│   │   │   └── hyperbrowser.ts          # Stagehand sessions
│   │   └── modes.ts                     # live | fake | safe — every tool branches on this
│   ├── styles/
│   │   ├── tokens.css                   # Cyan/amber/void variables
│   │   └── film-grain.css               # Vignette + grain overlay
│   └── types/
├── scripts/
│   ├── presenter-mode.sh                # Pre-show: DND, caffeinate, brightness, resolution
│   ├── run-stage.sh                     # Build + serve + launch Chrome kiosk
│   └── pre-render-fallbacks.sh          # Generates 14 fallback MP4s via fal.ai
├── package.json
├── next.config.js                       # output: 'export'
├── tailwind.config.ts                   # Tokens + JetBrains Mono fallback
└── README.md
```

---

## API integrations (with the exact patterns)

### Anthropic (every text-streaming tool)
Cache the wing's system prompt — saves 60% latency on repeat calls during one show.

```ts
// lib/ai/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function streamCmoInstagram(prompt: string) {
  return client.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: [{ 
      type: "text", 
      text: CMO_SYSTEM_PROMPT,                    // load your ai-cmo skill prompt
      cache_control: { type: "ephemeral" }        // <-- THE 60% latency win
    }],
    messages: [{ role: "user", content: prompt }],
  });
}
```

### fal.ai (Seedance video + Flux images)
Pre-warm by sending a no-op call on app boot. First real call is hot.

```ts
// lib/ai/fal.ts
import * as fal from "@fal-ai/serverless-client";

fal.config({ credentials: process.env.FAL_KEY });

export async function generateVideo(imageUrl: string, prompt: string) {
  const result = await fal.subscribe("fal-ai/seedance-2.0/fast", {
    input: { 
      image_url: imageUrl, 
      prompt, 
      duration: 5, 
      resolution: "720p", 
      generate_audio: false,
      seamless_loop: true,                          // first frame = last frame
    },
  });
  return result.data.video.url;
}
```

### Hyperbrowser + Stagehand (CRO Lead Scraper)
This is the audience's "watch the AI work" moment.

```ts
// lib/ai/hyperbrowser.ts
import { Hyperbrowser } from "@hyperbrowser/sdk";
import { Stagehand } from "stagehand-ai";

const hb = new Hyperbrowser({ apiKey: process.env.HYPERBROWSER_KEY });

export async function startLeadScraperSession() {
  const session = await hb.sessions.create({ 
    stealth: true,                                  // bypass LinkedIn detection
    keepAlive: true,                                // pre-warm 5min before show
  });
  
  const stagehand = new Stagehand({ 
    env: "BROWSERBASE",
    sessionId: session.id 
  });
  
  return { session, stagehand, liveUrl: session.liveUrl };
}

// In the React component:
<iframe src={liveUrl} className="fixed inset-0 w-screen h-screen" />
```

### Apify (CMO Audience Research, CRO Lead Scraper data)
Already in your MCP. Run actors in parallel for the "war room" feel.

```ts
// lib/ai/apify.ts
import { ApifyClient } from "apify-client";

const apify = new ApifyClient({ token: process.env.APIFY_TOKEN });

export async function audienceResearch(topic: string) {
  // Fire 3 actors in parallel — Reddit, X, web
  const [reddit, x, web] = await Promise.all([
    apify.actor("trudax/reddit-scraper-lite").call({ searchTerms: [topic] }),
    apify.actor("apidojo/tweet-scraper").call({ searchTerms: [topic] }),
    apify.actor("apify/rag-web-browser").call({ query: topic }),
  ]);
  
  return { reddit, x, web };
}
```

### Picovoice Rhino (voice intents)
20-phrase grammar. Define in `voice.rhn` file generated by Picovoice console.

```ts
// lib/triggers/voice.ts
import { useRhino } from "@picovoice/rhino-react";
import { send } from "../machine";

// Grammar phrases:
// "open marketing" / "open sales" / "open operations" / "open finance"
// "run instagram" / "run linkedin" / "run article" / "run video"
// "run leads" / "run email" / "run script" / "run sequence"
// "run weekly" / "run daily" / "run audit"
// "run cashflow" / "run pricing" / "run pnl"
// "back" / "home" / "go"

const intentMap = {
  openMarketing: "OPEN_CMO",
  openSales: "OPEN_CRO",
  openOperations: "OPEN_COO",
  openFinance: "OPEN_CFO",
  runInstagram: "RUN_TOOL_IG",
  // ...
  back: "BACK",
  home: "HOME",
  go: "RUN_TOOL",
};

useRhino({
  contextPath: "/voice/gbi-2026.rhn",
  onInference: (inference) => {
    if (inference.isUnderstood) {
      send({ type: intentMap[inference.intent] });
    }
  },
});
```

---

## The audio direction (the soundtrack)

Hollywood productions live on their score. This demo is no different.

### The 3-layer audio architecture

```
LAYER 1: Ambient bed (always playing, -22dB)
        │ Hans Zimmer-style underscore. Loops seamlessly. Single track for entire 8 minutes.
        │ Source: Artlist or MusicBed (see doc 11 when research returns)
        │ One file, looped via Howler with `loop: true, volume: 0.12`
        │
LAYER 2: Act-specific swells (-15dB at peaks)
        │ Mission Impossible theme on demo opens (10 seconds).
        │ Reflection bed (Hans Zimmer "Time" style) on Act 3 close.
        │ Crossfade between bed and swell on enter/exit.
        │
LAYER 3: SFX sprite (-8 to -10dB, point events)
        │ Howler sprite, 8 sounds (per doc 04 §F):
        │   press, confirm, hover, whoosh, comms-ping, boot, error, hum-bed
        │ Trigger 60ms BEFORE the visual (audio leads visual rule)
```

### The mix rules
- **Ambient bed under everyone's voice.** -22dB sits beneath the presenter's lavalier without competing.
- **SFX leads visual by 60ms** — bleep fires before the visual change. Makes presses feel decisive.
- **No SFX during volunteer speech** — Howler `pause()` on demand, ambient bed continues.
- **Test on actual venue PA** — laptop speaker mixing lies. Bring your own monitor headphones for green-room rehearsal.

---

## The boot sequence (Theatre.js + GSAP timeline — 4 seconds of cinema)

Day 1 builds the boot. It's the audience's first impression — get this right and you've earned 8 minutes of attention.

```ts
// components/stage/BootSequence.tsx
import gsap from "gsap";
import { useEffect } from "react";

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const tl = gsap.timeline({ onComplete });
    
    // 0.0s — black screen, ambient bed fades IN at -22dB
    audio.fadeIn("ambient-bed", 1500);
    
    // 0.5s — Seedance boot.mp4 starts (particles converge)
    tl.to(".backdrop-video", { opacity: 0.6, duration: 0.5 }, 0.5);
    
    // 1.5s — CEO orb fades up (R3F bloom intensity 0 → 2)
    tl.to(".ceo-orb", { 
      opacity: 1, 
      scale: 1, 
      ease: "expo.out",
      duration: 1.0 
    }, 1.5);
    
    // 2.5s — wing nodes stagger in clockwise (250ms apart)
    tl.to(".wing-node", { 
      opacity: 1, 
      y: 0, 
      stagger: 0.25, 
      ease: "expo.out",
      duration: 0.8 
    }, 2.5);
    
    // 3.5s — ambient micro-text rings appear around CEO orb
    tl.to(".ambient-ring", { opacity: 0.6, duration: 0.5 }, 3.5);
    
    // 4.0s — boot complete, system enters idle state
    // (XState transition fired by onComplete)
  }, []);
  
  return /* the boot scene */;
}
```

**Audio choreography:**
- 0.0s: ambient bed fades up
- 0.5s: subtle "whoosh" SFX (-15dB)
- 1.5s: "boot" SFX (-8dB) as orb materializes
- 2.5s: 4 × "comms-ping" SFX (-12dB), one per wing, staggered 250ms
- 3.5s: confirmation "ready" tone (-10dB)

The boot ends with the system in idle state. Audience has just watched a 4-second movie open. They're in.

---

## The 7-day build plan (final, references this doc)

### Day 1 (Sat) — Generate assets + scaffold
- [ ] Sign up: fal.ai, Apify (already), Anthropic, Hyperbrowser, Picovoice. Top up $100.
- [ ] Generate 6 Seedance backdrop clips (idle, boot, wing-wake, meeting, synthesis, war-room) via fal.ai fast tier
- [ ] Pre-render 14 fallback MP4s (one per sub-tool) — DON'T skip this
- [ ] Source 1 ambient bed track (Artlist/MusicBed cinematic underscore)
- [ ] `npx create-next-app@latest gbi-2026 --ts --tailwind --app`
- [ ] Install all Layer 1-12 dependencies (commands above)
- [ ] Build XState machine in `lib/machine.ts` (3 depths)
- [ ] Build `BootSequence.tsx` with GSAP timeline (4-second cinema open)
- [ ] Verify Chrome kiosk launches: `./scripts/run-stage.sh`
- **Deliverable:** 4-second boot plays, audience would already be impressed.

### Day 2 (Sun) — Trigger union
- [ ] Picovoice Console: define `gbi-2026.rhn` grammar with 20 intents
- [ ] Wire Rhino `useRhino` hook → XState `send()`
- [ ] Wire R400 (just `keydown` listener — PgDn/PgUp/F5/Esc map to events)
- [ ] Wire Streamdeck Mini via Companion software → keystrokes M/S/O/F → events
- [ ] Test ALL 4 modalities trigger same events
- [ ] Build `KillSwitches.tsx` — Esc/Cmd+H/Cmd+F/Cmd+B/Cmd+R/Cmd+T
- **Deliverable:** Volunteer can drive demo via voice OR clicker. Kill switches work.

### Day 3 (Mon) — CMO wing (4 sub-tools)
- [ ] CMO `WingPanel` with 4 sub-tool tiles
- [ ] `InstagramCreator.tsx` — Anthropic streamText + fal.ai Flux Pro
- [ ] `LinkedInPost.tsx` — Anthropic + your `caption-writer` skill
- [ ] `ArticleCanvas.tsx` — Vercel `streamUI` + Imagen, paragraph + inline image
- [ ] `VideoGenerator.tsx` — Nano Banana → fal.ai Seedance fast tier
- [ ] Each tool has `live | fake | safe` modes
- **Deliverable:** CMO wing fully working. Voice triggers it, real output materializes.

### Day 4 (Tue) — CRO + COO + CFO wings
- [ ] CRO wing (4 tools): Lead Scraper (Hyperbrowser fullscreen iframe), Cold Email, Call Script, Sequence
- [ ] COO wing (3 tools): Weekly Focus, Daily 3-Priority, Process Auditor
- [ ] CFO wing (3 tools): Cash Forecast, Pricing Optimizer, P&L Snapshot — using Stripe MCP
- **Deliverable:** All 4 wings + 14 sub-tools functional in `live` mode.

### Day 5 (Wed) — Act 3 showstopper
- [ ] `WarRoom.tsx` — 3-column layout, fires Mktg/Sales/Ops in parallel
- [ ] CFO wing reveal animation — wing illuminates for first time as Act 3 opens
- [ ] `Synthesis.tsx` — CEO orb pulses, AnimatedBeams converge, Anthropic synthesizes weekly plan from all 4 wings
- [ ] flowtoken blur-in for synthesis output
- **Deliverable:** Act 3 works. The close-earning moment.

### Day 6 (Thu) — Hollywood polish
- [ ] Movie-reference audit — every UI element traces to a film. Cut anything that doesn't.
- [ ] 50ft typography — body 64pt, headlines 96–128pt, no sub-12px text
- [ ] Color profile — pure white → `#E8EDF7`, +30% saturation to compensate for projector
- [ ] Audio mix — ambient bed at -22dB, SFX at -8 to -10dB, lead visual by 60ms
- [ ] WebGL LUT shader on Seedance backdrops (Blade Runner cyan-orange grade)
- [ ] Film grain overlay (`film-grain.css`)
- [ ] Failure recovery — every tool's `fake` mode tested; `Cmd+B` master backup queued
- [ ] `presenter-mode.sh` written and tested
- **Deliverable:** Demo is cinema, not a website.

### Day 7 (Fri) — Venue rehearsal + apocalypse fallback
- [ ] Sync backup MacBook with identical build, ATEM Mini Pro switcher tested
- [ ] USB stick with Chrome + static HTML build (apocalypse fallback)
- [ ] Test at venue with actual projector + HDMI run
- [ ] Force native projector resolution
- [ ] Test long HDMI cable; fiber-optic backup if 30Hz drop
- [ ] Run demo 5× full at venue, 1× with deliberate failures injected (kill WiFi mid-demo)
- [ ] Print and tape recovery card to lectern
- **Deliverable:** Demo is muscle memory. Survives any failure mode.

---

## The Hollywood checklist (cut anything that fails)

Before each act, walk through:
- [ ] Is there a film reference for every visible element?
- [ ] Is the ambient bed playing under everything?
- [ ] Is there a single focal point per moment, or am I splitting attention?
- [ ] Does typography read from the back row of the venue?
- [ ] Are colors graded (cyan/amber/void only)?
- [ ] Does the SFX lead the visual by 60ms?
- [ ] Does the entrance animation use expo-out, not linear?
- [ ] Is ≥40% of the screen empty (negative space rule)?
- [ ] Would Perception Studio ship this?

If any answer is no — fix before moving to the next act.

---

## The director's notes (per-act feel)

Each act has its own emotional register. The audience should feel different things at different moments.

### Act 1 — CMO wing (Day 1 ~min 17)
**Feel:** Discovery. Wonder. "I didn't know AI could do that."
**Audio:** Mission Impossible theme on the demo open (10 seconds), then ambient bed.
**Visual:** Backdrop is `wing-wake.mp4` — particles forming. Hopeful.
**Pacing:** Slow setup (60s), confident press (10s), payoff with three full seconds of silence.

### Act 2 — CRO wing (Day 1 ~min 45)
**Feel:** Intrigue. "Wait, it's BROWSING for me?"
**Audio:** Subtle "comms-ping" SFX as lead rows ticker in. Bloomberg feel.
**Visual:** Hyperbrowser iframe goes fullscreen. Audience watches Chromium navigate. Visceral.
**Pacing:** V2 reads aloud — that's the magic moment. Don't rush it.

### Act 3 — All wings + CEO synthesis (Day 2 ~min 33)
**Feel:** Inevitability. "This is the future and I'm watching it work."
**Audio:** Reflection bed (Hans Zimmer "Time"-style swell) on the synthesis.
**Visual:** War room layout, then convergence into CEO orb. Inception-grade.
**Pacing:** 3 seconds of silence after the synthesis materializes. The room fills it with applause.

---

## Sources (this doc adds)

- Vercel AI SDK 5 + AI Elements: https://vercel.com/academy/ai-sdk/ai-elements
- Picovoice Rhino console (define grammar): https://console.picovoice.ai
- fal.ai Seedance 2.0 fast endpoint: https://fal.ai/models/fal-ai/seedance-2.0/fast
- Hyperbrowser SDK: https://docs.hyperbrowser.ai
- Stagehand: https://github.com/browserbase/stagehand
- Theatre.js Studio: https://www.theatrejs.com
- Lottie sci-fi packs: search "sci-fi HUD" on https://lottiefiles.com

Doc 11 (forthcoming once async research returns) covers Hollywood-specific gaps: cinematic audio bed sourcing, LUT files, premium motion graphic packs, Mission Impossible countdown patterns, movie-reference component libraries.
