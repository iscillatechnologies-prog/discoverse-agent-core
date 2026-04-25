from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.security import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message

router = APIRouter()


@router.get("")
async def list_conversations(
    user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    rows = (await session.execute(
        select(Conversation).where(Conversation.user_id == user["id"]).order_by(Conversation.updated_at.desc())
    )).scalars().all()
    return [{"id": str(c.id), "title": c.title, "agent": c.agent, "model": c.model,
             "updated_at": c.updated_at.isoformat()} for c in rows]


@router.get("/{conv_id}/messages")
async def get_messages(
    conv_id: UUID,
    user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    conv = await session.get(Conversation, conv_id)
    if not conv or conv.user_id != user["id"]:
        raise HTTPException(404, "Not found")
    rows = (await session.execute(
        select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    )).scalars().all()
    return [{"id": str(m.id), "role": m.role, "content": m.content,
             "agent": m.agent, "model": m.model, "created_at": m.created_at.isoformat()} for m in rows]


@router.delete("/{conv_id}")
async def delete_conversation(
    conv_id: UUID,
    user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    conv = await session.get(Conversation, conv_id)
    if not conv or conv.user_id != user["id"]:
        raise HTTPException(404, "Not found")
    await session.execute(delete(Conversation).where(Conversation.id == conv_id))
    await session.commit()
    return {"ok": True}
