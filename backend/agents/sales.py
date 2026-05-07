from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent

from agents._prompts import load_prompt


def build_sales_agent(model: ChatAnthropic):
    return create_react_agent(
        model=model,
        tools=[],
        name="sales",
        prompt=load_prompt("sales_system"),
    )
