# GBI 2026 — Tool Specs (14 Sub-Tools, Detailed Inputs/Outputs)

This document specs every one of the 14 sub-tools in the 4 wings: what it takes as input, what it outputs, what backend powers it, what fallback plays in fake mode, what stage moment it lives in, and what the audience sees.

When you build a sub-tool, read its spec here first.

---

## CMO Wing (Marketing) — 4 sub-tools

Color accent: Cyan `#00d4ff`. Backed by `ai-cmo` skill + `caption-writer` skill + voice-locked stack.

### 1. 📸 Instagram Creator
| Field | Spec |
|---|---|
| **Trigger** | Voice "run instagram" / R400 button / keyboard `i` |
| **Inputs** | Topic string (from audience suggestion or volunteer voice) |
| **Backend (live)** | Anthropic Sonnet 4.5 (caption) + fal.ai Flux Pro (image) |
| **Latency target** | ~30s |
| **Visible output** | Top 1/3: prompt streams in massive text. Middle left: square Flux Pro render with cinematic radial progress bar (cyan → amber). Middle right: Claude streams caption with `flowtoken` blur-in. Bottom: rendered IG card mockup (image + caption + hashtags + heart icon) |
| **Audio** | progress beep × 3 during render, "ding" on completion |
| **Fake mode (Cmd+F)** | Plays `/public/fallback/cmo-instagram.mp4` (~30s of perfect run) |
| **Safe mode** | Displays `/public/safe/cmo-instagram-still.png` (last frame) |
| **Acceptance criteria** | Promptfoo eval ≥8.5 against 20 reference IG posts in Danny's voice |
| **Stage line that lands** | *"That post took longer to read than to make."* |

### 2. 💼 LinkedIn Post
| Field | Spec |
|---|---|
| **Trigger** | Voice "run linkedin" / `l` |
| **Inputs** | Topic string |
| **Backend (live)** | Anthropic Sonnet 4.5 (interleaved thinking) + `caption-writer` skill |
| **Latency target** | ~20s |
| **Visible output** | Top: voice rules visible ("Hook: bold. Story: ONE sentence. CTA: question."). Middle: 3-phase reveal — Hook fades in, Story streams below, CTA materializes last. Right rail: voice-match score bars (Hook strength, Voice match, Engagement potential) fill in real-time. Bottom: rendered LinkedIn post card (black bg, white text, profile pic, "X likes • Y comments") |
| **Audio** | Phase-completion bleep × 3 |
| **Fake mode** | `/public/fallback/cmo-linkedin.mp4` |
| **Behavioral constraint** | Open with hook question, reference current trend, end with CTA |
| **Acceptance** | Promptfoo eval ≥8.5 — must "sound like Danny" per voice rubric |
| **Stage line** | *"You'll spend 20 minutes on the next one. Claude spent 18 seconds on this one."* |

### 3. 📰 Article + Inline Images
| Field | Spec |
|---|---|
| **Trigger** | Voice "run article" / `a` |
| **Inputs** | Topic string |
| **Backend (live)** | Vercel AI SDK 5 `streamUI` + Imagen via fal.ai |
| **Latency target** | ~90s |
| **Visible output** | Full-screen tldraw canvas (dark mode). Article streams paragraph by paragraph, top to bottom. Mid-paragraph 1: `<GeneratedImage>` RSC fires → image renders with progress bar → fades into article between paragraph 1 and paragraph 2. Same for paragraph 2 → image 2. Final: 3-paragraph article with 2 inline images |
| **Audio** | Typewriter clack on every word, "ding" when image lands |
| **Fake mode** | `/public/fallback/cmo-article.mp4` (90s) |
| **Stage line** | *"This is what your blog used to take 3 hours and a stock-photo subscription. 90 seconds. Free images, your voice, ready to post."* |

