from pathlib import Path

_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


def load_prompt(stem: str) -> str:
    path = _PROMPTS_DIR / f"{stem}.md"
    return path.read_text(encoding="utf-8")
