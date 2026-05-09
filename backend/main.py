import json
import logging
import os
import asyncio
from collections.abc import AsyncIterator
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
from pydantic import ValidationError

from agents import build_operations_agent, build_sales_agent

from jarvis_graph import (
    MARKETING_AGENT_BUILDERS,
    DepartmentKey,
    create_chat_model,
    get_jarvis_app,
    get_model_candidates,
    load_brand_dna,
    plan_route,
    provider_payload,
    remember_working_model,
    route_plan_payload,
    serialize_update_payload,
)
from executive_knowledge import executive_knowledge_context
from lib.quality_loop import run_quality_loop
from specialist_specs import SPECIALIST_SPECS, executive_key_for_department, format_output, schema_contract

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jarvis")

EXECUTIVE_TO_DEPARTMENT: dict[str, DepartmentKey] = {
    "cmo": "marketing",
    "cro": "sales",
    "coo": "operations",
    "cfo": "finance",
}

SPECIALIST_BUILDERS = {
    **MARKETING_AGENT_BUILDERS,
    "sales": build_sales_agent,
    "operations": build_operations_agent,
}

# Content-producing agents that run through the 3-draft quality loop.
# Maps agent_key → creative_review content_type rubric.
QUALITY_LOOP_AGENTS: dict[str, str] = {
    "content":                "linkedin_text_post",
    "brand_voice":            "linkedin_text_post",
    "linkedin_creator":       "linkedin_text_post",
    "instagram_creator":      "instagram",
    "tiktok_creator":         "instagram",
    "facebook_creator":       "instagram",
    "newsletter_writer":      "newsletter",
    "email_writer":           "newsletter",
    "email_sequence":         "newsletter",
    "blog_writer":            "blog_post",
    "landing_page":           "landing_page",
    "landing_page_architect": "landing_page",
}

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
        "https://gbi-2026.vercel.app",
        "https://frontend-one-smoky-36.vercel.app",
        *([os.environ["FRONTEND_URL"]] if os.environ.get("FRONTEND_URL") else []),
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


def _is_model_not_found_error(error: Exception) -> bool:
    message = str(error).lower()
    return "not_found_error" in message or ("model" in message and "not found" in message)


def _content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                text = block.get("text")
                if isinstance(text, str) and text.strip():
                    parts.append(text)
        return "\n".join(parts)
    return ""


def _extract_last_ai_text(payload: Any) -> str:
    if isinstance(payload, dict):
        messages = payload.get("messages")
        if isinstance(messages, list):
            for message in reversed(messages):
                if isinstance(message, BaseMessage) and message.__class__.__name__.startswith("AI"):
                    text = _content_to_text(message.content)
                    if text.strip():
                        return text.strip()
        for value in payload.values():
            nested = _extract_last_ai_text(value)
            if nested:
                return nested
    if isinstance(payload, list):
        for value in reversed(payload):
            nested = _extract_last_ai_text(value)
            if nested:
                return nested
    return ""


def _specialist_update(agent_key: str, text: str) -> str:
    payload = serialize_update_payload(
        {
            agent_key: {
                "messages": [
                    AIMessage(
                        content=text,
                        name=agent_key,
                    )
                ]
            }
        }
    )
    return _sse_token_line({"update": payload})


def _lifecycle_meta(agent_key: str, status: str, detail: str) -> str:
    return _sse_token_line({"meta": {"lifecycle": {"agent": agent_key, "status": status, "detail": detail}}})


def _validation_meta(agent_key: str, valid: bool, detail: str) -> str:
    return _sse_token_line({"meta": {"validation": {"agent": agent_key, "valid": valid, "detail": detail}}})


def _build_spec_prompt(intent: str, route: dict[str, Any], findings: dict[str, str], agent_key: str) -> str:
    spec = SPECIALIST_SPECS[agent_key]
    executive_context = executive_knowledge_context(route["department"])
    sections = [
        spec.base_prompt,
        f"User request: {intent}",
        f"Department: {route['department']}",
        f"Project type: {route['project_type']}",
        f"Execution mode: {route['mode']}",
        f"Current specialist: {agent_key} / {spec.label}",
        f"When to use: {spec.when_to_use}",
    ]
    if executive_context:
        sections.append(executive_context)
    if spec.required_findings:
        sections.append("Required upstream findings:")
        for key in spec.required_findings:
            value = findings.get(key)
            if value:
                sections.append(f"[{key}]\n{value[:2200]}")
    elif findings:
        sections.append("Available prior specialist findings:")
        for key, value in findings.items():
            sections.append(f"[{key}]\n{value[:1400]}")
    sections.append(schema_contract(spec.output_model))
    return "\n\n".join(sections)


def _extract_json_object(text: str) -> str | None:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if stripped.startswith("json"):
            stripped = stripped[4:].strip()
    start = stripped.find("{")
    end = stripped.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    return stripped[start : end + 1]


