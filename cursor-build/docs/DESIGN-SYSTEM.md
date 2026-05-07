# GBI 2026 — Design System (Consolidated Reference)

This document consolidates every design rule, color, typography spec, motion curve, sound design, and visual reference scattered across research docs 01-13 into a single Cursor-readable spec.

When you build any UI element, this is the canonical design reference. If a rule here conflicts with a research doc, this wins.

---

## 1. The aesthetic mandate

**Hollywood Iron Man / JARVIS, NOT SaaS app.**

Every visible element must trace to one of these film references:
- **Iron Man HUD** (Perception Studio) — peripheral data, micro-numbers, single focal point with orbiting decoration
- **TRON: Legacy** (GMUNK) — angled lines, neon glow against deep black, geometric grid
- **Blade Runner 2049** (Territory Studio) — restraint, vast negative space, single hero element
- **Mission Impossible** — red countdown, frantic ticker, "go go go" energy
- **Apple Vision Pro WWDC 2023** — translucency math, depth via shadow not 3D
- **Severance Macrodata Refinement room** — corporate-clean retro-futuristic restraint
- **NASA Mission Control** — multi-screen war room (Act 3)

**Rule:** if a UI element doesn't trace to a film reference, it doesn't ship.

---

## 2. Color palette (TWO neons MAX)

### Primary
```
--neon-cyan:    #00d4ff   /* "alive" — primary accent */
--neon-amber:   #ffa500   /* "active processing" — secondary accent */
--bg-void:      #050810   /* deep background */
--bg-panel:    #14202c   /* mid-ground panels */
--border:       #2a3848   /* panel borders */
--text-muted:   #aab8c8   /* labels, secondary text */
--text-body:    #E8EDF7   /* body text — NOT pure white (#FFFFFF causes ghosting on DLP projectors at 50ft) */
```

### Wing-specific accents (subtle variations)
| Wing | Primary accent | Why |
|---|---|---|
| 🎯 CMO (Marketing) | Cyan `#00d4ff` | Default — first impression |
| 💰 CRO (Sales/Revenue) | Amber `#ffa500` | Energy, conversion focus |
| ⚙️ COO (Operations) | Cyan-violet `#7eccff` | Calm, methodical |
| 💳 CFO (Finance) | Amber-gold `#ffcc44` | Bullion, precision |

### Forbidden
- Third neon (purple, green, red except for momentary error flash)
- Pure white text or background
- Gradients beyond simple cyan→amber transitions
- Multiple competing accents in one frame

---

## 3. Typography (50ft readability is the filter)

### Font stack
```css
--font-display: "SF Pro Display", -apple-system, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
```

- **SF Pro Display** for everything (headlines, body, UI labels)
- **JetBrains Mono** for code, terminal output, ambient micro-text rings
- **NO Inter, NO Roboto, NO system fallback** — visible quality drop at 50ft

### Size scale (50ft hard rules)
```
--text-headline:  128pt   /* hero text per beat */
--text-display:   96pt    /* major labels */
--text-body:      64pt    /* primary content */
--text-secondary: 48pt    /* labels, supporting */
--text-meta:      32pt    /* metadata (timestamps, IDs) */
--text-ambient:   24pt    /* MINIMUM — anything smaller is illegible at 100ft */
```

**Test:** if text is below 24pt at 4K projection, it's invisible from row 30. Don't ship it.

### Letter spacing
- Headlines: `-0.04em` (Blade Runner 2049 typography rule)
- Body: `-0.01em`
- Mono: `0` (default)

---

## 4. Motion (the cinematic morphs)

### The ONE easing curve everywhere
```css
--ease-canonical: cubic-bezier(0.16, 1, 0.3, 1);  /* expo-out */
```

Don't deviate. Tailwind's default `transition-all` uses `cubic-bezier(0.4, 0, 0.2, 1)` — fine for forms, **wrong for sci-fi**. Always use the canonical curve.

### Duration
- Default: `600ms` (depth transitions, panel reveals)
- Stinger: `300ms` (button press feedback)
- Boot sequence: `4000ms` (the cinematic open)
- Mission Impossible countdown: `45000ms` (deliberately long)

### The 1.5× rule
Motion that feels right at 1.0× speed in dev feels rushed on stage in front of an audience. Build with `globalMotion = 1.5` multiplier and tune from there. Audience needs reaction time.

