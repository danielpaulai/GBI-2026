"""
Quality Loop — wraps any marketing specialist with a 5-stage flow:

    3 parallel drafts → Creative Review → if pass: ship → if fail: revise (max 2x) → escalate

Usage (standalone):
    from lib.quality_loop import run_quality_loop

    result = run_quality_loop(
        specialist_invoke_fn=my_agent_fn,
        task="Draft a LinkedIn post about AI employees",
        content_type="linkedin_text_post",
        brand_dna=brand_json_dict,
    )

LangGraph node usage (in jarvis_graph.py):
    from lib.quality_loop import make_quality_loop_node

    graph.add_node("instagram", make_quality_loop_node(
        specialist_name="instagram",
        specialist_builder=build_instagram_agent,
        content_type="instagram",
    ))
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Optional

from agents.creative_review import review_draft

# ============================================================
# Configuration
# ============================================================

QUALITY_FLOOR = 8.5
MAX_REVISIONS = 2
DRAFT_TEMPERATURES = [0.6, 0.8, 1.0]


# ============================================================
# Public API
# ============================================================

def run_quality_loop(
    specialist_invoke_fn: Callable[..., str],
    task: str,
    content_type: str,
    brand_dna: Optional[dict] = None,
    soul_file: Optional[str] = None,
    outlier_corpus: Optional[str] = None,
    brand_name: str = "the user",
) -> dict:
    """
    Run a specialist through the full quality loop.

    Returns:
        {
            "output": str,
            "metadata": dict,
            "iteration": int,
            "status": "shipped" | "below_floor" | "killed",
            "revisions_made": int,
        }
    """
    # Step 1: 3 parallel drafts at varied temperature
    drafts = _generate_parallel_drafts(specialist_invoke_fn, task)

    # Step 2: Score all 3 in parallel
    reviews = _review_all(
        drafts=drafts,
        content_type=content_type,
        brand_dna=brand_dna,
        soul_file=soul_file,
        outlier_corpus=outlier_corpus,
        brand_name=brand_name,
    )

    # Step 3: Pick best score
    best = max(reviews, key=lambda r: r["weighted_total"])

    # Step 4a: Ship if passes floor
    if best["verdict"] == "ship" and best["weighted_total"] >= QUALITY_FLOOR:
        return {
            "output": best["draft"],
            "metadata": best,
            "iteration": 0,
            "status": "shipped",
            "revisions_made": 0,
        }

    # Step 4b: Kill if factual integrity veto
    if best["verdict"] == "kill":
        return {
            "output": best["draft"],
            "metadata": best,
            "iteration": 0,
            "status": "killed",
            "revisions_made": 0,
        }

    # Step 5: Revision loop (max 2 rounds)
    current = best
    for revision_round in range(1, MAX_REVISIONS + 1):
        revised_draft = specialist_invoke_fn(
            task=_build_revision_task(task, current["draft"], current["revision_directives"]),
            temperature=0.7,
        )

        review = review_draft(
            draft=revised_draft,
            content_type=content_type,
            brand_dna=brand_dna,
            soul_file=soul_file,
            outlier_corpus=outlier_corpus,
            brand_name=brand_name,
        )

        if review["verdict"] == "ship" and review["weighted_total"] >= QUALITY_FLOOR:
            return {
                "output": revised_draft,
                "metadata": review,
                "iteration": revision_round,
                "status": "shipped",
                "revisions_made": revision_round,
            }

        if review["verdict"] == "kill":
            return {
                "output": revised_draft,
                "metadata": review,
                "iteration": revision_round,
                "status": "killed",
                "revisions_made": revision_round,
            }

        current = review

    # Step 6: Still below floor — escalate
    return {
        "output": current["draft"],
        "metadata": current,
        "iteration": MAX_REVISIONS,
        "status": "below_floor",
        "revisions_made": MAX_REVISIONS,
        "user_prompt": (
            f"This output scored {current['weighted_total']:.1f}/10 — below the 8.5 floor. "
            f"Issues: {', '.join(current['issues'])}. "
            f"Ship anyway, or rephrase the brief and try again?"
        ),
    }


def make_quality_loop_node(
    specialist_name: str,
    specialist_builder: Callable,
    content_type: str,
):
    """
    Returns a LangGraph node function that wraps a specialist with the quality loop.

    In jarvis_graph.py:
        graph.add_node("instagram", make_quality_loop_node(
            specialist_name="instagram",
            specialist_builder=build_instagram_agent,
            content_type="instagram",
        ))
    """
    def node(state: dict) -> dict:
        task = state.get("task") or state.get("intent") or state.get("user_message", "")
        brand_dna = state.get("brand_dna")
        soul_file = state.get("soul_file")
        outlier_corpus = state.get("outlier_corpus")
        brand_name = state.get("brand_name", "the user")

        specialist = specialist_builder(brand_dna=brand_dna, soul_file=soul_file)

        def specialist_invoke(task: str, temperature: float = 0.8, **_) -> str:
            response = specialist.invoke(
                {"messages": [{"role": "user", "content": task}]},
                config={"temperature": temperature},
            )
            if isinstance(response, dict):
                return response.get("output") or response.get("content") or str(response)
            return str(response)

        result = run_quality_loop(
            specialist_invoke_fn=specialist_invoke,
            task=task,
            content_type=content_type,
            brand_dna=brand_dna,
            soul_file=soul_file,
            outlier_corpus=outlier_corpus,
            brand_name=brand_name,
        )

        return {
            **state,
            "output": result["output"],
            "quality_metadata": result["metadata"],
            "quality_status": result["status"],
            "revisions_made": result["revisions_made"],
        }

    return node


# ============================================================
# Helpers
# ============================================================

def _generate_parallel_drafts(
    specialist_invoke_fn: Callable[..., str],
    task: str,
) -> list[str]:
    with ThreadPoolExecutor(max_workers=len(DRAFT_TEMPERATURES)) as executor:
        futures = [
            executor.submit(specialist_invoke_fn, task=task, temperature=temp)
            for temp in DRAFT_TEMPERATURES
        ]
        return [f.result() for f in futures]


def _review_all(
    drafts: list[str],
    content_type: str,
    brand_dna: Optional[dict],
    soul_file: Optional[str],
    outlier_corpus: Optional[str],
    brand_name: str,
) -> list[dict]:
    with ThreadPoolExecutor(max_workers=len(drafts)) as executor:
        futures = [
            executor.submit(
                review_draft,
                draft=draft,
                content_type=content_type,
                brand_dna=brand_dna,
                soul_file=soul_file,
                outlier_corpus=outlier_corpus,
                brand_name=brand_name,
            )
            for draft in drafts
        ]
        return [f.result() for f in futures]


def _build_revision_task(original_task: str, prev_draft: str, directives: str) -> str:
    return f"""REVISION TASK.

Your previous draft did not pass the quality bar. The Creative Review Director has given specific revision directives below.

Apply ONLY the changes directed. Do NOT rewrite the whole thing. Surgical edits only.

ORIGINAL BRIEF:
{original_task}

YOUR PREVIOUS DRAFT:
{prev_draft}

REVISION DIRECTIVES (apply these surgically):
{directives}

Return the revised draft only. Same format as before. No preamble."""
