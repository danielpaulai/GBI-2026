# 09 — GBI 2026: The Corrected Master Plan

This document is canonical. Where it disagrees with docs 06/07/08, this one wins. Docs 03 (agent backend) and 04 (FUI rules) still hold as implementation references.

**The corrected mental model:**
- **GBI 2026** is the system. CEO orb at center. Three "wings" orbit it: **Marketing**, **Sales**, **Operations**.
- Each wing **contains sub-tools**. Click a wing → sub-tools tile out. Click a sub-tool → it runs fullscreen.
- **Single laptop, no operator.** Presenter's MacBook drives everything via HDMI to the 50-ft screen.
- **Each wing showcases at a different moment** in the 4-hour show, mapped to existing Demos 1/2/3 in `LIVE_DEMOS.md`.
- **Volunteers come up** but don't touch separate devices. They speak ("Marketing, go!") OR hold a Logitech R400 clicker. One physical button per wing for the showstopper (Streamdeck Mini, 3 labeled buttons).

The "6 inline tools" from doc 08 don't disappear — they redistribute INSIDE the wings as sub-tools. The Jarvis spine from docs 03–07 is what was right all along.

---

## The 3-act dramatic arc

The 4-hour show has 3 demo moments (per `LIVE_DEMOS.md`). Each one showcases ONE wing, and the third brings them all together.

### Act 1 — Marketing wing (Day 1, min 17, Block C — the first WOW)
**1 volunteer.** Presenter pulls them from the back of the room.

**Stage flow:**
1. GBI 2026 idle: CEO orb pulsing, 3 wings orbiting in a holding pattern
2. Presenter: *"Marketing — front and center."* → voice triggers Marketing wing to swell forward, Sales/Ops dim and rotate back
3. Marketing wing opens — 4 sub-tools tile around the wing core
4. Volunteer voices the sub-tool ("Instagram!") OR presses R400 button corresponding to highlighted sub-tool
5. Sub-tool zooms fullscreen via Framer Motion `layoutId` morph (600ms expo-out)
6. Real output materializes (per doc 08 §"Tool-by-tool: what the audience SEES")
7. Sub-tool collapses back into Marketing wing → wing rotates back to formation → CEO orb returns to idle
8. Presenter delivers anchor line. Volunteer back to seat.

**Sub-tools available in Marketing wing (4):**
| Icon | Tool | What runs | Backend |
|---|---|---|---|
| 📸 | **Instagram Creator** | Prompt → Flux Pro image render → caption streams → IG card materializes | Anthropic + fal.ai Flux |
| 💼 | **LinkedIn Post** | Hook → Story → CTA, 3-phase reveal, voice-match score bars fill | Anthropic + your `caption-writer` skill |
| 📰 | **Article + Images** | Article streams paragraph by paragraph, mid-paragraph images materialize between paragraphs | Vercel `streamUI` + Imagen |
| 🎬 | **Video Generator** | Nano Banana 2 → fal.ai Seedance 2.0 fast tier → 5s clip plays fullscreen | fal.ai (Kie.ai failover) |

### Act 2 — Sales wing (Day 1, min 45, Block E — the sticky moment)
**2 volunteers** (per `LIVE_DEMOS.md` Demo 2). V1 drives, V2 plays the prospect.

**Stage flow:**
1. *"Sales — your turn."* → Sales wing swells forward, Marketing/Ops dim
2. 4 sub-tools tile out
3. V1 picks Cold Email Writer (voice OR R400)
4. Audience shouts a target persona — presenter takes 3 shouts, loudest cheer wins (per existing demo choreography)
5. Hyperbrowser/Stagehand pulls the LinkedIn profile data, AI streams personalized cold email
6. V2 reads it aloud "in character, like you just got it in your inbox"
7. 3 seconds of silence — "Would you actually reply?" — V2: "I'd book a call."
8. Side-by-side reveal: AI message vs. generic templated message

