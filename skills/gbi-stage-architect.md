---
name: gbi-stage-architect
description: Wire the GBI 2026 stage shell — XState v5 3-depth state machine (idle → wingOpen → toolRunning), Framer Motion layoutId morphs between depths, trigger union (voice + R400 + Streamdeck + keyboard) all dispatching the same XState events. Use when scaffolding the project on Day 1 or Day 2.
type: claude-code-skill
---

# GBI 2026 Stage Architect

Use this skill when the user asks to build, modify, or debug the stage shell — the XState machine, level transitions, or trigger union.

## The 3-depth state machine (canonical)

```ts
// src/lib/machine.ts
import { setup, assign } from "xstate";

export const stageMachine = setup({
  types: {
    context: {} as {
      activeWing: "cmo" | "cro" | "coo" | "cfo" | null;
      activeTool: string | null;
      mode: "live" | "fake" | "safe";
    },
    events: {} as
      | { type: "BOOT_COMPLETE" }
      | { type: "OPEN_CMO" } | { type: "OPEN_CRO" }
      | { type: "OPEN_COO" } | { type: "OPEN_CFO" }
      | { type: "RUN_TOOL"; toolId: string }
      | { type: "BACK" } | { type: "HOME" }
      | { type: "FORCE_FAKE" } | { type: "RESET" },
  },
}).createMachine({
  id: "gbi-2026",
  initial: "booting",
  context: { activeWing: null, activeTool: null, mode: "live" },
  states: {
    booting: { on: { BOOT_COMPLETE: "idle" } },
    idle: {
      on: {
        OPEN_CMO: { target: "wingOpen", actions: assign({ activeWing: "cmo" }) },
        OPEN_CRO: { target: "wingOpen", actions: assign({ activeWing: "cro" }) },
        OPEN_COO: { target: "wingOpen", actions: assign({ activeWing: "coo" }) },
        OPEN_CFO: { target: "wingOpen", actions: assign({ activeWing: "cfo" }) },
      },
    },
    wingOpen: {
      on: {
        RUN_TOOL: { 
          target: "toolRunning", 
          actions: assign({ activeTool: ({ event }) => event.toolId })
        },
        BACK: { target: "idle", actions: assign({ activeWing: null }) },
        HOME: { target: "idle", actions: assign({ activeWing: null, activeTool: null }) },
      },
    },
    toolRunning: {
      on: {
        BACK: { target: "wingOpen", actions: assign({ activeTool: null }) },
        HOME: { target: "idle", actions: assign({ activeWing: null, activeTool: null }) },
        FORCE_FAKE: { actions: assign({ mode: "fake" }) },
      },
    },
  },
  on: {
    RESET: { target: ".idle", actions: assign({ activeWing: null, activeTool: null }) },
  },
});
```

## The Framer Motion layoutId rule

**SAME `layoutId` on the wing's icon at depth 0 and the wing-panel root at depth 1.** Motion morphs automatically. No manual animation code.

```tsx
// At depth 0 (idle)
<motion.div layoutId="wing-cmo" className="w-32 h-32" />

// At depth 1 (wingOpen, when activeWing === "cmo")
<motion.div layoutId="wing-cmo" className="w-screen h-screen" />
```

Same trick for sub-tool icon at depth 1 → fullscreen tool at depth 2:
```tsx
<motion.div layoutId={`tool-${toolId}`} />
```

**One easing curve everywhere:** `[0.16, 1, 0.3, 1]` (expo-out). 600ms duration. Don't deviate.

## The trigger union (4 input modalities → same XState events)

```ts
// src/lib/triggers/keyboard.ts (always-available fallback)
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    const map: Record<string, EventType> = {
      m: "OPEN_CMO", s: "OPEN_CRO", o: "OPEN_COO", f: "OPEN_CFO",
      Escape: "BACK", h: e.metaKey ? "HOME" : null,
      r: e.metaKey ? "RESET" : null,
      f_meta: e.metaKey ? "FORCE_FAKE" : null,
    };
    const event = map[e.key];
    if (event) send({ type: event });
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);
```

```ts
// src/lib/triggers/voice.ts (Picovoice Rhino)
useRhino({
  contextPath: "/voice/gbi-2026.rhn",
  onInference: (inference) => {
    if (!inference.isUnderstood) return;
    const map: Record<string, EventType> = {
      openMarketing: "OPEN_CMO",
      openSales: "OPEN_CRO",
      openOperations: "OPEN_COO",
      openFinance: "OPEN_CFO",
      runInstagram: "RUN_TOOL",
      // ... all 20 intents
      back: "BACK", home: "HOME", reset: "RESET",
    };
    if (map[inference.intent]) send({ type: map[inference.intent] });
  },
});
```

```ts
// src/lib/triggers/r400.ts (Logitech R400 — plain HID keyboard)
// R400 sends PgUp / PgDn / F5 / Esc as standard keystrokes
// Already handled by keyboard listener above. No extra wiring.
```

```ts
// src/lib/triggers/streamdeck.ts
// Use Stream Deck Companion software (Bitfocus) to map physical buttons to keystrokes:
// Button 1 (labeled "MARKETING") → key M
// Button 2 (labeled "SALES")     → key S
// Button 3 (labeled "OPS")       → key O
// Button 4 (labeled "FINANCE")   → key F
// Already handled by keyboard listener.
```

**The rule:** all 4 modalities collapse to the same `keydown` listener (or its equivalent via Picovoice). One event source, four input methods.

## Modes (live | fake | safe)

Every tool component branches on `context.mode`:
```tsx
function InstagramCreator() {
  const mode = useSelector(stageActor, (s) => s.context.mode);
  
  if (mode === "live") return <LiveInstagramCreator />;
  if (mode === "fake") return <FallbackVideo src="/fallback/cmo-instagram.mp4" />;
  if (mode === "safe") return <FallbackVideo src="/fallback/cmo-instagram.mp4" autoPlay />;
}
```

`Cmd+F` flips mode to `fake` mid-show. Audience never knows.

## Acceptance criteria for Day 2 deliverable
- [ ] Press M/S/O/F → wing opens with smooth layoutId morph
- [ ] Press Esc → wing closes
- [ ] Press Cmd+H → returns to idle from any state
- [ ] Press Cmd+F → all subsequent tools play fallback MP4s
- [ ] Voice "open marketing" → same as pressing M
- [ ] Stately Inspect shows current state in second browser tab

If all 6 pass, the stage shell is ready for tool integration on Day 3.
