import json
import os
from collections.abc import AsyncIterator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

load_dotenv()

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


async def _stream_claude_tokens(intent: str) -> AsyncIterator[str]:
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
    except Exception as exc:  # noqa: BLE001 — surface model/network errors to client stream
        yield _sse_token_line({"error": str(exc)})


@app.post("/api/chat")
async def chat(request: Request) -> StreamingResponse:
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

    return StreamingResponse(
        _stream_claude_tokens(intent.strip()),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
