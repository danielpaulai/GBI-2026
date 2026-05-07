"""LangGraph supervisor (CEO) + Marketing, Sales, Operations agents."""

from __future__ import annotations

import os
from typing import Any

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import BaseMessage, SystemMessage
from langgraph_supervisor import create_supervisor

from agents import build_marketing_agent, build_operations_agent, build_sales_agent
from agents._prompts import load_prompt

_JARVIS_APP = None

MODEL_ID = "claude-sonnet-4-5-20250929"


def _worker_model() -> ChatAnthropic:
    return ChatAnthropic(
        model=MODEL_ID,
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        temperature=0.6,
        max_tokens=4096,
    )


def _supervisor_model() -> ChatAnthropic:
    return ChatAnthropic(
        model=MODEL_ID,
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        temperature=0.3,
        max_tokens=4096,
    )


def _ceo_system_message() -> SystemMessage:
    body = load_prompt("ceo_system").strip()
    return SystemMessage(
        content=[
            {
                "type": "text",
                "text": body,
                "cache_control": {"type": "ephemeral"},
            }
        ]
    )


def build_jarvis_app():
    """Compile the supervisor graph (call once per process)."""
    worker = _worker_model()
    marketing = build_marketing_agent(worker)
    sales = build_sales_agent(worker)
    operations = build_operations_agent(worker)

    supervisor_llm = _supervisor_model()
    workflow = create_supervisor(
        [marketing, sales, operations],
        model=supervisor_llm,
        prompt=_ceo_system_message(),
        include_agent_name="inline",
        parallel_tool_calls=False,
        supervisor_name="ceo",
    )
    return workflow.compile()


def get_jarvis_app():
    global _JARVIS_APP
    if _JARVIS_APP is None:
        _JARVIS_APP = build_jarvis_app()
    return _JARVIS_APP


def reset_jarvis_app_for_tests() -> None:
    global _JARVIS_APP
    _JARVIS_APP = None


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
