# 17 — Multi-Agent Quality Masterplan (May 2026)

**Audience:** Danny / Jarvis build team
**Question being answered:** Why does Jarvis ship 6/10 output today, and what 2026-current architecture ships 9.5/10?
**Bottom line:** The 2025 stack (LangGraph supervisor + CopilotKit) was right for *plumbing* and wrong for *quality*. Quality doesn't come from a better graph — it comes from a **drafter → critic → reviser → judge → ship** loop that's evaluated against rubrics, optimized by GEPA/DSPy, and observed in Langfuse. This doc tells you exactly what to swap, what to keep, and what to clone tomorrow.

> **The single biggest thing that changed in 2026:** AutoGen is in maintenance mode. OpenAI Swarm is replaced by the Agents SDK harness. LangGraph alone is no longer the answer — it's the *runtime* underneath an **agent harness** (Claude Agent SDK / LangChain Deep Agents) that adds planning, sub-agents, filesystem context, and quality loops as first-class primitives. The orchestration era ended; the **harness era** began.

---

## Section A — The Recommended Multi-Agent Stack (Locked Decisions, May 2026)

These are decisions, not options. Pick the 3 that win, build everything else around them.

### A1. The runtime sandwich (3 layers, locked)

| Layer | Pick | Why this and not the alternatives |
|---|---|---|
| **Harness** (top) | **Claude Agent SDK** (Python) for orchestration brain + sub-agents | Anthropic-native, sub-agents have isolated context windows, prompt caching is free, ships with file/code execution + Memory tool. Beats LangGraph alone because LangGraph has no opinion on context engineering. |
| **Graph runtime** (middle) | **LangGraph 0.4+** for stateful workflows that need checkpointing, human-in-the-loop interrupts, and replay | Best debugging story in the industry, LangSmith integration. Use it for the *deterministic* parts of the pipeline (the parts you can draw on a whiteboard). |
| **Frontend** (UI) | **CopilotKit + AG-UI Protocol** | Adopted by Google, LangChain, AWS, Microsoft, Mastra, PydanticAI. CopilotKit raised $27M Series A in May 2026. AG-UI is the SSE standard for streaming agent state to a UI. No serious alternative. |

**Why not Microsoft Agent Framework / AutoGen v0.5?** AutoGen is officially in maintenance mode (Microsoft folded it into Agent Framework). For a Claude-first shop, the Microsoft framework is friction without payoff.

**Why not pure LangGraph?** LangGraph is a graph runtime, not a quality engine. You still have to invent the critic/reviser/judge loop yourself. The harness gives you sub-agents and the loop ships out of the box.

**Why not Mastra (TypeScript)?** Tempting (22k stars, Gatsby team, $13M raised). Pick it only if your team is TS-only and won't touch Python. Otherwise the Anthropic-native Python path is shorter.

### A2. The quality engine (locked)

| Concern | Pick |
|---|---|
| Structured output + auto-retry on validation fail | **Instructor** (Python, 11k stars, 3M monthly downloads) — automatic retries with the validation error injected back into the next turn |
| Schema validation | **Pydantic v2** |
| Eval-driven optimization of agent prompts | **DSPy 3 + GEPA** — accepted at ICLR 2026 Oral, beats GRPO by 6–20% with 35× fewer rollouts. This is how you go from "prompts I wrote" to "prompts compiled against my rubric." |
| LLM-as-judge | Custom rubric scored by **Claude Opus 4.7** + cross-model verification with **GPT-5** (mitigates same-provider 5–15% score inflation bias) |
| Observability | **Langfuse** (MIT, self-hostable) primary; **LangSmith** if you stay in LangGraph |
| Memory | **Mem0** for shared cross-session memory; **Letta** if any agent needs to run for days on its own |

### A3. The MCP layer (locked)

MCP went from Anthropic protocol to **Linux Foundation Agentic AI Foundation standard (Dec 2025)**, adopted by OpenAI and Google. In 2026 every external tool Jarvis touches goes through MCP. No exceptions. This kills the "50 tools polluting context" problem because MCP clients can do tool retrieval (Tool RAG) rather than dumping all tool schemas in the prompt.

### A4. Reference deployment shape

