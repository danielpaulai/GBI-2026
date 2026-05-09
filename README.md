# GBI Singapore 2026 — Stage Presentation Master Package

**Event.** Guerrilla Business Intensive, Singapore, May 14–17, 2026 (Success Resources).
**Slot.** Day 1: 90 min · Day 2: 120 min (last 60 min = sales close).
**Offer.** **$1,997 standalone** — 10X With AI Cohort starting June 12, 2026. **Standard tier only — no VIP tier. No risk reversal.**
**Audience.** ~200–350 Asia attendees. ~50 Mandarin speakers (online live translation provided). Mac follows with counter-offer/bundle.

---

## What's in this folder

| File | What it is | When to read it |
|---|---|---|
| `STRATEGY.md` | Master strategy. Offer architecture, 7 Sales Beats, energy curve, Streisand hook, pre-stage routine. | Read first. The whole strategy lives here. |
| `DAY1_RUN.md` | 90-min minute-by-minute run sheet. Every block, every cue, every line. | Print and rehearse against. |
| `DAY2_RUN.md` | 120-min minute-by-minute run sheet. Includes the 60-min close transition. | Print and rehearse against. |
| `CLOSE_SCRIPT.md` | The 60-min sales close — permission ask → stack → if-anchoring → price → 3 closes layered → CTA. Plus full objection bank. | Memorize the spine. |
| `LIVE_DEMOS.md` | The 3 demos (Marketing AI / Sales AI / Ops AI) scripted to the 4-beat anatomy. Includes failure recovery for each. | Rehearse 10–15 times each. |
| `BONUSES.md` | The 20-template stack with $-anchors. Total real-world value > $15K. Used in stack-slide reveal. | Crew reads. Lock the slide order. |
| `CREW_BRIEF.md` | One-page on-phone reference for the SR/Danny team. What we sell, top objection responses, order flow. | Whole crew reads day-of. |
| `MANDARIN_BRIEF.md` | One-page Mandarin offer summary for the ~50 Chinese-speaking attendees. | Print and hand out at registration. |
| `research/01-frameworks.md` | Underlying research: Brunson, Cardone, Robbins, Kiyosaki, Singer, Eker, MFP synthesis + 20 GitHub repos. | Reference only. |
| `research/02-show-mechanics.md` | Underlying research: 28-element show bank, pacing curves, demo choreography, music cues, failure recovery. | Reference only. |

---

## Jarvis (separate app repo)

This repository is the **workshop and stage package** (run sheets, close, demos, crew briefs, research). It should stay easy to read, print, and rehearse without worrying about app dependencies or deploys.

The **10X Command Center / Jarvis** build (Next.js, FastAPI, LangGraph) lives in a **different Git repository**. That way:

- Workshop and offer edits here never block or entangle Jarvis releases.
- Jarvis engineers can ship the app on its own cadence without tripping over stage PDFs and scripts.

If you keep a local `jarvis-stage/` folder inside this project for convenience, it is **gitignored** here so it is not committed twice. Clone or init Jarvis separately, open that folder in Cursor, and push **only** the Jarvis remote for app changes.

---

## Suggested reading order

1. `STRATEGY.md` — get the whole picture in 15 min.
2. `DAY1_RUN.md` + `DAY2_RUN.md` — the actual stage flow.
3. `CLOSE_SCRIPT.md` — the 60-min sales close.
4. `LIVE_DEMOS.md` — the 3 demo choreographies.
5. `BONUSES.md` + `CREW_BRIEF.md` + `MANDARIN_BRIEF.md` — execution support.
6. The two `research/` files — only when you want to dig deeper into a specific framework.

---

## How to use this package in the next 14 days (until May 14)

**Week 1 (now → May 7):**
- Lock `STRATEGY.md`. Make any pricing/bonus/date corrections.
- Rehearse opening 10 minutes of Day 1 cold, 3× per day.
- Build the 3 demos in production (have a backup screen recording of each, queued one keystroke away).
- Translate `MANDARIN_BRIEF.md` with a native speaker review (the draft Chinese is a starting point, not a final).

**Week 2 (May 7 → May 13):**
- Full rehearsal of Day 1 with stage crew (lights, music, AV cuts) — twice.
- Full rehearsal of Day 2 with the close — twice.
- Final tech check: WiFi redundancy (cellular hotspot as backup), demo backup recordings cued in OBS/Keynote, AV operator briefed on `LIVE_DEMOS.md`.
- Confirm Mac's slot timing so the bundle handoff is smooth.
- Print `CREW_BRIEF.md` for every crew member.

**Day-of:**
- 60 min before stage: pre-stage routine (in `STRATEGY.md` § Pre-stage).
- 30 min before stage: walk the room, pick your 3–5 barometer people.
- Lectern card: failure recovery scripts (in `LIVE_DEMOS.md` § Recovery).

---

## Locked decisions (May 7)

- [x] **Price: $1,997** standalone (final).
- [x] **No money-back guarantee.** Selling on value, not refund risk. **BUT we keep The Deployment Promise** — *"Show up to all 20 hours. You'll walk out with at least one AI agent running. We work until it's deployed."* This is a results commitment, not a refund.
- [x] **Standard tier only.** No VIP tier. One price for everyone in the cohort.
- [x] **Order flow: paper order forms at back of room + online checkout** (QR on screen). Both available.
- [x] **Mandarin support: online live translation.** Presentation runs in English. Mandarin attendees access a live-translated stream on their phones via QR code at registration. No in-room headsets needed. `MANDARIN_BRIEF.md` printed handout still given at registration with offer details + the QR code to the translation feed.
- [x] **Founder OS bonus: 3 months free access** (already locked in `AI_EMPIRE_OFFER.html`).

### Still to confirm pre-stage

- [ ] Final 20-template list approved for the welcome packet (cohort delivery, not stage-day blocker).
- [ ] Translation platform chosen (e.g. Wordly, Interprefy, KUDO) — needs ops sign-off.
- [ ] QR code for translation feed printed on `MANDARIN_BRIEF.md` and tested.
