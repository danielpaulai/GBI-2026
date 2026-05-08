from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from agents._prompts import load_prompt


class CampaignStep(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    step: str | int = Field(description="Name of the launch or campaign step.")
    channel: str = Field(description="Primary channel for this step.")
    timing: str = Field(description="When the step should happen.")
    purpose: str = Field(description="Why this step exists.")


class ContentAsset(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    asset: str = Field(
        description="Name of the asset or content format.",
        validation_alias=AliasChoices("asset", "format", "title", "hook", "type", "name", "channel", "content_type"),
    )
    angle: str = Field(
        description="Strategic angle for the asset.",
        validation_alias=AliasChoices(
            "angle",
            "caption_angle",
            "core_message",
            "visual_direction",
            "description",
            "purpose",
            "objective",
            "summary",
            "why_it_works",
        ),
    )
    CTA: str = Field(
        default="",
        description="Primary call to action.",
        validation_alias=AliasChoices("CTA", "cta", "call_to_action", "next_step"),
    )


class PostDraft(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    hook: str = Field(
        description="Opening line or hook.",
        validation_alias=AliasChoices("hook", "opening_line", "title"),
    )
    body: str = Field(
        description="Main body of the post.",
        validation_alias=AliasChoices("body", "core_message", "script", "caption_angle"),
    )
    CTA: str = Field(
        default="",
        description="Closing CTA.",
        validation_alias=AliasChoices("CTA", "cta", "call_to_action"),
    )


class EmailDraft(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    subject: str = Field(
        description="Email subject line.",
        validation_alias=AliasChoices("subject", "subject_line", "title"),
    )
    purpose: str = Field(
        description="What the email should achieve.",
        validation_alias=AliasChoices("purpose", "body_direction", "opening", "goal"),
    )
    body_outline: list[str] | str = Field(
        default="",
        description="Bullet outline of the email body.",
        validation_alias=AliasChoices("body_outline", "outline", "bodyOutline", "body_direction", "content"),
    )
    CTA: str = Field(
        default="",
        description="Closing CTA.",
        validation_alias=AliasChoices("CTA", "cta", "call_to_action"),
    )


class FollowupStep(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    step: str | int = Field(
        description="Step number or stage label.",
        validation_alias=AliasChoices("step", "step_number"),
    )
    channel: str = Field(description="Primary follow-up channel.")
    timing: str = Field(default="", description="When this follow-up should be sent.")
    purpose: str = Field(default="", description="Commercial purpose of the touchpoint.")
    message: str = Field(description="Paste-ready message or script.")
    CTA: str = Field(
        default="",
        description="Closing CTA.",
        validation_alias=AliasChoices("CTA", "cta", "call_to_action"),
    )


class NewsletterSection(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    section: str = Field(
        description="Section title.",
        validation_alias=AliasChoices("section", "title", "heading"),
    )
    purpose: str = Field(
        description="Why this section is included.",
        validation_alias=AliasChoices("purpose", "content", "summary"),
    )
    bullets: list[str] | str = Field(
        description="Bullet content for the section.",
        validation_alias=AliasChoices("bullets", "content", "points"),
    )


class LandingPageSection(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    section: str = Field(
        description="Section name on the page.",
        validation_alias=AliasChoices("section", "name", "title"),
    )
    purpose: str = Field(
        default="",
        description="Why this section exists.",
        validation_alias=AliasChoices("purpose", "goal", "summary"),
    )
    copy_direction: str | list[str] = Field(
        description="What the section should say or prove.",
        validation_alias=AliasChoices("copy_direction", "elements", "visuals", "content"),
    )


class MetricSpec(BaseModel):
    metric: str = Field(description="Metric name.")
    target: str = Field(description="Target or benchmark.")
    action_trigger: str = Field(
        description="What action this metric should trigger.",
        validation_alias=AliasChoices("action_trigger", "decision_trigger"),
    )


class MarketResearchOutput(BaseModel):
    market_read: str = Field(description="One-line market read.")
    audience_signals: list[str] = Field(description="Audience truths, segment traits, or buyer signals.")
    pain_points: list[str] = Field(description="Key pain points in priority order.")
    buying_triggers: list[str] = Field(description="Triggers that make buyers act now.")
    opportunity_gaps: list[str] = Field(description="Gaps the offer or campaign can exploit.")
    research_sources: list[str] = Field(description="Source URLs, publication names, or datasets used.")


class CompetitorIntelOutput(BaseModel):
    category_snapshot: str = Field(description="One-line summary of the competitive category.")
    competitor_patterns: list[str] = Field(description="Repeated themes, claims, or structures seen in competitors.")
    differentiation_gaps: list[str] = Field(description="Whitespace or differentiation gaps.")
    positioning_moves: list[str] = Field(description="Recommended positioning moves based on the gaps.")
    proof_requirements: list[str] = Field(description="What proof or evidence is needed to support the new position.")


class OfferOutput(BaseModel):
    offer_thesis: str = Field(description="Core commercial thesis of the offer.")
    offer_name: str = Field(description="Offer name or naming direction.")
    promise: str = Field(description="Outcome promise.")
    audience: str = Field(description="Primary audience for the offer.")
    deliverables: list[str] = Field(description="Included deliverables.")
    bonuses: list[str] = Field(description="Recommended bonuses.")
    pricing_logic: list[str] = Field(description="Pricing rationale or architecture.")
    guarantee: str = Field(description="Guarantee or risk reversal.")


class ContentStrategyOutput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    narrative_spine: str = Field(
        description="Central narrative or messaging spine.",
        validation_alias=AliasChoices("narrative_spine", "narrativeSpine", "messaging_spine", "messagingSpine"),
    )
    content_pillars: list[str | dict[str, Any]] = Field(
        description="Content pillars.",
        validation_alias=AliasChoices("content_pillars", "contentPillars", "pillars"),
    )
    editorial_angles: list[str | dict[str, Any]] = Field(
        description="Editorial angles or recurring stories.",
        validation_alias=AliasChoices("editorial_angles", "editorialAngles", "angles"),
    )
    content_assets: list[ContentAsset | str] = Field(
        description="Priority content assets to build.",
        validation_alias=AliasChoices("content_assets", "contentAssets", "assets"),
    )
    CTA_rules: list[str] = Field(
        description="Rules for CTAs across assets.",
        validation_alias=AliasChoices("CTA_rules", "cta_rules", "ctaRules", "CTA Rules"),
    )


class CampaignOutput(BaseModel):
    campaign_objective: str = Field(description="One-line campaign objective.")
    target_audience: str = Field(description="Primary audience for the campaign.")
    sequence: list[CampaignStep | str | dict[str, Any]] = Field(description="Ordered launch or campaign sequence.")
    risk_controls: list[str] = Field(description="Risks or dependencies to watch.")


class BrandVoiceOutput(BaseModel):
    voice_core: str = Field(description="One-line voice definition.")
    tone_rules: list[str] = Field(description="Rules for tone and cadence.")
    phrases_to_use: list[str] = Field(description="Preferred phrases or patterns.")
    phrases_to_avoid: list[str] = Field(description="Phrases to avoid.")
    editorial_guardrails: list[str] = Field(description="Guardrails for maintaining voice consistency.")


class LinkedinOutput(BaseModel):
    channel_goal: str = Field(description="What LinkedIn should do commercially.")
    posting_rhythm: str = Field(description="Posting cadence.")
    posts: list[PostDraft] = Field(description="LinkedIn post drafts.")


class InstagramOutput(BaseModel):
    channel_goal: str = Field(description="What Instagram should do commercially.")
    content_mix: list[str] = Field(description="Recommended mix of reels, carousels, stories, etc.")
    assets: list[ContentAsset] = Field(description="Instagram asset concepts.")
    story_hooks: list[str] = Field(description="Short story or reel hook ideas.")


class TiktokConcept(BaseModel):
    title: str = Field(description="Working title for the TikTok concept.")
    hook: str = Field(description="Opening spoken or on-screen hook.")
    script: str = Field(description="Short-form spoken script or beat-by-beat copy.")
    shot_direction: str = Field(description="How the clip should be filmed or cut.")
    CTA: str = Field(description="Closing CTA.")


class TiktokOutput(BaseModel):
    channel_goal: str = Field(description="What TikTok should do commercially.")
    video_concepts: list[TiktokConcept] = Field(description="TikTok-native vertical video concepts.")
    trend_notes: list[str] = Field(description="Useful style, pacing, or trend notes.")


class FacebookOutput(BaseModel):
    channel_goal: str = Field(description="What Facebook should do commercially.")
    community_angle: str = Field(description="The community or conversation angle.")
    post_variants: list[PostDraft] = Field(description="Facebook-native post variants.")
    engagement_prompts: list[str] = Field(description="Prompts that trigger comments or shares.")


class EmailOutput(BaseModel):
    sequence_goal: str = Field(description="Commercial purpose of the sequence.")
    send_cadence: str = Field(description="Recommended send cadence.")
    emails: list[EmailDraft | dict[str, Any]] = Field(description="Email sequence drafts.")


class NewsletterOutput(BaseModel):
    editorial_thesis: str = Field(description="The central thesis or editorial role of the newsletter.")
    issue_theme: str = Field(description="Theme for the issue or newsletter line.")
    sections: list[NewsletterSection | dict[str, Any]] = Field(description="Newsletter sections.")
    CTA: str = Field(description="Closing CTA.")


class LandingPageOutput(BaseModel):
    conversion_goal: str = Field(description="Primary conversion goal for the page.")
    hero_headline: str = Field(description="Hero headline or opening promise.")
    hero_subhead: str = Field(description="Hero subhead that clarifies the offer.")
    proof_stack: list[str | dict[str, Any]] = Field(description="Proof elements to show on the page.")
    objections_to_handle: list[str | dict[str, Any]] = Field(description="Key objections the page must address.")
    page_sections: list[LandingPageSection | dict[str, Any]] = Field(description="Recommended page sections and copy direction.")
    CTA: str = Field(description="Primary page CTA.")


class EmailSequenceOutput(BaseModel):
    sequence_goal: str = Field(description="Commercial goal of the sequence.")
    sequencing_logic: list[str] = Field(description="Why the sequence is staged this way.")
    emails: list[EmailDraft | dict[str, Any]] = Field(description="Distinct emails in the sequence.")
    CTA: str = Field(description="Primary CTA across the sequence.")


class CroOutput(BaseModel):
    conversion_goal: str = Field(description="Primary conversion goal.")
    friction_points: list[str] = Field(description="Current friction or blockers.")
    page_changes: list[str] = Field(description="Specific page or funnel changes.")
    proof_elements: list[str] = Field(description="Proof elements to add or strengthen.")
    measurement: list[str] = Field(description="What to measure after shipping.")


class AnalyticsOutput(BaseModel):
    measurement_goal: str = Field(description="Overall measurement objective.")
    scorecard: list[MetricSpec | dict[str, Any]] = Field(description="Primary metrics and decision triggers.")
    review_cadence: str = Field(description="How often to review the scorecard.")
    experiment_queue: list[str | dict[str, Any]] = Field(description="Priority experiments or interpretation notes.")


class CreativeReviewOutput(BaseModel):
    verdict: str = Field(description="Overall verdict on quality and readiness.")
    strengths: list[str] = Field(description="Strongest parts of the work.")
    gaps: list[str] = Field(description="Main weaknesses or missing components.")
    revisions: list[str] = Field(description="Required revisions before release.")
    release_decision: str = Field(description="Ship, revise, or hold.")


class RevenuePlanOutput(BaseModel):
    revenue_goal: str = Field(description="Primary revenue goal.")
    pipeline_fixes: list[str] = Field(description="Pipeline or conversion fixes.")
    commercial_levers: list[str] = Field(description="Levers that improve close rate or revenue quality.")
    next_actions: list[str] = Field(description="Immediate actions.")


class ObjectionMatrixOutput(BaseModel):
    sales_context: str = Field(description="Commercial context for the objections.")
    objections: list[str] = Field(description="Top objections.")
    rebuttals: list[str] = Field(description="Clear rebuttals or reframes.")
    proof_points: list[str] = Field(description="Proof points that support the rebuttals.")
    closing_prompts: list[str] = Field(description="Closing prompts to move the deal forward.")


class FollowupSequenceOutput(BaseModel):
    sequence_goal: str = Field(description="What the follow-up sequence should achieve.")
    steps: list[FollowupStep] = Field(description="Short follow-up messages or sequence steps.")


class OperationsPrioritiesOutput(BaseModel):
    operating_focus: str = Field(description="Primary operating focus for the team.")
    priorities: list[str] = Field(description="Priority initiatives.")
    owner_rules: list[str] = Field(description="Ownership or delegation rules.")
    weekly_non_negotiables: list[str] = Field(description="Non-negotiable weekly actions.")


class OperationsProcessOutput(BaseModel):
    process_target: str = Field(description="Process being redesigned.")
    current_breakdowns: list[str] = Field(description="Current process failures.")
    future_state: list[str] = Field(description="Future-state process flow.")
    safeguards: list[str] = Field(description="Safeguards and SOP rules.")


class OperationsCadenceOutput(BaseModel):
    cadence_goal: str = Field(description="Purpose of the operating cadence.")
    meetings: list[str] = Field(description="Meeting rhythm or recurring rituals.")
    scorecard_items: list[str] = Field(description="What to track each cycle.")
    escalation_rules: list[str] = Field(description="Escalation or decision rules.")


class FinanceCashflowOutput(BaseModel):
    finance_read: str = Field(description="One-line finance or cashflow read.")
    risks: list[str] = Field(description="Main cashflow or finance risks.")
    safeguards: list[str] = Field(description="Safeguards to add.")
    cash_actions: list[str] = Field(description="Immediate cash actions.")


class FinancePricingOutput(BaseModel):
    pricing_position: str = Field(description="Recommended pricing position.")
    margin_drivers: list[str] = Field(description="Main margin or economics drivers.")
    pricing_rules: list[str] = Field(description="Pricing rules or guardrails.")
    downside_risks: list[str] = Field(description="Downside risks.")


class FinanceForecastOutput(BaseModel):
    forecast_basis: str = Field(description="What the forecast is based on.")
    best_case: list[str] = Field(description="Best-case assumptions or outcomes.")
    base_case: list[str] = Field(description="Base-case assumptions or outcomes.")
    downside_case: list[str] = Field(description="Downside assumptions or outcomes.")
    decision_points: list[str] = Field(description="Decision points to watch.")


@dataclass(frozen=True)
class SpecialistSpec:
    key: str
    department: str
    label: str
    branch: str
    short_label: str
    when_to_use: str
    base_prompt: str
    output_model: type[BaseModel]
    required_findings: tuple[str, ...] = ()
    builder_name: str | None = None


def _render_scalar(value: Any) -> str:
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=True)


def _render_dict_row(item: dict[str, Any]) -> str:
    ordered = [f"{key.replace('_', ' ')}: {_render_scalar(value)}" for key, value in item.items() if value not in (None, "", [], {})]
    return "; ".join(ordered)


def format_output(spec: SpecialistSpec, model: BaseModel) -> str:
    data = model.model_dump()
    lines = [spec.label]

    for key, value in data.items():
        heading = key.replace("_", " ").title()
        if value in (None, "", [], {}):
            continue
        lines.append(f"\n{heading}:")
        if isinstance(value, str):
            lines.append(value)
        elif isinstance(value, list):
            if value and isinstance(value[0], dict):
                for index, item in enumerate(value, start=1):
                    lines.append(f"{index}. {_render_dict_row(item)}")
            else:
                for item in value:
                    lines.append(f"- {_render_scalar(item)}")
        elif isinstance(value, dict):
            lines.append(_render_dict_row(value))
        else:
            lines.append(_render_scalar(value))

    return "\n".join(lines).strip()


def schema_contract(model: type[BaseModel]) -> str:
    schema = model.model_json_schema()
    properties = schema.get("properties", {})
    required = set(schema.get("required", []))
    lines = ["Return valid JSON only. Do not wrap it in markdown."]
    for name, field in properties.items():
        field_type = field.get("type", "object")
        description = field.get("description", "")
        suffix = "required" if name in required else "optional"
        lines.append(f"- {name} ({field_type}, {suffix}): {description}")
    return "\n".join(lines)


def executive_key_for_department(department: str) -> str:
    return {
        "marketing": "cmo",
        "sales": "cro",
        "operations": "coo",
        "finance": "cfo",
    }.get(department, "cmo")


SPECIALIST_SPECS: dict[str, SpecialistSpec] = {
    "market_research": SpecialistSpec(
        key="market_research",
        department="marketing",
        label="Market Radar",
        branch="Audience signal",
        short_label="Research",
        when_to_use="Use when the request needs market context, audience pain, demand signals, or source-backed research.",
        base_prompt=load_prompt("market_research_system"),
        output_model=MarketResearchOutput,
        builder_name="market_research",
    ),
    "competitor_intel": SpecialistSpec(
        key="competitor_intel",
        department="marketing",
        label="Competitor Intel",
        branch="Positioning gap",
        short_label="Competitors",
        when_to_use="Use when the request needs differentiation, category comparison, or whitespace analysis.",
        base_prompt=load_prompt("competitor_intel_system"),
        output_model=CompetitorIntelOutput,
        required_findings=("market_research",),
        builder_name="competitor_intel",
    ),
    "offers": SpecialistSpec(
        key="offers",
        department="marketing",
        label="Offer Forge",
        branch="Positioning branch",
        short_label="Offers",
        when_to_use="Use when the request is about packaging, pricing, bonuses, guarantees, naming, or commercial positioning.",
        base_prompt="You are the Offers specialist inside CMO. Create concrete, commercially useful offer architecture. Prefer clarity and specificity over hype. Avoid unverifiable claims or fake scarcity.",
        output_model=OfferOutput,
        required_findings=("market_research", "competitor_intel"),
        builder_name="offers",
    ),
    "content": SpecialistSpec(
        key="content",
        department="marketing",
        label="Narrative Engine",
        branch="Messaging spine",
        short_label="Narrative",
        when_to_use="Use when the request needs messaging, content pillars, narrative structure, or content assets.",
        base_prompt="You are the Content specialist inside CMO. Create narrative systems, content pillars, and paste-ready asset directions. Do not default to generic content advice.",
        output_model=ContentStrategyOutput,
        required_findings=("market_research", "brand_voice"),
        builder_name="content",
    ),
    "campaigns": SpecialistSpec(
        key="campaigns",
        department="marketing",
        label="Channel Grid",
        branch="Launch branches",
        short_label="Channels",
        when_to_use="Use when the request needs launch sequencing, rollout structure, or multi-channel campaigns.",
        base_prompt="You are the Campaigns specialist inside CMO. Build sequencing, timing, channels, and operational launch logic. Make the plan practical and executable.",
        output_model=CampaignOutput,
        required_findings=("market_research", "offers"),
        builder_name="campaigns",
    ),
    "brand_voice": SpecialistSpec(
        key="brand_voice",
        department="marketing",
        label="Voice Foundry",
        branch="Tone system",
        short_label="Voice",
        when_to_use="Use when the request needs voice, tone, founder-led narrative, or editorial guardrails.",
        base_prompt=load_prompt("brand_voice_system"),
        output_model=BrandVoiceOutput,
        required_findings=("market_research",),
        builder_name="brand_voice",
    ),
    "linkedin_creator": SpecialistSpec(
        key="linkedin_creator",
        department="marketing",
        label="LinkedIn Studio",
        branch="Channel execution",
        short_label="LinkedIn",
        when_to_use="Use when the request includes LinkedIn thought leadership or founder posts.",
        base_prompt=load_prompt("linkedin_creator_system"),
        output_model=LinkedinOutput,
        required_findings=("content", "brand_voice"),
        builder_name="linkedin_creator",
    ),
    "landing_page": SpecialistSpec(
        key="landing_page",
        department="marketing",
        label="Landing Page Architect",
        branch="Conversion page",
        short_label="Landing",
        when_to_use="Use when the request needs landing page structure, hero copy, proof blocks, objections, or CTA flow.",
        base_prompt=load_prompt("landing_page_system"),
        output_model=LandingPageOutput,
        required_findings=("market_research", "offers", "brand_voice"),
        builder_name="landing_page",
    ),
    "instagram_creator": SpecialistSpec(
        key="instagram_creator",
        department="marketing",
        label="Instagram Studio",
        branch="Channel execution",
        short_label="Instagram",
        when_to_use="Use when the request includes Instagram reels, carousels, or stories.",
        base_prompt=load_prompt("instagram_creator_system"),
        output_model=InstagramOutput,
        required_findings=("content", "brand_voice"),
        builder_name="instagram_creator",
    ),
    "tiktok_creator": SpecialistSpec(
        key="tiktok_creator",
        department="marketing",
        label="TikTok Reactor",
        branch="Short-form execution",
        short_label="TikTok",
        when_to_use="Use when the request includes TikTok, short-form vertical video, creator hooks, or UGC-style content.",
        base_prompt=load_prompt("tiktok_creator_system"),
        output_model=TiktokOutput,
        required_findings=("content", "brand_voice"),
        builder_name="tiktok_creator",
    ),
    "facebook_creator": SpecialistSpec(
        key="facebook_creator",
        department="marketing",
        label="Facebook Signal",
        branch="Channel execution",
        short_label="Facebook",
        when_to_use="Use when the request includes Facebook posts, groups, or community activation.",
        base_prompt=load_prompt("facebook_creator_system"),
        output_model=FacebookOutput,
        required_findings=("content", "brand_voice"),
        builder_name="facebook_creator",
    ),
    "email_writer": SpecialistSpec(
        key="email_writer",
        department="marketing",
        label="Email Forge",
        branch="Channel execution",
        short_label="Email",
        when_to_use="Use when the request includes email sequence or nurture writing.",
        base_prompt=load_prompt("email_writer_system"),
        output_model=EmailOutput,
        required_findings=("offers", "brand_voice"),
        builder_name="email_writer",
    ),
    "email_sequence": SpecialistSpec(
        key="email_sequence",
        department="marketing",
        label="Sequence Architect",
        branch="Lifecycle sequence",
        short_label="Sequence",
        when_to_use="Use when the request needs a multi-email launch, nurture, objection, or reactivation sequence.",
        base_prompt=load_prompt("email_sequence_system"),
        output_model=EmailSequenceOutput,
        required_findings=("market_research", "offers", "brand_voice"),
        builder_name="email_sequence",
    ),
    "newsletter_writer": SpecialistSpec(
        key="newsletter_writer",
        department="marketing",
        label="Newsletter Desk",
        branch="Channel execution",
        short_label="Newsletter",
        when_to_use="Use when the request includes newsletter strategy or issue writing.",
        base_prompt=load_prompt("newsletter_writer_system"),
        output_model=NewsletterOutput,
        required_findings=("content", "brand_voice"),
        builder_name="newsletter_writer",
    ),
    "cro_funnel": SpecialistSpec(
        key="cro_funnel",
        department="marketing",
        label="Conversion Reactor",
        branch="Funnel pressure",
        short_label="CRO",
        when_to_use="Use when the request is about landing pages, CTAs, friction reduction, or funnel conversion.",
        base_prompt=load_prompt("cro_funnel_system"),
        output_model=CroOutput,
        required_findings=("offers",),
        builder_name="cro_funnel",
    ),
    "analytics": SpecialistSpec(
        key="analytics",
        department="marketing",
        label="Signal Loop",
        branch="Performance branch",
        short_label="Signals",
        when_to_use="Use when the request needs scorecards, metrics, measurement, or experimentation.",
        base_prompt="You are the Analytics specialist inside CMO. Build useful scorecards tied to decisions, not vanity dashboards. Do not invent historical data.",
        output_model=AnalyticsOutput,
        required_findings=("campaigns", "cro_funnel"),
        builder_name="analytics",
    ),
    "creative_review": SpecialistSpec(
        key="creative_review",
        department="marketing",
        label="Quality Gate",
        branch="Final synthesis",
        short_label="Review",
        when_to_use="Use when multiple specialist outputs need QA, tightening, or release readiness review.",
        base_prompt=load_prompt("creative_review_system"),
        output_model=CreativeReviewOutput,
        builder_name="creative_review",
    ),
    "pipeline_architect": SpecialistSpec(
        key="pipeline_architect",
        department="sales",
        label="Pipeline Architect",
        branch="Revenue architecture",
        short_label="Pipeline",
        when_to_use="Use when the revenue lane needs pipeline design, close-rate improvement, or deal-stage fixes.",
        base_prompt="You are the CRO pipeline architect. Build a sharper revenue engine with clear pipeline and conversion fixes.",
        output_model=RevenuePlanOutput,
        builder_name="sales",
    ),
    "objection_handler": SpecialistSpec(
        key="objection_handler",
        department="sales",
        label="Objection Matrix",
        branch="Deal resistance",
        short_label="Objections",
        when_to_use="Use when the revenue lane needs objection handling, proof points, or close support.",
        base_prompt="You are the CRO objection specialist. Convert buyer hesitation into proof-backed responses.",
        output_model=ObjectionMatrixOutput,
        required_findings=("pipeline_architect",),
        builder_name="sales",
    ),
    "followup_writer": SpecialistSpec(
        key="followup_writer",
        department="sales",
        label="Follow-Up Forge",
        branch="Deal momentum",
        short_label="Follow-up",
        when_to_use="Use when the revenue lane needs follow-up messages, post-call sequences, or reactivation messaging.",
        base_prompt="You are the CRO follow-up writer. Create concise, persuasive follow-up sequences that move the deal.",
        output_model=FollowupSequenceOutput,
        required_findings=("pipeline_architect", "objection_handler"),
        builder_name="sales",
    ),
    "ops_priorities": SpecialistSpec(
        key="ops_priorities",
        department="operations",
        label="Priority Grid",
        branch="Execution focus",
        short_label="Priorities",
        when_to_use="Use when the operations lane needs weekly priorities, owners, or focus management.",
        base_prompt="You are the COO priorities specialist. Turn broad execution goals into a focused weekly operating plan.",
        output_model=OperationsPrioritiesOutput,
        builder_name="operations",
    ),
    "ops_process": SpecialistSpec(
        key="ops_process",
        department="operations",
        label="Process Designer",
        branch="Workflow system",
        short_label="Process",
        when_to_use="Use when the operations lane needs SOPs, process redesign, or execution workflows.",
        base_prompt="You are the COO process specialist. Redesign weak workflows into simple repeatable systems.",
        output_model=OperationsProcessOutput,
        required_findings=("ops_priorities",),
        builder_name="operations",
    ),
    "ops_cadence": SpecialistSpec(
        key="ops_cadence",
        department="operations",
        label="Cadence Control",
        branch="Meeting rhythm",
        short_label="Cadence",
        when_to_use="Use when the operations lane needs meeting cadence, scorecards, or escalation rules.",
        base_prompt="You are the COO cadence specialist. Build the operating rhythm that keeps execution aligned.",
        output_model=OperationsCadenceOutput,
        required_findings=("ops_priorities", "ops_process"),
        builder_name="operations",
    ),
    "finance_cashflow": SpecialistSpec(
        key="finance_cashflow",
        department="finance",
        label="Cashflow Guard",
        branch="Liquidity view",
        short_label="Cashflow",
        when_to_use="Use when the finance lane needs cash protection, runway thinking, or finance risk control.",
        base_prompt="You are the CFO cashflow specialist. Surface risks, safeguards, and immediate cash actions.",
        output_model=FinanceCashflowOutput,
    ),
    "finance_pricing": SpecialistSpec(
        key="finance_pricing",
        department="finance",
        label="Pricing Guardrail",
        branch="Margin logic",
        short_label="Pricing",
        when_to_use="Use when the finance lane needs pricing structure, margin logic, or downside protection.",
        base_prompt="You are the CFO pricing specialist. Protect margin while keeping the offer commercially workable.",
        output_model=FinancePricingOutput,
        required_findings=("finance_cashflow",),
    ),
    "finance_forecast": SpecialistSpec(
        key="finance_forecast",
        department="finance",
        label="Forecast Deck",
        branch="Scenario planning",
        short_label="Forecast",
        when_to_use="Use when the finance lane needs best-case, base-case, and downside scenarios.",
        base_prompt="You are the CFO forecasting specialist. Build simple scenario planning and decision points.",
        output_model=FinanceForecastOutput,
        required_findings=("finance_cashflow", "finance_pricing"),
    ),
}