```
[ User intent ]
      │
      ▼
[ CopilotKit / AG-UI front-end (SSE stream) ]
      │
      ▼
[ Lead Agent (Claude Opus 4.7, prompt-cached system prompt) ]
      │   spawns parallel sub-agents (each Sonnet 4.6, isolated context)
      │
      ├── Drafter sub-agent → produces v1
      ├── Critic sub-agent  → scores v1 against rubric, produces critique
      ├── Reviser sub-agent → reads v1 + critique, produces v2
      ├── Judge sub-agent   → scores v2; if ≥ 9/10 SHIP, else loop max 3×
      │
      └── all sub-agents call MCP servers for tools
                │
                ▼
[ Langfuse traces + Pydantic-validated structured output ]
```

---

## Section B — Top 10 Repos Ranked by Leverage (Clone in This Order)

### 1. `anthropics/claude-agent-sdk-python`
- **URL:** https://github.com/anthropics/claude-agent-sdk-python
- **License:** MIT
- **2026 status:** Active (renamed from claude-code-sdk Sept 2025). Sub-agents shipped public beta March 2026, Outcomes API public beta April 2026 under `managed-agents-2026-04-01` header.
- **The pattern that wins:** *Sub-agents with isolated context windows.* The lead agent context stays clean while sub-agents go deep on their slice. Each sub-agent only returns "relevant information" (its own decision) — not its full transcript. This is the single biggest fix for "my multi-agent system loses the plot."
- **What to actually steal:** the `Subagent` primitive + the file-system context offload pattern. Replace any custom "I'm passing the whole conversation to a sub-LLM" code with a real Subagent call.
- **Integration cost:** 1 day to wire, 3 days to retune prompts.

### 2. `langchain-ai/deepagents`
- **URL:** https://github.com/langchain-ai/deepagents
- **License:** MIT
- **2026 status:** Hit 9.9k stars in 5 hours during March 2026 update. Async sub-agents shipped April 2026.
- **The pattern that wins:** **the harness pattern.** Deep Agents is "LangGraph + planning tool + filesystem backend + sub-agents + write_todos tool" packaged. It's the LangChain answer to Claude Agent SDK. If you stay in LangGraph, this is your harness.
- **What to actually steal:** `write_todos` tool (forces the planner to externalise the plan into the file system), and the `task` tool that spawns context-isolated sub-agents.
- **Integration cost:** 1 day if you're already on LangGraph.

### 3. `stanfordnlp/dspy` + `gepa-ai/gepa`
- **URL:** https://github.com/stanfordnlp/dspy + https://github.com/gepa-ai/gepa
- **License:** MIT (DSPy), Apache-2.0 (GEPA)
- **2026 status:** GEPA accepted ICLR 2026 Oral. DSPy MIPROv2 + GEPA + BetterTogether is the production combo.
- **The pattern that wins:** *Compile your agent against a rubric.* Stop hand-tuning prompts. Define `dspy.Signature` for each agent role + a `metric()` function (your rubric) → run GEPA → get prompts that score 25-50% higher than what you wrote. ReAct went from 24% → 51% on HotPotQA in one MIPROv2 run on $2 of compute.
- **What to actually steal:** Wrap your drafter, critic, reviser, and judge as `dspy.Module`s. Compile the whole pipeline against a 50-example eval set. This is the single highest-leverage upgrade you can make.
- **Integration cost:** 2 days to convert, 1 day to build the eval set.

### 4. `567-labs/instructor`
- **URL:** https://github.com/567-labs/instructor
- **License:** MIT
- **2026 status:** 11k stars, 3M monthly downloads, Jan 29 2026 release.
- **The pattern that wins:** *Structured output with automatic validation-driven retry.* When the LLM returns invalid JSON, Instructor injects the Pydantic ValidationError back into the next call so the model self-corrects. This is why your output stops being "almost right but breaks the parser."
- **What to actually steal:** `client.chat.completions.create_with_completion(response_model=MyPydanticModel, max_retries=3)`. Wrap *every* sub-agent's final output in this.
- **Integration cost:** 2 hours per agent.

