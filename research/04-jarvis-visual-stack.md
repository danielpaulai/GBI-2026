# 04 — Jarvis Visual Stack

**Goal:** A live, real-time React command-center UI for the GBI Singapore 2026 stage. CEO node at center, 3 department satellites (Marketing / Sales / Operations), volunteer presses a node → it expands into sub-panels with cinematic motion, agents stream text, inter-agent lines light up when they collaborate. Iron Man / Tron / Mission: Impossible energy. Higgsfield + Seedance video clips for transitions and backdrops; the interactive shell is React.

This document is opinionated. It picks a stack, names files to copy, and lays out a 7-day build sprint. No "explore your options" — we've already explored.

---

## TL;DR — The Stack You're Building

| Layer | Tool | Why |
|---|---|---|
| Shell / framework | **Next.js 14 (App Router) + TypeScript** | Server components for streaming, deploy to Vercel in 60 seconds, zero config |
| Component primitives | **shadcn/ui + Tailwind** | Free copy-paste, owns its own code, easy to re-skin dark+neon |
| Sci-fi component aesthetic | **Arwes (`@arwes/react`) + ScifiCN UI** for frames/panels | Frames, bleeps, animator system, octagon panels — the Jarvis "look" |
| Motion orchestration | **Motion (formerly Framer Motion) + GSAP timeline** | Motion for component-level (variants, stagger); GSAP for the 7-second "boot up" cinematic |
| 3D / orbital scene | **react-three-fiber + drei + @react-three/postprocessing** | Central CEO sphere, orbiting nodes, selective bloom glow |
| Inter-agent connections | **xyflow (React Flow) + animated SVG edges** | Battle-tested node graph; animated path edges look exactly like data flow |
| Particle backdrop | **tsParticles** (`@tsparticles/react`) preset `links` | Connecting-dots backdrop, configurable density, low CPU |
| Streaming text | **Vercel AI SDK (`ai`) + flowtoken** for token-level fade-in | The closest thing to real cinematic LLM streaming |
| Audio | **Howler.js** + Arwes `BleepsProvider` for UI clicks | Sprite-based, zero-latency, sub-1KB triggers |
| Backdrop video | **HTMLVideoElement** + Higgsfield/Seedance clips, looped, multiply-blend-mode | Lets the AI video peek through the dark UI without cheesing it |

Total integration cost if scaffolded carefully: **~5 days**. This document gives you the path.

---

## SECTION A — The Recommended Visual Stack: Top 5 Repos

These five together give you the entire shell. Every other repo in Section B is an additive polish layer.

### A1. Arwes — `arwes/arwes`
- **URL:** https://github.com/arwes/arwes
- **Stars / activity:** 7.5k stars, last active early 2025, alpha but stable enough for stage demo
- **What it gives us:** This *is* the Jarvis aesthetic. `Animator` system orchestrates entrance/exit states across nested components ("idle → entering → entered → exiting"). `<FrameSVGOctagon>`, `<FrameSVGCorners>` — those angled chamfered-corner panels you see in every sci-fi UI. `<BleepsProvider>` for built-in UI sounds. Influences explicitly cited: Star Citizen, Halo, TRON: Legacy.
- **License:** MIT
- **Integration cost:** Medium. Install `@arwes/react`, wrap app in `<AnimatorGeneralProvider>` and `<BleepsProvider>`. Steeper API than shadcn; budget 1 day to grok the Animator state machine.
- **Fork this:** `packages/react-frames/src/FrameSVGOctagon` — copy this into your repo for the department-panel chrome. Also their playground at `apps/play/` has copy-pasteable composition examples.

### A2. xyflow / React Flow — `xyflow/xyflow`
- **URL:** https://github.com/xyflow/xyflow
- **Stars / activity:** 36.4k stars, very active, weekly releases
- **What it gives us:** The bones of the agent network. Nodes for CEO + departments, edges between them, animated edge support out of the box. They have a built-in `<AnimatedSVGEdge>` example that animates a circle along the SVG path — that's literally "data flowing between agents."
- **License:** MIT
- **Integration cost:** Low. `npm i @xyflow/react`, drop in `<ReactFlow>`. ~3 hours to build the radial layout.
- **Fork this:** `examples/edges/animated-svg-edge` from the docs site — the file `AnimatedSVGEdge.tsx` is the data-flow line you're copying. Also study `examples/nodes/custom-node` for the CEO/Department node shells.

