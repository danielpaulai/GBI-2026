# Jarvis GitHub Stack 2026

This is the consolidated GitHub stack for the Jarvis stage build in this repo.

It is tailored to the current direction:
- one dominant AI CEO orb
- dark futuristic interface
- hidden executive agents that expand on demand
- command-first interaction inside CMO or another executive lane
- visible sub-agent fan-out after a real command
- stage-safe runtime with debugging and fallback controls

This file separates repos into two groups:
- `Install now`: repositories or packages that should directly shape the current codebase
- `Mine for patterns`: repositories worth studying or cherry-picking from, but not worth fully adopting

Do not install everything blindly. The right move is a curated stack, not a maximal one.

## The Build Lens

The strongest stack for this project is:
- `LangGraph + langgraph-supervisor` for the CEO-to-agent orchestration
- `Next.js 15` for the stage shell
- `XState` for deterministic stage states and fallback triggers
- `React Flow` or a custom orbital layout for the hidden agent fan-out
- `Three.js / R3F` for the vibrating CEO orb
- `ElevenLabs` for the voice output layer
- `OpenAI or Deepgram` for programmable speech input when you move beyond manual text entry

## Install Now

### 1. Orchestration and agent runtime

#### `langchain-ai/langgraph`
- URL: https://github.com/langchain-ai/langgraph
- Why it matters: best fit for the CEO supervisor controlling named specialist agents with visible routing
- Use here: backend orchestration spine
- Verdict: `install now`

#### `langchain-ai/langgraph-supervisor-py`
- URL: https://github.com/langchain-ai/langgraph-supervisor-py
- Why it matters: maps directly to CEO -> CMO / Sales / Ops / Finance routing
- Use here: supervisor pattern already matches the backend in `jarvis-stage/backend`
- Verdict: `install now`

#### `anthropics/claude-agent-sdk-demos`
- URL: https://github.com/anthropics/claude-agent-sdk-demos
- Why it matters: reference-quality Anthropic multi-agent patterns and streaming examples
- Use here: agent lifecycle, subagent tracking, and streaming ideas
- Verdict: `mine for patterns`

#### `CopilotKit/canvas-with-langgraph-python`
- URL: https://github.com/CopilotKit/canvas-with-langgraph-python
- Why it matters: closest turnkey scaffold for Python LangGraph + React canvas
- Use here: backend/frontend event bridge and agent canvas wiring
- Verdict: `mine for patterns`, strong fork candidate if current scaffold gets replaced

### 2. Stage state and control

#### `statelyai/xstate`
- URL: https://github.com/statelyai/xstate
- Why it matters: your stage demo needs deterministic state, not ad hoc UI booleans
- Use here: `idle -> ceo-open -> executive-open -> command-input -> subagents-running -> synthesis`
- Verdict: `install now`

#### `statelyai/inspect`
- URL: https://github.com/statelyai/inspect
- Why it matters: lets you inspect the stage state machine during rehearsal and debugging
- Use here: hidden operator/debug view
- Verdict: `install now`

### 3. Interface and front-end design

#### `pmndrs/react-three-fiber`
- URL: https://github.com/pmndrs/react-three-fiber
- Why it matters: best path to a real vibrating CEO orb instead of a flat CSS circle
- Use here: CEO core, audio-reactive pulse, cinematic depth
- Verdict: `install now`

#### `pmndrs/drei`
- URL: https://github.com/pmndrs/drei
- Why it matters: gives the primitives you need quickly: sphere, float, sparkles, camera helpers
- Use here: CEO orb scene and subtle orbital depth
- Verdict: `install now`

#### `pmndrs/react-postprocessing`
- URL: https://github.com/pmndrs/react-postprocessing
- Why it matters: bloom and glow are mandatory if the CEO orb is meant to feel alive on stage
- Use here: emissive bloom around the CEO core
- Verdict: `install now`

#### `pmndrs/uikit`
- URL: https://github.com/pmndrs/uikit
- Why it matters: lets UI elements exist in 3D space, not only as flat overlays
- Use here: floating executive labels or orbital panels if you push the project further
- Verdict: `install now` if you want the biggest visual leap, otherwise phase 2