### 4. 🎬 Video Generator
| Field | Spec |
|---|---|
| **Trigger** | Voice "run video" / `v` |
| **Inputs** | Scene description |
| **Backend (live)** | fal.ai Nano Banana 2 (image, 15s) → fal.ai Seedance 2.0 fast (5s clip, 45s) |
| **Latency target** | ~75s — use Mission Impossible countdown to fill the wait |
| **Visible output** | Phase 1 (15s): Nano Banana 2 generates input image — radial progress bar, image materializes. Phase 2 (45s): fal.ai Seedance generates 5s video — timeline-style cyan progress fill + Mission Impossible countdown layer (decrypt status text + radial timer + waveform). Phase 3: clip plays full-screen, looping, cinema black bars |
| **Audio** | Render hum during progress, dramatic "drop" on clip play |
| **Fake mode** | `/public/fallback/cmo-video.mp4` |
| **Failure recovery line** | *"Let me show you the one we made earlier in the green room — same prompt, same outcome."* |
| **Stage line** | *"Three years ago that shot cost $150,000 and took two weeks. Tonight it cost six dollars and took a minute."* |

---

## CRO Wing (Sales/Revenue) — 4 sub-tools

Color accent: Amber `#ffa500`. Backed by `ai-cro` skill + `cold-outreach-sequence` skill.

### 5. 🎯 Lead Scraper
| Field | Spec |
|---|---|
| **Trigger** | Voice "run leads" / `1` |
| **Inputs** | Search query (e.g., "SaaS founders in Singapore") |
| **Backend (live)** | `microsoft/playwright-mcp` (visible Microsoft brand) + Stagehand natural-language → Playwright actions + Apify Apollo enrichment |
| **Latency target** | ~45s |
| **Visible output** | Top 1/3: search query MASSIVE ("SaaS FOUNDERS IN SINGAPORE"). Middle 2/3: Hyperbrowser/Playwright iframe goes full-screen — audience watches actual Chromium navigate to LinkedIn Sales Navigator, type, click. Cursor highlighted with cyan ring overlay (Playwright `screencast.showOverlay()`). Right rail: lead rows drop in one by one Bloomberg-ticker style: name, title, company, "verified email ✓". Counter top-right: 1 → 12 → 28 → 50 leads |
| **Audio** | "Match" bleep per lead row drop |
| **Fake mode** | `/public/fallback/cro-leads.mp4` |
| **Pre-warm** | Hyperbrowser session started 5 min before stage with `keepAlive: true` |
| **Stage line** | *"That's 50 people you can email tomorrow. The AI found them in 45 seconds. Your sales team needed three days for that."* |

### 6. ✉️ Cold Email Writer
| Field | Spec |
|---|---|
| **Trigger** | Voice "run email" / `2` |
| **Inputs** | LinkedIn URL or name (passed from Lead Scraper or audience shout) |
| **Backend (live)** | Hyperbrowser (profile pull) + Anthropic Sonnet 4.5 + `email-writer-taki-hormozi` skill |
| **Latency target** | ~25s |
| **Visible output** | Profile data scrolls in (visible, fast). AI streams personalized email referencing real details (job title, recent post, company). Side-by-side reveal: AI message (left) vs. generic templated message (right) |
| **Audio** | Streaming text typewriter |
| **Fake mode** | `/public/fallback/cro-email.mp4` |
| **Behavioral constraint** | Lead with number, second sentence is the ask, no hedging words |
| **Stage line** | *"That message just took 20 seconds. The generic version on the right took your VA an hour. Both will land in someone's inbox tomorrow morning. Only one will get a reply."* |

### 7. 📞 Cold Call Script
| Field | Spec |
|---|---|
| **Trigger** | Voice "run script" / `3` |
| **Inputs** | Persona description |
| **Backend (live)** | Anthropic Sonnet 4.5 + `closing-playbook` + `taki-moore-email` skills |
| **Latency target** | ~20s |
| **Visible output** | Streaming script with [PAUSE] cues, objection-handling branches highlighted in amber |
| **Fake mode** | `/public/fallback/cro-script.mp4` |
| **Stage line** | *"This script handles three objections you haven't even thought of yet."* |

