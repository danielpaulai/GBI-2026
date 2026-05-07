# GBI 2026 — Cursor Build Package

This is the Cursor-ready build package for the GBI 2026 stage demo. Open this folder in Cursor and start building.

## What's in here (everything you need to build, no other folder required)

```
cursor-build/
├── README.md                          ← you are here
├── BUILD-MASTER.md                    ← THE canonical build manual (760 lines)
├── .cursor/
│   └── rules/                         ← 9 Cursor MDC rules
│       ├── 00-project-context.mdc       (always-on — ground rules + 100× additions)
│       ├── agent-excellence.mdc         (voice-locked, eval gate, model routing)
│       ├── gbi-stage-architect.mdc      (XState + Framer Motion + triggers)
│       ├── wing-component-builder.mdc   (per-wing implementation)
│       ├── sub-tool-implementer.mdc     (14 sub-tool patterns)
│       ├── cinematic-polish.mdc         (LUT + grain + audio mix)
│       ├── voice-grammar-builder.mdc    (Picovoice Rhino setup)
│       ├── failure-recovery-builder.mdc (live/fake/safe + kill switches)
│       └── jarvis-loop-prompt.mdc       (Seedance prompt generation)
├── docs/                              ← consolidated references
│   ├── DESIGN-SYSTEM.md                 (every color, font, motion curve, sound rule, glow falloff, depth layer — consolidated from 13 docs)
│   ├── TOOL-SPECS.md                    (all 14 sub-tools: inputs, outputs, backends, fallbacks, stage lines)
│   ├── INPUT-OUTPUT.md                  (every voice phrase + key + button → XState event → visual + audio)
│   ├── LIVE_DEMOS.md                    (stage choreography for all 3 demos + recovery lines)
│   ├── STRATEGY.md                      (the 7 sales beats spine)
│   ├── CLOSE_SCRIPT.md                  (closing lines that earn $1,497)
│   ├── DAY1_RUN.md  DAY2_RUN.md         (minute-by-minute run sheets)
│   ├── BONUSES.md                       (offer stack)
│   ├── CREW_BRIEF.md                    (backstage/volunteer briefing)
│   ├── MANDARIN_BRIEF.md                (translator brief)
│   └── README.md                        (project overview)
└── research/                          ← all 13 research docs + index
    ├── INDEX.md                         (read this first — explains the 13 docs)
    ├── 01-frameworks.md                 (show-design first principles)
    ├── 02-show-mechanics.md             (28 reusable show beats)
    ├── 03-jarvis-build-stack.md         (original agent backend research)
    ├── 04-jarvis-visual-stack.md        (the 14 FUI rules — most now in DESIGN-SYSTEM.md)
    ├── 05-jarvis-demo-flow.md           (superseded by doc 09)
    ├── 06-seadance-approach.md          (Seedance backdrop generation)
    ├── 07-execution-plan.md             (superseded by doc 09)
    ├── 08-master-plan.md                (superseded by doc 09)
    ├── 09-master-plan.md                (canonical single-laptop architecture)
    ├── 10-build-hollywood.md            (build manual deep version)
    ├── 11-hollywood-polish.md           (audio sourcing, LUT files, motion graphics)
    ├── 12-the-100x-additions.md         (current architecture canon — read this)
    └── 13-1000x-repos.md                (the 17 repos that 1000× the build — latest)
```

## The reading order (if new to the project)

1. **`BUILD-MASTER.md`** — canonical build manual
2. **`research/INDEX.md`** — explains the 13 research docs and reading order
3. **`research/13-1000x-repos.md`** — the 17 latest repo additions (top of mind)
4. **`research/12-the-100x-additions.md`** — current architecture canon
5. **`docs/DESIGN-SYSTEM.md`** — every design rule consolidated
6. **`docs/TOOL-SPECS.md`** — all 14 sub-tools' inputs/outputs/backends
7. **`docs/INPUT-OUTPUT.md`** — every trigger → XState event → visual + audio
8. **`docs/LIVE_DEMOS.md`** — stage choreography
9. **`docs/STRATEGY.md`** + **`docs/CLOSE_SCRIPT.md`** — the why

The `.cursor/rules/*.mdc` files are auto-loaded by Cursor based on context — you don't need to read them upfront.

## How Cursor uses these rules

Cursor reads `.cursor/rules/*.mdc` automatically. The rules have 4 types based on their frontmatter:

| Type | Frontmatter | When invoked |
|---|---|---|
| **Always** | `alwaysApply: true` | Every chat — always in context |
| **Auto Attached** | `globs: src/**/*.tsx` | When matching files are in context |
| **Agent Requested** | `description: "..."`, no globs | Cursor decides based on description match |
| **Manual** | no description, no globs | Only when @-mentioned |

Our setup:
- **`00-project-context.mdc`** is **Always** — Cursor always knows this is the GBI 2026 project
- **The 7 skill rules** are **Agent Requested** — Cursor invokes them when their description matches the task

## How to use

### 1. Open in Cursor
```bash
cd /path/to/cursor-build
cursor .
```

