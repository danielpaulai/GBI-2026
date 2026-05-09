# 15 — Voice Integration Masterplan

**Mission:** Build a Jarvis-style voice demo that ships, on stage, in Singapore, in front of a noisy room. Spacebar → speak → < 2 seconds → reasoning + Claude response + spoken reply. No "it worked in rehearsal." No robotic voice. No interruption hell.

This is the production-grade voice stack. Opinionated. The 50-vendor lists are useless — they paralyse. Below: what to use, what to skip, the bugs that kill voice demos, and the exact prompt language to drop into Cursor.

> **About KIE.AI:** Confirmed. KIE.AI is **not** a voice agent platform. It is an aggregator API for image/video/music models — Veo 3.1, Suno V4, Flux, Nano Banana, Midjourney, Runway. It is 30–80% cheaper than calling those vendors direct. **Use KIE.AI for the visual layer of Jarvis (background video, generated avatars, music stings) — not for voice.** Voice goes through ElevenLabs / Cartesia / Deepgram. Stop trying to make KIE.AI the voice path.

---

## SECTION A — THE RECOMMENDED VOICE STACK FOR STAGE

### The two-path decision

There are only two stacks worth building in 2026. Pick one, never mix.

**Path 1 — "Build it yourself" (recommended for Jarvis stage demo)**

```
Spacebar (push-to-talk, no VAD ambiguity)
   ↓
Browser MediaRecorder OR python-sounddevice capture
   ↓
Deepgram Nova-3 streaming STT  ← (~250ms first transcript)
   ↓
Anthropic Claude Haiku 4.5 streaming + prompt caching ← (~100ms TTFT cached)
   ↓
ElevenLabs Flash v2.5 streaming TTS ← (~75ms TTFA)
   ↓
WebAudio playback with interrupt-on-spacebar-hold
```

Total budget: **~1.2–1.5 seconds end-to-end** with proper streaming. Achievable on stage.

**Path 2 — "Managed framework" (recommended if you have a sound engineer + WebRTC)**

```
LiveKit Agents (Python) OR Pipecat
   ↓
Krisp BVC noise cancellation (LiveKit Cloud)
   ↓
Deepgram Nova-3 STT + Silero VAD + Smart-Turn v3
   ↓
Claude Haiku 4.5 (via livekit.plugins.anthropic)
   ↓
ElevenLabs Flash v2.5 OR Cartesia Sonic-3 TTS
```

Total budget: **~700–900ms end-to-end** measured. The serious production path.

### For GBI Singapore — the call

**Use Path 1.** Reasons:
1. Stage demo doesn't need WebRTC overhead — you have one user at a time, you're the one holding the mic.
2. Spacebar push-to-talk eliminates the entire VAD/turn-detection class of bugs. The bug Danny is hitting *is* a VAD bug 90% of the time.
3. You can run it from a single Python script + a small Electron/web frontend. No Docker, no Daily room, no LiveKit project.
4. Prompt caching alone gives you ~85ms back on every turn.

The full kit:
- **Mic:** Shure SM58 or Beta 58A (supercardioid, dynamic). Plugged into a USB audio interface (Focusrite Scarlett Solo / Universal Audio Volt). **Do not use Bluetooth.** Do not use a laptop built-in mic. Do not use AirPods.
- **Capture:** `sounddevice` Python or browser `MediaRecorder` with `noiseSuppression: true, echoCancellation: true`.
- **Pre-STT denoise (optional but recommended):** Krisp VIVA or RNNoise, applied to the captured chunk before sending to Deepgram. Audience clap noise is real.
- **STT:** Deepgram Nova-3, streaming WebSocket, `endpointing: 300, vad_events: true`.
- **LLM:** Claude Haiku 4.5 with a `cache_control` block on the system prompt so every turn after the first is sub-100ms TTFT.
- **TTS:** ElevenLabs Flash v2.5 over WebSocket with `auto_mode: true` and `flush: true` at end of utterance.
- **Voice:** Use a **default ElevenLabs voice** or an **IVC clone of Danny**. **Do NOT use Professional Voice Clone (PVC) on stage** — PVC is heavier and slower to first audio. (PVC is for podcasts, IVC/default for live agents.)
- **Output:** Local audio device with a 1–2 sample buffer max. Pipe through stage PA.