### 5. `pydantic/pydantic-ai`
- **URL:** https://github.com/pydantic/pydantic-ai
- **License:** MIT
- **2026 status:** 16.9k stars (May 7 2026). v1.85.1 stable. Used in Amazon Bedrock AgentCore.
- **The pattern that wins:** *Type-safe agents with durable execution.* Same Pydantic team that powers OpenAI / Anthropic / LangChain SDKs. Built-in checkpointing for agents that survive transient failures.
- **What to actually steal:** Use it as the *type discipline* layer even if you keep LangGraph orchestration. Every tool input/output, every agent return type, gets a Pydantic schema.
- **Integration cost:** 1-2 days; refactor pain depends on existing typing.

### 6. `langfuse/langfuse`
- **URL:** https://github.com/langfuse/langfuse
- **License:** MIT (core)
- **2026 status:** Open-source observability leader; self-hostable; US/EU/Japan/HIPAA-US data residency.
- **The pattern that wins:** *Trace every sub-agent call with cost, latency, scores, and replay.* Without observability you cannot tell *why* output is bad — you can only tell *that* it's bad. This is the missing instrument.
- **What to actually steal:** Tag every span with `agent_role`, `rubric_score`, `iteration_n`. Build a dashboard for "% of outputs that ship without revision" — your North Star quality metric.
- **Integration cost:** 4 hours self-hosted.

### 7. `mem0ai/mem0`
- **URL:** https://github.com/mem0ai/mem0
- **License:** Apache-2.0
- **2026 status:** 47k+ stars, framework-agnostic.
- **The pattern that wins:** *Passive memory extraction across sessions.* Pass conversation in, Mem0 decides what to store. Predictable: same input → same memories.
- **What to actually steal:** Per-user voice memory. Every time a user corrects the system ("not that tone, more like X"), `mem0.add()` it. Inject `mem0.search(user_query)` into every agent's system prompt.
- **Integration cost:** 1 day.

### 8. `CopilotKit/CopilotKit`
- **URL:** https://github.com/CopilotKit/CopilotKit
- **License:** MIT
- **2026 status:** $27M Series A May 2026 (Glilot, NFX, SignalFire). Makers of AG-UI Protocol — adopted by Google, LangChain, AWS, Microsoft, Mastra, PydanticAI.
- **The pattern that wins:** *Bidirectional streaming of agent state to UI.* User sees the drafter writing, sees the critic flagging, sees the reviser fixing — *as it happens*. This is what makes Jarvis feel like Tony Stark's lab instead of a chatbot.
- **What to actually steal:** AG-UI events for `subagent_started`, `rubric_score_updated`, `revision_n`. Bind them to your 3D UI so the orb pulses on each event.
- **Integration cost:** 2 days.

### 9. `FoundationAgents/MetaGPT` (formerly geekan/MetaGPT)
- **URL:** https://github.com/FoundationAgents/MetaGPT
- **License:** MIT
- **2026 status:** Top-4 most-starred AI agent repo on GitHub (April 2026, alongside AutoGPT, LangChain, OpenHands).
- **The pattern that wins:** *Role-based agents with a quality bar per role.* PM, Architect, Engineer, QA each have a deliverable spec and refuse to pass work that fails. The QA-rejects-and-sends-back pattern is the prior art for "boss agent rejects work."
- **What to actually steal:** Steal the **Role pattern** with quality criteria baked into the role's system prompt. Don't run MetaGPT itself — port the pattern into your Claude Agent SDK sub-agents.
- **Integration cost:** Read the source, port the pattern (1 day).

### 10. `noahshinn/reflexion`
- **URL:** https://github.com/noahshinn/reflexion
- **License:** MIT
- **2026 status:** NeurIPS 2023 paper, but the **MAR (Multi-Agent Reflexion)** extension (arXiv 2512.20845) is the 2026 evolution — separates Actor / Evaluator / Reflector across multiple personas to defeat the confirmation bias that breaks single-agent self-critique.
- **The pattern that wins:** *Verbal reinforcement learning across attempts.* The Reflector writes a textual "lesson" after each failure that gets prepended to the next attempt's context. The agent literally learns from its own mistakes within the session.
- **What to actually steal:** The "after a Judge rejects, write a Reflexion to the failure log file, and feed that file to the next Drafter attempt" loop. This is what stops the Reviser from making the same mistake on attempt 2 that it made on attempt 1.
- **Integration cost:** 1 day.

---