async def _validate_specialist_output(agent_key: str, raw_text: str, worker) -> tuple[str, bool, str]:
    spec = SPECIALIST_SPECS[agent_key]
    candidate = _extract_json_object(raw_text)
    errors: list[str] = []

    for attempt in range(2):
        try:
            if not candidate:
                raise ValueError("No JSON object found in specialist output.")
            parsed = spec.output_model.model_validate_json(candidate)
            return format_output(spec, parsed), True, f"Validated against {spec.output_model.__name__}."
        except (ValidationError, ValueError, json.JSONDecodeError) as exc:
            errors.append(str(exc))
            if attempt == 0:
                repair_prompt = (
                    f"Rewrite the following into valid JSON only for schema {spec.output_model.__name__}.\n\n"
                    f"Schema contract:\n{schema_contract(spec.output_model)}\n\n"
                    f"Original output:\n{raw_text}"
                )
                repaired = await worker.ainvoke([HumanMessage(content=repair_prompt)])
                raw_text = _content_to_text(repaired.content).strip()
                candidate = _extract_json_object(raw_text)
                continue

    fallback = raw_text.strip() or f"{agent_key} returned no output."
    return fallback[:5000], False, "; ".join(errors)


async def _run_specialist(agent_key: str, intent: str, route_payload: dict[str, Any], findings: dict[str, str], worker):
    spec = SPECIALIST_SPECS[agent_key]
    prompt = _build_spec_prompt(intent, route_payload, findings, agent_key)

    if spec.builder_name and spec.builder_name in SPECIALIST_BUILDERS and agent_key in QUALITY_LOOP_AGENTS:
        # Content-producing agent: 3 parallel drafts → judge → revise (max 2x)
        content_type = QUALITY_LOOP_AGENTS[agent_key]
        brand_dna = load_brand_dna()
        specialist = SPECIALIST_BUILDERS[spec.builder_name](worker)

        def _invoke_fn(task: str, temperature: float = 0.8, **_) -> str:
            result = specialist.invoke({"messages": [HumanMessage(content=task)]})
            return _extract_last_ai_text(result).strip() or task

        loop_result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: run_quality_loop(
                _invoke_fn,
                prompt,
                content_type,
                brand_dna=brand_dna,
                brand_name=brand_dna.get("owner", "the user"),
            ),
        )
        raw_text = loop_result["output"]
        quality_note = (
            f"quality_loop: {loop_result['status']} | "
            f"score={loop_result['metadata'].get('weighted_total', '?'):.2f} | "
            f"revisions={loop_result['revisions_made']}"
        )
        if not raw_text:
            raw_text = f"{agent_key} returned no structured output."
        text, valid, validation_detail = await _validate_specialist_output(agent_key, raw_text, worker)
        return text, valid, f"{quality_note} | {validation_detail}"

    elif spec.builder_name and spec.builder_name in SPECIALIST_BUILDERS:
        specialist = SPECIALIST_BUILDERS[spec.builder_name](worker)
        result = await specialist.ainvoke({"messages": [HumanMessage(content=prompt)]})
        raw_text = _extract_last_ai_text(result).strip()
    else:
        result = await worker.ainvoke([HumanMessage(content=prompt)])
        raw_text = _content_to_text(result.content).strip()

    if not raw_text:
        raw_text = f"{agent_key} returned no structured output."

    return await _validate_specialist_output(agent_key, raw_text, worker)


def _synthesis_prompt(intent: str, route: dict[str, Any], findings: dict[str, str]) -> str:
    executive_context = executive_knowledge_context(route["department"])
    sections = [
        f"You are {executive_key_for_department(route['department']).upper()} inside Jarvis. Synthesize the specialist outputs into one coherent executive answer.",
        f"User request: {intent}",
        f"Department: {route['department']}",
        f"Project type: {route['project_type']}",
        f"Execution mode: {route['mode']}",
        f"Selected specialists: {', '.join(route['selected_agents'])}",
        "Requirements:",
        "- Start with the clearest recommendation or strategic direction.",
        "- If research is present, summarize the research first.",
        "- If channel creators are present, include channel-specific deliverables under clear headings.",
        "- Keep it structured, paste-ready, and commercially useful.",
        "Specialist outputs:",
    ]
    if executive_context:
        sections.insert(5, executive_context)
    for key, value in findings.items():
        sections.append(f"## {key}\n{value}")
    return "\n\n".join(sections)


