import json
import logging
import os
from collections.abc import AsyncIterator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

from jarvis_graph import get_jarvis_app, serialize_update_payload

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jarvis")

if os.getenv("LANGCHAIN_TRACING_V2", "").lower() in ("1", "true", "yes") and not os.getenv(
    "LANGCHAIN_API_KEY"
):
    logger.warning(
        "LANGCHAIN_TRACING_V2 is enabled but LANGCHAIN_API_KEY is missing; "
        "LangSmith traces will not upload. Unset LANGCHAIN_TRACING_V2 or add the key."
    )

app = FastAPI(title="10X Command Center API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def _sse_token_line(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def _parse_intent_async(request: Request) -> str:
    try:
        raw = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body") from None

    if not isinstance(raw, dict):
        raise HTTPException(status_code=400, detail="Body must be a JSON object")

    intent = raw.get("intent")
    if not isinstance(intent, str) or not intent.strip():
        raise HTTPException(
            status_code=400,
            detail='Body must be JSON with a non-empty string field "intent".',
        )
    return intent.strip()


async def _stream_claude_tokens(intent: str) -> AsyncIterator[str]:
    """Day-1 style direct token stream (single model, no supervisor)."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        yield _sse_token_line(
            {"error": "ANTHROPIC_API_KEY is not set. Copy backend/.env.example to backend/.env."}
        )
        return

    llm = ChatAnthropic(
        model="claude-sonnet-4-5-20250929",
        streaming=True,
        temperature=0.7,
        api_key=api_key,
    )

    try:
        async for chunk in llm.astream([HumanMessage(content=intent)]):
            text = chunk.content
            if isinstance(text, str) and text:
                yield _sse_token_line({"token": text})
            elif isinstance(text, list):
                for part in text:
                    if isinstance(part, dict) and part.get("type") == "text":
                        t = part.get("text", "")
                        if t:
                            yield _sse_token_line({"token": t})
    except Exception as exc:  # noqa: BLE001
        yield _sse_token_line({"error": str(exc)})


async def _stream_supervisor_updates(intent: str) -> AsyncIterator[str]:
    """Day 2: LangGraph supervisor + departments, SSE with stream_mode=updates."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        yield _sse_token_line(
            {"error": "ANTHROPIC_API_KEY is not set. Copy backend/.env.example to backend/.env."}
        )
        return

    graph = get_jarvis_app()
    try:
        async for chunk in graph.astream(
            {"messages": [HumanMessage(content=intent)]},
            stream_mode="updates",
        ):
            yield _sse_token_line({"update": serialize_update_payload(chunk)})
        yield _sse_token_line({"done": True})
    except Exception as exc:  # noqa: BLE001
        yield _sse_token_line({"error": str(exc)})


def _sse_headers() -> dict[str, str]:
    return {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }


@app.post("/api/run")
async def run(request: Request) -> StreamingResponse:
    intent = await _parse_intent_async(request)
    return StreamingResponse(
        _stream_supervisor_updates(intent),
        media_type="text/event-stream",
        headers=_sse_headers(),
    )


@app.post("/api/chat")
async def chat(request: Request) -> StreamingResponse:
    """Legacy Day-1 stream (single LLM). Prefer `/api/run` for Jarvis supervisor."""
    intent = await _parse_intent_async(request)
    return StreamingResponse(
        _stream_claude_tokens(intent),
        media_type="text/event-stream",
        headers=_sse_headers(),
    )
