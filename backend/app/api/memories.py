from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.security import get_current_user
from app.models.memory import Memory
from app.tools.vector_memory import remember

router = APIRouter()


class MemoryIn(BaseModel):
    content: str
    kind: str = "fact"


@router.get("")
async def list_memories(
    user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    rows = (await session.execute(
        select(Memory).where(Memory.user_id == user["id"]).order_by(Memory.created_at.desc())
    )).scalars().all()
    return [{"id": str(m.id), "kind": m.kind, "content": m.content,
             "created_at": m.created_at.isoformat()} for m in rows]


@router.post("")
async def add_memory(
    body: MemoryIn,
    user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    m = Memory(user_id=user["id"], kind=body.kind, content=body.content)
    session.add(m)
    await session.commit()
    await session.refresh(m)
    await remember(user["id"], body.content, body.kind)
    return {"id": str(m.id)}


@router.delete("/{mem_id}")
async def delete_memory(
    mem_id: UUID,
    user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    m = await session.get(Memory, mem_id)
    if not m or m.user_id != user["id"]:
        raise HTTPException(404, "Not found")
    await session.execute(delete(Memory).where(Memory.id == mem_id))
    await session.commit()
    return {"ok": True}
