# 16 — Image Pipeline Masterplan: World-Class, Brand-Locked, No AI Slop

> Mission: Replace Jarvis's generic AI image output with a pipeline that produces images and post-cards indistinguishable from a top human designer working in the Purely Personal aesthetic (dark/red/amber, premium, Hormozi-tier sales-card density).

> Date assembled: 2026-05-09
> Stack era: Flux 2, Nano Banana Pro (Gemini 3.0), Ideogram 3.0, Imagen 4 Ultra, Higgsfield Soul 2.0, Recraft V4, Vercel OG / Satori 0.10+

---

## TL;DR — The Real Answer

**Stop generating LinkedIn post-cards with diffusion models.** Diffusion is for *hero photography* and *editorial illustration*. Post-cards are typography + layout + brand color — those are a *code rendering* problem, not a generative problem. The world-class pipeline splits the work three ways:

1. **Post-cards / sales cards / quote graphics** → **Vercel OG (`@vercel/og` + Satori) with a locked Tailwind theme.** Pixel-perfect, brand-locked, free, infinite scale, identical every time. This is how Vercel, Linear, Stripe, Resend, and every premium SaaS does it.
2. **Hero photography (a person, a scene, a product shot)** → **Higgsfield Soul 2.0** (highest aesthetic) **or Flux 2 [pro]** via fal.ai for harder prompts, post-processed through **Real-ESRGAN** + a CLIP aesthetic gate.
3. **Text-heavy designs that need a generated background AND embedded text** (rare for Danny — usually skip and use #1) → **Ideogram 3.0**.

Carousels are #1, ten times.

The single biggest lever is moving 90% of Jarvis image output OUT of diffusion and INTO designed-in-code Satori templates. The other 10% (hero shots) gets quality-gated.

---

## Section A — The Recommended Stack (No Compromise)

### Layer 1: Brand Spec (Single Source of Truth)
A `brand.json` that locks every downstream renderer:

```json
{
  "name": "Purely Personal",
  "palette": {
    "bg": "#0A0A0B",
    "surface": "#141416",
    "primary": "#E63946",
    "primaryGlow": "#FF4D5E",
    "amber": "#F4A261",
    "ink": "#F5F5F7",
    "muted": "#8A8A93",
    "rule": "#27272A"
  },
  "fonts": { "display": "Inter", "body": "Inter", "mono": "JetBrains Mono" },
  "photoStyle": {
    "lighting": "moody, single-source warm key, deep shadow, slight haze",
    "lens": "Sony 35mm f/1.4 wide-open, shallow DoF",
    "grade": "warm shadows, amber midtones, slight teal highlights, film grain 4%",
    "mood": "premium, late-night work session, intimate"
  },
  "layout": { "grid": 12, "padding": 64, "radius": 24, "ruleWidth": 1 }
}
```

### Layer 2: Three Renderers

| Asset | Renderer | Why |
|---|---|---|
| LinkedIn post card | `@vercel/og` + Satori + Tailwind | Pixel-perfect typography, brand color exact hex, free, deterministic |
| 10-slide carousel | Same Satori template, looped over slide JSON | Cohesive — same engine = same look |
| Hero photo (person, scene) | Higgsfield Soul 2.0 → ESRGAN upscale → CLIP score gate | Best aesthetic model in 2026, looks shot not generated |
| Editorial illustration | Flux 2 [pro] via fal.ai, brand LoRA optional | Best prompt adherence, no negative prompts needed |
| Image with embedded text inside generated scene | Ideogram 3.0 | 90-95% text accuracy |
| Image edit (swap background, change subject) | Flux Kontext Pro or Nano Banana Pro | Multi-turn editing, character consistency |
| Product photo / brand kit consistency | Recraft V4 (has built-in Brand Kit) | Designed for brand systems |

### Layer 3: Quality Gate
Every diffusion output passes through `improved-aesthetic-predictor` (CLIP+MLP). Reject anything below 6.5. Re-roll up to 3x.

### Layer 4: Post-Processing
- Upscale: Real-ESRGAN x4 (open source, free)
- Crop: aspect-ratio-aware (1200x630 LinkedIn / 1080x1080 IG / 1080x1350 portrait)
- Color grade pass: luts.js or sharp with brand LUT applied (snaps midtones to brand amber/red)

### Layer 5: Orchestration
fal.ai workflow chains the diffusion + upscale + color grade + aesthetic score in a single endpoint. One API call, branded output.

---

## Section B — Top 10 Repos by Leverage (Ranked)

### 1. `vercel/satori` — https://github.com/vercel/satori
- **Stars:** ~12k+ • **License:** MPL-2.0 • **Activity:** very active (Vercel-maintained)
- **The technique:** Converts JSX + a subset of CSS (flexbox only, no grid) into SVG, then resvg compiles SVG → PNG. Bypasses the browser entirely. Custom fonts, text wrapping, gradients, images all supported.
- **Why it doesn't look AI:** Because it isn't AI. It's a deterministic renderer. Your typography is exact, your hex is exact, your layout grid is exact. A designer can hand-tune the JSX and you get that exact result back every time.
- **Integration cost:** ~2 hours to wire up first template. Days 2+ are template-only.
- **Steal this:** The pattern of `JSX template + props = PNG`. Build a `<PostCard headline body author />` component once, render thousands of variations.

### 2. `@vercel/og` (npm) — https://github.com/vercel/og (used via Next.js / standalone)
- **License:** MPL-2.0 • Wraps Satori + resvg + WASM
- **The technique:** Edge-runtime PNG generation. Tailwind support via the `tw` prop. Works on Vercel, Cloudflare Pages, anywhere you can run WASM.
- **Why no slop:** It's literally just rendering your design code. Brand-lock is automatic if your Tailwind theme is locked.
- **Steal this:** The exact pattern Linear/Resend/Stripe use for their social cards. Build one `og` route per card type.

### 3. `black-forest-labs/flux2` — https://github.com/black-forest-labs/flux2
- **License:** FLUX.2 [dev] non-commercial, [pro]/[max] commercial via API • Active
- **The technique:** 32B model, multi-reference (up to 10 images), HEX color codes understood directly in prompts, 4MP output, no negative prompts (just describe what you want). FLUX.2 [klein] released Jan 15, 2026 — sub-second generation.
- **Why no slop:** Literal prompt adherence + multi-image reference means you can pin "follow the colors and lighting of these 3 brand reference photos" and it will. No more random AI palette drift.
- **Integration cost:** fal.ai endpoint = single HTTP call. ~30 min.
- **Steal this:** The "reference 3 brand photos + describe scene" prompt pattern. Locks aesthetic better than LoRA for most use cases.

### 4. `kijai/ComfyUI-FluxTrainer` — https://github.com/kijai/ComfyUI-FluxTrainer
- **License:** MIT • Active
- **The technique:** Train a brand-style LoRA from 9-50 sample images of Danny's preferred photography aesthetic. The LoRA encodes the "look" (warm tungsten + deep shadow + slight haze + 35mm shallow DoF) so every generation inherits it.
- **Integration cost:** ~$5-15 on fal.ai for a fast LoRA train; or local on a 24GB GPU.
- **Steal this:** Train ONE "Purely Personal Photography" LoRA on 30 hand-picked references. Use it for every hero shot. This is how brands get visual identity from diffusion.

### 5. `christophschuhmann/improved-aesthetic-predictor` — https://github.com/christophschuhmann/improved-aesthetic-predictor
- **License:** MIT • Used by Stable Diffusion training pipelines
- **The technique:** CLIP+MLP. Outputs a single number 1-10 representing aesthetic quality. Trained on human preference data from the SAC/AVA datasets.
- **Why this matters:** Reject below 6.5 score automatically. Re-roll. The user only ever sees pre-filtered output.
- **Integration cost:** Python package, ~50 lines to wrap as a fal.ai workflow step.
- **Steal this:** The hard quality gate. This single component is what separates "Jarvis output" from "agency output" — the agency rejects 80% of takes; Jarvis currently ships them all.

### 6. `xinntao/Real-ESRGAN` — https://github.com/xinntao/Real-ESRGAN
- **Stars:** 30k+ • **License:** BSD-3 • Mature, stable
- **The technique:** Practical super-resolution. Takes a 1024px AI image to 4096px without the typical AI smoothing. Combine with GFPGAN for face restoration.
- **Why no slop:** AI images at native 1024 look AI; the same image at 4K with proper grain looks photo-shot. Resolution + grain = perceived quality.
- **Steal this:** Always upscale before publishing. Cheap, runs in seconds, transformative.

### 7. `higgsfield-ai/cli` — https://github.com/higgsfield-ai/cli
- **License:** Apache-2.0 • Active, official
- **The technique:** Single CLI to access Soul 2.0 (best aesthetic photo model in 2026), Marketing Studio (UGC + CGI ad formats), Nano Banana Pro, FLUX.2, Veo 3.1, Kling 3.0, Seedance 2.0. 30+ models behind one interface.
- **Why no slop:** Soul 2.0 is specifically tuned for "shot, not generated" — skin texture, fabric refraction, neon refraction. Soul ID pins character consistency across many images.
- **Steal this:** Make Higgsfield Soul the *default* hero-photo renderer, not Flux. Soul reads as photography by default; Flux reads as AI by default unless you fight it.

### 8. `LAION-AI/aesthetic-predictor` — https://github.com/LAION-AI/aesthetic-predictor
- **License:** MIT • Reference for #5
- **The technique:** Older, simpler linear-on-CLIP predictor. Lighter than #5. Pair them for a 2-model ensemble vote.
- **Steal this:** Run both predictors, take the average — fewer false-positives at the 6.5 cutoff.

### 9. `Shakker-Labs/ComfyUI-IPAdapter-Flux` — https://github.com/Shakker-Labs/ComfyUI-IPAdapter-Flux
- **License:** Apache-2.0 • Active
- **The technique:** IP-Adapter for Flux. Feed a reference image, get its style transferred to a new prompt. Cheaper and faster than LoRA training. Pair with Flux Redux for "make N variations of this exact image."
- **Steal this:** When you have ONE perfect brand reference photo, use IP-Adapter — no training needed, instant style transfer.

### 10. `vercel/satori` + `natemoo-re/satori-html` — https://github.com/natemoo-re/satori-html
- **License:** MIT
- **The technique:** Lets you write plain HTML strings (not JSX) and feed them to Satori. Critical for templating from a CMS or AI-generated layout.
- **Steal this:** When the LLM generates the post-card structure, it returns HTML. satori-html turns that into a PNG without needing a JSX build step.

---

## Section C — 20 Supporting Repos

| # | Repo | Use |
|---|---|---|
| 11 | `higgsfield-ai/higgsfield-js` | Official Node SDK for Higgsfield Soul/Marketing Studio. https://github.com/higgsfield-ai/higgsfield-js |
| 12 | `higgsfield-ai/higgsfield-client` | Python equivalent. https://github.com/higgsfield-ai/higgsfield-client |
| 13 | `geopopos/higgsfield_ai_mcp` | MCP server — drop into Claude/Cursor for direct Higgsfield calls. https://github.com/geopopos/higgsfield_ai_mcp |
| 14 | `bytedance-seedance/seedance-2.0` | Official Seedance 2.0 client (mostly video; image conditioning useful). https://github.com/bytedance-seedance/seedance-2.0 |
| 15 | `fal-ai/seedance-2.0-api` | fal.ai's Seedance wrapper. https://github.com/fal-ai/seedance-2.0-api |
| 16 | `fal-ai-community/skills` | Reference fal.ai workflow JSONs — multi-step pipelines (gen → bg-remove → upscale). https://github.com/fal-ai-community/skills |
| 17 | `fal-ai/fal` | Core fal CLI for deploying serverless ML. https://github.com/fal-ai/fal |
| 18 | `google-gemini/veo-3-nano-banana-gemini-api-quickstart` | Official Nano Banana + Veo 3 Next.js starter. https://github.com/google-gemini/veo-3-nano-banana-gemini-api-quickstart |
| 19 | `google-gemini/nano-banana-hackathon-kit` | Official hackathon kit; cleanest reference for Nano Banana. https://github.com/google-gemini/nano-banana-hackathon-kit |
| 20 | `minimaxir/gemimg` | Lightweight Python wrapper for Nano Banana / Gemini 2.5 Flash Image. https://github.com/minimaxir/gemimg |
| 21 | `andrewlwn77/kie-ai-mcp-server` | KIE.AI MCP server — single API for 80% of all paid models. https://github.com/andrewlwn77/kie-ai-mcp-server |
| 22 | `gateway/ComfyUI-Kie-API` | ComfyUI node wrapping KIE.AI. https://github.com/gateway/ComfyUI-Kie-API |
| 23 | `BartWaardenburg/recraft-mcp-server` | Recraft V4 MCP server — Brand Kit support, vector output, exact-hex generation. https://github.com/BartWaardenburg/recraft-mcp-server |
| 24 | `ShmuelRonen/FluxKontextCreator` | ComfyUI node for Flux Kontext text-based image editing. https://github.com/ShmuelRonen/FluxKontextCreator |
| 25 | `lovisdotio/workflow-comfyui-single-image-to-lora-flux` | Train a LoRA from a SINGLE image using Llm + Flux Kontext. https://github.com/lovisdotio/workflow-comfyui-single-image-to-lora-flux |
| 26 | `creaitivcompany/z-image-comfyui-workflow` | "One prompt, infinite brand aesthetics" — Vision-LLM-driven brand style injection. https://github.com/creaitivcompany/z-image-comfyui-workflow |
| 27 | `dembrandt/dembrandt` | Extracts a website's design tokens (logo, colors, type, spacing) in one command. Feeds the brand.json. https://github.com/dembrandt/dembrandt |
| 28 | `Geff115/brand-identity-extractor` | API: URL in → brand assets (logo + role-categorised palette) out. https://github.com/Geff115/brand-identity-extractor |
| 29 | `FranciscoMoretti/carousel-generator` | Open-source LinkedIn carousel maker — fork as Danny's template base. https://github.com/FranciscoMoretti/carousel-generator |
| 30 | `Open-reSource/slidev-theme-linkedin-carousel` | Slidev theme; export carousel as PDF. https://github.com/Open-reSource/slidev-theme-linkedin-carousel |
| 31 | `kane50613/takumi` | Rust rendering engine, next/og-compatible. Faster than Satori in production. https://github.com/kane50613/takumi |
| 32 | `Zhengqbbb/x-satori` | Vue/Astro variant of Satori — useful if Jarvis is Astro-based. https://github.com/Zhengqbbb/x-satori |
| 33 | `stevelacey/cardserver` | Puppeteer-based fallback when Satori CSS limits bite (3D, complex shadows). https://github.com/stevelacey/cardserver |
| 34 | `XLabs-AI/x-flux-comfyui` | Reference IP-Adapter + ControlNet workflows for Flux. https://github.com/XLabs-AI/x-flux-comfyui |
| 35 | `robertvoy/ComfyUI-Flux-Continuum` | Modular Flux workflow — "brings order to the chaos." https://github.com/robertvoy/ComfyUI-Flux-Continuum |

---

## Section D — The 5 Reasons AI Images Look Like Slop (and the Fix)

### 1. Wrong color palette — the model picks "AI default" colors (teal/orange, purple/cyan)
**Why:** Stable Diffusion / Flux were trained heavily on stock photo aesthetics. Default mode = stock-photo color.
**Fix:** Pass exact HEX codes in prompt (Flux 2 understands them natively), use a brand LoRA (#4), or skip diffusion entirely for color-critical work and use Satori (#1) where you control hex.

### 2. Generic "AI face" — uncanny valley, plastic skin, identical bone structure
**Why:** Latent space averages converge to "attractive person face." Without an anchor, you get the average face.
**Fix:** Higgsfield Soul (#7) is purpose-built for this — texture and pore detail by default. For consistency across many images, IP-Adapter (#9) or Soul ID. Never use raw Flux for faces unless you have a LoRA trained on the target person.

### 3. Garbled text inside images
**Why:** Diffusion treats text as visual noise; only Ideogram trained explicitly on text-rendering loss.
**Fix:** Don't generate text in diffusion images — render it in Satori on top, or use Ideogram 3.0 (90-95% accuracy).

### 4. "AI lighting" — over-rendered, no real-world physics, every surface glowing
**Why:** Models reward "high contrast pretty" over "physically plausible." Default output looks like an ad for a perfume.
**Fix:** Specify real lighting: "single tungsten softbox at camera left, overcast window, no fill" — physical descriptors. Specify lens + aperture: "Sony 35mm at f/1.4." Specify grain: "Kodak Portra 400, slight grain." This is in the Cursor instruction set below.

### 5. Wrong resolution / upscaling artifacts
**Why:** 1024×1024 native output looks AI on a Retina display because the AI's native level of detail tops out below the display.
**Fix:** Real-ESRGAN x4 (#6) every output to 4K. Add 2-4% film grain on top. Now it looks shot.

---

## Section E — The "Designed in Code" Pattern (The Real Answer for Post-Cards)

### Why this is the answer

LinkedIn cards are typography + layout + a brand color block + maybe a photo. Every one of those is a *deterministic design problem*, not a *creative generation problem*. Diffusion models lose every time on:
- Exact hex (drift)
- Exact font (impossible — they hallucinate fonts)
- Exact spacing (random)
- Repeatability (different every time)
- Iteration speed (re-roll, re-roll, re-roll)

A Satori component nails all five.

### The pipeline

```
LLM generates post copy → emits JSON {headline, body, cta, accent, photo_url}
        ↓
JSON feeds React component <PostCard /> with locked Tailwind theme
        ↓
@vercel/og runs Satori → SVG → resvg → PNG (200ms on edge)
        ↓
PNG returned, cached by URL
```

### Reference architecture

```tsx
// /api/og/post-card.tsx (Vercel Edge function)
import { ImageResponse } from '@vercel/og';
import { brand } from '@/lib/brand';

export const runtime = 'edge';
const inter = await fetch(new URL('/fonts/Inter-Bold.ttf', import.meta.url)).then(r => r.arrayBuffer());

export default function handler(req) {
  const { headline, body, kicker } = Object.fromEntries(new URL(req.url).searchParams);
  return new ImageResponse(
    (
      <div tw="flex flex-col w-full h-full p-16 bg-[#0A0A0B] text-white" style={{ fontFamily: 'Inter' }}>
        <div tw="text-[#E63946] text-2xl font-bold uppercase tracking-widest">{kicker}</div>
        <div tw="text-7xl font-bold leading-tight mt-6 max-w-[80%]">{headline}</div>
        <div tw="text-2xl text-[#8A8A93] mt-auto max-w-[70%]">{body}</div>
        <div tw="absolute bottom-16 right-16 flex items-center gap-4">
          <div tw="w-12 h-12 rounded-full bg-[#E63946]" />
          <div tw="text-xl font-bold">Purely Personal</div>
        </div>
      </div>
    ),
    { width: 1200, height: 1200, fonts: [{ name: 'Inter', data: inter, weight: 700 }] }
  );
}
```

That route handler is the entire LinkedIn-card system. Call it with `?headline=...&body=...&kicker=...` and you get a 1200×1200 PNG, identical every time, exact brand color, exact font, exact layout.

Build 6-8 of these (announcement, quote, stat, list, framework, before/after, testimonial, CTA) and you cover 95% of Danny's social output. Carousels = same component, looped over an array of slide JSON.

### The Satori limitations and how to live with them

Satori only supports flexbox (no grid), no `<style>` tags, no z-index, no `useState`/`useEffect`, no kerning, no 3D transforms.

Live with it: design within those constraints. They're sufficient for 99% of post-cards. For the rare card needing complex effects (3D depth, complex animation freeze-frames), fall back to **Puppeteer-as-a-service** (`stevelacey/cardserver` pattern, #33) — render the page in headless Chrome, screenshot it. Slower (1-3s vs 200ms) but unlimited CSS.

---

## Section F — Brand-Locking Checklist

Before any image leaves the pipeline, it must pass:

- [ ] **Palette lock** — every visible color is in `brand.palette` (use `chroma-js` to compute closest brand color and snap to it)
- [ ] **Font lock** — only `brand.fonts.display` and `brand.fonts.body` appear; no fallback to Arial/Helvetica
- [ ] **Photo style lock** — if the image contains photography, the lighting/lens/grade descriptors from `brand.photoStyle` were in the prompt
- [ ] **Layout grid lock** — Satori cards use the 12-col grid, padding=64, radius=24
- [ ] **Aspect ratio lock** — output is exactly 1200×1200 (LinkedIn square), 1200×630 (LinkedIn link), 1080×1350 (IG portrait), or 1920×1080 (cover)
- [ ] **Aesthetic score ≥ 6.5** (improved-aesthetic-predictor #5) — if diffusion-generated
- [ ] **Resolution ≥ 2x display target** — Real-ESRGAN'd to at least 2400×2400 for 1200×1200 final
- [ ] **No accidental text glyphs** in diffusion output (run a quick OCR — if any garbled text detected, reject)
- [ ] **Watermark-free** — no Flux/Higgsfield watermark slipped through
- [ ] **Mood match** — the image emotion matches the post copy emotion (this is a vibe check; manual or via vision LLM)

Run all 10 checks as the last fal.ai workflow step. Fail = re-roll.

---

## Section G — Cursor Instruction Set: Brand-Locked First-Time Generation

Drop this verbatim into Jarvis's image-generation prompt template. It encodes the photography/design knowledge the model needs.

````markdown
# IMAGE GENERATION SYSTEM PROMPT — PURELY PERSONAL

You generate images in two modes: DESIGN_MODE (post-cards, carousels, sales cards, quote graphics) and PHOTO_MODE (hero photography, portraits, scenes).

## DESIGN_MODE
- DO NOT call a diffusion model.
- Emit a JSON payload matching the schema for `<PostCard />` / `<Carousel />` / `<SalesCard />`.
- The Satori renderer at /api/og/[type] turns it into a PNG.
- Required fields per type are below.
- Allowed colors: bg=#0A0A0B, surface=#141416, primary=#E63946, amber=#F4A261, ink=#F5F5F7, muted=#8A8A93. NO OTHER COLORS.
- Allowed fonts: Inter, JetBrains Mono. NO OTHER FONTS.

## PHOTO_MODE
When a hero photograph is needed, route to Higgsfield Soul 2.0 first; Flux 2 [pro] only if Soul fails twice. Build the prompt using these mandatory components in this exact order:

1. SUBJECT (concrete, specific, no abstraction): "A man in his late 30s sitting at a wood desk, leaning forward, focused, mid-thought."
2. WARDROBE/PROPS: "Charcoal merino sweater, sleeves pushed up. MacBook open. Single ceramic mug. No visible logos."
3. ENVIRONMENT: "Late-night home office. Dark walls. Single warm tungsten lamp at camera-left, no fill light. Window to camera-right, ambient city glow only."
4. LIGHT — physical, not stylistic: "Single 2700K tungsten softbox at camera-left elevated 30 degrees. 1:8 key-to-fill ratio. Window provides 4500K rim from camera-right at 10% intensity. Black flag camera-right of subject for shadow shaping."
5. CAMERA — exact: "Sony A7R V, 35mm prime at f/1.4, 1/125s, ISO 800. Focus on the eyes."
6. COLOR GRADE: "Warm shadows lifted toward amber #F4A261. Midtones neutral. Highlights pulled slightly toward teal. Slight halation on the lamp. Kodak Portra 400 film grain at 4%."
7. MOOD: "Premium, intimate, late-night work session. The viewer should want to be in this room."
8. NEGATIVE/AVOID (these come LAST and are descriptors of what to do, not "don't"): "Skin shows pores and texture. Hair has individual strands not painted strokes. No symmetrical perfect face. Slight asymmetry. Coffee mug has condensation."

NEVER use these words (they trigger AI-slop look): stunning, breathtaking, masterpiece, hyper-realistic, 8K, ultra-HD, award-winning, professional, beautiful, perfect.

ALWAYS include lens, aperture, shutter, ISO. ALWAYS specify lighting positions (camera-left/right/above) not adjectives.

## After Generation
Every PHOTO_MODE output runs through:
1. Real-ESRGAN x4 upscale.
2. Improved-aesthetic-predictor scoring. Reject below 6.5.
3. Brand color LUT pass (snaps midtones toward brand amber/red).
4. Final crop to target aspect ratio.

If aesthetic score is below 6.5 three times, drop to the next prompt variation and re-run, OR fall back to a Satori card with a brand-color background instead of a photograph.
````

---

## Section H — KIE.AI Investigation

### What it actually is

**KIE.AI is a unified API gateway for generative AI** — think "Stripe for image/video/music models." Instead of separately integrating Google's Veo API, OpenAI's gpt-image-2, Black Forest's Flux, ByteDance's Seedance, Suno, Kling, Runway, etc., you integrate KIE.AI once. They translate your single API call into the vendor-native API on the backend, bill you in Kie credits, and return a normalised response.

It is a CDN/router for AI models, not a model itself.

### Why it matters for Jarvis

1. **One API key, all models.** Today Jarvis presumably has separate fal.ai, OpenAI, maybe Replicate keys. KIE.AI collapses those.
2. **30-50% cheaper than going direct to each vendor's API.** Some models hit 80% off (they buy in bulk and arbitrage).
3. **Single normalized response shape.** Easier to swap models without code changes.
4. **99.9% claimed uptime + edge routing for low latency.**
5. **Models supported (May 2026):** Veo 3.1 + 3.1 Fast (Google), Runway Aleph, Kling v2.1, Nano Banana Pro (Gemini 3.0 imagery), Ideogram 3.0, Flux family, Seedance 2.0, Suno music. Basically every paid model.

### Trade-offs

- Vendor lock-in to KIE.AI (one more dependency).
- Can't access vendor-specific edge features (e.g., bleeding-edge Flux beta endpoints) until KIE adds them.
- Pricing arbitrage could change — they're a startup.
- For *training* (LoRA), still need fal.ai or direct vendor.

### Official URLs
- **Site:** https://kie.ai/
- **Docs:** https://docs.kie.ai/
- **Model gallery:** https://kie.ai/market
- **Getting started:** https://kie.ai/getting-started
- **Python SDK reference:** https://dlthub.com/context/source/kie-ai
- **MCP server (community):** https://github.com/andrewlwn77/kie-ai-mcp-server
- **ComfyUI node:** https://github.com/gateway/ComfyUI-Kie-API

### Verdict

**Use KIE.AI for inference (image gen, video gen, music) to slash bills.** Keep direct fal.ai for LoRA training and bleeding-edge endpoints. Keep direct Vercel for Satori (no KIE involvement — that's local code).

---

## Section I — The Concrete Migration Plan for Jarvis (90 minutes of work)

1. **Hour 1 — Lock the brand**
   - Create `brand.json` with the schema in Section A.
   - Run `dembrandt` on https://danielpaul.ai (or Danny's site) to extract real tokens. Reconcile with manual.
   - Commit to repo at `/config/brand.json`.

2. **Hour 2 — Build the post-card endpoint**
   - Create `/api/og/post-card.tsx` using the reference in Section E.
   - Build 4 variants: announcement, quote, stat, framework.
   - Add a `/preview` page that renders all 4 with mock data.

3. **Hour 3 — Replace Jarvis's image step**
   - Currently: Jarvis calls a diffusion model and gets a generic AI image.
   - New: Jarvis emits the post-card JSON, calls `/api/og/post-card?...`, gets back the PNG URL, attaches that to the LinkedIn post.
   - Keep diffusion ONLY for hero-photo posts (mark them with `mode: "photo"` in the post spec).

4. **Hour 4 (later that week) — Add quality gate for the photo path**
   - Wire `improved-aesthetic-predictor` as a fal.ai workflow step.
   - Add Real-ESRGAN x4 step.
   - Add re-roll-on-fail logic (max 3 attempts).

5. **Hour 5 (optional) — Train the brand LoRA**
   - Hand-pick 30 reference photos (Danny's existing best-shot photography or a curated mood board).
   - Train via fal.ai flux-2 LoRA fast trainer ($5-15).
   - Use the LoRA token in every PHOTO_MODE Flux prompt.

After step 3, Danny's LinkedIn posts will look agency-grade. Steps 4-5 polish the long tail.

---

## Section J — What NOT to Use (Counter-Recommendations)

- **Do not use raw DALL-E 3 / GPT Image 1.** GPT Image 2 (April 2026) is the better OpenAI model now, but still loses to Flux 2 / Higgsfield Soul on aesthetic quality. Reserve GPT Image 2 for "needs to follow weird instructions exactly" cases only.
- **Do not use Midjourney via API** — there's no official API; the third-party scrapers violate ToS and get banned.
- **Do not use generic "AI image generator" SaaS** (Bannerbear / Placid for AI gen) — they wrap the same models you can call directly, and their templates don't match your brand.
- **Do not generate carousels with diffusion** — they will not be cohesive across slides. Always Satori.
- **Do not skip the aesthetic gate.** It's the single biggest quality lever.
- **Do not let the LLM pick colors free-form.** It will choose teal/orange every time. Lock the palette.

---

## Section K — Cost Snapshot (May 2026 prices)

| Asset | Tool | Cost per image |
|---|---|---|
| LinkedIn post-card | Satori (self-hosted) | $0 (just compute) |
| 10-slide carousel | Satori (looped) | $0 |
| Hero photo via Higgsfield Soul | Higgsfield API | ~$0.04-0.08 |
| Hero photo via Flux 2 [pro] (fal) | fal.ai | ~$0.05 |
| Hero photo via Flux 2 [pro] (kie) | kie.ai | ~$0.025-0.035 |
| Image edit via Nano Banana Pro | Google direct | ~$0.04 |
| Image edit via Nano Banana Pro (kie) | kie.ai | ~$0.02 |
| Real-ESRGAN x4 upscale | self-hosted | $0 |
| Aesthetic score | self-hosted | $0 |
| LoRA brand training (one-time) | fal.ai | ~$5-15 |

A full LinkedIn post costs $0 (Satori card) + maybe one re-roll = effectively free.
A LinkedIn post with a hero photo costs ~$0.05-0.08 incl. upscale and re-roll buffer.
A 10-slide carousel: $0.

---

# Sources

- [vercel/satori](https://github.com/vercel/satori) • [Vercel OG docs](https://vercel.com/docs/og-image-generation) • [Vercel OG launch post](https://vercel.com/blog/introducing-vercel-og-image-generation-fast-dynamic-social-card-images)
- [Black Forest Labs FLUX.2](https://github.com/black-forest-labs/flux2) • [FLUX.2 prompting guide](https://docs.bfl.ml/guides/prompting_guide_flux2) • [FLUX.2 launch](https://bfl.ai/blog/flux-2)
- [Higgsfield Soul 2.0](https://higgsfield.ai/soul-intro) • [Higgsfield CLI](https://github.com/higgsfield-ai/cli) • [Higgsfield JS SDK](https://github.com/higgsfield-ai/higgsfield-js)
- [KIE.AI](https://kie.ai/) • [KIE.AI docs](https://docs.kie.ai/) • [kie-ai-mcp-server](https://github.com/andrewlwn77/kie-ai-mcp-server)
- [Nano Banana / Gemini quickstart](https://github.com/google-gemini/veo-3-nano-banana-gemini-api-quickstart) • [Nano Banana hackathon kit](https://github.com/google-gemini/nano-banana-hackathon-kit) • [gemimg](https://github.com/minimaxir/gemimg)
- [Ideogram 3.0 docs](https://developer.ideogram.ai/ideogram-api/api-overview) • [Ideogram 3.0 features](https://ideogram.ai/features/3.0/)
- [Improved Aesthetic Predictor](https://github.com/christophschuhmann/improved-aesthetic-predictor) • [LAION Aesthetic Predictor](https://github.com/LAION-AI/aesthetic-predictor)
- [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)
- [Flux LoRA fast training](https://fal.ai/models/fal-ai/flux-lora-fast-training) • [ComfyUI-FluxTrainer](https://github.com/kijai/ComfyUI-FluxTrainer) • [Ostris AI Toolkit guide](https://medium.com/diffusion-doodles/how-to-train-a-lora-ostris-ai-toolkit-44216331056e)
- [IP-Adapter Flux](https://github.com/Shakker-Labs/ComfyUI-IPAdapter-Flux) • [XLabs x-flux-comfyui](https://github.com/XLabs-AI/x-flux-comfyui) • [Flux Continuum](https://github.com/robertvoy/ComfyUI-Flux-Continuum)
- [Flux Kontext on fal](https://fal.ai/models/fal-ai/flux-pro/kontext) • [FluxKontextCreator](https://github.com/ShmuelRonen/FluxKontextCreator)
- [Recraft V4 API](https://www.recraft.ai/api) • [Recraft MCP server](https://github.com/BartWaardenburg/recraft-mcp-server)
- [Seedance 2.0 official](https://github.com/bytedance-seedance/seedance-2.0) • [fal Seedance](https://github.com/fal-ai/seedance-2.0-api)
- [carousel-generator](https://github.com/FranciscoMoretti/carousel-generator) • [slidev-theme-linkedin-carousel](https://github.com/Open-reSource/slidev-theme-linkedin-carousel)
- [satori-html](https://github.com/natemoo-re/satori-html) • [takumi (Rust satori-compatible)](https://github.com/kane50613/takumi) • [x-satori (Vue)](https://github.com/Zhengqbbb/x-satori)
- [dembrandt](https://github.com/dembrandt/dembrandt) • [brand-identity-extractor](https://github.com/Geff115/brand-identity-extractor)
- [fal-ai-community/skills](https://github.com/fal-ai-community/skills) • [fal-ai/fal](https://github.com/fal-ai/fal)
- [GPT Image 2 docs](https://developers.openai.com/api/docs/models/gpt-image-2) • [Imagen 4 docs](https://ai.google.dev/gemini-api/docs/models/imagen)
- [AI slop (Wikipedia)](https://en.wikipedia.org/wiki/AI_slop) • [Photorealistic prompting 2026](https://artsmart.ai/blog/ai-image-prompts-photorealistic/)
- [Midjourney camera prompts](https://aituts.com/midjourney-camera-prompts/) • [Midjourney lighting prompts](https://www.aiarty.com/midjourney-prompts/midjourney-lighting-prompts.htm)
- [stevelacey/cardserver (Puppeteer fallback)](https://github.com/stevelacey/cardserver)
