from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent

from agents._prompts import load_prompt


def build_operations_agent(model: ChatAnthropic):
    return create_react_agent(
        model=model,
        tools=[],
        name="operations",
        prompt=load_prompt("operations_system"),
    )