**Sub-tools available in Sales wing (4):**
| Icon | Tool | What runs | Backend |
|---|---|---|---|
| 🎯 | **Lead Scraper** | Hyperbrowser session goes fullscreen — Chromium navigates LinkedIn, lead rows ticker-drop in | Hyperbrowser + Stagehand + Playwright 1.59 |
| ✉️ | **Cold Email Writer** | Pulls profile via Hyperbrowser → AI streams personalized email referencing real details | Hyperbrowser + Anthropic |
| 📞 | **Cold Call Script** | Generates objection-handling script with pause cues | Anthropic + your existing skills |
| 🔄 | **Follow-up Sequence** | 5-email drip campaign generates as a timeline | Anthropic + your Hormozi/Taki email skills |

### Act 3 — All Wings Together (Day 2, min 33, Block C — THE SHOWSTOPPER)
**3 volunteers**, **Streamdeck Mini with 3 labeled buttons** (Marketing, Sales, Operations) — per `LIVE_DEMOS.md` Demo 3.

**Stage flow:**
1. Three volunteers from three different parts of the room. Each gets a Streamdeck button assignment.
2. *"This is the OS. Today we build the operating system that runs the whole business."*
3. Mission Impossible theme up
4. *"GO. In sequence — sales, marketing, ops."*
5. V1 presses Marketing button → Marketing wing opens, runs **Audience Research** (3 Apify actors fire in parallel — Reddit, X, web — cards fly in)
6. V2 presses Sales button → Sales wing opens, runs **Lead Scraper** (Hyperbrowser fullscreen, lead rows ticker)
7. V3 presses Operations button → Operations wing opens, runs **Weekly Focus Report**
8. **All three outputs sit in a 3-column war room layout for 5 seconds**
9. CEO orb pulses → synthesis: a unified weekly plan that pulls from all three streams
10. Final output: 3-priority "What to focus on this week" report, materializes with `flowtoken` blur-in
11. *"That report would cost $400/month. It just cost 12 cents. And took 18 seconds."*

**Sub-tools available in Operations wing (3):**
| Icon | Tool | What runs | Backend |
|---|---|---|---|
| 📊 | **Weekly Focus Report** | Pulls Stripe + Gmail + activity → generates 3 priorities for the week with rationale | Anthropic + your `purely-personal:leadership-engine` skill |
| 📈 | **Daily 3-Priority** | This morning's 3 things to do, in order, with reasoning | Anthropic + activity feeds |
| 🔍 | **Process Auditor** | Scans recent activity for bottlenecks, suggests SOPs | Anthropic + your `purely-personal:operations-engine` skill |

---

## The 3-level visual hierarchy (the cinematic motion)

```
LEVEL 0 — IDLE                    LEVEL 1 — WING OPEN              LEVEL 2 — SUB-TOOL FULLSCREEN
                                                                  
        ◉  CEO orb               ◉                                ┌─────────────────────────┐
       /│\                        \                               │                         │
      / │ \                        \─────[ MARKETING ]            │   FULLSCREEN TOOL UI    │
     M  S  O                              │ │ │ │                 │   (e.g. Hyperbrowser    │
   wings                                  📸💼📰🎬                 │    iframe, article      │
   orbiting                              sub-tools                │    canvas, IG card)     │
                                          tile out                │                         │
                                                                  └─────────────────────────┘
   Seedance idle.mp4              Seedance dept-wake.mp4           Tool-specific backdrop
   backdrop                       backdrop                         + Seedance loop dimmed
```

**Transitions** are all Framer Motion `layoutId` morphs. The wing-glyph in level 0 has the same `layoutId` as the wing-panel root in level 1; Motion automatically morphs between them. Same trick for sub-tool icon in level 1 → fullscreen tool in level 2. **One easing curve everywhere**: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out), 600ms duration.

**Returning home:**
- Voice: *"Back"* or *"Home"*
- R400: back-arrow button
- Or auto-collapse 3 seconds after sub-tool output completes

---

## The technical architecture (single laptop, no operator)