---

## SECTION B — TOP 10 REPOS RANKED BY LEVERAGE

Ranked by: how much of Danny's stage demo this repo solves, on its own.

### 1. `pipecat-ai/pipecat`
- **URL:** https://github.com/pipecat-ai/pipecat
- **License:** BSD-2-Clause
- **Why #1:** This is *the* production voice agent framework. Every serious voice product (Daily, NVIDIA, Hugging Face's voice demos) runs on it. Has built-in: Anthropic, ElevenLabs, Deepgram, Cartesia, Krisp, Silero VAD, Smart-Turn V3 — all swappable.
- **Study:** `examples/foundational/14a-function-calling-anthropic.py` (Claude integration), `examples/voice/voice-elevenlabs-http.py` (ElevenLabs), and the `pipecat/services/` folder.
- **Integration cost:** 4–8 hours to a working agent if you follow the foundational examples. 1 day if you want it Krisp-clean and Smart-Turn-tuned.
- **Active 2025–2026:** Yes. v0.0.102+ ships Smart-Turn V3 as default. NVIDIA shipped a Pipecat-based blueprint Q1 2026.

### 2. `livekit-examples/agent-starter-python`
- **URL:** https://github.com/livekit-examples/agent-starter-python
- **License:** Apache-2.0
- **Why:** Cloned in seconds with `lk app create --template voice-pipeline-agent-python`. Has Dockerfile, frontend, and is explicitly designed to be edited by Cursor / Claude Code / Codex.
- **Study:** `agent.py`, swap the LLM to `livekit.plugins.anthropic.LLM(model="claude-haiku-4-5")`.
- **Integration cost:** 2 hours if you have a LiveKit account, 4 hours if not.
- **Active:** Yes. LiveKit Agents 1.5.x as of April 2026.

### 3. `livekit/agents`
- **URL:** https://github.com/livekit/agents
- **License:** Apache-2.0
- **Why:** The framework. Ships built-in LLM, STT, TTS adapters (including Anthropic, Deepgram, Cartesia, ElevenLabs), Silero VAD, semantic turn detector, Krisp noise suppression integration, and a working Dockerfile.
- **Study:** `livekit-agents/livekit/agents/voice/agent.py`, `livekit-plugins/livekit-plugins-anthropic/`, `livekit-plugins/livekit-plugins-elevenlabs/`.
- **Integration cost:** 1 day from clone to working stage demo if you've used WebRTC before. 2–3 days if not.

### 4. `openai/openai-realtime-agents`
- **URL:** https://github.com/openai/openai-realtime-agents
- **License:** MIT
- **Why:** The cleanest reference for **push-to-talk** WebSocket pattern: `turn_detection: null`, `input_audio_buffer.append`, `commit`, `response.create`. This is the exact pattern Danny needs even if he doesn't end up using OpenAI Realtime.
- **Study:** The PTT branch of the demo. The voice in path → forward transcript → Claude → speak pattern.
- **Integration cost:** 3 hours to extract the PTT pattern and port to Claude.

### 5. `elevenlabs/elevenlabs-examples`
- **URL:** https://github.com/elevenlabs/elevenlabs-examples
- **License:** MIT
- **Why:** Official, maintained, has Next.js conversational AI starter and Python streaming TTS examples. The "Add a Santa Voice Agent to Your React App in Minutes" tutorial is literally Danny's stage demo with a different prompt.
- **Study:** `examples/conversational-ai/nextjs-conversational-ai/` and the Python `quickstart_streaming.py`.
- **Integration cost:** 1 hour to a hello-world. 1 day to a polished stage version.

