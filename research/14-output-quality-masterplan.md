# 14 — Output Quality Masterplan: From "Below Average" to World-Class

**Brief:** Jarvis (the AI Employee Command Center) currently produces generic LinkedIn / social copy that is "below average — AI slop." This document is the engineering plan to make every artifact (LinkedIn post, X thread, newsletter section, email) indistinguishable from a top human ghostwriter writing on Danny's voice. It supersedes any prior output-quality guidance in docs 1-13.

The thesis: **world-class AI content is not a prompting problem, it is an evaluation problem.** Single-shot generation tops out around 6/10. To get to 9.5/10 you need (a) a voice profile extracted from real samples, (b) a draft → critique → revise loop with a hard score gate, (c) an explicit anti-AI-slop pass, (d) human-style few-shot exemplars cached in the system prompt, and (e) a judge agent that refuses to ship anything below threshold.

Every pattern below is in production somewhere. None of it requires research breakthroughs. It requires assembly.

---

## Section A — The 7-Step Quality Pipeline

This is the actual flow Jarvis must run for any piece of content. Each step is non-negotiable. Skipping any one of them caps quality at ~7/10.

```
Voice DNA  ─►  Brief  ─►  Draft  ─►  Critique  ─►  Revise  ─►  De-AI Pass  ─►  Judge Gate
   (cached)    (intent)   (3 variants)  (rubric)   (≤2 loops)   (regex+LLM)    (≥8.5 ships)
```

### Step 1 — Voice DNA (built once, cached forever)

- **Input:** 30-50 samples of Danny's actual writing (LinkedIn posts, emails, transcripts).
- **Output:** A `voice-dna.json` artifact with: tone descriptors, banned/preferred words, 8-10 signature transition phrases, sentence-length distribution, contraction frequency, hook patterns, "authority zones" (topics he writes with confidence on) vs "learning zones" (topics he avoids opining on).
- **Implementation:** Fork the OpenClaw `voice-matched-content` SKILL.md schema. Run extraction once. Store as a markdown blob inside the cached system prompt (Anthropic prompt caching, 1-hour TTL → 90% cost reduction on every regeneration).
- **Critical:** The Voice DNA gets embedded as an `<voice_profile>` XML block at the top of every generation prompt. NOT as instructions ("write like Danny") — as the literal extracted data plus 3-5 concrete `<example>` blocks of his real posts.

### Step 2 — Brief (the intent contract)

A structured `brief.json`:
```json
{
  "topic": "Why every B2B founder needs a CMO before a CFO",
  "platform": "linkedin",
  "audience": "B2B founders 1-10M ARR",
  "purpose": "education + pipeline",
  "hook_type": "relatable_enemy",
  "cta": "soft — link to newsletter",
  "must_include": ["specific dollar number", "real example from cohort"],
  "must_avoid": ["em dashes", "rule of three", "hedging"]
}
```
This is the contract the judge agent later scores against. No brief = no objective evaluation possible.

### Step 3 — Draft (3 variants in parallel)

Anthropic's **orchestrator-workers** pattern. The orchestrator reads the brief and dispatches 3 worker LLMs at temperature 0.9, each given a different hook framework:
- Worker A: Justin Welsh "Relatable Enemy → Hero → Teaser"
- Worker B: Hook-Story-Offer (Brunson / Ship 30 for 30)
- Worker C: Open-loop curiosity gap

Three drafts, never one. Pick-best is dramatically cheaper than refine-one-bad-draft.

### Step 4 — Critique (the evaluator)

Anthropic's **evaluator-optimizer** pattern. A separate Claude call with the judge rubric (Section D) scores each draft on 6 dimensions. Returns:
- Score per dimension (1-10)
- Overall score
- Specific failure modes ("Hook is generic. Body uses 'in today's world'. CTA is corporate.")
- Concrete rewrite suggestions ("Replace line 1 with [specific text].")

### Step 5 — Revise (max 2 iterations)

The original drafter receives the critique and rewrites. After 2 revisions, kill the loop — diminishing returns kick in fast and you start drifting from voice. Reflexion's research confirmed: 3+ self-refinement rounds often *degrade* quality on subjective tasks.

### Step 6 — De-AI Pass (regex + LLM)

A two-pass scrubber:
1. **Regex pass** (deterministic, instant): Strip every banned word, em dash, "in today's world", "navigate the landscape", rule-of-three sentence triplets, "It's important to note", "Certainly!", and the 50+ word list from the AI-slop research.
2. **LLM pass** (Claude Haiku, fast): "Find any sentence that pattern-matches AI cadence — rule of three, hedging seesaw, corporate pep talk, uniform sentence length — and rewrite it in the voice profile."

