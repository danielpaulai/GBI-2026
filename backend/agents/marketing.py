from langgraph.prebuilt import create_react_agent

from agents._prompts import load_prompt
from agents.tools import (
    BLOG_TOOLS,
    FULL_RESEARCH_TOOLS,
    SOCIAL_SCRAPE_TOOLS,
    WEB_RESEARCH_TOOLS,
    scrape_facebook_page,
    scrape_instagram_profile,
    scrape_linkedin_profile,
)


def _build_specialist_agent(model, *, name: str, prompt: str, tools=None):
    return create_react_agent(
        model=model,
        tools=tools or [],
        name=name,
        prompt=prompt,
    )


def build_content_agent(model):
    return _build_specialist_agent(
        model,
        name="content",
        prompt=(
            load_prompt("marketing_system")
            + "\n\n"
            + "# Specialist mode\n"
            + "You are the Content specialist inside CMO. Use this lane when the request is about posts, scripts, headlines, hooks, content calendars, thought leadership, launch copy, or channel-ready creative.\n"
            + "Return paste-ready assets, not strategy-only commentary."
        ),
        tools=FULL_RESEARCH_TOOLS,
    )


def build_campaigns_agent(model):
    return _build_specialist_agent(
        model,
        name="campaigns",
        tools=FULL_RESEARCH_TOOLS,
        prompt="""
You are the Campaigns specialist inside CMO.

Use this lane when the request is about launches, funnels, channel plans, campaign sequencing, promotion windows, distribution plans, or multi-step rollout structure.

Output format:
- Start with a one-line campaign objective.
- Then give a numbered plan.
- Include channels, timing, and the purpose of each step.
- Keep it practical and ready to execute.

Constraints:
- Prefer repeatable systems over expensive ad spend by default.
- Make reasonable assumptions when the brief is incomplete.
- Do not output generic brand advice when the user asked for a campaign plan.
""".strip(),
    )


def build_offers_agent(model):
    return _build_specialist_agent(
        model,
        name="offers",
        prompt="""
You are the Offers specialist inside CMO.

Use this lane when the request is about offer creation, packaging, positioning, naming, bonuses, guarantees, pricing logic, or making an existing service easier to buy.

Output format:
- Start with the core offer thesis in one sentence.
- Then give a numbered list of the recommended offer structure.
- Include promise, audience, deliverables, proof, and pricing logic when relevant.
- Keep the language concrete and commercially useful.

Constraints:
- Avoid fake scarcity and unverifiable claims.
- Prefer clarity and specificity over hype.
- If details are missing, infer a credible expert-business context and proceed.
""".strip(),
    )


def build_analytics_agent(model):
    return _build_specialist_agent(
        model,
        name="analytics",
        prompt="""
You are the Analytics specialist inside CMO.

Use this lane when the request is about KPIs, scorecards, attribution, experiments, reporting, tracking, benchmarks, funnel diagnostics, or how to measure whether a campaign is working.

Output format:
- Start with the measurement objective in one line.
- Then provide a numbered list of metrics, targets, and review cadence.
- Include what to watch, how to interpret it, and what action each signal should trigger.
- Keep recommendations simple enough to run weekly.

Constraints:
- Prefer a small useful scorecard over complex dashboards.
- Tie every metric to a decision or action.
- Do not invent historical data.
""".strip(),
    )


def build_market_research_agent(model):
    return _build_specialist_agent(
        model,
        name="market_research",
        prompt=load_prompt("market_research_system"),
        tools=WEB_RESEARCH_TOOLS,
    )


def build_competitor_intel_agent(model):
    return _build_specialist_agent(
        model,
        name="competitor_intel",
        prompt=load_prompt("competitor_intel_system"),
        tools=WEB_RESEARCH_TOOLS,
    )


def build_brand_voice_agent(model):
    return _build_specialist_agent(
        model,
        name="brand_voice",
        prompt=load_prompt("brand_voice_system"),
        tools=FULL_RESEARCH_TOOLS,
    )


def build_cro_funnel_agent(model):
    return _build_specialist_agent(
        model,
        name="cro_funnel",
        prompt=load_prompt("cro_funnel_system"),
    )


def build_creative_review_agent(model):
    return _build_specialist_agent(
        model,
        name="creative_review",
        prompt=load_prompt("creative_review_system"),
    )


def build_linkedin_creator_agent(model):
    return _build_specialist_agent(
        model,
        name="linkedin_creator",
        prompt=load_prompt("linkedin_creator_system"),
        tools=[scrape_linkedin_profile] + FULL_RESEARCH_TOOLS,
    )


def build_instagram_creator_agent(model):
    return _build_specialist_agent(
        model,
        name="instagram_creator",
        prompt=load_prompt("instagram_creator_system"),
        tools=[scrape_instagram_profile] + FULL_RESEARCH_TOOLS,
    )


def build_tiktok_creator_agent(model):
    return _build_specialist_agent(
        model,
        name="tiktok_creator",
        prompt=load_prompt("tiktok_creator_system"),
    )


def build_facebook_creator_agent(model):
    return _build_specialist_agent(
        model,
        name="facebook_creator",
        prompt=load_prompt("facebook_creator_system"),
        tools=[scrape_facebook_page] + FULL_RESEARCH_TOOLS,
    )


def build_landing_page_agent(model):
    return _build_specialist_agent(
        model,
        name="landing_page",
        prompt=load_prompt("landing_page_system"),
    )


def build_email_sequence_agent(model):
    return _build_specialist_agent(
        model,
        name="email_sequence",
        prompt=load_prompt("email_sequence_system"),
    )


def build_email_writer_agent(model):
    return _build_specialist_agent(
        model,
        name="email_writer",
        prompt=load_prompt("email_writer_system"),
    )


def build_newsletter_writer_agent(model):
    return _build_specialist_agent(
        model,
        name="newsletter_writer",
        prompt=load_prompt("newsletter_writer_system"),
    )


def build_linkedin_carousel_agent(model):
    return _build_specialist_agent(
        model,
        name="linkedin_carousel",
        prompt=load_prompt("linkedin_carousel_system"),
    )


def build_landing_page_architect_agent(model):
    return _build_specialist_agent(
        model,
        name="landing_page_architect",
        prompt=load_prompt("landing_page_architect_system"),
    )


def build_dm_automation_agent(model):
    return _build_specialist_agent(
        model,
        name="dm_automation",
        prompt=load_prompt("dm_automation_system"),
    )


def build_squeeze_page_agent(model):
    return _build_specialist_agent(
        model,
        name="squeeze_page",
        prompt=load_prompt("squeeze_page_system"),
    )


def build_lead_magnet_agent(model):
    return _build_specialist_agent(
        model,
        name="lead_magnet",
        prompt=load_prompt("lead_magnet_system"),
    )


def build_instagram_reels_agent(model):
    return _build_specialist_agent(
        model,
        name="instagram_reels",
        prompt=load_prompt("instagram_reels_system"),
    )


def build_instagram_stories_agent(model):
    return _build_specialist_agent(
        model,
        name="instagram_stories",
        prompt=load_prompt("instagram_stories_system"),
    )


def build_facebook_ads_agent(model):
    return _build_specialist_agent(
        model,
        name="facebook_ads",
        prompt=load_prompt("facebook_ads_system"),
    )


def build_blog_writer_agent(model):
    return _build_specialist_agent(
        model,
        name="blog_writer",
        prompt=load_prompt("blog_writer_system"),
        tools=BLOG_TOOLS,
    )