### 6. `pipecat-ai/smart-turn`
- **URL:** https://github.com/pipecat-ai/smart-turn
- **License:** BSD-2-Clause
- **Why:** Solves "did the user pause or finish?" — the #1 reason voice agents feel awkward. Whisper-Tiny base, ~8M params, runs in 12ms on CPU. v3.1 ships Q2 2026 with English+Spanish accuracy bumps.
- **Study:** `huggingface.co/pipecat-ai/smart-turn-v3` model card + the `analyzer.py` integration.
- **Integration cost:** 30 minutes if you're already on Pipecat. 4 hours standalone.

### 7. `daveebbelaar/ai-cookbook`
- **URL:** https://github.com/daveebbelaar/ai-cookbook
- **License:** MIT
- **Why:** Dave Ebbelaar's repo is the most copy-pastable "I just want voice working today" reference for ElevenLabs + LLM + streaming. Battle-tested code, comments are clear, no over-engineering.
- **Study:** `voice/elevenlabs/` and `agents/voice-agent/` folders.
- **Integration cost:** 2 hours.

### 8. `vocodedev/vocode-core`
- **URL:** https://github.com/vocodedev/vocode-core
- **License:** MIT
- **Why:** Modular, Python, supports Deepgram + Anthropic + ElevenLabs out of the box, has a documented latency optimisation: plays audio while next sentence is generating. Best fallback if Pipecat feels heavy.
- **Study:** `vocode/streaming/agent/base_agent.py` for the response/synth concurrency pattern.
- **Integration cost:** 3–5 hours.

### 9. `Open-LLM-VTuber/Open-LLM-VTuber`
- **URL:** https://github.com/Open-LLM-VTuber/Open-LLM-VTuber
- **License:** MIT
- **Why:** This is the closest thing to "Jarvis on stage" already built. Runs offline, Live2D avatar, voice interruption, supports Claude, ElevenLabs, Whisper, Coqui, MeloTTS. Originally built to recreate Neuro-Sama (the AI Vtuber). If you want the *vibe* of Jarvis without 6 weeks of glue code, fork this.
- **Study:** `src/open_llm_vtuber/agent/agents/` and `src/open_llm_vtuber/asr/`.
- **Integration cost:** 1 day to fork + reskin to Jarvis.

### 10. `livekit-examples/voice-pipeline-agent-python`
- **URL:** https://github.com/livekit-examples/voice-pipeline-agent-python
- **License:** Apache-2.0
- **Why:** The minimal LiveKit voice agent — 200 lines. If Path 2 is the chosen route, this is the fastest way in. Anthropic + Deepgram + Cartesia stack ships pre-wired.
- **Integration cost:** 2 hours.

---

## SECTION C — 15–20 SUPPORTING REPOS

### STT (Speech-to-Text)

| # | Repo | Use case |
|---|------|----------|
| 11 | `SYSTRAN/faster-whisper` https://github.com/SYSTRAN/faster-whisper | Local fallback STT if Deepgram is unreachable. CTranslate2 backed, 4× faster than openai/whisper. License: MIT. |
| 12 | `collabora/WhisperLive` https://github.com/collabora/WhisperLive | Streaming Whisper if you want everything offline on stage (paranoid fallback). License: MIT. |
| 13 | `Vaibhavs10/insanely-fast-whisper` https://github.com/Vaibhavs10/insanely-fast-whisper | Batch-mode rocket — 150 min audio in 98s on a Mac/NVIDIA. Use for post-event transcript artefacts. License: Apache-2.0. |
| 14 | `ufal/whisper_streaming` https://github.com/ufal/whisper_streaming | Real-time Whisper with chunking strategy if you don't want Deepgram. License: MIT. |

### VAD / Turn Detection

| # | Repo | Use case |
|---|------|----------|
| 15 | `snakers4/silero-vad` https://github.com/snakers4/silero-vad | The de-facto VAD. Tiny (1.5MB), CPU-only, < 1ms inference. Pipecat and LiveKit both use this. License: MIT. |
| 16 | `pipecat-ai/smart-turn-v3` (HF) https://huggingface.co/pipecat-ai/smart-turn-v3 | Semantic turn detection — knows the difference between "uhm…" and the actual end of speech. |