async def _stream_specialist_route(intent: str, model_candidate, route) -> AsyncIterator[str]:
    route_payload = route_plan_payload(route)
    worker = create_chat_model(model_candidate, temperature=0.4, max_tokens=4096)
    findings: dict[str, str] = {}

    await worker.ainvoke([HumanMessage(content="Reply with READY.")])

    yield _sse_token_line({"meta": {"route": route_payload, "provider": provider_payload(model_candidate)}})

    for agent_key in route.selected_agents:
        yield _lifecycle_meta(agent_key, "queued", f"{agent_key} queued for {route.project_type}.")

    for agent_key in route.selected_agents:
        yield _lifecycle_meta(agent_key, "active", f"{agent_key} is now executing.")
        try:
            text, valid, validation_detail = await _run_specialist(agent_key, intent, route_payload, findings, worker)
            findings[agent_key] = text
            yield _validation_meta(agent_key, valid, validation_detail)
            yield _specialist_update(agent_key, text)
            yield _lifecycle_meta(
                agent_key,
                "synthesized" if valid else "error",
                f"{agent_key} completed and returned validated output." if valid else f"{agent_key} failed validation: {validation_detail}",
            )
        except Exception as exc:  # noqa: BLE001
            findings[agent_key] = f"Execution error: {exc}"
            yield _lifecycle_meta(agent_key, "error", f"{agent_key} failed: {exc}")

    synthesis_prompt = _synthesis_prompt(intent, route_payload, findings)
    synthesis = await worker.ainvoke([HumanMessage(content=synthesis_prompt)])
    final_text = _content_to_text(synthesis.content).strip()
    if not final_text:
        final_text = "The executive lane completed the selected specialist run, but no final synthesis was produced."
    yield _specialist_update(executive_key_for_department(route.department), final_text)


async def _parse_intent_async(request: Request) -> tuple[str, str | None]:
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
    executive = raw.get("executive")
    if executive is not None and (not isinstance(executive, str) or executive not in EXECUTIVE_TO_DEPARTMENT):
        raise HTTPException(status_code=400, detail='Optional field "executive" must be one of cmo, cro, coo, cfo.')
    return intent.strip(), executive


async def _stream_claude_tokens(intent: str) -> AsyncIterator[str]:
    """Day-1 style direct token stream (single model, no supervisor)."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        yield _sse_token_line(
            {"error": "ANTHROPIC_API_KEY is not set. Copy backend/.env.example to backend/.env."}
        )
        return

    last_error: Exception | None = None

    for model_candidate in get_model_candidates():
        llm = create_chat_model(
            model_candidate,
            temperature=0.7,
            max_tokens=4096,
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
            remember_working_model(model_candidate)
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if _is_model_not_found_error(exc):
                continue
            yield _sse_token_line({"error": str(exc)})
            return

    yield _sse_token_line({"error": str(last_error) if last_error else "No compatible Anthropic model available."})


async def _stream_supervisor_updates(intent: str, executive: str | None = None) -> AsyncIterator[str]:
    """Day 2: LangGraph supervisor + departments, SSE with stream_mode=updates."""
    if not os.getenv("ANTHROPIC_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        yield _sse_token_line(
            {"error": "No model provider is configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY in backend/.env."}
        )
        return

    last_error: Exception | None = None
    forced_department = EXECUTIVE_TO_DEPARTMENT.get(executive) if executive else None
    route_plan = plan_route(intent, forced_department=forced_department)

    if route_plan.department in {"marketing", "sales", "operations", "finance"}:
        yield _sse_token_line({"meta": {"route": route_plan_payload(route_plan)}})

    for model_candidate in get_model_candidates():
        try:
            if route_plan.department in {"marketing", "sales", "operations", "finance"}:
                async for event in _stream_specialist_route(intent, model_candidate, route_plan):
                    yield event
            else:
                graph = get_jarvis_app(intent, model_candidate=model_candidate)
                sent_meta = False
                async for chunk in graph.astream(
                    {"messages": [HumanMessage(content=intent)]},
                    stream_mode="updates",
                ):
                    if not sent_meta:
                        yield _sse_token_line(
                            {"meta": {"route": route_plan_payload(route_plan), "provider": provider_payload(model_candidate)}}
                        )
                        sent_meta = True
                    yield _sse_token_line({"update": serialize_update_payload(chunk)})
            remember_working_model(model_candidate)
            yield _sse_token_line({"done": True})
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if _is_model_not_found_error(exc):
                logger.warning(
                    "Primary model unavailable, retrying with fallback",
                    extra={"provider": model_candidate.provider, "model_id": model_candidate.model},
                )
                continue
            yield _sse_token_line({"error": str(exc)})
            return

    yield _sse_token_line({"error": str(last_error) if last_error else "No compatible Anthropic model available."})


def _sse_headers() -> dict[str, str]:
    return {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }


@app.post("/api/run")
async def run(request: Request) -> StreamingResponse:
    intent, executive = await _parse_intent_async(request)
    return StreamingResponse(
        _stream_supervisor_updates(intent, executive),
        media_type="text/event-stream",
        headers=_sse_headers(),
    )


@app.post("/api/chat")
async def chat(request: Request) -> StreamingResponse:
    """Legacy Day-1 stream (single LLM). Prefer `/api/run` for Jarvis supervisor."""
    intent, _ = await _parse_intent_async(request)
    return StreamingResponse(
        _stream_claude_tokens(intent),
        media_type="text/event-stream",
        headers=_sse_headers(),
    )