(Or File → Open Folder in Cursor's UI)

### 2. Verify rules are loaded
- Open any file in the folder
- Press `Cmd+L` to open Cursor Chat
- The chat sidebar should show "Project Rules" — confirm 8 rules listed

### 3. Start Day 1 — let Cursor scaffold the project
In Cursor Chat (Cmd+L), Agent mode (the eye icon, top of chat panel):

```
Read BUILD-MASTER.md sections 0 and 6.
Then scaffold the GBI 2026 project per Section 0 — the exact npx create-next-app
command and the file structure mkdir commands. Run them.

After scaffolding, use the gbi-stage-architect skill to set up the XState v5
machine and trigger union per its acceptance criteria.
```

Cursor will:
- Read BUILD-MASTER.md
- Run the scaffolding commands
- Invoke the `gbi-stage-architect` rule (because its description matches)
- Build the XState machine and trigger union
- Stop at the rule's acceptance criteria

### 4. Day-by-day build
For each day of the 7-day plan, prompt Cursor with the day's goal. The relevant skill rule will auto-invoke. Examples:

**Day 1 morning — assets:**
```
Use the jarvis-loop-prompt skill to generate prompts for all 6 Seedance backdrop
clips listed in the skill (idle, boot, wing-wake, meeting, synthesis, war-room).
Show me each prompt as a code block.
```

**Day 2 — voice + polish:**
```
Use the voice-grammar-builder skill to define the Picovoice Rhino grammar.
Then use the cinematic-polish skill to wire up the WebGL LUT shader on the idle.mp4
backdrop. This is the highest-ROI move per the skill's first paragraph.
```

**Day 3 — first wing:**
```
Use the wing-component-builder skill to build the CMO wing.
Then use the sub-tool-implementer skill to implement the Instagram Creator sub-tool
in live mode (Anthropic streaming + fal.ai Flux Pro).
```

**Day 6 — failure recovery:**
```
Use the failure-recovery-builder skill to implement the live/fake/safe modes
for all 14 sub-tools and wire the 7 kill switches. Build the apocalypse USB stick
fallback at the end.
```

### 5. Force-invoke a specific skill
If Cursor doesn't pick up the right skill automatically, force it with `@`:

```
@gbi-stage-architect rebuild the trigger union — voice events aren't dispatching
to XState
```

### 6. Refer to BUILD-MASTER.md anytime
```
What does Section 13 of BUILD-MASTER.md say about kill switches?
```

Cursor will read the section and answer.

## Key Cursor commands

| Shortcut | What |
|---|---|
| `Cmd+L` | Open Cursor Chat sidebar |
| `Cmd+I` | Open inline edit in current file |
| `Cmd+K` | Generate code at cursor position |
| `@` | Reference a file or skill rule |
| `Tab` | Accept inline AI suggestion |

In Chat, the **eye icon** at the top toggles between **Ask** (read-only) and **Agent** mode (can edit files and run commands). Use Agent mode for the build.

## Recommended Cursor settings for this project

Open Cursor Settings (Cmd+,) → search for these:

- **Models:** Use Claude Sonnet 4.5 (best for this build — matches the Anthropic backend you're integrating)
- **Privacy mode:** ON (don't share your API keys with Cursor's training)
- **Auto-run commands:** ON only after you've reviewed what's being run
- **YOLO mode:** Off until Day 6 (then turn on for failure-recovery work where many small edits chain)

## Troubleshooting

### "Cursor isn't reading my rules"
- Confirm files are in `.cursor/rules/` (not `.cursor/` directly)
- Confirm extension is `.mdc` (not `.md`)
- Restart Cursor after adding rules
- Check Settings → "General" → "Rules for AI" is enabled

### "The skill isn't triggering automatically"
- Cursor's Agent Requested matching is description-based. If your prompt doesn't mention what the skill does, Cursor won't invoke it.
- Force-invoke with `@skill-name`
- Or edit the rule's `description` field to be more aggressive about when to match

### "I want a different model than Claude Sonnet 4.5"
- Settings → Models → switch to your preference
- For this project, Claude is recommended because the agent backend uses Claude — keeping the same model in Cursor and runtime keeps the prompt patterns consistent

## Where to get help

1. **First** — read `BUILD-MASTER.md` Section [N] for the canonical answer
2. **Then** — read the skill rule (`.cursor/rules/[skill].mdc`) for the implementation pattern
3. **Then** — read the relevant `docs/*.md` for context
4. **Last** — ask Cursor: "what does the build manual say about X?"

## What's NOT in this folder

The `research/` folder (11 deep-dive docs) is intentionally NOT copied here. They're reference material that would bloat Cursor's context. If you need to deep-dive into a specific architectural decision, open the original `GBI-Singapore-2026/research/` folder separately.

## Day 1 starting prompt (copy-paste this into Cursor Chat)

```
You are working on GBI 2026 (the project context rule should be active).

Read BUILD-MASTER.md sections 0, 1, 2, 3, 4, and 5. Confirm you understand:
- The 5-volunteer relay structure across 3 acts
- The CEO + 4-wings architecture (CMO/CRO/COO/CFO)
- The hardware list and accounts to set up

Then ask me which API keys I have available right now (Anthropic, fal.ai, Apify,
Hyperbrowser, Picovoice). Don't proceed with scaffolding until I confirm.

Once I confirm, run the Quick Start commands from Section 0 to scaffold the
project. Stop at the line that says "By 9:30am Day 1 you should have a blank
Next.js app launching in Chrome kiosk fullscreen."
```

That's it. Open this folder in Cursor, paste the Day 1 prompt, and start building.