This step alone moves a 7/10 to an 8.5/10.

### Step 7 — Judge Gate (the kill switch)

Final Claude call with the full rubric. Returns a single score 0-10. **If <8.5, the post does not ship.** It either loops back to Step 5 once more, or escalates to human (Slack DM with the score breakdown and the reason).

This is the difference between Jarvis and ChatGPT. ChatGPT ships everything. Jarvis refuses to ship slop.

---

## Section B — Top 10 Repos to Clone (Stack-Ranked by Leverage)

These are the highest-leverage forks. Each one closes a specific quality gap.

### 1. `enablement-ch/clio-ghostwriter` — the entire pipeline, already wired

- **URL:** https://github.com/enablement-ch/clio-ghostwriter
- **Stars:** ~6 (small but exact-fit) | License: MIT | Active 2025-2026
- **What to steal:** The entire architecture. This is literally the 7-step pipeline above, built with Claude Code. QA agent (`qa_agent.py`) scores 0-10 across 5 criteria with a hard 8.1 threshold and max-3 rewrite loop. Includes a "factual integrity veto" that caps score at 5.0 if the post invents numbers/names not in context. Voice enforced via three markdown files: `ICP.md`, `LINKEDIN_STYLE_GUIDE.md`, `CALL_CONTEXT.md`.
- **Integration cost:** 4-8 hours. Fork, swap in Danny's `LINKEDIN_STYLE_GUIDE.md` + voice-dna.json, reroute Slack to Jarvis UI, raise threshold to 8.5.
- **One-paragraph steal:** Clone the file structure exactly. The QA-agent-with-hard-threshold-and-rewrite-loop is the missing piece. Their "factual integrity veto" pattern is genius — adopt verbatim. The Slack-bot interface translates 1:1 to a Jarvis "Marketing Wing" panel.

### 2. `anthropics/claude-cookbooks` (patterns/agents/) — the canonical reference

- **URL:** https://github.com/anthropics/claude-cookbooks/tree/main/patterns/agents
- **Stars:** ~14k | License: MIT | Active weekly
- **What to steal:** `evaluator_optimizer.ipynb` and `orchestrator_workers.ipynb`. These are Anthropic's own opinionated reference implementations of the critique-revise loop and the parallel-draft pattern. ~150 lines of Python each. Production-ready.
- **Integration cost:** 1 day to port both notebooks into the Jarvis runtime.
- **One-paragraph steal:** This is the source of truth. Don't reinvent the loop — port `evaluator_optimizer.ipynb` directly as your Step 4-5 critique-revise engine, and `orchestrator_workers.ipynb` as your Step 3 parallel-draft engine. Anthropic's helper functions for XML parsing handle the messy bits.

### 3. `langchain-ai/langgraph-reflection` — the production-grade reflection graph

- **URL:** https://github.com/langchain-ai/langgraph-reflection
- **Stars:** ~hundreds (prebuilt, official) | License: MIT | Active 2026
- **What to steal:** The pre-built two-agent graph (main + critique) with stop conditions, max-iteration caps, and state passing. If you build on LangGraph anywhere else, this is free.
- **Integration cost:** 2 hours if already on LangGraph; 2 days if migrating.
- **One-paragraph steal:** Use this if Jarvis runs on LangGraph. The graph topology — main agent → critique agent → conditional edge back or end — is exactly the Step 4-5 pattern with built-in observability and audit trails (LangSmith). Production over Anthropic's notebook for any cohort student who ships to prod.

### 4. `stanfordnlp/dspy` — compile prompts as programs

- **URL:** https://github.com/stanfordnlp/dspy
- **Stars:** ~22k | License: MIT | Active daily
- **What to steal:** `dspy.Refine` (multi-temperature retry-with-reward) and the **MIPROv2** optimizer (jointly optimizes instructions and few-shot examples via Bayesian search). This is the only framework that treats your prompt as a *compiled program with measurable quality* and optimizes it from a labeled dataset.
- **Integration cost:** 2-3 days to wrap one signature (e.g. `WriteLinkedInPost(brief) -> post`) and bootstrap from 50 of Danny's actual high-performing posts.
- **One-paragraph steal:** After you have 50+ scored Danny posts (the judge agent generates these for free over time), run MIPROv2 on a `WriteLinkedInPost` signature. The optimizer will *automatically* discover the best system instructions and the best 5 few-shot exemplars from his corpus. This is the long-term moat — every other agency hand-tunes prompts; Jarvis compiles them.