### Wake-word / Push-to-talk / Audio capture

| # | Repo | Use case |
|---|------|----------|
| 17 | `Picovoice/porcupine` https://github.com/Picovoice/porcupine | Wake-word "Hey Jarvis" — 97%+ accuracy with < 1 false alarm / 10h. **Free for non-commercial; paid for events.** |
| 18 | `dscripka/openWakeWord` https://github.com/dscripka/openWakeWord | Open-source, runs 15-20 models on a Pi 3 core. Use this if you don't want to license Porcupine. License: Apache-2.0. |
| 19 | `lmacan1/talktype` https://github.com/lmacan1/talktype | Reference push-to-talk hotkey + sounddevice pattern in ~300 lines. Steal the global-hotkey + record loop. |
| 20 | `spatialaudio/python-sounddevice` https://github.com/spatialaudio/python-sounddevice | The Python audio capture library. Don't use PyAudio. License: MIT. |

### TTS

| # | Repo | Use case |
|---|------|----------|
| 21 | `elevenlabs/elevenlabs-python` https://github.com/elevenlabs/elevenlabs-python | Official Python SDK. Use the `text_to_speech.convert_realtime` and `voices.ivc.create` endpoints. License: MIT. |
| 22 | `elevenlabs/ui` https://github.com/elevenlabs/ui | shadcn/ui components built specifically for multimodal voice agents — mic button, audio waveform, transcript pane. Steal liberally. License: MIT. |
| 23 | `elevenlabs/elevenlabs-mcp` https://github.com/elevenlabs/elevenlabs-mcp | Official MCP server — let Claude Code generate TTS without a custom integration layer. |

### Frontend / React

| # | Repo | Use case |
|---|------|----------|
| 24 | `JamesBrill/react-speech-recognition` https://github.com/JamesBrill/react-speech-recognition | Web Speech API hook — useful as fallback STT in the browser. License: MIT. |
| 25 | `ASHR12/elevenlabs-conversational-ai-agents` https://github.com/ASHR12/elevenlabs-conversational-ai-agents | Next.js + ElevenLabs agent reference — closest to the on-stage UI. License: MIT. |
| 26 | `harsh-raj00/my-jarvis` https://github.com/harsh-raj00/my-jarvis | React + Three.js + ElevenLabs + WebSocket Jarvis with a holographic Iron-Man interface. The visual reference. |

### Noise / Audio quality

| # | Repo / Service | Use case |
|---|----------------|----------|
| 27 | Krisp VIVA SDK https://krisp.ai/developers/ | Closed-source, but the gold standard for AI voice noise cancellation. Available on Pipecat Cloud and LiveKit Cloud. **Note: Krisp BVC adds cost from May 1, 2026 on LiveKit.** |
| 28 | ai-coustics Quail (LiveKit Cloud) https://docs.livekit.io/transport/media/noise-cancellation/ | Krisp's main competitor. Better in low-SNR/reverberant rooms — i.e. ballrooms. Worth A/B testing on stage. |
| 29 | RNNoise https://github.com/xiph/rnnoise | Open-source, C, runs anywhere. The fallback. License: BSD. |

### Reference voice apps

| # | Repo | Use case |
|---|------|----------|
| 30 | `kwindla/macos-local-voice-agents` https://github.com/kwindla/macos-local-voice-agents | Pipecat running 100% locally on macOS with Whisper + Llama + Coqui. The "what if the wifi dies on stage" insurance policy. |
| 31 | `ethanplusai/jarvis` https://github.com/ethanplusai/jarvis | Voice-first macOS Jarvis — Calendar/Mail/Notes integration. Architecture reference. |
| 32 | `mahimairaja/voiceai` https://github.com/mahimairaja/voiceai | Curated list of 200+ voice AI papers/repos. Use as a reference index. |
| 33 | `pipecat-ai/pipecat-flows` https://github.com/pipecat-ai/pipecat-flows | Structured dialogue framework — when you want the demo to follow a script and not freestyle. |

