EXECUTIVE_KNOWLEDGE_BASES: dict[str, dict[str, object]] = {
    "marketing": {
        "overview": "CMO owns positioning, demand creation, channel strategy, landing-page conversion, narrative systems, audience research, and campaign execution.",
        "frequent_questions": [
            "How should this offer be positioned so it is easier to buy?",
            "Which channels and assets should we launch first?",
            "What should the landing page, email sequence, and social posts look like?",
            "What proof and objections matter most for this audience?",
        ],
        "decision_rules": [
            "Prefer source-backed claims and explicit customer pains over generic copy.",
            "Use channel specialists for execution instead of one generic writer.",
            "Use research tools when claims depend on public market or competitor data.",
        ],
    },
    "sales": {
        "overview": "CRO owns pipeline quality, objection handling, follow-up systems, revenue velocity, and close-rate improvement.",
        "frequent_questions": [
            "Where is pipeline leaking and how do we fix it?",
            "What rebuttals and proof points unlock stuck deals?",
            "What follow-up sequence moves warm leads into the next step?",
        ],
        "decision_rules": [
            "Prefer proof-backed rebuttals and clear next-step asks.",
            "Sequence follow-up across channels instead of relying on one message.",
        ],
    },
    "operations": {
        "overview": "COO owns priorities, process design, operating cadence, owners, and execution reliability.",
        "frequent_questions": [
            "What should the team focus on this week?",
            "Which process is breaking and how should it be redesigned?",
            "What meeting rhythm and scorecard keeps execution aligned?",
        ],
        "decision_rules": [
            "Prefer repeatable systems, explicit owners, and clear escalation rules.",
        ],
    },
    "finance": {
        "overview": "CFO owns cash protection, pricing guardrails, margin logic, scenarios, and downside control.",
        "frequent_questions": [
            "How do we protect cash while we grow?",
            "What pricing structure improves margin without hurting conversion?",
            "What are the best-case, base-case, and downside scenarios?",
        ],
        "decision_rules": [
            "Prefer downside protection, simple assumptions, and explicit decision points.",
        ],
    },
}


def executive_knowledge_context(department: str) -> str:
    knowledge = EXECUTIVE_KNOWLEDGE_BASES.get(department)
    if not knowledge:
        return ""

    lines = [f"Executive knowledge base: {knowledge.get('overview', '')}"]

    frequent_questions = knowledge.get("frequent_questions") or []
    if frequent_questions:
        lines.append("Common questions this executive handles:")
        lines.extend(f"- {question}" for question in frequent_questions)

    decision_rules = knowledge.get("decision_rules") or []
    if decision_rules:
        lines.append("Decision rules:")
        lines.extend(f"- {rule}" for rule in decision_rules)

    return "\n".join(lines)