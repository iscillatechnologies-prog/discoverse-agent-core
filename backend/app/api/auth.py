"""Auth helper endpoints (JWT verification is handled by dependency injection elsewhere)."""
from typing import Annotated
from fastapi import APIRouter, Depends
from app.core.security import get_current_user

router = APIRouter()


@router.get("/me")
async def me(user: Annotated[dict, Depends(get_current_user)]):
    return user
