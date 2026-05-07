# 11 — Hollywood Polish: The Specific Assets

This doc complements doc 10. Doc 10 is the build manual; this one is the asset and polish list — the specific tracks, LUT files, motion packs, and movie-reference component libraries that turn the build from "premium SaaS" into "cinema."

---

## A. The audio score (the soundtrack)

### Hero ambient bed: Musicbed
**Source:** [musicbed.com](https://www.musicbed.com)
**Why it's the pick:** highest-curation cinematic catalog. The composers listed below have texture genuinely close to the Hans Zimmer "Time" / "Interstellar" world — not the generic "epic trailer" filler that dominates Epidemic/Bensound.

**Composers to pull from (in order):**
1. **Tony Anderson** — slow piano + orchestral pads. Hits the "Time" / "Inception ending" register exactly.
2. **Christoffer Moe Ditlevsen** — Nordic-cinematic, used by major brand commercials.
3. **Gavin Luke** — orchestral build-and-resolve, the "anticipation" texture for the boot.
4. **Hill** — minimal piano with strings; the "synthesis moment" register.

**Pull 3 tracks:**
- One **anticipation pulse** (idle bed, plays under everything for 8 minutes)
- One **build/swell** (Act 3 opening — Mission Control energy)
- One **resolution** (Act 3 close — Hans Zimmer reflection bed)

**License:** annual subscription covers commercial event playback. Verify "Personal & Commercial" tier.

### Custom AI-generated stinger: Udio
For the **wing-transition stinger** (the 1.5-second swell when you switch wings) — Musicbed won't have your exact 1.5s emotional beat. Generate one in [Udio](https://udio.com).
- **Why Udio over Suno or ElevenLabs Music:** Udio's spatial depth and dynamic range on orchestral prompts is the only one that doesn't betray itself on a 50ft system with proper subs.
- **Prompt template:** *"orchestral stinger, 1.5 seconds, cyan-cool dynamic, brass swell into resolved chord, Hans Zimmer Inception, no vocals"*

### State-responsive ambient (the "responds to UI" feel)
**Source:** [Tone.js](https://github.com/Tonejs/Tone.js)
**Pattern:** layer 2-3 Tone.js drone pads ON TOP of the Musicbed bed. Modulate filter cutoff via XState transitions.
- Wing opens → filter cutoff rises (brightens the bed)
- Sub-tool runs → add subtle delay
- Synthesis → all filters open, full spectrum
**~30 LOC.** Don't build full generative — Musicbed is the hero, Tone.js is the responsive layer.

### Reference: do NOT use
- **Epidemic Sound, Soundstripe, Bensound, FreePD** — YouTube-vlog tier, not stage-Hollywood tier
- **ElevenLabs Music** — fidelity good, composition feels generic
- **Suno** — technically rated highest overall but Udio wins on orchestral

### The mix on stage
Per doc 04 §F6 + new learnings:
- **Hero bed:** -22dB (under presenter's lavalier without competing)
- **Tone.js drones:** -28dB (sits below the bed)
- **Stinger:** -10dB at peak (1.5s)
- **SFX (Howler sprite):** -8 to -10dB, lead visual by 60ms
- Test on actual venue PA — laptop speakers lie.

---

## B. The color grading (the SINGLE highest-ROI move)

This is the move that separates "web demo" from "Hollywood." Build it Day 1.

### The stack
1. **`mattdesl/glsl-lut`** — [github.com/mattdesl/glsl-lut](https://github.com/mattdesl/glsl-lut). Canonical lib, ~50 LOC implementation.
2. **Frost.kiwi tutorial** — [blog.frost.kiwi/WebGL-LUTS-made-simple](https://blog.frost.kiwi/WebGL-LUTS-made-simple/). Copy-paste reference.
3. **IWLTBAP Blade Runner 2049 LUT pack** — [luts.iwltbap.com](https://luts.iwltbap.com). Free, log-calibrated `.cube` files.
4. **HolyGrain film grain pack** — [holygrain.com/free-film-grain-download](https://www.holygrain.com/free-film-grain-download/). 35mm/16mm grain video loops.

### The implementation
```jsx
// components/chrome/ColorGrading.tsx
// Renders Seedance backdrop video through a WebGL LUT shader
// + film grain overlay + radial vignette

<div className="fixed inset-0">
  <canvas ref={lutCanvasRef} className="absolute inset-0" />
  {/* glsl-lut renders the video texture through Blade-Runner-2049.cube */}
  
  <video 
    src="/grain/35mm-overlay.webm" 
    autoPlay muted loop 
    className="absolute inset-0 mix-blend-overlay opacity-15"
  />
  
  <div 
    className="absolute inset-0 pointer-events-none"
    style={{ 
      background: 'radial-gradient(ellipse, transparent 40%, rgba(0,0,0,0.6) 100%)',
      mixBlendMode: 'multiply'
    }}
  />
</div>
```

### The vignette: pure CSS, no library
6 lines. Don't import a vignette library — it's a `radial-gradient` with `mix-blend-mode: multiply`.

### The film grain rule
**Use a video loop, not CSS noise.** CSS grain looks digital. HolyGrain's actual 35mm scan looks like film. Composite at `mix-blend-mode: overlay; opacity: 0.15`. This is invisible-but-felt — the audience doesn't know what changed, only that it suddenly looks expensive.

---

## C. Motion graphics (Lottie packs)

### Sub-tool icons (14 needed, one per sub-tool)
**Pack 1 — IconScout Futuristic HUD Display Animation Packs**
- URL: [iconscout.com/lottie-animation-packs/futuristic-hud-display](https://iconscout.com/lottie-animation-packs/futuristic-hud-display)
- 483 packs. Pull 14 icons, drop into `/public/lottie/`, render via `lottie-react`.
- **USE THIS** — JSON exports drop straight in.

**Pack 2 — LottieFiles "Cyberpunk and Sci-Fi 3"**
- URL: [lottiefiles.com/marketplace/cyberpunk-and-sci-fi-3](https://lottiefiles.com/marketplace/cyberpunk-and-sci-fi-3)
- For boot/loading animations, not sub-tool icons.

**Pack 3 — LottieFiles "Futuristic 11"**
- URL: [lottiefiles.com/marketplace/futuristic-11](https://lottiefiles.com/marketplace/futuristic-11)
- Backup source for icons.

### Premium loaders (1-2 unique pieces)
**Source:** [Creattie](https://creattie.com)
Pull 1-2 truly unique loaders for hero moments (Act 3 synthesis loader, boot complete confirmation). Don't bulk-pull from Creattie — too expensive per asset for general use.

### Skip
- **UseAnimations** — too SaaS-app, not enough sci-fi
- **Lordicon** — friendly/consumer aesthetic, wrong vector
- **Pablo Stanley packs** — illustration/character work, not HUD

---

## D. Camera-style motion (the cinematic feel)

### Foundation: GSAP + ScrollSmoother + ScrollTrigger
Industry standard. Already in stack. Use for:
- Parallax depth on wing transitions (3 layers @ 0.3x / 0.6x / 1.0x translate)
- Dolly zoom (Vertigo) on focus changes
- Bokeh focus-pull (CSS `filter: blur(8px)` on non-focused wings, animated via GSAP `to()`)

### Optional shortcut: `btahir/react-kino`
- URL: [github.com/btahir/react-kino](https://github.com/btahir/react-kino)
- Declarative cinematic scroll components: Scene, Reveal, ScrollTransform, Parallax, StickyHeader.
- Lightweight wrapper around GSAP.
- **USE IT** if you want speed; **BORROW THE PATTERN** if you want fine control.

### The dolly zoom (Vertigo / Hitchcock zoom)
No library. ~15 LOC of GSAP `scale` + `perspective` + `translateZ` driven inversely.

```js
// Hitchcock zoom: subject stays same size, background dollies in
gsap.to(".camera", { 
  perspective: 800, // pull back perspective
  duration: 1.5,
  ease: "expo.inOut"
});
gsap.to(".subject", { 
  scale: 1.0,       // subject visually stays same size
  duration: 1.5
});
gsap.to(".background", { 
  scale: 1.4,       // background appears to dolly toward camera
  duration: 1.5,
  ease: "expo.inOut"
});
```

### The Minority Report panels (gestural feel)
No good library exists. Spring physics + Framer Motion drag.
```jsx
<motion.div 
  drag 
  dragConstraints={{ left: 0, right: 100, top: 0, bottom: 0 }}
  transition={{ type: "spring", stiffness: 200, damping: 25 }}
/>
```
~30 LOC. Build it.

---

## E. The Mission Impossible countdown (45-second video gen filler)

**No single repo nails this.** Stack three things:

### Layer 1: Decrypt status text
**Source:** [maciaszczykm/react-decrypt-animation](https://github.com/maciaszczykm/react-decrypt-animation) OR [shadcn.io decrypted-text](https://www.shadcn.io/text/decrypted-text)
Cycle through fake status messages every 4 seconds:
- "FRAMES ANALYZED: 247 / 720"
- "COMPOSITING PASS 3 OF 7"
- "RENDERING SHOT 02..."
- "COLOR GRADING APPLIED"
- "FINAL OUTPUT: 89%"

Each line fades out via decrypt-animation, scrambles, resolves to next line. Looks like the AI is actually doing detailed work.

### Layer 2: Radial countdown ring
Framer Motion `circle` with `pathLength` animating over 45s. Glow with CSS `filter: drop-shadow(0 0 20px cyan)`.
~25 LOC.

### Layer 3: Audio waveform
`<canvas>` rendered from Tone.js analyzer of the ambient bed. Real waveform, real-time. Pulses with the music underneath.
~30 LOC.

**Total: ~80 LOC for the 45-second cinematic filler.** No shortcut. The illusion is the layered cocktail, not any one element.

---

## F. Movie-reference component libraries (the visual DNA)

### Iron Man HUD: `harsh-raj00/my-jarvis`
- URL: [github.com/harsh-raj00/my-jarvis](https://github.com/harsh-raj00/my-jarvis)
- React + Three.js holographic Iron Man HUD with WebSocket and voice
- Most production-grade Stark interface on GitHub
- **BORROW THE PATTERN:** clone it, gut the FastAPI backend, keep the visual HUD components for the wing-node chrome.

### Tron Legacy boardroom globe: `arscan/encom-globe`
- URL: [github.com/arscan/encom-globe](https://github.com/arscan/encom-globe)
- React port: [github.com/jose-acevedoflores/encom-globe-react](https://github.com/jose-acevedoflores/encom-globe-react)
- The exact globe from Tron Legacy boardroom scene
- **USE IT** as the centerpiece during one specific moment — the COO wing's "Process Auditor" or as the war-room backdrop in Act 3
- **This is your "applause moment" visual.** Iconic. Audience will reach for phones.

### Tron grid floor: `tangrams/tron-style`
- URL: [github.com/tangrams/tron-style](https://github.com/tangrams/tron-style)
- GLSL grid shader — foundation for any "infinite grid floor" behind a wing
- **BORROW THE PATTERN** for the idle state backdrop floor

### Sci-fi chrome: Arwes (already in stack)
- URL: [github.com/arwes/arwes](https://github.com/arwes/arwes)
- Still alpha in 2026, but the bleeps + frame components + scanline aesthetic are dialed in
- **USE IT** as the chrome layer (wing octagons, sub-tool tiles)

### Blade Runner 2049 typography
No library — this is a design choice. Use **Space Grotesk** (free) or **Neue Haas Grotesk Display** (paid) at 240pt, letter-spacing -0.04em, on 80% black canvas.
**Borrow the typographic discipline:** ONE word at a time. Vast negative space. Single hero element. (Per doc 04 §C4.)

---

## G. The brutal Hollywood priority order (Days 1-7)

This is the polish-layer build sequence. Threads through the agentic build in doc 10.

### Day 1
- Pull 3 Musicbed tracks (anticipation, build, resolution)
- Generate 1 Udio stinger (1.5s wing-transition swell)
- Howler sprite of 8 SFX (per doc 04 §F)
- Tone.js drone pads layer (3 pads, filter modulated by XState)

### Day 2
- `mattdesl/glsl-lut` integrated — Blade Runner 2049 `.cube` from IWLTBAP applied to all Seedance backdrops
- HolyGrain 35mm grain overlay (`mix-blend-mode: overlay; opacity: 0.15`)
- CSS radial vignette (6 lines)
- **At end of Day 2, every Seedance backdrop looks graded, not raw.**

### Day 3
- Clone `harsh-raj00/my-jarvis`, lift the wing-node chrome
- Clone `arscan/encom-globe-react`, plant in COO wing's Process Auditor
- Arwes `<FrameSVGOctagon>` for sub-tool tiles

### Day 4
- GSAP parallax on wing transitions (3 depth layers)
- Dolly zoom on sub-tool focus
- CSS-blur DoF on non-focused wings

### Day 5
- 45s Mission Impossible countdown (decrypt + radial timer + waveform)
- Lottie sub-tool icons from IconScout HUD pack (14 icons)
- Minority Report drag-panel pattern for sub-tool reveal

### Day 6
- Movie-reference audit — every element traces to a film
- Color grading pass (saturation +30% to compensate for projector under-sat)
- Audio mix audit (-22 / -15 / -10 / -8 dB hierarchy)

### Day 7
- Venue stress-test of the LUT shader (some projectors struggle with WebGL load)
- Audio test on actual venue PA
- Print recovery card with the 7 kill switches

---

## H. The single highest-ROI move (if you do nothing else)

**`glsl-lut` + Blade Runner 2049 LUT + HolyGrain film grain + radial vignette.**

This stack on every Seedance video backdrop is the ONE thing that separates "web demo at 50ft" from "cinema at 50ft." Build it Day 1, before anything else if you have to. Total LOC: ~80. Total time: 4 hours including LUT download and integration. Total impact: the audience's first reaction goes from "nice website" to "is this a movie?"

That reaction is what makes them sit forward in their seats. Sitting forward is what makes them reach for their wallet at the close.

---

## Sources

- Musicbed: https://www.musicbed.com
- Udio: https://udio.com
- Tone.js: https://github.com/Tonejs/Tone.js
- glsl-lut: https://github.com/mattdesl/glsl-lut
- WebGL LUTs Made Simple: https://blog.frost.kiwi/WebGL-LUTS-made-simple/
- IWLTBAP Blade Runner 2049 LUTs: https://luts.iwltbap.com
- HolyGrain free film grain: https://www.holygrain.com/free-film-grain-download/
- IconScout Futuristic HUD: https://iconscout.com/lottie-animation-packs/futuristic-hud-display
- LottieFiles Cyberpunk & Sci-Fi 3: https://lottiefiles.com/marketplace/cyberpunk-and-sci-fi-3
- LottieFiles Futuristic 11: https://lottiefiles.com/marketplace/futuristic-11
- Creattie: https://creattie.com
- react-kino: https://github.com/btahir/react-kino
- react-decrypt-animation: https://github.com/maciaszczykm/react-decrypt-animation
- shadcn.io decrypted-text: https://www.shadcn.io/text/decrypted-text
- harsh-raj00/my-jarvis: https://github.com/harsh-raj00/my-jarvis
- arscan/encom-globe (Tron Legacy boardroom): https://github.com/arscan/encom-globe
- jose-acevedoflores/encom-globe-react: https://github.com/jose-acevedoflores/encom-globe-react
- tangrams/tron-style: https://github.com/tangrams/tron-style
- Arwes (already in stack): https://github.com/arwes/arwes
