"""SSE streaming chat endpoint — the heart of Discoverse AI."""
import json
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.agents.base import AgentContext
from app.agents.orchestrator import get_agent, route
from app.core.db import get_session
from app.core.security import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.tools.vector_memory import recall, remember

router = APIRouter()


class ChatRequest(BaseModel):
    conversation_id: UUID | None = None
    prompt: str
    agent: str = "auto"
    model: str | None = None


@router.post("/stream")
async def stream_chat(
    body: ChatRequest,
    user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    user_id = user["id"]
    agent_key = body.agent if body.agent != "auto" else route(body.prompt)
    agent = get_agent(agent_key)

    # Ensure conversation
    if body.conversation_id:
        conv = await session.get(Conversation, body.conversation_id)
        if conv is None or conv.user_id != user_id:
            conv = Conversation(user_id=user_id, agent=agent_key, model=body.model, title=body.prompt[:60])
            session.add(conv)
            await session.commit()
            await session.refresh(conv)
    else:
        conv = Conversation(user_id=user_id, agent=agent_key, model=body.model, title=body.prompt[:60])
        session.add(conv)
        await session.commit()
        await session.refresh(conv)

    # Build history
    rows = (await session.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at)
    )).scalars().all()
    history = [{"role": m.role, "content": m.content} for m in rows]

    # User msg persistence
    user_msg = Message(conversation_id=conv.id, user_id=user_id, role="user", content=body.prompt)
    session.add(user_msg)
    await session.commit()

    memories = await recall(user_id, body.prompt)
    ctx = AgentContext(
        user_id=user_id,
        conversation_id=str(conv.id),
        prompt=body.prompt,
        history=history,
        memories=memories,
        model=body.model,
    )

    async def event_stream():
        full = []
        meta: dict[str, Any] = {"agent": agent_key, "model": ctx.model or agent.default_model, "conversation_id": str(conv.id)}
        yield {"event": "meta", "data": json.dumps(meta)}
        try:
            async for ev in agent.run(ctx):
                if ev.type == "token":
                    full.append(ev.data["text"])
                yield {"event": ev.type, "data": json.dumps(ev.data)}
        except Exception as e:  # noqa: BLE001
            yield {"event": "error", "data": json.dumps({"message": str(e)})}
            return

        # Persist assistant reply
        assistant_text = "".join(full)
        msg = Message(
            conversation_id=conv.id, user_id=user_id, role="assistant",
            content=assistant_text, agent=agent_key, model=meta["model"],
        )
        session.add(msg)
        await session.commit()
        await remember(user_id, f"User asked: {body.prompt[:200]}")
        yield {"event": "complete", "data": json.dumps({"conversation_id": str(conv.id)})}

    return EventSourceResponse(event_stream())