```
                          ┌────────────────────────────┐
                          │      50-FOOT STAGE SCREEN  │
                          └─────────────┬──────────────┘
                                        │ HDMI (wired only, never AirPlay)
                                        │ via Anker 555 USB-C → HDMI
                                        │ 1920x1080 @ 60Hz forced
                                        ▼
                          ┌────────────────────────────┐
                          │   PRESENTER'S MACBOOK      │
                          │                            │
                          │  Chrome --kiosk --app=     │
                          │   http://localhost:3000    │
                          │                            │
                          │  Statically-built Next.js  │
                          │  served via `npx serve`    │
                          │                            │
                          │  XState v5 machine:        │
                          │    idle (level 0) →        │
                          │    wing-open (level 1) →   │
                          │    tool-running (level 2)  │
                          │                            │
                          │  Triggers (all → same      │
                          │  XState events):           │
                          │  ├─ Picovoice Rhino        │
                          │  │   (voice intent grammar)│
                          │  ├─ Logitech R400 USB      │
                          │  │   (PgUp/PgDn/F5/Esc)    │
                          │  ├─ Streamdeck Mini USB    │
                          │  │   (Day 2 showstopper)   │
                          │  └─ Keyboard fallback      │
                          │      (presenter shortcuts) │
                          └──────────────┬─────────────┘
                                         │ All API calls go out:
                                         ▼
                  ┌─────────────────────────────────────────────┐
                  │  Live AI services (only when tool runs)     │
                  │  - Anthropic API (Claude Sonnet 4.5)        │
                  │  - fal.ai (Seedance 2.0 fast + Flux Pro)    │
                  │  - Apify (Reddit/X/web/LinkedIn actors)     │
                  │  - Hyperbrowser (Stagehand sessions)        │
                  └─────────────────────────────────────────────┘

                  Backup laptop (mirrored, identical build):
                  ┌─────────────────────────────────────────────┐
                  │  Second MacBook + ATEM Mini Pro switcher    │
                  │  Hot-swap if primary dies. 200ms cut.       │
                  └─────────────────────────────────────────────┘
```

**No PartyKit. No Cloudflare Worker. No phone-as-controller. No backstage operator.** Everything runs locally on the presenter's MacBook. API calls go out to live services only when a sub-tool actively runs. If WiFi fails, the show falls back to pre-rendered MP4s for each sub-tool.

---

## The trigger union (voice + R400 + Streamdeck)

All three trigger types dispatch the **same XState events**, so they're equivalent. Voice fails? R400 still works. R400 dies? Streamdeck still works. All three die? Keyboard shortcuts still work.

| Event | Voice phrase | R400 button | Streamdeck button | Keyboard |
|---|---|---|---|---|
| `OPEN_MARKETING` | "Marketing" | (held + spoken) | Top-left labeled "MARKETING" | M |
| `OPEN_SALES` | "Sales" | — | Top-middle "SALES" | S |
| `OPEN_OPS` | "Operations" | — | Top-right "OPERATIONS" | O |
| `RUN_TOOL` | "Run it" / "Go" | Right-arrow | Any unlabeled button | Space |
| `BACK` | "Back" | Left-arrow | Bottom-left | Esc |
| `HOME` | "Home" | F5 | Bottom-right | Cmd+H |
| `KILL` | "Reset" | (combo: B+Esc) | (combo) | Cmd+R |