### 8. 🔄 Follow-up Sequence
| Field | Spec |
|---|---|
| **Trigger** | Voice "run sequence" / `4` |
| **Inputs** | Initial scenario |
| **Backend (live)** | Anthropic Sonnet 4.5 + Hormozi/Taki email skills |
| **Latency target** | ~30s |
| **Visible output** | 5-email drip campaign generates as a vertical timeline (Day 1 → Day 3 → Day 7 → Day 14 → Day 30) |
| **Fake mode** | `/public/fallback/cro-sequence.mp4` |

---

## COO Wing (Operations) — 3 sub-tools

Color accent: Cyan-violet `#7eccff`. Backed by `ai-coo` + `purely-personal:operations-engine` + `purely-personal:leadership-engine` skills.

### 9. 📊 Weekly Focus Report
| Field | Spec |
|---|---|
| **Trigger** | Voice "run weekly" / `q` |
| **Inputs** | Pull live from Stripe MCP + Calendar MCP + Slack MCP + Notion MCP |
| **Backend (live)** | Anthropic Sonnet 4.5 + parallel MCP tool calls + `purely-personal:leadership-engine` skill |
| **Latency target** | ~40s |
| **Visible output** | 3-column war room: Calendar pulls (left), Stripe data (middle), Slack/Notion activity (right). Cards fly in. Then Claude synthesizes "3 priorities for the week" with rationale. Each priority has a number, a one-line description, an owner, and a time estimate |
| **Audio** | "Data ping" per MCP tool returning |
| **Fake mode** | `/public/fallback/coo-weekly.mp4` |
| **Behavioral constraint** | Numbered steps only, time estimate per step, one named owner per step |
| **THIS IS THE SHOWSTOPPER OUTPUT (Act 3)** | The single most important sub-tool output. Use Opus 4.7 with extended thinking + task budgets. CEO synthesis pattern: find conflict between wings → resolve → surface non-obvious play |

### 10. 📈 Daily 3-Priority
| Field | Spec |
|---|---|
| **Trigger** | Voice "run daily" / `w` |
| **Inputs** | Today's calendar + recent activity feeds |
| **Backend (live)** | Anthropic Sonnet 4.5 + Calendar MCP + activity feeds |
| **Latency target** | ~25s |
| **Visible output** | This morning's 3 things to do, in order, with reasoning. Each priority animates in with a checkbox |
| **Fake mode** | `/public/fallback/coo-daily.mp4` |

### 11. 🔍 Process Auditor
| Field | Spec |
|---|---|
| **Trigger** | Voice "run audit" / `e` |
| **Inputs** | Recent activity (calendar + Slack + email) |
| **Backend (live)** | Anthropic Sonnet 4.5 + `purely-personal:operations-engine` skill |
| **Latency target** | ~35s |
| **Visible output** | Scans activity for bottlenecks, suggests SOPs. Output: bottleneck identified → recommended SOP drafted in real time |
| **Fake mode** | `/public/fallback/coo-audit.mp4` |

---

## CFO Wing (Finance) — 3 sub-tools

Color accent: Amber-gold `#ffcc44`. Backed by `ai-cfo` + `purely-personal:cash-engine` skill. **WING REVEAL IN ACT 3 ONLY** — stays dim through Acts 1 & 2.

### 12. 💰 Cash Forecast
| Field | Spec |
|---|---|
| **Trigger** | Voice "run cashflow" / `r` |
| **Inputs** | Stripe MCP data (last 90 days revenue + recurring subscriptions) |
| **Backend (live)** | Anthropic Sonnet 4.5 + Stripe MCP (existing in your stack) + Tremor v4 chart components |
| **Latency target** | ~35s |
| **Visible output** | Tremor v4 line chart: 90-day historical revenue + 90-day forecast (dotted line). KPI cards: MRR, ARR, churn rate, runway months. Anomaly callouts (e.g. "spike on Apr 14 — Black Friday promo") |
| **Fake mode** | `/public/fallback/cfo-cashflow.mp4` |
| **Behavioral constraint** | Lead with number, line 2 = variance vs plan, line 3 = one decision required |
| **Stage line** | *"That report would cost $400 a month from a contractor. It just cost 12 cents."* |