### Stagger
When a group of >1 element animates in, stagger them. Default: `staggerChildren: 0.08` (~80ms between elements). Critical: never animate everything at once.

### Framer Motion `layoutId` (the morph primitive)
```tsx
// Depth 0 (idle): wing icon at small size
<motion.div layoutId="wing-cmo" className="w-32 h-32" />

// Depth 1 (wingOpen): wing panel at full size
<motion.div layoutId="wing-cmo" className="w-screen h-screen" />
```

Same `layoutId` on both. Motion morphs automatically. Use this pattern for orb→wing→sub-tool transitions. NO manual animation code.

---

## 5. Glow falloff (NEVER use single box-shadow)

**Bad:** `box-shadow: 0 0 20px cyan` → looks like a Geocities button.

**Good — three stacked shadows mimicking real light bloom:**
```css
box-shadow:
  0 0 8px  rgba(0, 212, 255, 0.6),
  0 0 24px rgba(0, 212, 255, 0.35),
  0 0 64px rgba(0, 212, 255, 0.15);
```

**Better — R3F bloom postprocessing on emissive material with `emissiveIntensity > 1`** for the orb and any 3D element.

---

## 6. The 3-layer depth rule (always)

Every visual frame has exactly 3 z-depths:

| Layer | z-index | Opacity | Blur | Saturation |
|---|---|---|---|---|
| **Foreground** (active panel) | z: 100 | 100% | 0 | 100% |
| **Midground** (adjacent panels, ambient) | z: 50 | 40-60% | `backdrop-filter: blur(2px)` | 80% |
| **Background** (particles, video, distant grid) | z: 0 | 10-20% | `blur(8px)` | 50% (desaturated) |

If your screen lacks any one of these layers, add it. Flat compositions read as "web app." Three layers read as "world."

---

## 7. Negative space (≥40% always)

At any given moment, **at least 40% of the screen is dark/empty**. If your screen is full of panels, cut.

Blade Runner 2049 has shots where 80% of the frame is black. The eye needs rest to register magic.

---

## 8. Audio design (3-layer architecture)

### Layer 1: Hero ambient bed (always playing, -22dB)
- **Source:** Musicbed — composers Tony Anderson, Christoffer Moe Ditlevsen, Gavin Luke, Hill
- 3 tracks total: anticipation (idle bed), build (Act 3 opener), resolution (synthesis close)
- Sits beneath presenter's lavalier without competing

### Layer 2: Act-specific swells (-15dB at peaks)
- **Source:** Udio (custom 1.5s orchestral stinger)
- Mission Impossible theme on demo opens
- Hans Zimmer "Time"-style reflection bed on Act 3 close

### Layer 3: SFX sprite (-8 to -10dB, point events)
**Source:** Howler.js sprite of 8 sounds
| Sound | When | Duration | Volume |
|---|---|---|---|
| `press` | Button press | 200-400ms | -8dB |
| `confirm` | Big action confirmed | 400-600ms | -8dB |
| `hover` | Element hover | <200ms | -12dB |
| `whoosh` | Panel expansion | 800-1500ms | -6dB |
| `comms-ping` | Inter-agent line fires | 600-900ms | -10dB |
| `boot` | Stage opener only | 2-4s | -6dB |
| `error` | Red flash moments (insurance) | 300ms | -8dB |
| `hum-bed` | Ambient loop | 8-15s, looping | -22dB |

### Audio leads visual by 60ms
SFX fires *before* the visual change. Makes presses feel decisive. Wire as:
```ts
playSfx('confirm');
setTimeout(triggerVisual, 60);
```

### State-responsive layer (Tone.js)
2-3 Tone.js drone pads on top of Musicbed bed. Modulate filter cutoff via XState transitions. Wing opens → cutoff rises → bed brightens. ~30 LOC.

---

## 9. Color grading (the highest-ROI move)

The single thing that separates "web demo" from "cinema."

### Stack
1. `mattdesl/glsl-lut` — WebGL LUT shader, ~50 LOC
2. **IWLTBAP Blade Runner 2049 LUT** (free `.cube` file, convert to PNG HALD)
3. **HolyGrain 35mm film grain** (.webm video loop)
4. **Radial vignette** (CSS `radial-gradient` + `mix-blend-mode: multiply`, 6 LOC)

