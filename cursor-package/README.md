# Cursor Package — How to Use

Four files in this folder. Use them in this order.

---

## Step 1 · Create your project folder

```bash
mkdir ~/Desktop/jarvis-stage
cd ~/Desktop/jarvis-stage
```

---

## Step 2 · Drop `.cursorrules` in project root

```bash
cp /Users/danielpaul/Desktop/Offer\ creation\ claude/GBI-Singapore-2026/cursor-package/.cursorrules .
```

This is the persistent context Cursor reads on every prompt. **Do not edit it.** It contains:
- Locked tech stack
- Coding rules (TypeScript strict, Tailwind only, no refactor outside scope, etc.)
- The 14 visual commandments
- Anti-patterns
- Stage-day kill switches

---

## Step 3 · Clone reference repos

These are the 5 starter repos. Cursor will `@Folder` them when needed.

```bash
mkdir -p ../reference
cd ../reference

git clone https://github.com/CopilotKit/canvas-with-langgraph-python
git clone https://github.com/anthropics/claude-agent-sdk-demos
git clone https://github.com/CopilotKit/open-multi-agent-canvas
git clone https://github.com/anthropics/claude-cookbooks
git clone https://github.com/openai/openai-realtime-agents

cd ../jarvis-stage
```

---

## Step 4 · Open Cursor and paste `CURSOR_BRIEF.md` as your first Composer message

```bash
open -a "Cursor" .
```

Then in Cursor:
1. Press **Cmd+I** to open Composer
2. Open `CURSOR_BRIEF.md` from this package, copy the entire file
3. Paste it as your first Composer message
4. Send

Cursor will respond with "Got it — building Day 1 now" and start scaffolding.

---

## Step 5 · For each subsequent day, paste the day's prompt from `DAILY_PROMPTS.md`

- **New Composer session each day** (Cmd+I → New Conversation)
- **Paste only that day's prompt** — `.cursorrules` provides the rest
- **Verify** the day's deliverable runs before moving on
- **Commit** with `feat(day-N): ...` before starting Day N+1

---

## Step 6 · Drop `AGENT_PROMPTS.md` content into `backend/prompts/` on Day 2

When Cursor reaches Day 2 (defining the agents), it'll need the actual system prompts. Open `AGENT_PROMPTS.md`, copy each section into the matching file:

- `ceo_system.md` → `backend/prompts/ceo_system.md`
- `marketing_system.md` → `backend/prompts/marketing_system.md`
- `sales_system.md` → `backend/prompts/sales_system.md`
- `operations_system.md` → `backend/prompts/operations_system.md`

**Customize the `[BUSINESS CONTEXT]` block in each one** with your actual product, ICP, voice samples. The more specific, the better the output.

---

## Files in this package

| File | When to use |
|---|---|
| **`.cursorrules`** | Drop in project root. Cursor loads it automatically on every message. |
| **`CURSOR_BRIEF.md`** | Paste into Cursor's first Composer message of the project. |
| **`DAILY_PROMPTS.md`** | One prompt per day. Paste at the start of each day's Composer session. |
| **`AGENT_PROMPTS.md`** | The 4 system prompts for CEO, Marketing, Sales, Operations agents. Paste into `backend/prompts/` on Day 2. |
| **`README.md`** | This file. |

---

## Tips for getting the most out of Cursor

### 1. Use Composer (Cmd+I), not Chat (Cmd+L)

- **Composer** = multi-file edits, agentic work. Use this 95% of the time.
- **Chat** = single-file Q&A. Use only for understanding existing code.

### 2. `@-mention` aggressively

When you want Cursor to use a reference, mention it explicitly:

- `@Folder ../reference/canvas-with-langgraph-python` — read the whole reference repo
- `@File backend/prompts/marketing_system.md` — read this specific file
- `@Docs anthropic` — pull Anthropic's official docs into context
- `@Web https://docs.anthropic.com/...` — pull a specific URL

### 3. Smaller prompts beat one giant prompt

If a Day's task is too big and Cursor times out:

```
First, do steps 1-3 from the Day 4 prompt. Stop and report.
```

Then in the next message:

```
Now do steps 4-6.
```

### 4. Reset Composer when it goes off-rails

If Cursor starts hallucinating, refactoring outside scope, or arguing with the brief:

1. Close the Composer conversation
2. Open a new Composer (Cmd+I → New Conversation)
3. Re-paste the day's prompt from `DAILY_PROMPTS.md`

The `.cursorrules` file persists — you don't need to re-paste that.

### 5. Always run the test before committing

Each day's prompt has a "Test" section. Run it. If the test fails, iterate. Don't move to Day N+1 with a broken Day N.

### 6. Commit often

Conventional Commits format. After every working deliverable:

```bash
git add .
git commit -m "feat(day-N): <one-line summary>"
```

If Day N+1 breaks something, you can roll back cleanly.

### 7. Don't let Cursor "improve" the stack

Stack is locked. If Cursor suggests CrewAI or "let's use trpc instead of fastapi" — say no. The brief explicitly forbids alternatives. Re-paste the rule if needed:

> Re-read CURSOR_BRIEF.md "Locked tech stack" section. Do not suggest alternatives.

### 8. Real mode + fake mode for every feature

The demo will run in fake mode on stage (deterministic, no API failures). Real mode only used in green room for highlight reel. Every feature must work in both. Cursor knows this — but verify it on Day 4 and Day 6.

---

## What this package covers

- ✅ Tech stack decisions (locked)
- ✅ Project structure (defined)
- ✅ 7 daily prompts (ready to paste)
- ✅ Agent system prompts (4, customizable)
- ✅ Coding rules + visual rules (.cursorrules)
- ✅ Reference repos to clone
- ✅ Test commands per day
- ✅ Commit message format

## What this package does NOT cover

- ❌ Stage choreography (see `GBI_PRESENTATION_3DAY.md` for that)
- ❌ Visual asset creation (Higgsfield/Seedance video clips — generate separately)
- ❌ Audio sprite creation (download Zapsplat samples, build sprite manually)
- ❌ Actual Anthropic / OpenAI API keys (set in `.env` — never commit)

---

## If you get stuck

1. **Cursor going in circles** → reset Composer, re-paste day's prompt
2. **Stack drift** → re-paste "Locked tech stack" section from CURSOR_BRIEF.md
3. **Type errors after Day N** → run `npm run build` and feed errors back to Cursor
4. **Backend won't start** → check `requirements.txt` versions match Python 3.11+
5. **Voice doesn't work** → confirm you're using HTTPS in browser (WebRTC requirement) or `localhost`

---

## When you're done

- ✅ Demo runs end-to-end in real mode + fake mode
- ✅ Esc kill-switch fades gracefully
- ✅ Cmd+T toggles fake mode
- ✅ Cmd+Shift+R forces fake mode (insurance)
- ✅ Deployed to Vercel + Railway
- ✅ Recorded one clean run for highlight reel
- ✅ SDK versions pinned
- ✅ Tag commit `v1.0-stage-ready`

You're ready for stage.
