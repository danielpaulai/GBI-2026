# Jarvis Marketing Agent Stack

This note curates GitHub examples for building a stronger `CMO` lane in Jarvis.

The goal is not to import another framework wholesale.
The goal is to lift the best agent roles and orchestration patterns into the current backend:
- `CEO` routes into `CMO`
- `CMO` selects the right marketing specialists for the project
- simple asks use one specialist
- bigger asks trigger a bounded swarm and then synthesize

## Best Repositories

### 1. `crewAIInc/crewAI-examples`
- Best source for concrete marketing roles and task breakdowns.
- Most useful paths:
  - `crews/marketing_strategy`
  - `crews/instagram_post`
  - `flows/content_creator_flow`
  - `integrations/nvidia_models/marketing_strategy`

#### Agent patterns worth reusing
- `Lead Market Analyst`
  - Use for market research, customer research, competitor scanning, category mapping.
  - Seen in `crews/marketing_strategy/src/marketing_posts/crew.py` and the NVIDIA integration variant.

- `Chief Marketing Strategist`
  - Use as the internal CMO planner for positioning, campaign direction, and strategic sequencing.
  - Seen in `crews/marketing_strategy/src/marketing_posts/crew.py`.

- `Creative Content Creator`
  - Use for hooks, posts, campaign angles, ad copy, landing page messaging.
  - Seen in `crews/marketing_strategy/src/marketing_posts/crew.py` and `crews/instagram_post/agents.py`.

- `Product / Competitor Analyst`
  - Use for offer research, competitor comparison, audience pain extraction, proof mining.
  - Seen in `crews/instagram_post/agents.py`.

- `Strategy Planner`
  - Use for campaign structure, rollout planning, content themes, promotion sequencing.
  - Seen in `crews/instagram_post/main.py` and task assembly there.

- `Chief Creative Director`
  - Use as a reviewer/synthesizer for quality control before output is returned on stage.
  - Seen in `crews/instagram_post/agents.py`.

- `Blog / LinkedIn Researcher + Writer split`
  - Use when content marketing should be split into research then writing rather than one-step generation.
  - Seen in `notebooks/Flows_101/crewai_flows_101.ipynb`.

#### Why this repo matters
- It gives you actual marketing-specialist roles, not just orchestration patterns.
- It is the best source for expanding your current `content/campaigns/offers/analytics` set into a fuller department.

### 2. `microsoft/autogen`
- Best source for team selection, planning, handoffs, web research, and controlled swarm patterns.
- Most useful docs/examples:
  - `selector-group-chat.ipynb`
  - `swarm.ipynb`
  - `examples/company-research.ipynb`
  - `samples/core_semantic_router/run_semantic_router.py`
  - `core-user-guide/design-patterns/sequential-workflow.ipynb`

#### Agent patterns worth reusing
- `PlanningAgent`
  - Best for turning vague marketing asks into explicit subtasks.
  - Use inside `CMO` for larger asks before specialist handoff.

- `WebSearchAgent`
  - Use for competitor intelligence, trend research, proof gathering, and offer validation.

- `DataAnalystAgent`
  - Use for scorecards, KPI logic, experiment interpretation, conversion math.

- `WriterAgent`
  - Use for final synthesis, polished deliverables, and stage-ready output formatting.

- `NewsAnalyst` / research analyst pattern from `swarm.ipynb`
  - Use for market monitoring and trend-aware campaign recommendations.

- `Semantic Router Agent`
  - Use as a model for a bigger future capability registry when the number of specialists grows.

#### Why this repo matters
- It gives you the cleanest examples of `planner -> specialist -> planner` and selector-based routing.
- It is the best reference for adding `research` and `analysis` roles to marketing without bloating prompts.

### 3. `openai/swarm`
- Best source for lightweight triage and handoff thinking.
- Most useful examples:
  - `examples/triage_agent`
  - `examples/airline`

#### Agent patterns worth reusing
- `Triage Agent`
  - Use as the conceptual model for `CMO` choosing the right marketing specialist.

- nested sub-intent routing
  - The airline example routes from broad intent to narrower specialists.
  - That maps well to:
    - `marketing -> offers`
    - `marketing -> campaigns`
    - `marketing -> content`
    - `marketing -> analytics`

#### Why this repo matters
- It is the cleanest mental model for `if/or/when` handoff logic.
- Good for simple, understandable routing rules when you do not want a heavy graph for every decision.

## Recommended CMO Agent Roster

These are the marketing specialists that make the most sense for Jarvis now.

### Keep as core
- `content`
  - posts, hooks, scripts, thought leadership, nurture copy

- `campaigns`
  - launch plans, channel rollout, sequences, distribution, promotions

- `offers`
  - packaging, naming, bonuses, pricing logic, guarantee logic, positioning

- `analytics`
  - KPIs, scorecards, attribution, experiments, review cadence

### Add next
- `market_research`
  - market mapping, ICP research, customer pain points, trend scans
  - best pattern source: CrewAI market analyst + AutoGen web search agent

- `competitor_intel`
  - competitor offers, messaging breakdown, positioning gaps, differentiation
  - best pattern source: CrewAI product/competitor analyst

- `brand_voice`
  - tone system, narrative spine, founder voice consistency
  - best pattern source: CrewAI content flows and writer/reviewer split

- `seo_content`
  - topic clustering, article outlines, search-intent mapping, content repurposing
  - best pattern source: CrewAI blog researcher/writer flow

- `cro_funnel`
  - landing page messaging, CTA hierarchy, conversion friction reduction
  - best pattern source: content strategist + analytics + landing page generator patterns

- `social_distribution`
  - LinkedIn, Instagram, email, content repackaging, channel-specific adaptation
  - best pattern source: CrewAI Instagram and LinkedIn flow examples

- `creative_review`
  - final QA, message cohesion, campaign coherence, stage-safe final polish
  - best pattern source: CrewAI chief creative director / reviewer pattern

## Best Mapping Into Current Jarvis

### Phase 1
- keep current routed `CMO`
- add these new specialist keys:
  - `market_research`
  - `competitor_intel`
  - `brand_voice`
  - `cro_funnel`
  - `creative_review`

### Phase 2
- make `CMO` behave like this:
  - narrow ask -> one specialist
  - medium ask -> planner + one specialist + reviewer
  - broad ask -> planner + 2 to 4 specialists + reviewer synthesis

### Phase 3
- add tool-backed specialists:
  - web research tools for `market_research` and `competitor_intel`
  - analytics/calculation helpers for `analytics`
  - website/page inspection for `cro_funnel`

## Strongest GitHub-Derived Role Set

If you want the best all-around marketing department from the examples above, use this roster:

- `CMO Planner`
- `Lead Market Analyst`
- `Competitor Intelligence Analyst`
- `Chief Marketing Strategist`
- `Offer Architect`
- `Creative Content Creator`
- `Brand Voice Writer`
- `SEO / Content Researcher`
- `Campaign Orchestrator`
- `Analytics / Growth Analyst`
- `Creative Review Director`

## Practical Recommendation

For this repo, the highest-leverage next additions are:

1. `market_research`
2. `competitor_intel`
3. `creative_review`
4. `cro_funnel`

That gives `CMO` a much more complete operating team without turning the graph into an unmanageable swarm.