#### `xyflow/xyflow`
- URL: https://github.com/xyflow/xyflow
- Why it matters: battle-tested graph interactions and animated edges for agent handoffs
- Use here: hidden executive graph and sub-agent fan-out after command submit
- Verdict: `install now` unless you choose a pure custom orbital layout

#### `arwes/arwes`
- URL: https://github.com/arwes/arwes
- Why it matters: still one of the highest-fit sci-fi UI systems for stage demos
- Use here: panel chrome, futuristic frames, audio bleeps
- Verdict: `mine for patterns` unless you want full sci-fi chrome quickly

#### `origin-space/originui`
- URL: https://github.com/origin-space/originui
- Why it matters: denser, more premium UI primitives than standard shadcn blocks
- Use here: command panels, compact status surfaces, result cards
- Verdict: `mine for patterns`

#### `kokonut-labs/kokonutui`
- URL: https://github.com/kokonut-labs/kokonutui
- Why it matters: strong loaders and waiting states for agent thinking moments
- Use here: subtle waiting indicators inside CMO and sub-agent panels
- Verdict: `mine for patterns`

#### `paper-design/shaders`
- URL: https://github.com/paper-design/shaders
- Why it matters: immediately upgrades the background from gradient to cinema
- Use here: ambient backdrop behind the orb and agent reveal transitions
- Verdict: `install now`

#### `MaximeHeckel/blog.maximeheckel.com`
- URL: https://github.com/MaximeHeckel/blog.maximeheckel.com
- Why it matters: excellent shader and particle references for making the CEO orb feel expensive
- Use here: particle attractors, glow logic, orb synthesis effects
- Verdict: `mine for patterns`

#### `hvianna/audioMotion-analyzer`
- URL: https://github.com/hvianna/audioMotion-analyzer
- Why it matters: the orb should react to Jarvis voice output, and this is the fastest way to get a premium waveform/reactive ring
- Use here: ElevenLabs voice visualization around the CEO orb
- Verdict: `install now`

#### `goldfire/howler.js`
- URL: https://github.com/goldfire/howler.js
- Why it matters: stage-safe sound cues with low latency
- Use here: start cue, handoff cue, completion cue, subtle UI bleeps
- Verdict: `install now`

#### `tonistiigi/audiosprite`
- URL: https://github.com/tonistiigi/audiosprite
- Why it matters: builds the sound sprite Howler can trigger instantly
- Use here: one bundled sound pack for the show
- Verdict: `install now`

#### `Ephibbs/flowtoken`
- URL: https://github.com/Ephibbs/flowtoken
- Why it matters: better than cheap typewriter output when results materialize on stage
- Use here: final response reveal in CMO or CEO synthesis panel
- Verdict: `install now`

### 4. Voice and real-time communication

#### `openai/openai-realtime-agents`
- URL: https://github.com/openai/openai-realtime-agents
- Why it matters: strongest reference for browser-native voice agents and push-to-talk flow
- Use here: future programmable voice input, not current manual mode
- Verdict: `mine for patterns`

#### `pipecat-ai/pipecat`
- URL: https://github.com/pipecat-ai/pipecat
- Why it matters: strong backup voice pipeline with noise handling and real-time media support
- Use here: backup voice stack if OpenAI Realtime is not the final choice
- Verdict: `mine for patterns`

#### `pipecat-ai/voice-ui-kit`
- URL: https://github.com/pipecat-ai/voice-ui-kit
- Why it matters: ready-made voice UI controls if you decide to ship live speech input
- Use here: microphone controls, speaking indicators
- Verdict: `mine for patterns`

#### `ggerganov/whisper.cpp`
- URL: https://github.com/ggerganov/whisper.cpp
- Why it matters: offline fallback STT if cloud transcription becomes risky
- Use here: emergency or offline mode only
- Verdict: `mine for patterns`

### 5. Back-end tools and real-world integrations

