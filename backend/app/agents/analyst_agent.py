"""Analyst Agent — structured data analysis with optional charts."""
from collections.abc import AsyncIterator

from app.agents.base import AgentContext, AgentEvent, BaseAgent
from app.core.config import settings
from app.core.llm_router import router

SYSTEM = """You are the Analyst Agent of Discoverse AI.
Structure every reply as: Question, Approach, Analysis, Findings, Recommendation.
Use markdown tables when comparing options. Quantify when possible.
"""


class AnalystAgent(BaseAgent):
    key = "analyst"
    name = "Analyst Agent"
    default_model = settings.default_analyst_model
    system_prompt = SYSTEM

    async def run(self, ctx: AgentContext) -> AsyncIterator[AgentEvent]:
        model = ctx.model or self.default_model
        yield AgentEvent("plan", {"steps": [
            "Frame the question",
            "Identify metrics & data needed",
            "Run analysis",
            "Summarize findings & recommendation",
        ]})
        messages = [
            {"role": "system", "content": SYSTEM},
            *ctx.history,
            {"role": "user", "content": ctx.prompt},
        ]
        yield AgentEvent("action", {"tool": "analysis.compute", "status": "running"})
        async for token in router.stream(model, messages, temperature=0.4, max_tokens=4096):
            yield AgentEvent("token", {"text": token})
        yield AgentEvent("action", {"tool": "analysis.compute", "status": "done"})
        yield AgentEvent("done", {})