### Implementation
Every Seedance backdrop video runs through:
- LUT shader (Blade Runner cyan-orange grade)
- 35mm grain overlay at `mix-blend-mode: overlay; opacity: 0.15`
- Radial vignette (~60% darken at edges)

Build this Day 2. ~80 LOC total. ~4 hours. Audience reaction shifts from "nice website" to "is this a movie?"

---

## 10. The orb (CEO visual, NOT a face)

**JARVIS is voice + UI. No avatar. No face. Pure Iron Man.**

### Composition
- **R3F sphere** with `MeshDistortMaterial`
- **`emissiveIntensity` driven by Tone.js audio analyzer** (orb pulses to voice waveform)
- **Postprocessing `<Bloom luminanceThreshold={0.8}>`** for real glow
- **WebGPU + TSL particles** (MaximeHeckel sketches) attracted to orb center
- **Ambient micro-text rings** around orb — coordinates, status readouts, glyphs updating every 200ms (Iron Man HUD signature)
- **`audioMotion-analyzer`** waveform visualization in subtle ring

### Behavior
| State | Visual |
|---|---|
| Idle | Slow rotation, gentle pulse, particles drift |
| Listening | Surface ripples in time with input audio |
| Thinking | Particles agitate, surface distorts |
| Speaking | Surface ripples with output waveform, brightness modulates with amplitude |
| Synthesis (Act 3) | Particles converge, brightness peaks, AnimatedBeams from 4 wings flow into orb |

### Why no avatar
1. JARVIS doesn't have a face — Iron Man's JARVIS is voice + UI, that IS the aesthetic
2. AI avatars at 50ft = uncanny valley magnified (mouth lag, eye twitch become billboard-sized)
3. AI avatars are SaaS slop — every wantrepreneur on LinkedIn ships HeyGen demos
4. Violates 50ft rules (single focal point, ≥40% negative space)
5. Cleaner failure mode (one fewer system to glitch)

---

## 11. The wing nodes (4 specialists around the orb)

### Composition
- **Arwes `<FrameSVGOctagon>`** chrome (angled chamfered corners — engineered, not "rectangular box")
- Each wing has its accent color (cyan, amber, cyan-violet, amber-gold)
- Floating at 4 cardinal positions around the CEO orb (NSEW)
- **Dim until selected** (40% opacity)
- **Active state:** 100% opacity + brighter glow + slight rotation `1deg` + confirm sound

### `pmndrs/uikit` upgrade (NEW from doc 13)
Wings render INSIDE R3F using `pmndrs/uikit` — they float in volumetric space, not flat DOM overlays. Real 3D depth. The difference between "web app" and "Tony Stark's lab."

---

## 12. Inter-agent collaboration lines (Act 3)

When wings collaborate (Act 3 synthesis), connect them with:

### Pattern: Magic UI `<AnimatedBeam>`
- 3 beams layered at different opacities/widths (single beam = anemic)
- `gradientStartColor` / `pathColor` use the destination wing's accent
- Tron Legacy data-tendril aesthetic

### Sound
- `comms-ping` (-10dB) per beam fire

---

## 13. The boot sequence (4-second cinema open)

### GSAP timeline
```
0.0s — Black screen, ambient bed fades up at -22dB
0.5s — Seedance boot.mp4 starts (particles converge)
1.5s — CEO orb fades up (R3F bloom intensity 0 → 2)
2.5s — Wing nodes stagger in clockwise (250ms apart, expo-out)
3.5s — Ambient micro-text rings appear around orb
4.0s — Boot complete, system enters idle state
```

### Audio choreography
- 0.0s: ambient bed fade up
- 0.5s: subtle `whoosh` SFX (-15dB)
- 1.5s: `boot` SFX (-8dB) as orb materializes
- 2.5s: 4 × `comms-ping` SFX (-12dB), one per wing, staggered 250ms
- 3.5s: confirmation `ready` tone (-10dB)

The boot ends with the system in idle state. Audience has just watched a 4-second movie open. They're in.

---

## 14. The Mission Impossible countdown (45-second video gen filler)

When Video Generator runs, fill the 45s wait with cinematic tension. Stack 3 things:

