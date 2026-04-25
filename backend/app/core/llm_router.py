"""Unified LLM router across OpenAI, Gemini, Anthropic with streaming."""
from collections.abc import AsyncIterator
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)


class LLMRouter:
    """Routes a chat completion to the right provider based on the model name."""

    async def stream(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
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
        # default
        return "gemini"

    async def _openai_stream(self, model, messages, temperature, max_tokens) -> AsyncIterator[str]:
        from openai import AsyncOpenAI
        if not settings.openai_api_key:
            yield "[OpenAI key not configured]"
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
            yield "[Gemini key not configured]"
            return
        client = genai.Client(api_key=settings.gemini_api_key)
        # Map OpenAI-style messages → Gemini contents
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
            yield "[Anthropic key not configured]"
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
