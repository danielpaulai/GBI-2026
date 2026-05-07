# GBI 2026 — Input/Output Mapping

This document maps every possible input (voice, R400, Streamdeck, keyboard, audience) to its XState event, the resulting visual output, and the audio cue. The complete trigger union, in one place.

When wiring a new trigger or debugging a misfire, this is the canonical reference.

---

## The trigger union architecture

All 4 input modalities dispatch the **same XState events**. Equal-class. If voice fails, R400 works. If R400 dies, Streamdeck works. If Streamdeck breaks, keyboard always works.

```
       VOICE (Picovoice Rhino)
           │
       R400 (USB HID)            ─→  XState event  ─→  State transition  ─→  Visual + Audio
           │
    STREAMDECK (USB HID)
           │
       KEYBOARD (always)
```

---

## The 21-intent voice grammar (Picovoice Rhino)

### Wing-opening intents (4)
| Voice phrase | XState event | Keyboard | R400 | Streamdeck |
|---|---|---|---|---|
| "open marketing" / "marketing go" / "show marketing" | `OPEN_CMO` | `M` | — | Button 1 (labeled "MARKETING") |
| "open sales" / "sales go" / "show sales" | `OPEN_CRO` | `S` | — | Button 2 (labeled "SALES") |
| "open operations" / "operations go" / "show ops" | `OPEN_COO` | `O` | — | Button 3 (labeled "OPS") |
| "open finance" / "finance go" / "show finance" | `OPEN_CFO` | `F` | — | Button 4 (labeled "FINANCE") |

### Sub-tool runtime intents (14)
| Voice phrase | XState event | Keyboard | When valid |
|---|---|---|---|
| "run instagram" / "create post" | `RUN_TOOL { toolId: "instagram" }` | `i` | CMO wing open |
| "run linkedin" / "linkedin post" | `RUN_TOOL { toolId: "linkedin" }` | `l` | CMO wing open |
| "run article" / "write article" | `RUN_TOOL { toolId: "article" }` | `a` | CMO wing open |
| "run video" / "make video" | `RUN_TOOL { toolId: "video" }` | `v` | CMO wing open |
| "run leads" / "find leads" | `RUN_TOOL { toolId: "leads" }` | `1` | CRO wing open |
| "run email" / "cold email" | `RUN_TOOL { toolId: "email" }` | `2` | CRO wing open |
| "run script" / "call script" | `RUN_TOOL { toolId: "script" }` | `3` | CRO wing open |
| "run sequence" / "follow up" | `RUN_TOOL { toolId: "sequence" }` | `4` | CRO wing open |
| "run weekly" / "weekly report" | `RUN_TOOL { toolId: "weekly" }` | `q` | COO wing open |
| "run daily" / "daily plan" | `RUN_TOOL { toolId: "daily" }` | `w` | COO wing open |
| "run audit" / "process audit" | `RUN_TOOL { toolId: "audit" }` | `e` | COO wing open |
| "run cashflow" / "cash forecast" | `RUN_TOOL { toolId: "cashflow" }` | `r` | CFO wing open |
| "run pricing" / "pricing optimizer" | `RUN_TOOL { toolId: "pricing" }` | `t` | CFO wing open |
| "run pnl" / "profit loss" | `RUN_TOOL { toolId: "pnl" }` | `y` | CFO wing open |

### Navigation intents (3)
| Voice phrase | XState event | Keyboard | R400 |
|---|---|---|---|
| "back" / "go back" | `BACK` | `Esc` | Left arrow |
| "home" / "reset to home" | `HOME` | `Cmd+H` | F5 |
| "reset everything" / "start over" | `RESET` | `Cmd+R` | (combo) |

---

## The 7 kill switches (presenter only — never voice-triggered)

| Key | Action | What audience sees |
|---|---|---|
| `Esc` | Back one level | Smooth layoutId morph back |
| `Cmd+H` | Force home (idle) | Smooth fade to idle state |
| `Cmd+F` | Force fake mode (subsequent tools play fallback MP4) | Nothing visible — they just see "perfect" outputs from then on |
| `Cmd+B` | Master backup MP4 plays | Full-screen pre-recorded backup |
| `Cmd+R` | Reset XState to idle, restart demo | Smooth fade to boot sequence |
| `Cmd+T` | Toggle "type instead of speak" | Hidden text input appears |
| `Cmd+M` | Mute Howler audio | Audio fades out (in case venue PA gets confused) |

