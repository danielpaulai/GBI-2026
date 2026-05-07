# Research Index — Read in This Order

The 13 research docs in this folder document every architectural decision, with reasoning and sources, that led to the canonical build. Read in this order if you're new to the project. Skip the irrelevant ones if you only need a specific topic.

---

## The reading order

### Tier 1 — Canonical (read first)
| # | Doc | What it gives you | When to read |
|---|---|---|---|
| 13 | [13-1000x-repos.md](./13-1000x-repos.md) | The 17 repos that 1000× the build (latest research pass) | First — supersedes earlier repo recommendations |
| 12 | [12-the-100x-additions.md](./12-the-100x-additions.md) | The 100× additions (audio-reactive orb, Opus 4.7 routing, Promptfoo eval gate, kill persona stacking) | Second — current architecture canon |
| 9 | [09-master-plan.md](./09-master-plan.md) | The corrected single-laptop architecture (no operator, CEO + 4 wings, voice + R400 + Streamdeck triggers) | Third — overall architecture |

### Tier 2 — Implementation depth
| # | Doc | What it gives you | When to read |
|---|---|---|---|
| 10 | [10-build-hollywood.md](./10-build-hollywood.md) | The build manual deep version (file structure, deps, code patterns) | When implementing |
| 11 | [11-hollywood-polish.md](./11-hollywood-polish.md) | Audio sourcing, LUT files, motion graphics, Mission Impossible countdown | When polishing |
| 6 | [06-seadance-approach.md](./06-seadance-approach.md) | Why Seedance backdrops are used and how to generate them | When generating backdrops |

### Tier 3 — Background reasoning (reference only)
| # | Doc | What it gives you | When to read |
|---|---|---|---|
| 4 | [04-jarvis-visual-stack.md](./04-jarvis-visual-stack.md) | The 14 FUI rules (3-layer depth, glow falloff, easing curves, neon discipline) — most are now in DESIGN-SYSTEM.md | If you need original sources |
| 3 | [03-jarvis-build-stack.md](./03-jarvis-build-stack.md) | Original agent backend stack (LangGraph, Anthropic, AgentScope) | If extending agent backend |
| 1 | [01-frameworks.md](./01-frameworks.md) | Show-design first principles (Brunson, Hormozi, Eker, Robbins) | If writing presenter script |
| 2 | [02-show-mechanics.md](./02-show-mechanics.md) | 28 reusable show beats | If pacing the talk |

### Tier 4 — Superseded (history only)
These docs document architectural decisions that have been since superseded. Read only for context, never copy from them.

| # | Doc | Why superseded |
|---|---|---|
| 5 | [05-jarvis-demo-flow.md](./05-jarvis-demo-flow.md) | Replaced by doc 09's corrected single-laptop architecture |
| 7 | [07-execution-plan.md](./07-execution-plan.md) | Multi-screen PartyKit plan replaced by single-laptop in doc 09 |
| 8 | [08-master-plan.md](./08-master-plan.md) | Original "6 inline tools" plan replaced by CEO+4-wings in doc 09 |

---

## Quick lookup by topic

| If you need... | Read |
|---|---|
| The full canonical build manual | `BUILD-MASTER.md` (root) |
| Design system (colors, typography, motion, sound) | `docs/DESIGN-SYSTEM.md` |
| The 14 sub-tools in detail | `docs/TOOL-SPECS.md` |
| How triggers map to outputs | `docs/INPUT-OUTPUT.md` |
| Stage choreography (volunteers, beats, recovery lines) | `docs/LIVE_DEMOS.md` |
| The 7 sales beats spine | `docs/STRATEGY.md` |
| Closing lines that earn the $1,497 | `docs/CLOSE_SCRIPT.md` |
| Day 1/2 minute-by-minute run sheets | `docs/DAY1_RUN.md`, `docs/DAY2_RUN.md` |
| The offer stack | `docs/BONUSES.md` |
| Backstage/volunteer briefing | `docs/CREW_BRIEF.md` |
| Implementation patterns (Cursor rules) | `.cursor/rules/*.mdc` |

---

## The single most important rule

**If a UI element is identifiably "an AI avatar," it doesn't ship.** JARVIS is voice + UI. The Iron Man test: would Tony Stark's JARVIS look like that? If JARVIS doesn't have it, neither does GBI 2026.

This rule supersedes any contradicting suggestion in any earlier doc.