### A3. Aceternity UI + Magic UI — copy/paste components
- **URLs:** https://ui.aceternity.com/components and https://magicui.design
- **Stars:** Aceternity ~10k+, Magic UI ~14k+
- **What it gives us:** The "polish layer." Specifically copy:
  - **Glowing Effect** (Aceternity) — radial gradient glow that follows pointer; perfect for hover state on department nodes
  - **Background Beams with Collision** (Aceternity) — diagonal light beams that intersect; cinematic backdrop
  - **Spotlight** (Aceternity) — single beam highlighting the CEO node on entry
  - **Sparkles** (Aceternity) — ambient particle field
  - **Animated Beam** (Magic UI) — connects two refs with a moving gradient line; this is the *fastest* way to do inter-agent connections if React Flow is overkill
  - **Terminal** (Magic UI) — the streaming-text component for agent output
  - **Marquee** (Magic UI) — rolling status ticker at the bottom of the screen
- **License:** MIT (copy-paste, you own the code)
- **Integration cost:** Trivial. Each is a single file paste. Aceternity's `GlowingEffect` is ~80 lines and works immediately.
- **Fork this:** `components/ui/glowing-effect.tsx` (Aceternity), `components/ui/animated-beam.tsx` (Magic UI), `components/ui/terminal.tsx` (Magic UI).