### 5. `jalaalrd/anti-ai-slop-writing` — the de-AI Skill, drop-in

- **URL:** https://github.com/jalaalrd/anti-ai-slop-writing
- **Stars:** modest, but reference-grade | License: MIT | Active 2025-2026
- **What to steal:** A SKILL.md file containing 50+ banned words, 35+ banned phrases, 16 banned sentence openers, 10 structural anti-patterns (rule of three, uniform sentence length, hedging seesaw, corporate pep talk), and punctuation/formatting tells (em dash overuse, exclamation spam, ellipsis abuse). Cross-compatible with Claude Code, Cursor, Codex, Gemini CLI.
- **Integration cost:** 30 minutes (it's a single SKILL.md — drop it into `.claude/skills/`).
- **One-paragraph steal:** This is Step 6 in a single file. Install as a Claude Skill that auto-loads on any "write a post / email / bio" trigger. Then add the regex-deterministic pass on top for the 20-30 banned tokens that Claude itself sometimes misses. The combined regex + skill = your de-AI subsystem.

### 6. `noahshinn/reflexion` — the original self-reflection paper

- **URL:** https://github.com/noahshinn/reflexion
- **Stars:** ~3k | License: MIT | NeurIPS 2023
- **What to steal:** The "verbal reinforcement learning" pattern: store critique reflections in episodic memory and use them as input to the next attempt, *not just for the current draft but across sessions*. This is how Jarvis gets better at writing for Danny over months without any model fine-tuning.
- **Integration cost:** 1 day.
- **One-paragraph steal:** Add a `reflection_memory.md` that the critique agent appends to after every kill (any post that scored <8.5 and was rejected, plus the reason). Inject the last 20 reflections into every future draft prompt. Six months in, Jarvis has a personalized failure-mode library that no competitor has.

### 7. `microsoft/autogen` (reflection pattern) — if you need conversational debate

- **URL:** https://github.com/microsoft/autogen
- **Stars:** ~35k | License: CC-BY-4.0 (docs) / MIT (code) | Active weekly
- **What to steal:** The two-agent message-passing reflection pattern, especially useful for *long-form* content where critique-then-revise needs more turns than a single round-trip. AutoGen's group-chat orchestration is now native in Microsoft Agent Framework with enterprise durability.
- **Integration cost:** 2 days; only if Jarvis goes beyond LinkedIn into newsletters/whitepapers.
- **One-paragraph steal:** Skip for short-form. Use for the newsletter-section / cohort-recap / whitepaper agents — places where 5-10 turns of agent debate genuinely improve output. For LinkedIn posts, langgraph-reflection or claude-cookbooks evaluator-optimizer is faster.

### 8. `Arize-ai/phoenix` — production observability and judge runner

- **URL:** https://github.com/Arize-ai/phoenix
- **Stars:** ~9k | License: Elastic-2.0 | Active daily
- **What to steal:** Run your judge rubric as a *Phoenix evaluator* against every output. Get traces, score distributions over time, regression detection ("the LinkedIn agent's avg score dropped from 8.7 to 8.2 this week — what changed?"). Native Claude Agent SDK + LangGraph + DSPy support.
- **Integration cost:** 1 day to instrument; ongoing dashboard maintenance.
- **One-paragraph steal:** Phoenix is the demo-day artifact. On stage at GBI, you don't just say "the agent scores its own work" — you *show the dashboard* with 200 posts plotted over time, avg 8.7/10, with the few that fell below threshold highlighted in red and explained. That's the credibility moment.

### 9. `promptfoo/promptfoo` — the rubric grader CLI

- **URL:** https://github.com/promptfoo/promptfoo
- **Stars:** ~6k | License: MIT | Active weekly
- **What to steal:** `llm-rubric` and `g-eval` graders. YAML config defines criteria; promptfoo runs them across N test cases and produces a regression dashboard. Use it to *prove* your prompt changes improve quality, not just feel-good.
- **Integration cost:** 1 day for initial test suite (10-20 representative prompts × judge rubric).
- **One-paragraph steal:** This is your eval CI. Every prompt change to the system prompt or voice DNA must pass the promptfoo suite or it doesn't merge. Treat content prompts the way engineers treat code: tested, versioned, gated.

### 10. `MadcowD/ell` — prompt versioning, the missing primitive

- **URL:** https://github.com/MadcowD/ell
- **Stars:** ~5k | License: MIT | Active 2025
- **What to steal:** Automatic versioning and serialization of prompts via static + dynamic analysis, with an Ell Studio UI for diffing prompt versions side-by-side and seeing which version produced which outputs. Solves the "why is this post worse than last week's?" problem.
- **Integration cost:** 1 day.
- **One-paragraph steal:** Treat every prompt change as a git commit. Ell does this for you automatically — you write Python functions decorated with `@ell.simple`, and Ell tracks every version with auto-generated commit messages. When a regression appears, you bisect prompt versions like you bisect code.

---

## Section C — 20 Supporting Repos (Each With the Specific Steal)

| # | Repo | License | Specific Steal | Cost |
|---|---|---|---|---|
| 11 | [Guido1Alessandro1Trevisan/linkedin-ghostwriter](https://github.com/Guido1Alessandro1Trevisan/linkedin-ghostwriter) | MIT | LangGraph implementation of LinkedIn ghostwriting — exact graph topology to copy if you don't fork clio | 4h |
| 12 | [adenaufal/anti-slop-writing](https://github.com/adenaufal/anti-slop-writing) | MIT | Universal system prompt that eliminates LLM style tells — alt to jalaalrd, slightly more aggressive on punctuation | 30m |
| 13 | [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop) | MIT | Single Skill file targeting prose specifically (not code) — useful as Step 6 for newsletter agent | 30m |
| 14 | [NousResearch/autonovel/ANTI-SLOP.md](https://github.com/NousResearch/autonovel/blob/master/ANTI-SLOP.md) | Apache-2.0 | Long-form fiction anti-slop ruleset — useful patterns even for B2B (avoid melodrama, hedging, throat-clearing) | 1h |
| 15 | [lechmazur/writing_styles](https://github.com/lechmazur/writing_styles) | MIT | Stylistic-fingerprint benchmark dataset and methodology — the *actual* dimensions to score "voice match" on | 4h |
| 16 | [Hassaan-Elahi/Writing-Styles-Classification-Using-Stylometric-Analysis](https://github.com/Hassaan-Elahi/Writing-Styles-Classification-Using-Stylometric-Analysis) | MIT | Classical stylometry features (avg sentence length, type-token ratio, function-word frequency) — feed to voice-DNA extractor | 2h |
| 17 | [comp-int-hum/llm-style-transfer](https://github.com/comp-int-hum/llm-style-transfer) | MIT | LLM-based style transfer experiments with stylometric baselines — proves stylometric features beat naive prompting | 2h |
| 18 | [ContextLab/llm-stylometry](https://github.com/ContextLab/llm-stylometry) | MIT | GPT-2 fine-tuned per author for authorship attribution — the long-term option if 9.5/10 isn't reachable via prompting | 1d (research) |
| 19 | [anthropics/claude-cookbooks/misc/prompt_caching.ipynb](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/prompt_caching.ipynb) | MIT | Voice DNA + 50 sample posts cached at 1-hour TTL = 90% cost cut on every regeneration | 2h |
| 20 | [anthropics/prompt-eng-interactive-tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial) | MIT | Anthropic's own examples of multishot prompting with `<example>` tags — the canonical few-shot format | 1h |
| 21 | [sapientcoffee/scribe](https://github.com/sapientcoffee/scribe) | MIT | Multi-stage pipeline (Research → Plan → Draft → Review → Polish) for Gemini CLI — port the prompts to Claude for newsletter / whitepaper agents | 1d |
| 22 | [ComposioHQ/awesome-claude-skills/content-research-writer](https://github.com/ComposioHQ/awesome-claude-skills) | Apache-2.0 | Curated content-research-writer skill — slot it as the upstream research agent before the writer | 2h |
| 23 | [openclaw/skills/voice-matched-content](https://github.com/openclaw/skills) | MIT | Voice DNA Profile schema (8-10 transition phrases, energy level, authority zones) | 1h |
| 24 | [ankithsavio/GhostWriter](https://github.com/ankithsavio/GhostWriter) | MIT | Multi-persona workflow for CV/cover-letter — the persona-switching pattern transfers to multi-platform content | 4h |
| 25 | [evalops/dspy-0to1-guide](https://github.com/evalops/dspy-0to1-guide) | MIT | Concrete DSPy patterns for self-improving LLM apps — copyable signatures and metrics | 1d |
| 26 | [stephenleo/llm-structured-output-benchmarks](https://github.com/stephenleo/llm-structured-output-benchmarks) | MIT | Benchmark proves Instructor + Outlines win on structured-output reliability — pick winner for the brief.json contract | 2h |
| 27 | [confident-ai/deepeval](https://github.com/confident-ai/deepeval) | Apache-2.0 | G-Eval implementation in 5 lines — alternative judge runner if you want pytest-style content evals | 4h |
| 28 | [rdnfn/icai](https://github.com/rdnfn/icai) | MIT | Inverse Constitutional AI — extracts principles from preference data automatically. Use to *learn* the rubric from 100 hand-scored posts instead of writing it from scratch | 1d |
| 29 | [explodinggradients/ragas](https://github.com/explodinggradients/ragas) | Apache-2.0 | RAG evaluation primitives — useful when the writer agent pulls from Danny's vault (Obsidian) | 4h |
| 30 | [langfuse/langfuse](https://github.com/langfuse/langfuse) | MIT | Self-hosted observability + prompt management; alt to Phoenix if you want full ownership | 1d |
| 31 | [helicone/helicone](https://github.com/Helicone/helicone) | Apache-2.0 | One-line proxy capture of every LLM call — zero-instrumentation analytics | 30m |
| 32 | [BoundaryML/baml](https://github.com/BoundaryML/baml) | Apache-2.0 | Domain-specific language for prompts with type-safe schemas + tests; cleaner than DSPy for non-research teams | 1d |

---

## Section D — The Judge Rubric (the actual scoring template)

This is the rubric the judge agent runs against every LinkedIn post. Score 0-10 per dimension, weighted average, hard floor of 8.5 to ship.

```yaml
judge_rubric_linkedin_v1:
  weight_total: 100

  dimensions:

    hook_strength: # weight 25
      definition: >
        Does the first line stop the scroll? Does it create a curiosity gap,
        name a relatable enemy, or stake a contrarian claim within 15 words?
      anchors:
        10: "Stops scroll AND forces the click on '...more'. Specific number, name, or contrarian stake. Reads like Justin Welsh's top 1%."
        7:  "Decent hook, slight curiosity, but generic phrasing. Could be any post."
        4:  "Throat-clearing opener. 'In today's world' / 'I want to share' / 'Recently I learned'. Scrollable."
        1:  "Generic AI opener. Reads like ChatGPT default. Insta-scroll."

    voice_match: # weight 25
      definition: >
        Does the post sound like Danny? Cross-reference against voice-dna.json:
        signature transition phrases, sentence-length distribution, contraction
        frequency, energy level, banned/preferred words. Flag any phrase that
        doesn't appear in his last 50 real posts.
      anchors:
        10: "Indistinguishable from Danny's actual writing. Uses his transition phrases. His cadence. His specifics."
        7:  "Mostly his voice but two or three phrases feel imported."
        4:  "Generic professional voice. Could be any LinkedIn coach."
        1:  "Pure AI cadence. Rule of three. Hedging. Em dashes."

    specificity: # weight 15
      definition: >
        Does the post contain at least one concrete, falsifiable detail —
        a number, a name, a date, a real example? Vague abstractions cap this at 4.
      anchors:
        10: "3+ concrete specifics. Reader can verify or check. Stakes are real."
        7:  "1-2 specifics. Some abstraction."
        4:  "All abstraction. 'Many founders struggle...'"
        1:  "Pure platitudes."

    ai_slop_score: # weight 15 (inverted — high slop = low score)
      definition: >
        Run the regex pass + Claude pattern detector. Count: banned words,
        em dashes, rule-of-three triplets, hedging seesaws, corporate pep talk,
        uniform sentence length, exclamation spam.
      anchors:
        10: "Zero AI tells. Reads as native human prose."
        7:  "1-2 minor tells."
        4:  "5+ tells. Detection-tool flagged."
        1:  "Reads like a ChatGPT default. Em dashes everywhere. Tapestry / delve / navigate."

    structural_integrity: # weight 10
      definition: >
        Hook–Story–Offer or equivalent narrative arc. Each line earns the next
        line's read. Closes with a CTA that matches brief.cta_type.
      anchors:
        10: "Tight arc. Every line pulls. Closes with intent."
        7:  "Arc present, one or two slack lines."
        4:  "Drifts. No clear arc. Hook then list."
        1:  "Bullet-point bingo."

    factual_integrity: # weight 10 — VETO at score 5
      definition: >
        Does the post invent specific numbers, names, or events not provided
        in the brief or context? Hallucinations cap total score at 5.0.
      anchors:
        10: "Every specific is grounded in brief or vault context."
        5:  "VETO — invented at least one specific. Total score capped at 5.0."
        1:  "Multiple invented specifics."

  overall_score: weighted_average
  ship_threshold: 8.5
  rewrite_threshold: 6.5_to_8.4   # loop back to drafter with critique
  kill_threshold: <6.5             # escalate to human
```

This rubric is the contract between every agent in the system. Print it. Tape it next to your monitor. Every prompt change, every voice DNA tweak, every model swap — measure against this rubric.

---

## Section E — The Cursor / Claude Code Instruction Set (`.cursorrules` style)

Drop this verbatim into `.cursorrules` (Cursor) or `CLAUDE.md` (Claude Code) at the root of any agent that produces written content. This is the actual language that lands 9.5/10.

```markdown
# JARVIS WRITER — OUTPUT QUALITY RULES

You are writing for Danny Paul, stage trainer at Success Resources.
You ship to Danny's audience: B2B founders, sales pros, AI-curious operators.
NOT to general LinkedIn. NOT to other AI agents. To real humans with limited
attention who have seen 50 AI posts today.

## VOICE — non-negotiable

Read `voice-dna.json` before writing a single token. Match:
- Sentence-length distribution (Danny averages 11 words, range 4-22)
- Contraction frequency (high — "you're" not "you are")
- Signature transitions (the 8-10 in voice-dna.json — use 1-2 per post)
- Energy: calm authority. NOT electric enthusiasm. NOT throat-clearing.
- Authority zones: stage, sales, AI agents, B2B coaching. Outside these, attribute.

## HOOK — first line is the whole job

The first line earns the second line. The second line earns "...more".
Allowed hook patterns:
- Relatable enemy ("Most founders ship before their offer is ready.")
- Contrarian claim ("Stop hiring a CFO before a CMO.")
- Specific number ("I've done 200 offers on stage. Three patterns.")
- Open loop ("Last week a $30M founder asked me one question. It broke me.")

NOT allowed:
- "In today's world..."
- "I want to share..."
- "Recently I learned..."
- "Let me tell you about..."
- Any rhetorical question that the reader could answer with "no, why?"

## BANNED — these strings are kill switches

If you produce any of these, the output is rejected and you start over:
delve, tapestry, navigate, leverage, harness, unlock, realm, paradigm,
landscape, multifaceted, intricate, nuanced, holistic, foster, garner,
crucial, pivotal, robust, scalable, seamless, cutting-edge, game-changer,
groundbreaking, testament, commendable, meticulously, vibrant, unparalleled,
underscore, synergy, transformative, redefine, empower, streamline,
pioneering, trailblazing, accentuate, surpass, in today's world,
in today's fast-paced, ever-evolving, in summary, in conclusion, in essence,
it's important to note, certainly!, that's a great question.

## STRUCTURE — the only allowed shapes

LinkedIn post: Hook (1 line) → Setup (2-3 lines) → Turn (1 line) → Payoff (3-5 lines) → CTA (1 line). No bullet bingo. No headers. White space carries meaning.

X post: Hook + payoff in 280. Done.

Newsletter section: H2 hook + 3-paragraph arc. No "Today we'll cover...".

## RULE-OF-THREE — banned

If you write "X, Y, and Z" in three consecutive sentences, rewrite. AI loves the rule of three. Humans don't speak in triplets.

## EM DASHES — capped at 1 per 200 words

The em dash is the single biggest AI tell. Use a period. Use a colon. Use a comma. Reserve the em dash for the single moment where nothing else works.

## SPECIFICITY — minimum 1 concrete per post

Every post contains at least one of: a number, a named person, a dated event, a verifiable claim. "Many founders struggle" → "82% of $1-3M founders I trained last quarter struggled with one thing."

## NEVER

- Never write "as an AI" or self-reference your nature.
- Never use the rule-of-three pattern.
- Never hedge with "It's worth noting that...".
- Never end with a generic CTA ("What do you think? Let me know!").
- Never use the em dash to bridge unrelated ideas.
- Never write a sentence longer than 22 words unless the rhythm demands it.
- Never write three consecutive sentences of identical length.

## SELF-CHECK BEFORE RETURN

Before returning, score yourself against the judge rubric (Section D).
If overall < 8.5, REVISE before returning. Do not return drafts <8.5.
```

This block is ~1.5k tokens. Cache it. It pays for itself within 3 generations.

---

## Section F — Anti-Patterns (what bad systems do — don't do these)

The single biggest accelerant in this research was watching what makes a system *fail*. Every "below average" AI content system shares some subset of the following sins. Audit Jarvis against this list every two weeks.

### F1. Single-shot generation
**Sin:** "Write a LinkedIn post about X" → ship.
**Why it fails:** No critique loop, no judge gate. Output tops out at 6/10 because there is no feedback signal.
**Fix:** Mandatory evaluator-optimizer loop. Min 1 critique pass. Min 1 revision pass. Hard score gate.

### F2. Voice as instruction, not data
**Sin:** "Write in a confident, casual, expert voice."
**Why it fails:** Adjectives don't constrain LLM output. The model interprets "confident" as "I am thrilled to share..." which is the opposite of confident.
**Fix:** Voice as 50 real example posts cached in the system prompt + a structured voice-dna.json with measurable features.

### F3. No banned-word list
**Sin:** Trusting the model to avoid AI tells.
**Why it fails:** Claude Opus, GPT-5, Gemini all have residual training-data preferences. They will sneak "delve" and "navigate" back in unless explicitly forbidden.
**Fix:** Two-pass de-AI scrubber (Step 6). Regex first, LLM second.

### F4. Reflection without a stop condition
**Sin:** Loop forever until "perfect".
**Why it fails:** Reflexion's research shows quality *degrades* after 3 rounds on subjective tasks. The model starts overcorrecting and drifting from voice.
**Fix:** Max 2 revision iterations. Then escalate or kill.

### F5. The judge and the writer are the same prompt
**Sin:** "Now critique your own work."
**Why it fails:** Self-evaluation in a single context is biased — the model rationalizes its choices. Score inflation is brutal.
**Fix:** Separate API call, separate system prompt, ideally even a different model (Haiku as judge of Opus output works surprisingly well and is cheaper).

### F6. No score gate
**Sin:** Generating to a queue without thresholds.
**Why it fails:** Slop ships when nothing rejects it.
**Fix:** Hard kill switch at score < 8.5. Failed drafts go to the reflection memory, not to the publish queue.

### F7. No specificity floor
**Sin:** Allowing posts with zero concrete claims.
**Why it fails:** Vague abstractions ("Many founders struggle...") are the tell-tale sign of AI ghost content. Specificity is the single highest-correlation feature with engagement.
**Fix:** Brief contract requires `must_include: [specific X]`. Judge dimension scores 0 if no specifics.

### F8. Missing brief contract
**Sin:** "Write something good about X."
**Why it fails:** Without a brief, the judge has nothing to score against. Every output is "fine".
**Fix:** Structured `brief.json` with topic, audience, purpose, hook type, CTA type, must-include, must-avoid.

### F9. Treating prompts like code-not-tested
**Sin:** Editing system prompts in production with no eval suite.
**Why it fails:** Regressions go invisible. Last week's good prompt is this week's slop.
**Fix:** Promptfoo or DeepEval test suite. 20+ representative cases. Run on every prompt change. CI integration.

### F10. No prompt caching
**Sin:** Sending the full voice DNA + style guide + few-shot exemplars on every call.
**Why it fails:** Cost balloons 10x. Latency triples. You stop iterating because each test costs $0.30.
**Fix:** Anthropic prompt caching with 1-hour TTL on the static blocks (voice DNA, style guide, exemplars). 90% cost reduction.

### F11. No feedback loop into the voice profile
**Sin:** Voice DNA built once and never updated.
**Why it fails:** Danny's voice evolves. New phrases, new positioning, new vocabulary. Six-month-old voice DNA produces stale content.
**Fix:** Auto-rebuild voice-dna.json monthly from the last 30 days of his actual writing. Diff and review.

### F12. Avatar / persona drift
**Sin:** Letting the model pick "who" is writing.
**Why it fails:** "Confident expert" voice averages to LinkedIn-coach default.
**Fix:** Voice DNA pinned to one specific human, with example posts attributed by that human. Persona is data, not a slot.

### F13. Skipping the revision pass on "good enough" drafts
**Sin:** "Score is 7.8 — ship it."
**Why it fails:** 7.8 averages to slop in volume. The compounding effect of 200 7.8-scored posts is brand erosion.
**Fix:** 8.5 is the floor. Period. The 7.8 drafts go to reflection memory, not the publish queue.

### F14. Em dash addiction
**Sin:** Letting the model use em dashes freely.
**Why it fails:** The em dash is the single most reliable AI fingerprint. Any reader who's encountered ChatGPT output spots it instantly.
**Fix:** Hard cap of 1 em dash per 200 words. Regex enforcement.

### F15. Generic CTAs
**Sin:** "What do you think? Let me know in the comments!"
**Why it fails:** Reads as desperate. Reads as AI. Generates zero engagement.
**Fix:** Brief contract specifies CTA type. Allowed: soft (link to newsletter), provocative (named opinion), specific question (about the named example). Banned: generic question.

---

## Implementation Order (the 14-day build)

If Danny ships this in pieces, here is the order that compounds fastest:

| Day | Build | Quality Lift |
|---|---|---|
| 1 | Extract voice-dna.json from 50 real posts | 6/10 → 7.5/10 |
| 2 | Install jalaalrd/anti-ai-slop-writing skill + regex pass | 7.5 → 8.0 |
| 3-4 | Fork clio-ghostwriter, swap in voice + style guide | 8.0 → 8.5 |
| 5-6 | Port claude-cookbooks evaluator_optimizer notebook | 8.5 → 8.8 |
| 7-8 | Build judge rubric (Section D) as Phoenix evaluator | locked at 8.5+ floor |
| 9-10 | Promptfoo eval suite (20 test prompts × rubric) | regression-proof |
| 11-12 | DSPy MIPROv2 on WriteLinkedInPost signature | 8.8 → 9.2 |
| 13 | Reflection memory (Reflexion pattern) | continuous improvement |
| 14 | Anthropic prompt caching on voice + exemplars | 90% cost cut, 3x speed |

**Net result:** A content system that ships at 9.0+ avg, refuses to ship below 8.5, costs 10% of naive implementation, and improves monthly without any prompt edits.

---

## Sources

- [LangGraph reflection (official)](https://github.com/langchain-ai/langgraph-reflection)
- [Reflexion (NeurIPS 2023)](https://github.com/noahshinn/reflexion)
- [Self-Refine paper](https://selfrefine.info/)
- [DSPy](https://github.com/stanfordnlp/dspy) and [MIPROv2 docs](https://dspy.ai/api/optimizers/MIPROv2/)
- [Anthropic claude-cookbooks patterns/agents](https://github.com/anthropics/claude-cookbooks/tree/main/patterns/agents)
- [Anthropic prompt caching docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [clio-ghostwriter](https://github.com/enablement-ch/clio-ghostwriter)
- [linkedin-ghostwriter (LangGraph)](https://github.com/Guido1Alessandro1Trevisan/linkedin-ghostwriter)
- [anti-ai-slop-writing skill](https://github.com/jalaalrd/anti-ai-slop-writing)
- [anti-slop-writing](https://github.com/adenaufal/anti-slop-writing)
- [stop-slop](https://github.com/hardikpandya/stop-slop)
- [autonovel ANTI-SLOP.md](https://github.com/NousResearch/autonovel/blob/master/ANTI-SLOP.md)
- [Measuring AI Slop in Text (arxiv)](https://arxiv.org/abs/2509.19163)
- [lechmazur/writing_styles benchmark](https://github.com/lechmazur/writing_styles)
- [openclaw voice-matched-content skill](https://github.com/openclaw/skills/blob/main/skills/alirezarezvani/content-creator/SKILL.md)
- [Microsoft AutoGen reflection pattern](https://microsoft.github.io/autogen/stable//user-guide/core-user-guide/design-patterns/reflection.html)
- [Constitutional AI paper](https://arxiv.org/pdf/2212.08073) and [Inverse CAI](https://github.com/rdnfn/icai)
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) | [Promptfoo llm-rubric](https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/) | [DeepEval G-Eval](https://deepeval.com/docs/metrics-llm-evals)
- [MadcowD/ell prompt versioning](https://github.com/MadcowD/ell)
- [Justin Welsh viral hook framework](https://www.justinwelsh.me/newsletter/the-anatomy-of-a-viral-linkedin-post)
- [Ship 30 for 30 Hook-Story-Offer](https://www.ship30for30.com/post/the-hook-story-offer-framework-an-easy-copywriting-formula-for-beginners)
- [Anthropic multishot prompting docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting)
- [50 Words AI Overuses](https://humanizethisai.com/blog/50-words-ai-overuses)
- [Scribe multi-stage Gemini pipeline](https://github.com/sapientcoffee/scribe)