**Picovoice Rhino grammar (~15 phrases):** define a tight context. Rhino returns intents in <100ms, fully on-device, no internet hop. Pin the lavalier mic to the **presenter**, not the volunteer (lavaliers pick up volunteers fine; ambient mic doesn't, and audience noise is too risky).

---

## The complete repo + service stack (final)

### Stage shell (single-laptop kiosk)
- **Chrome `--kiosk --app=http://localhost:3000`** — primary kiosk wrapper (zero-install, just Chrome)
- **`npx serve`** or `vite preview` — serves the statically-built Next.js locally
- **Tauri v2** — stretch goal for production-grade single binary; not required for May 14
- **Backup:** USB stick with Chrome + static HTML build (apocalypse fallback)

### State + motion
- **XState v5** — 3-depth state machine (idle → wing-open → tool-running)
- **Stately Inspect** — runs locally on presenter's laptop in a separate browser tab; presenter glances at it during venue rehearsal, hides during show
- **Framer Motion** with `layoutId` — the morph primitive between depths. Same easing curve everywhere: `cubic-bezier(0.16, 1, 0.3, 1)`, 600ms.

### Triggers
- **Picovoice Rhino** — speech-to-intent with grammar of ~15 phrases. PRIMARY for solo wing demos (Acts 1 & 2).
- **Picovoice Porcupine** — wake word ("Hey GBI 2026") to gate Rhino, prevents false triggers.
- **Logitech R400** ($30) — USB clicker, no driver, plain HID keyboard. Volunteer holds it during Acts 1 & 2.
- **Elgato Streamdeck Mini** ($80) — 3 labeled buttons for Act 3 (Marketing/Sales/Operations).
- **`tauri-plugin-global-shortcut`** — if you go Tauri route. For Chrome kiosk, plain `keydown` listener works.

### Visual layer (mostly from doc 04, confirmed)
- **Arwes `@arwes/react`** — `<Animator>` system, `<FrameSVGOctagon>`, `<BleepsProvider>`. The Jarvis aesthetic.
- **Magic UI `<AnimatedBeam>`** — for inter-wing collaboration lines in Act 3.
- **Vercel AI SDK 5 + AI Elements** — `streamUI` + `<GeneratedImage>` RSC. Foundation for IG/LinkedIn/Article tools.
- **flowtoken** — token-level blur-in for streaming text materialization.
- **tldraw + agent-template** — Article + Images sub-tool fullscreen canvas (in Marketing wing).
- **Howler.js** — sound sprite, 8 sounds (per doc 04 §F).
- **5 Seedance backdrop clips** (idle / wing-wake / running / synthesis / boot) generated via fal.ai (~$25).

### Backend tool runtimes (per doc 08 §6)
- **Anthropic SDK** with prompt caching — every text-streaming tool
- **fal.ai Seedance 2.0 fast tier** — Video Generator sub-tool
- **fal.ai Flux Pro** — Instagram and Article images
- **Hyperbrowser `liveUrl` + Stagehand** — Lead Scraper and Cold Email Writer (Sales wing)
- **Apify actors** (already in MCP) — Audience Research and Lead Scraper data
- **Your existing skills** — `caption-writer`, `purely-personal:leadership-engine`, `purely-personal:operations-engine`, `linkedin-content-strategy`, `script-writer`, Hormozi/Taki email skills

### Hardware checklist
- **Anker 555 USB-C → HDMI adapter** + **25-foot active HDMI cable** + spare of each
- **Logitech R400** + spare batteries
- **Elgato Streamdeck Mini** + USB-A cable
- **Lavalier mic** for presenter (venue PA usually provides; bring own as backup)
- **Backup MacBook** running identical Tauri/kiosk build
- **Blackmagic ATEM Mini Pro** ($295) — HDMI switcher between primary and backup laptop. Same kit Apple keynote ops use.
- **USB stick** with Chrome + static HTML apocalypse fallback

---

## The 50-foot screen rules (hard learnings)

These supersede doc 04 §E and doc 08 §"50-foot rules":

1. **Force native projector resolution** — System Settings → Displays → Mirror → manual resolution match (almost always 1920×1080 @ 60Hz). Mac's "Best for display" guesses wrong on cheap projectors. **Pre-show checklist item.**
2. **Wired HDMI only.** Never AirPlay. Wireless display has 200–400ms input lag and randomly renegotiates frame rate when WiFi gets busy. **Hard rule.**
3. **Disable everything**: Notifications (Focus → Do Not Disturb), Bluetooth pairing prompts, software update banners, screensaver, low battery warnings. Run `caffeinate -d` in Terminal. Write a `presenter-mode.sh` script.
4. **Color profile drift** — venue projectors are under-saturated and warm. Build assuming the audience sees ~70% of your Retina saturation. **Pure white text causes ghosting on DLP projectors** — use `#E8EDF7` instead of `#FFFFFF`.
5. **No sub-12px text on Retina** — illegible at 50ft. Body 64pt, headlines 96–128pt. Helvetica Neue or SF Pro only.
6. **60fps cap** on Framer Motion. Prefer transform/opacity over filter/blur (blur tanks projector framerate).
7. **Long HDMI runs >25ft** sometimes drop to 30Hz silently. Bring an HDMI repeater or fiber-optic HDMI cable.
8. **Backup laptop on ATEM Mini Pro switcher** — primary dies, hit input 2, audience sees a 200ms cut, you keep talking.

---

## What changes from doc 08

| What | Doc 08 said | Doc 09 says (canonical) |
|---|---|---|
| Architecture | Multi-screen sync via PartyKit, phones as controllers | **Single laptop, no operator, no PartyKit** |
| Spine | 5-volunteer linear relay (one demo, 5 beats) | **3-act show: Marketing wing (1 vol), Sales wing (2 vols), All-wings (3 vols + Streamdeck)** |
| Tools | 6 tools as the demo's main mechanic | **11 sub-tools distributed inside the 3 wings** (4 Mktg, 4 Sales, 3 Ops) |
| Volunteer interaction | Phone as controller via QR | **Voice (Picovoice Rhino) + R400 clicker + Streamdeck** |
| Audience input | QR form for topic suggestions | **Verbal shouts during volunteer setup** (per existing `LIVE_DEMOS.md` choreography) |
| Visual hierarchy | Flat tool grid | **3 levels: CEO orb → wing → sub-tool, all morphed via Framer Motion `layoutId`** |
| OBS multi-scene composite | Layered backstage compositing | **All compositing happens in-app on presenter's laptop** |

What doesn't change: Seedance backdrops (doc 06), the 6 tool runtimes from doc 08 (just redistributed), the FUI rules from doc 04, the agent backend stack from doc 03, the failure-recovery patterns (kill switches, fake mode, pre-rendered fallbacks).

---

## The 7-day production plan (final, supersedes all prior)

### Day 1 (Sat) — Generate assets + scaffold the 3-level shell
**Morning:**
- Sign up: fal.ai, Apify (already done), Anthropic, Hyperbrowser, Picovoice. Top up credits ($100).
- Generate 5 Seedance clips (idle/wing-wake/running/synthesis/boot) via fal.ai fast tier
- Pre-render 11 fallback MP4s — one per sub-tool's "perfect run" (insurance)

**Afternoon:**
- `npx create-next-app@latest adisseo --ts --tailwind --app`
- Static export config: `output: 'export'` in `next.config.js`
- Install: `xstate @xstate/react motion @arwes/react flowtoken howler @picovoice/rhino-react @picovoice/porcupine-react @magicui/animated-beam`
- Define XState machine with 3 depths: `idle | wing-open | tool-running`
- Build 3 levels with Framer Motion `layoutId` morphs — same easing curve, 600ms

**Evening:**
- Wire 5 Seedance clips to state transitions with cross-fade
- Test the orb → wing → sub-tool zoom morph on a hello-world layout
- Ship Chrome kiosk launch script (`./run-stage.sh` that does: build static, start serve, launch Chrome --kiosk)

**Deliverable:** Static visual shell, 3-level morph works, no real backends yet, kiosk launches with one command.

### Day 2 (Sun) — Trigger union (voice + R400 + Streamdeck)
- Picovoice Rhino: define grammar with 15 intents (`OpenMarketing`, `OpenSales`, `OpenOps`, `RunIG`, `RunLinkedIn`, ..., `Back`, `Home`, `Reset`)
- Picovoice Porcupine: wake word "Hey GBI 2026" — gates Rhino so ambient speech doesn't trigger
- Logitech R400: keyboard listener maps PgUp → `RUN_TOOL`, PgDn → `RUN_TOOL`, Esc → `BACK`, F5 → `HOME`
- Streamdeck Mini: Companion software → 3 buttons output keystrokes M/S/O → XState dispatches
- All three triggers fire identical XState events. Voice/R400/Streamdeck/keyboard are equal-class.
- Test: voice fails? R400 works. R400 fails? Streamdeck works. Streamdeck fails? Keyboard works.

**Deliverable:** Volunteer can drive the demo with any input modality. Failure of any one is invisible.

### Day 3 (Mon) — Marketing wing sub-tools (4 tools)
Build all 4 Marketing sub-tools as fullscreen React components:
- 📸 **Instagram Creator:** Anthropic streamText + fal.ai Flux Pro
- 💼 **LinkedIn Post:** Anthropic streamText + your `caption-writer` skill
- 📰 **Article + Images:** Vercel `streamUI` + Imagen via fal.ai (paragraph-by-paragraph with inline images)
- 🎬 **Video Generator:** Nano Banana 2 + fal.ai Seedance 2.0 fast tier

Each sub-tool has 3 modes: `live` (real APIs), `fake` (loads pre-rendered MP4 + canned text), `safe` (instant fake — emergency).

**Deliverable:** Marketing wing fully functional. Voice triggers tool, real output materializes, return-to-wing works.

### Day 4 (Tue) — Sales + Operations wings
**Sales wing (4 tools):**
- 🎯 **Lead Scraper:** Hyperbrowser session fullscreen (`liveUrl` iframe), Stagehand natural-language → Playwright execution, lead rows ticker-drop in
- ✉️ **Cold Email Writer:** Hyperbrowser pulls profile → Anthropic streams personalized email
- 📞 **Cold Call Script:** Anthropic + your `closing-playbook` and Taki Moore skills
- 🔄 **Follow-up Sequence:** Anthropic + your Hormozi/Taki email skills

**Operations wing (3 tools):**
- 📊 **Weekly Focus Report:** Anthropic + your `purely-personal:leadership-engine` skill (the showstopper output)
- 📈 **Daily 3-Priority:** Anthropic + activity feeds
- 🔍 **Process Auditor:** Anthropic + your `purely-personal:operations-engine` skill

**Deliverable:** All 11 sub-tools functional. Sales 2-volunteer flow works. Operations Weekly Focus Report works.

### Day 5 (Wed) — Act 3 showstopper (parallel firing + synthesis)
The hardest day:
- Parallel mode: Streamdeck buttons trigger 3 wings simultaneously (or in sequence with 5-second offsets for drama)
- 3-column war room layout: Marketing output | Sales output | Operations output
- After 5 seconds, CEO orb pulses, AnimatedBeams converge from 3 wings to center
- Synthesis call: Anthropic with all 3 outputs as context, generates unified weekly plan
- Final: synthesis output materializes with `flowtoken` blur-in fullscreen

**Deliverable:** Act 3 (Day 2 showstopper) works. 3 volunteers, 3 buttons, parallel firing, CEO synthesizes. This is the close-earning moment.

### Day 6 (Thu) — 50ft polish + failure recovery + venue dress rehearsal
- Apply 50ft typography (body 64pt, headlines 96–128pt, no sub-12px text)
- Color profile audit: pure white → `#E8EDF7`, saturation +30% to compensate for projector under-sat
- Force 60fps cap, prefer transform/opacity over filter/blur
- Failure recovery: every XState action has `live` and `fake` variant; `Cmd+F` forces fake mode mid-show; `Esc` → idle.mp4
- Pre-flight script: `presenter-mode.sh` that disables Notifications, runs caffeinate, sets DND, picks correct resolution
- Run full demo end-to-end 5× on a 65" TV from 25 feet — does it read?

**Deliverable:** Demo runs reliably from any state. Esc always rescues. Cinematic at distance.

### Day 7 (Fri) — Venue rehearsal + backup laptop sync
- Test at venue with actual projector and HDMI run
- Force native projector resolution (whatever it actually is — 1080p, 720p, etc.)
- Test long HDMI cable run; if 30Hz drop, bring fiber-optic HDMI
- Sync backup MacBook with identical build; ATEM Mini Pro switcher tested
- USB stick apocalypse fallback prepared (Chrome + static HTML)
- 11 fallback MP4s loaded for instant playback (`Cmd+B` plays the right one based on current XState)
- Run demo 3× full at venue, 1× with deliberate failures injected (kill WiFi mid-demo, see what happens)

**Deliverable:** Demo is muscle memory. You can run it half-asleep, on bad WiFi, with a dead R400, with hecklers. Everything has a fallback.

---

## Cost estimate (one show)

| Item | Cost |
|---|---|
| 5 Seedance backdrop clips (Day 1) | $25 |
| 11 pre-rendered fallback MP4s (Day 1) | $55 |
| Live demo AI calls during show (Anthropic + fal + Apify + Hyperbrowser) | $30 |
| Logitech R400 | $30 |
| Streamdeck Mini | $80 |
| ATEM Mini Pro (one-time) | $295 |
| Anker 555 + active HDMI 25ft | $90 |
| **Total per show** | **$605 first show, $110 recurring** |

For an offer that closes ~$150K+ at $1,497 × 100 attendees, $605 is a rounding error.

---

## The pre-show checklist (tape to lectern)

**90 minutes before:**
- [ ] Run `presenter-mode.sh` (DND, caffeinate, screen brightness max, resolution match)
- [ ] Plug in HDMI, force 1920×1080@60 (or projector native)
- [ ] Test all 11 sub-tools in `live` mode end-to-end
- [ ] Hyperbrowser session pre-warmed
- [ ] fal.ai credits checked, Apify actors authenticated
- [ ] Picovoice Rhino tested with venue ambient noise

**30 minutes before:**
- [ ] Backup MacBook built and ATEM Mini Pro tested
- [ ] R400 paired, Streamdeck Mini connected
- [ ] Lavalier mic on, levels checked
- [ ] All 11 fallback MP4s in `/fallback/` directory, `Cmd+B` queue set

**On stage:**
- [ ] Chrome kiosk launched fullscreen
- [ ] Seedance idle.mp4 looping
- [ ] CEO orb pulsing in idle state
- [ ] Stately Inspect open in second tab (hidden, just there for emergencies)

---

## The kill switches (memorize)

| Key | Action |
|---|---|
| `Esc` | Back one level (sub-tool → wing → idle) |
| `Cmd+H` | Force home (idle, regardless of current state) |
| `Cmd+F` | Force fake mode (all subsequent tools play pre-rendered MP4) |
| `Cmd+B` | Play the master backup MP4 (catastrophic failure) |
| `Cmd+R` | Reset XState to idle, restart demo |
| `Cmd+T` | Toggle "type instead of speak" — bypasses voice |
| `Cmd+M` | Mute Howler audio (if venue PA gets confused) |

---

## What this earns at the close

After Act 3 (the Operations showstopper):

> *"You just watched 6 strangers from this room — 3 in Marketing, 2 in Sales, 3 in Operations — operate a business OS none of them had ever touched. None of them. Six people. Three departments. One report. Twelve cents."*
>
> *"By July 1, you ARE one of those 6. The cohort isn't theory. The cohort is muscle memory. Three weekends from now you sit down Tuesday morning, your AI team gives you the three priorities, you execute, you're done by lunch. THIS — exactly THIS — is what the cohort gives you."*

This close earns its weight only because 6 people from the room actually operated the system on stage in front of 1,000 people. Every architectural decision in this doc exists to make sure they succeed.

---

## Sources (new in this doc)

- Tauri v2 fullscreen: https://v2.tauri.app/learn/window-customization/
- Chrome kiosk mode: built into Chrome (`--kiosk --app=URL`)
- Framer Motion layoutId: https://motion.dev/docs/react-layout-animations
- Picovoice Rhino: https://picovoice.ai/platform/rhino/
- Picovoice Porcupine: https://picovoice.ai/platform/porcupine/
- Logitech R400: standard USB HID
- Elgato Streamdeck Mini: https://www.elgato.com/stream-deck-mini
- Blackmagic ATEM Mini Pro: https://www.blackmagicdesign.com/products/atemmini
- daedalOS (window-zoom reference): https://github.com/DustinBrett/daedalOS
- Vaul (drawer stacking): https://github.com/emilkowalski/vaul
- whisper.cpp (fallback STT): https://github.com/ggerganov/whisper.cpp

All other sources in docs 03/04/06/08.
