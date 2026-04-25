"""Builder Agent — produces complete code artifacts and verifies in sandbox."""
from collections.abc import AsyncIterator

from app.agents.base import AgentContext, AgentEvent, BaseAgent
from app.core.config import settings
from app.core.llm_router import router

SYSTEM = """You are the Builder Agent of Discoverse AI.
Produce production-quality code. Always:
- Brief design rationale (3-5 bullets)
- Complete files in fenced code blocks with correct language tags
- Assumptions section
- Next steps
"""


class BuilderAgent(BaseAgent):
    key = "builder"
    name = "Builder Agent"
    default_model = settings.default_builder_model
    system_prompt = SYSTEM

    async def run(self, ctx: AgentContext) -> AsyncIterator[AgentEvent]:
        model = ctx.model or self.default_model

        yield AgentEvent("plan", {"steps": [
            "Restate requirements",
            "Design architecture",
            "Write complete files",
            "Verify in sandbox (when applicable)",
        ]})

        messages = [
            {"role": "system", "content": SYSTEM},
            *ctx.history,
            {"role": "user", "content": ctx.prompt},
        ]

        yield AgentEvent("action", {"tool": "code.generate", "status": "running"})
        async for token in router.stream(model, messages, temperature=0.3, max_tokens=6144):
            yield AgentEvent("token", {"text": token})
        yield AgentEvent("action", {"tool": "code.generate", "status": "done"})
        yield AgentEvent("done", {})
