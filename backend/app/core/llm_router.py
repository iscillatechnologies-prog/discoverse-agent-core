"""Unified LLM router. Defaults to Lovable AI Gateway (no per-provider keys needed)."""
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)

LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions"


class LLMRouter:
    """Routes a chat completion to the right provider based on the model name.

    Priority:
      1. If LOVABLE_API_KEY is set → use Lovable AI Gateway for ALL models
         (it natively supports google/* and openai/* model IDs).
      2. Otherwise fall back to direct provider SDKs (OpenAI/Gemini/Anthropic)
         using their respective API keys.
    """

    async def stream(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        # Prefer Lovable AI Gateway when key is present
        if settings.lovable_api_key:
            log.info("llm.stream.start", model=model, provider="lovable")
            async for chunk in self._lovable_stream(model, messages, temperature, max_tokens):
                yield chunk
            return

        provider = self._provider_for(model)
        log.info("llm.stream.start", model=model, provider=provider)

        if provider == "openai":
            async for chunk in self._openai_stream(model, messages, temperature, max_tokens):
                yield chunk
        elif provider == "gemini":
            async for chunk in self._gemini_stream(model, messages, temperature, max_tokens):
                yield chunk
        elif provider == "anthropic":
            async for chunk in self._anthropic_stream(model, messages, temperature, max_tokens):
                yield chunk
        else:
            raise ValueError(f"Unknown model: {model}")

    @staticmethod
    def _provider_for(model: str) -> str:
        m = model.lower()
        if m.startswith(("gpt", "o1", "o3", "openai/")):
            return "openai"
        if m.startswith(("gemini", "google/")):
            return "gemini"
        if m.startswith(("claude", "anthropic/")):
            return "anthropic"
        return "gemini"

    @staticmethod
    def _normalize_for_lovable(model: str) -> str:
        """Lovable AI gateway expects fully-qualified IDs like google/gemini-... or openai/gpt-..."""
        m = model.lower()
        if m.startswith(("google/", "openai/", "anthropic/")):
            return model
        if m.startswith("gemini"):
            return f"google/{model}"
        if m.startswith(("gpt", "o1", "o3")):
            return f"openai/{model}"
        if m.startswith("claude"):
            return f"anthropic/{model}"
        # Safe default
        return "google/gemini-3-flash-preview"

    async def _lovable_stream(
        self, model, messages, temperature, max_tokens
    ) -> AsyncIterator[str]:
        """Stream from the Lovable AI Gateway (OpenAI-compatible SSE)."""
        normalized = self._normalize_for_lovable(model)
        headers = {
            "Authorization": f"Bearer {settings.lovable_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": normalized,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
            async with client.stream("POST", LOVABLE_GATEWAY_URL, headers=headers, json=payload) as resp:
                if resp.status_code == 429:
                    yield "[Rate limited by Lovable AI — please wait a moment and retry.]"
                    return
                if resp.status_code == 402:
                    yield "[Lovable AI credits exhausted — top up at Settings → Workspace → Usage.]"
                    return
                if resp.status_code >= 400:
                    body = await resp.aread()
                    log.error("lovable.gateway.error", status=resp.status_code, body=body[:500])
                    yield f"[Lovable AI error {resp.status_code}]"
                    return

                buffer = ""
                async for chunk in resp.aiter_text():
                    buffer += chunk
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.rstrip("\r")
                        if not line or line.startswith(":"):
                            continue
                        if not line.startswith("data: "):
                            continue
                        data = line[6:].strip()
                        if data == "[DONE]":
                            return
                        try:
                            import json
                            obj = json.loads(data)
                            delta = obj.get("choices", [{}])[0].get("delta", {}).get("content")
                            if delta:
                                yield delta
                        except Exception:
                            continue

    async def _openai_stream(self, model, messages, temperature, max_tokens) -> AsyncIterator[str]:
        from openai import AsyncOpenAI
        if not settings.openai_api_key:
            yield "[OpenAI key not configured — set LOVABLE_API_KEY to use Lovable AI instead.]"
            return
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        stream = await client.chat.completions.create(
            model=model.replace("openai/", ""),
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        async for event in stream:
            delta = event.choices[0].delta.content if event.choices else None
            if delta:
                yield delta

    async def _gemini_stream(self, model, messages, temperature, max_tokens) -> AsyncIterator[str]:
        from google import genai
        if not settings.gemini_api_key:
            yield "[Gemini key not configured — set LOVABLE_API_KEY to use Lovable AI instead.]"
            return
        client = genai.Client(api_key=settings.gemini_api_key)
        contents: list[dict[str, Any]] = []
        sys_text = ""
        for m in messages:
            if m["role"] == "system":
                sys_text += m["content"] + "\n"
            else:
                role = "user" if m["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": m["content"]}]})
        if sys_text and contents:
            contents[0]["parts"][0]["text"] = sys_text + "\n" + contents[0]["parts"][0]["text"]

        clean = model.replace("google/", "")
        stream = client.models.generate_content_stream(
            model=clean,
            contents=contents,
            config={"temperature": temperature, "max_output_tokens": max_tokens},
        )
        for chunk in stream:
            if chunk.text:
                yield chunk.text

    async def _anthropic_stream(self, model, messages, temperature, max_tokens) -> AsyncIterator[str]:
        from anthropic import AsyncAnthropic
        if not settings.anthropic_api_key:
            yield "[Anthropic key not configured — set LOVABLE_API_KEY to use Lovable AI instead.]"
            return
        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        sys_text = "\n".join(m["content"] for m in messages if m["role"] == "system")
        chat = [m for m in messages if m["role"] != "system"]
        async with client.messages.stream(
            model=model.replace("anthropic/", ""),
            system=sys_text or "You are a helpful assistant.",
            messages=chat,
            max_tokens=max_tokens,
            temperature=temperature,
        ) as stream:
            async for text in stream.text_stream:
                yield text


router = LLMRouter()