#### `modelcontextprotocol/servers`
- URL: https://github.com/modelcontextprotocol/servers
- Why it matters: turns Jarvis from a demo shell into a real operator that can touch Gmail, Drive, Slack, and filesystem data
- Use here: executive agents with real-world actions
- Verdict: `install now`

#### `GLips/Figma-Context-MCP`
- URL: https://github.com/GLips/Figma-Context-MCP
- Why it matters: high-value demo moment if CMO or design agent pulls live Figma context
- Use here: design-aware marketing or landing page generation flow
- Verdict: `install now` if Figma is part of the stage story

#### `microsoft/playwright-mcp`
- URL: https://github.com/microsoft/playwright-mcp
- Why it matters: best credible browser automation layer for visible research or competitive intelligence demos
- Use here: on-stage site inspection or extraction tasks
- Verdict: `install now`

#### `browserbase/stagehand`
- URL: https://github.com/browserbase/stagehand
- Why it matters: useful reference for browser-driven agent workflows
- Use here: mine for browser orchestration ideas, especially if you want a richer research agent
- Verdict: `mine for patterns`

### 6. Debugging, observability, rehearsal

#### `langfuse/langfuse`
- URL: https://github.com/langfuse/langfuse
- Why it matters: best open-source tracing layer for LLM apps in this stack
- Use here: inspect agent runs, latency, and tool calls during build and rehearsal
- Verdict: `install now`

#### `AgentOps-AI/agentops`
- URL: https://github.com/AgentOps-AI/agentops
- Why it matters: strong multi-agent replay and debugging angle
- Use here: post-run analysis of why Jarvis routed badly or stalled
- Verdict: `mine for patterns` or install if you want deeper observability than LangSmith alone

#### `promptfoo/promptfoo`
- URL: https://github.com/promptfoo/promptfoo
- Why it matters: the fastest way to build an eval gate around agent outputs before stage day
- Use here: score output quality for CMO, Sales, Ops, and CEO synthesis prompts
- Verdict: `install now`

### 7. Research and content libraries

These are not runtime dependencies. They improve prompts, agent training, and domain coverage.

#### `langgptai/awesome-claude-prompts`
- URL: https://github.com/langgptai/awesome-claude-prompts
- Use here: prompt structure ideas and Claude-specific patterns
- Verdict: `mine for patterns`

#### `ericosiu/ai-marketing-skills`
- URL: https://github.com/ericosiu/ai-marketing-skills
- Use here: content and growth playbooks for CMO sub-agents
- Verdict: `mine for patterns`

#### `ScaleBrick/founder-marketing-skills`
- URL: https://github.com/ScaleBrick/founder-marketing-skills
- Use here: founder-centric marketing execution prompts
- Verdict: `mine for patterns`

#### `OpenClaudia/openclaudia-skills`
- URL: https://github.com/OpenClaudia/openclaudia-skills
- Use here: general marketing, SEO, email, and growth task libraries
- Verdict: `mine for patterns`

#### `coreyhaines31/marketingskills`
- URL: https://github.com/coreyhaines31/marketingskills
- Use here: CRO and analytics-oriented specialist prompts
- Verdict: `mine for patterns`

#### `Prospeda/gtm-skills`
- URL: https://github.com/Prospeda/gtm-skills
- Use here: sales and GTM agent training content
- Verdict: `mine for patterns`

#### `WynterJones/CoppieGPT`
- URL: https://github.com/WynterJones/CoppieGPT
- Use here: copywriting frameworks for CMO and content agents
- Verdict: `mine for patterns`

#### `joelparkerhenderson/pitch-deck`
- URL: https://github.com/joelparkerhenderson/pitch-deck
- Use here: pitch, narrative, and deck-logic prompts for strategy agents
- Verdict: `mine for patterns`

## Mine for Patterns Only

These are useful, but not smart to install directly into the current Jarvis build.

### `All-Hands-AI/OpenHands`
- URL: https://github.com/All-Hands-AI/OpenHands
- Why not install directly: too big and general for a stage-specific CEO-orb demo
- What to borrow: multi-agent workflow ideas and operator feel