---

## State transitions (XState v5)

### State machine
```
       booting
          │
          ▼ BOOT_COMPLETE
        idle ◄────────────────┐
          │                    │
          │ OPEN_CMO/CRO/      │ HOME
          │    COO/CFO         │
          ▼                    │
      wingOpen ────────────────┤
          │                    │ BACK / HOME
          │ RUN_TOOL           │
          ▼                    │
      toolRunning ─────────────┘
                BACK / HOME
```

### Transitions per state
| From | Event | To | Side effect |
|---|---|---|---|
| booting | BOOT_COMPLETE | idle | Stop boot sequence, start ambient bed |
| idle | OPEN_CMO | wingOpen | activeWing = "cmo", play wing-wake.mp4 |
| idle | OPEN_CRO | wingOpen | activeWing = "cro", play wing-wake.mp4 |
| idle | OPEN_COO | wingOpen | activeWing = "coo", play wing-wake.mp4 |
| idle | OPEN_CFO | wingOpen | activeWing = "cfo", play wing-wake.mp4 |
| wingOpen | RUN_TOOL | toolRunning | activeTool = event.toolId, fire tool's API |
| wingOpen | BACK | idle | activeWing = null, return to idle backdrop |
| wingOpen | HOME | idle | activeWing = null, activeTool = null |
| toolRunning | BACK | wingOpen | activeTool = null |
| toolRunning | HOME | idle | activeWing = null, activeTool = null |
| (any) | RESET | idle | Reset everything |
| (any) | FORCE_FAKE | (same) | mode = "fake" — subsequent tools play MP4s |

---

## Visual output by state

### State: `idle`
- **Backdrop:** `idle.mp4` (cyan particle drift, looping, color-graded)
- **Center:** CEO orb pulsing slowly, audio-reactive to ambient bed
- **Around orb:** 4 wing nodes orbiting at 40% opacity (CFO hidden until Act 3)
- **Ambient text rings:** updating every 200ms with random coordinates/glyphs
- **Audio:** ambient bed at -22dB, hum-bed sprite at -28dB

### State: `wingOpen` (e.g., activeWing = "cmo")
- **Backdrop:** crossfade to `wing-wake.mp4`, then back to dimmed `idle.mp4`
- **Center:** CEO orb dims slightly (focus shifts to wing)
- **Wing panel:** Arwes octagon expands via `layoutId="wing-cmo"` morph (600ms, expo-out)
- **Inside wing panel:** 4 sub-tool tiles in 2×2 grid, each with Lottie icon + label
- **Other 3 wings:** dim to 20% opacity
- **Audio:** `whoosh` sprite (-6dB) on entry, `comms-ping` per sub-tool tile reveal

### State: `toolRunning` (e.g., activeTool = "instagram")
- **Backdrop:** crossfade to `running.mp4`, very dim
- **Center stage:** sub-tool fullscreen via `layoutId="tool-instagram"` morph
- **Output materializes** per the sub-tool's spec (see TOOL-SPECS.md)
- **Wing chrome:** dims to background
- **Audio:** sub-tool-specific (typewriter for text, render hum for video, etc.)

### Act 3 (special case — all wings open in parallel)
- **Backdrop:** `war-room.mp4` (multi-stream cinematic)
- **Layout:** 3-column war room, each column = one wing's output streaming
- **CFO wing:** illuminates for the FIRST TIME (audience reaction: "wait, there's a 4th?")
- **Synthesis moment:** AnimatedBeams from 4 wings converge into CEO orb. Particles agitate. Opus 4.7 synthesizes (extended thinking + task budget). Output materializes via `flowtoken` blur-in
- **Audio:** Hans Zimmer-style reflection bed swells

---

## Audio output by event (lead visual by 60ms)

