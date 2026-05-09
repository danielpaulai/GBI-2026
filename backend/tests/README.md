# Test Fixtures · Creative Review Calibration

5 fixture drafts at known quality levels + a test runner. Use these to verify the judge is calibrated correctly **before** wiring it into your real specialists.

## What's in this folder

```
tests/
├── README.md                              ← this file
├── test_creative_review.py                ← run this
└── fixtures/
    ├── linkedin_high_quality.txt          (expected: ship, ≥8.5)
    ├── linkedin_mediocre.txt              (expected: revise, ≤7.5)
    ├── linkedin_killed_fabrication.txt    (expected: kill — invented stats)
    ├── linkedin_ai_slop.txt               (expected: revise, ≤6.0 — banned words)
    └── newsletter_high_quality.txt        (expected: ship, ≥8.5)
```

## How to use

### 1. Drop the folder into your Jarvis backend repo

```
your-jarvis-backend/
├── backend/
│   ├── agents/
│   │   └── creative_review.py     ← the judge
│   └── tests/                      ← this folder goes here
│       ├── test_creative_review.py
│       └── fixtures/
│           └── *.txt
```

### 2. Run the test

From your Jarvis backend repo root:

```bash
python -m backend.tests.test_creative_review
```

Cost: ~$0.01 total (5 calls to Haiku 4.5). Takes ~30 seconds.

### 3. Read the output

You'll see something like:

```
  • Scoring high_quality... ✓ (score: 9.10, verdict: ship)
  • Scoring mediocre... ✓ (score: 6.40, verdict: revise)
  • Scoring killed_fabrication... ✓ (score: 4.20, verdict: kill)
  • Scoring ai_slop... ✓ (score: 4.80, verdict: revise)
  • Scoring newsletter_high... ✓ (score: 8.90, verdict: ship)

================================================================================
CREATIVE REVIEW JUDGE — CALIBRATION TEST RESULTS
================================================================================

Fixture                Expected   Actual     Score    Pass?
--------------------------------------------------------------------------------
high_quality           ship       ship       9.10     ✓ PASS
mediocre               revise     revise     6.40     ✓ PASS
killed_fabrication     kill       kill       4.20     ✓ PASS
ai_slop                revise     revise     4.80     ✓ PASS
newsletter_high        ship       ship       8.90     ✓ PASS

================================================================================
RESULTS: 5/5 fixtures calibrated correctly
✓ Judge is ready to wire into the quality loop.
================================================================================
```

If you see this — **the judge is working. Wire it into your specialists.**

### 4. If a fixture fails

The test runner prints failure details with per-dimension scores and the judge's flagged issues. The end of `test_creative_review.py` has a troubleshooting section covering the 8 most common calibration issues.

The most common problem: **the judge is too lenient on `mediocre` or `ai_slop` fixtures**. This means the rubric thresholds in `creative_review.py` need tightening for the dimension that's failing.

## Why these specific fixtures

Each fixture is engineered to test ONE specific failure mode:

| Fixture | Tests | Why |
|---|---|---|
| `linkedin_high_quality` | The "ship" path | Without a clear pass case the judge could just kill everything |
| `linkedin_mediocre` | Hook + specificity dimensions | Most common real-world failure mode — vague generic content |
| `linkedin_killed_fabrication` | The factual_integrity VETO | Most damaging failure — invented testimonials destroy brand |
| `linkedin_ai_slop` | The de_ai_score dimension | Most measurable failure — banned words + em dashes are detectable |
| `newsletter_high_quality` | Cross-content-type rubric switching | Verifies the rubric selection logic works for content types beyond LinkedIn |

## When to re-run these tests

- **Before** you wire the judge into your specialists (Day 1 of the integration)
- **After** any change to `creative_review.py` rubrics
- **After** any change to your `brand.json`
- **Whenever** judge output starts feeling off in production
- **Weekly** in CI to catch regressions from Anthropic model updates

## Adding your own fixtures

The format is flat: drop a `.txt` file in `fixtures/` with the draft content. Then add an entry to `FIXTURES` in `test_creative_review.py`:

```python
{
    "name": "your_fixture_name",
    "file": "your_fixture_file.txt",
    "content_type": "linkedin_text_post",  # or newsletter / instagram / blog_post / landing_page
    "expected_verdict": "ship",  # or revise / kill
    "expected_min_score": 8.5,   # optional
    "expected_max_score": 9.5,   # optional
    "notes": "What this fixture is testing.",
},
```

## Recommended additions over time

Once the 5 base fixtures pass, add more:

- **Real outputs from your current Jarvis** that you've manually rated 3/10, 6/10, 9/10 — verify the judge agrees
- **Edge cases:** very short posts, very long posts, posts with mixed language, posts with technical jargon
- **Voice drift cases:** posts that score high on most dimensions but fail voice_match
- **Outlier_fit cases:** once Outlier Detector is wired, fixtures that test top-quartile pattern matching
