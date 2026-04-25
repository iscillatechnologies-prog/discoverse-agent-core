# Discoverse AI — Backend

Production-ready FastAPI backend for the Discoverse AI multi-agent platform by **Rhinoes Innovation Labs**.

## What's inside

- **FastAPI** API server with SSE streaming
- **Multi-agent orchestrator**: Research, Builder, Analyst, Personal Assistant
- **LLM Router**: OpenAI GPT-5, Google Gemini, Anthropic Claude
- **Tools**: Playwright web research, Docker code sandbox, PDF/CSV generators
- **Memory**: Postgres (long-term) + Redis (short-term) + Weaviate (vectors, optional)
- **Auth**: JWT shared with Lovable Cloud (Supabase) frontend
- **Ops**: Dockerfile, docker-compose, render.yaml, Prometheus metrics

## Deploy in 5 minutes (Render — easiest path)

See [`DEPLOY.md`](./DEPLOY.md) for full step-by-step instructions.

TL;DR:
1. Connect this Lovable project to GitHub (Connectors → GitHub → Connect).
2. Open https://dashboard.render.com → **New → Blueprint** → pick your repo → it auto-detects `backend/render.yaml`.
3. Paste your API keys (OpenAI / Gemini / Anthropic) when Render asks.
4. Click **Apply**. Done.

## Local dev

```bash
cd backend
cp .env.example .env   # fill in keys
docker compose up --build
```

API: http://localhost:8000 — Docs: http://localhost:8000/docs
