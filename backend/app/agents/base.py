"""Base agent contract — Plan → Execute → Verify → Improve loop."""
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentContext:
    user_id: str
    conversation_id: str
    prompt: str
    history: list[dict[str, str]] = field(default_factory=list)
    memories: list[str] = field(default_factory=list)
    model: str | None = None


@dataclass
class AgentEvent:
    """A single SSE event emitted by an agent."""
    type: str   # "plan" | "action" | "token" | "artifact" | "memory" | "done" | "error"
    data: dict[str, Any]


class BaseAgent(ABC):
    key: str
    name: str
    default_model: str
    system_prompt: str

    @abstractmethod
    async def run(self, ctx: AgentContext) -> AsyncIterator[AgentEvent]:
        """Execute the agent loop, yielding events for SSE."""
        if False:  # pragma: no cover
            yield  # type: ignore
