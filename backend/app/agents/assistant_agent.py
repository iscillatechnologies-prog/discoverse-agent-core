"""Personal Assistant — general purpose conversational agent."""
from collections.abc import AsyncIterator

from app.agents.base import AgentContext, AgentEvent, BaseAgent
from app.core.config import settings
from app.core.llm_router import router

SYSTEM = """You are the Personal Assistant of Discoverse AI.
Handle general requests warmly and efficiently — drafting messages, planning, summarizing.
Be friendly and direct.
"""


class AssistantAgent(BaseAgent):
    key = "assistant"
    name = "Personal Assistant"
    default_model = settings.default_assistant_model
    system_prompt = SYSTEM

    async def run(self, ctx: AgentContext) -> AsyncIterator[AgentEvent]:
        model = ctx.model or self.default_model
        memory_block = ""
        if ctx.memories:
            memory_block = "\n\nRelevant memories:\n" + "\n".join(f"- {m}" for m in ctx.memories[:5])

        messages = [
            {"role": "system", "content": SYSTEM + memory_block},
            *ctx.history,
            {"role": "user", "content": ctx.prompt},
        ]
        yield AgentEvent("action", {"tool": "assistant.respond", "status": "running"})
        async for token in router.stream(model, messages, temperature=0.7, max_tokens=2048):
            yield AgentEvent("token", {"text": token})
        yield AgentEvent("action", {"tool": "assistant.respond", "status": "done"})
        yield AgentEvent("done", {})