### Inference accelerators

| # | Service | Use case |
|---|---------|----------|
| 34 | Groq (cloud) https://groq.com | Sub-100ms TTFT for Llama models. Use if you want to fall back from Claude on stage. |
| 35 | Cerebras (cloud) https://cerebras.ai | 4,000 tok/s peak. The fastest LLM inference money can buy in 2026. |

---

## SECTION D — THE 7 MOST COMMON BUGS THAT BREAK VOICE AGENTS IN PRODUCTION

These are the bugs that kill stage demos. Every single one has a fix.

### Bug 1 — "It worked in rehearsal but on stage it kept interrupting itself"
**Root cause:** VAD picking up the speaker's own audio (TTS output) bleeding back through the mic.
**Fix:**
- Use a **closed-back headset mic** or a directional handheld (SM58) so the speaker's own voice isn't picked up.
- Set `echoCancellation: true` on `getUserMedia`.
- For Pipecat/LiveKit, enable `noise_cancellation = noise_cancellation.BVC()` in the room input options.
- **Bulletproof option:** ditch VAD entirely on stage — use **push-to-talk (spacebar)**. The system literally cannot self-interrupt because the mic is closed when TTS plays.

### Bug 2 — "The voice sounds robotic / chops up at sentence boundaries"
**Root cause:** ElevenLabs streaming chunks committed too early — the model hasn't seen enough context for natural prosody.
**Fix:**
- Set `auto_mode: true` on the WebSocket — ElevenLabs handles chunking automatically.
- Send `flush: true` only at the end of an LLM turn, not mid-sentence.
- Don't manually split LLM tokens into char-by-char chunks. Send sentence-level chunks at minimum.
- Use the **default voices** or **IVC** for stage. **PVC adds latency.**

### Bug 3 — "There's a 4-second gap before the voice starts speaking"
**Root cause:** The agent is buffering the *entire* LLM response before starting TTS.
**Fix:**
- Stream LLM tokens. Pipe them into TTS WebSocket as soon as the first sentence boundary appears.
- Use `claude-haiku-4-5` not `claude-opus`. Haiku is 4–5× faster TTFT.
- Add `cache_control: { "type": "ephemeral" }` on your system prompt block. Cached prefix saves ~85ms on every turn after the first.
- For voice, **always** stream. Never `await` the full LLM response.

### Bug 4 — "STT keeps cutting me off mid-sentence"
**Root cause:** End-of-utterance detection too aggressive.
**Fix:**
- On Deepgram: set `endpointing: 500` (ms of silence to wait) and `utterance_end_ms: 1000`.
- Pipecat: use `LocalSmartTurnAnalyzerV3` with `stop_secs=0.4` (raised from 0.2 default).
- Push-to-talk eliminates this entirely — you control when the buffer commits.

### Bug 5 — "The audio coming out is choppy / distorted"
**Root cause:** Audio output buffer too small, or sample rate mismatch.
**Fix:**
- Match the TTS output sample rate to the audio device. ElevenLabs Flash v2.5 default is 24kHz mono PCM. Resample explicitly to 48kHz or whatever your stage PA expects.
- Set `audio_buffer_ms: 100` minimum on the playback side.
- On macOS: use `sounddevice.OutputStream` with `blocksize=2048`.

### Bug 6 — "Audience clapping makes it transcribe garbage"
**Root cause:** No noise suppression before STT.
**Fix:**
- **Pre-STT denoise** — put Krisp VIVA or ai-coustics Quail *between* the mic capture and the STT call. Even RNNoise helps.
- Use a **directional dynamic** mic (SM58) — Stage 1 of noise rejection is hardware.
- Ban `getUserMedia` defaults — force `noiseSuppression: true, autoGainControl: false` (auto-gain ramps up audience noise during pauses).

