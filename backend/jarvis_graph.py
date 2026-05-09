"""LangGraph supervisor (CEO) + Marketing, Sales, Operations agents."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Literal

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph_supervisor import create_supervisor

from agents import (
    build_analytics_agent,
    build_brand_voice_agent,
    build_campaigns_agent,
    build_competitor_intel_agent,
    build_content_agent,
    build_creative_review_agent,
    build_cro_funnel_agent,
    build_dm_automation_agent,
    build_email_sequence_agent,
    build_email_writer_agent,
    build_facebook_ads_agent,
    build_facebook_creator_agent,
    build_instagram_creator_agent,
    build_instagram_reels_agent,
    build_instagram_stories_agent,
    build_landing_page_agent,
    build_landing_page_architect_agent,
    build_facebook_ads_agent,
    build_instagram_reels_agent,
    build_instagram_stories_agent,
    build_lead_magnet_agent,
    build_linkedin_carousel_agent,
    build_linkedin_creator_agent,
    build_market_research_agent,
    build_newsletter_writer_agent,
    build_offers_agent,
    build_operations_agent,
    build_sales_agent,
    build_squeeze_page_agent,
    build_tiktok_creator_agent,
)
from agents._prompts import load_prompt

DepartmentKey = Literal["marketing", "sales", "operations", "finance", "general"]
ExecutionMode = Literal["single", "swarm"]
ProviderKey = Literal["anthropic", "openai"]


@dataclass(frozen=True)
class Capability:
    key: str
    label: str
    department: DepartmentKey
    project_types: tuple[str, ...]
    keywords: tuple[str, ...]
    supports_parallel: bool = True


@dataclass(frozen=True)
class RoutePlan:
    department: DepartmentKey
    project_type: str
    mode: ExecutionMode
    selected_agents: tuple[str, ...]
    summary: str
    template_key: str | None = None


@dataclass(frozen=True)
class ModelCandidate:
    provider: ProviderKey
    model: str


@dataclass(frozen=True)
class ProjectTemplate:
    key: str
    project_type: str
    summary: str
    keywords: tuple[str, ...]
    agent_order: tuple[str, ...]
    mode: ExecutionMode = "swarm"
    review_agent: str | None = "creative_review"


_JARVIS_APPS: dict[tuple[DepartmentKey, str, ExecutionMode, tuple[str, ...], str, str], Any] = {}
_WORKING_MODEL: ModelCandidate | None = None

MARKETING_SWARM_ORDER: tuple[str, ...] = (
    "market_research",
    "competitor_intel",
    "offers",
    "campaigns",
    "content",
    "brand_voice",
    "landing_page",
    "landing_page_architect",
    "linkedin_creator",
    "linkedin_carousel",
    "instagram_creator",
    "instagram_reels",
    "instagram_stories",
    "tiktok_creator",
    "facebook_creator",
    "facebook_ads",
    "email_writer",
    "email_sequence",
    "newsletter_writer",
    "dm_automation",
    "squeeze_page",
    "lead_magnet",
    "cro_funnel",
    "analytics",
    "creative_review",
)

CAPABILITY_REGISTRY: dict[str, Capability] = {
    "content": Capability(
        key="content",
        label="Narrative Engine",
        department="marketing",
        project_types=("content_creation", "thought_leadership", "brand_voice"),
        keywords=(
            "content",
            "linkedin",
            "post",
            "posts",
            "hook",
            "hooks",
            "script",
            "headline",
            "copy",
            "caption",
            "story",
            "voice",
        ),
    ),
    "campaigns": Capability(
        key="campaigns",
        label="Channel Grid",
        department="marketing",
        project_types=("campaign_launch", "go_to_market", "funnel_rollout"),
        keywords=(
            "campaign",
            "launch",
            "rollout",
            "funnel",
            "sequence",
            "email",
            "distribution",
            "promotion",
            "channel",
            "gtm",
            "go to market",
            "marketing",
        ),
    ),
    "offers": Capability(
        key="offers",
        label="Offer Forge",
        department="marketing",
        project_types=("offer_creation", "positioning", "pricing"),
        keywords=(
            "offer",
            "package",
            "pricing",
            "price",
            "positioning",
            "guarantee",
            "bonus",
            "bonuses",
            "name",
            "promise",
            "irresistible",
        ),
    ),
    "analytics": Capability(
        key="analytics",
        label="Signal Loop",
        department="marketing",
        project_types=("analytics", "measurement", "optimization"),
        keywords=(
            "analytics",
            "metric",
            "metrics",
            "kpi",
            "scorecard",
            "tracking",
            "dashboard",
            "measure",
            "measurement",
            "attribution",
            "experiment",
            "conversion rate",
        ),
    ),
    "market_research": Capability(
        key="market_research",
        label="Market Radar",
        department="marketing",
        project_types=("market_research", "content_system", "launch_build", "offer_build"),
        keywords=(
            "market",
            "research",
            "audience",
            "icp",
            "persona",
            "trend",
            "demand",
            "insight",
            "pain point",
            "pain points",
            "customer",
            "buyer",
        ),
    ),
    "competitor_intel": Capability(
        key="competitor_intel",
        label="Competitor Intel",
        department="marketing",
        project_types=("positioning", "offer_build", "launch_build"),
        keywords=(
            "competitor",
            "competition",
            "differentiate",
            "differentiation",
            "category",
            "market gap",
            "whitespace",
            "comparison",
            "compare",
            "stand out",
        ),
    ),
    "brand_voice": Capability(
        key="brand_voice",
        label="Voice Foundry",
        department="marketing",
        project_types=("brand_voice", "content_system"),
        keywords=(
            "brand voice",
            "voice",
            "tone",
            "narrative",
            "messaging",
            "editorial",
            "style",
            "founder-led",
            "positioning statement",
        ),
    ),
    "cro_funnel": Capability(
        key="cro_funnel",
        label="Conversion Reactor",
        department="marketing",
        project_types=("cro_funnel", "launch_build"),
        keywords=(
            "cro",
            "conversion",
            "landing page",
            "landing",
            "cta",
            "funnel",
            "opt-in",
            "checkout",
            "page",
            "improve conversions",
        ),
    ),
    "landing_page": Capability(
        key="landing_page",
        label="Landing Page Architect",
        department="marketing",
        project_types=("landing_page", "launch_build", "content_system"),
        keywords=("landing page", "sales page", "hero section", "page copy", "conversion page"),
    ),
    "creative_review": Capability(
        key="creative_review",
        label="Quality Gate",
        department="marketing",
        project_types=("offer_build", "launch_build", "content_system", "brand_voice"),
        keywords=(
            "review",
            "qa",
            "polish",
            "refine",
            "improve",
            "audit",
            "tighten",
            "final pass",
        ),
    ),
    "linkedin_creator": Capability(
        key="linkedin_creator",
        label="LinkedIn Studio",
        department="marketing",
        project_types=("content_system", "content_creation"),
        keywords=("linkedin", "thought leadership", "founder post"),
    ),
    "instagram_creator": Capability(
        key="instagram_creator",
        label="Instagram Studio",
        department="marketing",
        project_types=("content_system", "content_creation"),
        keywords=("instagram", "reel", "carousel", "stories"),
    ),
    "tiktok_creator": Capability(
        key="tiktok_creator",
        label="TikTok Reactor",
        department="marketing",
        project_types=("content_system", "content_creation"),
        keywords=("tiktok", "short-form", "short form", "vertical video", "ugc", "hook"),
    ),
    "facebook_creator": Capability(
        key="facebook_creator",
        label="Facebook Signal",
        department="marketing",
        project_types=("content_system", "content_creation"),
        keywords=("facebook", "group post", "community post"),
    ),
    "email_writer": Capability(
        key="email_writer",
        label="Email Forge",
        department="marketing",
        project_types=("content_system", "campaign_launch"),
        keywords=("email", "sequence", "nurture", "follow-up"),
    ),
    "newsletter_writer": Capability(
        key="newsletter_writer",
        label="Newsletter Desk",
        department="marketing",
        project_types=("content_system",),
        keywords=("newsletter", "newsletter issue", "editorial"),
    ),
    "email_sequence": Capability(
        key="email_sequence",
        label="Sequence Architect",
        department="marketing",
        project_types=("campaign_launch", "content_system"),
        keywords=("email sequence", "welcome sequence", "launch sequence", "nurture sequence", "reactivation"),
    ),
    "linkedin_carousel": Capability(
        key="linkedin_carousel",
        label="Carousel Architect",
        department="marketing",
        project_types=("content_system", "content_creation"),
        keywords=("carousel", "linkedin carousel", "slide deck", "swipe post", "document post"),
    ),
    "landing_page_architect": Capability(
        key="landing_page_architect",
        label="Page Architect",
        department="marketing",
        project_types=("landing_page", "launch_build"),
        keywords=("landing page architect", "sales page", "direct response", "saas page", "event page", "full page"),
    ),
    "dm_automation": Capability(
        key="dm_automation",
        label="DM Sequencer",
        department="marketing",
        project_types=("content_system", "campaign_launch"),
        keywords=("dm", "direct message", "dm automation", "dm sequence", "instagram dm", "cold dm"),
    ),
    "squeeze_page": Capability(
        key="squeeze_page",
        label="Squeeze Page",
        department="marketing",
        project_types=("landing_page", "content_system"),
        keywords=("squeeze page", "opt-in page", "lead capture", "email capture", "freebie page"),
    ),
    "lead_magnet": Capability(
        key="lead_magnet",
        label="Lead Magnet Lab",
        department="marketing",
        project_types=("content_system", "launch_build"),
        keywords=("lead magnet", "freebie", "checklist", "free guide", "lead gen", "opt-in"),
    ),
    "instagram_reels": Capability(
        key="instagram_reels",
        label="Reels Studio",
        department="marketing",
        project_types=("content_system", "channel_build"),
        keywords=("reels", "instagram reels", "short form video", "vertical video", "ig reels", "reel"),
    ),
    "instagram_stories": Capability(
        key="instagram_stories",
        label="Stories Lab",
        department="marketing",
        project_types=("content_system", "channel_build"),
        keywords=("stories", "instagram stories", "story sequence", "ig stories", "story"),
    ),
    "facebook_ads": Capability(
        key="facebook_ads",
        label="Ads Engine",
        department="marketing",
        project_types=("content_system", "launch_build", "paid_media"),
        keywords=("facebook ads", "meta ads", "paid ads", "facebook advertising", "fb ads", "retargeting", "paid social"),
    ),
    "sales": Capability(
        key="sales",
        label="Revenue Command",
        department="sales",
        project_types=("sales_motion",),
        keywords=(
            "sales",
            "close",
            "closing",
            "objection",
            "discovery",
            "outreach",
            "cold email",
            "dm",
            "pipeline",
            "deal",
            "follow up",
        ),
        supports_parallel=False,
    ),
    "operations": Capability(
        key="operations",
        label="Execution Command",
        department="operations",
        project_types=("execution_rhythm",),
        keywords=(
            "operations",
            "weekly",
            "this week",
            "priority",
            "priorities",
            "cadence",
            "sop",
            "process",
            "system",
            "execution",
            "agenda",
            "meeting",
        ),
        supports_parallel=False,
    ),
    "finance": Capability(
        key="finance",
        label="Finance Command",
        department="finance",
        project_types=("finance_system",),
        keywords=(
            "finance",
            "cashflow",
            "cash flow",
            "margin",
            "budget",
            "forecast",
            "forecasting",
            "profit",
            "p&l",
            "unit economics",
            "runway",
            "financial",
        ),
        supports_parallel=False,
    ),
}

SALES_AGENT_ORDER: tuple[str, ...] = (
    "pipeline_architect",
    "objection_handler",
    "followup_writer",
)

OPERATIONS_AGENT_ORDER: tuple[str, ...] = (
    "ops_priorities",
    "ops_process",
    "ops_cadence",
)

FINANCE_AGENT_ORDER: tuple[str, ...] = (
    "finance_cashflow",
    "finance_pricing",
    "finance_forecast",
)

MARKETING_AGENT_BUILDERS = {
    "market_research": build_market_research_agent,
    "competitor_intel": build_competitor_intel_agent,
    "content": build_content_agent,
    "campaigns": build_campaigns_agent,
    "offers": build_offers_agent,
    "brand_voice": build_brand_voice_agent,
    "linkedin_creator": build_linkedin_creator_agent,
    "linkedin_carousel": build_linkedin_carousel_agent,
    "instagram_creator": build_instagram_creator_agent,
    "tiktok_creator": build_tiktok_creator_agent,
    "facebook_creator": build_facebook_creator_agent,
    "email_writer": build_email_writer_agent,
    "email_sequence": build_email_sequence_agent,
    "newsletter_writer": build_newsletter_writer_agent,
    "landing_page": build_landing_page_agent,
    "landing_page_architect": build_landing_page_architect_agent,
    "dm_automation": build_dm_automation_agent,
    "squeeze_page": build_squeeze_page_agent,
    "lead_magnet": build_lead_magnet_agent,
    "instagram_reels": build_instagram_reels_agent,
    "instagram_stories": build_instagram_stories_agent,
    "facebook_ads": build_facebook_ads_agent,
    "cro_funnel": build_cro_funnel_agent,
    "analytics": build_analytics_agent,
    "creative_review": build_creative_review_agent,
}

PROJECT_TEMPLATES: tuple[ProjectTemplate, ...] = (
    ProjectTemplate(
        key="landing_page_system",
        project_type="landing_page",
        summary="Landing page template selected for hero copy, proof structure, objection handling, CTA flow, and conversion clarity.",
        keywords=(
            "landing page",
            "sales page",
            "hero section",
            "page copy",
            "conversion page",
        ),
        agent_order=("market_research", "offers", "brand_voice", "landing_page", "cro_funnel"),
    ),
    ProjectTemplate(
        key="email_sequence_system",
        project_type="email_sequence",
        summary="Email sequence template selected for launch, nurture, or objection-handling email sequencing.",
        keywords=(
            "email sequence",
            "welcome sequence",
            "nurture sequence",
            "launch sequence",
            "reactivation",
        ),
        agent_order=("market_research", "offers", "brand_voice", "email_sequence"),
    ),
    ProjectTemplate(
        key="cro_funnel",
        project_type="cro_funnel",
        summary="CRO funnel template selected for landing page clarity, CTA hierarchy, friction reduction, and post-change measurement.",
        keywords=(
            "landing page",
            "conversion rate",
            "conversion",
            "cta",
            "opt-in",
            "checkout",
            "funnel leak",
            "review my page",
            "improve conversion",
        ),
        agent_order=("cro_funnel", "analytics"),
    ),
    ProjectTemplate(
        key="offer_build",
        project_type="offer_build",
        summary="Offer build template selected for packaging, pricing, bonuses, differentiation, and final creative review.",
        keywords=(
            "offer",
            "pricing",
            "price",
            "bonus",
            "bonuses",
            "guarantee",
            "package",
            "positioning",
            "irresistible",
            "name",
        ),
        agent_order=("market_research", "competitor_intel", "offers", "brand_voice"),
    ),
    ProjectTemplate(
        key="launch_build",
        project_type="launch_build",
        summary="Launch build template selected for rollout strategy, campaign sequencing, content deployment, conversion path, and measurement.",
        keywords=(
            "launch",
            "campaign",
            "rollout",
            "go to market",
            "gtm",
            "sequence",
            "promotion",
            "funnel",
            "distribution",
        ),
        agent_order=("market_research", "campaigns", "content", "cro_funnel", "analytics"),
    ),
    ProjectTemplate(
        key="content_system",
        project_type="content_system",
        summary="Content system template selected for research, channel-specific content creation, voice consistency, and performance feedback loops.",
        keywords=(
            "content system",
            "content plan",
            "content calendar",
            "linkedin",
            "tiktok",
            "thought leadership",
            "post",
            "posts",
            "newsletter",
            "editorial",
        ),
        agent_order=(
            "market_research",
            "content",
            "brand_voice",
            "linkedin_creator",
            "instagram_creator",
            "tiktok_creator",
            "facebook_creator",
            "email_writer",
            "newsletter_writer",
            "analytics",
        ),
    ),
)

DEFAULT_ANTHROPIC_MODEL = "claude-3-7-sonnet-20250219"
DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"
FALLBACK_ANTHROPIC_MODELS: tuple[str, ...] = (
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-haiku-20240307",
)
FALLBACK_OPENAI_MODELS: tuple[str, ...] = (
    "gpt-4.1-mini",
    "gpt-4o-mini",
)


def get_model_candidates(kind: str | None = None) -> tuple[ModelCandidate, ...]:
    candidates: list[ModelCandidate] = []

    if _WORKING_MODEL is not None:
        candidates.append(_WORKING_MODEL)

    if kind == "worker":
        anthropic_override = os.environ.get("ANTHROPIC_WORKER_MODEL") or os.environ.get("ANTHROPIC_MODEL")
    elif kind == "supervisor":
        anthropic_override = os.environ.get("ANTHROPIC_SUPERVISOR_MODEL") or os.environ.get("ANTHROPIC_MODEL")
    else:
        anthropic_override = os.environ.get("ANTHROPIC_MODEL")

    openai_override = os.environ.get("OPENAI_MODEL")

    if anthropic_override and os.environ.get("ANTHROPIC_API_KEY"):
        candidates.append(ModelCandidate(provider="anthropic", model=anthropic_override))
    if openai_override and os.environ.get("OPENAI_API_KEY"):
        candidates.append(ModelCandidate(provider="openai", model=openai_override))

    if os.environ.get("ANTHROPIC_API_KEY"):
        candidates.extend(ModelCandidate(provider="anthropic", model=model) for model in FALLBACK_ANTHROPIC_MODELS)
    if os.environ.get("OPENAI_API_KEY"):
        candidates.extend(ModelCandidate(provider="openai", model=model) for model in FALLBACK_OPENAI_MODELS)

    if not candidates:
        candidates.extend(
            [
                ModelCandidate(provider="anthropic", model=DEFAULT_ANTHROPIC_MODEL),
                ModelCandidate(provider="openai", model=DEFAULT_OPENAI_MODEL),
            ]
        )

    ordered_unique: list[ModelCandidate] = []
    for candidate in candidates:
        if candidate not in ordered_unique:
            ordered_unique.append(candidate)

    return tuple(ordered_unique)


def get_model_id(kind: str | None = None) -> str:
    return get_model_candidates(kind)[0]


def remember_working_model(model_candidate: ModelCandidate) -> None:
    global _WORKING_MODEL
    _WORKING_MODEL = model_candidate


def create_chat_model(model_candidate: ModelCandidate, *, temperature: float, max_tokens: int):
    if model_candidate.provider == "openai":
        return ChatOpenAI(
            model=model_candidate.model,
            api_key=os.environ.get("OPENAI_API_KEY"),
            temperature=temperature,
            max_completion_tokens=max_tokens,
        )

    return ChatAnthropic(
        model=model_candidate.model,
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        temperature=temperature,
        max_tokens=max_tokens,
    )


def _contains_any(text: str, keywords: tuple[str, ...]) -> bool:
    return any(keyword in text for keyword in keywords)


def _count_matches(text: str, keywords: tuple[str, ...]) -> int:
    return sum(1 for keyword in keywords if keyword in text)


def _department_scores(intent: str) -> dict[DepartmentKey, int]:
    scores: dict[DepartmentKey, int] = {
        "marketing": 0,
        "sales": 0,
        "operations": 0,
        "finance": 0,
        "general": 0,
    }

    for capability in CAPABILITY_REGISTRY.values():
        if capability.department == "general":
            continue
        if _contains_any(intent, capability.keywords):
            scores[capability.department] += 1

    return scores


def _marketing_template_score(intent: str, template: ProjectTemplate) -> int:
    score = _count_matches(intent, template.keywords) * 3
    for agent_key in template.agent_order:
        capability = CAPABILITY_REGISTRY[agent_key]
        score += _count_matches(intent, capability.keywords)
    if template.review_agent and _contains_any(intent, ("review", "audit", "refine", "polish")):
        score += 1
    return score


def _pick_project_template(intent: str) -> ProjectTemplate | None:
    ranked = sorted(
        ((template, _marketing_template_score(intent, template)) for template in PROJECT_TEMPLATES),
        key=lambda item: item[1],
        reverse=True,
    )
    best_template, best_score = ranked[0]
    second_score = ranked[1][1] if len(ranked) > 1 else 0
    if best_score == 0:
        return None
    if best_score == second_score and best_score < 4:
        return None
    return best_template


def _template_implies_marketing(intent: str, template: ProjectTemplate | None) -> bool:
    if template is None:
        return False
    return _marketing_template_score(intent, template) >= 3


def _infer_department(intent: str) -> DepartmentKey:
    scores = _department_scores(intent)
    ranked = sorted(
        ((department, score) for department, score in scores.items() if department != "general"),
        key=lambda item: item[1],
        reverse=True,
    )

    best_department, best_score = ranked[0]
    second_score = ranked[1][1] if len(ranked) > 1 else 0

    if best_score == 0:
        return "general"
    if best_score == second_score:
        return "general"
    return best_department


def _select_marketing_agents(intent: str) -> tuple[str, ...]:
    selected: list[str] = []

    for key in MARKETING_SWARM_ORDER:
        capability = CAPABILITY_REGISTRY[key]
        if _contains_any(intent, capability.keywords):
            selected.append(key)

    launch_markers = ("launch", "campaign", "rollout", "funnel", "sequence")
    content_markers = CAPABILITY_REGISTRY["content"].keywords
    analytics_markers = CAPABILITY_REGISTRY["analytics"].keywords
    full_scope_markers = (
        "full",
        "complete",
        "end-to-end",
        "end to end",
        "across the board",
        "entire",
        "system",
        "strategy",
        "plan",
        "build",
    )

    if not selected and (_contains_any(intent, launch_markers) or _contains_any(intent, full_scope_markers)):
        return tuple(key for key in MARKETING_SWARM_ORDER if key != "creative_review")

    if not selected:
        return ("content",)

    channel_agent_map = {
        "linkedin": "linkedin_creator",
        "instagram": "instagram_creator",
        "tiktok": "tiktok_creator",
        "facebook": "facebook_creator",
        "email": "email_writer",
        "newsletter": "newsletter_writer",
        "landing page": "landing_page",
        "email sequence": "email_sequence",
    }

    for keyword, agent_key in channel_agent_map.items():
        if keyword in intent and agent_key not in selected:
            selected.append(agent_key)

    if "campaigns" in selected and "content" not in selected:
        selected.append("content")
    if "offers" in selected and _contains_any(intent, launch_markers) and "campaigns" not in selected:
        selected.append("campaigns")
    if "offers" in selected and _contains_any(intent, content_markers) and "content" not in selected:
        selected.append("content")
    if any(
        key in selected
        for key in (
            "linkedin_creator",
            "instagram_creator",
            "tiktok_creator",
            "facebook_creator",
            "email_writer",
            "email_sequence",
            "newsletter_writer",
            "landing_page",
        )
    ):
        if "content" not in selected:
            selected.append("content")
        if "brand_voice" not in selected:
            selected.append("brand_voice")
    if "landing_page" in selected and "offers" not in selected:
        selected.append("offers")
    if "email_sequence" in selected and "offers" not in selected:
        selected.append("offers")
    if ("campaigns" in selected or "offers" in selected) and _contains_any(intent, analytics_markers):
        if "analytics" not in selected:
            selected.append("analytics")

    if len(selected) > 1 and "creative_review" not in selected:
        selected.append("creative_review")

    ordered = [key for key in MARKETING_SWARM_ORDER if key in selected]
    return tuple(ordered)


def _infer_marketing_project_type(intent: str, selected_agents: tuple[str, ...]) -> str:
    if "cro_funnel" in selected_agents:
        return "cro_funnel"
    if "market_research" in selected_agents and len(selected_agents) == 1:
        return "market_research"
    if "landing_page" in selected_agents:
        return "landing_page"
    if "email_sequence" in selected_agents:
        return "email_sequence"
    if any(
        key in selected_agents
        for key in (
            "linkedin_creator",
            "instagram_creator",
            "tiktok_creator",
            "facebook_creator",
            "email_writer",
            "email_sequence",
            "newsletter_writer",
        )
    ):
        return "content_system"
    if len(selected_agents) > 1:
        return "growth_system"
    if not selected_agents:
        return "general_marketing"

    key = selected_agents[0]
    if key == "offers":
        return "offer_creation"
    if key == "campaigns":
        return "campaign_launch"
    if key == "analytics":
        return "measurement"
    if _contains_any(intent, ("positioning", "competitor", "angle", "message")):
        return "positioning"
    return "content_creation"


def _should_use_marketing_swarm(intent: str, selected_agents: tuple[str, ...]) -> bool:
    if len(selected_agents) > 1:
        return True

    swarm_markers = (
        "full",
        "complete",
        "end-to-end",
        "end to end",
        "system",
        "across the board",
        "entire",
        "full stack",
        "all at once",
    )
    return _contains_any(intent, swarm_markers)


def plan_route(intent: str, *, forced_department: DepartmentKey | None = None) -> RoutePlan:
    normalized_intent = intent.lower().strip()
    template = _pick_project_template(normalized_intent)
    department = forced_department or (
        "marketing" if _template_implies_marketing(normalized_intent, template) else _infer_department(normalized_intent)
    )

    if department == "sales":
        return RoutePlan(
            department="sales",
            project_type="revenue_system",
            mode="swarm",
            selected_agents=SALES_AGENT_ORDER,
            summary="Revenue template selected for pipeline fixes, objection handling, and follow-up momentum.",
            template_key="sales_motion",
        )

    if department == "operations":
        return RoutePlan(
            department="operations",
            project_type="execution_rhythm",
            mode="swarm",
            selected_agents=OPERATIONS_AGENT_ORDER,
            summary="Operations template selected for priorities, process design, and weekly cadence control.",
            template_key="execution_rhythm",
        )

    if department == "finance":
        return RoutePlan(
            department="finance",
            project_type="finance_system",
            mode="swarm",
            selected_agents=FINANCE_AGENT_ORDER,
            summary="Finance template selected for cashflow, pricing guardrails, and scenario forecasting.",
            template_key="finance_system",
        )

    if department == "general":
        return RoutePlan(
            department="general",
            project_type="cross_functional",
            mode="swarm",
            selected_agents=("market_research", "offers", "campaigns", "content", "analytics", "creative_review"),
            summary="Cross-functional or ambiguous request detected; CEO can choose between CMO, Sales, and Operations.",
            template_key="cross_functional",
        )

    if template is not None:
        selected_agents = list(template.agent_order)
        for agent_key in _select_marketing_agents(normalized_intent):
            if agent_key not in selected_agents:
                selected_agents.append(agent_key)
        if template.review_agent and template.review_agent not in selected_agents:
            selected_agents.append(template.review_agent)
        return RoutePlan(
            department="marketing",
            project_type=template.project_type,
            mode=template.mode,
            selected_agents=tuple(selected_agents),
            summary=template.summary,
            template_key=template.key,
        )

    selected_agents = _select_marketing_agents(normalized_intent)
    mode: ExecutionMode = "swarm" if _should_use_marketing_swarm(normalized_intent, selected_agents) else "single"
    project_type = _infer_marketing_project_type(normalized_intent, selected_agents)

    return RoutePlan(
        department="marketing",
        project_type=project_type,
        mode=mode,
        selected_agents=selected_agents,
        summary=(
            f"CMO request classified as {project_type} using "
            f"{', '.join(selected_agents)} in {mode} mode."
        ),
        template_key=None,
    )


def route_plan_payload(route_plan: RoutePlan) -> dict[str, Any]:
    return {
        "department": route_plan.department,
        "project_type": route_plan.project_type,
        "mode": route_plan.mode,
        "selected_agents": list(route_plan.selected_agents),
        "summary": route_plan.summary,
        "template_key": route_plan.template_key,
    }


def provider_payload(model_candidate: ModelCandidate) -> dict[str, str]:
    return {
        "provider": model_candidate.provider,
        "model": model_candidate.model,
    }


def _worker_model(model_candidate: ModelCandidate | None = None):
    return create_chat_model(
        model_candidate or get_model_candidates("worker")[0],
        temperature=0.6,
        max_tokens=4096,
    )


def _supervisor_model(model_candidate: ModelCandidate | None = None):
    return create_chat_model(
        model_candidate or get_model_candidates("supervisor")[0],
        temperature=0.3,
        max_tokens=4096,
    )


def _ceo_system_message(route_plan: RoutePlan | None = None) -> SystemMessage:
    body = load_prompt("ceo_system").strip()
    if route_plan is not None:
        body += (
            "\n\n## Active routing context\n"
            f"Detected department: {route_plan.department}\n"
            f"Detected project type: {route_plan.project_type}\n"
            f"Execution mode: {route_plan.mode}\n"
            f"Selected specialist set: {', '.join(route_plan.selected_agents) if route_plan.selected_agents else 'none'}\n"
            f"Routing reason: {route_plan.summary}\n"
            "Treat this routing context as a hard constraint. Do not ignore the selected lane."
        )
    return SystemMessage(
        content=[
            {
                "type": "text",
                "text": body,
                "cache_control": {"type": "ephemeral"},
            }
        ]
    )


def _cmo_system_message(route_plan: RoutePlan) -> SystemMessage:
    selected = ", ".join(route_plan.selected_agents)
    mode_instruction = (
        "Use the selected specialists one at a time unless parallel work clearly improves the answer."
        if route_plan.mode == "single"
        else "Fan out across the selected specialists when the work naturally splits, then synthesize into one executive answer."
    )
    body = (
        "You are CMO inside Jarvis. You do not default to the same specialist for every project. "
        "You route based on the detected project type and only use the selected specialists below.\n\n"
        f"Project type: {route_plan.project_type}\n"
        f"Execution mode: {route_plan.mode}\n"
        f"Project template: {route_plan.template_key or 'dynamic classifier'}\n"
        f"Selected specialists: {selected}\n"
        f"Routing reason: {route_plan.summary}\n\n"
        "Specialist meanings:\n"
        "- market_research: audience research, demand signals, pain points, trend scans, market understanding\n"
        "- competitor_intel: competitor offers, category gaps, differentiation, positioning whitespace\n"
        "- content: posts, hooks, scripts, headlines, thought leadership, creative execution\n"
        "- campaigns: launches, funnels, rollout plans, distribution, sequencing\n"
        "- offers: packaging, positioning, naming, bonuses, pricing, guarantee logic\n"
        "- brand_voice: voice rules, narrative consistency, founder-led tone, signature messaging\n"
        "- landing_page: hero structure, page copy flow, proof blocks, objections, CTA architecture\n"
        "- linkedin_creator: LinkedIn posts and founder-led thought leadership assets\n"
        "- instagram_creator: reels, carousels, captions, and visual content concepts\n"
        "- tiktok_creator: short-form vertical video hooks, scripts, and shot directions\n"
        "- facebook_creator: community posts, page posts, and discussion-driving assets\n"
        "- email_writer: email sequences, nurture copy, and conversion emails\n"
        "- email_sequence: multi-email campaign or nurture sequencing with staged intent\n"
        "- newsletter_writer: editorial newsletters and recurring issue structures\n"
        "- cro_funnel: landing page messaging, CTA hierarchy, conversion path, friction reduction\n"
        "- analytics: KPIs, scorecards, measurement, experiments, reporting\n\n"
        "- creative_review: final QA, cohesion, message clarity, final polish before synthesis\n\n"
        "Rules:\n"
        "- Do not call specialists outside the selected set.\n"
        "- If the request is narrow, hand off to the one best specialist.\n"
        "- If the request is broad, coordinate the selected specialists and return a unified answer.\n"
        f"- {mode_instruction}\n"
        "- Keep handoff lines short and operational.\n"
        "- Final output must feel like one coherent CMO recommendation, not four disconnected notes."
    )
    return SystemMessage(
        content=[
            {
                "type": "text",
                "text": body,
                "cache_control": {"type": "ephemeral"},
            }
        ]
    )


def _build_cmo_app(route_plan: RoutePlan, model_candidate: ModelCandidate | None = None):
    worker = _worker_model(model_candidate)
    specialists = [MARKETING_AGENT_BUILDERS[key](worker) for key in route_plan.selected_agents]

    workflow = create_supervisor(
        specialists,
        model=_supervisor_model(model_candidate),
        prompt=_cmo_system_message(route_plan),
        include_agent_name="inline",
        parallel_tool_calls=route_plan.mode == "swarm" and len(route_plan.selected_agents) > 1,
        supervisor_name="cmo",
    )
    return workflow.compile(name="cmo")


def build_jarvis_app(intent: str | None = None, model_candidate: ModelCandidate | None = None):
    """Compile the right supervisor graph for the current request."""
    route_plan = plan_route(intent or "")
    worker = _worker_model(model_candidate)

    if route_plan.department == "marketing":
        departments = [_build_cmo_app(route_plan, model_candidate)]
    elif route_plan.department == "sales":
        departments = [build_sales_agent(worker)]
    elif route_plan.department == "operations":
        departments = [build_operations_agent(worker)]
    else:
        departments = [
            _build_cmo_app(
                RoutePlan(
                    department="marketing",
                    project_type="growth_system",
                    mode="swarm",
                    selected_agents=("market_research", "offers", "campaigns", "content", "analytics", "creative_review"),
                    summary="Default full-stack CMO lane available for ambiguous or cross-functional requests.",
                    template_key="default_growth_system",
                ),
                model_candidate,
            ),
            build_sales_agent(worker),
            build_operations_agent(worker),
        ]

    workflow = create_supervisor(
        departments,
        model=_supervisor_model(model_candidate),
        prompt=_ceo_system_message(route_plan),
        include_agent_name="inline",
        parallel_tool_calls=False,
        supervisor_name="ceo",
    )
    return workflow.compile(name="ceo")


def get_jarvis_app(intent: str | None = None, model_candidate: ModelCandidate | None = None):
    route_plan = plan_route(intent or "")
    resolved_model_candidate = model_candidate or get_model_candidates()[0]
    cache_key = (
        route_plan.department,
        route_plan.project_type,
        route_plan.mode,
        route_plan.selected_agents,
        resolved_model_candidate.provider,
        resolved_model_candidate.model,
    )
    if cache_key not in _JARVIS_APPS:
        _JARVIS_APPS[cache_key] = build_jarvis_app(intent, resolved_model_candidate)
    return _JARVIS_APPS[cache_key]


def reset_jarvis_app_for_tests() -> None:
    _JARVIS_APPS.clear()


def serialize_update_payload(obj: Any) -> Any:
    """Make LangGraph 'updates' chunks JSON-serializable for SSE."""
    if isinstance(obj, BaseMessage):
        return {
            "type": obj.__class__.__name__,
            "content": obj.content,
            "name": getattr(obj, "name", None),
            "id": getattr(obj, "id", None),
        }
    if isinstance(obj, dict):
        return {k: serialize_update_payload(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize_update_payload(v) for v in obj]
    if isinstance(obj, (str, int, float, bool)) or obj is None:
        return obj
    return str(obj)
