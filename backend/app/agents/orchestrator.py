"""Routes a free-text prompt to the right specialized agent."""
from app.agents.base import BaseAgent
from app.agents.research_agent import ResearchAgent
from app.agents.builder_agent import BuilderAgent
from app.agents.analyst_agent import AnalystAgent
from app.agents.assistant_agent import AssistantAgent

_REGISTRY: dict[str, BaseAgent] = {
    "research": ResearchAgent(),
    "builder": BuilderAgent(),
    "analyst": AnalystAgent(),
    "assistant": AssistantAgent(),
}


def get_agent(key: str) -> BaseAgent:
    return _REGISTRY.get(key, _REGISTRY["assistant"])


def route(prompt: str) -> str:
    """Pick agent based on intent keywords. Cheap heuristic — replace with classifier later."""
    p = prompt.lower()
    if any(k in p for k in ("research", "market", "competitor", "trend", "study", "whitepaper", "sources", "investigate")):
        return "research"
    if any(k in p for k in ("code", "build", "implement", "api", "function", "component", "deploy", "sql", "script", "refactor", "fix bug")):
        return "builder"
    if any(k in p for k in ("data", "chart", "compare", "metric", "kpi", "forecast", "statistic", "spreadsheet", "csv", "analyze", "analyse")):
        return "analyst"
    return "assistant"
