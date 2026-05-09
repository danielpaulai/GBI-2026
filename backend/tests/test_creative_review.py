"""
Smoke test for the Creative Review judge.

Runs 5 fixture drafts at known quality levels through the judge and prints a
comparison table. Verifies the judge is calibrated correctly before plugging
into your real specialists.

Run from your Jarvis backend repo root:

    python -m backend.tests.test_creative_review

Expected behavior:
  ┌──────────────────────┬──────────┬──────────┬─────────────────┐
  │ Fixture              │ Expected │ Actual   │ Pass?           │
  ├──────────────────────┼──────────┼──────────┼─────────────────┤
  │ high_quality         │ ship     │ ship     │ ✓               │
  │ mediocre             │ revise   │ revise   │ ✓               │
  │ killed_fabrication   │ kill     │ kill     │ ✓ (veto)        │
  │ ai_slop              │ revise   │ revise   │ ✓ (low de_ai)   │
  │ newsletter_high      │ ship     │ ship     │ ✓               │
  └──────────────────────┴──────────┴──────────┴─────────────────┘

  All 5 calibrated correctly. Judge is ready to wire into the quality loop.

If any fixture's actual verdict does not match expected, see the troubleshooting
section at the bottom of this file.
"""

from __future__ import annotations
import os
import sys
import json
from pathlib import Path
from typing import Any

# Adjust import path to your repo layout
from agents.creative_review import review_draft

# ============================================================
# Brand DNA used for all fixtures (matches Daniel Paul / Purely Personal)
# ============================================================

TEST_BRAND_DNA = {
    "brand": "Purely Personal",
    "owner": "Daniel Paul",
    "palette": {
        "primary": "#ec4357",
        "background": "#0a0204",
        "accent_gold": "#fbbf24",
    },
    "voice": {
        "anchor_words": ["Tuesday", "deploy", "build", "ship"],
        "catchphrase": "Who builds the AI? I DO!",
        "banned_phrases": [
            "leverage", "synergize", "unlock potential", "in today's world",
            "delve", "tapestry", "navigate the landscape", "embark on a journey",
            "game-changer", "at the end of the day", "let's dive in",
            "in conclusion", "utilize", "paradigm", "optimize"
        ],
        "banned_openers": [
            "In today's", "Are you struggling", "Here's the thing",
            "Let's dive in", "Picture this", "Imagine"
        ],
        "em_dash_cap_per_200_words": 1,
        "tone": "punchy, hook-first, second-person, sentence fragments OK",
    }
}

TEST_SOUL_FILE = """
Daniel runs Purely Personal — an AI Employee training program for solo founders
and SME operators in Asia. He's based in Singapore. His brand is direct,
specific, numbers-driven. Anchor word: "Tuesday" (post-cohort future). Hates
corporate jargon. Loves declarations and identity-locked closes.

Sample posts that performed in top quartile:
- "I deployed 3 AI employees in 90 minutes. Here's how."
- "Poor people hire. Rich people deploy."
- "Last Tuesday I fired my $4K/month VA. The AI replaced her in 30 minutes."
""".strip()

# ============================================================
# Fixtures and expected outcomes
# ============================================================