### Bug 7 — "On the day of the event, the API key is rate-limited / wifi flakes"
**Root cause:** Single point of failure on a live stage.
**Fix:**
- **Pre-warm your model** — fire a dummy request 60 seconds before the demo (defeats cold-start).
- **Have a local fallback** — `faster-whisper` + Llama on Groq + Coqui TTS as Plan B. `kwindla/macos-local-voice-agents` is exactly this.
- **Use a wired ethernet adapter** on stage. Stage wifi is the enemy.
- **Tether to a phone hotspot** as Plan C. Test the failover at least once.
- **Cache the system prompt with 1-hour TTL** on Anthropic — pay the extra cost, get the lower latency.

---

## SECTION E — LATENCY OPTIMIZATION CHECKLIST

Target: **< 1.5s** from end-of-speech to first audio out. Realistic with the stack below.

### The latency budget (achievable)

| Stage | Time | Notes |
|-------|------|-------|
| Mic capture → buffer commit | ~50ms | Fixed cost, push-to-talk release |
| Pre-STT denoise (optional) | ~20ms | Krisp/ai-coustics |
| Deepgram Nova-3 streaming STT | 200–300ms | First final transcript |
| Network → Claude API | 30–80ms | US datacenter |
| Claude Haiku 4.5 TTFT (cached) | 80–150ms | Prompt-cached system prompt |
| Token stream → TTS WebSocket | 0ms | Concurrent |
| ElevenLabs Flash v2.5 TTFA | 75–150ms | First audio chunk |
| Audio buffer → speaker | 50–100ms | Output buffer |
| **Total (end of speech → first audio)** | **~700–1000ms** | Achievable |
| **Total (push-to-talk release → first audio)** | **~500–800ms** | Best case |

### Checklist (in priority order)

- [ ] **Use Claude Haiku 4.5, not Opus.** 4–5× faster TTFT. Cost is irrelevant for a single stage demo.
- [ ] **Add prompt caching to the system prompt.** `cache_control: {"type": "ephemeral"}` on the largest static block. Saves ~85ms per cached turn + 90% input cost. Use 1-hour TTL — pay for it.
- [ ] **Stream LLM tokens directly into TTS WebSocket.** Never `await` the full response.
- [ ] **Use ElevenLabs Flash v2.5, not v3.** v3 has higher latency and is *not* designed for real-time. Flash v2.5 is the conversational model. Confirmed by ElevenLabs docs.
- [ ] **Use Deepgram Nova-3, not Whisper, for streaming STT.** ~250ms vs Whisper's batch-only latency.
- [ ] **Set `auto_mode: true` on ElevenLabs WebSocket.** Automatic chunking, no manual flush logic.
- [ ] **Pre-warm the connection.** Fire a dummy 1-token request 30 seconds before the demo to spin up the websocket.
- [ ] **Use IVC voice clones, not PVC.** PVC adds ~50–100ms.
- [ ] **Disable `autoGainControl`** in `getUserMedia` — auto-gain pumps audience noise during silence.
- [ ] **Use push-to-talk on stage.** Eliminates ~300ms of VAD/turn-detection overhead.
- [ ] **Co-locate.** Pick a Claude region close to your laptop. Run the agent on a US-East server, not on stage hardware in Singapore.
- [ ] **Wired ethernet, not wifi.** Saves 50–200ms jitter.
- [ ] **Buffer playback minimally.** 50–100ms output buffer max.

---

## SECTION F — STAGE-SPECIFIC PATTERNS

### Push-to-talk implementation (recommended for GBI)

The single biggest reliability win. The volunteer holds spacebar, speaks, releases. There is no "did the system think I finished talking?" question. There is no echo from the PA system. There is no false-trigger from audience laughter.

**Web (recommended for the demo UI):**
```js
// keydown spacebar → start MediaRecorder
// keyup spacebar → stop, send blob to /api/transcribe
useEffect(() => {
  const down = (e) => { if (e.code === 'Space' && !holding.current) start(); }
  const up = (e) => { if (e.code === 'Space') stop(); }
  document.addEventListener('keydown', down);
  document.addEventListener('keyup', up);
  return () => { /* cleanup */ }
}, []);
```