## Section C — 20 Supporting Repos (Strong Bench)

Group these by where they plug in. Use what you need, ignore the rest.

### Frameworks worth knowing (don't switch to them, but understand the patterns)

11. **`microsoft/autogen`** — *maintenance mode*, but the GroupChat critic-actor-judge pattern is canonical. Read the SocietyOfMindAgent source, don't run it. https://github.com/microsoft/autogen

12. **`openai/openai-agents-python`** (Swarm replacement) — production successor with handoffs, guardrails, tracing, sandboxing harness shipped April 2026. Fine for a GPT-only shop, friction for Claude-first. https://github.com/openai/openai-agents-python

13. **`google/adk-python`** — hierarchical parent/sub-agent model with three agent types (LLM, Workflow, Custom) and shared session state. Useful pattern reading; only adopt if you're committed to Vertex AI. https://github.com/google/adk-python

14. **`crewAIInc/crewAI`** — role-based crews, 30-60% faster than AutoGen on structured tasks, 34% fewer tokens. Great for prototyping; teams typically migrate to LangGraph/Claude Agent SDK for production state. https://github.com/crewAIInc/crewAI

15. **`mastra-ai/mastra`** — TypeScript-first, 22.3k stars, $13M seed (Oct 2025), v1.0 Jan 2026. The pick if Jarvis is TS end-to-end. https://github.com/mastra-ai/mastra

16. **`huggingface/smolagents`** — 26k+ stars. CodeAgent writes actions as Python (30% fewer steps than JSON tool-calling). Steal the CodeAgent idea: let the agent write code instead of choosing tools from a menu. https://github.com/huggingface/smolagents

17. **`agno-agi/agno`** — 39k+ stars; claims 5000× faster than LangGraph for the agent loop. Worth a benchmark if you hit latency walls. https://github.com/agno-agi/agno

18. **`All-Hands-AI/OpenHands`** — 65k stars. Their *OpenHands Index* (Jan 2026) is the most rigorous open agent benchmark suite. Use it as your eval inspiration. https://github.com/All-Hands-AI/OpenHands

### Critique-Revise / Society-of-Mind specific

19. **`Skytliang/Multi-Agents-Debate`** — first explicit MAD (Multi-Agent Debate) repo. Pattern: two debaters + judge in tit-for-tat until one concedes. https://github.com/Skytliang/Multi-Agents-Debate

20. **`vstorm-co/pydantic-deepagents`** — Claude Code-style deep agents on PydanticAI: tool-calling, sandboxed execution, multi-agent teams, skills, checkpoints. Reference impl for the harness pattern in PydanticAI. https://github.com/vstorm-co/pydantic-deepagents

21. **`coleam00/ai-transformation-workshop`** — Cole Medin's 15 reusable Claude Code commands + the **PIV loop** (Plan → Implement → Validate). The PIV loop is the simplest production-tested critique-revise. https://github.com/coleam00/ai-transformation-workshop

22. **`coleam00/Archon`** (v5/v6) — agent-builder agent. Generates agents from spec. Useful as a *meta-agent* reference, not as core stack. https://github.com/coleam00/Archon

### Memory & Context

23. **`letta-ai/letta`** (formerly MemGPT) — LLM self-edits its own memory (core/recall/archival tiers). Pick over Mem0 only if you need agents that run autonomously for days. https://github.com/letta-ai/letta

24. **`getzep/zep`** — temporal knowledge graph memory, ~24k stars. Best when relationships between entities matter (CRM-style, who-knows-whom). https://github.com/getzep/zep

### Structured output / retry