FIXTURES = [
    {
        "name": "high_quality",
        "file": "linkedin_high_quality.txt",
        "content_type": "linkedin_text_post",
        "expected_verdict": "ship",
        "expected_min_score": 8.5,
        "notes": "Hook + numbered structure + P.S. + voice match + specifics. Should pass cleanly.",
    },
    {
        "name": "mediocre",
        "file": "linkedin_mediocre.txt",
        "content_type": "linkedin_text_post",
        "expected_verdict": "revise",
        "expected_max_score": 7.5,
        "notes": "Generic opener. Vague claims. Missing P.S. Should fail hook + specificity.",
    },
    {
        "name": "killed_fabrication",
        "file": "linkedin_killed_fabrication.txt",
        "content_type": "linkedin_text_post",
        "expected_verdict": "kill",
        "expected_max_score": 9.0,  # other dims may score high but factual veto kicks
        "notes": "Invented case study (Sarah Chen $847K, 14 AI agents, 12 deals at $70K). Factual integrity veto.",
    },
    {
        "name": "ai_slop",
        "file": "linkedin_ai_slop.txt",
        "content_type": "linkedin_text_post",
        "expected_verdict": "revise",
        "expected_max_score": 6.0,
        "notes": "Banned words everywhere. Em dashes spam. Hashtags. Should fail de_ai_score hard.",
    },
    {
        "name": "newsletter_high",
        "file": "newsletter_high_quality.txt",
        "content_type": "newsletter",
        "expected_verdict": "ship",
        "expected_min_score": 8.5,
        "notes": "Strong subject. Result-first opener. Single CTA. P.S. line. Daniel Paul Email Framework.",
    },
]

# ============================================================
# Test runner
# ============================================================

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def run_fixture(fixture: dict) -> dict:
    """Read fixture file, run through judge, return result + pass/fail."""
    fixture_path = FIXTURES_DIR / fixture["file"]
    if not fixture_path.exists():
        return {
            "name": fixture["name"],
            "error": f"Fixture file not found: {fixture_path}",
        }

    draft = fixture_path.read_text(encoding="utf-8").strip()

    # Run the judge
    result = review_draft(
        draft=draft,
        content_type=fixture["content_type"],
        brand_dna=TEST_BRAND_DNA,
        soul_file=TEST_SOUL_FILE,
        outlier_corpus=None,  # not testing outlier_fit dimension
        brand_name="Daniel Paul",
    )

    # Determine pass/fail
    actual_verdict = result.get("verdict", "unknown")
    actual_score = result.get("weighted_total", 0.0)
    expected_verdict = fixture["expected_verdict"]

    verdict_match = actual_verdict == expected_verdict

    score_match = True
    if "expected_min_score" in fixture:
        score_match = actual_score >= fixture["expected_min_score"]
    if "expected_max_score" in fixture:
        score_match = score_match and actual_score <= fixture["expected_max_score"]

    passed = verdict_match and score_match

    return {
        "name": fixture["name"],
        "expected_verdict": expected_verdict,
        "actual_verdict": actual_verdict,
        "actual_score": actual_score,
        "scores_breakdown": result.get("scores", {}),
        "issues": result.get("issues", []),
        "verdict_match": verdict_match,
        "score_match": score_match,
        "passed": passed,
        "notes": fixture["notes"],
    }


def print_table(results: list[dict]) -> None:
    """Pretty-print the comparison table."""
    print("\n" + "=" * 80)
    print("CREATIVE REVIEW JUDGE — CALIBRATION TEST RESULTS")
    print("=" * 80 + "\n")

    # Summary table
    print(f"{'Fixture':<22} {'Expected':<10} {'Actual':<10} {'Score':<8} {'Pass?':<10}")
    print("-" * 80)
    for r in results:
        if "error" in r:
            print(f"{r['name']:<22} ERROR: {r['error']}")
            continue
        passed_str = "✓ PASS" if r["passed"] else "✗ FAIL"
        print(
            f"{r['name']:<22} "
            f"{r['expected_verdict']:<10} "
            f"{r['actual_verdict']:<10} "
            f"{r['actual_score']:<8.2f} "
            f"{passed_str}"
        )

    # Detailed breakdown for failures
    failures = [r for r in results if not r.get("passed", False) and "error" not in r]
    if failures:
        print("\n" + "-" * 80)
        print("FAILURE DETAILS")
        print("-" * 80)
        for r in failures:
            print(f"\n[{r['name']}]")
            print(f"  Expected: {r['expected_verdict']}  |  Got: {r['actual_verdict']}  |  Score: {r['actual_score']:.2f}")
            print(f"  Notes: {r['notes']}")
            print("  Per-dimension scores:")
            for dim, score in r["scores_breakdown"].items():
                print(f"    - {dim:<20} {score}")
            print("  Issues identified:")
            for issue in r["issues"]:
                print(f"    - {issue}")

    # Final summary
    print("\n" + "=" * 80)
    total = len(results)
    passed = sum(1 for r in results if r.get("passed", False))
    print(f"RESULTS: {passed}/{total} fixtures calibrated correctly")
    if passed == total:
        print("✓ Judge is ready to wire into the quality loop.")
    else:
        print("✗ Judge calibration off. See troubleshooting at bottom of this file.")
    print("=" * 80 + "\n")