### A4. react-three-fiber + drei + react-postprocessing
- **URLs:** https://github.com/pmndrs/react-three-fiber, https://github.com/pmndrs/drei, https://github.com/pmndrs/react-postprocessing
- **Stars:** R3F ~28k, drei ~9k, postprocessing ~1.8k
- **What it gives us:** The 3D CEO sphere with a real volumetric glow. Drei gives you `<Sphere>`, `<MeshDistortMaterial>` (CEO core surface that subtly pulses), `<Sparkles>`, `<Float>`. Postprocessing's `<Bloom>` with `luminanceThreshold={1}` and emissive materials at color intensity > 1 gives you the *real* selective glow — not a CSS box-shadow fake.
- **License:** MIT
- **Integration cost:** Medium-high. R3F has a learning curve. Budget 1 full day for the central scene.
- **Fork this:** Study `r3f-by-example/examples/effects/emissive-bloom/` (https://onion2k.github.io/r3f-by-example/). That's 90% of your CEO-node shader work. Copy `App.jsx` and replace the cube with a sphere with `<MeshDistortMaterial emissive="#00d4ff" emissiveIntensity={2} />`.

### A5. Vercel AI SDK + flowtoken
- **URLs:** https://github.com/vercel/ai and https://github.com/Ephibbs/flowtoken
- **Stars:** AI SDK ~12k+, flowtoken 528
- **What it gives us:** Real LLM streaming, but rendered with cinematic per-token animation. Vercel AI SDK's `streamText` + `useChat` handles the data plumbing; flowtoken wraps each token in a `blurIn` or `fadeAndScale` animation so it doesn't look like cheap JS typewriter — it looks like the AI is *materializing* thoughts.
- **License:** MIT (both)
- **Integration cost:** Low (couple hours). Wire `useChat` → `flowtoken`'s `<SmoothText>` component.
- **Fork this:** `flowtoken/src/components/SmoothText.tsx` — pass `animation="blurIn"` and `animationDuration="800ms"`. Also reference `vercel/ai-chatbot` repo's `components/messages.tsx` for the streaming pattern.

---

## SECTION B — 10 Supporting Repos

### B1. ScifiCN UI — `baxy5/scificn-ui`
- **URL:** https://github.com/baxy5/scificn-ui
- **Stars:** 77 (small but high-fit)
- **Aesthetic:** Phosphor-screen retro sci-fi. 16 shadcn-compatible components (Button, Panel, Alert, Progress, Tabs etc.) in 3 themes — Sci-Fi (green/amber), Star Wars (blue/bone), Alien.
- **License:** Not explicitly stated (verify before stage use)
- **Cost:** Trivial — installs via shadcn CLI: `npx shadcn add @scificn/panel`
- **Copy:** Their `Panel` and `Progress` components for the department sub-panels. Use the "Sci-Fi" green-amber theme as a starting point and re-skin to your CEO blue.

### B2. The Gridcn — Tron-styled shadcn theme
- **URL:** https://allutilitycss.com/components/the-gridcn/
- **Aesthetic:** 50+ shadcn components with Tron-style neon borders, glow effects, scanlines. Cyan/emerald palette by default.
- **License:** MIT-style (verify)
- **Cost:** Drop-in shadcn theme override
- **Copy:** Their CSS variables file — sets the entire theme in one paste.

### B3. GlitchCN UI — `woustachemax/glitchcn-ui`
- **URL:** https://github.com/woustachemax/glitchcn-ui
- **Aesthetic:** Hacker/CRT terminal. Animated horizontal scanlines, glitch transitions on hover/focus.
- **License:** MIT
- **Cost:** Low
- **Copy:** Their scanline overlay CSS — single file, applies as a fixed-position pseudo-element on `<body>`. This is the cheapest way to get the "we're not on a normal monitor" feel.

### B4. SMUI — `statico/smui`
- **URL:** https://github.com/statico/smui
- **Aesthetic:** Dark terminal, JetBrains Mono everywhere, zero border radius. Nord-inspired.
- **License:** MIT
- **Cost:** Trivial — it's a theme file
- **Copy:** `tailwind.config.ts` color tokens and the JetBrains Mono setup.

### B5. tsParticles React — `tsparticles/react`
- **URL:** https://github.com/tsparticles/react
- **Stars:** parent repo ~7.7k
- **What it gives us:** Ambient particle backdrop. Use the **`links` preset** — particles that draw lines to nearby particles. Already gives you the "data network" backdrop without any custom shader work.
- **License:** MIT
- **Cost:** ~30 mins. Install `@tsparticles/react` and `@tsparticles/preset-links`, drop one component.
- **Copy:** Their `links` preset config (in `packages/preset-links/src/options.ts`). Tweak particle count to ~80, link distance ~150, opacity ~0.3.

### B6. Recon Dashboard — `syedmuhdhafidz/recon-dashboard`
- **URL:** https://github.com/syedmuhdhafidz/recon-dashboard
- **Stars:** Low (newer) but high-fit
- **What it gives us:** A working *cinematic mission-control* React + Three.js project. CRT scanline overlay, phosphor-glow gradients, rotating wireframe globe, SVG circular gauges with `stroke-dasharray` animation.
- **License:** MIT
- **Cost:** Reference / cherry-pick
- **Copy:**
  - `src/components/CyberGlobe.tsx` — adapt the wireframe globe to be your CEO core
  - `src/index.css` — the CRT scanline keyframes + phosphor glow are gold; lift the entire stylesheet
  - `src/components/RadialGauge.tsx` (if present) — for KPI rings around departments

### B7. react-aiwriter / typewriter-effect (npm) — fallback streaming
- **URLs:** https://github.com/mxmzb/react-aiwriter, https://www.npmjs.com/package/typewriter-effect
- **What it gives us:** If Vercel AI SDK is overkill (e.g. you're scripting fake responses for stage), these give you ChatGPT-style typewriter without backend.
- **License:** MIT
- **Cost:** Trivial
- **Copy:** `react-aiwriter` README example — 10 lines.

### B8. react-tsparticles `links` preset + `confetti` preset — Howler.js — `goldfire/howler.js`
- **URL:** https://github.com/goldfire/howler.js
- **Stars:** ~24k
- **What it gives us:** The audio engine. Sprite support means one HTTP request loads all your UI bleeps. Critical for stage — you cannot have audio latency on a button press in front of 1000 people.
- **License:** MIT
- **Cost:** ~2 hours including building the sprite
- **Copy:** Their `examples/sprite/sprite.js` pattern. Build one MP3 sprite of all your UI sounds with audacity (or use https://github.com/tonistiigi/audiosprite).

### B9. r3f-particle-system — `sampstrong/r3f-particle-system`
- **URL:** https://github.com/sampstrong/r3f-particle-system
- **What it gives us:** Declarative GPU particles for the *interior* of the CEO node. Imagine a swirling vortex of light particles inside the central sphere — that's this lib. Or trail-style particles when an inter-agent line fires.
- **License:** MIT
- **Cost:** Medium
- **Copy:** Their `<ParticleSystem>` component with `count={2000}`, `forces={[curlNoise, attractor(centerNode.position)]}`.

### B10. agent-prism — `evilmartians/agent-prism`
- **URL:** https://github.com/evilmartians/agent-prism
- **What it gives us:** React components for visualizing AI-agent traces (spans, hierarchical activity). If you want a sub-panel showing "what the Marketing agent is currently working on" with timeline-style spans, this is built for that exact use case.
- **License:** MIT
- **Cost:** Low
- **Copy:** `packages/react/src/TraceViewer/TraceViewer.tsx` — drop into the expanded department panel.

### B11 (bonus). Theatre.js — `theatre-js/theatre`
- **URL:** https://github.com/theatre-js/theatre
- **Stars:** ~11k
- **What it gives us:** Timeline editor (like After Effects) for orchestrating the stage opener. Sketch the "boot up" sequence visually instead of writing keyframes by hand. Plays back deterministically — important when the demo has to time perfectly with the presenter's voice.
- **License:** Apache-2.0
- **Cost:** Medium (1 day to learn). Worth it for the boot sequence; not worth it for routine animations.
- **Copy:** Pair with `@theatre/r3f` for camera fly-throughs into the CEO node.

---

## SECTION C — Design References (the "what does excellence look like" library)

### C1. GMUNK / Bradley Munkowitz
- **TRON: Legacy holograms:** https://gmunk.com/TRON-Legacy
- **TRON Board Room:** https://gmunk.com/TRON-Board-Room
- **What to study:** Minimalist angled lines, neon glow against deep black, geometric grid construction. *Print these and tape them to your monitor.* The Encom OS12 launch sequence is exactly the energy you want for the volunteer's first press.
- **HUDS+GUIS write-up:** https://www.hudsandguis.com/home/2011/04/19/tron-legacy-ui

### C2. Perception — Iron Man HUD
- **Iron Man 2 portfolio:** https://www.experienceperception.com/work/iron-man-2/
- **Jayse Hansen FUI portfolio (worked on Iron Man HUD):** https://jayse.tv/v2/?portfolio=hud-2-2
- **Oral history of the HUD:** https://vfxblog.com/ironman/
- **What to study:** Layered translucency, micro-numbers everywhere as ambient texture, central focal point with peripheral data orbiting. *The peripheral data is decorative — it sells the "this is real" feeling without being readable.* You're going to do this around your CEO node.

### C3. Ash Thorp — Ghost in the Shell FUI
- **HUDS+GUIS:** https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui
- **ALT Creative portfolio:** https://www.altcinc.com/work/gits
- **Behance:** https://www.behance.net/gallery/51424063/GHOST-IN-THE-SHELL
- **What to study:** Thorp's holographic city signage. The depth layering — foreground (sharp), midground (slight blur + glow), background (soft, low-opacity, particle drift). Apply this 3-layer rule to every screen.

### C4. Territory Studio — Blade Runner 2049
- **Project page:** https://territorystudio.com/project/blade-runner-2049/
- **HUDS+GUIS:** https://www.hudsandguis.com/home/2018/blade-runner-2049
- **UI reel video:** https://www.youtube.com/watch?v=H07HumKRQKE
- **Behance (Andrew Popplestone):** https://www.behance.net/gallery/63113211/BLADE-RUNNER-2049-SCREEN-GRAPHICS-UI-DESIGN
- **What to study:** The Joi/Wallace UI work. Restraint — vast amounts of negative space, single hero element, tiny support text. *This is the antidote to the "cyberpunk dashboard" cliche.* If you're worried something looks cheesy, it probably has too many elements; cut by half.

### C5. HUDS+GUIS general library
- **Site:** https://www.hudsandguis.com
- **What to study:** This is the largest curated archive of film FUI design online. Spend an hour browsing. Look for: angled corner accents, hexagonal/octagonal frame chrome, ambient micro-text fields, asymmetric grids.

### C6. FUI: How to Design User Interfaces for Film and Games (book)
- **URL:** https://www.hudsandguis.com/fui-media
- **What to study:** The actual rules. If you have 2 hours, this is the most ROI you'll get on understanding *why* sci-fi UI looks how it does.

### C7. Apple Vision Pro WWDC 2023 keynote
- **WWDC23 video:** https://developer.apple.com/videos/play/wwdc2023/101/
- **What to study:** Translucency math, depth via shadow not via 3D, gentle fluid physics on UI entrances. Watch how UI elements *settle* into position rather than snap. Your easing curves should mimic this — `cubic-bezier(0.25, 0.46, 0.45, 0.94)` is close.

### C8. Dribbble / Behance search seeds
- **Dribbble:** search `cyberpunk dashboard`, `space mission control`, `hud ui dark`, `command center`, `ai agent dashboard`
- **Behance:** search `FUI`, `Ash Thorp`, `Territory Studio`, `Jayse Hansen`
- **Specific shots to bookmark:**
  - Anything by **Sheldon Hicks** on ArtStation (Blade Runner 2049 UI lead): https://sheldonhicks.artstation.com/projects/JlmP9m
  - **Andrew Popplestone**'s Blade Runner work: https://www.behance.net/gallery/63113211

### C9. YouTube reels for late-night reference
- **GMUNK TRON Legacy reel:** search YouTube `GMUNK Tron Legacy`
- **Territory Studio Blade Runner 2049:** https://www.youtube.com/watch?v=H07HumKRQKE
- **Iron Man UI montage:** https://www.youtube.com/watch?v=7grjj-i905I
- **Habit:** Watch on a second monitor while building. Calibrates your eye.

---

## SECTION D — 7-Day Visual Build Sprint

This assumes one builder (likely you + Claude Code) and that you already have the agent backend roughed out. All days end with a **stage-test** — does this still look good projected at 4K from 30 feet away?

### Day 1 — Scaffold (8 hrs)
**Goal:** Empty stage with the dark backdrop and the CEO core visible, nothing interactive.

1. `npx create-next-app@latest jarvis-stage --ts --tailwind --app`
2. Install: `npm i motion @arwes/react @xyflow/react @tsparticles/react @tsparticles/preset-links three @react-three/fiber @react-three/drei @react-three/postprocessing howler ai flowtoken`
3. Install shadcn: `npx shadcn@latest init` then `add button card`
4. Set Tailwind theme — copy SMUI's `tailwind.config.ts` color tokens; add CSS variables `--neon-cyan: #00d4ff`, `--neon-amber: #ffa500`, `--bg-void: #050810`
5. Build `app/layout.tsx` — full-bleed dark background, JetBrains Mono on `<body>`
6. Build `components/Backdrop/ParticleField.tsx` — tsParticles `links` preset, opacity 0.3
7. Build `components/Backdrop/VideoLayer.tsx` — looping `<video>` element, `mix-blend-mode: screen`, opacity 0.15. This is where Higgsfield/Seedance backdrop clips live.
8. Build `components/Scene/CEOCore.tsx` — R3F `<Canvas>` with a `<Sphere>` + `<MeshDistortMaterial emissive="cyan" emissiveIntensity={2} />` + postprocessing `<Bloom luminanceThreshold={0.8} />`
9. Stage test: project on TV. Does the CEO core glow look real or like a gradient blob?

### Day 2 — Motion (8 hrs)
**Goal:** Volunteer presses node → expand → sub-panels stagger in.

1. Wrap app in Arwes `<AnimatorGeneralProvider duration={{ enter: 0.6, exit: 0.4 }}>`
2. Build `components/Nodes/DepartmentNode.tsx` — `<Animator>` wrapper, `<FrameSVGOctagon>` chrome from Arwes, `<motion.div>` for press scale
3. Position 3 nodes around CEO core at 120° intervals (use polar math: `x = cx + r*cos(θ)`, `y = cy + r*sin(θ)`)
4. Build `components/Panels/DepartmentPanel.tsx` — Motion variants:
   ```
   const panelVariants = {
     hidden: { opacity: 0, scale: 0.92, y: 20 },
     visible: { opacity: 1, scale: 1, y: 0,
       transition: { staggerChildren: 0.08, delayChildren: 0.15 }}
   }
   ```
5. Use Motion's `<AnimatePresence>` so panels animate out when collapsing
6. Add GSAP timeline for the *initial* boot sequence — CEO core fades up, then nodes stagger in clockwise, then ambient text labels fade in. Run on `useEffect` mount.
7. Stage test: practice the press 10 times. Does the expansion feel cinematic or jittery?

### Day 3 — Streaming Text (6 hrs)
**Goal:** Each agent panel has a streaming text feed when "thinking."

1. Build `app/api/chat/route.ts` — Vercel AI SDK `streamText` endpoint, hit Claude or GPT-4
2. Build `components/Streaming/AgentFeed.tsx` — uses `useChat` from `ai/react`
3. Wrap each token in `flowtoken`'s `<SmoothText animation="blurIn" animationDuration="600ms">`
4. Add a "thinking" shimmer state for before the first token — use Magic UI's `<Skeleton>` with a slow gradient sweep
5. Add a fake mode (env flag) — pre-recorded responses played token-by-token. **Build this.** You will not trust live LLM on stage.
6. Stage test: from 30ft does the text read? Set min font-size to 24px.

### Day 4 — Inter-Agent Lines (6 hrs)
**Goal:** When two agents collaborate, a glowing line traces between them.

Pick ONE of two paths:
- **Path A (recommended):** Magic UI's `<AnimatedBeam>`. Pass refs to source/destination DOM nodes, set `gradientStartColor` and `pathColor`. ~30 lines of code total. Looks great.
- **Path B (more flexibility):** xyflow `<ReactFlow>` with custom `<AnimatedSVGEdge>`. Good if you want the network graph to be the *whole* layout.

1. Build `components/Connections/Beam.tsx` (Path A) — wraps Magic UI beam, listens to a `useAgentEventBus()` hook
2. Build `useAgentEventBus()` — pub/sub keyed off agent IDs; emits `("marketing", "sales", "data-flow")` events
3. When agents start collaborating, fire event → beam plays for 2 seconds → fade
4. Polish: layer 3 beams at different opacities/widths for a chunky-glow feel (single beam looks anemic)
5. Stage test: trigger 5 connections at once, does anything stutter?

### Day 5 — Sound (5 hrs)
**Goal:** UI clicks, boot whoosh, comms blip when agents talk, ambient hum.

1. Download from Zapsplat (free with account):
   - "Sci-Fi Console Beeps" pack — for press / hover
   - "Sci-Fi UI Tones" pack — for confirm / select
   - "Sci-Fi Atmospheres" pack — for ambient hum bed
2. Combine into one MP3 sprite via `audiosprite` CLI: `audiosprite *.mp3 -o ui-sounds`
3. Build `lib/sound.ts` — Howler instance with sprite map: `{ press: [0, 320], confirm: [400, 600], comms: [1100, 800], whoosh: [2200, 1500], hum: [4000, 12000, true] }` (last bool = loop)
4. Build `useSound()` hook — `useSound("press")` returns play function
5. Wire to events:
   - Hover department node → `comms` (low volume, 0.3)
   - Press → `confirm`
   - Sub-panel expand → `whoosh`
   - Inter-agent line fires → `comms` again
   - Background → loop `hum` at volume 0.15
6. Test on actual stage PA system, not laptop speakers. The mix changes completely.

### Day 6 — Polish (8 hrs)
**Goal:** Cut everything that looks cheesy. Read Section E.

1. **3-layer depth audit** — every screen has a foreground (sharp, full opacity), midground (40-60% opacity, slight blur), background (10-20% opacity, heavy blur). Walk every screen and verify.
2. **Easing curves audit** — replace any default linear / `ease-in-out` with `cubic-bezier(0.25, 0.46, 0.45, 0.94)` or Motion's `[0.16, 1, 0.3, 1]` (the "expo out" curve)
3. **Glow falloff audit** — CSS box-shadows with hard edges = cheesy. Use radial gradients or R3F bloom. If using box-shadow, layer 3 shadows at increasing blur and decreasing opacity (e.g. `0 0 10px / 0.5, 0 0 30px / 0.3, 0 0 60px / 0.15`).
4. **Color temperature audit** — pick ONE neon (cyan recommended for "intelligence"), one accent (amber for "alert/active"), and grayscale for everything else. No purple unless you commit to a palette switch. Two neons max.
5. **Text density audit** — every dense text block needs a "rest" moment. Add empty space, micro-divider lines, ambient glyphs.
6. **Run the demo end to end 3 times** — find anything that breaks and fix.

### Day 7 — Stage Rehearsal (full day at venue)
1. Project at venue resolution. Re-test contrast at viewing distance.
2. Test with house lighting at presentation level (not studio dark).
3. Test audio through PA. Adjust hum and bleeps mix.
4. Build a kill-switch — single key (`Esc`) that fades everything to black gracefully if anything goes wrong.
5. Build a fake-mode toggle that stays in fake mode no matter what — backup if internet flakes.
6. Record a screen capture of the demo for the post-event highlight reel.
7. Sleep.

---

## SECTION E — The "Make It Look Real" Rules

These are the things that separate Tron from Kid's Show. Every rule is one specific implementation. No vague "use good design."

### E1. Three-layer depth — always
Every visual frame has 3 z-depths:
- **Foreground (z: 100)** — the active panel. Sharp text, full opacity, full saturation.
- **Midground (z: 50)** — adjacent panels, ambient text. Opacity 0.4–0.6, slight blur (`backdrop-filter: blur(2px)`).
- **Background (z: 0)** — particle field, video backdrop, distant grid. Opacity 0.1–0.2, heavy blur (`blur(8px)`), desaturated.

Implement via Tailwind utility: `class={cn("z-50 opacity-100", isFar && "z-10 opacity-40 blur-sm")}`.

### E2. Glow falloff — never use single box-shadow
Bad: `box-shadow: 0 0 20px cyan` → looks like a Geocities button.
Good — three stacked shadows mimicking real light bloom:
```css
box-shadow:
  0 0 8px  rgba(0,212,255,0.6),
  0 0 24px rgba(0,212,255,0.35),
  0 0 64px rgba(0,212,255,0.15);
```
Better — use R3F bloom postprocessing on emissive material with `emissiveIntensity > 1`.

### E3. Easing curves — never linear, never ease-in-out default
Sci-fi motion is *settled*. Things accelerate fast then arrive slowly. Use:
- Default UI motion: `cubic-bezier(0.16, 1, 0.3, 1)` (expo out)
- Critical moments (boot up, big reveal): `cubic-bezier(0.87, 0, 0.13, 1)` (expo in-out, "fluid intelligence")
- Never use Tailwind's default `transition-all` — it's `cubic-bezier(0.4, 0, 0.2, 1)`, fine for forms, wrong for sci-fi.

### E4. Opacity rhythm — never 100% on text below the foreground
- Active panel headline: 100%
- Active panel body: 80%
- Active panel labels: 60%
- Adjacent panel everything: 50% × those values
This creates breathable visual hierarchy without changing color.

### E5. The Ambient Text rule (Jayse Hansen's secret)
The Iron Man HUD looks alive because of *unreadable* micro-text everywhere. Your CEO node should have:
- A ring of tiny rotating coordinates ("LAT: 1.3521° N · LON: 103.8198° E · STATUS: NOMINAL")
- Numerical readouts that update every 200ms with random-but-bounded values (CPU 47%, MEM 62%, etc.)
- Glyphs and tick marks at the periphery
None of it needs to mean anything. It sells "this thing is alive."

### E6. Every interactive element has 3 states + a hover bleed
- Idle (60% opacity, soft glow)
- Hover (100% opacity, brighter glow, +1% scale, soft `comms` sound at 0.2 volume)
- Active (100% opacity, full glow, slight rotation `1deg`, confirm sound)
- Press → release transition has a 200ms decay where glow dims back. Without this, presses feel hollow.

### E7. Neon palette discipline
- **Pick exactly two neons.** Recommended: Cyan (#00d4ff) for primary "alive" state, Amber (#ffa500) for "active processing / alert".
- Everything else is grayscale (#0a0e1a void, #14202c panel, #2a3848 border, #aab8c8 muted text).
- The moment you add a third neon, it stops feeling premium and starts feeling like a Christmas tree. (Exception: brief red flash for "blocked" or "error" — but only as a momentary state, not a persistent color.)

### E8. Frame chrome is structural, not decorative
Use Arwes `<FrameSVGOctagon>` or hand-built SVGs for panel borders. The angled corners (45° chamfer at top-right and bottom-left) read as "engineered," not "rectangular box." Without this, your panels look like Bootstrap cards.

### E9. The 1.5x animation rule
Motion that feels right in your dev tools at 1.0x speed feels rushed on stage in front of an audience. Build with `globalMotion = 1.5` multiplier and tune from there. The audience needs reaction time.

### E10. Negative space audit
At any given moment, ≥40% of the screen is dark/empty. If your screen is full of panels, cut. Blade Runner 2049 has shots where 80% of the frame is black. The eye needs rest to register magic.

### E11. Sub-pixel grid alignment
Every element on a 4px grid (Tailwind defaults match). Misaligned by 2px = looks like an amateur dashboard. Use `grid` and `gap-4` everywhere.

### E12. Don't animate everything at once
Stagger. If 3 panels appear, they appear at 0ms, 150ms, 300ms — not all together. Apply this to every group of >1 element. Motion's `staggerChildren` makes this trivial.

### E13. Sound timing locks visual
A bleep that fires *just before* the visual change makes the visual change feel decisive. Wire press handler: `playSound('confirm'); setTimeout(triggerExpand, 60)`. 60ms head-start makes the press feel like it *caused* the expansion.

### E14. Backdrop video tricks
Higgsfield/Seedance clips with `mix-blend-mode: screen` or `lighten` and opacity 0.12–0.18 lets the cinematic energy bleed through without competing with UI. Never run the backdrop at full opacity behind UI — it eats contrast.

---

## SECTION F — Sound Effect Sourcing

### F1. Royalty-free libraries (free with attribution / accounts)

| Source | URL | Best for |
|---|---|---|
| **Zapsplat** | https://www.zapsplat.com/sound-effect-category/science-fiction/ | The biggest free sci-fi UI bank. Requires free account. |
| **Freesound.org** | https://freesound.org | Community uploads, varied quality. CC-licensed. |
| **Mixkit** | https://mixkit.co/free-sound-effects/sci-fi/ | Curated, free, no account needed for many. |
| **BBC Sound Effects** | https://sound-effects.bbcrewind.co.uk | Free for personal/educational. Atmospheric beds. |
| **Pixabay Audio** | https://pixabay.com/sound-effects | Free commercial use, no attribution required. |
| **Soundsnap** | https://www.soundsnap.com | Paid but high quality; subscription worth it for one project. |

### F2. Specific Zapsplat packs to download Day 5
- **Sci-Fi Console Beeps** (130 sounds): https://www.zapsplat.com/sound-effect-packs/sci-fi-console-beeps/
- **Sci-Fi UI Tones** (113 sounds): https://www.zapsplat.com/sound-effect-packs/sci-fi-ui-tones/
- **Sci-Fi Computer Tones** (34 sounds): https://www.zapsplat.com/sound-effect-packs/sci-fi-computer-tones/
- **Sci-Fi Atmospheres**: https://www.zapsplat.com/sound-effect-category/sci-fi-atmospheres/

### F3. Search terms that find the *good* stuff
On any sound library, these are the queries that hit:

**For UI clicks:**
- `interface beep clean`
- `confirm select hi-tech`
- `menu button futuristic`
- `console keystroke sci-fi`
- `holographic tap`
- `JARVIS interface` (literally — Zapsplat tags this)
- `tactical UI`

**For boot / reveal moments:**
- `system online whoosh`
- `power up sci-fi rise`
- `interface activate sweep`
- `holographic materialize`
- `tron grid expand`

**For comms / agent collaboration:**
- `transmission start`
- `data transfer beep`
- `signal lock`
- `comms ping`
- `network handshake`

**For ambient hum bed:**
- `spaceship interior drone`
- `sci-fi atmosphere room tone`
- `command center ambient`
- `subtle hum bed`
- `cyber drone low`

### F4. Specific files to build the sprite from
Recommend exactly 8 sounds in your sprite (anything more is overkill for this demo):

1. **press** — short clean click, 200–400ms
2. **confirm** — slightly longer + tonal, 400–600ms (used for big actions)
3. **hover** — sub-200ms airy whisper, very low volume
4. **whoosh** — panel expansion, 800–1500ms
5. **comms-ping** — agent-to-agent line, 600–900ms
6. **boot** — reserved for stage opener only, 2–4 seconds
7. **error** — red-flash moment, 300ms (probably never used; insurance)
8. **hum-bed** — looping ambient, 8–15 seconds, plays at 0.12 volume the entire demo

### F5. Free tool to make the sprite
- **audiosprite** (CLI): https://github.com/tonistiigi/audiosprite — outputs MP3 + Howler-compatible JSON map in one command.
- Alternative GUI: Audacity → label tracks at sound boundaries → export multiple → merge with `ffmpeg -i concat:...`

### F6. Mixing for stage PA
Critical and easy to forget:
- **Hum bed:** -22 dB (sits *under* spoken voice without competing)
- **UI clicks:** -8 to -10 dB (audible but never punchy)
- **Whoosh / boot:** -6 dB (these are theatrical moments; let them have weight)
- Test on the actual venue PA. Laptop speaker mixing lies to you.
- **Crucial:** if the presenter is on a lavalier mic, the audio engineer at the venue mixes the laptop into a different bus. Make sure they have a stem with just your demo audio so they can ride the level live.

---

## Closing Notes

**On video backdrops (Higgsfield/Seedance):** Generate 3–5 looping clips at 4K, 10–15 seconds each, with clean ends/starts (no jarring frame jumps). Subjects: abstract cyan particles drifting, a slow-rotating camera over a dark grid plane, gentle nebula or aurora. Cross-fade between clips on big section transitions. *Never* run them at full opacity — always `mix-blend-mode: screen` and `opacity: 0.12–0.18`.

**On the kill-switch:** Bind `Esc` to a state that fades all panels out and shows just the CEO core with a single line "SYSTEM IDLE." If anything goes wrong on stage, you press `Esc`, the visual stays *intentional*, and you say "Let's pause here." This has saved more demos than any retry logic.

**On real vs. fake LLM:** Build both modes. Default to fake mode for stage (deterministic, instant, no API failures). Use real mode in the green room to record a live demo for the highlight reel.

**On the 1-week timeline:** This is achievable if Days 1–5 are lock-in and Days 6–7 are dedicated polish. The biggest risk is scope creep on Day 4 (inter-agent connections) — if it's not landing by end of Day 4, ship Path A (Magic UI AnimatedBeam) and move on. Don't fork xyflow at midnight on Day 5.

The presenter is going to look like a magician. Make sure the magic is in the rehearsal, not the code.
