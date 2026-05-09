"""
Creative Review Director — cross-model Critic-Judge.

Standalone module. Used by quality_loop.py to score specialist drafts.
NOT the swarm agent (that lives in marketing.py + prompts/creative_review_system.md).

This module uses Haiku — a DIFFERENT model than the writer agents (Sonnet/Opus).
Same-model self-judging inflates scores 5-15%. Cross-model = honest scores.

Usage:
    from agents.creative_review import review_draft

    result = review_draft(draft, content_type="linkedin_text_post", brand_dna=brand)
    # result["verdict"] → "ship" | "revise" | "kill"
    # result["weighted_total"] → e.g. 8.7
"""

from __future__ import annotations
import json
from typing import Optional
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage


# ============================================================
# RUBRICS — one per content type
# ============================================================

RUBRIC_LINKEDIN_TEXT_POST = """
LINKEDIN TEXT POST RUBRIC (score 0-10 per dimension):

- hook_strength (weight 20%, floor 8): Stops scroll in 3 seconds.
  10: Specific number / contrarian reframe / confession. Opens with I/If/Here's/Stop/Want/[Number].
  6: Generic opener. "Are you struggling..." or "In today's world..."

- voice_match (weight 25%, floor 8): Matches brand voice samples in Soul/Brand DNA.
  10: User would say "yes, this is exactly how I'd explain it." Sentence fragments OK.
  6: Reads like a generic LinkedIn ghostwriter. "Leverage", "synergize".

- specificity (weight 15%, floor 7): Real numbers, real names, real moments.
  10: "Last Tuesday I deployed 3 AI employees in 90 minutes."
  6: "I helped someone improve productivity recently."

- structure (weight 15%, floor 7): Hook + 5-12 numbered points + P.S. 1300-1500 chars.
  10: Format-perfect. Each point 10-18 words. P.S. included.
  6: Wall of text or wrong length.

- de_ai_score (weight 15%, floor 9): Zero banned words. ≤1 em dash per 200 words.
  10: Clean. No "Let's dive in", "Game-changer", "At the end of the day", "delve", "tapestry".
  6: Multiple AI tells.

- factual_integrity (weight 10%, floor 10, VETO): Every claim verifiable.
  10: Every number/name/event traceable to provided sources.
  0: Any invented stat or fabricated case study = automatic kill regardless of other scores.

- outlier_fit (weight 10%, floor 7): Pattern-matches top-quartile content for similar topic.
  10: Could plausibly be a top-25% post in this niche.
  6: Below-median performance pattern.
"""

RUBRIC_NEWSLETTER = """
NEWSLETTER RUBRIC (score 0-10 per dimension):

- subject_line (weight 15%, floor 8): ≤5 words, real number when possible.
- opening_hook (weight 15%, floor 8): Result/proof first OR bold claim OR personal story. NEVER "Hi [name]".
- voice_match (weight 25%, floor 8): Matches selected influencer tone (Hormozi/Brew/Clear/Bloom).
- single_cta (weight 10%, floor 9): Exactly 1 primary CTA. Max 2 total. P.S. included.
- body_structure (weight 15%, floor 7): Tone-appropriate length. One sentence per paragraph.
- de_ai_score (weight 15%, floor 9): No em dashes. No corporate sign-offs. No filler.
- factual_integrity (weight 5%, floor 10, VETO): No invented facts/dates/prices.
"""

RUBRIC_INSTAGRAM = """
INSTAGRAM POST RUBRIC (score 0-10 per dimension):

- hook_strength (weight 25%, floor 8): First line stops the scroll. Curiosity gap.
- voice_match (weight 25%, floor 8): Matches brand voice. Conversational.
- visual_brief (weight 15%, floor 7): Image prompt is specific (lens, lighting, composition).
- caption_structure (weight 15%, floor 7): Hook + body + CTA. Under 2200 chars.
- de_ai_score (weight 15%, floor 9): No AI tells. No em dashes. No "stunning", "breathtaking".
- factual_integrity (weight 5%, floor 10, VETO): No fabricated claims.
"""

RUBRIC_BLOG_POST = """
BLOG POST RUBRIC (score 0-10 per dimension):

- title_hook (weight 15%, floor 8): SEO-friendly + scroll-stopping.
- structure (weight 15%, floor 7): Sections, headers, scannable. 1500-2500 words.
- voice_match (weight 20%, floor 8): Matches brand voice across long-form.
- specificity (weight 15%, floor 8): Real examples, real numbers, real frameworks.
- seo_keywords (weight 10%, floor 7): Primary keyword density 0.5-1.5%. LSI variants present.
- de_ai_score (weight 15%, floor 9): No AI tells across full length.
- factual_integrity (weight 10%, floor 10, VETO): Every claim cited or marked as opinion.
"""

RUBRIC_LANDING_PAGE = """
LANDING PAGE RUBRIC (score 0-10 per dimension):

- hero_hook (weight 20%, floor 8): [Specific outcome] + [Timeframe] + [Without major objection].
- section_completeness (weight 15%, floor 8): All required sections present in correct order.
- conversion_psychology (weight 15%, floor 7): Pain bullets + named mechanism + offer stack + guarantee.
- voice_consistency (weight 15%, floor 8): Brand DNA consistent throughout. 2-4 highlighter accents per section max.
- asset_handling (weight 10%, floor 9): Real testimonials marked clearly. AI imagery only decorative.
- de_ai_score (weight 15%, floor 9): No filler. No AI clichés.
- factual_integrity (weight 10%, floor 10, VETO): No fabricated case studies / numbers.
"""