# ============================================================
# Main
# ============================================================

def main() -> int:
    """Returns exit code 0 if all fixtures pass, 1 otherwise."""
    print("Running 5 fixtures through the Creative Review judge...")
    print("(This makes 5 calls to Anthropic Haiku — cost ~$0.01 total)\n")

    results = []
    for fixture in FIXTURES:
        print(f"  • Scoring {fixture['name']}...", end="", flush=True)
        result = run_fixture(fixture)
        results.append(result)
        if "error" in result:
            print(" ERROR")
        else:
            mark = "✓" if result["passed"] else "✗"
            print(f" {mark} (score: {result['actual_score']:.2f}, verdict: {result['actual_verdict']})")

    print_table(results)

    all_passed = all(r.get("passed", False) for r in results)
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())


# ============================================================
# TROUBLESHOOTING — if calibration is off
# ============================================================
#
# 1. high_quality fixture scores BELOW 8.5 (verdict: revise)
#    - Judge is too harsh. Lower expected_min_score in fixture, or strengthen
#      brand_dna voice samples / soul_file context to give judge better baseline.
#
# 2. mediocre fixture scores ABOVE 7.5 (verdict: ship)
#    - Judge is too lenient. Likely missing rubric specificity. Check that
#      RUBRIC_LINKEDIN_TEXT_POST in creative_review.py specifies the floor for
#      hook_strength and specificity dimensions.
#
# 3. killed_fabrication fixture scores ANYTHING but "kill"
#    - The factual_integrity veto is not firing. Two possible causes:
#      (a) The judge isn't reading brand_dna / soul_file as the "source of truth"
#          to verify against — strengthen the system prompt's "factual_integrity
#          floor 10 VETO" language.
#      (b) Haiku is hallucinating verification. Try lowering temperature to 0.0.
#
# 4. ai_slop fixture scores ABOVE 6.0 (verdict: ship)
#    - The de_ai_score dimension is not catching banned words. Check that the
#      banned_phrases list in brand_dna is being passed AND that the rubric
#      specifies "≤1 em dash per 200 words" with floor 9.
#
# 5. newsletter_high fixture scores BELOW 8.5
#    - The newsletter rubric is too strict. Check RUBRIC_NEWSLETTER thresholds
#      vs the actual fixture content. Newsletters score differently than posts.
#
# 6. ALL fixtures fail with "Judge returned unparseable JSON"
#    - The model isn't returning clean JSON. Check creative_review.py's system
#      prompt — it should specify "return ONLY this JSON, no preamble, no
#      markdown fences". Also: verify model is claude-haiku-4-5-20250929 (some
#      older Haiku models are worse at structured output).
#
# 7. Scores wildly inconsistent run-to-run
#    - Temperature too high. Should be 0.2 in build_creative_review_agent.
#    - If still inconsistent: strengthen the rubric anchors with concrete
#      examples ("10 = 'I deployed 3 AI in 90 minutes' / 6 = 'AI is helpful'")
#
# 8. Judge takes >10 seconds per fixture
#    - Prompt cache TTL not set. In your env: ANTHROPIC_PROMPT_CACHE_TTL_HOURS=1
#    - Verify you're on Anthropic paid tier — free tier doesn't get 1-hour TTL.