25. **`outlines-dev/outlines`** — grammar-constrained sampling. Use for *guaranteed* JSON shape (it's structurally impossible for the model to output invalid JSON). Pair with Instructor for retry semantics. https://github.com/outlines-dev/outlines

### Evals & observability

26. **`Arize-ai/phoenix`** — ML-grade rigor (drift detection, embedding analysis). Use alongside Langfuse if you need eval primitives Langfuse approximates. https://github.com/Arize-ai/phoenix

27. **`mlflow/mlflow`** — MLflow 3.x ships LLM-as-Judge as a first-class primitive in 2026. Worth it if you're already an MLflow shop. https://github.com/mlflow/mlflow

### MCP

28. **`modelcontextprotocol/servers`** — official reference MCP servers. Don't reinvent. https://github.com/modelcontextprotocol/servers

29. **`punkpeye/awesome-mcp-servers`** — community list, ranked by quality score. Find before you build. https://github.com/punkpeye/awesome-mcp-servers

### Workflow durability

30. **`triggerdotdev/trigger.dev`** — durable agent execution with no-timeout tasks, checkpoints, idempotency keys, waitpoints for human-in-the-loop. Pick over plain LangGraph when agents must survive deploys/crashes. https://github.com/triggerdotdev/trigger.dev

---

## Section D — The Quality Loop Architecture (the actual pattern that ships 9.5/10)

This is the diagram and the code shape. If you steal nothing else from this doc, steal this.

### D1. The 5-stage loop

```
┌────────────────────────────────────────────────────────────────────┐
│                    LEAD AGENT (Opus 4.7, cached)                   │
│                                                                    │
│  intent ─► plan.md (write_todos) ─► spawn sub-agents in parallel   │
└────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼──────────────────────────┐
        ▼                         ▼                          ▼
  ┌────────────┐          ┌───────────────┐          ┌────────────┐
  │  DRAFTER   │ ──v1──►  │    CRITIC     │ ──score+ │  REVISER   │
  │ (Sonnet)   │          │  (Opus +      │  issues  │ (Sonnet)   │
  │            │          │  rubric.md)   │   ─────► │            │
  └────────────┘          └───────────────┘          └────────────┘
                                                            │
                                                            ▼
                                                       ┌─────────┐
                                                       │  JUDGE  │
                                                       │ (Opus + │
                                                       │ rubric  │
                                                       │ + cross │
                                                       │  model) │
                                                       └────┬────┘
                                                            │
                              ┌─────────────────────────────┤
                              │                             │
                              ▼ score ≥ 9/10                ▼ score < 9/10
                         ┌──────────┐               ┌──────────────────┐
                         │   SHIP   │               │  REFLEXION       │
                         └──────────┘               │  write lesson    │
                                                    │  to failure.md   │
                                                    │  loop back to    │
                                                    │  Drafter (max 3) │
                                                    └──────────────────┘
```

### D2. The five non-negotiables

1. **Each role gets its own context window.** Drafter never sees Critic's full transcript; Reviser sees only `(v1, critique)`; Judge sees only `(v2, rubric)`. This is what Anthropic's blog calls "context isolation" — and it's why their multi-agent system beats single-agent by 90%.

2. **The rubric is a checked-in file.** `/rubrics/linkedin_post.md` lists 8–12 binary criteria ("opens with a hook ≤ 12 words", "no banned phrases", "ends with one question"). Critic and Judge both score against the *same* file. Update the rubric, not the prompt.

3. **The Critic and Judge are different prompts.** Critic = "find what's wrong, be brutal, score 1–10 per criterion." Judge = "given v2 and the critic's issues, did the reviser actually fix them? Score the *delta*." This kills the "self-grade inflation" problem.

4. **Cross-model verification on the Judge.** Score with Opus 4.7 *and* GPT-5. If they disagree by > 2 points, escalate to human. Same-provider score inflation is 5-15% — cross-model kills it.

5. **The loop has a hard cap.** Max 3 iterations. If still < 9/10 at iteration 3, write the failure to `/logs/escalations/` with full traces and ship the best of the 3 with a "needs human review" flag. Better to ship marked than loop forever.

### D3. Pseudocode (Claude Agent SDK + Instructor + Langfuse)

```python
from anthropic.agents import Agent, Subagent
import instructor
from pydantic import BaseModel, Field
from langfuse.decorators import observe

class Critique(BaseModel):
    score: int = Field(ge=1, le=10)
    issues: list[str]
    must_fix: list[str]

class JudgeVerdict(BaseModel):
    score: int = Field(ge=1, le=10)
    ship: bool
    reason: str

@observe(name="quality_loop")
async def ship_with_quality(intent: str, rubric_path: str, max_iters: int = 3):
    rubric = open(rubric_path).read()
    failure_log = []

    for i in range(max_iters):
        v = await drafter.run(intent=intent, lessons=failure_log)
        critique = await critic.run(
            output=v, rubric=rubric, response_model=Critique
        )
        if critique.score >= 9 and not critique.must_fix:
            return v  # rare: drafter nailed it

        v = await reviser.run(v=v, critique=critique)
        verdict_a = await judge_opus.run(
            v=v, rubric=rubric, response_model=JudgeVerdict
        )
        verdict_b = await judge_gpt5.run(
            v=v, rubric=rubric, response_model=JudgeVerdict
        )
        avg = (verdict_a.score + verdict_b.score) / 2

        if avg >= 9 and abs(verdict_a.score - verdict_b.score) <= 2:
            return v
        failure_log.append(
            f"Iter {i}: score {avg}. Reason: {verdict_a.reason}"
        )

    # exceeded budget: ship best with flag
    return {"output": v, "needs_human_review": True, "log": failure_log}
```

### D4. Why this beats single-agent + reflection
- **Confirmation bias defeated:** Critic and Judge are different prompts and different roles. The same model self-critiquing has known mode collapse.
- **Context bloat defeated:** Sub-agents only see their slice. Lead agent context stays clean.
- **Same-provider bias defeated:** Cross-model judge.
- **Infinite loops defeated:** Hard cap + escalation log.
- **No learning across attempts defeated:** Reflexion-style failure log gets prepended to next Drafter call.

---

## Section E — The 5 Reasons Multi-Agent Systems Produce Mediocre Output (and which repo fixes each)

| # | Why it ships 6/10 | Fix | Repo |
|---|---|---|---|
| 1 | **No quality bar.** "Looks fine" is not a rubric. The agent ships v1. | Write a 12-criterion rubric file. Score every output against it. | DSPy `metric()` + custom `rubric.md` |
| 2 | **Self-critique is biased.** Same model that wrote it grades it generously. | Different roles + different prompts + cross-model judge. | Reflexion + Multi-Agent Debate + MAR pattern |
| 3 | **Context pollution.** All 50 tools' schemas + full conversation in every call. Model loses focus. | Sub-agents with isolated context + Tool RAG via MCP. | Claude Agent SDK Subagents + MCP |
| 4 | **No learning across attempts.** Iteration 2 makes the same mistake as iteration 1. | Reflexion failure log prepended to next attempt. | `noahshinn/reflexion` + MAR |
| 5 | **Hand-tuned prompts plateau.** You hit a ceiling at "what I can write at 11pm." | Compile prompts against eval set with GEPA. | DSPy + GEPA |

If your output is currently 6/10, fixing any 2 of these gets you to 8/10. Fixing all 5 gets you to 9.5/10.

---

## Section F — Cursor Instruction Set (drop into `.cursorrules` / `CLAUDE.md`)

```markdown
# Jarvis Multi-Agent Quality Loop — Cursor / Claude Code Instructions

## Architecture (do not deviate)
- Runtime: Claude Agent SDK (Python). LangGraph only for stateful workflows
  with checkpointing.
- Every external tool call goes through MCP. Never hard-code an HTTP client.
- Every sub-agent runs in an isolated context window via the Subagent
  primitive. Never pass the full lead-agent transcript to a sub-agent.
- Every structured output uses Instructor + Pydantic with max_retries=3.
- Every span is traced to Langfuse with tags: agent_role, rubric_score,
  iteration_n, model.

## The Quality Loop (5-stage, mandatory for any user-facing output)
1. **Drafter** (Sonnet 4.6) writes v1 from intent + plan.md + lessons.md
2. **Critic** (Opus 4.7) scores v1 against /rubrics/{task}.md, returns
   Pydantic `Critique{score, issues, must_fix}`
3. **Reviser** (Sonnet 4.6) reads (v1, critique), writes v2
4. **Judge** runs twice in parallel: Opus 4.7 + GPT-5. Returns
   `JudgeVerdict{score, ship, reason}`. Both must agree within 2 points
   AND average ≥ 9.0
5. If pass → SHIP. If fail → write reflexion to lessons.md, loop. Max 3
   iterations. After 3, escalate with `needs_human_review=True`.

## Rules
- Rubrics live in `/rubrics/*.md`. Update the rubric, not the prompt.
- Drafter and Reviser use Sonnet (cheap, fast). Critic and Judge use
  Opus (judgment quality matters). This is non-negotiable.
- Cache the system prompt with `cache_control: ephemeral` for every
  role. Aim for 90% cache hit rate.
- The Critic prompt opens with "Be brutal. Find what's wrong. Assume
  the Drafter is junior."
- The Judge prompt opens with "Compare v2 against the issues the Critic
  raised. Did the Reviser actually fix them, or just paper over?"
- Failure log (`lessons.md`) is fed to the *next* Drafter attempt.
  Reflexion pattern. Mandatory.

## Evals
- Every agent role is a `dspy.Module` with a `dspy.Signature`.
- Eval set lives in `/evals/{role}/{set_name}.jsonl` — minimum 50 examples.
- Run `dspy.GEPA(metric=rubric_metric).compile(pipeline)` weekly.
  Commit the optimized prompts.

## Tools
- 50+ tools? Use Tool RAG. The lead agent retrieves relevant tools
  per intent before delegating. Never dump all schemas into the system
  prompt.

## Memory
- User voice / brand / preferences → mem0.add() on every correction.
- Inject mem0.search(intent) into Drafter system prompt.

## Banned patterns
- ❌ One agent that "checks its own work" — fails confirmation-bias test
- ❌ "Just retry on failure" without a Reflexion log — repeats mistakes
- ❌ All tools in the system prompt — context pollution
- ❌ Hand-tuned prompts that don't compile against an eval set
- ❌ Output that ships without a Pydantic schema + Instructor retry
- ❌ Same-provider Judge only — score inflation
```

---

## Section G — Migration Plan (basic LangGraph supervisor → 2026 quality stack)

Assumption: Jarvis today = LangGraph supervisor + worker nodes + CopilotKit + hand-tuned prompts + no evals + no rubrics.

### Week 1 — Stop the bleeding (quality goes 6 → 7.5)
- [ ] **Add Instructor + Pydantic to every output.** 4 hours. Stops the "almost JSON" failures immediately.
- [ ] **Write 1 rubric file per output type** (`linkedin_post.md`, `email.md`, `dashboard.md`). 1 day. 12 binary criteria each.
- [ ] **Add a Critic node to the LangGraph** that scores against the rubric, returns Pydantic `Critique`. Loop back to drafter if score < 9. Hard cap 3 iterations. 1 day.

### Week 2 — Real multi-agent (quality goes 7.5 → 8.5)
- [ ] **Install Langfuse self-hosted.** Trace every span. 4 hours.
- [ ] **Replace LangGraph supervisor with Claude Agent SDK Subagents** for the parts where context bloat is the problem. Keep LangGraph for stateful workflows. 2 days.
- [ ] **Split Critic and Judge into two different roles.** Different prompts, different models if possible. 4 hours.
- [ ] **Cross-model Judge:** Opus + GPT-5 in parallel, average scores. 2 hours.

### Week 3 — Compile, don't write (quality goes 8.5 → 9.0)
- [ ] **Convert each agent role to a `dspy.Module`.** 2 days.
- [ ] **Build a 50-example eval set per role** (use Langfuse traces from Weeks 1-2 as seed data). 1 day.
- [ ] **Run `dspy.GEPA` to compile optimized prompts.** ~$10 of API + 1 hour runtime. Commit the result.

### Week 4 — Memory + reflexion (quality goes 9.0 → 9.5)
- [ ] **Wire Mem0** for cross-session voice/brand memory. 1 day.
- [ ] **Add Reflexion failure log.** When Judge rejects, write a "lesson" to `lessons.md`. Prepend to next Drafter attempt. 1 day.
- [ ] **Add the AG-UI streaming events** (`subagent_started`, `rubric_score_updated`, `revision_n`) so the front-end shows the loop happening live. 2 days.

### Week 5 — MCP everything (kills tool pollution permanently)
- [ ] **Move every external integration to an MCP server.** Use the awesome-mcp-servers list before building. 3 days.
- [ ] **Implement Tool RAG** at the lead-agent layer. Lead retrieves relevant tools per intent, passes only those to sub-agents. 1 day.

### Week 6 — Production hardening
- [ ] **Replace LangGraph workflow durability with Trigger.dev** for any agent that runs > 5 minutes. 2 days.
- [ ] **Add Tenacity retries on every MCP call**, exponential backoff, circuit breaker. 4 hours.
- [ ] **Set up the Quality dashboard in Langfuse:** `% ship-on-iter-1`, `avg revisions to ship`, `% needs_human_review`. This is your North Star. 4 hours.

### What to delete
- ❌ Any "self-grading" node — replace with Critic + Judge split
- ❌ Hand-rolled retry logic — Instructor handles it
- ❌ Hard-coded HTTP clients — MCP handles it
- ❌ Custom tracing — Langfuse handles it
- ❌ One-shot prompts that haven't been compiled — DSPy/GEPA handles it

---

## Appendix A — What changed since 2025 (so the old playbook is wrong)

1. **AutoGen is in maintenance.** Microsoft folded it into Microsoft Agent Framework. Don't start new projects on AutoGen.
2. **OpenAI Swarm is replaced by Agents SDK + Harness.** Production-grade now, but still GPT-only friendly.
3. **MCP became a Linux Foundation standard (Dec 2025).** Not Anthropic-specific anymore. OpenAI and Google adopted it.
4. **The "harness" pattern beat the "graph" pattern.** Claude Agent SDK and LangChain Deep Agents both reframed multi-agent as "give the lead agent: planning tool + filesystem + sub-agents + write_todos." Bare LangGraph is now the *runtime*, not the *architecture*.
5. **GEPA (ICLR 2026 Oral) replaced hand-tuning.** Compiled prompts beat written prompts by 6-20% with 35× fewer rollouts.
6. **AG-UI Protocol consolidated the front-end story.** Eight major frameworks adopted it. Don't invent a streaming protocol.
7. **CopilotKit raised $27M Series A in May 2026.** The frontend-for-agents category has a clear winner.
8. **Cross-model judging became table stakes.** Same-provider score inflation is 5-15%, measurable and known. One judge model is no longer acceptable for production.

---

## Appendix B — The 3 most surprising findings

1. **Anthropic's own Research multi-agent system beat single-agent by *more than 90%* in internal evals — and 80% of the variance was explained by token usage alone.** This is huge. It means the *amount of focused thinking per agent* matters more than which framework you pick. Sub-agents with isolated contexts spend more tokens on their slice, and that's the whole game.

2. **GEPA outperforms reinforcement learning (GRPO) by 6-20% with 35× fewer rollouts.** Two years ago we thought RL would compile agents. In 2026, *reflective text evolution* — the LLM reads its own failure traces and rewrites its own prompts — beat RL. This is why DSPy + GEPA is the optimizer to learn, not RLHF pipelines.

3. **AutoGen is officially deprecated. OpenAI Swarm got replaced. LangGraph alone is no longer the answer.** The orchestration era ended in 12 months. Anyone still recommending the 2025 stack hasn't been paying attention since GA of the Claude Agent SDK + Deep Agents harnesses.

---

## Appendix C — 7-bullet summary

1. **Stop fixing prompts. Start fixing the loop.** The drafter → critic → reviser → judge → ship loop is where 9.5/10 output lives.
2. **Use a harness, not just a graph.** Claude Agent SDK (Python) or LangChain Deep Agents = LangGraph + planning + sub-agents + filesystem. Bare LangGraph is the runtime, not the architecture.
3. **Sub-agents must have isolated context.** Anthropic's own research system beat single-agent by 90% — 80% of the gain is explained by per-agent token spend.
4. **Critic and Judge are different roles, different prompts, different models.** Cross-model judging defeats the 5-15% same-provider score inflation.
5. **Compile your prompts.** DSPy + GEPA (ICLR 2026 Oral) beats hand-tuning by 6-20% with 35× fewer rollouts. The eval set is the new prompt.
6. **MCP everything.** Linux Foundation standard since Dec 2025. Solves the 50-tools-in-context problem via Tool RAG.
7. **Trace everything in Langfuse.** "% ship-on-iter-1" is your North Star quality metric. Without it, you cannot tell *why* output is bad.

**The single biggest 2026 shift:** the orchestration era ended; the harness era began. Quality doesn't come from a better graph — it comes from a structured 5-stage loop, isolated sub-agent contexts, compiled prompts, and cross-model judging. If Jarvis is shipping 6/10 today, the fix is the loop, not the framework.