RUBRIC_BY_CONTENT_TYPE = {
    "linkedin_text_post": RUBRIC_LINKEDIN_TEXT_POST,
    "newsletter": RUBRIC_NEWSLETTER,
    "instagram": RUBRIC_INSTAGRAM,
    "blog_post": RUBRIC_BLOG_POST,
    "blog_writer": RUBRIC_BLOG_POST,
    "landing_page": RUBRIC_LANDING_PAGE,
}

# ============================================================
# SYSTEM PROMPT — the judge's role
# ============================================================

CREATIVE_REVIEW_SYSTEM_TEMPLATE = """You are the Chief Creative Director (Creative Review Director) for {brand_name}.

Your job: score the draft against the rubric and either pass it or send it back with surgical revision directives.

You are NOT the writer. You did not generate this. You are reviewing it as a senior reviewer who has watched 1000+ posts go viral and 1000+ posts flop.

{rubric}

OUTPUT FORMAT (return ONLY this JSON, no preamble, no markdown fences):
{{
  "scores": {{
    "<dimension_name>": <0-10 integer>,
    ...
  }},
  "weighted_total": <0.0-10.0 float, computed from rubric weights>,
  "verdict": "ship" | "revise" | "kill",
  "issues": ["specific issue 1", "specific issue 2"],
  "revision_directives": "If verdict=revise: exactly what the writer must change. Be surgical. Do not rewrite. Direct the writer."
}}

VERDICT RULES:
- "ship" = weighted_total >= 8.5 AND every dimension floor met
- "revise" = weighted_total < 8.5 OR any dimension below its floor (other than factual_integrity)
- "kill" = factual_integrity < 10 (any unverifiable claim against source data) — automatic regardless of other scores

REVISION DIRECTIVES RULES:
- Be specific. "Hook is generic" is not enough. Write: "Replace 'Are you struggling...' with a specific number or confession opener."
- Be surgical. Say what to change. Do not rewrite.
- Preserve voice. Do not direct the writer to change tone unless voice_match scored < 8.

YOU MUST USE A DIFFERENT MODEL THAN THE WRITER. The writer is on Sonnet / Opus.
You are on Haiku. Same-model judging inflates scores 5-15%. Cross-model is the only honest review.

{brand_dna_block}

{soul_file_block}

{outlier_corpus_block}
"""


# ============================================================
# Public API
# ============================================================

def _build_judge(
    content_type: str,
    brand_dna: Optional[dict] = None,
    soul_file: Optional[str] = None,
    outlier_corpus: Optional[str] = None,
    brand_name: str = "the user",
):
    """Build the Haiku judge model + system prompt for a given content type."""
    if content_type not in RUBRIC_BY_CONTENT_TYPE:
        content_type = "linkedin_text_post"

    rubric = RUBRIC_BY_CONTENT_TYPE[content_type]

    # CRITICAL: Haiku, NOT the model used to write the draft
    model = ChatAnthropic(
        model="claude-haiku-4-5-20250929",
        temperature=0.2,
        max_tokens=1500,
    )

    brand_dna_block = ""
    if brand_dna:
        brand_dna_block = (
            f"\nBRAND DNA (the voice/identity you're judging against):\n"
            f"{json.dumps(brand_dna, indent=2)}"
        )

    soul_file_block = ""
    if soul_file:
        soul_file_block = f"\nSOUL FILE (accumulated user voice samples):\n{soul_file}"

    outlier_corpus_block = ""
    if outlier_corpus:
        outlier_corpus_block = (
            f"\nTOP-QUARTILE EXAMPLES (the bar to clear — pattern-match against these):\n"
            f"{outlier_corpus}"
        )

    system = CREATIVE_REVIEW_SYSTEM_TEMPLATE.format(
        brand_name=brand_name,
        rubric=rubric,
        brand_dna_block=brand_dna_block,
        soul_file_block=soul_file_block,
        outlier_corpus_block=outlier_corpus_block,
    )

    return model, system


def review_draft(
    draft: str,
    content_type: str,
    brand_dna: Optional[dict] = None,
    soul_file: Optional[str] = None,
    outlier_corpus: Optional[str] = None,
    brand_name: str = "the user",
) -> dict:
    """
    Score a single draft via Haiku cross-model judge. Returns parsed verdict dict.

    Returns:
        {
            "scores": {dim: int, ...},
            "weighted_total": float,
            "verdict": "ship" | "revise" | "kill",
            "issues": [str, ...],
            "revision_directives": str,
            "draft": str,
        }
    """
    model, system = _build_judge(
        content_type=content_type,
        brand_dna=brand_dna,
        soul_file=soul_file,
        outlier_corpus=outlier_corpus,
        brand_name=brand_name,
    )

    response = model.invoke([
        SystemMessage(content=system),
        HumanMessage(content=f"Score this draft:\n\n{draft}"),
    ])

    raw = response.content if hasattr(response, "content") else str(response)

    # Strip code fences if Haiku wraps the JSON
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        # Defensive fallback — never let a parse error kill a request
        result = {
            "scores": {},
            "weighted_total": 0.0,
            "verdict": "revise",
            "issues": ["Judge returned unparseable JSON"],
            "revision_directives": "Resubmit — judge response was malformed.",
        }

    result["draft"] = draft
    return result
