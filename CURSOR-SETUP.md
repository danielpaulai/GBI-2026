# Taking GBI 2026 to Cursor

This document explains what was done to package GBI 2026 for Cursor, and what to do next.

## What was created

A new folder at `cursor-build/` inside this project, containing everything Cursor needs:

```
cursor-build/
├── README.md                          # Cursor-specific usage guide
├── BUILD-MASTER.md                    # The canonical build manual (copied)
├── .cursor/
│   └── rules/                         # 8 Cursor MDC rules
│       ├── 00-project-context.mdc       (always-on — project ground rules)
│       ├── jarvis-loop-prompt.mdc       (Seedance prompt generation)
│       ├── gbi-stage-architect.mdc      (XState + Framer Motion + triggers)
│       ├── wing-component-builder.mdc   (per-wing implementation)
│       ├── cinematic-polish.mdc         (LUT + grain + audio mix)
│       ├── voice-grammar-builder.mdc    (Picovoice Rhino setup)
│       ├── failure-recovery-builder.mdc (live/fake/safe + kill switches)
│       └── sub-tool-implementer.mdc     (14 sub-tool patterns)
└── docs/
    ├── LIVE_DEMOS.md
    ├── STRATEGY.md
    ├── CLOSE_SCRIPT.md
    ├── DAY1_RUN.md  DAY2_RUN.md
    ├── BONUSES.md
    └── CREW_BRIEF.md
```

## Why this structure

**Claude Code** uses `.claude/skills/*.md`. **Cursor** uses `.cursor/rules/*.mdc`. The content is the same — only the frontmatter format and file extension differ.

Cursor MDC frontmatter has 3 key fields:
- `description` — what the rule is for (used by Cursor's Agent Requested matching)
- `globs` — file patterns that trigger auto-attach (we don't use this — we want on-demand invocation)
- `alwaysApply` — boolean, true means always in context

Our rules:
- **`00-project-context.mdc`** has `alwaysApply: true` — Cursor always knows this is GBI 2026
- **The 7 skill rules** have `alwaysApply: false` + `description: "..."` — Cursor invokes them when their description matches the user's prompt

## What to do next (3 options)

### Option A: Open `cursor-build/` directly in Cursor
The folder is already configured. Just:
```bash
cd "/Users/danielpaul/Desktop/Offer creation claude/GBI-Singapore-2026/cursor-build"
cursor .
```

This is the fastest path. You'll be coding in this exact folder — your demo build lives in `cursor-build/`.

### Option B: Move `cursor-build/` to your code workspace
If you keep code projects in a different location (e.g., `~/code/`), move it:
```bash
mv "/Users/danielpaul/Desktop/Offer creation claude/GBI-Singapore-2026/cursor-build" ~/code/gbi-2026
cd ~/code/gbi-2026
cursor .
```

This keeps your build separate from the planning/research folder.

### Option C: Initialize a fresh project elsewhere and copy the rules
If you want to integrate the rules into an existing project:
```bash
# In your existing project root:
mkdir -p .cursor/rules
cp "/Users/danielpaul/Desktop/Offer creation claude/GBI-Singapore-2026/cursor-build/.cursor/rules/"*.mdc .cursor/rules/
cp "/Users/danielpaul/Desktop/Offer creation claude/GBI-Singapore-2026/cursor-build/BUILD-MASTER.md" .
```

## First-run verification (do this once)

After opening in Cursor:

1. **Confirm rules are loaded.** Press `Cmd+L` to open Chat. The sidebar should show "Project Rules" — confirm 8 rules listed.

2. **Test the always-on rule.** In Chat, ask: *"What project am I working on?"*  
   Cursor should answer: GBI 2026, mention CEO + 4 wings, mention the hard rules.

3. **Test an Agent-Requested rule.** In Chat, ask: *"Generate a Seedance prompt for the idle backdrop."*  
   Cursor should auto-invoke `jarvis-loop-prompt.mdc` and produce a prompt following the 5-step template.

4. **Test the skill force-invocation.** In Chat, type: *"@gbi-stage-architect"* (autocomplete should suggest the rule). Press Enter — Cursor should load the rule's content.

If all 4 work, you're set up. Start Day 1 with the prompt at the bottom of `cursor-build/README.md`.

## What stayed in this (planning) folder vs. went to cursor-build

| Stayed here | Why |
|---|---|
| `research/01-11.md` (11 docs) | Deep reference material — would bloat Cursor's context |
| `MANDARIN_BRIEF.md` | Translator-specific, not for build |
| `skills/*.md` | Original Claude Code format — keep as backup, edit via Claude Code if needed |
| This `CURSOR-SETUP.md` | Migration documentation |

| Went to `cursor-build/` | Why |
|---|---|
| `BUILD-MASTER.md` | THE canonical doc — Cursor needs it |
| `LIVE_DEMOS.md`, `STRATEGY.md`, `CLOSE_SCRIPT.md`, `DAY1/2_RUN.md`, `BONUSES.md`, `CREW_BRIEF.md` | Stage-relevant context |
| `.cursor/rules/*.mdc` | The 8 Cursor rules (converted from skills) |
| `cursor-build/README.md` | Cursor-specific usage guide |

## Keeping things in sync

If you edit a rule in `cursor-build/.cursor/rules/`, that's now the canonical version for Cursor. The original `skills/*.md` in the planning folder becomes stale.

To keep both in sync (if you ever switch back to Claude Code):
```bash
# After editing a Cursor rule, re-export to Claude Code skill format:
for f in cursor-build/.cursor/rules/*.mdc; do
  name=$(basename "$f" .mdc)
  # Strip Cursor frontmatter, write Claude Code skill
  awk '/^---$/{c++; if(c<=2) print; next} c>=2{print}' "$f" > "skills/${name}.md"
done
```

(But for the May 14 build, just commit to Cursor and forget about Claude Code sync — one source of truth.)

## TL;DR

```bash
cd "/Users/danielpaul/Desktop/Offer creation claude/GBI-Singapore-2026/cursor-build"
cursor .
```

Then open Cursor Chat (`Cmd+L`), paste the Day 1 starting prompt from `cursor-build/README.md`, and start building.