1. **Decrypt status text** (`maciaszczykm/react-decrypt-animation` or `shadcn.io/decrypted-text`)
   - Cycle every 4s: "FRAMES ANALYZED: 247 / 720", "COMPOSITING PASS 3 OF 7", "RENDERING SHOT 02...", "COLOR GRADING APPLIED", "FINAL OUTPUT: 89%"
2. **Radial countdown ring** (Framer Motion `circle` with `pathLength`)
   - 45s linear sweep with `filter: drop-shadow(0 0 20px cyan)`
3. **Audio waveform visualization** (Tone.js analyzer of ambient bed → canvas)
   - Real waveform, real-time, pulses with music

Total: ~80 LOC. The illusion is the layered cocktail.

---

## 15. The 50-foot screen rules (hard learned)

These supersede earlier rules in docs 04 and 08:

1. **Force native projector resolution** — System Settings → Displays → Mirror → manual resolution match (almost always 1920×1080@60Hz, sometimes 1280×720)
2. **Wired HDMI only** — never AirPlay (200-400ms lag)
3. **Disable everything** — Notifications (DND), Bluetooth pairing, software update banners, screensaver, low battery warnings. Run `caffeinate -d` in Terminal. Use `presenter-mode.sh`.
4. **Color profile drift** — venue projectors are under-saturated and warm. Build assuming the audience sees ~70% of your Retina saturation. Boost saturation +30% to compensate.
5. **No sub-12px text on Retina** (illegible at 50ft). Body 64pt minimum.
6. **60fps cap** on Framer Motion. Prefer transform/opacity over filter/blur.
7. **Long HDMI runs >25ft** sometimes drop to 30Hz silently. Bring fiber-optic HDMI as backup.
8. **Backup laptop on ATEM Mini Pro switcher** — primary dies, hit input 2, audience sees 200ms cut, you keep talking.

---

## 16. The Hollywood checklist (run before every beat)

Before any beat ships:
1. Is there a film reference for every visible element?
2. Is the ambient bed playing under everything?
3. Is there a single focal point per moment, or am I splitting attention?
4. Does typography read from the back row of the venue (body 64pt+)?
5. Are colors graded (cyan/amber/void only)?
6. Does the SFX lead the visual by 60ms?
7. Does the entrance animation use expo-out, not linear?
8. Is ≥40% of the screen empty (negative space rule)?
9. Would Perception Studio ship this for Iron Man Mark VII?

If any answer is no, fix before shipping.

---

## 17. Asset acquisition (where to source)

### Audio
- **Musicbed** ($40-100/mo) — hero ambient bed (3 tracks)
- **Udio** — custom 1.5s wing-transition stinger
- **Zapsplat** (free with account) — Howler sprite source ("Sci-Fi Console Beeps", "Sci-Fi UI Tones" packs)

### Color grading
- **IWLTBAP** (https://luts.iwltbap.com) — Blade Runner 2049 LUT pack (free)
- **HolyGrain** (https://www.holygrain.com/free-film-grain-download/) — 35mm grain pack (free)

### Lottie
- **IconScout Futuristic HUD pack** (https://iconscout.com/lottie-animation-packs/futuristic-hud-display)
- **LottieFiles "Cyberpunk and Sci-Fi 3"** (https://lottiefiles.com/marketplace/cyberpunk-and-sci-fi-3)

### Voice
- **Picovoice Console** (https://console.picovoice.ai) — Rhino grammar + Porcupine wake word
- **ElevenLabs** (https://elevenlabs.io) — Flash v2.5 voice clone of Danny

### Backdrops
- **fal.ai Seedance 2.0 fast** — 6 cinematic loops (~$25)
- Use `jarvis-loop-prompt` skill for the prompts

### Reference materials (print and tape to monitor)
- GMUNK TRON Legacy (https://gmunk.com/TRON-Legacy)
- Perception Iron Man HUD (https://www.experienceperception.com/work/iron-man-2/)
- Jayse Hansen FUI portfolio (https://jayse.tv)
- Territory Studio Blade Runner 2049 (https://territorystudio.com/project/blade-runner-2049/)
- HUDS+GUIS archive (https://www.hudsandguis.com)

---

## 18. The non-negotiable rule (memorize)

**If a UI element is identifiably "an AI avatar," it doesn't ship. The Iron Man test: would Tony Stark's JARVIS look like that? If JARVIS doesn't have it, neither does GBI 2026.**
