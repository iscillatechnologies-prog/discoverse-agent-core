"""Research Agent — plan, browse, synthesize, cite."""
from collections.abc import AsyncIterator

from app.agents.base import AgentContext, AgentEvent, BaseAgent
from app.core.config import settings
from app.core.llm_router import router
from app.tools.web_research import search_and_extract


SYSTEM = """You are the Research Agent of Discoverse AI by Rhinoes Innovation Labs.
Synthesize the provided web sources into a structured report with these sections:
1. Overview
2. Key Findings
3. Details
4. Sources (with URLs)
5. Next Steps
Be concise and cite source numbers like [1], [2] inline.
"""


class ResearchAgent(BaseAgent):
    key = "research"
    name = "Research Agent"
    default_model = settings.default_research_model
    system_prompt = SYSTEM

    async def run(self, ctx: AgentContext) -> AsyncIterator[AgentEvent]:
        model = ctx.model or self.default_model

        yield AgentEvent("plan", {"steps": [
            "Decompose research question",
            "Search the web",
            "Extract & rank sources",
            "Synthesize structured report",
        ]})

        yield AgentEvent("action", {"tool": "web.search", "status": "running", "query": ctx.prompt})
        sources = await search_and_extract(ctx.prompt, max_results=5)
        yield AgentEvent("action", {"tool": "web.search", "status": "done", "count": len(sources)})

        sources_block = "\n\n".join(
            f"[{i+1}] {s['title']} — {s['url']}\n{s['snippet']}"
            for i, s in enumerate(sources)
        ) or "(no sources retrieved)"

        messages = [
            {"role": "system", "content": SYSTEM},
            *ctx.history,
            {"role": "user", "content": f"Research goal: {ctx.prompt}\n\nSources:\n{sources_block}"},
        ]

        async for token in router.stream(model, messages, temperature=0.4, max_tokens=4096):
            yield AgentEvent("token", {"text": token})

        yield AgentEvent("done", {"sources": sources})