### 13. 📉 Pricing Optimizer
| Field | Spec |
|---|---|
| **Trigger** | Voice "run pricing" / `t` |
| **Inputs** | Product/service description + current price + competitor data (via Apify) |
| **Backend (live)** | Anthropic Sonnet 4.5 + Apify competitor pricing scraper + `pricing-strategy` skill |
| **Latency target** | ~30s |
| **Visible output** | Competitor pricing matrix (3-column comparison). Optimal price recommendation with rationale. Predicted revenue impact at each price point (chart) |
| **Fake mode** | `/public/fallback/cfo-pricing.mp4` |

### 14. 🧾 P&L Snapshot
| Field | Spec |
|---|---|
| **Trigger** | Voice "run pnl" / `y` |
| **Inputs** | Stripe MCP financial data |
| **Backend (live)** | Stripe MCP + Anthropic synthesis + Tremor v4 dashboard |
| **Latency target** | ~30s |
| **Visible output** | Bloomberg Terminal-style P&L: revenue (top), expenses (middle), net (bottom). All numbers in tabular-nums monospace. Variance vs. last month in amber for negatives, cyan for positives. One-line Claude summary at bottom |
| **Fake mode** | `/public/fallback/cfo-pnl.mp4` |
| **UI library** | Tremor v4 + Fortress template (Bloomberg Terminal aesthetic) |

---

## Cross-cutting requirements (every sub-tool)

### Modes (every tool branches on `context.mode` from XState)
- **`live`** — real APIs, primary path
- **`fake`** — pre-rendered MP4 plays, audience can't tell difference
- **`safe`** — last-frame PNG displayed instantly (no animation, no audio)

### Acceptance criteria (every tool, before stage)
- [ ] Real API path works end-to-end in <2 minutes worst case
- [ ] Fake mode tested — Cmd+F mid-show plays the right MP4
- [ ] Promptfoo eval suite scores ≥8.5 against 20 reference outputs
- [ ] Voice trigger works in 70dB ambient noise test
- [ ] R400 / Streamdeck / keyboard fallback tested
- [ ] Behavioral constraint enforced in system prompt
- [ ] Voice-locked: cached voice corpus + de-ai-ify post-gen gate
- [ ] Pre-bound to exactly 4 tools (no tool sprawl)

### Voice-locked agent stack (mandatory per wing)
1. **Cached voice corpus** — 20-30 of Danny's actual posts/scripts in cached system prompt
2. **Banned-phrase + required-pattern lint** — `de-ai-ify` + `tweet-draft-reviewer` skills as POST-GENERATION GATE
3. **Style-rubric LLM judge** — second Claude call scores draft against 8 voice rules. If <7, regenerate with failure as feedback

### Model routing (Tier 1 from doc 12)
- **Haiku 4.5** → routing/classification
- **Sonnet 4.5** with `interleaved-thinking-2025-05-14` beta header → 4 wings
- **Opus 4.7** with task budgets → CEO synthesis ONLY

### KILL persona stacking
Don't write "you are Ann Handley + Russell Brunson + Joanna Wiebe combined." PRISM paper proves this damages accuracy. Use Expert Framework prompts instead — describe the methodology, not the person.

### Few-shot is mandatory
Every wing's cached system prompt includes 3-5 hand-curated reference examples. Single biggest free quality lift.

### Pre-warming
Fire dummy call on each wing 30s before its act. Caches stay hot.

### Streaming with visible "thinking" UI
Even if agent takes 25s, streaming + tool-call activity log makes it feel like 8s. The audience watches the work happen.