**Python (if running headless on stage):**
```python
from pynput import keyboard
import sounddevice as sd

def on_press(key):
    if key == keyboard.Key.space and not recording:
        start_record()

def on_release(key):
    if key == keyboard.Key.space:
        stop_record_and_send()
```

Reference: `lmacan1/talktype` shows the exact pattern with sounddevice + pynput.

### The kill switch (mandatory for stage)

Always include: **Esc = full silence, immediate stop**. If TTS goes off the rails, the host hits Esc and the system shuts up immediately. Do not let the agent finish its sentence. Do not fade. Hard cut.

```js
// Esc → cancel any in-flight TTS, kill audio context
if (e.code === 'Escape') {
  audioContext.suspend();
  ws.send(JSON.stringify({ type: 'response.cancel' }));
}
```

For OpenAI Realtime: `response.cancel` + `conversation.item.truncate`.
For ElevenLabs WebSocket: close the socket, the audio stops.

### Audience noise pattern

1. **Hardware first.** Shure SM58 (supercardioid). Dynamic, not condenser. Off-axis rejection is 20+ dB.
2. **Echo cancellation on capture.** Browser: `getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false }})`.
3. **Krisp VIVA between mic and STT.** ~30ms latency, removes background voices and stage rumble. Put this in the pipeline if you can.
4. **Test in the actual room.** Not in a quiet hotel room. Walk into the ballroom 24h before, run a full demo with PA blasting, fix what breaks.

### Wake word vs push-to-talk decision matrix

| Stage situation | Pick |
|------------------|------|
| Volunteer at a podium with a mic | **Push-to-talk** |
| Hands-free demo, you wandering the stage | **Wake word** (Porcupine — paid, more accurate; openWakeWord — free, ok) |
| Demo is "look how natural this is" | VAD + Smart-Turn (Pipecat) |
| Demo is "look how reliable this is" | **Push-to-talk** |

For Danny's Jarvis demo: **push-to-talk**. The narrative is "pilot-on-the-stick" not "ambient AI."

### The "last-minute" config (run this 60 minutes before stage)

```bash
# Pre-warm
curl -s https://api.deepgram.com/v1/listen -H "Authorization: Token $DG_KEY" -d "{}"
curl -s https://api.elevenlabs.io/v1/voices -H "xi-api-key: $EL_KEY"
curl -s https://api.anthropic.com/v1/messages -H "x-api-key: $AN_KEY" -d "..." # 1-token dummy

# Verify mic
sox -d -n stat -v 5  # confirm the right input device

# Verify output
say "Jarvis online" -o /tmp/test.aiff && afplay /tmp/test.aiff

# Lock the system
caffeinate -d &  # don't sleep
do-not-disturb on  # silence notifications

# Network failover
# Plan A: stage ethernet
# Plan B: hotel wifi
# Plan C: phone hotspot, pre-tested
```

---

## SECTION G — CURSOR INSTRUCTION SET

Drop this verbatim into Cursor. It's the prompt that makes the integration ship the first time.