### `agentscope-ai/agentscope`
- URL: https://github.com/agentscope-ai/agentscope
- Why not install directly: heavy for your timeline
- What to borrow: turn-taking and multi-agent meeting patterns

### `OpenBMB/ChatDev`
- URL: https://github.com/OpenBMB/ChatDev
- Why not install directly: wrong product shape for the live stage runtime
- What to borrow: inter-agent dialogue staging

### `harsh-raj00/my-jarvis`
- URL: https://github.com/harsh-raj00/my-jarvis
- Why not install directly: useful visually, but not a clean base for your current architecture
- What to borrow: HUD language and Jarvis-style visual motifs

### `e-Nicko/webgl-digital-globe`
- URL: https://github.com/e-Nicko/webgl-digital-globe
- Why not install directly: too specific as a whole component
- What to borrow: holographic globe feel for the CEO core or idle scene

### `evilmartians/agent-prism`
- URL: https://github.com/evilmartians/agent-prism
- Why not install directly: likely overkill for the first stage version
- What to borrow: agent trace visual ideas if you add operator mode later

## The Recommended Install Set For This Exact Project

If the goal is to improve this repo now, install these first and ignore the rest until they are wired:

### Frontend
- `xstate`
- `@xstate/react`
- `@statelyai/inspect`
- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/postprocessing`
- `@xyflow/react`
- `howler`
- `audiomotion-analyzer`
- `ai`

### Backend
- `langgraph`
- `langgraph-supervisor`
- `langfuse`
- `promptfoo` as dev dependency or separate eval tool

### External integration repos to wire after core UI redesign
- `modelcontextprotocol/servers`
- `microsoft/playwright-mcp`
- `GLips/Figma-Context-MCP`

## Install Commands

### Frontend

Run inside `jarvis-stage/frontend`:

```bash
npm install xstate @xstate/react @statelyai/inspect three @react-three/fiber @react-three/drei @react-three/postprocessing @xyflow/react howler audiomotion-analyzer ai
```

### Backend

Run inside `jarvis-stage/backend` with the virtual environment active:

```bash
pip install langfuse
```

If `langgraph` and `langgraph-supervisor` ever need to be explicitly refreshed:

```bash
pip install -U langgraph langgraph-supervisor
```

### Eval layer

Run in `jarvis-stage/frontend` or repo root depending on where you keep eval configs:

```bash
npm install -D promptfoo
```

## What I Would Actually Build Next

If this were my stack for the next 3 implementation moves, I would do this order:

1. Add `XState` and redesign the UI around one CEO orb with hidden executive agents.
2. Add `R3F + postprocessing + audioMotion-analyzer` so the CEO orb becomes the hero visual and reacts to voice.
3. Add `xyflow` only for the executive/sub-agent fan-out after command submission.

After that:

4. Add `Howler` for stage-safe cues.
5. Add `Langfuse` and `Promptfoo` for debug and rehearsal quality.
6. Add `Playwright MCP` and `modelcontextprotocol/servers` for real-world power demos.

## The Final Cut

If you want the shortest serious stack, the best 10 GitHub repos for this exact Jarvis are:

1. `langchain-ai/langgraph`
2. `langchain-ai/langgraph-supervisor-py`
3. `statelyai/xstate`
4. `statelyai/inspect`
5. `pmndrs/react-three-fiber`
6. `pmndrs/drei`
7. `pmndrs/react-postprocessing`
8. `xyflow/xyflow`
9. `langfuse/langfuse`
10. `microsoft/playwright-mcp`

If you want the strongest expanded stack, add:

11. `paper-design/shaders`
12. `hvianna/audioMotion-analyzer`
13. `goldfire/howler.js`
14. `modelcontextprotocol/servers`
15. `GLips/Figma-Context-MCP`
16. `Ephibbs/flowtoken`
17. `promptfoo/promptfoo`
18. `CopilotKit/canvas-with-langgraph-python`
19. `anthropics/claude-agent-sdk-demos`
20. `pipecat-ai/pipecat`

That is the stack that makes this project substantially better across research, content, interface, frontend, backend, and debugging without bloating it into a Frankenstein build.