| Event | SFX | When |
|---|---|---|
| Any button press / voice trigger | `confirm` (-8dB) | Fires 60ms BEFORE state change |
| Hover over wing/tool | `hover` (-12dB) | On mouseenter / focus |
| Wing opens | `whoosh` (-6dB) | Concurrent with morph start |
| Sub-tool reveals | `comms-ping` (-10dB) per tile | Staggered with tile reveals |
| Tool completes | `confirm` (-8dB) + tool-specific tone | On output complete |
| Inter-wing line fires (Act 3) | `comms-ping` per beam | Per beam |
| Boot sequence | `boot` (-6dB) | Once, on app start |
| Error / glitch | `error` (-8dB) | On caught failure |
| Always-running | `hum-bed` (-28dB looping) | Continuous |

---

## Audience input (during the show)

Audience members can shout suggestions during volunteer setup beats. The presenter takes 3 shouts, audience cheers, loudest cheer wins, that becomes the sub-tool input.

This is choreographed in stagecraft (see `LIVE_DEMOS.md`), not technically wired — the presenter speaks the winning suggestion into Picovoice OR types it via Cmd+T.

**Why no QR audience-input form (was in earlier plan):** Single-laptop architecture, no operator. Audience shouts + presenter speaks = simpler, more theatrical. Suggestions feel "owned by the room" via the choreography, not the technology.

---

## Failure recovery flows

### Scenario 1: Voice fails (noisy room, mic issue)
- Symptom: volunteer says phrase, nothing happens
- Recovery: presenter presses keyboard letter or R400 button — same XState event fires
- Audience never knows

### Scenario 2: API timeout / WiFi drops mid-tool
- Symptom: tool starts but doesn't return in 60s
- Recovery: presenter presses `Cmd+F` → mode flips to `fake` → next tool plays fallback MP4
- Recovery line: *"That's the moment every founder knows. Welcome to my Tuesday. Watch this — [Cmd+B]. Same prompt, run 30 minutes ago in the green room. Same outcome."*

### Scenario 3: Whole stack frozen
- Symptom: nothing responds
- Recovery: `Cmd+B` → master backup MP4 plays full-screen
- Or switch to backup MacBook via ATEM Mini Pro
- Or USB stick fallback (Chrome kiosk + static HTML)

### Scenario 4: Volunteer freezes
- Symptom: volunteer doesn't press
- Recovery: presenter says *"Right here. This button. One press."* and presses with them
- Move on

### Scenario 5: AI generates weird/bad output
- Symptom: LinkedIn post is off-brand or factually wrong
- Recovery: presenter says *"That's the second thing we teach in the cohort — managing what AI says before it says it. Day 6, this never happens."* and advances slide
- Doesn't fight the bad output, frames it as curriculum

---

## Pre-show input testing (Day 7 venue rehearsal)

Test sequence for voice triggers in venue ambient noise (~70dB):
1. Walk to back of room
2. Speak each of the 21 phrases 5 times
3. Acceptance: ≥90% recognition rate
4. If a phrase fails repeatedly, retrain in Picovoice Console with sample variations

Test sequence for R400 + Streamdeck:
1. Press each button 10 times from various positions on stage
2. Acceptance: 100% reliability (these are USB HID, no excuse)

Test sequence for kill switches:
1. Run a sub-tool
2. Press `Cmd+F` mid-run
3. Verify next tool plays fallback MP4
4. Press `Cmd+B`
5. Verify master backup overlays in <500ms
6. Press `Cmd+R`
7. Verify reset to idle within 1s

---

## Mic placement (critical)

Lavalier on **PRESENTER**, not volunteer. Lavaliers pick up volunteer voices fine when the volunteer is within 3 feet. Ambient mic on volunteer is too risky in a noisy room.

**The presenter's lavalier IS the Picovoice mic input.** This means the presenter can also voice-trigger (just by speaking near the volunteer).

---

## The 4 inputs in priority order (by reliability)

1. **Keyboard** (always works, 0% failure rate, but presenter-only)
2. **Streamdeck Mini** (USB HID, 100% reliable for 6 buttons, can be on table or in volunteer's hand)
3. **Logitech R400** (USB HID, ~99% reliable, volunteer-friendly form factor)
4. **Picovoice Rhino voice** (~95% reliable in venue noise, magical when it works)

**Use voice for the WOW factor. Use keyboard as the failsafe.** Both are equal-class XState dispatchers — invisible to the audience which one fired.