```
You are building a stage-ready Jarvis voice demo for a live keynote in Singapore.

NON-NEGOTIABLE STACK:
- Frontend: Next.js 14 + React 18 + Tailwind. Single page. Fullscreen.
- Audio capture: Browser MediaRecorder via getUserMedia, with options:
    { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false, sampleRate: 16000, channelCount: 1 } }
- Push-to-talk: spacebar keydown starts recording, keyup stops + sends.
- Esc kills any in-flight TTS audio (suspend AudioContext + close ElevenLabs WebSocket).
- STT: Deepgram Nova-3 streaming. Use `@deepgram/sdk` v3+. WebSocket transport.
    Options: model="nova-3", endpointing=500, utterance_end_ms=1000, vad_events=true,
    smart_format=true, interim_results=false, language="en-US".
- LLM: Claude Haiku 4.5 via @anthropic-ai/sdk. 
    Use streaming. Use prompt caching with cache_control: {"type": "ephemeral"} on the system prompt.
    System prompt: large static block describing Jarvis persona + Danny's bio + the demo context.
- TTS: ElevenLabs Flash v2.5 via WebSocket (wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?model_id=eleven_flash_v2_5).
    Use auto_mode=true. Send flush=true at the end of each LLM stream.
    Voice: a default voice or an IVC clone of Danny. Do NOT use PVC (too slow).

ARCHITECTURE:
1. /app/page.tsx — UI (mic button, transcript pane, Esc handler)
2. /app/api/agent/route.ts — Edge route. Receives audio blob, returns audio stream.
   Pipeline: audio → Deepgram (over WebSocket) → transcript → Claude streaming → ElevenLabs WebSocket streaming → audio chunks back to client.
3. Use Vercel AI SDK's `streamText` for Claude. Set `experimental_transform: smoothStream`.
4. Stream LLM tokens INTO ElevenLabs WebSocket as they arrive. Do NOT buffer the full response.

LATENCY RULES:
- Total budget end-of-speech → first audio: 1500ms hard ceiling, 800ms target.
- If any single stage > 400ms, log a WARN.
- Pre-warm: on page load, fire a 1-token Claude dummy + open ElevenLabs WebSocket. Reuse for 5 minutes.

UI RULES:
- Black background. Cyan accent. Show: 1) mic state, 2) live transcript (faded in as it streams), 3) Claude response text streaming alongside audio.
- Visible "Hold SPACE to speak" hint. Visible "ESC to silence" hint.
- Audio waveform visualization while user is speaking. Pulsing orb while Jarvis is speaking.

TESTING REQUIREMENTS:
- Add a /test page that runs a synthetic demo: pre-recorded WAV → transcribe → respond → speak. Must complete in < 2s.
- Add a kill-switch test: hit Esc mid-response, verify audio stops < 100ms.
- Add a noise test: play a 30s clip of crowd noise, verify STT still transcribes a 3-word command correctly.

DELIVERABLES:
- Working Next.js app, deploys to Vercel (Node runtime for the API route, not Edge — Edge has WebSocket limits).
- README with the exact env vars: ANTHROPIC_API_KEY, DEEPGRAM_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID.
- A `pre-show-checklist.md` with the 60-minutes-before steps from Section F.
- A fallback mode: if any of the three APIs return 5xx, fall back to a hardcoded "I'm Jarvis. Stand by, my brain is rebooting." spoken via Web Speech API. The demo never silently dies.

DO NOT:
- Use ElevenLabs Eleven v3 (too slow for real-time).
- Use Whisper for streaming STT (Deepgram Nova-3 is faster).
- Use Opus 4.7 for the LLM (Haiku 4.5 is what you want).
- Buffer full LLM responses before TTS (always stream).
- Use VAD on stage. Push-to-talk only.
- Use Bluetooth audio (latency is non-deterministic).
- Use the Edge runtime for the WebSocket relay (Node only).
- Make the user wait for a "loading" spinner. Stream every byte.

REFERENCE REPOS (read these first):
- pipecat-ai/pipecat (production architecture reference)
- elevenlabs/elevenlabs-examples (Next.js conversational AI)
- daveebbelaar/ai-cookbook (clean voice patterns)
- openai/openai-realtime-agents (push-to-talk pattern)
- ASHR12/elevenlabs-conversational-ai-agents (Next.js wiring)
- harsh-raj00/my-jarvis (visual reference)
```

---

## CLOSING NOTES

The reason "KIE.AI, ElevenLabs, voice agents are connected but nothing works" is almost certainly that someone tried to make KIE.AI part of the voice path. **It isn't.** KIE.AI is the visual layer (Veo / Suno / Flux). Voice is ElevenLabs + Deepgram + Claude, end of story.

The second reason is almost certainly VAD-related. Push-to-talk solves this in five minutes.

The third reason is almost certainly buffering. Stream every byte. Don't `await`. Don't accumulate.

Build Path 1 (push-to-talk + Next.js + Deepgram + Claude Haiku 4.5 + ElevenLabs Flash v2.5). Test it in the actual ballroom 24h before the keynote. Have the local fallback ready. Ship it.

— end —
