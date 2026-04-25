"""Discoverse AI — FastAPI entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.core.config import settings
from app.core.logging import configure_logging
from app.core.db import init_db, close_db
from app.api import auth, chat, conversations, memories, artifacts, health

configure_logging()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Discoverse AI",
    description="Multi-agent AI operating system by Rhinoes Innovation Labs",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(memories.router, prefix="/api/memories", tags=["memories"])
app.include_router(artifacts.router, prefix="/api/artifacts", tags=["artifacts"])

# Prometheus metrics at /metrics
app.mount("/metrics", make_asgi_app())
